(function () {
  const DATA_URL = 'data/playlists.json';

  // Tu perfil de Spotify — es el link "Perfil" de la esquina superior derecha.
  const SPOTIFY_PROFILE = 'https://open.spotify.com/';

  const winBody = document.getElementById('win-body');
  const winPath = document.getElementById('win-path');
  const winClose = document.getElementById('win-close');
  const metaLeft = document.getElementById('meta-left');
  const metaRight = document.getElementById('meta-right');

  let playlists = [];
  let isSample = false;

  // --------------------------------------------------------------- utilidades

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function status(message) {
    winBody.replaceChildren(el('p', 'win-status', message));
  }

  /** Deja que el navegador maneje ctrl/cmd/shift+click y el click con rueda. */
  function isPlainClick(event) {
    return (
      event.button === 0 &&
      !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
    );
  }

  /**
   * Carátula con fallback: sin imagen, o si falla al cargar, dibuja un tile
   * con el ícono de disco. Sirve para playlists y para canciones.
   */
  function buildCover(item, className) {
    const fallback = el('div', className + ' ' + className + '-empty');
    fallback.appendChild(el('i', 'fa-solid fa-compact-disc'));

    if (!item.cover) return fallback;

    const img = el('img', className);
    img.src = item.cover;
    img.alt = '';
    // Pista al navegador, no un requisito: las carátulas son locales y pesan
    // ~3 KB, así que si decide cargarlas todas tampoco pasa nada.
    img.loading = 'lazy';
    img.addEventListener('error', () => img.replaceWith(fallback));
    return img;
  }

  // ------------------------------------------------------------------ vistas

  function renderIndex() {
    winPath.textContent = '~/iPod';
    metaLeft.textContent = isSample
      ? `Playlists: ${playlists.length} (datos de ejemplo)`
      : `Playlists: ${playlists.length}`;
    metaRight.textContent = 'Perfil';
    metaRight.href = SPOTIFY_PROFILE;
    winClose.disabled = true;

    if (playlists.length === 0) {
      status('> no hay playlists todavía');
      return;
    }

    const frag = document.createDocumentFragment();

    playlists.forEach(function (playlist) {
      const row = el('a', 'pl-row');
      row.href = '?playlist=' + encodeURIComponent(playlist.slug);

      const info = el('div', 'pl-info');
      info.appendChild(el('span', 'pl-name', playlist.name));
      if (playlist.description) {
        info.appendChild(el('span', 'pl-desc', playlist.description));
      }

      // capa de fondo que asoma en hover; solo si hay carátula que mostrar
      if (playlist.cover) {
        const fill = el('img', 'pl-fill');
        fill.src = playlist.cover;
        fill.alt = '';
        fill.loading = 'lazy';
        row.appendChild(fill);
      }

      row.appendChild(buildCover(playlist, 'pl-cover'));
      row.appendChild(info);
      row.appendChild(el('span', 'pl-count', playlist.trackCount + ' tracks'));

      row.addEventListener('click', function (event) {
        if (!isPlainClick(event)) return;
        event.preventDefault();
        navigate(playlist.slug);
      });

      frag.appendChild(row);
    });

    winBody.replaceChildren(frag);
    winBody.scrollTop = 0;
  }

  function renderPlaylist(slug) {
    const playlist = playlists.find(function (p) { return p.slug === slug; });

    // slug inventado en la URL: caemos al índice en vez de mostrar vacío
    if (!playlist) {
      history.replaceState({}, '', location.pathname);
      renderIndex();
      return;
    }

    winPath.textContent = '~/iPod/' + playlist.slug;
    metaLeft.textContent = 'Tracks: ' + playlist.trackCount;
    metaRight.textContent = 'Abrir en Spotify';
    metaRight.href = playlist.url;
    winClose.disabled = false;

    const frag = document.createDocumentFragment();

    // primera fila: subir un nivel, como en un directorio de verdad
    const up = el('a', 'track-row track-up');
    up.href = location.pathname;
    up.appendChild(el('span', 'track-name', '..'));
    up.addEventListener('click', function (event) {
      if (!isPlainClick(event)) return;
      event.preventDefault();
      navigate(null);
    });
    frag.appendChild(up);

    if (playlist.tracks.length === 0) {
      frag.appendChild(el('p', 'win-status', '> playlist vacía'));
    }

    playlist.tracks.forEach(function (track) {
      const row = el('a', 'track-row');
      row.href = track.url || playlist.url;
      row.target = '_blank';
      row.rel = 'noopener';

      const info = el('div', 'track-info');
      info.appendChild(el('span', 'track-name', track.name));
      info.appendChild(el('span', 'track-artist', track.artist));

      row.appendChild(buildCover(track, 'track-cover'));
      row.appendChild(info);
      frag.appendChild(row);
    });

    winBody.replaceChildren(frag);
    winBody.scrollTop = 0;
  }

  // ----------------------------------------------------------------- routing

  function navigate(slug) {
    const url = slug
      ? location.pathname + '?playlist=' + encodeURIComponent(slug)
      : location.pathname;
    history.pushState({}, '', url);
    router();
  }

  function router() {
    const slug = new URLSearchParams(location.search).get('playlist');
    if (slug) renderPlaylist(slug);
    else renderIndex();
  }

  window.addEventListener('popstate', router);

  winClose.addEventListener('click', function () {
    if (!winClose.disabled) navigate(null);
  });

  // ------------------------------------------------------------------- carga

  fetch(DATA_URL)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      playlists = data.playlists || [];
      isSample = data.sample === true;
      router();
    })
    .catch(function () {
      winPath.textContent = '~/iPod';
      metaLeft.textContent = 'Playlists: --';
      status('> error: no se pudo leer data/playlists.json');
    });
})();
