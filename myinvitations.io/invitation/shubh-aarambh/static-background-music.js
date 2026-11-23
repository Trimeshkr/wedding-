/* Wedding invitation background music: start after the cover has fully opened. */
(() => {
  if (window.__iwMusicInit) return;
  window.__iwMusicInit = true;

  const audio = new Audio('./assets/music/ishq-hai.mp3');
  audio.loop = true;
  audio.preload = 'auto';
  audio.load();
  audio.volume = 0;
  audio.muted = true;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'iw-music-toggle';
  btn.setAttribute('aria-label', 'Play wedding music');
  btn.setAttribute('title', 'Play music');
  btn.innerHTML = '<span class="iw-music-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></span><span class="iw-music-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
  const style = document.createElement('style');
  style.textContent = `
    .iw-music-toggle{position:fixed;right:18px;bottom:18px;z-index:99999;width:50px;height:50px;border:1px solid rgba(255,255,255,.6);border-radius:50%;background:rgba(111,32,50,.88);color:#fff;box-shadow:0 4px 18px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;gap:3px;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
    .iw-music-toggle svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .iw-music-bars{display:none;align-items:center;gap:2px;height:14px}
    .iw-music-bars i{display:block;width:2px;height:4px;background:#fff;border-radius:2px}
    .iw-music-toggle.is-playing .iw-music-bars{display:flex}
    .iw-music-toggle.is-playing .iw-music-icon{display:none}
    .iw-music-toggle.is-playing .iw-music-bars i{animation:iwMusicBar .7s ease-in-out infinite alternate}
    .iw-music-toggle.is-playing .iw-music-bars i:nth-child(2){animation-delay:.18s}
    .iw-music-toggle.is-playing .iw-music-bars i:nth-child(3){animation-delay:.32s}
    .iw-music-toggle.is-playing .iw-music-bars i:nth-child(4){animation-delay:.1s}
    @keyframes iwMusicBar{from{height:3px}to{height:13px}}
    @media(max-width:480px){.iw-music-toggle{right:12px;bottom:12px;width:46px;height:46px}}
  `;
  document.head.appendChild(style);
  document.body.appendChild(btn);

  let unlocked = false;
  let primed = false;
  let fadeTimer = null;
  let userPaused = false;
  const setState = (playing) => {
    btn.classList.toggle('is-playing', playing);
    btn.setAttribute('aria-label', playing ? 'Pause wedding music' : 'Play wedding music');
    btn.title = playing ? 'Pause music' : 'Play music';
  };
  const fadeIn = () => {
    clearInterval(fadeTimer);
    audio.volume = .72;
    audio.muted = false;
  };
  async function play() {
    try {
      audio.muted = false;
      await audio.play();
      setState(true);
      fadeIn();
    } catch (err) {
      setState(false);
      // Browsers may block delayed playback; the visible button lets the visitor start it.
    }
  }
  function pause() {
    clearInterval(fadeTimer);
    audio.pause();
    setState(false);
  }
  // Prime playback silently during the intro's tap gesture so the file is already decoded/buffered when the cover opens.
  document.addEventListener('iw:cover-started', async () => {
    try {
      audio.muted = true;
      await audio.play();
      primed = true;
      setState(true);
    } catch (_) { /* fallback to playback after the cover opens */ }
  }, { once: true });
  // Start at the beginning of the cover-closing transition to compensate for the remaining visual reveal.
  document.addEventListener('iw:cover-closing', () => {
    unlocked = true;
    if (userPaused) return;
    audio.muted = false;
    play();
  }, { once: true });
  btn.addEventListener('click', () => {
    if (audio.paused) {
      userPaused = false;
      if (!unlocked) unlocked = true;
      play();
    } else {
      userPaused = true;
      pause();
    }
  });
  audio.addEventListener('ended', () => setState(false));
})();
