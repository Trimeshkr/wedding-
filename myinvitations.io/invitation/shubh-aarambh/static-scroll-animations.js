/* Static scroll animation restoration for the exported invitation page. */
(() => {
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const pxVar=(el,name)=>{
    const probe=document.createElement('div');
    probe.style.cssText='position:absolute;visibility:hidden;pointer-events:none;height:var('+name+');width:0;inset:auto';
    el.appendChild(probe); const n=probe.getBoundingClientRect().height; probe.remove(); return n;
  };
  const init=()=>{
    const section=document.querySelector('.im-wording--framed');
    const wrap=section?.querySelector('.im-wording__wrap[data-animate="unroll"]');
    if(wrap&&section){
      const paper=wrap.querySelector('.im-wording__paper'),roller=wrap.querySelector('.im-wording__roller'),inner=wrap.querySelector('.im-wording__inner');
      wrap.classList.add('is-armed');wrap.classList.remove('is-open','is-settled');
      let progress=0,triggered=false;
      const render=(value)=>{
        progress=clamp(value);
        const closed=pxVar(wrap,'--im-scroll-closed'),open=pxVar(wrap,'--im-scroll-open'),rh=pxVar(wrap,'--im-scroll-roller-h');
        const paperH=paper.getBoundingClientRect().height,wrapH=wrap.getBoundingClientRect().height;
        const rollerBottom=(wrapH-closed)+(open-(wrapH-closed))*progress;
        const paperBottomInWrap=paper.offsetTop+paperH;
        const rollerTopInWrap=wrapH-rollerBottom-rh;
        const clipBottom=clamp(paperBottomInWrap-rollerTopInWrap,0,paperH);
        wrap.style.setProperty('--static-scroll-progress',progress.toFixed(4));
        paper.style.setProperty('clip-path',`inset(0 0 ${Math.max(0,clipBottom)}px 0)`,'important');
        paper.style.setProperty('transition','none','important');
        roller.style.setProperty('bottom',`${rollerBottom}px`,'important');
        roller.style.setProperty('transition','none','important');
        roller.style.setProperty('visibility','visible','important');
        if(inner){inner.style.setProperty('opacity','1','important');inner.style.setProperty('transition','none','important')}
        wrap.classList.toggle('is-open',progress>.005);
        if(progress>=1)wrap.classList.add('is-settled');
      };
      const playDrop=()=>{
        if(triggered)return;
        triggered=true;
        const duration=1250,startTime=performance.now(),from=progress;
        const easeOut=t=>1-Math.pow(1-t,3);
        const tick=now=>{
          const t=clamp((now-startTime)/duration);
          render(from+(1-from)*easeOut(t));
          if(t<1)requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };
      const checkTrigger=()=>{
        if(triggered)return;
        const rect=section.getBoundingClientRect(),vh=window.innerHeight||document.documentElement.clientHeight;
        if(rect.top<vh*.82)playDrop();
      };
      render(0);
      window.addEventListener('scroll',checkTrigger,{passive:true});
      window.addEventListener('resize',()=>{render(progress);checkTrigger()},{passive:true});
      checkTrigger();
    const els=[...document.querySelectorAll('[data-animate]')].filter(el=>el!==wrap&&el.dataset.animate!=='unroll');
    els.forEach(el=>{el.classList.add('static-animate-ready');el.style.transitionDelay=Number(el.dataset.animateDelay||0)+'s';el.style.transitionDuration=Number(el.dataset.animateDuration||.8)+'s'});
    if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('static-animate-in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -8% 0px'});els.forEach(el=>io.observe(el))}else els.forEach(el=>el.classList.add('static-animate-in'));
    document.querySelectorAll('[data-scroll-next-section]').forEach(btn=>btn.addEventListener('click',()=>btn.closest('section')?.nextElementSibling?.scrollIntoView({behavior:'smooth',block:'start'})));
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
