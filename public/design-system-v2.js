// StudyOS design system v2: navigation, accessibility and consistent feedback.
var designRenderBase=render,designBindBase=bind;
function formatToday(){const d=new Date(),weekday=d.toLocaleDateString('pt-BR',{weekday:'long'}),date=d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'});return `${weekday}, ${date}`.toUpperCase()}
function decorateUI(){
 document.body.classList.toggle('sidebar-collapsed',localStorage.getItem('studyos-sidebar')==='collapsed');
 const main=document.querySelector('main');if(main){main.id='main-content';main.setAttribute('tabindex','-1')}
 const eyebrow=$('#eyebrow');if(eyebrow)eyebrow.textContent=formatToday();
 const toastEl=$('#toast');if(toastEl){toastEl.setAttribute('role','status');toastEl.setAttribute('aria-live','polite')}
 $$('#nav button,.settings-link').forEach(b=>{const label=b.querySelector('span')?.textContent?.trim();if(label){b.title=label;b.setAttribute('aria-label',label)}});
 $$('.icon-btn').forEach(b=>{if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',b.id==='themeBtn'?'Alternar tema':'Ação')});
 $$('button[title]').forEach(button=>{if(!button.getAttribute('aria-label'))button.setAttribute('aria-label',button.title)});
 $$('table').forEach(t=>{if(!t.parentElement.classList.contains('table-shell')){const shell=document.createElement('div');shell.className='table-shell';t.parentNode.insertBefore(shell,t);shell.appendChild(t)}});
 let fieldIndex=0;$$('.field input,.field select,.field textarea').forEach(el=>{const field=el.closest('.field'),label=field?.querySelector('label');if(label&&!label.contains(el)){if(!el.id)el.id=`studyos-field-${page}-${fieldIndex++}`;label.htmlFor=el.id}if(label&&!el.getAttribute('aria-label'))el.setAttribute('aria-label',label.textContent.trim());if(el.tagName==='INPUT'&&!el.hasAttribute('autocomplete')&&!['date','file','checkbox','radio','number'].includes(el.type))el.autocomplete='off'});
 $$('.avatar img').forEach(image=>{image.width=34;image.height=34});$$('.profile-preview img').forEach(image=>{image.width=72;image.height=72});
 $$('.card').forEach(card=>{if(card.querySelector('.card-head')||card.classList.contains('metric'))card.classList.add('surface-card')});
}
function ensureGlobalUI(){
 if(!$('.skip-link'))document.body.insertAdjacentHTML('afterbegin','<a class="skip-link" href="#main-content">Pular para o conteúdo</a>');
 const sidebar=$('.sidebar');if(sidebar&&!$('#sidebarCollapse')){const button=document.createElement('button'),collapsed=localStorage.getItem('studyos-sidebar')==='collapsed';button.id='sidebarCollapse';button.className='sidebar-collapse';button.type='button';button.setAttribute('aria-label',collapsed?'Expandir menu lateral':'Recolher menu lateral');button.setAttribute('aria-controls','studySidebar');button.setAttribute('aria-expanded',String(!collapsed));button.innerHTML='<span aria-hidden="true">‹</span>';sidebar.insertBefore(button,$('.profile'));button.onclick=()=>{const nextCollapsed=document.body.classList.toggle('sidebar-collapsed');localStorage.setItem('studyos-sidebar',nextCollapsed?'collapsed':'expanded');button.setAttribute('aria-label',nextCollapsed?'Expandir menu lateral':'Recolher menu lateral');button.setAttribute('aria-expanded',String(!nextCollapsed))}}
}
render=function(){designRenderBase();decorateUI()};
bind=function(){designBindBase();decorateUI()};
document.addEventListener('click',e=>{const nav=e.target.closest('[data-page]');if(nav&&innerWidth<760)setTimeout(()=>window.scrollTo({top:0,behavior:motionEnabled?'smooth':'auto'}),30)});
window.addEventListener('load',()=>{ensureGlobalUI();decorateUI()});
ensureGlobalUI();decorateUI();
