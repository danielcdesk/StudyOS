// Theme motion: the new light expands from the control that triggered it.
const themeRoot=document.documentElement;
const themeToggle=$('#themeBtn');
const themeMeta=document.querySelector('meta[name="theme-color"]');
const reducedThemeMotion=matchMedia('(prefers-reduced-motion: reduce)');
let themeTransitionRunning=false;

function currentTheme(){return themeRoot.classList.contains('dark')?'dark':'light'}
function syncThemeChrome(){
 const dark=currentTheme()==='dark';
 document.body.classList.toggle('dark',dark);
 themeRoot.style.colorScheme=dark?'dark':'light';
 if(themeMeta)themeMeta.content=dark?'#14151b':'#f6f7f9';
 if(themeToggle){
  themeToggle.title=dark?'Ativar modo claro':'Ativar modo escuro';
  themeToggle.setAttribute('aria-label',themeToggle.title);
  themeToggle.setAttribute('aria-pressed',String(dark));
 }
}
function applyTheme(next){
 themeRoot.classList.toggle('dark',next==='dark');
 document.body.classList.toggle('dark',next==='dark');
 localStorage.setItem('studyos-theme',next);
 syncThemeChrome();
}
function themeOrigin(event){
 const rect=themeToggle.getBoundingClientRect();
 const keyboard=event?.detail===0;
 const x=keyboard||!Number.isFinite(event?.clientX)?rect.left+rect.width/2:event.clientX;
 const y=keyboard||!Number.isFinite(event?.clientY)?rect.top+rect.height/2:event.clientY;
 const radius=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
 themeRoot.style.setProperty('--theme-x',`${Math.round(x)}px`);
 themeRoot.style.setProperty('--theme-y',`${Math.round(y)}px`);
 themeRoot.style.setProperty('--theme-radius',`${Math.ceil(radius)}px`);
}
function finishThemeTransition(){
 themeTransitionRunning=false;
 themeRoot.classList.remove('theme-changing','theme-fallback');
 delete themeRoot.dataset.themeTarget;
 themeToggle.classList.remove('switching');
 themeToggle.removeAttribute('aria-busy');
}

syncThemeChrome();
themeToggle.onclick=event=>{
 if(themeTransitionRunning)return;
 themeTransitionRunning=true;
 const next=currentTheme()==='dark'?'light':'dark';
 themeOrigin(event);
 themeRoot.dataset.themeTarget=next;
 themeRoot.classList.add('theme-changing');
 themeToggle.classList.add('switching');
 themeToggle.setAttribute('aria-busy','true');

 if(reducedThemeMotion.matches||!motionEnabled||typeof document.startViewTransition!=='function'){
  themeRoot.classList.add('theme-fallback');
  requestAnimationFrame(()=>applyTheme(next));
  setTimeout(finishThemeTransition,reducedThemeMotion.matches||!motionEnabled?40:480);
  return;
 }

 const transition=document.startViewTransition(()=>applyTheme(next));
 transition.finished.catch(()=>{}).finally(finishThemeTransition);
};
