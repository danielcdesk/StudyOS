// Exam-platform presentation for the StudyOS question bank.
const questionUxRender=questions;
questions=function(){
  const content=questionUxRender();
  return `<div class="question-topnav"><span class="active">Questões</span><span>Meu desempenho</span><span>Caderno de erros</span><span>Disciplinas</span></div>${content.replace('<div class="question-hero">','<div class="question-hero question-hero-exam">').replace('<div class="tabs question-tabs">','<div class="question-workspace-title"><div><h3>Registrar desempenho</h3><p>Como você deseja cadastrar suas questões?</p></div><span>PAINEL DE TREINO</span></div><div class="tabs question-tabs">')}`;
};
