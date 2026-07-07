# Diseño: Home del portafolio de dexxnt

## Contexto

Portafolio personal inspirado en [underground.kimu.moe](https://underground.kimu.moe/), adaptado a una paleta azul eléctrica. Esta spec cubre únicamente la primera pantalla (home/landing) del sitio. Otras secciones (Sobre Mi, Proyectos, Contacto) se diseñarán e implementarán en iteraciones posteriores siguiendo la misma línea visual.

## Stack

Sitio estático, sin build ni frameworks: HTML + CSS + JS vanilla. Sin dependencias salvo fuentes de Google Fonts (carga vía `<link>`).

## Estructura de archivos

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── boot.js       # simulación de terminal al cargar
│   └── glitch.js     # efecto glitch del título
└── img/
    └── foto-de-perfil.jpg   (ya existe)
```

## Tipografía

- **Press Start 2P** (Google Fonts): título/logo — look bloque 8bit.
- **VT323** (Google Fonts): textos de párrafo, burbuja de diálogo, tarjetas, barra de estado — pixel pero legible en bloques largos de texto.

## Paleta de color

Azul eléctrico balanceado (opción confirmada por el usuario):

- Fondo pantalla: `#020617` → `#1e3a8a` (radial, esquina superior)
- Acento principal / bordes: `#3b82f6`
- Texto destacado: `#93c5fd`
- Texto secundario: `#7dd3fc`
- Glitch RGB split: `#ff2ea6` (magenta) / `#00fff2` (cian)
- Bisel del monitor: `#d8d3c4` (hueso, igual que la referencia)
- Barra tipo editor (`index.md`): fondo `#dbeafe`, texto `#0f172a`

## Componentes de la página (de arriba a abajo)

1. **Boot terminal (overlay al cargar, una sola vez)**
   Pantalla completa negra, texto monoespaciado tipeándose línea por línea (efecto máquina de escribir vía JS, ~30-50ms por caracter), cursor parpadeante al final de cada línea. Líneas, en orden:
   1. `Iniciando procesador...`
   2. `Cargando módulos del sistema...`
   3. `Montando unidades...`
   4. `Verificando integridad de memoria...`
   5. `Estableciendo conexión segura...`
   6. `Acceso concedido: dexxnt`

   Tras la última línea, breve pausa (~500ms) y transición con glitch (parpadeo + corte RGB) que revela la home. Se puede saltar haciendo click o pulsando cualquier tecla en cualquier momento. Se ejecuta una sola vez por sesión de navegador (guardado en `sessionStorage`) — si el usuario recarga en la misma sesión no se repite.

2. **Marco CRT**
   Bisel exterior redondeado color hueso (`#d8d3c4`), pantalla interior azul oscuro con:
   - Scanlines: `repeating-linear-gradient` horizontal sutil superpuesto con `mix-blend-mode: overlay`.
   - Viñeta: sombra interior sutil en los bordes.
   - Flicker: animación de opacidad muy sutil e infinita en las scanlines (imperceptible pero da vida).

3. **Header**
   Logo (cuadrado azul simple o inicial "d") + wordmark "dexxnt" a la izquierda. A la derecha, iconos GitHub e Instagram (enlaces `#` por ahora, pendientes de URLs reales del usuario).

4. **Título con glitch**
   "dexxnt portafolio" en Press Start 2P, con efecto glitch RGB-split vía pseudo-elementos `::before`/`::after` (clip-path + offset de color) disparado aleatoriamente cada 3-6 segundos mediante un intervalo en `glitch.js` que alterna una clase `.glitching`.

5. **Tarjeta de perfil**
   - Avatar circular (`img/foto-de-perfil.jpg`), borde azul.
   - Burbuja de diálogo (borde punteado azul): nombre "dexxnt" en negrita + texto "¡Sapeame tranquilx!".
   - Bloque de estado a la derecha (alineado como en la referencia, con diamantes ◇◆ decorativos):
     ```
     ◇ ◆ ◇ STATUS: ONLINE
     ◇ ◆ ROLE: Developer
     ◇ ◇ STACK: Web
     ```

6. **Barra tipo editor**
   Franja horizontal clara imitando la barra de estado de un editor de código: `index.md` a la izquierda, `1,1     All` a la derecha.

7. **Tarjetas de navegación (3)**
   Grid de 3 columnas (se apila a 1 columna en móvil): **Sobre Mi**, **Proyectos**, **Contacto**. Borde azul, hover con glow/aumento de brillo del borde. Por ahora apuntan a `#` (placeholders) — se convertirán en enlaces reales cuando se construyan esas páginas.

## Responsive

- Desktop: layout tal como se describe arriba.
- Mobile (`<640px`): avatar + burbuja + status se apilan verticalmente, tarjetas de navegación pasan a 1 columna, el marco CRT reduce su padding.

## Fuera de alcance (siguientes iteraciones)

- Contenido real de Sobre Mi, Proyectos y Contacto.
- URLs reales de GitHub e Instagram.
- Selector de idioma (la referencia lo tiene; no se pidió para esta iteración).

## Verificación

- Abrir `index.html` en navegador (servido localmente, no `file://`, para que fuentes y scripts carguen sin problemas de CORS).
- Confirmar que el boot corre una vez y se puede saltar.
- Confirmar animación de glitch periódica en el título.
- Confirmar scanlines visibles pero sutiles.
- Confirmar que la foto de perfil carga correctamente.
- Probar en viewport móvil (375px) y verificar que las tarjetas se apilan y todo es legible.
