// Interactive chart exploration without losing the user's place on the page.
const chartUIState={confidence:null,donuts:new Map(),lineSeries:null,barSeries:null};
var interactiveBindBase=bind;

function stableRender(){
 const left=window.scrollX,top=window.scrollY;document.body.classList.add('stable-refresh');render();
 requestAnimationFrame(()=>{window.scrollTo(left,top);requestAnimationFrame(()=>setTimeout(()=>document.body.classList.remove('stable-refresh'),40))});
}
function pulseChart(chart){chart.classList.remove('segment-changing');void chart.offsetWidth;chart.classList.add('segment-changing')}
function makeKeyable(element,activate){
 element.setAttribute('role','button');element.setAttribute('aria-pressed','false');element.tabIndex=0;element.dataset.chartControl='1';element._chartActivate=activate;
}
function setRowState(rows,index){
 rows.forEach((row,i)=>{row.classList.toggle('is-selected',index===i);row.classList.toggle('is-muted',index!==null&&index!==i);row.setAttribute('aria-pressed',String(index===i))});
}
function enhanceConfidence(){
 const card=$('.confidence-card');if(!card||card.dataset.interactive)return;card.dataset.interactive='1';
 const donut=$('.confidence-donut',card),center=$('.confidence-donut>div',card),rows=$$('.confidence-list>div',card);
 if(!donut||!center||!rows.length)return;const original=center.innerHTML;
 const select=(requested,user=false)=>{
  const index=user&&chartUIState.confidence===requested?null:requested;chartUIState.confidence=index;
  if(index===null){delete card.dataset.segment;card.style.removeProperty('--selected-chart-color');center.innerHTML=original;setRowState(rows,null);pulseChart(donut);return}
  const row=rows[index],dot=$('i',row),label=$('span',row).textContent.trim(),percentage=$('small',row)?.textContent.trim()||'0%';
  const color=getComputedStyle(dot).backgroundColor;card.dataset.segment=String(index);card.style.setProperty('--selected-chart-color',color);row.style.setProperty('--segment-color',color);
  center.innerHTML=`<b>${percentage}</b><span>${label}</span>`;setRowState(rows,index);pulseChart(donut);
 };
 rows.forEach((row,index)=>{const color=getComputedStyle($('i',row)).backgroundColor;row.style.setProperty('--segment-color',color);row.title=`Destacar ${$('span',row).textContent.trim()}`;makeKeyable(row,()=>select(index,true))});
 if(chartUIState.confidence!==null)select(chartUIState.confidence);
}
function enhanceDonuts(){
 $$('.donut-wrap').forEach(wrap=>{const donut=$('.donut',wrap),rows=$$('.legend>span',wrap),card=wrap.closest('.card');if(!donut||!rows.length||wrap.dataset.interactive)return;wrap.dataset.interactive='1';
  const key=$('.card-head h2',card)?.textContent.trim()||`donut-${chartUIState.donuts.size}`,original=donut.querySelector('b')?.textContent||'';
  const values=rows.map(row=>Number($('strong',row)?.textContent.replace(/\D/g,'')||0)),total=Math.max(1,values.reduce((sum,value)=>sum+value,0));
  const select=(requested,user=false)=>{const current=chartUIState.donuts.get(key),index=user&&current===requested?null:requested;
   if(index===null){chartUIState.donuts.delete(key);card.classList.remove('donut-card-selected');card.style.removeProperty('--selected-chart-color');donut.querySelector('b').textContent=original;setRowState(rows,null);pulseChart(donut);return}
   chartUIState.donuts.set(key,index);const color=getComputedStyle($('i',rows[index])).backgroundColor;card.classList.add('donut-card-selected');card.style.setProperty('--selected-chart-color',color);rows[index].style.setProperty('--segment-color',color);donut.querySelector('b').textContent=`${Math.round(values[index]/total*100)}%`;setRowState(rows,index);pulseChart(donut);
  };
  rows.forEach((row,index)=>{const label=[...row.childNodes].find(node=>node.nodeType===Node.TEXT_NODE)?.textContent.trim()||'série';row.style.setProperty('--segment-color',getComputedStyle($('i',row)).backgroundColor);row.title=`Destacar ${label}`;makeKeyable(row,()=>select(index,true))});
  if(chartUIState.donuts.has(key))select(chartUIState.donuts.get(key));
 })
}
function enhanceChartSeries(){
 const evolution=$('.evolution-card');if(evolution){const rows=$$('.chart-legend>span',evolution);rows.forEach((row,index)=>{row.style.setProperty('--segment-color',getComputedStyle($('i',row)).backgroundColor);if(row.dataset.interactive)return;row.dataset.interactive='1';const value=index===0?'apparent':'real';makeKeyable(row,()=>{chartUIState.lineSeries=chartUIState.lineSeries===value?null:value;evolution.dataset.series=chartUIState.lineSeries||'';setRowState(rows,chartUIState.lineSeries?index:null)})});if(chartUIState.lineSeries){evolution.dataset.series=chartUIState.lineSeries;setRowState(rows,chartUIState.lineSeries==='apparent'?0:1)}}
 $$('.chart').forEach(chart=>{const card=chart.closest('.card'),rows=$$('.chart-legend>span',card);if(rows.length!==2||card.classList.contains('evolution-card'))return;rows.forEach((row,index)=>{row.style.setProperty('--segment-color',getComputedStyle($('i',row)).backgroundColor);if(row.dataset.interactive)return;row.dataset.interactive='1';const value=index===0?'apparent':'real';makeKeyable(row,()=>{chartUIState.barSeries=chartUIState.barSeries===value?null:value;card.dataset.barSeries=chartUIState.barSeries||'';setRowState(rows,chartUIState.barSeries?index:null)})});if(chartUIState.barSeries){card.dataset.barSeries=chartUIState.barSeries;setRowState(rows,chartUIState.barSeries==='apparent'?0:1)}})
}
function closeSmartSelects(except){$$('.smart-select.open').forEach(item=>{if(item!==except){item.classList.remove('open');$('.smart-select-trigger',item)?.setAttribute('aria-expanded','false')}})}
function enhanceSelect(select){
 if(!select||select.dataset.smartSelect)return;select.dataset.smartSelect='1';select.classList.add('smart-native-select');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
 const shell=document.createElement('div');shell.className='smart-select';select.parentNode.insertBefore(shell,select);shell.appendChild(select);
 const trigger=document.createElement('button');trigger.type='button';trigger.className='smart-select-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
 const menu=document.createElement('div');menu.className='smart-select-menu';menu.setAttribute('role','listbox');
 const update=()=>{const option=select.options[select.selectedIndex];trigger.innerHTML=`<span>${option?.textContent||'Selecionar'}</span>${svg('chevron')}`;$$('.smart-select-option',menu).forEach((button,index)=>button.setAttribute('aria-selected',String(index===select.selectedIndex)))};
 [...select.options].forEach((option,index)=>{const button=document.createElement('button');button.type='button';button.className='smart-select-option';button.setAttribute('role','option');button.textContent=option.textContent;button.onclick=()=>{select.selectedIndex=index;update();closeSmartSelects();select.dispatchEvent(new Event('change',{bubbles:true}))};menu.appendChild(button)});
 trigger.onclick=event=>{event.stopPropagation();const open=!shell.classList.contains('open');closeSmartSelects(shell);shell.classList.toggle('open',open);trigger.setAttribute('aria-expanded',String(open));if(open)$('.smart-select-option[aria-selected="true"]',menu)?.focus()};
 trigger.onkeydown=event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if(!shell.classList.contains('open'))trigger.click()}}
 menu.addEventListener('keydown',event=>{const options=$$('.smart-select-option',menu),current=options.indexOf(document.activeElement);if(event.key==='Escape'){closeSmartSelects();trigger.focus()}if(event.key==='ArrowDown'){event.preventDefault();options[(current+1)%options.length]?.focus()}if(event.key==='ArrowUp'){event.preventDefault();options[(current-1+options.length)%options.length]?.focus()}});
 shell.append(trigger,menu);update();
}
function updatePaletteWithoutRender(button){
 if(db.settings.palette===button.dataset.palette)return;db.settings.palette=button.dataset.palette;applyPalette();
 $$('[data-palette]').forEach(option=>{const active=option===button;option.classList.toggle('active',active);let check=$('b',option);if(active&&!check){check=document.createElement('b');option.appendChild(check)}if(check)check.textContent=active?'✓':''});
 save();
}
function enhanceInteractiveCharts(){enhanceConfidence();enhanceDonuts();enhanceChartSeries();enhanceSelect($('#examFilter'));enhanceSelect($('#heatmapMonth'));enhanceSelect($('#settingsForm select[name="exam"]'))}

bind=function(){
 interactiveBindBase();enhanceInteractiveCharts();
 $$('[data-palette]').forEach(button=>button.onclick=()=>updatePaletteWithoutRender(button));
 const exam=$('#examFilter');if(exam)exam.onchange=()=>{db.settings.exam=exam.value;stableRender();save()};
 const month=$('#heatmapMonth');if(month)month.onchange=()=>{selectedHeatmapMonth=month.value;stableRender()};
 const settingsForm=$('#settingsForm');if(settingsForm)settingsForm.onsubmit=async event=>{event.preventDefault();const values=fd(settingsForm);['cutoff','annualGoal','studyMinutes','breakMinutes'].forEach(key=>values[key]=+values[key]);db.settings={...db.settings,...values};await save();updateProfile();toast('Configurações salvas sem interromper sua navegação')};
};
document.addEventListener('click',event=>{const control=event.target.closest('[data-chart-control]');if(control?._chartActivate)control._chartActivate();if(!event.target.closest('.smart-select'))closeSmartSelects()});
document.addEventListener('keydown',event=>{const control=event.target.closest?.('[data-chart-control]');if(control?._chartActivate&&(event.key==='Enter'||event.key===' ')){event.preventDefault();control._chartActivate()}});
window.addEventListener('scroll',()=>closeSmartSelects(),{passive:true});
window.addEventListener('load',enhanceInteractiveCharts);
