// Organização manual de matérias: reordenação e mudança de categoria.
(function(){
  const taxonomyTreeBase=taxonomyTree,taxonomyOrganizerSettings=settings;
  let topicsHidden=localStorage.getItem('studyos-taxonomy-topics')==='hidden';
  const normalizedName=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('pt-BR');
  const cloneSubjects=items=>(items||[]).map(item=>({...item,topics:[...(item.topics||[])]}));
  const examLinkBadge=(kind,id,topic='')=>window.studyosExamLinks?.badge?.(kind,id,topic)||'';
  const currentExamScope=()=>window.studyosExamLinks?.currentScope?.()||'all';
  const scopedSubjectsFor=areaId=>{const scope=currentExamScope();return scope==='all'?subjectsFor(areaId):(window.studyosExamLinks?.subjectsForExam?.(areaId,scope)||subjectsFor(areaId))};
  const scopedTopicsFor=subjectItem=>{const scope=currentExamScope(),topics=subjectItem.topics||[];return scope==='all'?topics:topics.filter(topic=>window.studyosExamLinks?.isTopicAvailable?.(subjectItem.id,topic,scope)!==false)};

  function reorderSubjects(items,subjectId,direction){
    const result=cloneSubjects(items),current=result.find(item=>item.id===subjectId);if(!current)return result;
    const siblings=result.filter(item=>item.areaId===current.areaId),position=siblings.findIndex(item=>item.id===subjectId),targetPosition=position+(direction==='up'?-1:1);if(position<0||targetPosition<0||targetPosition>=siblings.length)return result;
    const currentIndex=result.findIndex(item=>item.id===subjectId),targetIndex=result.findIndex(item=>item.id===siblings[targetPosition].id);[result[currentIndex],result[targetIndex]]=[result[targetIndex],result[currentIndex]];return result;
  }

  function moveSubjectToArea(items,subjectId,targetAreaId){
    const result=cloneSubjects(items),currentIndex=result.findIndex(item=>item.id===subjectId);if(currentIndex<0)return result;
    const [current]=result.splice(currentIndex,1);current.areaId=targetAreaId;let lastTarget=-1;result.forEach((item,index)=>{if(item.areaId===targetAreaId)lastTarget=index});if(lastTarget<0)result.push(current);else result.splice(lastTarget+1,0,current);return result;
  }

  function orderControls(subjectItem,index,total){
    const name=escapeHtml(subjectItem.name),id=escapeHtml(subjectItem.id),categoryDisabled=db.knowledgeAreas.length<2?'disabled':'';
    return `<div class="subject-organizer" aria-label="Organizar ${name}"><button type="button" data-taxonomy-order="up" data-id="${id}" title="Mover ${name} para cima" aria-label="Mover ${name} para cima" ${index===0?'disabled':''}>${svg('chevron')}</button><button type="button" class="order-down" data-taxonomy-order="down" data-id="${id}" title="Mover ${name} para baixo" aria-label="Mover ${name} para baixo" ${index===total-1?'disabled':''}>${svg('chevron')}</button><button type="button" class="move-category" data-taxonomy-order="category" data-id="${id}" title="Mover ${name} para outra categoria" ${categoryDisabled}>${svg('menu')}<span>Mover</span></button><button type="button" class="exam-link-button" data-exam-link="subject" data-id="${id}" title="Vincular ${name} a provas">${svg('exams')}<span>Provas</span></button></div>`;
  }

  taxonomyTree=function(){
    if(!Array.isArray(db?.knowledgeAreas)||!Array.isArray(db?.subjects))return taxonomyTreeBase();
    const scope=currentExamScope(),visibleAreas=db.knowledgeAreas.filter(areaItem=>scope==='all'||scopedSubjectsFor(areaItem.id).length);if(!visibleAreas.length)return`<div class="taxonomy-scope-empty">${svg('exams')}<strong>Nenhuma matéria nesta prova</strong><p>Abra “Todas as provas” e use o botão Provas para criar os vínculos.</p></div>`;
    return visibleAreas.map(areaItem=>{const areaSubjects=scopedSubjectsFor(areaItem.id);return `<div class="tree-area"><div class="tree-row area-row"><button class="tree-toggle" data-area-toggle aria-label="Recolher ${escapeHtml(areaItem.name)}" aria-expanded="true">⌄</button><span class="tree-icon">◫</span><strong>${escapeHtml(areaItem.name)}</strong><span class="tree-count">${areaSubjects.length} matérias</span><div class="row-actions"><button title="Adicionar matéria" data-tree="add-subject" data-id="${escapeHtml(areaItem.id)}">＋</button><button title="Renomear" data-tree="rename-area" data-id="${escapeHtml(areaItem.id)}">✎</button><button title="Excluir" data-tree="delete-area" data-id="${escapeHtml(areaItem.id)}">⌫</button></div></div><div class="tree-children">${areaSubjects.map((subjectItem,index)=>`<div class="tree-subject" data-subject-id="${escapeHtml(subjectItem.id)}"><div class="tree-row subject-row"><span class="branch">└</span><i class="subject-dot" style="background:${escapeHtml(subjectItem.color)}"></i><strong class="subject-name">${escapeHtml(subjectItem.name)}</strong><span class="tree-count">${scopedTopicsFor(subjectItem).length} assuntos</span>${examLinkBadge('subject',subjectItem.id)}${orderControls(subjectItem,index,areaSubjects.length)}<div class="row-actions"><button title="Adicionar assunto" data-tree="add-topic" data-id="${escapeHtml(subjectItem.id)}">＋</button><button title="Renomear" data-tree="rename-subject" data-id="${escapeHtml(subjectItem.id)}">✎</button><button title="Excluir" data-tree="delete-subject" data-id="${escapeHtml(subjectItem.id)}">⌫</button></div></div><div class="topic-list">${scopedTopicsFor(subjectItem).map(topic=>{const topicIndex=subjectItem.topics.indexOf(topic);return`<div class="topic-row"><span>•</span><span class="topic-label">${escapeHtml(topic)}</span>${examLinkBadge('topic',subjectItem.id,topic)}<div class="row-actions"><button title="Vincular assunto a provas" data-exam-link="topic" data-id="${escapeHtml(subjectItem.id)}" data-topic="${escapeHtml(topic)}">${svg('exams')}</button><button title="Renomear" data-tree="rename-topic" data-id="${escapeHtml(subjectItem.id)}" data-index="${topicIndex}">✎</button><button title="Excluir" data-tree="delete-topic" data-id="${escapeHtml(subjectItem.id)}" data-index="${topicIndex}">×</button></div></div>`}).join('')}</div></div>`).join('')}</div></div>`}).join('');
  };

  function visibilityButton(){
    return `<button type="button" class="secondary taxonomy-visibility-toggle ${topicsHidden?'closed':''}" id="toggleAllTopics" aria-expanded="${!topicsHidden}">${svg('chevron')}<span>${topicsHidden?'Mostrar todos os assuntos':'Ocultar todos os assuntos'}</span></button>`;
  }

  settings=function(){
    const html=taxonomyOrganizerSettings();if(settingsTab!=='taxonomy')return html;const topicTotal=db.subjects.reduce((sum,item)=>sum+(item.topics||[]).length,0);
    return html.replace('<div class="taxonomy-tree">',`<div class="taxonomy-view-toolbar"><div><b>Visualização da estrutura</b><small>${topicTotal} assuntos em ${db.subjects.length} matérias</small></div>${visibilityButton()}</div><div class="taxonomy-tree ${topicsHidden?'topics-hidden':''}">`);
  };

  function categoryDialog(subjectItem){
    const choices=db.knowledgeAreas.filter(item=>item.id!==subjectItem.areaId);if(!choices.length){toast('Crie outra categoria antes de mover a matéria.');return Promise.resolve(null)}
    return new Promise(resolve=>{
      const root=$('#dialogRoot');let settled=false;
      root.innerHTML=`<div class="dialog-backdrop"><form class="study-dialog move-subject-dialog" role="dialog" aria-modal="true" aria-labelledby="moveSubjectTitle"><div class="dialog-icon">${svg('menu')}</div><div class="dialog-copy"><h2 id="moveSubjectTitle">Mover matéria</h2><p>“${escapeHtml(subjectItem.name)}” e todos os seus ${subjectItem.topics.length} assunto(s) serão movidos juntos.</p></div><div class="move-subject-route"><span>${escapeHtml(area(subjectItem.areaId).name)}</span><b>→</b><span id="moveSubjectTargetLabel">${escapeHtml(choices[0].name)}</span></div><div class="field"><label for="moveSubjectCategory">NOVA CATEGORIA</label><select id="moveSubjectCategory">${choices.map(item=>`<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select><small id="moveSubjectError"></small></div><div class="dialog-actions"><button type="button" class="secondary" data-dialog-cancel>Cancelar</button><button class="primary">${svg('check')} Mover matéria</button></div></form></div>`;
      const form=$('.move-subject-dialog'),select=$('#moveSubjectCategory'),onKey=event=>{if(event.key==='Escape')close(null)},close=value=>{if(settled)return;settled=true;document.removeEventListener('keydown',onKey);root.innerHTML='';resolve(value)};
      select.onchange=()=>{$('#moveSubjectTargetLabel').textContent=area(select.value).name};$('[data-dialog-cancel]').onclick=()=>close(null);$('.dialog-backdrop').onclick=event=>{if(event.target.classList.contains('dialog-backdrop'))close(null)};form.onsubmit=event=>{event.preventDefault();close(select.value)};document.addEventListener('keydown',onKey);requestAnimationFrame(()=>select.focus());
    });
  }

  document.addEventListener('click',async event=>{
    const visibilityToggle=event.target.closest('#toggleAllTopics');if(visibilityToggle){event.preventDefault();event.stopImmediatePropagation();topicsHidden=!topicsHidden;localStorage.setItem('studyos-taxonomy-topics',topicsHidden?'hidden':'visible');$('.taxonomy-tree')?.classList.toggle('topics-hidden',topicsHidden);visibilityToggle.classList.toggle('closed',topicsHidden);visibilityToggle.setAttribute('aria-expanded',String(!topicsHidden));visibilityToggle.innerHTML=`${svg('chevron')}<span>${topicsHidden?'Mostrar todos os assuntos':'Ocultar todos os assuntos'}</span>`;return}
    const button=event.target.closest('[data-taxonomy-order]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();
    const subjectItem=db.subjects.find(item=>item.id===button.dataset.id);if(!subjectItem)return;const action=button.dataset.taxonomyOrder;
    if(action==='up'||action==='down'){
      const before=db.subjects.map(item=>item.id).join('|');db.subjects=reorderSubjects(db.subjects,subjectItem.id,action);if(before===db.subjects.map(item=>item.id).join('|'))return;await save();toast(`“${subjectItem.name}” movida para ${action==='up'?'cima':'baixo'}.`);render();return;
    }
    if(action==='category'){
      const targetAreaId=await categoryDialog(subjectItem);if(!targetAreaId||targetAreaId===subjectItem.areaId)return;const targetArea=db.knowledgeAreas.find(item=>item.id===targetAreaId);if(!targetArea)return;
      if(db.subjects.some(item=>item.areaId===targetAreaId&&item.id!==subjectItem.id&&normalizedName(item.name)===normalizedName(subjectItem.name)))return toast(`“${targetArea.name}” já possui uma matéria com esse nome.`);
      db.subjects=moveSubjectToArea(db.subjects,subjectItem.id,targetAreaId);await save();toast(`“${subjectItem.name}” e seus assuntos foram movidos para “${targetArea.name}”.`);render();
    }
  },true);

  window.studyosTaxonomyOrganizer={reorder:reorderSubjects,moveToArea:moveSubjectToArea};
})();
