// Motion and interaction enhancements. All effects remain decorative and optional.
var dynamicRenderBase=render;

function animateNumber(element){
 if(!motionEnabled||matchMedia('(prefers-reduced-motion: reduce)').matches||element.dataset.counted)return;
 const raw=element.textContent.trim(),match=raw.match(/^(\d[\d.]*)\s*(%)?$/);
 if(!match||element.children.length)return;
 const target=Number(match[1].replaceAll('.','')),suffix=match[2]||'';
 if(!Number.isFinite(target)||target===0)return;
 element.dataset.counted='1';element.setAttribute('aria-label',raw);
 const started=performance.now(),duration=Math.min(850,430+target*.6),formatter=new Intl.NumberFormat('pt-BR');
 const frame=now=>{const progress=Math.min(1,(now-started)/duration),eased=1-Math.pow(1-progress,3);element.textContent=`${formatter.format(Math.round(target*eased))}${suffix}`;if(progress<1)requestAnimationFrame(frame)};
 requestAnimationFrame(frame);
}
function addCardLight(card){
 if(card.dataset.dynamicLight)return;card.dataset.dynamicLight='1';
 card.addEventListener('pointermove',event=>{const box=card.getBoundingClientRect();card.style.setProperty('--pointer-x',`${event.clientX-box.left}px`);card.style.setProperty('--pointer-y',`${event.clientY-box.top}px`)});
}
function addChartGuide(chart){
 if(chart.querySelector('.chart-guide'))return;
 const guide=document.createElement('i');guide.className='chart-guide';chart.appendChild(guide);
 chart.addEventListener('pointermove',event=>{const box=chart.getBoundingClientRect();guide.style.left=`${Math.max(28,Math.min(box.width-28,event.clientX-box.left))}px`});
}
function enhanceDynamicUI(){
 polishIcons();
 $$('#app .card').forEach((card,index)=>{card.style.setProperty('--surface-order',Math.min(index,12));card.classList.add('is-dynamic-visible');addCardLight(card)});
 $$('#app .metric strong,.confidence-donut b').forEach(animateNumber);
 $$('.bar').forEach((bar,index)=>bar.style.setProperty('--motion-order',index));
 $$('.point-real').forEach((point,index)=>point.style.setProperty('--point-order',index));
 $$('.heat').forEach((cell,index)=>cell.style.setProperty('--heat-order',index));
 $$('.progress i,.enemy-track i,.performance-track i').forEach((bar,index)=>bar.style.setProperty('--motion-order',Math.min(index,12)));
 $$('.evolution-chart').forEach(addChartGuide);
}
render=function(){dynamicRenderBase();requestAnimationFrame(enhanceDynamicUI)};
document.addEventListener('click',event=>{
 const button=event.target.closest('button,.primary,.secondary');if(!button||!motionEnabled||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const box=button.getBoundingClientRect(),size=Math.max(box.width,box.height)*1.35,ripple=document.createElement('span');
 ripple.className='button-ripple';ripple.style.width=ripple.style.height=`${size}px`;ripple.style.left=`${event.clientX-box.left}px`;ripple.style.top=`${event.clientY-box.top}px`;button.appendChild(ripple);setTimeout(()=>ripple.remove(),600);
});
window.addEventListener('load',()=>requestAnimationFrame(enhanceDynamicUI));
requestAnimationFrame(enhanceDynamicUI);
