# Diseño: Página de Música

## Contexto

Cuarta sección del portafolio, inspirada en `/music` de [underground.kimu.moe](https://underground.kimu.moe/music). Replica la mecánica de la referencia (índice de playlists → detalle con tracks → enlaces a Spotify) adaptada a la paleta azul y las tipografías del sitio.

La referencia **no reproduce audio**: todo son enlaces a `open.spotify.com`. Esta spec mantiene esa decisión. Ella resuelve los datos server-side (SvelteKit + Spotify API); nosotros no tenemos servidor, así que los resolvemos en tiempo de sincronización.

## Stack

Sin cambios: HTML + CSS + JS vanilla, sitio estático. El script de sincronización corre en Node 18+ usando `fetch` nativo — **cero dependencias, sin `package.json`**.

## Arquitectura

Dos mitades acopladas únicamente por `data/playlists.json`.

### Mitad offline (manual, cuando se quiera actualizar)

```
scripts/sync-music.js
  ← lee  data/sources.txt   (una URL de playlist de Spotify por línea)
  ← lee  .env               (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET)
  → escribe data/playlists.json
  → descarga img/music/<slug>.jpg
```

Se ejecuta con `node scripts/sync-music.js`.

Autenticación por **Client Credentials**: `POST https://accounts.spotify.com/api/token` con `grant_type=client_credentials` y header `Authorization: Basic base64(id:secret)`. No requiere login de ningún usuario y basta para leer playlists públicas.

`.env` va al `.gitignore`. `data/playlists.json` e `img/music/` **sí** se versionan: son el output de build de un sitio estático.

### Vía manual (sin credenciales)

Alternativa a `sync-music.js` para quien no quiere crear una app de Spotify.
Escribe el mismo `data/playlists.json`, así que la página no distingue una de otra.

```
scripts/build-music.js
  ← lee  data/manual/<slug>.txt   (un archivo por playlist)
  → escribe data/playlists.json
```

Se ejecuta con `node scripts/build-music.js`. El slug sale del nombre del archivo.

Formato de cada `.txt`: directivas con `#` arriba, una canción por línea abajo.

```
# nombre: teenagers
# descripcion: lo que suena a las 3am
# url: https://open.spotify.com/playlist/69Vk...
# cover: img/music/teenagers.jpg
# orden: 1

Título de la canción - Artista
Otra canción - Otro artista
```

Decisiones del parser:

- Parte por el **último** separador ` - `, no el primero: los títulos llevan guiones
  mucho más seguido que los artistas. Sin eso, "Titulo con - guion - Artista" queda mal.
- Acepta guion normal, medio (–) y largo (—), y descarta numeración inicial (`3. `, `12) `).
- Sin URL propia por canción, la fila enlaza a la **búsqueda** de Spotify del título +
  artista. Es mejor destino que devolver al visitante a la playlist entera.
- Si la carátula declarada no existe en disco, avisa y deja `cover: null` en vez de
  romper la imagen en el navegador.

Las carátulas y los nombres reales se pueden obtener sin credenciales vía el endpoint
oEmbed de Spotify (`open.spotify.com/oembed?url=...`), que solo entrega título y
miniatura — nunca el listado de canciones. Ese listado exige token, y por eso la vía
manual obliga a transcribir a mano.

**Los dos scripts escriben el mismo archivo: gana el último que se corra.**

### Mitad online (el visitante)

`musica.html` hace `fetch('data/playlists.json')` y renderiza. Sin API, sin secretos, sin backend. Funciona en cualquier hosting estático.

## Formato de datos

### `data/sources.txt`

```
# una URL por línea, las líneas con # se ignoran
https://open.spotify.com/playlist/6EvqmFpfnC5L1ChxBBTmhj
https://open.spotify.com/playlist/...
```

### `data/playlists.json`

```json
{
  "generatedAt": "2026-08-13T14:02:11Z",
  "playlists": [
    {
      "slug": "underground",
      "name": "underground",
      "description": "lo que suena mientras programo",
      "cover": "img/music/underground.jpg",
      "url": "https://open.spotify.com/playlist/6Evq...",
      "trackCount": 236,
      "tracks": [
        {
          "name": "WONDER POP",
          "artist": "Moe Shop",
          "url": "https://open.spotify.com/track/2LJ..."
        }
      ]
    }
  ]
}
```

La descripción se toma de Spotify. Se edita **en Spotify** y se sincroniza sola: no hay archivo de overrides que mantener en paralelo.

El `slug` se deriva del nombre: minúsculas, sin tildes, no-alfanuméricos → `-`.

## Carátulas de canción

La lista de tracks de la referencia va sin arte. Aquí sí lleva, porque el CSV de
Exportify trae la columna de imagen del álbum y el dato sale gratis.

Dos decisiones:

**Tamaño.** Exportify entrega la imagen de 640x640 (~110 KB). El CDN de Spotify
codifica el tamaño en el prefijo del hash, así que `csv-to-manual.js` reescribe
`ab67616d0000b273` → `ab67616d00001e02` y baja la variante de 300x300 (~35 KB).
Es una convención del CDN, no una API documentada, así que una URL que no calce
con el patrón se deja intacta en vez de romperla.

300 es el mínimo que aguanta: las carátulas se muestran hasta 112 px y una fuente
de 64 px se vería lavada en pantallas retina. El precio son ~14 MB en el repo.
Para aligerarlo, cambiar `COVER_PREFIX` a `ab67616d00004851` (64x64, ~1,5 MB),
borrar `img/music/tracks/` y repetir la cadena.

**Locales, no enlazadas.** `scripts/fetch-covers.js` descarga las únicas a
`img/music/tracks/<hash>.jpg` — 367 archivos, 1,0 MB para 870 canciones. El sitio
queda autocontenido y no depende de que esa convención de prefijos siga vigente.
`build-music.js` usa la copia local cuando existe y la URL remota cuando no, así
que reconstruir nunca revierte el trabajo de `fetch-covers`.

Sin carátula (o si falla al cargar), la fila cae al tile con ícono de disco.

### Medidas, tomadas de la referencia

Sacadas de su CSS, no estimadas a ojo:

| | Referencia | Aquí |
|---|---|---|
| Fila de playlist | `height: 7rem` | igual (5.5rem en móvil) |
| Carátula de playlist | `height: 100%` de la fila | igual |
| Carátula de canción | `width: clamp(4rem, 10vw, 7rem)` | igual |
| Hover en fila de canción | solo cambia el color de fondo | igual |

**Fondo al pasar el mouse.** Solo en las filas del índice, como en la referencia.
Una segunda `<img>` absoluta que cubre la fila, `opacity: 0` → `0.2` en hover,
con `blur(2px)`. Va en `z-index: 1` con `pointer-events: none` para no robarle
el click al enlace; el contenido va en `z-index: 2`. La fila lleva
`position: relative` y `overflow: hidden` para recortarla.

Los títulos de canción se cortan con elipsis (`white-space: nowrap`) para que un
nombre largo no descuadre la fila.

### Sobre la carga diferida

Se probó un `IntersectionObserver` anclado a `.win-body` y se descartó. El motivo
que lo justificaba resultó ser un artefacto de medición, y tenía un modo de fallo
peor que lo que reemplazaba: si el observer no dispara, la imagen **nunca** recibe
`src`. Con carátulas locales de ~3 KB la optimización no paga su complejidad, así
que se asigna `src` directo y `loading="lazy"` queda como pista al navegador —
si la ignora, simplemente carga todo, que es un MB del mismo origen.

## Estructura de la página

Una sola `musica.html`. Reutiliza el andamiaje existente (`frame-overlay`, `crt-frame`, `crt-screen`, `scanlines`, `site-header`, `glitch-title`, `filesystem-nav`) y agrega:

```html
<div class="meta-bar">
  <span id="meta-left">Playlists: 3</span>
  <a id="meta-right" href="...">Perfil</a>
</div>

<div class="win-frame">
  <div class="win-titlebar">
    <span class="win-path" id="win-path">~/iPod</span>
    <span class="win-controls">- □ ×</span>
  </div>
  <div class="win-body" id="win-body"></div>
</div>
```

### Las dos vistas

Ambas escriben en el mismo `#win-body`. No hay páginas ni markup duplicado:

- `renderIndex()` — filas de playlist: carátula 64px + nombre + descripción.
- `renderPlaylist(slug)` — filas de track: título + artista. La primera fila es `..` (volver), como un directorio real.

Al entrar a una playlist mutan tres cosas:

| Elemento | Índice | Detalle |
|---|---|---|
| `win-path` | `~/iPod` | `~/iPod/underground` |
| `meta-left` | `Playlists: 3` | `Tracks: 236` |
| `meta-right` | link al perfil de Spotify | link a la playlist |

### Routing

Función `router()` que lee `?playlist=` de la URL y decide qué vista renderizar:

- Click en playlist → `history.pushState({}, '', '?playlist=underground')` + `router()`
- Botón atrás del navegador → evento `popstate` → `router()`
- Carga directa de `musica.html?playlist=underground` → entra derecho al detalle

URLs compartibles y botón atrás funcional, sin librería de routing.

El `×` del titlebar vuelve al índice. `-` y `□` son decorativos.

### Estados

- **Cargando:** `#win-body` arranca con `> cargando...` (el fetch es asíncrono).
- **Error:** si el fetch falla, mensaje explícito en la ventana, no una pantalla en blanco.

## Estilos nuevos

`body` tiene `overflow: hidden` y `.crt-frame` mide `100vh`: la pantalla no scrollea. El scroll vive **dentro** de la ventana:

```css
.win-frame { display: flex; flex-direction: column; min-height: 0; }
.win-body  { flex: 1; min-height: 0; overflow-y: auto; }
```

`min-height: 0` es obligatorio: sin él un hijo flex no se encoge por debajo de su contenido y el scroll nunca aparece.

Clases nuevas:

- `.meta-bar` — flex `space-between`, `VT323` atenuado. Texto plano sobre el fondo, no barra rellena (igual que la referencia).
- `.win-frame` — borde `--accent`, fondo oscuro translúcido.
- `.win-titlebar` — clonada de `.dos-header`: fondo `--accent`, texto negro, `Press Start 2P`.
- `.win-body` — scroll interno + `::-webkit-scrollbar` con thumb en `--accent` (evita la barra gris del sistema dentro del CRT).
- `.pl-row` / `.track-row` — filas. Hover con el mismo glow que ya usa `.nav-card` (borde `--accent` + `box-shadow`); se reutiliza ese idioma en vez de inventar otro.

Bump del cache-buster `?v=1.1` → `?v=1.2` en las cinco páginas.

## Manejo de errores del script

Casos reales que rompen la sincronización, manejados desde el inicio:

1. **Tracks `null`** — archivos locales y canciones eliminadas vuelven como `{ track: null }`. Se filtran.
2. **Podcasts** — un episodio no tiene `artists`. Se descarta todo item que no sea `type: "track"`.
3. **Playlist privada → 404** — el error más común; el mensaje de Spotify no lo explica. El script avisa: *"revisa que la playlist sea pública"*.
4. **Paginación** — 100 tracks por request; iterar `offset` hasta que `next` sea `null`.
5. **`.env` ausente o incompleto** — mensaje con las instrucciones para crear la app en el dashboard de Spotify.
6. **Carátulas** — las URLs de imagen de Spotify caducan; se descargan a `img/music/` en vez de hotlinkear.

## Archivos

```
musica.html                  nuevo
scripts/sync-music.js        nuevo
data/sources.txt             nuevo   (editado a mano)
data/playlists.json          nuevo   (generado, versionado)
img/music/*.jpg              nuevo   (generado, versionado)
.env                         nuevo   (local, ignorado por git)
.gitignore                   editado (+ .env)
css/style.css                editado (+ ~120 líneas)
index.html                   editado (nav: Música → musica.html, cache-buster)
about.html                   editado (nav + cache-buster)
proyectos.html               editado (nav + cache-buster)
contacto.html                editado (nav + cache-buster)
serve.js                     editado (MIME types para .json y .webp)
```

## Fuera de alcance

- Reproducción de audio. Spotify ya no entrega `preview_url` a apps nuevas, y el iframe embed rompe la estética CRT.
- Widget de "escuchando ahora" (requiere servicio externo o serverless).
- Virtualización de la lista de tracks. Con ~600 filas simples el DOM aguanta sin problema; se reevalúa si alguna playlist pasa de ~1000.
