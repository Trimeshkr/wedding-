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
      // Use a dedicated transparent drag target over the visible roller.
      // The artwork itself is a decorative background span and is unreliable as a hit target.
      const handle=document.createElement('div');
      handle.setAttribute('aria-label','Pull invitation scroll down');
      handle.setAttribute('role','slider');
      handle.setAttribute('aria-valuemin','0');
      handle.setAttribute('aria-valuemax','100');
      handle.setAttribute('aria-valuenow','0');
      handle.style.cssText='position:absolute;left:0;right:0;z-index:10;pointer-events:auto;cursor:grab;touch-action:none;background:transparent;';
      wrap.appendChild(handle);
      let dragging=false,dragStartY=0,dragStartProgress=0;
      let settleFrame=0;
      const positionHandle=()=>{
        const wr=wrap.getBoundingClientRect(),rr=roller.getBoundingClientRect();
        handle.style.top=(rr.top-wr.top)+'px';
        handle.style.height=Math.max(48,rr.height)+'px';
      };
      const animateTo=(target,duration=650)=>{
        if(settleFrame)cancelAnimationFrame(settleFrame);
        const from=progress,startTime=performance.now();
        const ease=t=>1-Math.pow(1-t,3);
        const tick=now=>{
          const t=clamp((now-startTime)/duration);
          render(from+(target-from)*ease(t));positionHandle();
          if(t<1)settleFrame=requestAnimationFrame(tick);
          else settleFrame=0;
        };
        settleFrame=requestAnimationFrame(tick);
      };
      const onPointerDown=e=>{
        if(progress>=1||triggered)return;
        dragging=true;dragStartY=e.clientY;dragStartProgress=progress;
        handle.setPointerCapture(e.pointerId);
        handle.style.cursor='grabbing';
        e.preventDefault();
      };
      const onPointerMove=e=>{
        if(!dragging)return;
        const distance=Math.max(0,e.clientY-dragStartY);
        const travel=Math.max(140,wrap.getBoundingClientRect().height*.72);
        render(dragStartProgress+distance/travel);positionHandle();
        handle.setAttribute('aria-valuenow',String(Math.round(progress*100)));
        e.preventDefault();
      };
      const onPointerUp=e=>{
        if(!dragging)return;
        dragging=false;handle.style.cursor='grab';
        const distance=Math.max(0,e.clientY-dragStartY);
        const travel=Math.max(140,wrap.getBoundingClientRect().height*.72);
        const draggedProgress=clamp(dragStartProgress+distance/travel);
        if(draggedProgress>=.28){
          triggered=true;animateTo(1,Math.max(350,700*(1-draggedProgress)));
        }else animateTo(0,450);
      };
      render(0);positionHandle();
      handle.addEventListener('pointerdown',onPointerDown);
      handle.addEventListener('pointermove',onPointerMove);
      handle.addEventListener('pointerup',onPointerUp);
      handle.addEventListener('pointercancel',onPointerUp);
      window.addEventListener('resize',()=>{if(!triggered&&!dragging){render(progress);positionHandle()}},{passive:true});
    }
    // Restore the actual Save-the-Date door-card pull interaction.
    // This is the visible PULL seal in the screenshot (data-door-pull-handle),
    // not the unrelated framed parchment unroll component.
    document.querySelectorAll('.im-door-countdown .im-door-card__card').forEach(card=>{
      const handle=card.querySelector('[data-door-pull-handle]');
      const pull=card.querySelector('.im-door-card__pull');
      const string=card.querySelector('.im-door-card__pull-string');
      if(!handle||card.dataset.staticDoorPullReady)return;
      card.dataset.staticDoorPullReady='true';
      let startY=0,dragging=false,pulled=0;
      const open=()=>{
        card.classList.add('is-open');
        card.classList.remove('is-pulling');
        handle.style.removeProperty('transform');
        if(string)string.style.removeProperty('height');
        handle.setAttribute('aria-valuenow','100');
      };
      const reset=()=>{
        card.classList.remove('is-pulling');
        handle.style.removeProperty('transform');
        if(string)string.style.removeProperty('height');
      };
      const down=e=>{
        if(card.classList.contains('is-open'))return;
        dragging=true;startY=e.clientY;pulled=0;
        handle.setPointerCapture?.(e.pointerId);
        card.classList.add('is-pulling');
        handle.style.transition='none';
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      };
      const move=e=>{
        if(!dragging)return;
        pulled=Math.max(0,e.clientY-startY);
        const maxPull=Math.min(card.getBoundingClientRect().height*.55,220);
        const amount=Math.min(pulled,maxPull);
        handle.style.transform=`translateY(${amount}px)`;
        if(string)string.style.height=`calc(56px + ${amount}px)`;
        card.style.setProperty('--im-pull-offset',amount+'px');
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      };
      const up=e=>{
        if(!dragging)return;
        dragging=false;
        const threshold=Math.max(48,card.getBoundingClientRect().height*.18);
        handle.style.transition='';
        if(pulled>=threshold){
          open();
        }else{
          reset();
        }
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      };
      handle.style.touchAction='none';
      handle.style.cursor='grab';
      handle.addEventListener('pointerdown',down,true);
      handle.addEventListener('pointermove',move,true);
      handle.addEventListener('pointerup',up,true);
      handle.addEventListener('pointercancel',up,true);
      handle.addEventListener('click',e=>{
        if(card.classList.contains('is-open'))return;
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      },true);
      handle.addEventListener('keydown',e=>{
        if(card.classList.contains('is-open'))return;
        if(e.key==='Enter'||e.key===' '||e.key==='ArrowDown'){
          e.preventDefault();open();
        }
      });
      handle.setAttribute('aria-valuemin','0');
      handle.setAttribute('aria-valuemax','100');
      handle.setAttribute('aria-valuenow','0');
      handle.setAttribute('role','slider');
    });
    // Reliable standalone countdown for the exported Save-the-Date card.
    document.querySelectorAll('.im-door-countdown__grid[data-countdown]').forEach(grid=>{
      if(grid.dataset.staticCountdownReady)return;
      grid.dataset.staticCountdownReady='true';
      const targetText=grid.getAttribute('data-countdown');
      const target=new Date(targetText);
      const days=grid.querySelector('[data-countdown-days]');
      const hours=grid.querySelector('[data-countdown-hours]');
      const mins=grid.querySelector('[data-countdown-mins]');
      const secs=grid.querySelector('[data-countdown-secs]');
      if(Number.isNaN(target.getTime())){console.warn('Invalid wedding countdown date:',targetText);return;}
      const pad=n=>String(n).padStart(2,'0');
      const update=()=>{
        let ms=Math.max(0,target.getTime()-Date.now());
        const total=Math.floor(ms/1000);
        const d=Math.floor(total/86400);
        const h=Math.floor((total%86400)/3600);
        const m=Math.floor((total%3600)/60);
        const s=total%60;
        if(days)days.textContent=pad(d);
        if(hours)hours.textContent=pad(h);
        if(mins)mins.textContent=pad(m);
        if(secs)secs.textContent=pad(s);
        grid.dataset.countdownComplete=ms<=0?'true':'false';
      };
      update();
      grid._staticCountdownTimer=setInterval(update,1000);
    });
    // Smooth 3D page-turn fallback for static exports where the original
    // page-flip library did not initialize (no .stf__item nodes are created).
    document.querySelectorAll('[data-flipcal-book]').forEach(book=>{
      const pages=[...book.querySelectorAll('[data-flipcal-page]')];
      if(!pages.length||book.dataset.staticFlipReady)return;
      if(book.querySelector('.stf__item'))return;
      book.dataset.staticFlipReady='true';
      const calendar=book.closest('.im-flipcal');
      const style=document.createElement('style');
      style.textContent=`
        [data-flipcal-book][data-static-flip-ready="true"]{position:absolute!important;inset:0!important;perspective:1800px;transform-style:preserve-3d}
        [data-flipcal-book][data-static-flip-ready="true"]>[data-flipcal-page]{display:none!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;right:auto!important;bottom:auto!important;opacity:0;pointer-events:none;transform:rotateY(0deg);transform-origin:left center;backface-visibility:hidden;transform-style:preserve-3d;transition:transform .78s cubic-bezier(.22,.61,.36,1),opacity .18s ease!important;will-change:transform;overflow:hidden}
        [data-flipcal-book][data-static-flip-ready="true"]>[data-flipcal-page].static-flip-active{display:block!important;opacity:1;pointer-events:auto;transform:rotateY(0deg)!important;z-index:5}
        [data-flipcal-book][data-static-flip-ready="true"]>[data-flipcal-page].static-flip-turning{display:block!important;opacity:1;pointer-events:none;z-index:8}
        [data-flipcal-book][data-static-flip-ready="true"]>[data-flipcal-page].static-flip-forward{transform:rotateY(-180deg)!important}
        [data-flipcal-book][data-static-flip-ready="true"]>[data-flipcal-page].static-flip-backward{transform:rotateY(180deg)!important;transform-origin:right center!important}
        [data-flipcal-book][data-static-flip-ready="true"] .im-flipcal__face{inset:0!important}
        [data-flipcal-book][data-static-flip-ready="true"] .im-flipcal__corner{display:inline-flex!important}
        [data-flipcal-book][data-static-flip-ready="true"] .im-flipcal__page--cover{cursor:pointer}
        [data-flipcal-book][data-static-flip-ready="true"] .im-flipcal__page:not(.im-flipcal__page--cover) .im-flipcal__content{max-width:90%;width:min(260px,90%)}
        [data-flipcal-book][data-static-flip-ready="true"] .im-flipcal__corner{z-index:12}
      `;
      document.head.appendChild(style);
      book.setAttribute('data-static-flip-ready','true');
      let current=0,busy=false;
      const updateButtons=()=>{
        pages.forEach(page=>page.querySelectorAll('[data-flipcal-go]').forEach(btn=>{
          const dir=Number(btn.getAttribute('data-flipcal-go'));
          btn.innerHTML=dir<0?(current===1?'&lsaquo; Back to Cover':'&lsaquo; Previous'):(current===pages.length-1?'Finish &rsaquo;':'Next &rsaquo;');
        }));
      };
      const show=(next,direction=1)=>{
        next=Math.max(0,Math.min(pages.length-1,next));
        if(next===current||busy)return;
        busy=true;
        const old=pages[current],incoming=pages[next];
        pages.forEach(page=>{page.classList.remove('static-flip-active','static-flip-turning','static-flip-forward','static-flip-backward');page.style.zIndex='1';});
        old.classList.add('static-flip-turning',direction>0?'static-flip-forward':'static-flip-backward');
        old.style.zIndex='8';
        incoming.classList.add('static-flip-active');
        incoming.style.zIndex='5';
        incoming.style.transform=direction>0?'rotateY(180deg)':'rotateY(-180deg)';
        incoming.style.opacity='1';
        incoming.style.pointerEvents='auto';
        current=next;
        if(calendar){calendar.classList.toggle('is-front',current===0);calendar.classList.toggle('is-open',current>0);calendar.classList.toggle('is-single',true);}
        updateButtons();
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          incoming.style.transform='rotateY(0deg)';
          old.classList.remove('static-flip-turning');
        }));
        window.setTimeout(()=>{
          old.classList.remove('static-flip-forward','static-flip-backward','static-flip-turning');
          old.style.zIndex='1';old.style.opacity='0';old.style.pointerEvents='none';
          old.style.transform='rotateY(0deg)';
          pages.forEach((page,i)=>{if(i!==current){page.classList.remove('static-flip-active');page.style.opacity='0';page.style.pointerEvents='none';page.style.zIndex='1';}});
          busy=false;
        },820);
      };
      pages.forEach((page,i)=>{
        page.addEventListener('click',e=>{
          if(i===0&&current===0&&!e.target.closest('a,button'))show(1,1);
        });
      });
      book.querySelectorAll('[data-flipcal-go]').forEach(btn=>btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        const dir=Number(btn.getAttribute('data-flipcal-go'));
        show(current+dir,dir);
      }));
      pages.forEach((page,i)=>{page.classList.toggle('static-flip-active',i===0);page.style.opacity=i===0?'1':'0';page.style.pointerEvents=i===0?'auto':'none';page.style.zIndex=i===0?'5':'1';});
      updateButtons();
    });
    const els=[...document.querySelectorAll('[data-animate]')].filter(el=>el!==wrap&&el.dataset.animate!=='unroll');
    els.forEach(el=>{el.classList.add('static-animate-ready');el.style.transitionDelay=Number(el.dataset.animateDelay||0)+'s';el.style.transitionDuration=Number(el.dataset.animateDuration||.8)+'s'});
    if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('static-animate-in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -8% 0px'});els.forEach(el=>io.observe(el))}else els.forEach(el=>el.classList.add('static-animate-in'));
    document.querySelectorAll('[data-scroll-next-section]').forEach(btn=>btn.addEventListener('click',()=>btn.closest('section')?.nextElementSibling?.scrollIntoView({behavior:'smooth',block:'start'})));
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
