/* Static scroll animation restoration for the exported invitation page. */
(() => {
  const init = () => {
    // The scroll invitation should remain closed until the guest reaches it.
    const scrollWrap = document.querySelector('.im-wording__wrap[data-animate="unroll"]');
    if (scrollWrap) {
      scrollWrap.classList.add('is-armed');
      const paper = scrollWrap.querySelector('.im-wording__paper');
      const inner = scrollWrap.querySelector('.im-wording__inner');
      const settle = () => {
        if (scrollWrap.classList.contains('is-open')) {
          window.setTimeout(() => scrollWrap.classList.add('is-settled'), 2100);
        }
      };
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              scrollWrap.classList.add('is-open');
              settle();
              observer.unobserve(scrollWrap);
            }
          });
        observer.observe(scrollWrap);
      } else {
        scrollWrap.classList.add('is-open','is-settled');
      }
    }

    // Restore reveal-on-scroll for elements tagged by the original invitation plugin.
    const elements = [...document.querySelectorAll('[data-animate]')].filter(el => el !== scrollWrap && el.dataset.animate !== 'unroll');
    elements.forEach(el => {
      el.classList.add('static-animate-ready');
      const delay = Number(el.dataset.animateDelay || 0);
      const duration = Number(el.dataset.animateDuration || .8);
      el.style.transitionDelay = delay + 's';
      el.style.transitionDuration = duration + 's';
      if (el.dataset.animate === 'zoom-loop') {
        const scale = Number(el.dataset.animateScale || 1.1);
        el.style.setProperty('--static-zoom-scale', scale);
      }
    });
    if (!('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('static-animate-in'));
      return;
    }
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('static-animate-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold: .12, rootMargin: '0px 0px -8% 0px'});
    elements.forEach(el => revealObserver.observe(el));

    // Buttons that request the next section should work in a static export too.
    document.querySelectorAll('[data-scroll-next-section]').forEach(button => {
      button.addEventListener('click', () => {
        const section = button.closest('section')?.nextElementSibling;
        section?.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
