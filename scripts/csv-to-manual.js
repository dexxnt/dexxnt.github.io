#!/usr/bin/env node
/**
 * Convierte un CSV de Exportify (https://exportify.app) en el formato de
 * texto de data/manual/<slug>.txt, conservando las directivas # de arriba.
 *
 * Uso:  node scripts/csv-to-manual.js <archivo.csv> <slug>
 * Ej.:  node scripts/csv-to-manual.js ~/Downloads/teenagers.csv teenagers
 *
 * Después:  node scripts/build-music.js
 *
 * Usa las columnas "Track Name", "Artist Name(s)" y "Track URI". Esta última
 * permite enlazar cada canción directo a Spotify en vez de a una búsqueda.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANUAL_DIR = path.join(ROOT, 'data', 'manual');

/**
 * Exportify traduce los encabezados del CSV al idioma de su interfaz, así que
 * hay que reconocerlos en los 12 idiomas que soporta. Sacados de su repo:
 * src/i18n/locales/<lang>/translation.json
 */
const COLUMNS = {
  name: [
    'Track Name', 'Nombre de la canción', 'Track-Name', 'Nom du titre',
    'Nome della traccia', 'Nome da faixa', 'Nummernaam', 'Låtens namn',
    'Parça Adı', 'Όνομα κομματιού', 'トラック名', 'اسم الأغنية'
  ],
  artist: [
    'Artist Name(s)', 'Nombre(s) del artista', 'Künstlername(n)',
    "Nom(s) de l'artiste", "Nome dell'artista", 'Nome(s) do artista',
    'Naam van artiest', 'Artistens namn', 'Sanatçı Adı',
    'Όνομα/τα καλλιτέχνη', 'アーティスト名', 'أسماء الفنانين'
  ],
  image: [
    'Album Image URL', 'URL de la imagen del álbum', 'Album-Bild-URL',
    "URL de l'image de l'album", "URL dell'immagine dell'album",
    'URL da imagem do álbum', 'Album afbeelding-URL', 'Albumets bild-URL',
    "Albüm Resim URL'si", 'URL εικόνας άλμπουμ', 'アルバム画像URL',
    'رابط صورة الألبوم'
  ],
  uri: [
    'Track URI', 'URI de la canción', 'Track-URI', 'URI du titre',
    'URI della traccia', 'URI da faixa', 'Nummer URI', 'Låtens URI',
    'Parça URI', 'URI κομματιού', 'トラックURI', 'رابط الأغنية (URI)'
  ]
};

/** Busca una columna probando todas las etiquetas conocidas. */
function findColumn(header, labels) {
  for (const label of labels) {
    const i = header.indexOf(label);
    if (i !== -1) return i;
  }
  return -1;
}

function die(msg) {
  console.error(`\n  ERROR: ${msg}\n`);
  process.exit(1);
}

/**
 * Parser CSV según RFC 4180: campos entre comillas pueden contener comas,
 * saltos de línea y comillas escapadas como "".
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  // normaliza CRLF para no arrastrar \r al final de cada fila
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < src.length; i++) {
    const char = src[i];

    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') inQuotes = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += char;
  }

  // última fila si el archivo no termina en salto de línea
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }

  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/**
 * Exportify entrega la carátula de 640x640 (~110 KB). Se muestra a 40 px, así
 * que pedimos la variante de 64x64 (~3 KB): 34 veces menos peso.
 *
 * El tamaño va codificado en el prefijo del hash. Es una convención del CDN de
 * Spotify, no una API documentada, así que si la URL no calza con el patrón
 * esperado se deja intacta en vez de romperla.
 */
const COVER_640 = /^(https:\/\/i\.scdn\.co\/image\/)ab67616d0000b273([A-Za-z0-9]+)$/;

/**
 * Tamaño de carátula a usar. El CDN de Spotify solo ofrece estos tres:
 *   ab67616d0000b273 → 640x640 (~110 KB)
 *   ab67616d00001e02 → 300x300 (~35 KB)   ← el que usamos
 *   ab67616d00004851 →  64x64  (~3 KB)
 *
 * Se muestran hasta 112 px (7rem), así que 300 es el mínimo que aguanta sin
 * verse lavado en pantallas retina. Para aligerar el repo se puede cambiar a
 * 4851, borrar img/music/tracks/ y volver a correr la cadena.
 */
const COVER_PREFIX = 'ab67616d00001e02';

function smallCover(url) {
  const match = String(url).match(COVER_640);
  return match ? match[1] + COVER_PREFIX + match[2] : url;
}

function trackUrl(uri) {
  const match = String(uri).match(/^spotify:track:([A-Za-z0-9]+)$/);
  return match ? 'https://open.spotify.com/track/' + match[1] : null;
}

function main() {
  const [csvPath, slug] = process.argv.slice(2);

  if (!csvPath || !slug) {
    die('faltan argumentos.\n\n  Uso: node scripts/csv-to-manual.js <archivo.csv> <slug>');
  }

  let raw;
  try {
    raw = fs.readFileSync(csvPath, 'utf8');
  } catch {
    die(`no puedo leer ${csvPath}`);
  }

  const rows = parseCsv(raw);
  if (rows.length < 2) die('el CSV no tiene filas de datos.');

  const header = rows[0].map((h) => h.trim());
  const iName = findColumn(header, COLUMNS.name);
  const iArtist = findColumn(header, COLUMNS.artist);
  const iUri = findColumn(header, COLUMNS.uri);
  const iImage = findColumn(header, COLUMNS.image);

  if (iName === -1 || iArtist === -1) {
    die(
      'no reconozco las columnas de título y artista en ningún idioma.\n' +
      `  Encabezados leídos: ${header.join(' | ')}\n` +
      '  ¿Seguro que es un CSV de Exportify?'
    );
  }

  const lines = [];
  let sinUrl = 0;

  rows.slice(1).forEach((row) => {
    const name = (row[iName] || '').trim();
    const artist = (row[iArtist] || '').trim();
    if (!name) return; // episodios y filas vacías

    const url = iUri === -1 ? null : trackUrl(row[iUri]);
    if (!url) sinUrl++;

    // el título va primero; build-music parte por el último " - "
    const raw = iImage === -1 ? '' : (row[iImage] || '').trim();
    const cover = raw ? smallCover(raw) : '';
    // campos extra separados por |, cada uno reconocido por su patrón
    const extras = [url, cover].filter(Boolean).map((u) => ' | ' + u).join('');
    lines.push(`${name} - ${artist || 'Desconocido'}${extras}`);
  });

  if (lines.length === 0) die('no encontré ninguna canción en el CSV.');

  const target = path.join(MANUAL_DIR, slug + '.txt');
  let head = '';

  if (fs.existsSync(target)) {
    // conserva el bloque de directivas y comentarios de arriba
    const existing = fs.readFileSync(target, 'utf8').split('\n');
    const firstTrack = existing.findIndex(
      (l) => l.trim() && !l.trim().startsWith('#')
    );
    const headLines = firstTrack === -1 ? existing : existing.slice(0, firstTrack);
    head = headLines.join('\n').replace(/\n+$/, '') + '\n\n';
  } else {
    console.warn(`  ! ${slug}.txt no existía: lo creo con directivas vacías`);
    head = `# nombre: ${slug}\n# descripcion:\n# url:\n# cover:\n\n`;
  }

  fs.writeFileSync(target, head + lines.join('\n') + '\n', 'utf8');

  console.log(`  ✓ ${lines.length} canciones → data/manual/${slug}.txt`);
  if (sinUrl > 0) {
    console.log(`    (${sinUrl} sin enlace directo; enlazarán a la búsqueda de Spotify)`);
  }
  console.log('\n  Ahora corre: node scripts/build-music.js');
}

main();
