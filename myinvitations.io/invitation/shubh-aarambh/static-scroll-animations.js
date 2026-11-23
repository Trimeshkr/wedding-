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
        const actualRollerBottom=roller.getBoundingClientRect().bottom;
        // Reveal the parchment up to the roller's lower visible edge. Using the
        // top edge leaves the exposed paper tucked behind the roller and creates
        // the apparent gap/misalignment shown in the screenshot.
        const revealEdge=clamp(actualRollerBottom-paperRect.top,0,paperH);
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
      // Hero Scroll button should automatically open the framed invitation scroll.
      const heroScrollButton=document.querySelector('.im-hero-palace__scroll[data-scroll-next-section]');
      heroScrollButton?.addEventListener('click',e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        if(progress>=1)return;
        triggered=true;
        section.scrollIntoView({behavior:'smooth',block:'start'});
        setTimeout(()=>animateTo(1,1100),350);
      },true);
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
    // Fallback flip-calendar interaction for static exports where the original
    // page-flip library did not initialize (no .stf__item nodes are created).
    document.querySelectorAll('[data-flipcal-book]').forEach(book=>{
      const pages=[...book.querySelectorAll('[data-flipcal-page]')];
      if(!pages.length||book.dataset.staticFlipReady)return;
      if(book.querySelector('.stf__item'))return;
      book.dataset.staticFlipReady='true';
      const calendar=book.closest('.im-flipcal');
      const style=document.createElement('style');
      style.textContent=`
        [data-flipcal-book][data-static-flip-ready="true"]{position:absolute!important;inset:0!important;perspective:1600px}
        [data-flipcal-book][data-static-flip-ready="true"]>[data-flipcal-page]{display:none!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;right:auto!important;bottom:auto!important;transform:none!important;opacity:0;pointer-events:none;transition:opacity .28s ease,transform .48s cubic-bezier(.2,.7,.2,1)!important}
        [data-flipcal-book][data-static-flip-ready="true"]>[data-flipcal-page].static-flip-active{display:block!important;opacity:1;pointer-events:auto;transform:rotateY(0)!important;z-index:5}
        [data-flipcal-book][data-static-flip-ready="true"]>[data-flipcal-page].static-flip-out{display:block!important;opacity:0;pointer-events:none;transform:rotateY(-12deg)!important;z-index:4}
        [data-flipcal-book][data-static-flip-ready="true"] .im-flipcal__face{inset:0!important}
        [data-flipcal-book][data-static-flip-ready="true"] .im-flipcal__corner{display:inline-flex!important}
        [data-flipcal-book][data-static-flip-ready="true"] .im-flipcal__page--cover{cursor:pointer}
        [data-flipcal-book][data-static-flip-ready="true"] .im-flipcal__page:not(.im-flipcal__page--cover) .im-flipcal__content{max-width:90%;width:min(260px,90%)}
      `;
      document.head.appendChild(style);
      book.setAttribute('data-static-flip-ready','true');
      let current=0;
      const show=(next)=>{
        next=Math.max(0,Math.min(pages.length-1,next));
        const old=pages[current];
        pages.forEach((page,i)=>{
          page.classList.toggle('static-flip-active',i===next);
          page.classList.remove('static-flip-out');
          page.style.zIndex=i===next?'5':'1';
        });
        current=next;
        if(calendar){
          calendar.classList.toggle('is-front',current===0);
          calendar.classList.toggle('is-open',current>0);
          calendar.classList.toggle('is-single',true);
          const counter=calendar.querySelector('[data-flipcal-counter]');
          if(counter)counter.textContent=(current+1).toString().padStart(2,'0')+' / '+pages.length.toString().padStart(2,'0');
          const prev=calendar.querySelector('[data-flipcal-prev]');
          const nextBtn=calendar.querySelector('[data-flipcal-next]');
          if(prev)prev.disabled=current===0;
          if(nextBtn)nextBtn.disabled=current===pages.length-1;
        }
        pages[current].querySelectorAll('[data-flipcal-go]').forEach(btn=>{
          const dir=Number(btn.getAttribute('data-flipcal-go'));
          btn.textContent=dir<0?(current===1?'‹ Close':'‹ Previous'):(current===pages.length-1?'End ›':'Next ›');
          btn.setAttribute('data-flipcal-go',String(dir));
        });
      };
      pages.forEach((page,i)=>{
        page.addEventListener('click',e=>{
          if(i===0&&current===0&&!e.target.closest('a,button'))show(1);
        });
      });
      book.querySelectorAll('[data-flipcal-go]').forEach(btn=>btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();const dir=Number(btn.getAttribute('data-flipcal-go'));
        if(dir<0&&current===1)show(0);else show(current+dir);
      }));
      /* The round arrows live outside [data-flipcal-book], so bind them too. */
      if(calendar){
        calendar.querySelector('[data-flipcal-prev]')?.addEventListener('click',e=>{e.preventDefault();show(current-1);});
        calendar.querySelector('[data-flipcal-next]')?.addEventListener('click',e=>{e.preventDefault();show(current+1);});
      }
      show(0);
    });
    const els=[...document.querySelectorAll('[data-animate]')].filter(el=>el!==wrap&&el.dataset.animate!=='unroll');
    els.forEach(el=>{el.classList.add('static-animate-ready');el.style.transitionDelay=Number(el.dataset.animateDelay||0)+'s';el.style.transitionDuration=Number(el.dataset.animateDuration||.8)+'s'});
    if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('static-animate-in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -8% 0px'});els.forEach(el=>io.observe(el))}else els.forEach(el=>el.classList.add('static-animate-in'));
    document.querySelectorAll('[data-scroll-next-section]').forEach(btn=>btn.addEventListener('click',()=>btn.closest('section')?.nextElementSibling?.scrollIntoView({behavior:'smooth',block:'start'})));
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
