const ESSAY_COMPETENCIES=[
  {short:'C1',title:'Norma culta',description:'Domínio da escrita formal'},
  {short:'C2',title:'Tema e repertório',description:'Compreensão e repertório produtivo'},
  {short:'C3',title:'Argumentação',description:'Projeto de texto e defesa do ponto de vista'},
  {short:'C4',title:'Coesão textual',description:'Articulação entre ideias e parágrafos'},
  {short:'C5',title:'Intervenção',description:'Proposta detalhada e cidadã'}
];

function essayScoreTone(score){return score>=900?'excellent':score>=700?'solid':'attention'}
function essayScoreLabel(score){return score>=960?'Excelência':score>=900?'Muito forte':score>=700?'Bom caminho':score>=500?'Em desenvolvimento':'Precisa de atenção'}
function essayDisplayDate(value){
  const parsed=new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime())?String(value||'Sem data'):new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(parsed);
}
function essayScoreOptions(){return `<option value="">Escolha</option>${Array.from({length:11},(_,index)=>index*20).map(score=>`<option value="${score}">${score} pontos</option>`).join('')}`}

function renderEssayCompetenceField(item,index){return `<label class="essay-competence-input"><span class="essay-competence-id">${item.short}</span><span class="essay-competence-copy"><strong>${item.title}</strong><small>${item.description}</small></span><select name="c${index+1}" aria-label="Nota da competência ${index+1}" required>${essayScoreOptions()}</select></label>`}

function renderEssayHistoryItem(essay,index,ordered){
  const scores=essay.competencies.map(Number),best=Math.max(...scores),worst=Math.min(...scores),bestIndex=scores.indexOf(best),worstIndex=scores.indexOf(worst),previous=ordered[index-1],delta=previous?essay.score-previous.score:null,tone=essayScoreTone(essay.score);
  return `<article class="essay-history-card ${tone}">
    <div class="essay-history-main">
      <div class="essay-history-date"><span>${escapeHtml(essayDisplayDate(essay.date))}</span><small>${escapeHtml(essay.axis||'Sem eixo temático')}</small></div>
      <div class="essay-history-title"><h3>${escapeHtml(essay.theme)}</h3><div class="essay-history-insights"><span class="essay-best">Melhor: ${ESSAY_COMPETENCIES[bestIndex].short} · ${fmt(best)}</span><span class="essay-worst">Foco: ${ESSAY_COMPETENCIES[worstIndex].short} · ${fmt(worst)}</span></div></div>
      <div class="essay-history-score"><strong>${fmt(essay.score)}</strong><span>${essayScoreLabel(essay.score)}</span>${delta===null?'':`<small class="${delta>=0?'positive':'negative'}">${delta>=0?'+':''}${fmt(delta)} pts</small>`}</div>
      <button type="button" class="essay-delete" data-delete-essay="${escapeHtml(essay.id)}" title="Excluir redação" aria-label="Excluir redação sobre ${escapeHtml(essay.theme)}">⌫</button>
    </div>
    <div class="essay-score-strip">${scores.map((score,scoreIndex)=>`<div title="${ESSAY_COMPETENCIES[scoreIndex].title}: ${fmt(score)} pontos"><span>${ESSAY_COMPETENCIES[scoreIndex].short}</span><i><b style="width:${Math.max(0,Math.min(100,score/2))}%"></b></i><strong>${fmt(score)}</strong></div>`).join('')}</div>
  </article>`;
}

function renderEssaysPage(){
  const essays=db.essays.slice(),ordered=essays.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))),latest=ordered.at(-1),first=ordered[0],average=essays.length?Math.round(essays.reduce((sum,item)=>sum+item.score,0)/essays.length):0,best=essays.length?Math.max(...essays.map(item=>item.score)):0,evolution=latest&&first?latest.score-first.score:0;
  const competenceAverages=ESSAY_COMPETENCIES.map((_,index)=>essays.length?Math.round(essays.reduce((sum,item)=>sum+(Number(item.competencies[index])||0),0)/essays.length):0),weakestIndex=competenceAverages.indexOf(Math.min(...competenceAverages));
  const axes=new Set(essays.map(item=>item.axis).filter(Boolean)).size;
  return `<section class="essay-lab-hero">
    <div><span class="essay-eyebrow">LABORATÓRIO DE REDAÇÃO</span><h2>Transforme correção em evolução.</h2><p>Acompanhe sua nota sem perder de vista o que realmente faz ela subir: cada competência.</p></div>
    <div class="essay-hero-focus"><span>FOCO RECOMENDADO</span><strong>${essays.length?`${ESSAY_COMPETENCIES[weakestIndex].short} · ${ESSAY_COMPETENCIES[weakestIndex].title}`:'Cadastre sua primeira redação'}</strong><small>${essays.length?`Média atual de ${fmt(competenceAverages[weakestIndex])}/200`:'O StudyOS identificará sua prioridade automaticamente.'}</small></div>
  </section>

  <section class="essay-kpi-grid" aria-label="Resumo das redações">
    <article class="essay-kpi"><span>MÉDIA GERAL</span><strong>${fmt(average)}</strong><small>de 1.000 pontos</small></article>
    <article class="essay-kpi"><span>ÚLTIMA NOTA</span><strong class="${latest?essayScoreTone(latest.score):''}">${fmt(latest?.score||0)}</strong><small>${latest?essayScoreLabel(latest.score):'Sem registro'}</small></article>
    <article class="essay-kpi"><span>EVOLUÇÃO</span><strong class="${evolution>=0?'positive':'negative'}">${evolution>=0?'+':''}${fmt(evolution)}</strong><small>da primeira à última</small></article>
    <article class="essay-kpi"><span>PRODUÇÕES</span><strong>${fmt(essays.length)}</strong><small>${fmt(axes)} eixo${axes===1?'':'s'} temático${axes===1?'':'s'}</small></article>
  </section>

  <section class="essay-workspace">
    <form id="essayForm" class="card essay-form-card">
      <div class="card-head"><div><h2>Registrar nova redação</h2><p class="head-copy">Preencha a correção recebida. A nota total é calculada automaticamente.</p></div><span class="essay-form-badge">0–1.000</span></div>
      <div class="essay-meta-grid">
        <div class="field essay-theme-field"><label>TEMA DA REDAÇÃO</label><input name="theme" maxlength="180" placeholder="Ex.: Desafios para combater a desinformação no Brasil" autocomplete="off" required></div>
        <div class="field"><label>EIXO TEMÁTICO</label><input name="axis" maxlength="100" placeholder="Ex.: Tecnologia e sociedade" autocomplete="off" required></div>
        <div class="field"><label>DATA DA PRODUÇÃO</label><input type="date" name="date" value="${today}" required></div>
      </div>
      <div class="essay-form-divider"><span>Notas por competência</span><small>Valores de 0 a 200, em intervalos de 20</small></div>
      <div class="essay-competence-inputs">${ESSAY_COMPETENCIES.map(renderEssayCompetenceField).join('')}</div>
      <div class="essay-form-footer">
        <div class="essay-live-score"><div class="essay-live-ring"><strong id="essayLiveScore">0</strong><small>/ 1000</small></div><div><span id="essayLiveLabel">Preencha as competências</span><i><b id="essayLiveBar" style="width:0%"></b></i></div></div>
        <button class="primary" type="submit">Salvar redação</button>
      </div>
    </form>

    <aside class="card essay-competence-overview">
      <div class="card-head"><div><h2>Raio-X das competências</h2><p class="head-copy">Média de todas as suas redações.</p></div><span class="essay-count-badge">${essays.length}</span></div>
      <div class="essay-competence-bars">${ESSAY_COMPETENCIES.map((item,index)=>`<div class="essay-competence-bar ${index===weakestIndex&&essays.length?'is-focus':''}"><div><span><b>${item.short}</b> ${item.title}</span><strong>${fmt(competenceAverages[index])}</strong></div><i><b style="width:${competenceAverages[index]/2}%"></b></i><small>${item.description}</small></div>`).join('')}</div>
      <div class="essay-competence-tip"><span>✦</span><p>${essays.length?`Comece a próxima revisão pela ${ESSAY_COMPETENCIES[weakestIndex].short}. Ela está ${fmt(Math.max(...competenceAverages)-competenceAverages[weakestIndex])} pontos abaixo da sua melhor competência.`:'Depois do primeiro registro, este painel indicará sua competência prioritária.'}</p></div>
    </aside>
  </section>

  <div class="essay-history-heading"><div><span class="essay-eyebrow">HISTÓRICO</span><h2>Sua evolução, redação por redação</h2></div><span>${essays.length} registro${essays.length===1?'':'s'}</span></div>
  <section class="essay-history-list">${ordered.length?ordered.slice().reverse().map(item=>renderEssayHistoryItem(item,ordered.indexOf(item),ordered)).join(''):`<div class="card essay-empty"><span>✎</span><h3>Sua jornada começa na primeira redação.</h3><p>Registre a correção acima para visualizar evolução, médias e prioridades.</p></div>`}</section>`;
}

function updateEssayScorePreview(form){
  const fields=ESSAY_COMPETENCIES.map((_,index)=>form.elements[`c${index+1}`]),values=fields.map(field=>Number(field?.value)||0),score=values.reduce((sum,value)=>sum+value,0),complete=fields.every(field=>field?.value!==''),tone=essayScoreTone(score);
  const scoreNode=document.querySelector('#essayLiveScore'),labelNode=document.querySelector('#essayLiveLabel'),barNode=document.querySelector('#essayLiveBar');
  if(scoreNode)scoreNode.textContent=String(score);if(labelNode)labelNode.textContent=complete?essayScoreLabel(score):'Preencha as competências';if(barNode){barNode.style.width=`${score/10}%`;barNode.dataset.tone=tone}
}

document.addEventListener('input',event=>{const form=event.target.closest?.('#essayForm');if(form)updateEssayScorePreview(form)});
document.addEventListener('change',event=>{const form=event.target.closest?.('#essayForm');if(form)updateEssayScorePreview(form)});
document.addEventListener('click',async event=>{
  const button=event.target.closest?.('[data-delete-essay]');if(!button)return;
  const essay=db.essays.find(item=>String(item.id)===button.dataset.deleteEssay);if(!essay)return;
  const confirmed=typeof studyConfirm==='function'?await studyConfirm({title:'Excluir redação?',description:`“${essay.theme}” e suas notas por competência serão removidas do histórico.`,confirmText:'Excluir redação'}):false;
  if(!confirmed)return;db.essays=db.essays.filter(item=>String(item.id)!==button.dataset.deleteEssay);await save();toast('Redação excluída');render();
});
