// Importador de estruturas curriculares geradas por analisadores de edital.
(function(){
  const baseTaxonomySettings=settings,baseTaxonomyBind=bind;
  const importColors=['#6658d3','#159a83','#e59a52','#d96d55','#167d9a','#8b5fbf','#4d8c57','#c06d3e'];
  let taxonomyImportDraft=null;

  const isObject=value=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
  const cleanText=(value,max=180)=>String(value??'').replace(/\s+/g,' ').trim().slice(0,max);
  const identity=value=>cleanText(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const firstValue=(source,keys)=>{if(!isObject(source))return undefined;for(const key of keys)if(source[key]!==undefined&&source[key]!==null)return source[key]};
  const itemName=value=>typeof value==='string'?cleanText(value,120):cleanText(firstValue(value,['nome','name','titulo','title','materia','matéria','disciplina','subject']),120);
  const safeColor=value=>/^#[0-9a-f]{6}$/i.test(String(value||''))?String(value):'';

  function collection(value){
    if(Array.isArray(value))return value;
    if(!isObject(value))return [];
    return Object.entries(value).map(([name,content])=>isObject(content)?{...content,nome:itemName(content)||name}:({nome:name,assuntos:Array.isArray(content)?content:[]}));
  }

  function topicNames(subject){
    const raw=firstValue(subject,['assuntos','tópicos','topicos','topics','conteúdos','conteudos','contents','itens','items']);
    const values=Array.isArray(raw)?raw:isObject(raw)?Object.keys(raw):typeof raw==='string'?[raw]:[];
    const seen=new Set(),topics=[];
    for(const value of values){const name=itemName(value)||cleanText(value,180),key=identity(name);if(name&&key&&!seen.has(key)){seen.add(key);topics.push(name)}}
    return topics;
  }

  function normalizeCategories(categories){
    const normalized=[],areaMap=new Map();let duplicateSubjects=0,duplicateTopics=0;
    for(const rawArea of categories){
      const areaName=cleanText(rawArea?.name||rawArea?.nome,120);if(!areaName)continue;
      const areaKey=identity(areaName);let areaItem=areaMap.get(areaKey);
      if(!areaItem){areaItem={name:areaName,subjects:[]};areaMap.set(areaKey,areaItem);normalized.push(areaItem)}
      const subjectMap=new Map(areaItem.subjects.map(item=>[identity(item.name),item]));
      for(const rawSubject of rawArea.subjects||[]){
        const name=cleanText(rawSubject?.name||rawSubject?.nome,120);if(!name)continue;
        const subjectKey=identity(name),topics=Array.isArray(rawSubject.topics)?rawSubject.topics:[],existing=subjectMap.get(subjectKey);
        if(existing){duplicateSubjects++;for(const topic of topics){const key=identity(topic);if(!existing.topics.some(item=>identity(item)===key))existing.topics.push(cleanText(topic,180));else duplicateTopics++}if(!existing.color&&rawSubject.color)existing.color=rawSubject.color;continue}
        const uniqueTopics=[];for(const topic of topics){const value=cleanText(topic,180),key=identity(value);if(value&&!uniqueTopics.some(item=>identity(item)===key))uniqueTopics.push(value);else if(value)duplicateTopics++}
        const item={name,topics:uniqueTopics,color:safeColor(rawSubject.color)};areaItem.subjects.push(item);subjectMap.set(subjectKey,item);
      }
    }
    const subjectCount=normalized.reduce((sum,item)=>sum+item.subjects.length,0),topicCount=normalized.reduce((sum,item)=>sum+item.subjects.reduce((total,subjectItem)=>total+subjectItem.topics.length,0),0);
    if(!subjectCount)throw new Error('Nenhuma matéria válida foi encontrada no JSON.');
    if(normalized.length>200||subjectCount>2000||topicCount>20000)throw new Error('O arquivo ultrapassa o limite de 200 categorias, 2.000 matérias ou 20.000 assuntos.');
    return{categories:normalized,stats:{areas:normalized.length,subjects:subjectCount,topics:topicCount,duplicateSubjects,duplicateTopics,withoutTopics:normalized.reduce((sum,item)=>sum+item.subjects.filter(subjectItem=>!subjectItem.topics.length).length,0)}};
  }

  function parseNative(root){
    const areas=Array.isArray(root.knowledgeAreas)?root.knowledgeAreas:[],subjects=Array.isArray(root.subjects)?root.subjects:[],byId=new Map(areas.map(item=>[String(item?.id||''),cleanText(item?.name||item?.nome,120)])),fallback='Conhecimentos Gerais',grouped=new Map();
    const ensure=name=>{const value=name||fallback,key=identity(value);if(!grouped.has(key))grouped.set(key,{name:value,subjects:[]});return grouped.get(key)};
    areas.forEach(item=>ensure(cleanText(item?.name||item?.nome,120)));
    subjects.forEach(item=>{if(!isObject(item))return;const name=itemName(item);if(!name)return;const areaName=byId.get(String(item.areaId||item.area_id||''))||cleanText(firstValue(item,['categoria','category','area','grupo']),120)||fallback;ensure(areaName).subjects.push({name,topics:topicNames(item),color:safeColor(firstValue(item,['color','cor']))})});
    return[...grouped.values()];
  }

  function parseNested(rawCategories){
    return collection(rawCategories).map(rawArea=>{
      const name=itemName(rawArea)||cleanText(firstValue(rawArea,['categoria','category','area','grupo']),120),rawSubjects=firstValue(rawArea,['materias','matérias','disciplinas','subjects','conteudos','conteúdos','itens','items']);
      return{name,subjects:collection(rawSubjects).map(rawSubject=>({name:itemName(rawSubject),topics:topicNames(rawSubject),color:safeColor(firstValue(rawSubject,['color','cor']))}))};
    });
  }

  function parseFlat(rawSubjects){
    const grouped=new Map();
    collection(rawSubjects).forEach(rawSubject=>{const name=itemName(rawSubject);if(!name)return;const rawArea=firstValue(rawSubject,['categoria','category','area','areaName','area_name','grupo','group']),areaName=itemName(rawArea)||cleanText(rawArea,120)||'Conhecimentos Gerais',key=identity(areaName);if(!grouped.has(key))grouped.set(key,{name:areaName,subjects:[]});grouped.get(key).subjects.push({name,topics:topicNames(rawSubject),color:safeColor(firstValue(rawSubject,['color','cor']))})});
    return[...grouped.values()];
  }

  function parseTaxonomyJson(payload){
    if(!payload||(!isObject(payload)&&!Array.isArray(payload)))throw new Error('A raiz precisa ser um objeto ou uma lista JSON.');
    let root=payload;if(isObject(root)){for(const key of ['edital','resultado','result','data']){const candidate=root[key];if(isObject(candidate)||Array.isArray(candidate)){root=candidate;break}}}
    let categories=[];
    if(isObject(root)&&(Array.isArray(root.knowledgeAreas)||Array.isArray(root.subjects)&&root.subjects.some(item=>isObject(item)&&(item.areaId||item.area_id))))categories=parseNative(root);
    else if(Array.isArray(root))categories=parseNested(root);
    else if(isObject(root)){
      const nested=firstValue(root,['categorias','categories','areas','áreas','grupos','knowledgeAreas']);
      const flat=firstValue(root,['materias','matérias','disciplinas','subjects']);
      if(nested!==undefined)categories=parseNested(nested);else if(flat!==undefined)categories=parseFlat(flat);
    }
    if(!categories.length)throw new Error('Formato não reconhecido. Use categorias → matérias → assuntos.');
    return normalizeCategories(categories);
  }

  function importTemplate(){return{versao:'1.0',categorias:[{nome:'Conhecimentos Básicos',materias:[{nome:'Língua Portuguesa',assuntos:['Interpretação de textos','Gramática']},{nome:'Raciocínio Lógico',assuntos:['Proposições','Porcentagem']}]},{nome:'Conhecimentos Específicos',materias:[{nome:'Direito Constitucional',assuntos:['Direitos fundamentais','Administração Pública']}]}]}}

  function importWorkspace(){
    const exams=(db.settings.examTypes||[]).filter(item=>typeof item==='string'&&item.trim()),scope=window.studyosExamLinks?.currentScope?.(),selected=scope&&scope!=='all'&&exams.includes(scope)?scope:(exams.includes(db.settings.exam)?db.settings.exam:exams[0]);
    return `<section class="taxonomy-import-card"><div class="taxonomy-import-heading"><span class="taxonomy-import-icon">${svg('plus')}</span><div><span class="taxonomy-import-overline">INTEGRAÇÃO COM EDITAIS</span><h3>Importar matérias por JSON</h3><p>Envie o arquivo gerado pelo seu analisador ou cole o conteúdo abaixo. Nada será alterado antes da confirmação.</p></div><button type="button" class="secondary" id="downloadTaxonomyTemplate">Baixar modelo</button></div><div class="taxonomy-import-grid"><label class="taxonomy-dropzone" id="taxonomyDropzone"><span>${svg('clipboard')}</span><strong>Selecionar arquivo JSON</strong><small>Até 2 MB · apenas a estrutura de matérias</small><input id="taxonomyImportFile" type="file" accept="application/json,.json" hidden></label><div class="taxonomy-paste"><label for="taxonomyImportText">OU COLE O JSON</label><textarea id="taxonomyImportText" spellcheck="false" placeholder='{"categorias":[{"nome":"Conhecimentos Básicos","materias":[{"nome":"Português","assuntos":["Gramática"]}]}]}'></textarea></div></div><div class="taxonomy-import-actions"><label class="taxonomy-import-target" for="taxonomyImportExam"><span>IMPORTAR PARA A PROVA</span><select id="taxonomyImportExam" ${exams.length?'':'disabled'}>${exams.map(value=>`<option value="${escapeHtml(value)}" ${value===selected?'selected':''}>${escapeHtml(value)}</option>`).join('')}</select><small>${exams.length?'Escolha onde esta estrutura será usada.':'Cadastre uma prova antes de importar.'}</small></label><div class="taxonomy-import-policy">${svg('warning')}<span><b>Importação por prova</b><small>Se a prova já tiver matérias próprias, o StudyOS perguntará antes de substituí-las. Outras provas e o histórico serão preservados.</small></span></div><button type="button" class="secondary" id="analyzeTaxonomyImport">${svg('trend')} Analisar JSON</button><button type="button" class="primary" id="confirmTaxonomyImport" disabled>${svg('check')} Importar para prova</button></div><div id="taxonomyImportPreview" class="taxonomy-import-preview empty"><span>${svg('questions')}</span><div><strong>A prévia aparecerá aqui</strong><small>O StudyOS mostrará categorias, matérias, assuntos e possíveis avisos.</small></div></div></section>`;
  }

  settings=function(){return baseTaxonomySettings().replace('<div class="taxonomy-tree">',`${importWorkspace()}<div class="taxonomy-tree">`)};

  function renderImportError(message){const preview=$('#taxonomyImportPreview'),confirmButton=$('#confirmTaxonomyImport');taxonomyImportDraft=null;if(confirmButton)confirmButton.disabled=true;if(preview){preview.className='taxonomy-import-preview error';preview.innerHTML=`<span>!</span><div><strong>Não foi possível analisar</strong><small>${escapeHtml(message)}</small></div>`}}

  function renderImportPreview(draft){
    const preview=$('#taxonomyImportPreview'),confirmButton=$('#confirmTaxonomyImport'),exam=$('#taxonomyImportExam')?.value;if(!preview)return;const {stats,categories}=draft,warnings=[];if(stats.withoutTopics)warnings.push(`${stats.withoutTopics} matéria(s) sem assuntos`);if(stats.duplicateSubjects||stats.duplicateTopics)warnings.push('nomes repetidos foram unidos automaticamente');
    preview.className='taxonomy-import-preview ready';preview.innerHTML=`<div class="taxonomy-import-stats"><span><b>${stats.areas}</b> categorias</span><span><b>${stats.subjects}</b> matérias</span><span><b>${stats.topics}</b> assuntos</span></div><div class="taxonomy-import-sample">${categories.slice(0,4).map(areaItem=>`<span><b>${escapeHtml(areaItem.name)}</b><small>${areaItem.subjects.slice(0,3).map(item=>escapeHtml(item.name)).join(' · ')}${areaItem.subjects.length>3?' · …':''}</small></span>`).join('')}</div><p class="taxonomy-import-destination">${svg('exams')} Destino: <b>${escapeHtml(exam||'nenhuma prova selecionada')}</b></p>${warnings.length?`<p>${svg('warning')} ${escapeHtml(warnings.join(' · '))}</p>`:'<p class="success-text">✓ Estrutura válida e pronta para importar.</p>'}`;if(confirmButton)confirmButton.disabled=!exam;
  }

  function analyzeImport(){
    const input=$('#taxonomyImportText'),text=input?.value?.trim()||'';if(!text)return renderImportError('Selecione um arquivo ou cole o conteúdo JSON.');if(new Blob([text]).size>2*1024*1024)return renderImportError('O JSON de matérias deve ter no máximo 2 MB.');
    try{taxonomyImportDraft=parseTaxonomyJson(JSON.parse(text));renderImportPreview(taxonomyImportDraft)}catch(error){renderImportError(error instanceof SyntaxError?'O texto não é um JSON válido.':error.message||'Estrutura inválida.')}
  }

  function nextImportId(prefix,used,counter){let id;do{id=`${prefix}imp${Date.now().toString(36)}${counter.value++}`}while(used.has(id));used.add(id);return id}

  function mergeTaxonomy(currentAreas,currentSubjects,draft,mode='merge'){
    const areas=mode==='replace'?[]:(currentAreas||[]).map(item=>({...item})),subjects=mode==='replace'?[]:(currentSubjects||[]).map(item=>({...item,topics:[...(item.topics||[])]})),used=new Set([...areas.map(item=>item.id),...subjects.map(item=>item.id)]),counter={value:0};let addedAreas=0,addedSubjects=0,addedTopics=0;
    for(const importedArea of draft.categories){let areaItem=areas.find(item=>identity(item.name)===identity(importedArea.name));if(!areaItem){areaItem={id:nextImportId('a',used,counter),name:importedArea.name};areas.push(areaItem);addedAreas++}
      for(const importedSubject of importedArea.subjects){let subjectItem=subjects.find(item=>item.areaId===areaItem.id&&identity(item.name)===identity(importedSubject.name));if(!subjectItem){subjectItem={id:nextImportId('s',used,counter),areaId:areaItem.id,name:importedSubject.name,color:importedSubject.color||importColors[subjects.length%importColors.length],topics:[]};subjects.push(subjectItem);addedSubjects++}
        for(const topic of importedSubject.topics)if(!subjectItem.topics.some(item=>identity(item)===identity(topic))){subjectItem.topics.push(topic);addedTopics++}
      }
    }
    return{areas,subjects,stats:{addedAreas,addedSubjects,addedTopics}};
  }

  function importTaxonomyForExam(currentAreas,currentSubjects,currentExamLinks,draft,examType,replaceExisting=true){
    const target=cleanText(examType,120);if(!target)throw new Error('Selecione uma prova para receber as matérias.');
    const areas=(currentAreas||[]).map(item=>({...item})),subjects=(currentSubjects||[]).map(item=>({...item,topics:[...(item.topics||[])]})),rawLinks=isObject(currentExamLinks)?currentExamLinks:{},examLinks={subjects:{},topics:{}};
    Object.entries(isObject(rawLinks.subjects)?rawLinks.subjects:{}).forEach(([id,values])=>{if(Array.isArray(values)&&values.length)examLinks.subjects[id]=[...new Set(values)]});
    Object.entries(isObject(rawLinks.topics)?rawLinks.topics:{}).forEach(([id,topics])=>{if(!isObject(topics))return;const copy={};Object.entries(topics).forEach(([key,values])=>{if(Array.isArray(values)&&values.length)copy[key]=[...new Set(values)]});if(Object.keys(copy).length)examLinks.topics[id]=copy});
    const oldTargetIds=new Set(subjects.filter(item=>(examLinks.subjects[String(item.id)]||[]).includes(target)).map(item=>String(item.id))),usedTargetIds=new Set(),usedIds=new Set([...areas.map(item=>String(item.id)),...subjects.map(item=>String(item.id))]),counter={value:0};
    let addedAreas=0,addedSubjects=0,reusedSubjects=0,removedSubjects=0,addedTopics=0;
    for(const importedArea of draft.categories){let areaItem=areas.find(item=>identity(item.name)===identity(importedArea.name));if(!areaItem){areaItem={id:nextImportId('a',usedIds,counter),name:importedArea.name};areas.push(areaItem);addedAreas++}
      for(const importedSubject of importedArea.subjects){let subjectItem=subjects.find(item=>String(item.areaId)===String(areaItem.id)&&identity(item.name)===identity(importedSubject.name));
        if(!subjectItem){subjectItem={id:nextImportId('s',usedIds,counter),areaId:areaItem.id,name:importedSubject.name,color:importedSubject.color||importColors[subjects.length%importColors.length],topics:[...importedSubject.topics]};subjects.push(subjectItem);examLinks.subjects[String(subjectItem.id)]=[target];addedSubjects++;addedTopics+=subjectItem.topics.length}
        else{reusedSubjects++;const id=String(subjectItem.id),values=examLinks.subjects[id]||[],exclusive=values.length===1&&values[0]===target;if(exclusive&&replaceExisting){subjectItem.topics=[...importedSubject.topics];delete examLinks.topics[id];addedTopics+=subjectItem.topics.length}else for(const topic of importedSubject.topics)if(!subjectItem.topics.some(item=>identity(item)===identity(topic))){subjectItem.topics.push(topic);addedTopics++}if(values.length&&!values.includes(target))examLinks.subjects[id]=[...values,target]}
        usedTargetIds.add(String(subjectItem.id));
      }
    }
    if(replaceExisting)for(const id of oldTargetIds){if(usedTargetIds.has(id))continue;const remaining=(examLinks.subjects[id]||[]).filter(value=>value!==target);if(remaining.length)examLinks.subjects[id]=remaining;else{const index=subjects.findIndex(item=>String(item.id)===id);if(index>=0){subjects.splice(index,1);removedSubjects++}delete examLinks.subjects[id];delete examLinks.topics[id]}}
    const populatedAreas=new Set(subjects.map(item=>String(item.areaId)));for(let index=areas.length-1;index>=0;index--)if(!populatedAreas.has(String(areas[index].id)))areas.splice(index,1);
    return{areas,subjects,examLinks,stats:{addedAreas,addedSubjects,reusedSubjects,removedSubjects,addedTopics}};
  }

  async function applyImport(){
    if(!taxonomyImportDraft)return renderImportError('Analise o JSON antes de confirmar.');
    const examType=$('#taxonomyImportExam')?.value,validExams=db.settings.examTypes||[];if(!examType||!validExams.includes(examType))return renderImportError('Selecione uma prova válida para receber as matérias.');
    const links=window.studyosExamLinks?.ensure?.()||db.settings.examLinks||{subjects:{},topics:{}},existingCount=db.subjects.filter(item=>(links.subjects?.[String(item.id)]||[]).includes(examType)).length;
    if(existingCount){const confirmed=typeof studyConfirm==='function'?await studyConfirm({title:`Substituir as matérias de “${examType}”?`,description:`Esta prova já possui ${existingCount} matéria(s) própria(s). Elas serão substituídas pela nova estrutura. Matérias de outras provas e todo o histórico serão preservados.`,confirmText:'Substituir matérias'}):confirm(`A prova “${examType}” já possui matérias próprias. Substituí-las?`);if(!confirmed)return}
    const result=importTaxonomyForExam(db.knowledgeAreas,db.subjects,links,taxonomyImportDraft,examType,existingCount>0),{addedSubjects,reusedSubjects,removedSubjects,addedTopics}=result.stats;
    localStorage.setItem('studyos-before-taxonomy-import',JSON.stringify({knowledgeAreas:db.knowledgeAreas,subjects:db.subjects,examLinks:links,examType,date:new Date().toISOString()}));db.knowledgeAreas=result.areas;db.subjects=result.subjects;db.settings.examLinks=result.examLinks;window.studyosExamLinks?.setScope?.(examType);await save();taxonomyImportDraft=null;toast(`${examType}: ${addedSubjects} matéria(s) adicionada(s), ${reusedSubjects} atualizada(s) e ${addedTopics} assunto(s) importado(s)${removedSubjects?` · ${removedSubjects} anterior(es) substituída(s)`:''}.`);settingsTab='taxonomy';render();
  }

  function downloadTemplate(){const link=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(importTemplate(),null,2)],{type:'application/json'}));link.href=url;link.download='studyos-modelo-materias.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

  bind=function(){
    baseTaxonomyBind();if(page!=='settings'||settingsTab!=='taxonomy')return;
    const fileInput=$('#taxonomyImportFile'),dropzone=$('#taxonomyDropzone'),textInput=$('#taxonomyImportText');
    if(fileInput)fileInput.onchange=async()=>{const file=fileInput.files?.[0];if(!file)return;if(file.size>2*1024*1024){renderImportError('O arquivo deve ter no máximo 2 MB.');fileInput.value='';return}try{textInput.value=await file.text();analyzeImport()}catch{renderImportError('Não foi possível ler o arquivo selecionado.')}finally{fileInput.value=''}};
    if(dropzone){['dragenter','dragover'].forEach(type=>dropzone.addEventListener(type,event=>{event.preventDefault();dropzone.classList.add('dragging')}));['dragleave','drop'].forEach(type=>dropzone.addEventListener(type,event=>{event.preventDefault();dropzone.classList.remove('dragging')}));dropzone.addEventListener('drop',async event=>{const file=event.dataTransfer?.files?.[0];if(!file)return;if(file.size>2*1024*1024)return renderImportError('O arquivo deve ter no máximo 2 MB.');try{textInput.value=await file.text();analyzeImport()}catch{renderImportError('Não foi possível ler o arquivo selecionado.')}})}
    $('#analyzeTaxonomyImport')?.addEventListener('click',analyzeImport);$('#confirmTaxonomyImport')?.addEventListener('click',applyImport);$('#downloadTaxonomyTemplate')?.addEventListener('click',downloadTemplate);$('#taxonomyImportExam')?.addEventListener('change',()=>{if(taxonomyImportDraft)renderImportPreview(taxonomyImportDraft)});textInput?.addEventListener('input',()=>{taxonomyImportDraft=null;const button=$('#confirmTaxonomyImport');if(button)button.disabled=true});
  };

  window.studyosTaxonomyImport={parse:parseTaxonomyJson,template:importTemplate,merge:mergeTaxonomy,importForExam:importTaxonomyForExam};
})();
