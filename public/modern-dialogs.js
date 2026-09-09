function studyDialog({title,description='',label='Nome',value='',placeholder='Digite um nome',confirmText='Salvar'}){
 return new Promise(resolve=>{
  const root=$('#dialogRoot');let settled=false;
  root.innerHTML=`<div class="dialog-backdrop"><form class="study-dialog" role="dialog" aria-modal="true" aria-labelledby="dialogTitle"><div class="dialog-icon">✦</div><div class="dialog-copy"><h2 id="dialogTitle">${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div><div class="field"><label for="dialogInput">${escapeHtml(label.toUpperCase())}</label><input id="dialogInput" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" maxlength="80" autocomplete="off"><small id="dialogError"></small></div><div class="dialog-actions"><button type="button" class="secondary" data-dialog-cancel>Cancelar</button><button class="primary">${escapeHtml(confirmText)}</button></div></form></div>`;
  const form=$('.study-dialog'),input=$('#dialogInput'),onKey=event=>{if(event.key==='Escape')close(null)};
  const close=result=>{if(settled)return;settled=true;document.removeEventListener('keydown',onKey);root.innerHTML='';resolve(result)};
  requestAnimationFrame(()=>{input.focus();input.select()});
  $('[data-dialog-cancel]').onclick=()=>close(null);
  $('.dialog-backdrop').onclick=event=>{if(event.target.classList.contains('dialog-backdrop'))close(null)};
  form.onsubmit=event=>{event.preventDefault();const next=input.value.trim().replace(/\s+/g,' ');if(!next){$('#dialogError').textContent='Digite um nome para continuar.';input.focus();return}close(next)};
  document.addEventListener('keydown',onKey);
 })
}

function studyConfirm({title,description,confirmText='Excluir'}){
 return new Promise(resolve=>{
  const root=$('#dialogRoot');let settled=false;
  root.innerHTML=`<div class="dialog-backdrop"><div class="study-dialog confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirmTitle"><div class="dialog-icon danger-icon">!</div><div class="dialog-copy"><h2 id="confirmTitle">${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div><div class="dialog-actions"><button type="button" class="secondary" data-dialog-cancel>Cancelar</button><button type="button" class="danger" data-dialog-confirm>${escapeHtml(confirmText)}</button></div></div></div>`;
  const onKey=event=>{if(event.key==='Escape')close(false)};
  const close=result=>{if(settled)return;settled=true;document.removeEventListener('keydown',onKey);root.innerHTML='';resolve(result)};
  $('[data-dialog-cancel]').onclick=()=>close(false);$('[data-dialog-confirm]').onclick=()=>close(true);
  $('.dialog-backdrop').onclick=event=>{if(event.target.classList.contains('dialog-backdrop'))close(false)};
  document.addEventListener('keydown',onKey);requestAnimationFrame(()=>$('[data-dialog-confirm]').focus());
 })
}

function duplicateName(items,name,ignore=''){return items.some(item=>String(item).toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')&&item!==ignore)}

document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-tree],#addArea,#addExamType,[data-exam-type]');if(!button)return;
 const treeAction=button.id==='addArea'?'add-area':button.dataset.tree,examAction=button.id==='addExamType'?'add-exam':button.dataset.examType;
 const supported=['add-area','add-subject','rename-area','delete-area','add-topic','rename-subject','delete-subject','rename-topic','delete-topic'].includes(treeAction)||['add-exam','rename','delete'].includes(examAction);
 if(!supported)return;
 event.preventDefault();event.stopImmediatePropagation();
 const id=button.dataset.id,index=Number(button.dataset.index),areaItem=db.knowledgeAreas.find(item=>item.id===id),subjectItem=db.subjects.find(item=>item.id===id);let name;
 if(treeAction==='add-area'){
  name=await studyDialog({title:'Nova categoria',description:'Crie uma área principal para organizar suas matérias.',label:'Nome da categoria',placeholder:'Ex.: Conhecimentos Específicos',confirmText:'Criar categoria'});
  if(name&&duplicateName(db.knowledgeAreas.map(item=>item.name),name))return toast('Já existe uma categoria com esse nome.');
  if(name)db.knowledgeAreas.push({id:'a'+Date.now(),name});
 }
 if(treeAction==='add-subject'&&areaItem){
  name=await studyDialog({title:'Adicionar matéria',description:`Ela será adicionada em “${areaItem.name}”.`,label:'Nome da matéria',placeholder:'Ex.: Direito Constitucional',confirmText:'Adicionar matéria'});
  if(name&&duplicateName(subjectsFor(id).map(item=>item.name),name))return toast('Essa matéria já existe na categoria.');
  if(name)db.subjects.push({id:'s'+Date.now(),areaId:id,name,color:['#6658d3','#159a83','#e59a52','#d96d55'][db.subjects.length%4],topics:[]});
 }
 if(treeAction==='rename-area'&&areaItem){name=await studyDialog({title:'Renomear categoria',description:'Os conteúdos vinculados serão preservados.',label:'Nome da categoria',value:areaItem.name,confirmText:'Salvar nome'});if(name&&duplicateName(db.knowledgeAreas.map(item=>item.name),name,areaItem.name))return toast('Já existe uma categoria com esse nome.');if(name)areaItem.name=name}
 if(treeAction==='delete-area'&&areaItem){const count=subjectsFor(id).length,confirmed=await studyConfirm({title:'Excluir categoria?',description:`“${areaItem.name}” e ${count} matéria(s) serão removidas. Os registros históricos serão preservados.`});if(!confirmed)return;db.knowledgeAreas=db.knowledgeAreas.filter(item=>item.id!==id);db.subjects=db.subjects.filter(item=>item.areaId!==id);name='deleted'}
 if(treeAction==='add-topic'&&subjectItem){name=await studyDialog({title:'Adicionar assunto',description:`Novo assunto em “${subjectItem.name}”.`,label:'Nome do assunto',placeholder:'Ex.: Juros compostos',confirmText:'Adicionar assunto'});if(name&&duplicateName(subjectItem.topics,name))return toast('Esse assunto já existe na matéria.');if(name)subjectItem.topics.push(name)}
 if(treeAction==='rename-subject'&&subjectItem){name=await studyDialog({title:'Renomear matéria',description:`Categoria: ${area(subjectItem.areaId).name}`,label:'Nome da matéria',value:subjectItem.name,confirmText:'Salvar nome'});if(name&&duplicateName(subjectsFor(subjectItem.areaId).map(item=>item.name),name,subjectItem.name))return toast('Essa matéria já existe na categoria.');if(name)subjectItem.name=name}
 if(treeAction==='delete-subject'&&subjectItem){const confirmed=await studyConfirm({title:'Excluir matéria?',description:`“${subjectItem.name}” e seus assuntos serão removidos. Os registros históricos serão preservados.`});if(!confirmed)return;db.subjects=db.subjects.filter(item=>item.id!==id);name='deleted'}
 if(treeAction==='rename-topic'&&subjectItem&&subjectItem.topics[index]!==undefined){const previous=subjectItem.topics[index];name=await studyDialog({title:'Renomear assunto',description:`Matéria: ${subjectItem.name}`,label:'Nome do assunto',value:previous,confirmText:'Salvar nome'});if(name&&duplicateName(subjectItem.topics,name,previous))return toast('Esse assunto já existe na matéria.');if(name){subjectItem.topics[index]=name;window.studyosExamLinks?.renameTopic?.(subjectItem.id,previous,name)}}
 if(treeAction==='delete-topic'&&subjectItem&&subjectItem.topics[index]!==undefined){const topic=subjectItem.topics[index],confirmed=await studyConfirm({title:'Excluir assunto?',description:`“${topic}” será removido da matéria. Os registros históricos serão preservados.`});if(!confirmed)return;window.studyosExamLinks?.removeTopic?.(subjectItem.id,topic);subjectItem.topics.splice(index,1);name='deleted'}
 if(examAction==='add-exam'){
  name=await studyDialog({title:'Novo tipo de prova',description:'Adicione um concurso, vestibular ou simulado próprio.',label:'Nome da prova',placeholder:'Ex.: OAB, CNU ou FUVEST',confirmText:'Adicionar prova'});
  if(name&&duplicateName(db.settings.examTypes,name))return toast('Esse tipo de prova já existe.');if(name)db.settings.examTypes.push(name);
 }
 if(examAction==='rename'){
  const previous=button.dataset.name;if(!db.settings.examTypes.includes(previous))return;
  name=await studyDialog({title:'Renomear tipo de prova',description:'As provas já cadastradas também serão atualizadas.',label:'Nome da prova',value:previous,confirmText:'Salvar nome'});
  if(name&&duplicateName(db.settings.examTypes,name,previous))return toast('Esse tipo de prova já existe.');
  if(name){db.settings.examTypes=db.settings.examTypes.map(item=>item===previous?name:item);db.exams.forEach(item=>{if(item.type===previous)item.type=name});if(db.settings.exam===previous)db.settings.exam=name;window.studyosExamLinks?.renameExamType?.(previous,name)}
 }
 if(examAction==='delete'){
  const previous=button.dataset.name;if(db.settings.examTypes.length===1)return toast('Mantenha pelo menos um tipo de prova.');
  const confirmed=await studyConfirm({title:'Excluir tipo de prova?',description:`“${previous}” sairá das opções. As provas já registradas serão preservadas.`});if(!confirmed)return;
  db.settings.examTypes=db.settings.examTypes.filter(item=>item!==previous);if(db.settings.exam===previous)db.settings.exam=db.settings.examTypes[0];window.studyosExamLinks?.removeExamType?.(previous);name='deleted';
 }
 if(name){await save();toast('Alteração salva');render()}
},true);
