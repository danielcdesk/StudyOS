// Vínculos entre a estrutura curricular e os tipos de prova cadastrados.
(function(){
  const examLinksBaseBind=bind,examLinksBaseSave=save,examLinksBaseSettings=settings;
  const topicKey=topic=>encodeURIComponent(String(topic||''));
  let examScope=localStorage.getItem('studyos-taxonomy-exam-scope')||'';

  function ensureLinks(){
    if(!db?.settings)return{subjects:{},topics:{}};const validExams=new Set((db.settings.examTypes||[]).filter(item=>typeof item==='string')),validSubjects=new Set((db.subjects||[]).map(item=>String(item.id))),raw=db.settings.examLinks&&typeof db.settings.examLinks==='object'?db.settings.examLinks:{},links={subjects:{},topics:{}};
    const clean=value=>[...new Set((Array.isArray(value)?value:[]).filter(item=>typeof item==='string'&&validExams.has(item)))];
    if(raw.subjects&&typeof raw.subjects==='object')Object.entries(raw.subjects).forEach(([id,value])=>{const exams=clean(value);if(validSubjects.has(String(id))&&exams.length)links.subjects[id]=exams});
    if(raw.topics&&typeof raw.topics==='object')Object.entries(raw.topics).forEach(([id,topics])=>{if(!validSubjects.has(String(id))||!topics||typeof topics!=='object'||Array.isArray(topics))return;const subjectItem=db.subjects.find(item=>String(item.id)===String(id)),validTopics=new Set((subjectItem?.topics||[]).map(topicKey)),cleanTopics={};Object.entries(topics).forEach(([key,value])=>{const exams=clean(value);if(validTopics.has(key)&&exams.length)cleanTopics[key]=exams});if(Object.keys(cleanTopics).length)links.topics[id]=cleanTopics});
    db.settings.examLinks=links;return links;
  }

  const linkValues=(kind,id,topic='')=>{const links=ensureLinks();return kind==='topic'?[...(links.topics[id]?.[topicKey(topic)]||[])]:[...(links.subjects[id]||[])]};
  function setLinkValues(kind,id,topic,values){
    const links=ensureLinks(),clean=[...new Set(values.filter(value=>db.settings.examTypes.includes(value)))];
    if(kind==='subject'){if(clean.length)links.subjects[id]=clean;else delete links.subjects[id]}
    else{links.topics[id]??={};const key=topicKey(topic);if(clean.length)links.topics[id][key]=clean;else delete links.topics[id][key];if(!Object.keys(links.topics[id]).length)delete links.topics[id]}
  }

  function badge(kind,id,topic=''){
    const values=linkValues(kind,id,topic);if(!values.length)return'';const label=values.length<=2?values.join(' · '):`${values.slice(0,2).join(' · ')} +${values.length-2}`;
    return `<span class="exam-link-summary" title="Vinculada a ${escapeHtml(values.join(', '))}">${svg('exams')}<span>${escapeHtml(label)}</span></span>`;
  }

  function linkDialog(kind,subjectItem,topic=''){
    const current=new Set(linkValues(kind,subjectItem.id,topic)),isTopic=kind==='topic',title=isTopic?topic:subjectItem.name;
    return new Promise(resolve=>{
      const root=$('#dialogRoot');let settled=false;
      root.innerHTML=`<div class="dialog-backdrop"><form class="study-dialog exam-link-dialog" role="dialog" aria-modal="true" aria-labelledby="examLinkTitle"><div class="dialog-icon">${svg('exams')}</div><div class="dialog-copy"><h2 id="examLinkTitle">Vincular a provas</h2><p>${isTopic?'Assunto':'Matéria'}: “${escapeHtml(title)}”. Marque as provas em que este conteúdo será usado.</p></div><div class="exam-link-context"><span>${escapeHtml(subjectItem.name)}</span>${isTopic?`<b>›</b><span>${escapeHtml(topic)}</span>`:''}</div><fieldset class="exam-link-choices"><legend>PROVAS DISPONÍVEIS</legend>${db.settings.examTypes.map(value=>`<label><input type="checkbox" name="examLinkChoice" value="${escapeHtml(value)}" ${current.has(value)?'checked':''}><span><b>${escapeHtml(value)}</b><small>${value===db.settings.exam?'Prova principal':'Disponível no StudyOS'}</small></span></label>`).join('')}</fieldset><p class="exam-link-help">Se nenhuma prova for marcada, o conteúdo ficará disponível para todas.</p><div class="dialog-actions"><button type="button" class="secondary" data-dialog-cancel>Cancelar</button><button class="primary">${svg('check')} Salvar vínculos</button></div></form></div>`;
      const form=$('.exam-link-dialog'),onKey=event=>{if(event.key==='Escape')close(null)},close=value=>{if(settled)return;settled=true;document.removeEventListener('keydown',onKey);root.innerHTML='';resolve(value)};
      $('[data-dialog-cancel]').onclick=()=>close(null);$('.dialog-backdrop').onclick=event=>{if(event.target.classList.contains('dialog-backdrop'))close(null)};form.onsubmit=event=>{event.preventDefault();close([...form.querySelectorAll('[name="examLinkChoice"]:checked')].map(input=>input.value))};document.addEventListener('keydown',onKey);requestAnimationFrame(()=>form.querySelector('input')?.focus());
    });
  }

  const subjectAvailable=(subjectId,examType)=>{const values=linkValues('subject',subjectId);return!values.length||values.includes(examType)};
  const topicAvailable=(subjectId,topic,examType)=>{if(!subjectAvailable(subjectId,examType))return false;const values=linkValues('topic',subjectId,topic);return!values.length||values.includes(examType)};
  const subjectsForExam=(areaId,examType)=>db.subjects.filter(item=>(!areaId||item.areaId===areaId)&&subjectAvailable(item.id,examType));
  const subjectOptionsForExam=(areaId,examType,selected='')=>subjectsForExam(areaId,examType).map(item=>`<option value="${escapeHtml(item.id)}" ${item.id===selected?'selected':''}>${escapeHtml(item.name)}</option>`).join('');
  const areaOptionsForExam=(examType,selected='')=>db.knowledgeAreas.filter(item=>subjectsForExam(item.id,examType).length).map(item=>`<option value="${escapeHtml(item.id)}" ${item.id===selected?'selected':''}>${escapeHtml(item.name)}</option>`).join('');

  function currentScope(){const available=db.settings.examTypes||[];if(examScope==='all')return'all';if(available.includes(examScope))return examScope;return available.includes(db.settings.exam)?db.settings.exam:(available[0]||'all')}
  function setScope(value){examScope=value==='all'||db.settings.examTypes.includes(value)?value:'all';localStorage.setItem('studyos-taxonomy-exam-scope',examScope);return examScope}
  function scopePanel(){
    const selected=currentScope(),types=db.settings.examTypes||[],totalTopics=db.subjects.reduce((sum,item)=>sum+(item.topics||[]).length,0),selectedSubjects=selected==='all'?db.subjects:subjectsForExam('',selected),selectedTopics=selected==='all'?totalTopics:selectedSubjects.reduce((sum,item)=>sum+(item.topics||[]).filter(topic=>topicAvailable(item.id,topic,selected)).length,0);
    const buttons=[{value:'all',label:'Todas as provas',count:db.subjects.length},...types.map(value=>({value,label:value,count:subjectsForExam('',value).length}))];
    return `<section class="taxonomy-exam-scope"><div class="taxonomy-scope-heading"><span class="taxonomy-scope-icon">${svg('exams')}</span><div><span class="taxonomy-scope-overline">ORGANIZAÇÃO POR PROVA</span><h3>${selected==='all'?'Estrutura completa':escapeHtml(selected)}</h3><p>${selected==='all'?'Gerencie todas as matérias e seus vínculos.':'Exibindo matérias gerais e conteúdos vinculados a esta prova.'}</p></div><span class="taxonomy-scope-total"><b>${selectedSubjects.length}</b> matérias · <b>${selectedTopics}</b> assuntos</span></div><div class="taxonomy-scope-tabs" role="tablist" aria-label="Selecionar prova">${buttons.map(item=>`<button type="button" role="tab" data-exam-scope="${escapeHtml(item.value)}" aria-selected="${item.value===selected}" class="${item.value===selected?'active':''}"><span>${escapeHtml(item.label)}</span><b>${item.count}</b>${item.value===db.settings.exam?'<small>principal</small>':''}</button>`).join('')}</div><p class="taxonomy-scope-note">Conteúdos sem vínculo específico são comuns e aparecem em todas as provas.</p></section>`;
  }

  settings=function(){const html=examLinksBaseSettings();if(settingsTab!=='taxonomy')return html;return html.replace('<div class="taxonomy-view-toolbar">',`${scopePanel()}<div class="taxonomy-view-toolbar">`)};

  function bindExamPicker(){
    if(page!=='exams')return;const form=$('#examForm'),typeSelect=form?.querySelector('[name="type"]'),areaSelect=$('#examArea'),subjectSelect=$('#examSubject'),addButton=$('#addExamSubject'),rows=$('#examSubjectRows');if(!typeSelect||!areaSelect||!subjectSelect||!addButton)return;
    const refresh=(removeInvalid=false)=>{const examType=typeSelect.value,previousArea=areaSelect.value,availableAreas=db.knowledgeAreas.filter(item=>subjectsForExam(item.id,examType).length);areaSelect.innerHTML=areaOptionsForExam(examType,availableAreas.some(item=>item.id===previousArea)?previousArea:availableAreas[0]?.id);const areaId=areaSelect.value;subjectSelect.innerHTML=subjectOptionsForExam(areaId,examType);addButton.disabled=!subjectSelect.value;if(removeInvalid&&rows)rows.querySelectorAll('[data-exam-subject-row]').forEach(row=>{if(subjectAvailable(row.dataset.examSubjectRow,examType))return;const hidden=form.querySelector(`input[name="score_${CSS.escape(row.dataset.examSubjectRow)}"]`);if(hidden)hidden.value=0;row.remove()});if(rows&&!rows.querySelector('[data-exam-subject-row]'))rows.innerHTML='<div class="empty compact">Nenhuma matéria adicionada.</div>'};
    areaSelect.onchange=()=>{subjectSelect.innerHTML=subjectOptionsForExam(areaSelect.value,typeSelect.value);addButton.disabled=!subjectSelect.value};typeSelect.onchange=()=>refresh(true);refresh(false);
  }

  bind=function(){examLinksBaseBind();ensureLinks();bindExamPicker()};
  save=async function(){ensureLinks();return examLinksBaseSave()};

  function mapExamType(previous,next=''){
    const raw=db.settings.examLinks;if(!raw||typeof raw!=='object')return;const update=value=>[...new Set((Array.isArray(value)?value:[]).flatMap(item=>item===previous?(next?[next]:[]):[item]))];Object.keys(raw.subjects||{}).forEach(id=>raw.subjects[id]=update(raw.subjects[id]));Object.values(raw.topics||{}).forEach(topics=>Object.keys(topics||{}).forEach(key=>topics[key]=update(topics[key])));ensureLinks();
  }
  function renameTopic(subjectId,previous,next){const topics=db.settings.examLinks?.topics?.[subjectId];if(!topics)return;const previousKey=topicKey(previous),nextKey=topicKey(next);if(topics[previousKey]){topics[nextKey]=[...new Set([...(topics[nextKey]||[]),...topics[previousKey]])];delete topics[previousKey]}ensureLinks()}
  function removeTopic(subjectId,topic){const links=ensureLinks(),topics=links.topics[subjectId];if(!topics)return;delete topics[topicKey(topic)];if(!Object.keys(topics).length)delete links.topics[subjectId]}

  document.addEventListener('click',async event=>{
    const scopeButton=event.target.closest('[data-exam-scope]');if(scopeButton){event.preventDefault();event.stopImmediatePropagation();setScope(scopeButton.dataset.examScope);render();return}
    const button=event.target.closest('[data-exam-link]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();const subjectItem=db.subjects.find(item=>item.id===button.dataset.id);if(!subjectItem)return;const topic=button.dataset.topic||'',values=await linkDialog(button.dataset.examLink,subjectItem,topic);if(values===null)return;setLinkValues(button.dataset.examLink,subjectItem.id,topic,values);await save();toast(values.length?`Vínculo salvo com ${values.length} prova(s).`:'Conteúdo disponível para todas as provas.');render();
  },true);

  window.studyosExamLinks={badge,isSubjectAvailable:subjectAvailable,isTopicAvailable:topicAvailable,subjectsForExam,currentScope,setScope,renameExamType:(previous,next)=>mapExamType(previous,next),removeExamType:previous=>mapExamType(previous,''),renameTopic,removeTopic,ensure:ensureLinks};
})();
