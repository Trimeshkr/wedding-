/* Static scroll animation restoration for the exported invitation page. */
(() => {
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const init = () => {
    const scrollWrap = document.querySelector('.im-wording__wrap[data-animate="unroll"]');
    if (scrollWrap) {
      const scrollArea = scrollWrap.closest('.im-wording__scroll') || scrollWrap;
      const paper = scrollWrap.querySelector('.im-wording__paper');
      const roller = scrollWrap.querySelector('.im-wording__roller');
      const inner = scrollWrap.querySelector('.im-wording__inner');
      scrollWrap.classList.add('is-armed');
      scrollWrap.classList.remove('is-open','is-settled');

      // Scrub the scroll itself: scroll down opens the scroll, scroll up reverses it.
      // Progress is mapped across the scroll element passing through the viewport.
      const updateUnroll = () => {
        const rect = scrollArea.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const totalTravel = vh + rect.height;
        const progress = clamp((vh - rect.top) / Math.max(1, totalTravel));
        scrollWrap.style.setProperty('--static-scroll-progress', progress.toFixed(4));
        if (paper) paper.style.clipPath = `inset(0 0 ${(1-progress)*100}% 0)`;
        if (roller) roller.style.bottom = `${progress*100}%`;
        if (inner) inner.style.opacity = progress.toFixed(3);
        scrollWrap.classList.toggle('is-open', progress > 0.015);
        scrollWrap.classList.toggle('is-settled', progress >= 0.995);
      };
      let ticking = false;
      const requestUpdate = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { updateUnroll(); ticking = false; });
      };
      window.addEventListener('scroll', requestUpdate, {passive:true});
      window.addEventListener('resize', requestUpdate, {passive:true});
      updateUnroll();
    }

    // Reveal elements marked by the original invitation animation metadata.
    const elements = [...document.querySelectorAll('[data-animate]')].filter(el => el !== scrollWrap && el.dataset.animate !== 'unroll');
    elements.forEach(el => {
      el.classList.add('static-animate-ready');
      const delay = Number(el.dataset.animateDelay || 0);
      const duration = Number(el.dataset.animateDuration || .8);
      el.style.transitionDelay = delay + 's';
      el.style.transitionDuration = duration + 's';
    });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('static-animate-in');
            observer.unobserve(entry.target);
          }
        });
      }, {threshold: .12, rootMargin: '0px 0px -8% 0px'});
      elements.forEach(el => observer.observe(el));
    } else {
      elements.forEach(el => el.classList.add('static-animate-in'));
    }

    document.querySelectorAll('[data-scroll-next-section]').forEach(button => {
      button.addEventListener('click', () => {
        const section = button.closest('section')?.nextElementSibling;
        section?.scrollIntoView({behavior:'smooth',block:'start'});
      });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
