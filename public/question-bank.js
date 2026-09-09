// Question Bank workspace — one cohesive experience over the existing data layer.
(function(){
  const baseQuestionBind=bind;
  const registerBatchForm=batchCore;
  const registerSingleForm=singleCore;

  const clamp=value=>Math.max(0,Math.min(100,Math.round(Number(value)||0)));
  const dateLabel=value=>{
    const [year,month,day]=String(value||'').split('-');
    return day&&month&&year?`${day}/${month}/${year}`:'—';
  };
  const scoreTone=value=>value>=db.settings.cutoff?'success':value>=Math.max(0,db.settings.cutoff-15)?'warning':'danger';
  const confidenceLabel=total=>total>=40?'alta':total>=20?'boa':total>=10?'média':'inicial';
  const sessionSort=()=>db.questionSessions.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||Number(a.id||0)-Number(b.id||0));

  function qbNav(){
    const items=[
      ['questions','questions','Registrar','Adicionar e consultar questões'],
      ['performance','trend','Desempenho','Entender sua evolução'],
      ['errors','warning','Caderno de erros','Transformar falhas em revisão'],
      ['subjects','book-open','Disciplinas','Comparar matérias e assuntos']
    ];
    return `<nav class="qb-nav" aria-label="Áreas do Banco de questões">${items.map(([id,icon,label,description])=>`<button type="button" data-question-section="${id}" class="${questionSection===id?'active':''}" aria-current="${questionSection===id?'page':'false'}"><span>${svg(icon)}</span><span><b>${label}</b><small>${description}</small></span></button>`).join('')}</nav>`;
  }

  function qbPageHead(eyebrow,title,description,action=''){
    return `<div class="qb-page-head"><div><span class="qb-eyebrow">${eyebrow}</span><h2>${title}</h2><p>${description}</p></div>${action}</div>`;
  }

  function qbKpis(){
    const stats=getStats(),sessions=db.questionSessions.length,guessed=db.questionSessions.reduce((sum,item)=>sum+(Number(item.guessed)||0),0),doubted=db.questionSessions.reduce((sum,item)=>sum+(Number(item.doubted)||0),0),realGap=stats.apparent-stats.real;
    return `<section class="qb-kpis" aria-label="Resumo do Banco de questões">
      <article><span class="qb-kpi-icon neutral">${svg('questions')}</span><div><small>QUESTÕES RESOLVIDAS</small><strong>${fmt(stats.total)}</strong><p>${sessions} ${sessions===1?'sessão registrada':'sessões registradas'}</p></div></article>
      <article><span class="qb-kpi-icon success">${svg('check')}</span><div><small>TAXA DE ACERTOS</small><strong>${stats.apparent}%</strong><p>${fmt(stats.correct)} acertos no total</p></div></article>
      <article><span class="qb-kpi-icon focus">${svg('target')}</span><div><small>DOMÍNIO REAL</small><strong>${stats.real}%</strong><p>${realGap>0?`${realGap} p.p. abaixo do aparente`:'resultado consistente'}</p></div></article>
      <article><span class="qb-kpi-icon warning">${svg('warning')}</span><div><small>SINAIS DE ATENÇÃO</small><strong>${fmt(guessed+doubted)}</strong><p>${fmt(guessed)} chutes · ${fmt(doubted)} dúvidas</p></div></article>
    </section>`;
  }

  function qbWeakest(){
    return grouped().slice().sort((a,b)=>a.real-b.real||b.total-a.total)[0];
  }

  function qbRegisterAside(){
    const weakest=qbWeakest(),stats=getStats();
    return `<aside class="card qb-register-aside">
      <div class="qb-aside-heading"><span class="qb-kpi-icon focus">${svg('target')}</span><div><span class="qb-eyebrow">LEITURA RÁPIDA</span><h3>${weakest?'Prioridade sugerida':'Comece a medir'}</h3></div></div>
      ${weakest?`<div class="qb-priority"><span class="qb-priority-subject">${escapeHtml(subjectForRecord(weakest).name)}</span><strong>${escapeHtml(weakest.topic)}</strong><div><b class="${scoreTone(weakest.real)}-text">${weakest.real}%</b><span>domínio real</span></div><p>${fmt(weakest.total)} questões · confiança ${confidenceLabel(weakest.total)}</p></div>`:`<div class="qb-empty-mini"><span>${svg('questions')}</span><p>Seu primeiro registro libera diagnósticos por assunto.</p></div>`}
      <div class="qb-method">
        <h4>Como o resultado real funciona</h4>
        <p>Chutes, dúvidas e dificuldade ajustam o desempenho aparente para mostrar o que você realmente domina.</p>
        <div class="qb-method-legend"><span><i class="success"></i>acerto sólido</span><span><i class="warning"></i>atenção</span><span><i class="danger"></i>erro</span></div>
      </div>
      <div class="qb-cutoff"><span>Nota de corte</span><strong>${db.settings.cutoff}%</strong><i><b style="width:${clamp(stats.real)}%"></b><em style="left:${clamp(db.settings.cutoff)}%"></em></i><small>Seu domínio atual: ${stats.real}%</small></div>
    </aside>`;
  }

  function qbModeTabs(){
    return `<div class="qb-mode-tabs" role="tablist" aria-label="Modo de registro"><button type="button" role="tab" aria-selected="${questionTab==='batch'}" data-qtab="batch" class="${questionTab==='batch'?'active':''}"><span>${svg('plus')}</span><span><b>Sessão completa</b><small>Registre uma lista de uma vez</small></span></button><button type="button" role="tab" aria-selected="${questionTab==='single'}" data-qtab="single" class="${questionTab==='single'?'active':''}"><span>${svg('clipboard')}</span><span><b>Questão por questão</b><small>Acompanhe enquanto resolve</small></span></button></div>`;
  }

  function qbHistory(){
    const sessions=db.questionSessions.slice().reverse();
    const rows=sessions.map(item=>{
      const subjectItem=subjectForRecord(item),wrong=Math.max(0,(Number(item.total)||0)-(Number(item.correct)||0)),score=real(item),tone=scoreTone(score);
      return `<tr><td><time>${dateLabel(item.date)}</time></td><td><span class="qb-subject-cell"><i style="background:${escapeHtml(subjectItem.color)}"></i><span><b>${escapeHtml(subjectItem.name)}</b><small>${escapeHtml(item.topic||'Sem assunto')}</small></span></span></td><td><b>${fmt(item.total)}</b></td><td><span class="qb-value success-text">${fmt(item.correct)}</span></td><td><span class="qb-value danger-text">${fmt(wrong)}</span></td><td>${apparent(item)}%</td><td><span class="qb-score ${tone}">${score}%</span></td></tr>`;
    }).join('');
    return `<section class="card qb-history-card"><div class="qb-section-heading"><div><span class="qb-eyebrow">HISTÓRICO</span><h3>Registros recentes</h3><p>Filtre os dados sem perder o contexto do seu desempenho.</p></div><span id="visibleQuestionCount" class="qb-count">${sessions.length} ${sessions.length===1?'registro':'registros'}</span></div>
      <div class="question-toolbar qb-toolbar"><label class="question-search"><span>${svg('questions')}</span><input id="questionSearch" type="search" placeholder="Buscar matéria ou assunto…" aria-label="Buscar registros"></label><select id="questionSubjectFilter" aria-label="Filtrar por matéria"><option value="">Todas as matérias</option>${options()}</select><select id="questionStatusFilter" aria-label="Filtrar por desempenho"><option value="">Todos os desempenhos</option><option value="weak">Abaixo do corte</option><option value="strong">No corte ou acima</option></select></div>
      <div class="question-history qb-table-shell">${sessions.length?`<table><thead><tr><th>Data</th><th>Matéria e assunto</th><th>Questões</th><th>Acertos</th><th>Erros</th><th>Aparente</th><th>Real</th></tr></thead><tbody>${rows}</tbody></table>`:`<div class="qb-empty"><span>${svg('questions')}</span><h3>Seu histórico começa aqui</h3><p>Registre uma sessão ou uma questão individual para acompanhar a evolução.</p></div>`}</div>
    </section>`;
  }

  function qbRegisterView(){
    return `${qbPageHead('BANCO DE QUESTÕES','Treine com clareza, evolua com evidência.','Registre resultados, entenda seus padrões e transforme cada erro em uma próxima ação.',`<button type="button" class="secondary qb-head-action" data-question-section="errors">${svg('warning')} Revisar erros</button>`)}${qbKpis()}<section class="qb-register-layout"><article class="card qb-form-card"><div class="qb-form-intro"><div><span class="qb-eyebrow">NOVO REGISTRO</span><h3>Como você quer registrar?</h3><p>Escolha o fluxo que combina com o seu momento de estudo.</p></div></div>${qbModeTabs()}<div class="qb-form-body">${questionTab==='batch'?registerBatchForm():registerSingleForm()}</div></article>${qbRegisterAside()}</section>${qbHistory()}`;
  }

  function qbEvolutionChart(){
    const items=sessionSort().slice(-10);
    if(!items.length)return `<div class="qb-empty chart-empty"><span>${svg('trend')}</span><h3>A evolução aparecerá aqui</h3><p>Registre ao menos uma sessão de questões.</p></div>`;
    const width=760,height=238,left=42,right=20,top=22,bottom=42,plotW=width-left-right,plotH=height-top-bottom,step=items.length>1?plotW/(items.length-1):0;
    const point=(item,index,kind)=>({x:left+(items.length===1?plotW/2:index*step),y:top+(100-(kind==='real'?real(item):apparent(item)))/100*plotH,value:kind==='real'?real(item):apparent(item)});
    const realPoints=items.map((item,index)=>point(item,index,'real')),apparentPoints=items.map((item,index)=>point(item,index,'apparent'));
    const poly=points=>points.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),areaPath=`M ${realPoints[0].x} ${top+plotH} L ${realPoints.map(p=>`${p.x} ${p.y}`).join(' L ')} L ${realPoints.at(-1).x} ${top+plotH} Z`;
    return `<div class="qb-chart" role="img" aria-label="Evolução do desempenho aparente e real"><svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><defs><linearGradient id="qbArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--qb-success)" stop-opacity=".2"/><stop offset="1" stop-color="var(--qb-success)" stop-opacity="0"/></linearGradient></defs>${[0,25,50,75,100].map(value=>{const y=top+(100-value)/100*plotH;return `<g><line x1="${left}" x2="${width-right}" y1="${y}" y2="${y}"/><text x="4" y="${y+3}">${value}%</text></g>`}).join('')}<path class="qb-chart-area" d="${areaPath}"/><polyline class="qb-chart-line apparent" points="${poly(apparentPoints)}"/><polyline class="qb-chart-line real" points="${poly(realPoints)}"/>${realPoints.map((p,index)=>`<g class="qb-chart-point"><circle cx="${p.x}" cy="${p.y}" r="4"/><title>${dateLabel(items[index].date)}: ${p.value}% real</title></g>`).join('')}${items.map((item,index)=>`<text class="qb-chart-date" x="${left+(items.length===1?plotW/2:index*step)}" y="${height-12}" text-anchor="middle">${dateLabel(item.date).slice(0,5)}</text>`).join('')}</svg></div>`;
  }

  function qbPerformanceView(){
    const stats=getStats(),rows=grouped(),strong=rows.filter(item=>item.real>=db.settings.cutoff),weak=rows.filter(item=>item.real<db.settings.cutoff),recent=sessionSort().slice(-5),previous=sessionSort().slice(-10,-5),recentAvg=recent.length?Math.round(recent.reduce((sum,item)=>sum+real(item),0)/recent.length):0,previousAvg=previous.length?Math.round(previous.reduce((sum,item)=>sum+real(item),0)/previous.length):0,delta=previous.length?recentAvg-previousAvg:0;
    return `${qbPageHead('ANÁLISE DE DESEMPENHO','Veja além da porcentagem.','Compare evolução, domínio real e qualidade da amostra para decidir onde investir seu tempo.',`<button type="button" class="primary qb-head-action" data-question-section="questions">${svg('plus')} Registrar questões</button>`)}
      <section class="qb-analysis-kpis"><article><small>DOMÍNIO REAL</small><strong>${stats.real}%</strong><span class="${scoreTone(stats.real)}">${stats.real>=db.settings.cutoff?'meta alcançada':'abaixo do corte'}</span></article><article><small>EVOLUÇÃO RECENTE</small><strong>${delta>0?'+':''}${delta}%</strong><span class="${delta>=0?'success':'danger'}">últimas 5 sessões</span></article><article><small>TÓPICOS NO CORTE</small><strong>${strong.length}<em>/${rows.length}</em></strong><span class="neutral">${rows.length?Math.round(strong.length/rows.length*100):0}% dominados</span></article><article><small>BASE DE DADOS</small><strong>${fmt(stats.total)}</strong><span class="neutral">${confidenceLabel(stats.total)} confiança geral</span></article></section>
      <section class="qb-analysis-grid"><article class="card qb-evolution-card"><div class="qb-section-heading"><div><span class="qb-eyebrow">EVOLUÇÃO</span><h3>Desempenho por sessão</h3><p>O resultado real desconta chutes e dúvidas.</p></div><div class="qb-chart-legend"><span><i class="apparent"></i>Aparente</span><span><i class="real"></i>Real</span></div></div>${qbEvolutionChart()}</article>
      <aside class="card qb-diagnostic-card"><div class="qb-section-heading"><div><span class="qb-eyebrow">DIAGNÓSTICO</span><h3>Saúde do aprendizado</h3></div></div><div class="qb-ring" style="--value:${clamp(stats.real)}"><div><strong>${stats.real}%</strong><span>domínio real</span></div></div><div class="qb-diagnostic-list"><span><i class="success"></i><b>${strong.length}</b> tópicos dominados</span><span><i class="danger"></i><b>${weak.length}</b> abaixo do corte</span><span><i class="warning"></i><b>${Math.max(0,stats.apparent-stats.real)} p.p.</b> de diferença aparente</span></div></aside></section>
      <section class="card qb-ranking-card"><div class="qb-section-heading"><div><span class="qb-eyebrow">POR ASSUNTO</span><h3>Mapa de domínio</h3><p>Prioridade para os menores resultados com amostra relevante.</p></div><span class="qb-count">corte ${db.settings.cutoff}%</span></div><div class="qb-ranking">${rows.map((item,index)=>{const subjectItem=subjectForRecord(item),tone=scoreTone(item.real);return `<article><span class="qb-rank">${index+1}</span><span class="qb-ranking-name"><i style="background:${escapeHtml(subjectItem.color)}"></i><span><b>${escapeHtml(subjectItem.name)}</b><small>${escapeHtml(item.topic)} · ${fmt(item.total)} questões · confiança ${confidenceLabel(item.total)}</small></span></span><span class="qb-ranking-bar"><i><b class="${tone}" style="width:${clamp(item.real)}%"></b></i></span><strong class="${tone}-text">${item.real}%</strong></article>`}).join('')||`<div class="qb-empty"><span>${svg('trend')}</span><h3>Sem dados para comparar</h3><p>Registre questões em diferentes assuntos para criar este mapa.</p></div>`}</div></section>`;
  }

  function qbErrorGroups(){
    const map={};
    db.questionSessions.forEach(item=>{
      const key=`${item.subject}|${item.topic}`,total=Number(item.total)||0,correct=Number(item.correct)||0;
      if(!map[key])map[key]={subject:item.subject,subjectName:subjectForRecord(item).name,topic:item.topic||'Sem assunto',total:0,correct:0,errors:0,guessed:0,doubted:0,skipped:0,lastDate:item.date,weighted:0};
      const row=map[key];row.total+=total;row.correct+=correct;row.errors+=Math.max(0,total-correct);row.guessed+=Number(item.guessed)||0;row.doubted+=Number(item.doubted)||0;row.skipped+=Number(item.skipped)||0;row.weighted+=real(item)*total;if(String(item.date)>String(row.lastDate))row.lastDate=item.date;
    });
    return Object.values(map).map(row=>({...row,real:row.total?Math.round(row.weighted/row.total):0,priority:row.errors*3+row.doubted*2+row.guessed+row.skipped})).filter(row=>row.errors||row.doubted||row.guessed||row.skipped).sort((a,b)=>b.priority-a.priority||a.real-b.real);
  }

  function qbErrorsView(){
    const rows=qbErrorGroups(),totalErrors=rows.reduce((sum,item)=>sum+item.errors,0),totalDoubts=rows.reduce((sum,item)=>sum+item.doubted,0),totalGuesses=rows.reduce((sum,item)=>sum+item.guessed,0),priority=rows[0];
    return `${qbPageHead('REVISÃO INTELIGENTE','Caderno de erros','Priorize os padrões que mais tiram pontos e volte ao conteúdo com uma ação clara.',`<button type="button" class="primary qb-head-action" data-question-section="questions">${svg('plus')} Novo registro</button>`)}
      <section class="qb-error-summary"><article class="danger"><span>${svg('warning')}</span><div><small>ERROS MAPEADOS</small><strong>${fmt(totalErrors)}</strong><p>em ${rows.length} ${rows.length===1?'assunto':'assuntos'}</p></div></article><article class="warning"><span>${svg('pie')}</span><div><small>RESPOSTAS COM DÚVIDA</small><strong>${fmt(totalDoubts)}</strong><p>pedem reforço conceitual</p></div></article><article class="neutral"><span>${svg('target')}</span><div><small>ACERTOS NO CHUTE</small><strong>${fmt(totalGuesses)}</strong><p>acerto sem domínio sólido</p></div></article>${priority?`<article class="priority"><span>${svg('guide')}</span><div><small>PRÓXIMA REVISÃO</small><strong>${escapeHtml(priority.topic)}</strong><p>${escapeHtml(priority.subjectName)}</p></div></article>`:`<article class="success"><span>${svg('check')}</span><div><small>STATUS</small><strong>Tudo certo</strong><p>nenhum sinal de atenção</p></div></article>`}</section>
      <section class="qb-error-layout"><div class="qb-error-list">${rows.map((item,index)=>{const subjectItem=subjectForRecord(item),isCurrent=db.subjects.some(subject=>subject.id===item.subject);return `<article class="card qb-error-card"><div class="qb-error-rank"><span>${index+1}</span><i style="background:${escapeHtml(subjectItem.color)}"></i></div><div class="qb-error-main"><div class="qb-error-title"><div><span>${escapeHtml(subjectItem.name)}</span><h3>${escapeHtml(item.topic)}</h3></div><strong>${item.errors} ${item.errors===1?'erro':'erros'}</strong></div><div class="qb-error-signals"><span><i class="danger"></i>${item.errors} erros</span><span><i class="warning"></i>${item.doubted} dúvidas</span><span><i class="neutral"></i>${item.guessed} chutes certos</span><time>${dateLabel(item.lastDate)}</time></div><div class="qb-error-progress"><span><b>Domínio real</b><em>confiança ${confidenceLabel(item.total)}</em></span><i><b class="${scoreTone(item.real)}" style="width:${clamp(item.real)}%"></b></i><strong class="${scoreTone(item.real)}-text">${item.real}%</strong></div></div>${isCurrent?`<button type="button" class="secondary qb-review" data-review-subject="${escapeHtml(item.subject)}" data-page="study">${svg('book-open')} Revisar</button>`:`<span class="qb-archived">Arquivada</span>`}</article>`}).join('')||`<div class="card qb-empty"><span>${svg('check')}</span><h3>Nenhum ponto crítico encontrado</h3><p>Continue registrando suas questões; dúvidas e erros aparecerão aqui automaticamente.</p><button type="button" class="primary" data-question-section="questions">Registrar questões</button></div>`}</div>
      <aside class="card qb-review-method"><span class="qb-kpi-icon focus">${svg('guide')}</span><span class="qb-eyebrow">CICLO DE CORREÇÃO</span><h3>Revise com intenção</h3><ol><li><b>Entenda a causa</b><span>Conteúdo, interpretação ou atenção?</span></li><li><b>Recupere da memória</b><span>Tente explicar sem consultar o material.</span></li><li><b>Resolva novamente</b><span>Faça uma questão semelhante em até 48h.</span></li></ol><p>Os itens são ordenados por erros, dúvidas, chutes e questões puladas.</p></aside></section>`;
  }

  function qbSubjectsView(){
    const totalQuestions=getStats().total;
    return `${qbPageHead('MAPA DE DISCIPLINAS','Disciplinas','Visualize cobertura, domínio e assuntos que ainda precisam de evidência.',`<button type="button" class="secondary qb-head-action" data-page="settings">${svg('settings')} Editar estrutura</button>`)}
      <section class="qb-subject-overview"><article><span>${svg('book-open')}</span><div><small>MATÉRIAS</small><strong>${db.subjects.length}</strong><p>em ${db.knowledgeAreas.length} categorias</p></div></article><article><span>${svg('clipboard')}</span><div><small>ASSUNTOS MAPEADOS</small><strong>${db.subjects.reduce((sum,item)=>sum+item.topics.length,0)}</strong><p>estrutura disponível</p></div></article><article><span>${svg('questions')}</span><div><small>QUESTÕES DISTRIBUÍDAS</small><strong>${fmt(totalQuestions)}</strong><p>em toda a base</p></div></article></section>
      <div class="qb-subject-groups">${db.knowledgeAreas.map(areaItem=>{const areaSubjects=subjectsFor(areaItem.id),areaTotal=areaSubjects.reduce((sum,subjectItem)=>sum+db.questionSessions.filter(item=>item.subject===subjectItem.id).reduce((value,item)=>value+(Number(item.total)||0),0),0);return `<section class="card qb-subject-group"><div class="qb-section-heading"><div><span class="qb-eyebrow">CATEGORIA PRINCIPAL</span><h3>${escapeHtml(areaItem.name)}</h3><p>${areaSubjects.length} ${areaSubjects.length===1?'matéria':'matérias'} · ${fmt(areaTotal)} questões</p></div><span class="qb-count">${areaSubjects.length}</span></div><div class="qb-subject-grid">${areaSubjects.map(subjectItem=>{const sessions=db.questionSessions.filter(item=>item.subject===subjectItem.id),total=sessions.reduce((sum,item)=>sum+(Number(item.total)||0),0),weighted=sessions.reduce((sum,item)=>sum+real(item)*(Number(item.total)||0),0),score=total?Math.round(weighted/total):0,topicRows=grouped().filter(item=>item.subject===subjectItem.id),weak=topicRows[0],covered=new Set(sessions.map(item=>item.topic)).size,tone=scoreTone(score);return `<article class="qb-subject-card"><div class="qb-subject-top"><span class="qb-subject-avatar" style="--subject:${escapeHtml(subjectItem.color)}">${escapeHtml(subjectItem.name.charAt(0)||'?')}</span><div><h4>${escapeHtml(subjectItem.name)}</h4><p>${subjectItem.topics.length} ${subjectItem.topics.length===1?'assunto':'assuntos'}</p></div><strong class="${tone}-text">${score}%</strong></div><div class="qb-subject-progress"><span><b>Cobertura</b><em>${covered}/${subjectItem.topics.length}</em></span><i><b style="width:${subjectItem.topics.length?clamp(covered/subjectItem.topics.length*100):0}%;background:${escapeHtml(subjectItem.color)}"></b></i></div><div class="qb-subject-meta"><span>${fmt(total)} questões</span><span>confiança ${confidenceLabel(total)}</span></div>${weak?`<div class="qb-subject-focus"><span>Revisar primeiro</span><b>${escapeHtml(weak.topic)}</b><em>${weak.real}% real</em></div>`:`<div class="qb-subject-focus empty"><span>Sem diagnóstico ainda</span><b>Registre questões desta matéria</b></div>`}<button type="button" class="secondary" data-qb-start-subject="${escapeHtml(subjectItem.id)}">${svg('plus')} Registrar nesta matéria</button></article>`}).join('')||`<div class="qb-empty"><span>${svg('book-open')}</span><h3>Nenhuma matéria nesta categoria</h3><p>Use as configurações para completar sua estrutura.</p></div>`}</div></section>`}).join('')}</div>`;
  }

  questions=function(){
    const content=questionSection==='performance'?qbPerformanceView():questionSection==='errors'?qbErrorsView():questionSection==='subjects'?qbSubjectsView():qbRegisterView();
    return `<div class="qb-shell">${qbNav()}${content}</div>`;
  };

  bind=function(){
    baseQuestionBind();
    if(page!=='questions')return;
    $$('[data-qb-start-subject]').forEach(button=>button.onclick=()=>{
      questionSection='questions';questionTab='batch';render();
      requestAnimationFrame(()=>{
        const selected=db.subjects.find(item=>item.id===button.dataset.qbStartSubject),areaSelect=$('#qArea'),subjectSelect=$('#qSubject');
        if(selected&&areaSelect&&subjectSelect){areaSelect.value=selected.areaId;areaSelect.dispatchEvent(new Event('change'));subjectSelect.value=selected.id;subjectSelect.dispatchEvent(new Event('change'))}
        $('.qb-form-card')?.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
    const pageAction=$('.qb-head-action[data-question-section]');
    if(pageAction)pageAction.onclick=()=>{questionSection=pageAction.dataset.questionSection;render()};
  };
})();
