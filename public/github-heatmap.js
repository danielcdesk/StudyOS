// GitHub-style study contribution calendar for the 12 months ending at the selected month.
var githubDashboardBase=dashboard;
dashboard=function(){return githubDashboardBase().replace('Últimas 13 semanas','Últimos 12 meses')};

function localDateKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function githubActivityLevel(minutes,questions){
 const score=(Number(minutes)||0)/25+(Number(questions)||0)/10;
 return score>=10?4:score>=6?3:score>=3?2:score>0?1:0;
}
heatmap=function(){
 const activity={};
 db.studySessions.forEach(item=>{activity[item.date]??={minutes:0,questions:0};activity[item.date].minutes+=Number(item.minutes)||0});
 db.questionSessions.forEach(item=>{activity[item.date]??={minutes:0,questions:0};activity[item.date].questions+=Number(item.total)||0});
 const [year,month]=selectedHeatmapMonth.split('-').map(Number),today=new Date(),monthEnd=new Date(year,month,0),currentMonth=today.getFullYear()===year&&today.getMonth()===month-1;
 const end=currentMonth?new Date(today.getFullYear(),today.getMonth(),today.getDate()):monthEnd;
 const start=new Date(end);start.setDate(end.getDate()-364);start.setDate(start.getDate()-start.getDay());
 const weeks=53,cells=[];let activeDays=0,totalMinutes=0,totalQuestions=0;
 for(let week=0;week<weeks;week++)for(let day=0;day<7;day++){
  const date=new Date(start);date.setDate(start.getDate()+week*7+day);const key=localDateKey(date),data=activity[key]||{minutes:0,questions:0},outside=date>end;
  if(!outside&&(data.minutes||data.questions)){activeDays++;totalMinutes+=data.minutes;totalQuestions+=data.questions}
  const level=outside?0:githubActivityLevel(data.minutes,data.questions),label=`${date.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}: ${data.minutes} min de estudo · ${data.questions} questões`;
  cells.push(`<span class="heat gh-day ${level?'level-'+level:''} ${outside?'outside':''} ${localDateKey(date)===localDateKey(today)?'today':''}" style="grid-column:${week+2};grid-row:${day+2};--heat-order:${week*7+day}" title="${label}" role="gridcell" aria-label="${label}" data-date="${key}"></span>`)
 }
 const monthLabels=[];let cursor=new Date(start.getFullYear(),start.getMonth(),1),lastColumn=-1;
 while(cursor<=end){const column=Math.max(2,Math.min(54,Math.round((cursor-start)/(7*86400000))+2));if(column!==lastColumn){monthLabels.push(`<span class="gh-month" style="grid-column:${column};grid-row:1">${cursor.toLocaleDateString('pt-BR',{month:'short'}).replace('.','')}</span>`);lastColumn=column}cursor=new Date(cursor.getFullYear(),cursor.getMonth()+1,1)}
 const options=Array.from({length:18},(_,index)=>{const date=new Date();date.setDate(1);date.setMonth(date.getMonth()-index);const value=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`,label=date.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return `<option value="${value}" ${value===selectedHeatmapMonth?'selected':''}>${label}</option>`}).join('');
 return `<div class="github-calendar"><div class="heatmap-toolbar github-toolbar"><div><span>Atividade de estudo</span><small>${activeDays} dias ativos no período</small></div><label><span>Período até</span><select id="heatmapMonth" aria-label="Selecionar mês final do calendário">${options}</select></label></div><div class="github-scroll"><div class="github-grid" role="grid" aria-label="Calendário de atividade dos últimos 12 meses">${monthLabels.join('')}<span class="gh-weekday" style="grid-row:3">Seg</span><span class="gh-weekday" style="grid-row:5">Qua</span><span class="gh-weekday" style="grid-row:7">Sex</span>${cells.join('')}</div></div><div class="github-footer"><span><b>${totalQuestions.toLocaleString('pt-BR')}</b> questões · <b>${totalMinutes.toLocaleString('pt-BR')}</b> minutos</span><span class="github-scale">Menos <i></i><i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><i class="level-4"></i> Mais</span></div></div>`
};
