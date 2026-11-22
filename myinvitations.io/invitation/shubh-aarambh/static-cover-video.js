/* Opening intro V2: muted autoplay, user sound/play fallback, and explicit skip. */
(() => {
  function start() {
    const cover = document.querySelector('.im-cover-video');
    const video = cover?.querySelector('video.im-cover-video__video');
    if (!cover || !video || cover.dataset.staticIntroReady) return;
    cover.dataset.staticIntroReady = '1';

    let closed = false;
    let playbackStarted = false;
    let failTimer = 0;
    let endTimer = 0;

    const finish = () => {
      if (closed) return;
      closed = true;
      clearTimeout(failTimer);
      clearTimeout(endTimer);
      video.pause();
      cover.classList.add('is-closing');
      document.dispatchEvent(new CustomEvent('iw:cover-ending-soon'));
      document.dispatchEvent(new CustomEvent('iw:cover-closing'));
      setTimeout(() => {
        cover.style.display = 'none';
        document.dispatchEvent(new CustomEvent('iw:unlock-scroll'));
        document.dispatchEvent(new CustomEvent('iw:cover-opened'));
      }, 1200);
    };

    const controls = document.createElement('div');
    controls.className = 'static-intro-controls';

    const sound = document.createElement('button');
    sound.type = 'button';
    sound.className = 'static-intro-sound';
    sound.textContent = 'Enable sound';

    const skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'static-intro-skip';
    skip.textContent = 'Skip intro';

    controls.append(sound, skip);
    cover.appendChild(controls);

    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = 'auto';

    const fallback = () => {
      sound.textContent = 'Play intro';
      cover.classList.add('intro-needs-tap');
    };

    video.addEventListener('playing', () => {
      playbackStarted = true;
      cover.classList.add('is-video-ready', 'is-playing');
      sound.textContent = video.muted ? 'Enable sound' : 'Mute';
      clearTimeout(failTimer);
      const duration = Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : Number(cover.dataset.duration || 10);
      endTimer = setTimeout(finish, (duration + 2) * 1000);
    });

    video.addEventListener('ended', finish);
    video.addEventListener('error', fallback);

    sound.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (!playbackStarted || video.paused) {
        try {
          video.muted = false;
          await video.play();
          cover.classList.remove('intro-needs-tap');
          sound.textContent = 'Mute';
        } catch {
          try {
            video.muted = true;
            await video.play();
            cover.classList.remove('intro-needs-tap');
            sound.textContent = 'Enable sound';
          } catch {
            fallback();
          }
        }
      } else {
        video.muted = !video.muted;
        sound.textContent = video.muted ? 'Enable sound' : 'Mute';
      }
    });

    skip.addEventListener('click', (event) => {
      event.stopPropagation();
      finish();
    });

    document.dispatchEvent(new CustomEvent('iw:lock-scroll'));
    const attempt = video.play();
    if (attempt?.catch) attempt.catch(fallback);
    failTimer = setTimeout(() => {
      if (!playbackStarted) fallback();
    }, 6500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
