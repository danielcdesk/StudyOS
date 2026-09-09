# StudyOS

Painel local de estudos com questões, provas, redações, aulas, Pomodoro e guia adaptativo.

## Executar

No Windows, dê dois cliques em `iniciar.bat` ou execute:

```powershell
python server.py
```

Abra http://localhost:8080. Os dados ficam somente no computador, em `data/studyos.json`.

## Publicar no GitHub

Este pacote já está pronto para virar um repositório. O arquivo `data/studyos.json` fica fora do Git para não publicar dados pessoais ou foto de perfil. Na primeira abertura, o StudyOS cria automaticamente uma base inicial local; `data/studyos.example.json` serve apenas como referência de estrutura.

## Importação de matérias por JSON

Em **Configurações → Estrutura de matérias**, o StudyOS aceita o arquivo gerado por um analisador de edital. O formato recomendado para integração é:

```json
{
  "versao": "1.0",
  "categorias": [
    {
      "nome": "Conhecimentos Básicos",
      "materias": [
        {
          "nome": "Língua Portuguesa",
          "assuntos": ["Interpretação de textos", "Gramática"]
        }
      ]
    }
  ]
}
```

Também são aceitos os nomes em inglês (`categories`, `subjects`, `topics`), uma lista plana de `materias` com o campo `categoria` e o formato nativo do StudyOS (`knowledgeAreas` e `subjects`). Nomes repetidos são unidos sem diferenciar maiúsculas, acentos ou espaços extras. Antes de importar, o usuário escolhe a prova de destino. Se ela já tiver matérias próprias, o StudyOS pede confirmação e substitui somente a estrutura vinculada àquela prova; matérias de outras provas, conteúdos comuns e históricos de questões, provas, aulas e redações são preservados. Antes da troca, o StudyOS mantém uma cópia local da estrutura anterior e de seus vínculos.

O contrato formal para validação no site que analisa o edital está em `public/studyos-taxonomy.schema.json`. Campos extras são permitidos, portanto o analisador pode manter metadados próprios sem impedir a importação.

Na mesma tela, as setas de cada matéria alteram sua posição dentro da categoria. A ação **Mover** transfere a matéria e todos os seus assuntos para outra categoria, preservando os registros históricos vinculados.

O botão **Provas** de cada matéria e o ícone de prova de cada assunto permitem vinculá-los a um ou mais tipos de prova cadastrados pelo usuário. Sem vínculos, o conteúdo fica disponível para todas as provas. No cadastro de provas e simulados, a lista de matérias respeita automaticamente o tipo selecionado.

A estrutura também possui uma navegação por prova. **Todas as provas** exibe a árvore completa; cada prova cadastrada abre sua própria visão com apenas as matérias gerais ou vinculadas a ela, ainda separadas pelas categorias principais. A última visão escolhida é lembrada neste computador.

Para encerrar com segurança, dê dois cliques em `encerrar.bat` ou pressione `Ctrl+C` no terminal do servidor.
