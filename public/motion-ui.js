var motionEnabled=localStorage.getItem('studyos-motion')!=='off';
document.body.classList.toggle('motion-enabled',motionEnabled);
document.body.classList.toggle('motion-disabled',!motionEnabled);
var motionSettingsBase=settings,motionBindBase=bind;
settings=function(){let html=motionSettingsBase();const control=`<div class="motion-setting"><div><strong>Animações da interface</strong><p class="head-copy">Movimentos suaves ao navegar, abrir cards e visualizar gráficos.</p></div><label class="switch"><input id="motionEnabled" type="checkbox" ${motionEnabled?'checked':''}><span></span></label></div>`;return html.replace('<div class="settings-divider"></div><div class="card-head"><div><h2>Tipos de prova</h2>',`<div class="settings-divider"></div>${control}<div class="settings-divider"></div><div class="card-head"><div><h2>Tipos de prova</h2>`)};
bind=function(){motionBindBase();const toggle=$('#motionEnabled');if(toggle)toggle.onchange=()=>{motionEnabled=toggle.checked;localStorage.setItem('studyos-motion',motionEnabled?'on':'off');document.body.classList.toggle('motion-enabled',motionEnabled);document.body.classList.toggle('motion-disabled',!motionEnabled)}};
