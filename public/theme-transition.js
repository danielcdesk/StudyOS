const savedTheme=localStorage.getItem('studyos-theme');
if(savedTheme==='dark')document.body.classList.add('dark');
if(savedTheme==='light')document.body.classList.remove('dark');
const themeToggle=$('#themeBtn');
themeToggle.onclick=()=>{
 const change=()=>{document.body.classList.toggle('dark');localStorage.setItem('studyos-theme',document.body.classList.contains('dark')?'dark':'light')};
 themeToggle.classList.add('switching');
 document.body.classList.add('theme-changing');
 change();
 setTimeout(()=>{document.body.classList.remove('theme-changing');themeToggle.classList.remove('switching')},420)
};

/* Estilos editoriais e microinterações sem bibliotecas ou renderização contínua. */
(()=>{
 const root=document.documentElement,body=document.body,themeMeta=document.querySelector('meta[name="theme-color"]');
 const visualStyles=document.createElement('link');
 visualStyles.rel='stylesheet';visualStyles.href='studyos-visual.css?v=2';document.head.appendChild(visualStyles);
 const choices=['classic','library','midnight'];
 const themeNames={classic:'Clássico',library:'Biblioteca',midnight:'Meia-noite'};
 const currentPreset=()=>choices.includes(body.dataset.visualTheme)?body.dataset.visualTheme:'classic';
 const isDark=()=>root.classList.contains('dark')||body.classList.contains('dark');
 function syncControl(preset){
  if(!themeToggle)return;
  const label=preset==='classic'?(isDark()?'Ativar modo claro':'Ativar modo escuro'):`Voltar ao tema Clássico a partir de ${themeNames[preset]}`;
  themeToggle.title=label;themeToggle.setAttribute('aria-label',label);themeToggle.setAttribute('aria-pressed',String(isDark()));
 }
 function applyPreset(preset,mode){
  const selected=choices.includes(preset)?preset:'classic';
  root.dataset.visualTheme=selected;body.dataset.visualTheme=selected;
  if(selected==='classic'){
   const savedMode=mode||db?.settings?.classicMode||(localStorage.getItem('studyos-theme')==='dark'?'dark':isDark()?'dark':'light');
   const dark=savedMode==='dark';root.classList.toggle('dark',dark);body.classList.toggle('dark',dark);
   root.style.colorScheme=dark?'dark':'light';localStorage.setItem('studyos-theme',dark?'dark':'light');
   if(typeof syncThemeChrome==='function')syncThemeChrome();
   if(themeMeta)themeMeta.content=dark?'#14151b':'#f6f7f9';
  }else{
   root.classList.add('dark');body.classList.add('dark');root.style.colorScheme='dark';
   if(typeof syncThemeChrome==='function')syncThemeChrome();
   if(themeMeta)themeMeta.content=selected==='library'?'#191714':'#08111f';
  }
  syncControl(selected);
 }
 function themeChoices(){
  const selected=choices.includes(db.settings.visualTheme)?db.settings.visualTheme:'classic';
  const cards=[
   ['classic','Clássico','Tema atual, com modo claro/escuro e as cinco paletas.'],
   ['library','Biblioteca','Café, papel e dourado — sempre em modo escuro.'],
   ['midnight','Meia-noite','Azul profundo e frio, com brilho discreto.']
  ];
  return `<div class="settings-divider visual-theme-divider"></div><section class="visual-theme-settings" aria-labelledby="visualThemeTitle"><div class="card-head"><div><h2 id="visualThemeTitle">Estilo visual</h2><p class="head-copy">Escolha uma identidade. Suas paletas continuam disponíveis no tema Clássico.</p></div><span class="visual-theme-overline">3 TEMAS</span></div><div class="visual-theme-grid" role="radiogroup" aria-label="Estilo visual do StudyOS">${cards.map(([id,name,description])=>`<button type="button" class="visual-theme-card ${selected===id?'selected':''}" role="radio" aria-checked="${selected===id}" data-visual-theme="${id}"><span class="visual-theme-preview preview-${id}" aria-hidden="true"><i></i><i></i><i></i></span><span class="visual-theme-copy"><strong>${name}</strong><small>${description}</small></span><span class="visual-theme-mark" aria-hidden="true">${selected===id?'✓':''}</span></button>`).join('')}</div><p class="visual-theme-note">Biblioteca e Meia-noite ficam escuros; o botão de luz no topo retorna ao tema Clássico.</p></section>`;
 }
 const baseSettings=window.settings;
 if(typeof baseSettings==='function')window.settings=function(...args){
  const html=baseSettings.apply(this,args),marker='<div class="form-actions"><button class="primary">Salvar alterações</button></div>';
  return html.includes(marker)?html.replace(marker,`${themeChoices()}${marker}`):html;
 };
 async function selectPreset(preset,mode){
  if(!choices.includes(preset)||!db?.settings)return;
  const previous={preset:currentPreset(),classicMode:db.settings.classicMode};
  if(preset===previous.preset&&!mode)return;
  if(preset!=='classic'&&previous.preset==='classic')db.settings.classicMode=isDark()?'dark':'light';
  if(preset==='classic'&&mode)db.settings.classicMode=mode;
  db.settings.visualTheme=preset;applyPreset(preset,mode);
  try{await save();render()}catch(error){db.settings.visualTheme=previous.preset;db.settings.classicMode=previous.classicMode;applyPreset(previous.preset,previous.classicMode);console.error(error);toast('Não foi possível salvar a aparência. Tente novamente.')}
 }
 const originalThemeClick=themeToggle?.onclick;
 if(themeToggle)themeToggle.onclick=event=>{
  if(currentPreset()!=='classic')return selectPreset('classic','light');
  if(typeof window.applyTheme==='function'&&typeof window.currentTheme==='function'){
   const result=originalThemeClick?.call(themeToggle,event);
   setTimeout(()=>{if(!db?.settings)return;db.settings.classicMode=isDark()?'dark':'light';save().catch(error=>console.error('Não foi possível salvar o modo de cor.',error))},520);
   return result;
  }
  const next=isDark()?'light':'dark';applyPreset('classic',next);
  if(db?.settings){db.settings.classicMode=next;save().catch(error=>console.error('Não foi possível salvar o modo de cor.',error))}
 };
 document.addEventListener('click',event=>{
  const button=event.target instanceof Element?event.target.closest('[data-visual-theme]'):null;
  if(button)selectPreset(button.dataset.visualTheme);
 });
 window.addEventListener('studyos:ready',()=>applyPreset(db.settings.visualTheme));
 document.querySelectorAll('.ecosystem-label,.ecosystem-module').forEach(item=>item.remove());
})();
