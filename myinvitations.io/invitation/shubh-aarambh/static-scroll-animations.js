/* Static scroll animation restoration for the exported invitation page. */
(() => {
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const init = () => {
    const wordingSection = document.querySelector('.im-wording--framed');
    const scrollWrap = wordingSection?.querySelector('.im-wording__wrap[data-animate="unroll"]');
    if (scrollWrap && wordingSection) {
      scrollWrap.classList.add('is-armed');
      scrollWrap.classList.remove('is-open','is-settled');
      const scrollArea = wordingSection;
      const updateUnroll = () => {
        const rect = scrollArea.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        // Animate through the section's viewport journey, not the tiny inner wrapper.
        const start = vh * 0.82;
        const end = -rect.height * 0.35;
        const progress = clamp((start - rect.top) / Math.max(1, start - end));
        scrollWrap.style.setProperty('--static-scroll-progress', progress.toFixed(4));
        scrollWrap.classList.toggle('is-open', progress > 0.005);
        scrollWrap.classList.remove('is-settled'); // settled hides the roller in the original CSS
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

    const elements = [...document.querySelectorAll('[data-animate]')].filter(el => el !== scrollWrap && el.dataset.animate !== 'unroll');
    elements.forEach(el => {
      el.classList.add('static-animate-ready');
      el.style.transitionDelay = Number(el.dataset.animateDelay || 0) + 's';
      el.style.transitionDuration = Number(el.dataset.animateDuration || .8) + 's';
    });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('static-animate-in'); observer.unobserve(entry.target); }
      }), {threshold:.12,rootMargin:'0px 0px -8% 0px'});
      elements.forEach(el => observer.observe(el));
    } else elements.forEach(el => el.classList.add('static-animate-in'));

    document.querySelectorAll('[data-scroll-next-section]').forEach(button => {
      button.addEventListener('click', () => button.closest('section')?.nextElementSibling?.scrollIntoView({behavior:'smooth',block:'start'}));
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
