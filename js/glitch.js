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
