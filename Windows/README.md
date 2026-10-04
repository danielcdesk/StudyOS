# StudyOS para Windows 11

O instalador e a versão portátil ficam em `../builds/Windows/` depois do build. Instale uma vez ou abra o arquivo portátil. O app abre o StudyOS sem Python, servidor local ou arquivo `.bat`.

O conteúdo da interface é carregado do site oficial e recebe as atualizações publicadas automaticamente quando o app abre com internet. O cache mantém a versão que já foi aberta disponível offline. Os dados ficam locais no perfil do Windows; não são sincronizados com o Android.

Para compilar no Windows, instale o Node.js LTS e execute:

```powershell
npm install
npm run dist
```

Os artefatos serão criados em `../builds/Windows/` com o ícone oficial do StudyOS. O instalador Windows não é assinado; o SmartScreen pode pedir confirmação na primeira execução.
