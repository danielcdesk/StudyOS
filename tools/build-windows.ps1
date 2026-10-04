$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location "$ProjectRoot\Windows"
npm install
npm run dist
Write-Host "Build Windows pronto em $ProjectRoot\builds\Windows" -ForegroundColor Green
