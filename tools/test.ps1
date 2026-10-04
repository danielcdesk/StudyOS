$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

node --check public/app.js
python -m py_compile server.py
node tests/audit.mjs
Push-Location Android
try { npm run sync } finally { Pop-Location }
Write-Host 'StudyOS: verificações concluídas.' -ForegroundColor Green
