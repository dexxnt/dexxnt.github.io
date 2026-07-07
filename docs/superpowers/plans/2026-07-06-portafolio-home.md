# Home del portafolio de dexxnt — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first page (home/landing) of dexxnt's static portfolio: a blue-themed CRT-monitor page with a glitching title, a profile card, three nav placeholders, and a Windows-terminal-style boot animation on load.

**Architecture:** Pure static site — one `index.html`, one `css/style.css`, two vanilla JS files (`js/boot.js`, `js/glitch.js`). No build step, no package manager, no frameworks. A tiny dependency-free Node script (`serve.js`) is included purely as a local dev convenience so the page can be previewed over `http://` instead of `file://` (needed for the preview tooling); it ships in the repo but is not part of the deployed site's runtime behavior.

**Tech Stack:** HTML5, CSS3 (custom properties, `repeating-linear-gradient`, `clip-path`, media queries), vanilla ES5/ES6 JS (no build, no transpile), Google Fonts (`Press Start 2P`, `VT323`), Node.js (built-in `http`/`fs`/`path` modules only) for the local dev server.

**Spec:** `docs/superpowers/specs/2026-07-06-portafolio-home-design.md`

---

## Verification approach

This is a static, visual, no-build front end — there is no business logic worth unit-testing (the only "logic" is a typewriter loop and a `setTimeout`-based glitch trigger, both DOM/timing-driven). Each task is verified by running the local dev server and checking specific, concrete things in the browser (layout, computed styles, console errors, behavior), per the project rule that UI changes must be exercised in a real browser before being called done. There is no automated test suite for this plan.

Every task's dev server: `node serve.js`, then open `http://localhost:4173`. If using the Preview tool, it can be launched via the `portfolio-dev` config created in Task 1.

---

### Task 1: Project scaffold — markup, base reset, and local dev server

**Files:**
- Create: `serve.js`
- Create: `.claude/launch.json`
- Create: `index.html`
- Create: `css/style.css`

- [ ] **Step 1: Create the zero-dependency static file server**

Create `serve.js`:

```js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4173;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const safePath = path
    .normalize(urlPath === '/' ? '/index.html' : urlPath)
    .replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(ROOT, safePath);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor local en http://localhost:${PORT}`);
});
```

- [ ] **Step 2: Register the dev server with the Preview tool**

Create `.claude/launch.json`:

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "portfolio-dev",
      "runtimeExecutable": "node",
      "runtimeArgs": ["serve.js"],
      "port": 4173
    }
  ]
}
```

- [ ] **Step 3: Write the page markup**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>dexxnt | Portafolio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <main class="crt-frame">
    <div class="crt-screen">
      <div class="scanlines"></div>

      <header class="site-header">
        <div class="brand">
          <span class="brand-mark"></span>
          <span class="brand-name">dexxnt</span>
        </div>
        <nav class="social-links">
          <a href="#" target="_blank" rel="noopener">GitHub</a>
          <a href="#" target="_blank" rel="noopener">Instagram</a>
        </nav>
      </header>

      <h1 class="glitch-title" data-text="dexxnt portafolio">dexxnt portafolio</h1>

      <section class="profile-row">
        <img class="avatar" src="img/foto-de-perfil.jpg" alt="Foto de perfil de dexxnt" />
        <div class="speech-bubble">
          <span class="speech-name">dexxnt</span>
          <p class="speech-text">¡Sapeame tranquilx!</p>
        </div>
        <div class="status-block">
          <p>&#9671; &#9670; &#9671; STATUS: ONLINE</p>
          <p>&#9671; &#9670; ROLE: Developer</p>
          <p>&#9671; &#9671; STACK: Web</p>
        </div>
      </section>

      <div class="file-bar">
        <span>index.md</span>
        <span>1,1&nbsp;&nbsp;&nbsp;All</span>
      </div>

      <section class="nav-cards">
        <a class="nav-card" href="#">Sobre Mi</a>
        <a class="nav-card" href="#">Proyectos</a>
        <a class="nav-card" href="#">Contacto</a>
      </section>
    </div>
  </main>

  <script src="js/glitch.js"></script>
</body>
</html>
```

- [ ] **Step 4: Base reset and CSS variables**

Create `css/style.css`:

```css
:root {
  --bg-deep: #020617;
  --bg-glow: #1e3a8a;
  --accent: #3b82f6;
  --text-bright: #93c5fd;
  --text-dim: #7dd3fc;
  --glitch-magenta: #ff2ea6;
  --glitch-cyan: #00fff2;
  --bezel: #d8d3c4;
  --bar-bg: #dbeafe;
  --bar-text: #0f172a;
  --font-pixel: 'Press Start 2P', monospace;
  --font-mono: 'VT323', monospace;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #000;
  font-family: var(--font-mono);
  color: var(--text-bright);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
```

- [ ] **Step 5: Verify the unstyled scaffold loads**

Run: `node serve.js` and open `http://localhost:4173` (or use the Preview tool with the `portfolio-dev` config).

Expected: page loads with no console errors, "dexxnt portafolio" text is visible (unstyled/black on white default), the profile photo renders (broken image icon is NOT expected — if you see one, the path `img/foto-de-perfil.jpg` is wrong relative to `index.html`), and the three links "Sobre Mi" / "Proyectos" / "Contacto" are visible.

- [ ] **Step 6: Commit**

```bash
git add serve.js .claude/launch.json index.html css/style.css
git commit -m "feat: scaffold portfolio home page markup and dev server"
```

---

### Task 2: CRT frame, fonts, and color system

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Add the bezel frame and inner screen styles**

Append to `css/style.css`:

```css
.crt-frame {
  width: 100%;
  max-width: 900px;
  border: 10px solid var(--bezel);
  border-radius: 22px;
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5);
  background: var(--bg-deep);
}

.crt-screen {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: radial-gradient(ellipse at top, var(--bg-glow) 0%, var(--bg-deep) 75%);
  padding: 28px;
}
```

- [ ] **Step 2: Verify the CRT frame renders**

Run: `node serve.js`, open `http://localhost:4173`.

Expected: a cream/beige rounded bezel (`#d8d3c4`) wraps a dark blue inner screen, centered on a black page background. Use the Preview tool's inspect capability on `.crt-frame` and confirm computed `border-color` is `rgb(216, 211, 196)` and on `.crt-screen` confirm `border-radius` is `12px`.

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat: add CRT bezel frame and screen background"
```

---

### Task 3: Scanlines and flicker

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Add the scanline overlay and flicker animation**

Append to `css/style.css`:

```css
.scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(255, 255, 255, 0.035) 0px,
    rgba(255, 255, 255, 0.035) 1px,
    transparent 1px,
    transparent 3px
  );
  mix-blend-mode: overlay;
  animation: flicker 6s infinite;
}

@keyframes flicker {
  0%, 96%, 100% { opacity: 1; }
  97% { opacity: 0.85; }
  98% { opacity: 1; }
}
```

- [ ] **Step 2: Verify scanlines are visible but subtle**

Run: `node serve.js`, open `http://localhost:4173`.

Expected: faint horizontal lines across the whole screen area, not obscuring text. Watch for ~6 seconds and confirm a barely-noticeable brightness flicker (not a jarring strobe — if it looks like strobing, the `opacity: 0.85` step is too aggressive and should be raised to `0.92`).

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat: add CRT scanline overlay with subtle flicker"
```

---

### Task 4: Header — brand and social links

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Style the header row**

Append to `css/style.css`:

```css
.site-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(59, 130, 246, 0.4);
  padding-bottom: 14px;
  margin-bottom: 24px;
  position: relative;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-pixel);
  font-size: 14px;
  color: var(--text-bright);
}

.brand-mark {
  width: 20px;
  height: 20px;
  background: var(--accent);
  border-radius: 4px;
  display: inline-block;
}

.social-links {
  display: flex;
  gap: 16px;
}

.social-links a {
  color: var(--text-dim);
  text-decoration: none;
  font-size: 16px;
}

.social-links a:hover,
.social-links a:focus-visible {
  color: var(--text-bright);
  text-decoration: underline;
}
```

- [ ] **Step 2: Verify the header layout**

Run: `node serve.js`, open `http://localhost:4173`.

Expected: "dexxnt" wordmark with a small blue square to its left on the top-left; "GitHub" and "Instagram" links top-right; a thin blue-tinted divider line beneath the whole row. Hover each link and confirm the color brightens and an underline appears.

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat: style header brand and social links"
```

---

### Task 5: Glitch title

**Files:**
- Modify: `css/style.css`
- Create: `js/glitch.js`

- [ ] **Step 1: Style the glitching title**

Append to `css/style.css`:

```css
.glitch-title {
  font-family: var(--font-pixel);
  font-size: clamp(14px, 4vw, 22px);
  text-align: center;
  color: var(--text-bright);
  margin: 0 0 30px;
  position: relative;
  letter-spacing: 2px;
}

.glitch-title::before,
.glitch-title::after {
  content: attr(data-text);
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  opacity: 0;
}

.glitch-title.glitching::before {
  color: var(--glitch-magenta);
  opacity: 0.8;
  clip-path: inset(0 0 55% 0);
  transform: translate(-3px, -1px);
}

.glitch-title.glitching::after {
  color: var(--glitch-cyan);
  opacity: 0.8;
  clip-path: inset(55% 0 0 0);
  transform: translate(3px, 1px);
}
```

- [ ] **Step 2: Write the periodic glitch trigger**

Create `js/glitch.js`:

```js
(function () {
  const MIN_DELAY_MS = 3000;
  const MAX_DELAY_MS = 6000;
  const GLITCH_DURATION_MS = 200;

  const title = document.querySelector('.glitch-title');

  function randomDelay() {
    return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  }

  function triggerGlitch() {
    title.classList.add('glitching');
    window.setTimeout(function () {
      title.classList.remove('glitching');
      window.setTimeout(triggerGlitch, randomDelay());
    }, GLITCH_DURATION_MS);
  }

  window.setTimeout(triggerGlitch, randomDelay());
})();
```

- [ ] **Step 3: Verify the glitch fires periodically**

Run: `node serve.js`, open `http://localhost:4173`. Open the browser console and confirm no errors referencing `glitch.js`.

Expected: within 3-6 seconds, and then repeatedly every 3-6 seconds, the title briefly shows a magenta/cyan RGB-split flicker for ~200ms. Use the Preview tool's console log check to confirm zero JS errors during a ~15 second observation window.

- [ ] **Step 4: Commit**

```bash
git add css/style.css js/glitch.js
git commit -m "feat: add periodic RGB glitch effect to title"
```

---

### Task 6: Profile row — avatar, speech bubble, status

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Style the profile row**

Append to `css/style.css`:

```css
.profile-row {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  object-fit: cover;
  flex-shrink: 0;
}

.speech-bubble {
  flex: 1;
  min-width: 220px;
  border: 2px dashed var(--accent);
  border-radius: 6px;
  padding: 12px 16px;
}

.speech-name {
  display: block;
  font-family: var(--font-pixel);
  font-size: 12px;
  color: var(--text-bright);
  margin-bottom: 6px;
}

.speech-text {
  margin: 0;
  font-size: 20px;
  color: #dbeafe;
}

.status-block {
  color: var(--text-dim);
  font-size: 16px;
  line-height: 1.6;
  text-align: right;
}

.status-block p {
  margin: 0;
}
```

- [ ] **Step 2: Verify photo, bubble, and status render correctly**

Run: `node serve.js`, open `http://localhost:4173`.

Expected: circular photo with a blue border on the left; a dashed-blue speech bubble next to it reading "dexxnt" then "¡Sapeame tranquilx!"; a right-aligned status block showing the three `STATUS/ROLE/STACK` lines with diamond glyphs. Use the Preview tool to inspect `.avatar` and confirm computed `border-radius` is `50%` and `object-fit` is `cover` (so the photo isn't stretched).

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat: style profile avatar, speech bubble, and status block"
```

---

### Task 7: File bar

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Style the editor-style status bar**

Append to `css/style.css`:

```css
.file-bar {
  background: var(--bar-bg);
  color: var(--bar-text);
  font-family: var(--font-mono);
  font-size: 14px;
  padding: 6px 12px;
  display: flex;
  justify-content: space-between;
  border-radius: 2px;
  margin-bottom: 22px;
}
```

- [ ] **Step 2: Verify the file bar**

Run: `node serve.js`, open `http://localhost:4173`.

Expected: a light-blue horizontal bar below the profile row reading "index.md" on the left and "1,1   All" on the right, dark text clearly legible against the light background.

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat: style editor-style file status bar"
```

---

### Task 8: Nav cards

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Style the three nav cards**

Append to `css/style.css`:

```css
.nav-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.nav-card {
  border: 2px solid var(--accent);
  border-radius: 6px;
  padding: 16px;
  color: var(--text-bright);
  text-align: center;
  font-size: 16px;
  text-decoration: none;
  transition: box-shadow 0.2s ease, background 0.2s ease;
}

.nav-card:hover,
.nav-card:focus-visible {
  box-shadow: 0 0 12px var(--accent);
  background: rgba(59, 130, 246, 0.1);
}
```

- [ ] **Step 2: Verify the cards and hover state**

Run: `node serve.js`, open `http://localhost:4173`.

Expected: three equal-width bordered cards in a row reading "Sobre Mi", "Proyectos", "Contacto". Hover each and confirm a blue glow (`box-shadow`) and faint blue background tint appear, then disappear on mouse-out.

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat: style nav cards with hover glow"
```

---

### Task 9: Boot terminal simulation

**Files:**
- Modify: `index.html`
- Modify: `css/style.css`
- Create: `js/boot.js`

- [ ] **Step 1: Insert the boot overlay markup**

In `index.html`, replace:

```html
<body>
  <main class="crt-frame">
```

with:

```html
<body>
  <div id="boot-screen" class="boot-screen">
    <pre id="boot-text" class="boot-text"></pre>
    <span class="boot-cursor">_</span>
    <p class="boot-skip">Pulsa cualquier tecla o haz click para omitir</p>
  </div>

  <main class="crt-frame">
```

- [ ] **Step 2: Load the boot script**

In `index.html`, replace:

```html
  <script src="js/glitch.js"></script>
</body>
</html>
```

with:

```html
  <script src="js/boot.js"></script>
  <script src="js/glitch.js"></script>
</body>
</html>
```

- [ ] **Step 3: Style the boot overlay**

Append to `css/style.css`:

```css
.boot-screen {
  position: fixed;
  inset: 0;
  background: #000;
  color: #4ade80;
  font-family: var(--font-mono);
  font-size: 22px;
  padding: 40px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.boot-text {
  white-space: pre-wrap;
  margin: 0;
  font-family: var(--font-mono);
}

.boot-cursor {
  display: inline-block;
  animation: blink 1s step-end infinite;
  width: 12px;
}

.boot-skip {
  margin-top: auto;
  opacity: 0.5;
  font-size: 16px;
}

.boot-screen.hidden {
  display: none;
}

.boot-screen.glitching-out {
  animation: boot-glitch-out 0.4s steps(2, end) 2;
}

@keyframes blink {
  50% { opacity: 0; }
}

@keyframes boot-glitch-out {
  0% { transform: translate(0); filter: none; }
  25% { transform: translate(-6px, 2px); filter: hue-rotate(90deg); }
  50% { transform: translate(6px, -2px); filter: hue-rotate(-90deg); }
  75% { transform: translate(-3px, 0); filter: none; }
  100% { transform: translate(0); opacity: 0; }
}
```

- [ ] **Step 4: Write the boot typewriter script**

Create `js/boot.js`:

```js
(function () {
  const BOOT_LINES = [
    'Iniciando procesador...',
    'Cargando módulos del sistema...',
    'Montando unidades...',
    'Verificando integridad de memoria...',
    'Estableciendo conexión segura...',
    'Acceso concedido: dexxnt'
  ];

  const CHAR_DELAY_MS = 35;
  const LINE_PAUSE_MS = 250;
  const FINAL_PAUSE_MS = 500;
  const SESSION_KEY = 'dexxnt-boot-played';

  const bootScreen = document.getElementById('boot-screen');
  const bootText = document.getElementById('boot-text');

  if (sessionStorage.getItem(SESSION_KEY)) {
    bootScreen.classList.add('hidden');
    return;
  }

  sessionStorage.setItem(SESSION_KEY, '1');

  function hideBootScreen() {
    bootScreen.classList.add('glitching-out');
    window.setTimeout(function () {
      bootScreen.classList.add('hidden');
    }, 400);
  }

  function skipBoot() {
    window.clearTimeout(skipBoot.timer);
    hideBootScreen();
  }

  bootScreen.addEventListener('click', skipBoot);
  document.addEventListener('keydown', skipBoot, { once: true });

  let lineIndex = 0;
  let charIndex = 0;

  function typeNextChar() {
    const currentLine = BOOT_LINES[lineIndex];

    if (charIndex < currentLine.length) {
      bootText.textContent += currentLine[charIndex];
      charIndex += 1;
      skipBoot.timer = window.setTimeout(typeNextChar, CHAR_DELAY_MS);
      return;
    }

    bootText.textContent += '\n';
    lineIndex += 1;
    charIndex = 0;

    if (lineIndex < BOOT_LINES.length) {
      skipBoot.timer = window.setTimeout(typeNextChar, LINE_PAUSE_MS);
    } else {
      skipBoot.timer = window.setTimeout(hideBootScreen, FINAL_PAUSE_MS);
    }
  }

  typeNextChar();
})();
```

- [ ] **Step 5: Verify the full boot sequence**

Run: `node serve.js`, open `http://localhost:4173` in a fresh private/incognito window (so `sessionStorage` is empty).

Expected: full-screen black terminal appears first, lines type themselves out one by one ending in "Acceso concedido: dexxnt", then after a short pause the overlay glitches and disappears, revealing the home page underneath. Reload the same tab (not a new incognito window) and confirm the boot does NOT replay — the home page should appear immediately, because `sessionStorage` still has the flag set.

- [ ] **Step 6: Verify skip works**

Reload in a fresh private window, and press any key (or click) partway through the typing.

Expected: the boot overlay immediately glitches out and disappears, without waiting for the remaining lines to finish typing.

- [ ] **Step 7: Commit**

```bash
git add index.html css/style.css js/boot.js
git commit -m "feat: add skippable Windows-terminal-style boot sequence"
```

---

### Task 10: Responsive layout

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Add the mobile breakpoint**

Append to `css/style.css`:

```css
@media (max-width: 640px) {
  body {
    padding: 10px;
  }

  .crt-screen {
    padding: 16px;
  }

  .profile-row {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .status-block {
    text-align: center;
  }

  .nav-cards {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Verify mobile layout**

Run: `node serve.js`. Using the Preview tool, resize the viewport to the `mobile` preset (375x812) and reload `http://localhost:4173`.

Expected: avatar, speech bubble, and status block stack vertically and center themselves; the three nav cards stack into a single column; no horizontal scrollbar appears; all text remains legible (nothing overflows the CRT bezel).

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat: add responsive layout for mobile viewports"
```

---

### Task 11: Full end-to-end verification pass

**Files:**
- None (verification only)

- [ ] **Step 1: Fresh-session full walkthrough**

Run: `node serve.js`. Open `http://localhost:4173` in a fresh private/incognito window at desktop size (1280x800).

Checklist — confirm all of these are true:
- Boot terminal plays once, ends with "Acceso concedido: dexxnt", then glitches out.
- CRT bezel, scanlines, and subtle flicker are visible on the revealed page.
- "dexxnt portafolio" title glitches (RGB split) periodically every few seconds.
- Header shows "dexxnt" wordmark + GitHub/Instagram links.
- Profile photo (`img/foto-de-perfil.jpg`) displays correctly, circular, not stretched.
- Speech bubble reads "dexxnt" / "¡Sapeame tranquilx!".
- Status block shows the three `STATUS/ROLE/STACK` lines.
- File bar reads "index.md" / "1,1   All".
- Three nav cards ("Sobre Mi", "Proyectos", "Contacto") glow blue on hover.
- Browser console (via the Preview tool's console check) shows zero errors.

- [ ] **Step 2: Mobile walkthrough**

Resize to the `mobile` preset (375x812), reload the same tab (boot should NOT replay — same session).

Expected: layout stacks correctly per Task 10, page is fully usable and legible, no horizontal scroll.

- [ ] **Step 3: Tag the milestone commit**

```bash
git add -A
git commit -m "chore: complete portfolio home page v1" --allow-empty
```
