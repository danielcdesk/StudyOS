# StudyOS para Android

Este projeto gera `../builds/Android/StudyOS-Android.apk`. O APK abre o StudyOS no endereço HTTPS oficial, sem depender de `localhost`, do Python ou de `iniciar.bat`. Instale o APK uma vez; atualizações da interface e correções publicadas no site chegam quando o app abre conectado. Depois da primeira abertura, o cache do StudyOS permite continuar usando a versão já baixada offline. Os dados continuam locais neste Android e não são sincronizados automaticamente com o Windows.

O invólucro Android não se atualiza por conta própria. Mudanças no invólucro nativo exigem uma nova instalação assinada com a mesma chave. As atualizações normais do StudyOS são da interface web e não exigem reinstalar o APK. O APK gerado pelo fluxo abaixo usa a chave de depuração do Android e é para instalação pessoal; não é uma versão de publicação na Play Store.

## Compilar

Instale JDK 17 ou superior e Android SDK Platform 36. O Gradle instala as ferramentas de build necessárias. No PowerShell, rode `cap add android` uma única vez; depois, para atualizar o APK:

```powershell
npm install
npm exec cap add android
npm run sync
npm run build:apk
```

O APK aparece em `../builds/Android/StudyOS-Android.apk` com o ícone oficial do StudyOS. Para uma distribuição própria com atualizações nativas futuras ou publicação na Play Store, configure e preserve uma chave de assinatura de produção.
