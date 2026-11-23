/* Restore the original invitation gesture/lifecycle: visitor taps to start the intro. */
(() => {
  function init() {
    const cover = document.querySelector('.im-cover-video');
    const video = cover?.querySelector('.im-cover-video__video');
    if (!cover || !video || cover.dataset.staticCoverInit) return;
    cover.dataset.staticCoverInit = '1';

    let started = false, finished = false;
    let lockedScrollY = 0;
    let envelopeScrollGuard = true;
    const blockScrollInput = e => { if (envelopeScrollGuard) e.preventDefault(); };
    const blockScrollKeys = e => { if (envelopeScrollGuard && ['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ','Spacebar'].includes(e.key)) e.preventDefault(); };
    window.addEventListener('wheel', blockScrollInput, {capture:true, passive:false});
    window.addEventListener('touchmove', blockScrollInput, {capture:true, passive:false});
    window.addEventListener('keydown', blockScrollKeys, {capture:true});
    const lockPageScroll = () => {
      if (document.body.dataset.invitationScrollLocked === '1') return;
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.dataset.invitationScrollLocked = '1';
      document.documentElement.style.setProperty('overflow', 'hidden', 'important');
      document.body.style.setProperty('overflow', 'hidden', 'important');
    };
    const unlockPageScroll = () => {
      if (document.body.dataset.invitationScrollLocked !== '1') return;
      document.body.dataset.invitationScrollLocked = '0';
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow');
      window.scrollTo(0, lockedScrollY);
    };
    document.addEventListener('iw:lock-scroll', lockPageScroll);
    document.addEventListener('iw:unlock-scroll', unlockPageScroll);
    const finish = () => {
      if (finished) return;
      finished = true;
      video.pause();
      cover.classList.add('is-closing');
      document.dispatchEvent(new CustomEvent('iw:cover-ending-soon'));
      document.dispatchEvent(new CustomEvent('iw:cover-closing'));
      setTimeout(() => {
        cover.style.display = 'none';
        // Unlock scrolling only after the envelope/cover closing animation is complete.
        envelopeScrollGuard = false;
        window.removeEventListener('wheel', blockScrollInput, true);
        window.removeEventListener('touchmove', blockScrollInput, true);
        window.removeEventListener('keydown', blockScrollKeys, true);
        document.dispatchEvent(new CustomEvent('iw:unlock-scroll'));
        document.dispatchEvent(new CustomEvent('iw:cover-opened'));
      }, 1300);
    };

    // Lock immediately on the initial envelope screen, before any tap.
    lockPageScroll();
    window.scrollTo(0, 0);
    const forceTop = () => { if (envelopeScrollGuard && window.scrollY !== 0) window.scrollTo(0, 0); };
    window.addEventListener('scroll', forceTop, {capture:true, passive:true});

    // Start overlay: preserve the expected tap interaction.
    video.autoplay = false;
    video.muted = false;
    video.playsInline = true;
    cover.classList.remove('is-playing', 'is-video-ready', 'is-closing');

    const start = async () => {
      if (started || finished) return;
      started = true;
      document.dispatchEvent(new CustomEvent('iw:cover-started'));
      // Scroll is already locked from the initial envelope screen.
      // Pause other media briefly, matching the original cover script.
      document.querySelectorAll('audio,video').forEach(media => {
        if (media !== video && !media.paused) {
          const wasMuted = media.muted;
          media.muted = true;
          media.pause();
          media.muted = wasMuted;
        }
      });
      try {
        await video.play();
        cover.classList.add('is-playing');
      } catch (e) {
        started = false;
        // Retry with muted playback if sound autoplay is blocked.
        video.muted = true;
        try {
          await video.play();
          started = true;
          cover.classList.add('is-playing');
        } catch {
          cover.classList.add('intro-needs-tap');
        }
      }
    };

    cover.addEventListener('click', start);
    video.addEventListener('playing', () => cover.classList.add('is-video-ready'), { once: true });
    video.addEventListener('ended', finish, { once: true });
    video.addEventListener('error', () => {
      if (started) {
        cover.classList.add('intro-needs-tap');
        // Do not dismiss the cover on failure; retain the poster and interaction.
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
