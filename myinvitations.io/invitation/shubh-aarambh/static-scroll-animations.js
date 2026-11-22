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
      if(!paper||!roller)return;
      wrap.classList.add('is-armed');wrap.classList.remove('is-open','is-settled');
      let progress=0,triggered=false;
      const render=(value)=>{
        progress=clamp(value);
        const closed=pxVar(wrap,'--im-scroll-closed'),open=pxVar(wrap,'--im-scroll-open');
        const wrapRect=wrap.getBoundingClientRect(),paperRect=paper.getBoundingClientRect();
        const paperH=paperRect.height,wrapH=wrapRect.height,rollerH=roller.getBoundingClientRect().height;
        if(!paperH||!wrapH||!rollerH)return;
        // Animate the roller's bottom offset. The paper reveal boundary is then
        // derived from the roller's real top edge, so both remain geometrically
        // locked together throughout the animation.
        const startOffset=wrapH-closed;
        const bottomOffset=startOffset+(open-startOffset)*progress;
        // Set the roller first, then measure its actual rendered edge. This avoids
        // mixing the wrapper's coordinate space with the paper's coordinate space.
        roller.style.setProperty('bottom',`${bottomOffset}px`,'important');
        roller.style.setProperty('transition','none','important');
        roller.style.setProperty('visibility','visible','important');
        const actualRollerTop=roller.getBoundingClientRect().top;
        const revealEdge=clamp(actualRollerTop-paperRect.top,0,paperH);
        const clipBottom=paperH-revealEdge;
        wrap.style.setProperty('--static-scroll-progress',progress.toFixed(4));
        paper.style.setProperty('clip-path',`inset(0 0 ${clipBottom}px 0)`,'important');
        paper.style.setProperty('transition','none','important');
        if(inner){inner.style.setProperty('opacity',String(clamp(revealEdge/Math.max(1,paperH*.18))),'important');inner.style.setProperty('transition','none','important')}
        wrap.classList.toggle('is-open',progress>.005);
        if(progress>=1)wrap.classList.add('is-settled');
      };
      let dragging=false,dragStartY=0,dragStartProgress=0;
      let settleFrame=0;
      const animateTo=(target,duration=650)=>{
        if(settleFrame)cancelAnimationFrame(settleFrame);
        const from=progress,startTime=performance.now();
        const ease=t=>1-Math.pow(1-t,3);
        const tick=now=>{
          const t=clamp((now-startTime)/duration);
          render(from+(target-from)*ease(t));
          if(t<1)settleFrame=requestAnimationFrame(tick);
          else settleFrame=0;
        };
        settleFrame=requestAnimationFrame(tick);
      };
      const onPointerDown=e=>{
        if(progress>=1||triggered)return;
        dragging=true;dragStartY=e.clientY;dragStartProgress=progress;
        roller.setPointerCapture?.(e.pointerId);
        e.preventDefault();
      };
      const onPointerMove=e=>{
        if(!dragging)return;
        const distance=Math.max(0,e.clientY-dragStartY);
        const travel=Math.max(140,wrap.getBoundingClientRect().height*.72);
        render(dragStartProgress+distance/travel);
        e.preventDefault();
      };
      const onPointerUp=e=>{
        if(!dragging)return;
        dragging=false;
        const distance=Math.max(0,e.clientY-dragStartY);
        const travel=Math.max(140,wrap.getBoundingClientRect().height*.72);
        const draggedProgress=clamp(dragStartProgress+distance/travel);
        if(draggedProgress>=.28){
          triggered=true;animateTo(1,Math.max(350,700*(1-draggedProgress)));
        }else animateTo(0,450);
      };
      // The user must physically pull the scroll/roller down to reveal it.
      render(0);
      roller.style.setProperty('pointer-events','auto','important');
      roller.style.setProperty('cursor','grab','important');
      roller.style.setProperty('touch-action','none','important');
      roller.addEventListener('pointerdown',onPointerDown);
      roller.addEventListener('pointermove',onPointerMove);
      roller.addEventListener('pointerup',onPointerUp);
      roller.addEventListener('pointercancel',onPointerUp);
      window.addEventListener('resize',()=>{if(!triggered&&!dragging)render(progress)},{passive:true});
    }
    const els=[...document.querySelectorAll('[data-animate]')].filter(el=>el!==wrap&&el.dataset.animate!=='unroll');
    els.forEach(el=>{el.classList.add('static-animate-ready');el.style.transitionDelay=Number(el.dataset.animateDelay||0)+'s';el.style.transitionDuration=Number(el.dataset.animateDuration||.8)+'s'});
    if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('static-animate-in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -8% 0px'});els.forEach(el=>io.observe(el))}else els.forEach(el=>el.classList.add('static-animate-in'));
    document.querySelectorAll('[data-scroll-next-section]').forEach(btn=>btn.addEventListener('click',()=>btn.closest('section')?.nextElementSibling?.scrollIntoView({behavior:'smooth',block:'start'})));
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
