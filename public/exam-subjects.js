// Hierarchical subject picker for exams. Kept separate to preserve existing records.
const originalGenericForm=genericForm,originalBind=bind;
genericForm=function(kind){
  let html=originalGenericForm(kind);
  if(kind!=='exams')return html;
  const hidden=db.subjects.map(s=>`<input type="hidden" name="score_${s.id}" value="0">`).join('');
  const firstArea=usableArea();
  const picker=`<div class="exam-subject-builder">${hidden}<div class="builder-head"><div><strong>Desempenho por matéria</strong><p class="head-copy">Escolha a categoria e adicione apenas as matérias desta prova.</p></div></div><div class="builder-controls"><div class="field"><label>CATEGORIA PRINCIPAL</label><select id="examArea">${areaOptions(firstArea?.id)}</select></div><div class="field"><label>MATÉRIA</label><select id="examSubject">${options('',firstArea?.id)}</select></div><button type="button" class="secondary" id="addExamSubject" ${db.subjects.length?'':'disabled'}>＋ Adicionar</button></div><div id="examSubjectRows" class="exam-subject-rows"><div class="empty compact">Nenhuma matéria adicionada.</div></div></div>`;
  let inserted=false;
  html=html.replace(/<div class="field"><label>ACERTOS — [\s\S]*?<\/div>/g,()=>{if(inserted)return'';inserted=true;return picker});
  return html;
};
bind=function(){
  originalBind();
  const areaSelect=$('#examArea'),subjectSelect=$('#examSubject'),addButton=$('#addExamSubject'),rows=$('#examSubjectRows');
  if(!areaSelect||!subjectSelect||!addButton||!rows)return;
  areaSelect.onchange=()=>{subjectSelect.innerHTML=options('',areaSelect.value);addButton.disabled=!subjectSelect.value};
  addButton.onclick=()=>{
    const id=subjectSelect.value;if(!id)return toast('Escolha uma matéria.');
    if(rows.querySelector(`[data-exam-subject-row="${id}"]`))return toast('Esta matéria já foi adicionada.');
    rows.querySelector('.empty')?.remove();const s=subject(id);
    const row=document.createElement('div');row.className='exam-subject-row';row.dataset.examSubjectRow=id;
    row.innerHTML=`<div><i class="subject-dot" style="background:${escapeHtml(s.color)}"></i><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(area(s.areaId).name)}</small></div><label>Acertos <input type="number" min="0" value="0" aria-label="Acertos em ${escapeHtml(s.name)}"></label><button type="button" title="Remover matéria">×</button>`;
    const hidden=$(`#examForm input[name="score_${id}"]`),input=row.querySelector('input');input.oninput=()=>hidden.value=input.value||0;
    row.querySelector('button').onclick=()=>{hidden.value=0;row.remove();if(!rows.children.length)rows.innerHTML='<div class="empty compact">Nenhuma matéria adicionada.</div>'};rows.appendChild(row);input.focus();
  };
};
