const STUDY_PRESETS=[{focus:25,break:5,label:'Sprint',hint:'25 + 5'},{focus:50,break:10,label:'Profundo',hint:'50 + 10'},{focus:90,break:15,label:'Imersão',hint:'90 + 15'}];

function studyTopicOptions(subjectId,selected=''){
  const item=db.subjects.find(entry=>entry.id===subjectId),topics=item?.topics||[];
  if(!topics.length)return '<option value="">Sem assunto cadastrado</option>';
  return topics.map(topic=>`<option value="${escapeHtml(topic)}" ${topic===selected?'selected':''}>${escapeHtml(topic)}</option>`).join('');
}
function studyAreaOptions(selected=''){return db.knowledgeAreas.map(item=>{const count=subjectsFor(item.id).length;return `<option value="${escapeHtml(item.id)}" ${item.id===selected?'selected':''} ${count?'':'disabled'}>${escapeHtml(item.name)}${count?'':' · sem matérias'}</option>`}).join('')}
function studyClockText(){
  const seconds=remaining||((timerMode==='break'?pomo.breakMinutes:pomo.focusMinutes)||db.settings.studyMinutes)*60;
  return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}
function studyDateLabel(value){
  const parsed=new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime())?String(value||'Sem data'):new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(parsed);
}
function studyRecentSessions(){
  const recent=db.studySessions.slice().reverse().slice(0,8);
  if(!recent.length)return `<div class="study-empty-history"><span>◷</span><h3>Nenhuma sessão concluída ainda.</h3><p>Ao terminar um ciclo de foco, ele aparecerá automaticamente aqui.</p></div>`;
  return recent.map(item=>{const itemSubject=subject(item.subject);return `<article class="study-history-item"><span class="study-history-dot" style="--subject-color:${escapeHtml(itemSubject.color)}"></span><div class="study-history-name"><strong>${escapeHtml(itemSubject.name)}</strong><small>${escapeHtml(item.topic||'Estudo geral')}</small></div><div class="study-history-date">${escapeHtml(studyDateLabel(item.date))}</div><div class="study-history-duration"><strong>${fmt(item.minutes)}</strong><small>min</small></div></article>`}).join('');
}

function renderStudyNow(){
  if(!db.subjects.length)return `<section class="card empty setup-empty study-setup-empty"><span class="study-setup-icon">◷</span><h2>Prepare seu ambiente de foco</h2><p>Cadastre pelo menos uma matéria e seus assuntos para o Pomodoro registrar cada sessão no lugar certo.</p><button class="primary" data-page="settings">Configurar matérias</button></section><section class="card study-history-card"><div class="card-head"><div><h2>Histórico de sessões</h2><p class="head-copy">Seus ciclos concluídos aparecerão aqui.</p></div></div>${studyRecentSessions()}</section>`;
  const saved=db.subjects.find(item=>item.id===pomo.subject),selectedSubject=saved||db.subjects[0],selectedArea=db.knowledgeAreas.find(item=>item.id===selectedSubject.areaId)||db.knowledgeAreas[0],areaId=selectedArea?.id,areaSubjects=subjectsFor(areaId),subjectId=areaSubjects.some(item=>item.id===selectedSubject.id)?selectedSubject.id:areaSubjects[0]?.id||db.subjects[0].id,currentSubject=subject(subjectId),topic=currentSubject.topics.includes(pomo.topic)?pomo.topic:currentSubject.topics[0]||'';
  const todayKey=localDateValue(),todaySessions=db.studySessions.filter(item=>item.date===todayKey),todayMinutes=todaySessions.reduce((sum,item)=>sum+(Number(item.minutes)||0),0),weekStart=new Date();weekStart.setDate(weekStart.getDate()-6);const weekKey=localDateValue(weekStart),weekSessions=db.studySessions.filter(item=>item.date>=weekKey&&item.date<=todayKey),weekMinutes=weekSessions.reduce((sum,item)=>sum+(Number(item.minutes)||0),0),dayStats=studyDayStats(),average=db.studySessions.length?Math.round(db.studySessions.reduce((sum,item)=>sum+(Number(item.minutes)||0),0)/db.studySessions.length):0,dailyTarget=Math.max(1,(Number(pomo.focusMinutes)||db.settings.studyMinutes)*3),dailyProgress=Math.min(100,Math.round(todayMinutes/dailyTarget*100));
  const mode=timerMode==='break'?'break':'focus';
  return `<section class="study-now-hero">
    <div><span class="study-overline">CENTRAL DE FOCO</span><h2>Uma coisa por vez. Até terminar.</h2><p>Defina o conteúdo, inicie o ciclo e deixe o StudyOS cuidar do tempo e do registro.</p></div>
    <div class="study-today-progress"><div><span>FOCO DE HOJE</span><strong>${fmt(todayMinutes)} <small>min</small></strong></div><div class="study-today-track"><i style="width:${dailyProgress}%"></i></div><small>${fmt(todaySessions.length)} ciclo${todaySessions.length===1?'':'s'} concluído${todaySessions.length===1?'':'s'} · referência de ${fmt(dailyTarget)} min</small></div>
  </section>

  <section class="study-focus-grid">
    <article class="card study-focus-card" data-timer-mode="${mode}">
      <div class="study-timer-head"><span class="study-mode-badge" id="timerLabel">${mode==='focus'?'FOCO':'INTERVALO'}</span><span class="study-running-state ${pomo.running?'is-running':''}" id="studyRunningState"><i></i>${pomo.running?'Em andamento':'Pronto para começar'}</span></div>
      <div class="study-timer-stage">
        <div class="timer-ring" id="timerRing" style="--timer:100%"><div class="timer-time"><span id="timerText">${studyClockText()}</span><small id="studyTimerUnit">MINUTOS RESTANTES</small></div></div>
        <div class="study-mode-message"><h2 id="studyModeTitle">${mode==='focus'?'Hora de avançar':'Respire um pouco'}</h2><p id="studyModeHint">${mode==='focus'?'Mantenha apenas o material desta sessão aberto.':'Levante, beba água e descanse os olhos.'}</p></div>
        <div class="study-current-content"><span style="--subject-color:${escapeHtml(currentSubject.color)}"></span><div><small>ESTUDANDO AGORA</small><strong id="studyCurrentSubject">${escapeHtml(currentSubject.name)}</strong><p id="studyCurrentTopic">${escapeHtml(topic||'Estudo geral')}</p></div></div>
        <div class="timer-controls"><button class="secondary" id="resetTimer" type="button">↺ Reiniciar</button><button class="primary" id="toggleTimer" type="button">${pomo.running?'Ⅱ Pausar':'▶ Começar'}</button></div>
      </div>
      <div class="study-cycle-line" aria-label="Ciclo Pomodoro"><span class="active"><i>1</i>Foco</span><b></b><span><i>2</i>Intervalo</span><b></b><span><i>3</i>Recomeçar</span></div>
    </article>

    <aside class="card study-session-settings">
      <div class="card-head"><div><h2>Preparar sessão</h2><p class="head-copy">Escolha exatamente o que será estudado.</p></div><span class="study-settings-icon">⌁</span></div>
      <div class="field"><label>CATEGORIA PRINCIPAL</label><select id="timerArea">${studyAreaOptions(areaId)}</select></div>
      <div class="field"><label>MATÉRIA</label><select id="timerSubject">${options(subjectId,areaId)}</select></div>
      <div class="field"><label>ASSUNTO</label><select id="timerTopic">${studyTopicOptions(subjectId,topic)}</select></div>
      <div class="study-duration-grid"><div class="field"><label>FOCO (MIN)</label><input id="focusMinutes" type="number" min="1" max="480" value="${pomo.focusMinutes||db.settings.studyMinutes}"></div><div class="field"><label>INTERVALO (MIN)</label><input id="breakMinutes" type="number" min="1" max="120" value="${pomo.breakMinutes||db.settings.breakMinutes}"></div></div>
      <div class="study-preset-label">CICLOS RÁPIDOS</div><div class="study-presets">${STUDY_PRESETS.map(item=>`<button type="button" data-study-preset="${item.focus},${item.break}"><strong>${item.label}</strong><span>${item.hint} min</span></button>`).join('')}</div>
      <div class="study-auto-note"><span>✓</span><p>A sessão é salva automaticamente ao terminar o período de foco, mesmo que você esteja em outra aba.</p></div>
    </aside>
  </section>

  <section class="study-summary-grid">
    <article class="card study-week-card"><div class="card-head"><div><h2>Seu ritmo</h2><p class="head-copy">Resumo dos últimos sete dias.</p></div><span class="study-week-badge">7 DIAS</span></div><div class="study-week-metrics"><div><strong>${fmt(weekMinutes)}</strong><span>minutos focados</span></div><div><strong>${fmt(weekSessions.length)}</strong><span>sessões</span></div><div><strong>${fmt(dayStats.streak)}</strong><span>dias em sequência</span></div><div><strong>${fmt(average)}</strong><span>min por sessão</span></div></div><div class="study-week-insight"><span>→</span><p>${weekMinutes?`Você acumulou ${fmt(Math.floor(weekMinutes/60))}h${String(weekMinutes%60).padStart(2,'0')} de foco nesta semana.`:'Conclua seu primeiro ciclo para começar a construir consistência.'}</p></div></article>
    <article class="card study-history-card"><div class="card-head"><div><h2>Sessões recentes</h2><p class="head-copy">Registros concluídos automaticamente.</p></div><span class="study-history-count">${db.studySessions.length}</span></div><div class="study-history-list">${studyRecentSessions()}</div></article>
  </section>`;
}

const studyBaseUpdateTimer=updateTimer;
updateTimer=function(){
  studyBaseUpdateTimer();const root=document.querySelector('.study-focus-card');if(!root)return;const isBreak=timerMode==='break';root.dataset.timerMode=isBreak?'break':'focus';
  const title=document.querySelector('#studyModeTitle'),hint=document.querySelector('#studyModeHint'),state=document.querySelector('#studyRunningState');
  if(title)title.textContent=isBreak?'Respire um pouco':'Hora de avançar';if(hint)hint.textContent=isBreak?'Levante, beba água e descanse os olhos.':'Mantenha apenas o material desta sessão aberto.';
  if(state){state.innerHTML=`<i></i>${pomo.running?'Em andamento':'Pronto para começar'}`;state.classList.toggle('is-running',pomo.running)}
  const stages=root.querySelectorAll('.study-cycle-line span');stages.forEach((stage,index)=>stage.classList.toggle('active',isBreak?index===1:index===0));
};

const studyBaseBindTimer=bindTimer;
bindTimer=function(){
  studyBaseBindTimer();const areaSelect=document.querySelector('#timerArea'),subjectSelect=document.querySelector('#timerSubject'),topicSelect=document.querySelector('#timerTopic'),toggle=document.querySelector('#toggleTimer');if(!areaSelect||!subjectSelect||!topicSelect)return;
  const syncCurrent=()=>{const selected=subject(subjectSelect.value);document.querySelector('#studyCurrentSubject').textContent=selected.name;document.querySelector('#studyCurrentTopic').textContent=topicSelect.value||'Estudo geral';const marker=document.querySelector('.study-current-content>span');if(marker)marker.style.setProperty('--subject-color',selected.color)};
  const syncTopics=()=>{const selected=subject(subjectSelect.value),preferred=selected.topics.includes(pomo.topic)?pomo.topic:selected.topics[0]||'';topicSelect.innerHTML=studyTopicOptions(selected.id,preferred);pomo.subject=selected.id;pomo.topic=topicSelect.value;persistPomo();syncCurrent()};
  areaSelect.onchange=event=>{const list=subjectsFor(event.target.value);subjectSelect.innerHTML=options('',event.target.value);pomo.subject=list[0]?.id||'';pomo.topic='';syncTopics()};
  subjectSelect.onchange=()=>{pomo.topic='';syncTopics()};topicSelect.onchange=()=>{pomo.topic=topicSelect.value;persistPomo();syncCurrent()};
  const baseToggle=toggle.onclick;toggle.onclick=()=>{pomo.subject=subjectSelect.value;pomo.topic=topicSelect.value;persistPomo();baseToggle()};
  document.querySelectorAll('[data-study-preset]').forEach(button=>button.onclick=()=>{if(pomo.running)return toast('Pause a sessão antes de trocar o ciclo.');const [focus,rest]=button.dataset.studyPreset.split(',').map(Number),focusInput=document.querySelector('#focusMinutes'),breakInput=document.querySelector('#breakMinutes');focusInput.value=focus;breakInput.value=rest;focusInput.dispatchEvent(new Event('change',{bubbles:true}));breakInput.dispatchEvent(new Event('change',{bubbles:true}));document.querySelectorAll('[data-study-preset]').forEach(item=>item.classList.toggle('active',item===button));toast(`Ciclo ${focus} + ${rest} aplicado`)});
  syncTopics();updateTimer();
};

const studyBaseTick=tick;
tick=async function(){const completedBefore=db.studySessions.length;await studyBaseTick();if(page==='study'&&db.studySessions.length>completedBefore)render()};
