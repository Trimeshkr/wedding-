/* Static opening video: muted autoplay with tap-to-enable-sound fallback and reliable exit. */
(() => {
  const init = () => {
    const cover = document.querySelector('.im-cover-video');
    const video = cover?.querySelector('.im-cover-video__video');
    if (!cover || !video) return;

    let finished = false;
    let fallbackTimer;
    const durationSeconds = Number(cover.dataset.duration || 10);

    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(fallbackTimer);
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

    const control = document.createElement('button');
    control.className = 'static-cover-video-control';
    control.type = 'button';
    control.textContent = 'Tap to play with sound';
    control.hidden = true;
    cover.appendChild(control);

    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    const setFallback = () => {
      control.hidden = false;
      control.textContent = 'Tap to play';
    };

    video.addEventListener('playing', () => {
      cover.classList.add('is-video-ready', 'is-playing');
      control.hidden = false;
      control.textContent = 'Tap for sound';
    }, { once: true });

    video.addEventListener('error', () => {
      setFallback();
      fallbackTimer = setTimeout(finish, 5000);
    });

    video.addEventListener('ended', finish, { once: true });

    control.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (video.paused) {
        try {
          video.muted = false;
          await video.play();
          control.textContent = 'Sound on';
        } catch {
          video.muted = true;
          setFallback();
        }
      } else {
        video.muted = !video.muted;
        control.textContent = video.muted ? 'Tap for sound' : 'Sound on';
      }
    });

    document.dispatchEvent(new CustomEvent('iw:lock-scroll'));
    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        setFallback();
      });
    }

    // If the media has a known duration, use it as a safety exit.
    video.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        fallbackTimer = setTimeout(finish, (video.duration + 2) * 1000);
      }
    }, { once: true });

    // Last-resort exit if autoplay/media loading fails.
    fallbackTimer ||= setTimeout(finish, Math.max(durationSeconds + 8, 15) * 1000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
