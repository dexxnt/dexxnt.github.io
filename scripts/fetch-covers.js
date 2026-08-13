#!/usr/bin/env node
/**
 * Descarga a img/music/tracks/ las carátulas de canción que todavía apuntan al
 * CDN de Spotify, para que el sitio no dependa de un servicio externo.
 *
 * Uso:  node scripts/fetch-covers.js
 *
 * Es idempotente: salta las que ya estén en disco, así que se puede volver a
 * correr sin coste. Después basta con `node scripts/build-music.js`, que usa
 * el archivo local automáticamente cuando existe.
 */

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'playlists.json');
const COVERS_DIR = path.join(ROOT, 'img', 'music', 'tracks');

const CONCURRENCIA = 8;

function die(msg) {
  console.error(`\n  ERROR: ${msg}\n`);
  process.exit(1);
}

/** El último tramo de la URL es un hash único: sirve tal cual de nombre. */
function nombreLocal(url) {
  const last = String(url).split('/').pop();
  return /^[A-Za-z0-9]+$/.test(last) ? last + '.jpg' : null;
}

async function descargar(url, destino) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0) throw new Error('respuesta vacía');
  // FF D8 FF = cabecera JPEG; evita guardar una página de error como .jpg
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error('no es un JPEG');

  await fsp.writeFile(destino, buffer);
  return buffer.length;
}

async function main() {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    die('no puedo leer data/playlists.json. Corre antes: node scripts/build-music.js');
  }

  const remotas = new Set();
  (data.playlists || []).forEach((p) => {
    (p.tracks || []).forEach((t) => {
      if (t.cover && /^https?:\/\//.test(t.cover)) remotas.add(t.cover);
    });
  });

  if (remotas.size === 0) {
    console.log('  No hay carátulas remotas: ya está todo local.');
    return;
  }

  await fsp.mkdir(COVERS_DIR, { recursive: true });

  const pendientes = [];
  let yaEstaban = 0;

  for (const url of remotas) {
    const nombre = nombreLocal(url);
    if (!nombre) {
      console.warn(`  ! no sé cómo nombrar ${url}`);
      continue;
    }
    if (fs.existsSync(path.join(COVERS_DIR, nombre))) { yaEstaban++; continue; }
    pendientes.push({ url, destino: path.join(COVERS_DIR, nombre) });
  }

  console.log(`  ${remotas.size} carátulas únicas | ${yaEstaban} ya en disco | ${pendientes.length} por bajar\n`);

  if (pendientes.length === 0) {
    console.log('  Nada que hacer. Corre: node scripts/build-music.js');
    return;
  }

  let hechas = 0;
  let bytes = 0;
  const fallidas = [];

  // pool simple: CONCURRENCIA trabajadores consumiendo de la misma cola
  async function trabajador() {
    while (pendientes.length > 0) {
      const item = pendientes.pop();
      try {
        // ojo: `bytes += await ...` lee bytes ANTES de esperar, así que con
        // varios trabajadores en paralelo las sumas se pisan. Primero resolver.
        const n = await descargar(item.url, item.destino);
        bytes += n;
        hechas++;
        if (hechas % 50 === 0) process.stdout.write(`  ${hechas} descargadas...\n`);
      } catch (err) {
        fallidas.push(`${item.url} → ${err.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCIA }, trabajador));

  console.log(`\n  ✓ ${hechas} descargadas (${(bytes / 1024 / 1024).toFixed(1)} MB) → img/music/tracks/`);

  if (fallidas.length > 0) {
    console.log(`  ! ${fallidas.length} fallaron (esas seguirán enlazando al CDN):`);
    fallidas.slice(0, 5).forEach((f) => console.log('    ' + f));
    if (fallidas.length > 5) console.log(`    ...y ${fallidas.length - 5} más`);
  }

  console.log('\n  Ahora corre: node scripts/build-music.js');
}

main().catch((err) => die(err.message));
