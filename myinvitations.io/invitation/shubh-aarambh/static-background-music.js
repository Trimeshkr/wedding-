/* Wedding background music: starts only after the intro cover/envelope finishes opening. */
(() => {
  function init() {
    if (document.querySelector('[data-wedding-music-control]')) return;
    const audio = new Audio('./assets/music/ishq-hai.mp3');
    audio.loop = true; audio.preload = 'none'; audio.volume = 0;
    const button = document.createElement('button');
    button.type = 'button'; button.setAttribute('data-wedding-music-control','');
    button.setAttribute('aria-label','Play wedding music'); button.setAttribute('aria-pressed','false');
    button.innerHTML = '<span class="wedding-music-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></span><span class="wedding-music-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
    button.style.cssText='position:fixed;right:20px;bottom:20px;z-index:99999;width:54px;height:54px;border-radius:50%;border:1px solid rgba(201,165,93,.65);background:rgba(58,15,22,.92);color:#f2dca5;box-shadow:0 8px 28px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;gap:3px;cursor:pointer;backdrop-filter:blur(8px)';
    const style=document.createElement('style');
    style.textContent='[data-wedding-music-control] svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}[data-wedding-music-control] .wedding-music-bars{display:none;align-items:center;gap:2px;height:16px}[data-wedding-music-control] .wedding-music-bars i{display:block;width:2px;height:4px;background:currentColor;border-radius:2px}[data-wedding-music-control].is-playing .wedding-music-bars{display:flex}[data-wedding-music-control].is-playing .wedding-music-icon{display:none}[data-wedding-music-control].is-playing .wedding-music-bars i{animation:wedding-music-wave .75s ease-in-out infinite alternate}[data-wedding-music-control].is-playing .wedding-music-bars i:nth-child(2){animation-delay:.2s}[data-wedding-music-control].is-playing .wedding-music-bars i:nth-child(3){animation-delay:.4s}[data-wedding-music-control].is-playing .wedding-music-bars i:nth-child(4){animation-delay:.1s}@keyframes wedding-music-wave{from{height:4px}to{height:15px}}@media(max-width:600px){[data-wedding-music-control]{right:14px!important;bottom:14px!important;width:48px!important;height:48px!important}}';
    document.head.appendChild(style); document.body.appendChild(button);
    let coverOpened=false;
    async function playMusic(){
      coverOpened=true;
      try{await audio.play();button.classList.add('is-playing');button.setAttribute('aria-pressed','true');button.setAttribute('aria-label','Pause wedding music');
        const fade=setInterval(()=>{if(audio.paused||audio.volume>=.72){clearInterval(fade);return;}audio.volume=Math.min(.72,audio.volume+.04);},120);
      }catch(e){button.setAttribute('aria-label','Play wedding music');}
    }
    document.addEventListener('iw:cover-opened',playMusic,{once:true});
    button.addEventListener('click',async()=>{if(audio.paused){if(!coverOpened)return;await playMusic();}else{audio.pause();button.classList.remove('is-playing');button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','Play wedding music');}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
