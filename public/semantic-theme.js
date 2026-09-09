var semanticDashboardBase=dashboard;
dashboard=function(){const s=getStats();return semanticDashboardBase()
 .replace(`background:conic-gradient(var(--purple) 0 ${s.apparent}%,#f0b3a5 ${s.apparent}%)`,`background:conic-gradient(var(--success) 0 ${s.apparent}%,var(--danger) ${s.apparent}%)`)
 .replace('<i style="background:var(--purple)"></i>Acertos','<i style="background:var(--success)"></i>Acertos')
 .replace('<i style="background:#f0b3a5"></i>Erros','<i style="background:var(--danger)"></i>Erros')};
