# 📚 StudyOS

> Plataforma acadêmica de organização, acompanhamento e análise de estudos.

O **StudyOS** é um projeto desenvolvido como **trabalho de faculdade**, com foco na construção de uma aplicação moderna para ajudar estudantes a organizar rotina, metas, questões, desempenho, hábitos e progresso de estudos em um só lugar.

## 🎯 Objetivo

Criar uma experiência centralizada e visual para acompanhamento de estudos, permitindo ao usuário enxergar sua evolução, identificar dificuldades e organizar melhor sua rotina acadêmica.

## ✨ Principais recursos

- 📊 Dashboard de desempenho e progresso
- ✅ Acompanhamento de questões, acertos e erros
- 🎯 Metas de estudo
- 📅 Organização da rotina
- 📈 Relatórios e estatísticas
- 🧠 Acompanhamento de tópicos dominados e pendentes
- 🔔 Área de notificações e preferências
- 🌙 Interface responsiva com suporte a temas
- 🗃️ Estrutura preparada para persistência de dados com Drizzle/D1

## 🛠️ Tecnologias

- **TypeScript**
- **React 19**
- **vinext / Vite**
- **Tailwind CSS**
- **Drizzle ORM**
- **Cloudflare D1** (estrutura opcional)
- **Node.js 22+**

## 📁 Estrutura do projeto

```text
StudyOS/
├── app/           # Interface, páginas, estilos e componentes
├── db/            # Configuração e schema do banco de dados
├── drizzle/       # Metadados/migrações do Drizzle
├── examples/      # Exemplos auxiliares
├── public/        # Ícones e arquivos estáticos
├── scripts/       # Scripts de auditoria e manutenção
├── tests/         # Testes automatizados
└── worker/        # Código relacionado ao runtime/worker
```

## 🚀 Como executar

### Pré-requisitos

- Node.js `>= 22.13.0`
- npm ou pnpm

### Instalação

```bash
git clone https://github.com/danielcdesk/StudyOS.git
cd StudyOS
npm install
npm run dev
```

Para gerar uma build de produção:

```bash
npm run build
```

Para executar os testes:

```bash
npm test
```

## 🔐 Segurança

O projeto inclui um script de auditoria de segurança e não deve armazenar chaves, senhas ou tokens diretamente no código-fonte.

```bash
npm run audit:security
```


## 🤖 Transparência sobre uso de Inteligência Artificial

Este projeto foi desenvolvido com **uso substancial de ferramentas de Inteligência Artificial durante o processo de criação**. A IA foi utilizada como apoio em atividades como estruturação do projeto, geração e revisão de código, organização de funcionalidades, documentação, ajustes de interface e resolução de problemas técnicos.

O trabalho também contou com **direcionamento, decisões, testes e revisão humana**, especialmente na definição da proposta do StudyOS, requisitos, funcionalidades desejadas e validação das versões produzidas.

> **Declaração de transparência:** este repositório não busca apresentar o código como tendo sido produzido exclusivamente de forma manual. O uso de IA faz parte do processo de desenvolvimento deste trabalho acadêmico.

## 🎓 Contexto acadêmico

Este repositório faz parte de um **trabalho de faculdade na área de Sistemas de Informação**, sendo utilizado para praticar desenvolvimento web, organização de projeto, versionamento com Git/GitHub, boas práticas de código e evolução de produto.

## 📌 Status

🚧 **Em desenvolvimento** — novas funcionalidades e melhorias podem ser adicionadas conforme a evolução do projeto acadêmico.

## 👨‍💻 Autor

Desenvolvido por **Daniel Cirilo de Souza** como parte de atividades e estudos acadêmicos.

---

⭐ Se este projeto ajudar como referência de estudo, considere marcar o repositório com uma estrela.
