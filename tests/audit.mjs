import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const read=name=>fs.readFileSync(path.join(root,'public',name),'utf8');
assert.doesNotThrow(()=>JSON.parse(read('studyos-taxonomy.schema.json')),'schema JSON de integração inválido');
const indexHtml=read('index.html');
assert.ok(indexHtml.includes('class="skip-link"'),'atalho para o conteúdo principal ausente');
assert.ok(indexHtml.includes('id="main-content"'),'região principal não possui destino de foco');
assert.ok(indexHtml.includes('id="toast" role="status" aria-live="polite"'),'avisos não são anunciados por leitores de tela');
assert.ok(indexHtml.includes('aria-controls="studySidebar"'),'menu móvel não informa qual região controla');
assert.ok(indexHtml.includes('id="globalSearch"'),'busca global navegável ausente');
assert.ok(indexHtml.includes('desktop-upgrades.js'),'fluxos desktop e migração não foram carregados');
assert.ok(!indexHtml.includes('organiza-studyos.opao6394.chatgpt.site'),'aplicativo offline ainda depende de link hospedado');
const noop=()=>{};
const classList={add:noop,remove:noop,toggle:()=>false,contains:()=>false};
const element={classList,style:{setProperty:noop,removeProperty:noop},dataset:{},addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],setAttribute:noop,appendChild:noop,insertAdjacentHTML:noop};
const documentStub={body:{...element},documentElement:{style:element.style},hidden:false,addEventListener:noop,removeEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({...element}),};
const storage=new Map();
const context=vm.createContext({
 console,Intl,Date,Math,Number,String,Array,Object,Set,Map,JSON,Promise,RegExp,
 document:documentStub,window:{addEventListener:noop,scrollTo:noop,scrollX:0,scrollY:0},
 localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)},
 requestAnimationFrame:callback=>callback(0),setTimeout:()=>0,clearTimeout:noop,
 performance:{now:()=>0},matchMedia:()=>({matches:false}),innerWidth:1200,
 Node:{TEXT_NODE:3},MutationObserver:class{observe(){}},URL,Blob,FormData:class{},FileReader:class{},Event:class{},
 fetch:async()=>({ok:true,json:async()=>({ok:true})})
});

const core=read('app.js').split("document.addEventListener('visibilitychange'")[0];
vm.runInContext(core,context,{filename:'app.js'});
const data=JSON.parse(read('studyos-default.json'));
vm.runInContext(`db=normalizeClientState(${JSON.stringify(data)})`,context);

for(const name of ['exam-subjects.js','questions-ux.js','questions-gran-theme.js','question-sections.js','modern-dialogs.js','essays.js','study-now.js']){
 vm.runInContext(read(name),context,{filename:name});
}
vm.runInContext(read('icons.js').split('const iconObserver=')[0],context,{filename:'icons.js'});
for(const name of ['achievements.js','dashboard-insights.js','semantic-theme.js','motion-ui.js','github-heatmap.js','study-guide.js','dashboard-overview.js']){
 vm.runInContext(read(name),context,{filename:name});
}
vm.runInContext(read('academic-workspaces.js'),context,{filename:'academic-workspaces.js'});
vm.runInContext(read('question-bank.js'),context,{filename:'question-bank.js'});
vm.runInContext(read('taxonomy-import.js'),context,{filename:'taxonomy-import.js'});
vm.runInContext(read('taxonomy-organizer.js'),context,{filename:'taxonomy-organizer.js'});
vm.runInContext(read('taxonomy-exam-links.js'),context,{filename:'taxonomy-exam-links.js'});

const evaluate=expression=>vm.runInContext(expression,context);
const assertHealthyHtml=(name,html)=>{
 assert.equal(typeof html,'string',`${name} não retornou HTML`);
 assert.ok(html.length>40,`${name} retornou conteúdo vazio`);
 const invalid=html.match(/.{0,60}\b(?:undefined|NaN|Infinity)\b.{0,60}/)?.[0];
 assert.ok(!invalid,`${name} contém valor inválido: ${invalid||''}`);
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]);
 const duplicates=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];
 assert.deepEqual(duplicates,[],`${name} contém IDs duplicados: ${duplicates.join(', ')}`);
};

const pages={
 dashboard:evaluate('dashboard()'),study:evaluate('renderStudyNow()'),questions:evaluate("questionSection='questions';questions()"),
 performance:evaluate("questionSection='performance';questions()"),errors:evaluate("questionSection='errors';questions()"),
 subjects:evaluate("questionSection='subjects';questions()"),lessons:evaluate("genericForm('lessons')"),
 exams:evaluate("genericForm('exams')"),essays:evaluate('renderEssaysPage()'),guide:evaluate('guide()')
};
for(const [name,html] of Object.entries(pages))assertHealthyHtml(name,html);
for(const tab of ['general','taxonomy','data','achievements']){
 const html=evaluate(`settingsTab='${tab}';settings()`);assertHealthyHtml(`settings-${tab}`,html);
 assert.ok(html.includes(`data-settings-panel="${tab}"`),`painel ${tab} ausente`);
}
assert.ok(pages.dashboard.includes('github-calendar'),'heatmap GitHub ausente');
assert.ok(pages.dashboard.includes('role="gridcell"'),'dias do heatmap não possuem semântica de grade');
assert.ok(!pages.dashboard.includes('<button class="heat gh-day'),'dias informativos do heatmap ainda poluem a navegação por teclado');
assert.ok(pages.dashboard.includes('dashboard-insights'),'análise geral ausente');
assert.ok(pages.guide.includes('Plano da semana'),'guia adaptativo incompleto');
assert.ok(pages.study.includes('id="timerTopic"'),'seletor de assunto do Pomodoro ausente');
assert.ok(pages.study.includes('data-study-preset'),'ciclos rápidos do Pomodoro ausentes');
assert.ok(pages.lessons.includes('workspace-kpis'),'workspace moderno de aulas ausente');
assert.ok(pages.lessons.includes('id="lessonArea"'),'categoria hierárquica de aulas ausente');
assert.ok(pages.exams.includes('exam-live-preview'),'prévia de desempenho da prova ausente');
assert.ok(pages.exams.includes('id="examWorkspaceFilter"'),'filtro do histórico de provas ausente');
assert.ok(pages.questions.includes('qb-register-layout'),'workspace reformulado do Banco de questões ausente');
assert.ok(pages.performance.includes('qb-evolution-card'),'gráfico de evolução do Banco de questões ausente');
assert.ok(pages.errors.includes('qb-error-layout'),'Caderno de erros reformulado ausente');
assert.ok(pages.subjects.includes('qb-subject-groups'),'mapa de disciplinas reformulado ausente');
const taxonomySettings=evaluate("settingsTab='taxonomy';settings()");
assert.ok(taxonomySettings.includes('taxonomy-import-card'),'importador JSON de matérias ausente');
assert.ok(taxonomySettings.includes('Importação por prova'),'regra de destino da importação ausente');
assert.ok(taxonomySettings.includes('id="taxonomyImportExam"'),'seletor da prova de destino ausente');
assert.ok(!taxonomySettings.includes('id="taxonomyImportMode"'),'opção antiga de mesclagem ainda aparece');
assert.ok(taxonomySettings.includes('data-taxonomy-order="category"'),'ação para mover matéria entre categorias ausente');
assert.ok(taxonomySettings.includes('id="toggleAllTopics"'),'controle para mostrar e ocultar assuntos ausente');
assert.ok(taxonomySettings.includes('Ocultar todos os assuntos'),'estado inicial do controle de assuntos incorreto');
assert.ok(taxonomySettings.includes('data-exam-link="subject"'),'vínculo de matéria com provas ausente');
assert.ok(taxonomySettings.includes('data-exam-link="topic"'),'vínculo de assunto com provas ausente');
assert.ok(taxonomySettings.includes('ORGANIZAÇÃO POR PROVA'),'categorização por prova ausente');
assert.ok(taxonomySettings.includes('data-exam-scope="all"'),'visão de todas as provas ausente');
const beforeExamLinkTest=evaluate('JSON.stringify(db)');
vm.runInContext(`db.settings.examTypes=['Prova A','Prova B'];db.settings.exam='Prova A';db.subjects[0].name='Conteúdo exclusivo da Prova A';db.settings.examLinks={subjects:{[db.subjects[0].id]:['Prova A']},topics:{}}`,context);
const linkedSubjectId=evaluate('db.subjects[0].id');
assert.equal(evaluate(`window.studyosExamLinks.isSubjectAvailable(${JSON.stringify(linkedSubjectId)},'Prova A')`),true,'matéria não ficou disponível para a prova vinculada');
assert.equal(evaluate(`window.studyosExamLinks.isSubjectAvailable(${JSON.stringify(linkedSubjectId)},'Prova B')`),false,'matéria apareceu em prova não vinculada');
assert.ok(evaluate(`window.studyosExamLinks.badge('subject',${JSON.stringify(linkedSubjectId)})`).includes('Prova A'),'identificação visual do vínculo ausente');
assert.equal(evaluate(`window.studyosExamLinks.subjectsForExam('', 'Prova B').some(item=>item.id===${JSON.stringify(linkedSubjectId)})`),false,'filtro da prova não respeitou o vínculo da matéria');
evaluate(`window.studyosExamLinks.setScope('Prova B')`);
assert.ok(!evaluate(`settingsTab='taxonomy';settings()`).includes('Conteúdo exclusivo da Prova A'),'estrutura da Prova B exibiu matéria exclusiva da Prova A');
evaluate(`window.studyosExamLinks.setScope('Prova A')`);
assert.ok(evaluate(`settingsTab='taxonomy';settings()`).includes('Conteúdo exclusivo da Prova A'),'estrutura da Prova A ocultou matéria vinculada');
vm.runInContext(`{const item=db.subjects[0],previous=item.topics[0],next=previous+' atualizado';db.settings.examLinks.topics={[item.id]:{[encodeURIComponent(previous)]:['Prova A']}};item.topics[0]=next;window.studyosExamLinks.renameTopic(item.id,previous,next)}`,context);
assert.ok(evaluate(`window.studyosExamLinks.badge('topic',${JSON.stringify(linkedSubjectId)},db.subjects[0].topics[0])`).includes('Prova A'),'vínculo do assunto não acompanhou a renomeação');
evaluate(`window.studyosExamLinks.setScope('all')`);
vm.runInContext(`db=normalizeClientState(${beforeExamLinkTest})`,context);
const canonicalImport=evaluate(`window.studyosTaxonomyImport.parse({categorias:[{nome:'Básicos',materias:[{nome:'Português',assuntos:['Gramática','Interpretação']}]}]})`);
assert.equal(canonicalImport.stats.areas,1,'importador não reconheceu categorias');
assert.equal(canonicalImport.stats.subjects,1,'importador não reconheceu matérias');
assert.equal(canonicalImport.stats.topics,2,'importador não reconheceu assuntos');
const coloredImport=evaluate(`window.studyosTaxonomyImport.parse({categorias:[{nome:'Básicos',materias:[{nome:'Português',cor:'#123456',assuntos:[]}]}]})`);
assert.equal(coloredImport.categories[0].subjects[0].color,'#123456','campo opcional cor não foi reconhecido');
const flatImport=evaluate(`window.studyosTaxonomyImport.parse({materias:[{categoria:'Específicos',nome:'Direito',topicos:['Constituição']} ]})`);
assert.equal(flatImport.categories[0].subjects[0].topics[0],'Constituição','formato plano não foi reconhecido');
const nativeImport=evaluate(`window.studyosTaxonomyImport.parse({knowledgeAreas:[{id:'a',name:'Área'}],subjects:[{id:'s',areaId:'a',name:'Matéria',topics:['Tema']}]})`);
assert.equal(nativeImport.categories[0].name,'Área','formato nativo não foi reconhecido');
const duplicateImport=evaluate(`window.studyosTaxonomyImport.parse({categorias:[{nome:'Básicos',materias:[{nome:'Português',assuntos:['Gramática']},{nome:'portugues',assuntos:['gramática','Interpretação']}]}]})`);
assert.equal(duplicateImport.stats.subjects,1,'matérias equivalentes não foram unidas');
assert.equal(duplicateImport.stats.topics,2,'assuntos equivalentes não foram unidos');
const mergedImport=evaluate(`window.studyosTaxonomyImport.merge([{id:'a',name:'Básicos'}],[{id:'s',areaId:'a',name:'Português',color:'#000000',topics:['Gramática']}],window.studyosTaxonomyImport.parse({categorias:[{nome:'básicos',materias:[{nome:'PORTUGUÊS',assuntos:['Interpretação']}]}]}),'merge')`);
assert.equal(mergedImport.areas.length,1,'mesclagem duplicou a categoria existente');
assert.equal(mergedImport.subjects.length,1,'mesclagem duplicou a matéria existente');
assert.equal(mergedImport.subjects[0].topics.length,2,'mesclagem não preservou e ampliou assuntos');
const replacedImport=evaluate(`window.studyosTaxonomyImport.merge([{id:'antiga',name:'Estrutura antiga'}],[{id:'velha',areaId:'antiga',name:'Matéria antiga',topics:['Assunto antigo']}],window.studyosTaxonomyImport.parse({categorias:[{nome:'Nova estrutura',materias:[{nome:'Nova matéria',assuntos:['Novo assunto']}]}]}),'replace')`);
assert.equal(replacedImport.areas.length,1,'substituição manteve categorias anteriores');
assert.equal(replacedImport.areas[0].name,'Nova estrutura','substituição não aplicou a nova categoria');
assert.equal(replacedImport.subjects.length,1,'substituição manteve matérias anteriores');
assert.equal(replacedImport.subjects[0].name,'Nova matéria','substituição não aplicou a nova matéria');
const examImport=evaluate(`window.studyosTaxonomyImport.importForExam(
  [{id:'a',name:'Gerais'}],
  [{id:'old',areaId:'a',name:'Antiga exclusiva',topics:['Velho']},{id:'kept',areaId:'a',name:'Exclusiva mantida',topics:['Assunto anterior']},{id:'shared',areaId:'a',name:'Compartilhada',topics:['Base']},{id:'other',areaId:'a',name:'Outra prova',topics:['Outro']},{id:'universal',areaId:'a',name:'Universal',topics:['Comum']}],
  {subjects:{old:['Prova A'],kept:['Prova A'],shared:['Prova A','Prova B'],other:['Prova B']},topics:{kept:{[encodeURIComponent('Assunto anterior')]:['Prova A']}}},
  window.studyosTaxonomyImport.parse({categorias:[{nome:'Gerais',materias:[{nome:'Exclusiva mantida',assuntos:['Assunto novo']},{nome:'Compartilhada',assuntos:['Novo']},{nome:'Nova matéria',assuntos:['Tema']}]}]}),
  'Prova A',true)`);
assert.equal(examImport.subjects.some(item=>item.id==='old'),false,'substituição por prova manteve matéria exclusiva removida');
assert.deepEqual([...examImport.subjects.find(item=>item.id==='kept').topics],['Assunto novo'],'matéria exclusiva não recebeu a nova lista de assuntos');
assert.equal(Boolean(examImport.examLinks.topics.kept),false,'vínculos de assuntos antigos não foram limpos na substituição');
assert.deepEqual([...examImport.subjects.find(item=>item.id==='shared').topics],['Base','Novo'],'matéria compartilhada perdeu conteúdo de outra prova');
assert.deepEqual([...examImport.examLinks.subjects.shared],['Prova A','Prova B'],'vínculo compartilhado foi alterado incorretamente');
assert.deepEqual([...examImport.examLinks.subjects.other],['Prova B'],'matéria de outra prova foi alterada');
assert.equal(examImport.subjects.some(item=>item.id==='universal'),true,'conteúdo comum foi removido');
const newExamSubject=examImport.subjects.find(item=>item.name==='Nova matéria');
assert.ok(newExamSubject,'nova matéria da prova não foi criada');
assert.deepEqual([...examImport.examLinks.subjects[newExamSubject.id]],['Prova A'],'nova matéria não foi vinculada à prova escolhida');
assert.equal(examImport.stats.removedSubjects,1,'quantidade de matérias substituídas está incorreta');
const reorderedSubjects=evaluate(`window.studyosTaxonomyOrganizer.reorder([{id:'s1',areaId:'a',name:'Primeira',topics:['A']},{id:'s2',areaId:'a',name:'Segunda',topics:['B']}],'s2','up')`);
assert.equal(reorderedSubjects[0].id,'s2','matéria não foi movida para cima');
assert.equal(reorderedSubjects[0].topics[0],'B','assuntos não acompanharam a matéria reordenada');
const movedSubject=evaluate(`window.studyosTaxonomyOrganizer.moveToArea([{id:'s1',areaId:'gerais',name:'Atualidades do Mercado',topics:['Economia','Trabalho']},{id:'s2',areaId:'especificos',name:'Direito',topics:[]}],'s1','especificos')`);
assert.equal(movedSubject.find(item=>item.id==='s1').areaId,'especificos','matéria não mudou de categoria');
assert.equal(movedSubject.find(item=>item.id==='s1').topics.length,2,'assuntos não acompanharam a matéria entre categorias');
assert.ok(!Object.values(pages).join('').includes('Matéria removida'),'rótulo quebrado de matéria removida reapareceu');

const beforeArchivedPriority=evaluate('JSON.stringify(db)');
vm.runInContext(`db=normalizeClientState({settings:{cutoff:70},knowledgeAreas:[{id:'a',name:'Estrutura atual'}],subjects:[{id:'current',areaId:'a',name:'Matéria atual',topics:['Tema novo']}],questionSessions:[{id:1,subject:'old',subjectName:'Matéria antiga',topic:'Tema antigo',date:'2026-08-01',total:20,correct:5,difficulty:'medio'}],lessons:[],exams:[],essays:[],studySessions:[]})`,context);
const archivedPriorityDashboard=evaluate('dashboard()');
assert.ok(archivedPriorityDashboard.includes('Comece a medir sua estrutura atual.'),'painel não orienta o primeiro registro da estrutura atual');
assert.ok(archivedPriorityDashboard.includes('A estrutura atual ainda não tem resultados.'),'estado sem evidência atual não aparece');
assert.ok(!archivedPriorityDashboard.includes('Matéria antiga'),'matéria arquivada ainda interfere na próxima prioridade');
vm.runInContext(`db=normalizeClientState(${beforeArchivedPriority})`,context);

vm.runInContext(`db=normalizeClientState({settings:{},knowledgeAreas:[],subjects:[],questionSessions:[null],lessons:[null],exams:[null],essays:[null],studySessions:[null]})`,context);
for(const [name,expression] of Object.entries({study:'renderStudyNow()',questions:'questions()',lessons:"genericForm('lessons')",guide:'guide()',settings:'settings()'}))assertHealthyHtml(`empty-${name}`,evaluate(expression));

vm.runInContext(`db=normalizeClientState({settings:{},knowledgeAreas:[{id:'a',name:'A'}],subjects:[{id:'s',areaId:'a',name:'S',topics:['T']}],questionSessions:[{}],lessons:[{}],exams:[{}],essays:[{}],studySessions:[{}]})`,context);
for(const [name,expression] of Object.entries({dashboard:'dashboard()',questions:'questions()',lessons:"genericForm('lessons')",exams:"genericForm('exams')",essays:'renderEssaysPage()'}))assertHealthyHtml(`malformed-${name}`,evaluate(expression));

const hostile='\"><img src=x onerror=alert(1)>';
vm.runInContext(`db=normalizeClientState({settings:{userName:${JSON.stringify(hostile)},exam:${JSON.stringify(hostile)},examTypes:[${JSON.stringify(hostile)}]},knowledgeAreas:[{id:'a',name:${JSON.stringify(hostile)}}],subjects:[{id:'s',areaId:'a',name:${JSON.stringify(hostile)},color:'red;position:fixed',topics:[${JSON.stringify(hostile)}]}],questionSessions:[{subject:'s',topic:${JSON.stringify(hostile)},date:'2026-01-01',total:1,correct:0}],lessons:[],exams:[{name:${JSON.stringify(hostile)},type:${JSON.stringify(hostile)},date:'2026-01-01',total:1,correct:0,scores:{s:1}}],essays:[{theme:${JSON.stringify(hostile)},axis:${JSON.stringify(hostile)},competencies:[0,0,0,0,0]}],studySessions:[]})`,context);
const hostileHtml=[evaluate('dashboard()'),evaluate('renderStudyNow()'),evaluate('questions()'),evaluate("genericForm('exams')"),evaluate('renderEssaysPage()'),evaluate('settings()')].join('');
const unsafe=hostileHtml.match(/.{0,100}(?:<script|<img[^>]+onerror\s*=|style="[^"]*position\s*:\s*fixed).{0,100}/i)?.[0];
assert.ok(!unsafe,`conteúdo informado pelo usuário não foi escapado: ${unsafe||''}`);

vm.runInContext(`db=normalizeClientState({settings:{cutoff:70},knowledgeAreas:[{id:'a',name:'A'}],subjects:[{id:'s',areaId:'a',name:'S',topics:['T']}],questionSessions:[{subject:'s',topic:'T',total:1,correct:0,difficulty:'medio'},{subject:'s',topic:'T',total:100,correct:100,difficulty:'medio'}],lessons:[],exams:[],essays:[],studySessions:[]})`,context);
assert.equal(evaluate('getStats().real'),99,'domínio real global não está ponderado');
assert.equal(evaluate('grouped()[0].real'),99,'domínio real por assunto não está ponderado');

console.log(`Auditoria de renderização concluída: ${Object.keys(pages).length+4} telas/painéis principais, além de estados vazios e malformados.`);
