# 📚 StudyOS

> Um workspace de estudos **offline**, privado e organizado para transformar registros em decisões de estudo.

O StudyOS reúne planejamento, questões, aulas, provas, redações, Pomodoro e um guia adaptativo determinístico. Ele foi pensado para quem quer acompanhar a própria evolução sem conta, anúncios, telemetria, IA ou sincronização externa.

## ✨ Recursos

- 📊 Painel com metas, consistência e métricas de progresso.
- ⏱️ Pomodoro persistente, com registro automático ao concluir uma sessão de foco.
- ✅ Banco de questões com acertos, chutes, dúvidas, pulos e dificuldade.
- 🎬 Aulas planejadas/concluídas e histórico de duração.
- 📝 Provas, simulados e redações com cálculos explicáveis.
- 🧭 Guia adaptativo determinístico: prioridades baseadas apenas nos registros locais.
- 🗂️ Categoria → matéria → assunto, vínculos por prova, reordenação e importação de estrutura.
- 💾 Backup JSON, importação validada, prévia com contagens e opção de desfazer.
- 🔎 Busca global navegável por teclado para páginas, matérias, assuntos, aulas e provas.
- 🌙 Tema escuro como experiência principal, além de paletas e interface responsiva.

## 🔒 Privacidade por padrão

O aplicativo Windows armazena a fonte de verdade em SQLite, exclusivamente no computador:

```text
%APPDATA%\br.com.studyos.app\studyos.db
```

Backups versionados são criados na subpasta `backups`. Nenhum dado de estudo é enviado para a internet durante o uso normal. O banco, fotos e backups pessoais são ignorados pelo Git e nunca devem ser enviados ao repositório.

## 🖥️ Instalação no Windows

1. Baixe o instalador `.exe` da versão desejada em **Releases**.
2. Execute o instalador e abra o **StudyOS** pelo Menu Iniciar.
3. Na primeira utilização, vá em **Configurações → Dados e backup** e selecione o JSON do StudyOS anterior, se existir.
4. Confira a prévia; a conversão só é executada depois da confirmação.

O aplicativo inicia em uma janela própria — sem servidor Python local e sem navegador externo. O instalador usa o WebView2 do Windows; em máquinas sem ele, o próprio instalador solicita o componente necessário.

## 🔄 Migração e backup

- A migração preserva o JSON original e valida configurações, listas de registros e tamanho máximo de 10 MB antes de gravar no SQLite.
- A prévia mostra categorias, matérias, assuntos, sessões, questões, aulas, provas e redações.
- Exporte um backup JSON regularmente em **Configurações → Dados e backup**.
- Use **Desfazer última importação** para retornar ao estado anterior no mesmo computador.

## 🛠️ Desenvolvimento

Pré-requisitos: Node.js, pnpm e Rust/Cargo com as ferramentas de compilação C++ do Windows.

```powershell
pnpm install
pnpm run verify
pnpm run desktop:dev
```

Para gerar o instalador:

```powershell
pnpm run desktop:build
```

O artefato NSIS é gerado em `src-tauri/target/release/bundle/nsis/`.

## ✅ Qualidade

`pnpm run verify` executa auditoria de renderização das telas e estados principais, validações de segurança/armazenamento local e o contrato do aplicativo desktop (SQLite, esquema versionado, migração e busca).

## ⚠️ Limitações conhecidas

- A conversão para tabelas normalizadas por entidade ainda é uma próxima etapa: neste lançamento o SQLite armazena um documento JSON validado em uma transação, para preservar integralmente os IDs e vínculos do legado.
- Android não faz parte deste escopo. As regras de dados e o formato de backup foram mantidos independentes da janela do Windows para facilitar uma futura adaptação.
- Antes de distribuir uma nova versão, valide o instalador gerado em um Windows sem conexão e confirme que nenhum banco ou backup real entrou no pacote.

## 🤝 Transparência

Projeto acadêmico desenvolvido com apoio de inteligência artificial e revisão humana. Nenhum dado pessoal de integrantes, credencial ou banco real de usuário faz parte deste repositório.
