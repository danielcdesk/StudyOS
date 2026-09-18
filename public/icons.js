// Coolicons v4.1 — supplied by the user and rendered as color-adaptive masks.
const coolicons={
 dashboard:'dashboard',study:'timer',questions:'questions',lessons:'lessons',exams:'exams',essays:'essays',guide:'guide',settings:'settings',
 plus:'plus',edit:'edit',trash:'trash',close:'close',chevron:'chevron',reset:'reset',play:'play',pause:'pause',moon:'moon',sun:'sun',
 chart:'chart',pie:'pie',trend:'trend',warning:'warning',calendar:'calendar',bell:'bell',user:'user',check:'check',book:'book',menu:'menu',
 'book-open':'book',clipboard:'exams',clock:'timer','trending-up':'trend',target:'guide',award:'check'
};
const svg=name=>`<span class="ui-icon coolicon" style="--coolicon:url('assets/coolicons/${coolicons[name]||name}.png')" aria-hidden="true"></span>`;

function iconForHeading(text=''){
 const value=text.toLocaleLowerCase('pt-BR');
 if(value.includes('evolução')||value.includes('desempenho'))return'trend';
 if(value.includes('acertos')||value.includes('domínio')||value.includes('conquistas'))return'check';
 if(value.includes('consistência')||value.includes('mensal'))return'calendar';
 if(value.includes('simulado')||value.includes('prova'))return'exams';
 if(value.includes('inimigos')||value.includes('dificuldade')||value.includes('erros'))return'warning';
 if(value.includes('redação')||value.includes('aula'))return'book';
 if(value.includes('confiança')||value.includes('resumo'))return'pie';
 if(value.includes('focar')||value.includes('guia'))return'guide';
 return'';
}
function insertIcon(element,name){
 if(!element||element.querySelector(':scope > .coolicon'))return;
 element.insertAdjacentHTML('afterbegin',svg(name));
}
function refreshThemeIcon(){
 const theme=document.querySelector('#themeBtn');
 if(!theme)return;
 const dark=document.documentElement.classList.contains('dark')||document.body.classList.contains('dark');
 const name=dark?'sun':'moon';
 if(theme.dataset.coolicon!==name){theme.innerHTML=svg(name);theme.dataset.coolicon=name}
 theme.title=dark?'Ativar modo claro':'Ativar modo escuro';
 theme.setAttribute('aria-label',theme.title);
}
function polishIcons(root=document){
 const navMap={dashboard:'dashboard',study:'study',questions:'questions',lessons:'lessons',exams:'exams',essays:'essays',guide:'guide',settings:'settings'};
 Object.entries(navMap).forEach(([pageName,icon])=>{const button=root.querySelector(`[data-page="${pageName}"]`);if(!button)return;[...button.childNodes].filter(node=>node.nodeType===3).forEach(node=>node.remove());insertIcon(button,icon)});
 root.querySelectorAll('[data-tree]').forEach(button=>{const map={'add-subject':'plus','add-topic':'plus','rename-area':'edit','rename-subject':'edit','rename-topic':'edit','delete-area':'trash','delete-subject':'trash','delete-topic':'close'},name=map[button.dataset.tree];if(name&&button.dataset.coolicon!==name){button.innerHTML=svg(name);button.dataset.coolicon=name}});
 root.querySelectorAll('.tree-toggle').forEach(button=>{if(button.dataset.coolicon!=='chevron'){button.innerHTML=svg('chevron');button.dataset.coolicon='chevron'}});
 const reset=root.querySelector('#resetTimer');if(reset&&reset.dataset.coolicon!=='reset'){reset.innerHTML=`${svg('reset')}<span>Reiniciar</span>`;reset.dataset.coolicon='reset'}
 const timerToggle=root.querySelector('#toggleTimer');if(timerToggle&&!timerToggle.querySelector('.coolicon')){[...timerToggle.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).forEach(node=>node.textContent=node.textContent.replace(/^\s*[▶Ⅱ]\s*/,''));insertIcon(timerToggle,timerToggle.textContent.includes('Pausar')?'pause':'play')}
 root.querySelectorAll('.primary').forEach(button=>{const label=button.textContent.trim(),name=label.includes('Salvar')?'check':label.includes('Registrar')||label.includes('Adicionar')?'plus':'';if(!name||button.querySelector('.coolicon'))return;[...button.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).forEach(node=>node.textContent=node.textContent.replace(/^\s*[＋+]\s*/,''));insertIcon(button,name)});
 const metricMap={'Questões resolvidas':'questions','Desempenho real':'trend','Meta anual':'chart','Dias de estudo':'calendar','Média geral':'pie'};
 root.querySelectorAll('.metric').forEach(metric=>{const label=metric.querySelector('.label')?.textContent.trim(),name=metricMap[label];if(!name)return;let holder=metric.querySelector('.metric-icon');if(!holder){holder=document.createElement('span');holder.className='metric-icon';metric.appendChild(holder)}if(holder.dataset.coolicon!==name){holder.innerHTML=svg(name);holder.dataset.coolicon=name}});
 root.querySelectorAll('.card-head h2,.card-head h3').forEach(heading=>{const name=iconForHeading(heading.textContent);if(name)insertIcon(heading,name)});
 const mobile=document.querySelector('#mobileMenu');if(mobile&&!mobile.querySelector('.coolicon')){mobile.textContent='';mobile.insertAdjacentHTML('afterbegin',svg('menu'));mobile.setAttribute('aria-label','Abrir menu')}
 refreshThemeIcon();
}
const iconObserver=new MutationObserver(changes=>{if(changes.some(change=>change.target?.matches?.('#toggleTimer,#resetTimer')||[...change.addedNodes].some(node=>node.nodeType===1)))polishIcons()});
iconObserver.observe(document.body,{childList:true,subtree:true});
const themeIconObserver=new MutationObserver(refreshThemeIcon);
themeIconObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
themeIconObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
polishIcons();
