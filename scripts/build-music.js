#!/usr/bin/env node
/**
 * Construye data/playlists.json a partir de los archivos de texto de
 * data/manual/. Es la vía MANUAL: no necesita credenciales de Spotify.
 *
 * Uso:  node scripts/build-music.js
 *
 * Alternativa automática: scripts/sync-music.js (requiere .env con
 * credenciales). Ambos escriben el mismo archivo — gana el último que corras.
 *
 * Formato de cada .txt en data/manual/ (el slug sale del nombre del archivo):
 *
 *   # nombre: teenagers
 *   # descripcion: lo que suena a las 3am
 *   # url: https://open.spotify.com/playlist/69Vk...
 *   # cover: img/music/teenagers.jpg
 *   # orden: 1
 *
 *   Título de la canción - Artista
 *   Otra canción - Otro artista
 *
 * Las líneas que empiezan con # son directivas o comentarios.
 * Las líneas en blanco se ignoran.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANUAL_DIR = path.join(ROOT, 'data', 'manual');
const OUT_FILE = path.join(ROOT, 'data', 'playlists.json');

const DIRECTIVES = ['nombre', 'descripcion', 'url', 'cover', 'orden'];

function die(msg) {
  console.error(`\n  ERROR: ${msg}\n`);
  process.exit(1);
}

/** Separa "Título - Artista" tolerando guion normal, medio y largo. */
function splitTrack(line) {
  // Campos extra opcionales separados por | al final de la línea, puestos por
  // csv-to-manual. Se reconocen por su patrón, no por su posición:
  //   .../track/... → enlace a la canción   |   cualquier otra URL → carátula
  //
  // Se consumen SOLO desde el final y solo si parecen URL, para que un título
  // que contenga "|" no se parta por la mitad.
  let url = null;
  let cover = null;

  const parts = line.split('|').map((p) => p.trim());
  const extras = [];
  while (parts.length > 1 && /^https?:\/\//.test(parts[parts.length - 1])) {
    extras.unshift(parts.pop());
  }
  line = parts.join('|').trim();

  extras.forEach((extra) => {
    if (/open\.spotify\.com\/track\//.test(extra)) url = extra;
    else cover = extra;
  });

  // quita numeración tipo "1. " o "12 - " al inicio
  const clean = line.replace(/^\s*\d+\s*[.)]\s+/, '');

  // grupo codicioso: parte por el ÚLTIMO separador, porque los
  // títulos llevan guiones mucho más seguido que los artistas
  const match = clean.match(/^(.*)\s+[-–—]\s+(.*)$/);
  if (match) {
    return { name: match[1].trim(), artist: match[2].trim(), url, cover };
  }
  // sin separador: toda la línea es el título
  return { name: clean.trim(), artist: '', url, cover };
}

/**
 * Si fetch-covers ya bajó la carátula, se usa la copia local. Así reconstruir
 * no revierte a la URL remota, y quien no haya corrido fetch-covers sigue
 * viendo las imágenes desde el CDN.
 */
const TRACKS_DIR = path.join(ROOT, 'img', 'music', 'tracks');

function localCover(url) {
  if (!url || !/^https?:\/\//.test(url)) return url;
  const nombre = String(url).split('/').pop();
  if (!/^[A-Za-z0-9]+$/.test(nombre)) return url;
  const rel = 'img/music/tracks/' + nombre + '.jpg';
  return fs.existsSync(path.join(TRACKS_DIR, nombre + '.jpg')) ? rel : url;
}

/** Sin URL propia, la fila lleva a la búsqueda de Spotify: mejor que nada. */
function searchUrl(track) {
  const query = [track.name, track.artist].filter(Boolean).join(' ');
  return 'https://open.spotify.com/search/' + encodeURIComponent(query);
}

function parseFile(filename) {
  const slug = path.basename(filename, '.txt');
  const raw = fs.readFileSync(path.join(MANUAL_DIR, filename), 'utf8');

  const meta = {};
  const tracks = [];

  raw.split('\n').forEach(function (rawLine, index) {
    const line = rawLine.trim();
    if (!line) return;

    if (line.startsWith('#')) {
      const body = line.slice(1).trim();
      const colon = body.indexOf(':');
      if (colon === -1) return; // comentario suelto

      const key = body.slice(0, colon).trim().toLowerCase();
      if (!DIRECTIVES.includes(key)) return; // comentario con dos puntos
      meta[key] = body.slice(colon + 1).trim();
      return;
    }

    const track = splitTrack(line);
    if (!track.name) return;
    if (!track.artist) {
      console.warn(
        `  ! ${filename}:${index + 1} sin artista — usa "Título - Artista"`
      );
      track.artist = 'Desconocido';
    }
    tracks.push({
      name: track.name,
      artist: track.artist,
      url: track.url || searchUrl(track),
      cover: localCover(track.cover) || null
    });
  });

  if (!meta.nombre) {
    die(`${filename} no tiene "# nombre:". Es obligatorio.`);
  }

  // avisa si la carátula declarada no existe, en vez de fallar en el navegador
  if (meta.cover && !fs.existsSync(path.join(ROOT, meta.cover))) {
    console.warn(`  ! ${filename}: no encuentro ${meta.cover}`);
    meta.cover = null;
  }

  return {
    slug,
    name: meta.nombre,
    description: meta.descripcion || '',
    cover: meta.cover || null,
    url: meta.url || 'https://open.spotify.com/',
    trackCount: tracks.length,
    tracks,
    _orden: Number(meta.orden) || 999
  };
}

function main() {
  let files;
  try {
    files = fs.readdirSync(MANUAL_DIR).filter((f) => f.endsWith('.txt'));
  } catch {
    die('no encuentro la carpeta data/manual/.');
  }

  if (files.length === 0) {
    die('no hay ningún .txt en data/manual/.');
  }

  const playlists = files.map(parseFile);

  playlists.sort(function (a, b) {
    if (a._orden !== b._orden) return a._orden - b._orden;
    return a.slug.localeCompare(b.slug);
  });
  playlists.forEach(function (p) { delete p._orden; });

  const output = {
    generatedAt: new Date().toISOString(),
    playlists
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf8');

  const total = playlists.reduce((sum, p) => sum + p.trackCount, 0);
  playlists.forEach(function (p) {
    console.log(`  ✓ ${p.name} — ${p.trackCount} tracks`);
  });
  console.log(`\n  Listo: ${playlists.length} playlist(s), ${total} tracks → data/playlists.json`);
}

main();
