$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$JavaLine = (java -version 2>&1 | Select-Object -First 1).ToString()
if ($JavaLine -notmatch 'version "(1\.(?<legacy>\d+)|(?<major>\d+))') { throw 'Não foi possível identificar o Java. Instale JDK 17 ou superior.' }
$Major = if ($Matches.major) { [int]$Matches.major } else { [int]$Matches.legacy }
if ($Major -lt 17) { throw "JDK 17+ obrigatório para o build Android. Detectado: $JavaLine" }
Set-Location "$ProjectRoot\Android"
npm install
npm run build:apk
Write-Host "APK pronto em $ProjectRoot\builds\Android\StudyOS-Android.apk" -ForegroundColor Green
