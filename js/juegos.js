(function () {
  const DATA_URL = 'data/juegos.txt';

  const winBody = document.getElementById('win-body');
  const metaLeft = document.getElementById('meta-left');

  /**
   * Plataformas con ícono propio en Font Awesome. Cualquier otra cosa que
   * escribas en el .txt cae al mando genérico, así que el archivo acepta
   * "Game Boy Advance" o lo que sea sin romperse.
   */
  const ICONOS = {
    pc: 'fa-brands fa-windows',
    windows: 'fa-brands fa-windows',
    steam: 'fa-brands fa-steam',
    playstation: 'fa-brands fa-playstation',
    ps1: 'fa-brands fa-playstation',
    ps2: 'fa-brands fa-playstation',
    ps3: 'fa-brands fa-playstation',
    ps4: 'fa-brands fa-playstation',
    ps5: 'fa-brands fa-playstation',
    psvita: 'fa-brands fa-playstation',
    vita: 'fa-brands fa-playstation',
    xbox: 'fa-brands fa-xbox',
    android: 'fa-brands fa-android',
    ios: 'fa-brands fa-apple',
    mac: 'fa-brands fa-apple',
    'itch.io': 'fa-brands fa-itch-io',
    itch: 'fa-brands fa-itch-io'
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function iconoDe(plataforma) {
    const p = plataforma.trim().toLowerCase();
    if (ICONOS[p]) return ICONOS[p];

    // Coincidencia parcial para textos combinados tipo "PS2 y PCSX2".
    // De más larga a más corta, para que "ps2" gane antes que "pc".
    const clave = Object.keys(ICONOS)
      .sort((a, b) => b.length - a.length)
      .find((k) => p.includes(k));

    return clave ? ICONOS[clave] : 'fa-solid fa-gamepad';
  }

  /** Una línea: "Nombre | Plataforma | imagen". Los dos últimos son opcionales. */
  function parseLinea(linea) {
    const partes = linea.split('|').map((p) => p.trim());
    if (!partes[0]) return null;
    return {
      nombre: partes[0],
      plataforma: partes[1] || '',
      imagen: partes[2] || ''
    };
  }

  function parse(texto) {
    return texto
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map(parseLinea)
      .filter(Boolean);
  }

  /** Portada con fallback: sin imagen, o si falla, un tile con mando. */
  function buildCover(juego) {
    const fallback = el('div', 'game-cover game-cover-empty');
    fallback.appendChild(el('i', 'fa-solid fa-gamepad'));

    if (!juego.imagen) return fallback;

    const img = el('img', 'game-cover');
    img.src = juego.imagen;
    img.alt = '';
    img.loading = 'lazy';
    img.addEventListener('error', () => img.replaceWith(fallback));
    return img;
  }

  function render(juegos) {
    metaLeft.textContent = 'Juegos: ' + juegos.length;

    if (juegos.length === 0) {
      winBody.replaceChildren(el('p', 'win-status', '> todavía no has añadido juegos'));
      return;
    }

    const frag = document.createDocumentFragment();

    juegos.forEach(function (juego) {
      const fila = el('div', 'game-row');

      const info = el('div', 'game-info');
      info.appendChild(buildCover(juego));
      info.appendChild(el('span', 'game-name', juego.nombre));

      fila.appendChild(info);

      if (juego.plataforma) {
        const plat = el('div', 'game-platform');
        plat.appendChild(el('i', iconoDe(juego.plataforma)));
        plat.appendChild(el('span', null, juego.plataforma));
        fila.appendChild(plat);
      }

      frag.appendChild(fila);
    });

    winBody.replaceChildren(frag);
  }

  fetch(DATA_URL)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function (texto) {
      render(parse(texto));
    })
    .catch(function () {
      metaLeft.textContent = 'Juegos: --';
      winBody.replaceChildren(el('p', 'win-status', '> error: no se pudo leer data/juegos.txt'));
    });
})();
