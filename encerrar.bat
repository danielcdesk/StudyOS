@echo off
setlocal EnableExtensions
title StudyOS - Encerrar servidor
cd /d "%~dp0"
if not defined STUDYOS_PORT set "STUDYOS_PORT=8080"

powershell -NoProfile -Command "try { $r=Invoke-RestMethod -Method Post ('http://127.0.0.1:'+$env:STUDYOS_PORT+'/api/shutdown') -TimeoutSec 3; if($r.ok){exit 0}else{exit 1} } catch { exit 1 }" >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Nao foi possivel encerrar o servidor automaticamente.
  echo  Ele pode ja estar fechado ou ser uma versao antiga.
  echo  Nesse caso, feche a janela antiga do StudyOS uma vez e abra iniciar.bat novamente.
  echo.
  pause
  exit /b 1
)

echo.
echo  StudyOS encerrado com seguranca.
exit /b 0
