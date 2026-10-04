# Dados locais

- `studyos.db`: banco SQLite usado pelo servidor local do Windows.
- `studyos.json`: arquivo legado preservado apenas como origem de migração.
- `studyos.example.json`: dados de exemplo sem informações pessoais.

O banco SQLite e seus arquivos auxiliares ficam ignorados pelo Git. Não apague `studyos.db` durante uma atualização: ele contém os dados locais do usuário.
