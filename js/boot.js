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
    }, 800);
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
