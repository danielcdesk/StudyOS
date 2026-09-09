const savedTheme=localStorage.getItem('studyos-theme');
if(savedTheme==='dark')document.body.classList.add('dark');
if(savedTheme==='light')document.body.classList.remove('dark');
const themeToggle=$('#themeBtn');
themeToggle.onclick=()=>{
 const change=()=>{document.body.classList.toggle('dark');localStorage.setItem('studyos-theme',document.body.classList.contains('dark')?'dark':'light')};
 themeToggle.classList.add('switching');
 document.body.classList.add('theme-changing');
 change();
 setTimeout(()=>{document.body.classList.remove('theme-changing');themeToggle.classList.remove('switching')},420)
};
