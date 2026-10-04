# StudyOS

Aplicativo de estudos com questões, provas, redações, aulas, Pomodoro e guia adaptativo.

## Aplicativos prontos

- **Windows 11:** instalador e versão portátil em `builds/Windows/`.
- **Android:** APK de teste em `builds/Android/StudyOS-Android.apk`.

Os aplicativos instalados abrem o StudyOS pelo endereço HTTPS oficial. Não precisam de Python, `localhost` nem dos arquivos `.bat`. Conecte-se à internet na primeira abertura; o cache permite reutilizar a última versão carregada quando estiver offline.

## Atualizações e dados

Atualizações da interface e correções publicadas no site chegam ao abrir o aplicativo conectado, sem reinstalar o APK ou o programa do Windows. Mudanças no invólucro nativo (por exemplo, permissões ou integração com o sistema) ainda precisam de um novo pacote.

Os dados ficam locais em cada dispositivo e não são sincronizados entre Windows e Android. Para transferi-los, use **Configurações → Dados e backup → Exportar JSON** e importe o arquivo no outro dispositivo.

O banco antigo do servidor local (`data/studyos.json`) foi preservado, mas os novos apps não o leem diretamente. Para levar esses registros, abra a versão local, exporte um JSON em **Configurações → Dados e backup** e importe-o no novo app.

## Desenvolvimento local

O servidor Python e os scripts em `Windows/legacy/` foram mantidos somente para desenvolvimento/testes locais; não são usados pelos aplicativos instalados. Para iniciar o servidor manualmente:

```powershell
python server.py
```

Abra `http://localhost:8080`. No modo local, os dados ficam em `data/studyos.json` e uma cópia é mantida no navegador.

Para gerar os pacotes, consulte os READMEs em `Windows/` e `Android/`. As saídas ficam sempre centralizadas em `builds/`, separadas por plataforma.

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

Para encerrar o servidor de desenvolvimento local, pressione `Ctrl+C` no terminal onde ele foi iniciado.
