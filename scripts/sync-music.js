#!/usr/bin/env node
/**
 * Sincroniza las playlists de Spotify listadas en data/sources.txt
 * hacia data/playlists.json, y descarga las carátulas a img/music/.
 *
 * Uso:  node scripts/sync-music.js
 *
 * Requiere Node 18+ (fetch nativo) y un .env en la raíz con:
 *   SPOTIFY_CLIENT_ID=...
 *   SPOTIFY_CLIENT_SECRET=...
 */

const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');
const SOURCES_FILE = path.join(ROOT, 'data', 'sources.txt');
const OUT_FILE = path.join(ROOT, 'data', 'playlists.json');
const COVERS_DIR = path.join(ROOT, 'img', 'music');

const API = 'https://api.spotify.com/v1';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

// ---------------------------------------------------------------- utilidades

function die(msg) {
  console.error(`\n  ERROR: ${msg}\n`);
  process.exit(1);
}

function log(msg) {
  console.log(`  ${msg}`);
}

/** Parser mínimo de .env — sin dependencias. */
async function loadEnv() {
  let raw;
  try {
    raw = await fs.readFile(ENV_FILE, 'utf8');
  } catch {
    die(
      'no encuentro el archivo .env en la raíz del proyecto.\n\n' +
      '  Copia .env.example a .env y rellena tus credenciales.\n' +
      '  Se sacan gratis en https://developer.spotify.com/dashboard → Create app.'
    );
  }

  const env = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // quita comillas envolventes si las hay
    if (/^(".*"|'.*')$/.test(value)) value = value.slice(1, -1);
    env[key] = value;
  }

  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
    die('el .env existe pero le falta SPOTIFY_CLIENT_ID o SPOTIFY_CLIENT_SECRET.');
  }
  return env;
}

/** minúsculas, sin tildes, no-alfanuméricos → guiones */
function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'playlist';
}

/** Acepta URL completa, URI spotify: o el ID pelado. */
function parsePlaylistId(input) {
  const byUrl = input.match(/playlist\/([A-Za-z0-9]+)/);
  if (byUrl) return byUrl[1];
  const byUri = input.match(/^spotify:playlist:([A-Za-z0-9]+)$/);
  if (byUri) return byUri[1];
  if (/^[A-Za-z0-9]{22}$/.test(input)) return input;
  return null;
}

// ------------------------------------------------------------------- Spotify

async function getToken({ SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET }) {
  const basic = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!res.ok) {
    die(
      `Spotify rechazó las credenciales (HTTP ${res.status}).\n` +
      '  Revisa SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en tu .env.'
    );
  }
  return (await res.json()).access_token;
}

async function api(endpoint, token) {
  const res = await fetch(`${API}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 404) {
    throw new Error(
      'la API devolvió 404. Casi siempre significa que la playlist es privada — ' +
      'revisa que esté en público en Spotify.'
    );
  }
  if (res.status === 429) {
    throw new Error(
      `rate limit de Spotify. Espera ${res.headers.get('retry-after') || '30'}s y reintenta.`
    );
  }
  if (!res.ok) {
    throw new Error(`la API devolvió HTTP ${res.status}.`);
  }
  return res.json();
}

/** La API pagina de 100 en 100: hay que seguir hasta que `next` sea null. */
async function fetchAllTracks(playlistId, token) {
  const tracks = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await api(
      `/playlists/${playlistId}/tracks?limit=100&offset=${offset}` +
      `&fields=next,items(track(name,type,external_urls.spotify,artists(name)))`,
      token
    );

    for (const item of page.items) {
      const track = item.track;
      // canciones eliminadas y archivos locales vuelven como null
      if (!track) continue;
      // los episodios de podcast no tienen artists
      if (track.type !== 'track') continue;

      tracks.push({
        name: track.name,
        artist: (track.artists || []).map((a) => a.name).join(', ') || 'Desconocido',
        url: track.external_urls?.spotify || null
      });
    }

    hasMore = Boolean(page.next);
    offset += 100;
  }

  return tracks;
}

/** Las URLs de imagen de Spotify caducan: las bajamos en vez de hotlinkear. */
async function downloadCover(url, slug) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const filename = `${slug}.jpg`;
    await fs.writeFile(path.join(COVERS_DIR, filename), buffer);
    return `img/music/${filename}`;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------- main

async function readSources() {
  let raw;
  try {
    raw = await fs.readFile(SOURCES_FILE, 'utf8');
  } catch {
    die('no encuentro data/sources.txt.');
  }

  const urls = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  if (urls.length === 0) {
    die(
      'data/sources.txt está vacío.\n' +
      '  Pega una URL de playlist de Spotify por línea.'
    );
  }
  return urls;
}

async function main() {
  const env = await loadEnv();
  const sources = await readSources();

  log(`Leyendo ${sources.length} playlist(s) de data/sources.txt`);
  const token = await getToken(env);

  await fs.mkdir(COVERS_DIR, { recursive: true });

  const playlists = [];
  const usedSlugs = new Set();

  for (const source of sources) {
    const id = parsePlaylistId(source);
    if (!id) {
      console.warn(`  ! omitida: no reconozco "${source}" como playlist de Spotify`);
      continue;
    }

    try {
      const meta = await api(
        `/playlists/${id}?fields=name,description,external_urls.spotify,images`,
        token
      );

      let slug = slugify(meta.name);
      // dos playlists con el mismo nombre no pueden pisarse la carátula
      let n = 2;
      while (usedSlugs.has(slug)) slug = `${slugify(meta.name)}-${n++}`;
      usedSlugs.add(slug);

      const tracks = await fetchAllTracks(id, token);
      const cover = await downloadCover(meta.images?.[0]?.url, slug);

      playlists.push({
        slug,
        name: meta.name,
        // la descripción de Spotify viene con entidades HTML escapadas
        description: (meta.description || '')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&amp;/g, '&'),
        cover,
        url: meta.external_urls?.spotify || source,
        trackCount: tracks.length,
        tracks
      });

      log(`✓ ${meta.name} — ${tracks.length} tracks${cover ? '' : ' (sin carátula)'}`);
    } catch (err) {
      console.warn(`  ! omitida ${id}: ${err.message}`);
    }
  }

  if (playlists.length === 0) {
    die('no se pudo sincronizar ninguna playlist.');
  }

  const output = {
    generatedAt: new Date().toISOString(),
    playlists
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf8');

  const total = playlists.reduce((sum, p) => sum + p.trackCount, 0);
  log(`\n  Listo: ${playlists.length} playlist(s), ${total} tracks → data/playlists.json`);
}

main().catch((err) => die(err.message));
