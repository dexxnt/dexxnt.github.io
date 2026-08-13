# Diseño: Página de Jueguitos

## Contexto

Quinta sección del portafolio, inspirada en `/games` de
[underground.kimu.moe](https://underground.kimu.moe/games).

Su implementación resultó ser mucho más simple que la de música: los 21 juegos
están escritos a mano dentro del componente Svelte, con las imágenes importadas
de una carpeta local. Sin API, sin JSON, sin sincronización, sin sub-páginas.
Es una lista plana, y su recurso visual es un borde izquierdo de color según
el tier (S dorado, A gris, B texto normal).

## Diferencias con la referencia

Decisión del usuario: **sin tiers**. La lista va en el orden que él defina, y
cada fila muestra imagen, nombre y **plataforma** — un dato que la referencia
no tiene.

## Stack

Sin cambios: HTML + CSS + JS vanilla.

## Sin build step

A diferencia de la música, aquí los datos se escriben enteros a mano: no vienen
de ningún CSV ni API. Por eso **no hay script**. `juegos.html` hace `fetch` de
`data/juegos.txt` y lo parsea en el navegador. Se edita el archivo, se recarga,
y ya.

El archivo **no** puede vivir en `data/manual/`: `build-music.js` hace glob de
todos los `.txt` de esa carpeta y lo tomaría por una playlist.

## Formato de `data/juegos.txt`

```
# comentarios con #, líneas en blanco ignoradas

Nombre | Plataforma | imagen
```

Los dos últimos campos son opcionales. El orden del archivo es el orden en
pantalla.

## Plataformas

`js/juegos.js` mapea la plataforma a un ícono de Font Awesome: PC/Windows,
Steam, PlayStation (PS1–PS5), Xbox, Android, iOS/Mac, itch.io. Cualquier otra
cosa cae a `fa-gamepad`, así que el archivo acepta texto libre — "Game Boy
Advance" funciona sin tocar el código.

## Estilos

Medidas tomadas del CSS de la referencia:

| | Referencia | Aquí |
|---|---|---|
| Alto de fila | `5rem` | igual (4.5rem en móvil) |
| Imagen | `height: 4rem` | igual (3.5rem en móvil) |
| Borde de color por tier | sí | no (sin tiers) |

Reutiliza el armazón ya existente: `crt-frame`, `scanlines`, `site-header`,
`glitch-title`, `meta-bar`, `win-frame` (con path `~/Games`) y `filesystem-nav`.
El hover es el mismo glow azul que usan `.nav-card` y las filas de música.

En móvil se oculta el texto de la plataforma y queda solo el ícono.

## Estados

- **Cargando:** `> cargando...`
- **Sin juegos:** `> todavía no has añadido juegos`
- **Error de fetch:** mensaje explícito en la ventana
- **Imagen inexistente o rota:** cae al tile con ícono de mando, sin imagen rota

## Archivos

```
juegos.html          nuevo
js/juegos.js         nuevo
data/juegos.txt      nuevo   (editado a mano)
img/games/           nuevo   (las portadas las aporta el usuario)
css/style.css        editado (+ ~70 líneas)
index.html           editado (nav: Jueguitos → juegos.html)
about.html           editado (nav)
proyectos.html       editado (nav)
contacto.html        editado (nav)
musica.html          editado (nav)
```

## Fuera de alcance

- Tiers y clasificación.
- Ficha de detalle al hacer click.
- Enlaces a tiendas o a fichas externas.
