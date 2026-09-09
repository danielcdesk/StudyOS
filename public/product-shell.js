(()=>{
  const root=document.documentElement;
  const body=document.body;
  const themeMeta=document.querySelector('meta[name="theme-color"]');
  const pageButtons=()=>[...document.querySelectorAll('[data-page]')];

  function syncShell(){
    const active=document.querySelector('#nav [data-page].active,.settings-link.active');
    const current=active?.dataset.page||'dashboard';
    body.dataset.currentPage=current;
    pageButtons().forEach(button=>{
      const selected=button.dataset.page===current;
      button.toggleAttribute('aria-current',selected);
      if(selected) button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
      const label=button.textContent.trim().replace(/\s+/g,' ');
      if(label&&!button.title) button.title=label;
    });
    const dark=root.classList.contains('dark')||body.classList.contains('dark');
    if(themeMeta) themeMeta.content=dark?'#15171d':'#f4f6f8';
  }

  const app=document.querySelector('#app');
  if(app) new MutationObserver(syncShell).observe(app,{childList:true});
  new MutationObserver(syncShell).observe(root,{attributes:true,attributeFilter:['class']});
  new MutationObserver(syncShell).observe(body,{attributes:true,attributeFilter:['class','data-palette']});
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-page],#themeBtn,.palette-option')) requestAnimationFrame(syncShell);
  });
  addEventListener('scroll',()=>body.classList.toggle('page-scrolled',scrollY>18),{passive:true});

  const themeButton=document.querySelector('#themeBtn');
  themeButton?.setAttribute('aria-label','Alternar tema claro e escuro');
  document.querySelector('#mobileMenu')?.setAttribute('aria-label','Abrir menu de navegação');
  syncShell();
})();
