@echo off
setlocal EnableExtensions
title StudyOS - Servidor local
cd /d "%~dp0"
if not defined STUDYOS_PORT set "STUDYOS_PORT=8080"

set "STUDYOS_PYTHON="
set "STUDYOS_PY_ARGS="
set "BUNDLED_PYTHON=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if exist "%BUNDLED_PYTHON%" (
  "%BUNDLED_PYTHON%" -c "import sys" >nul 2>nul
  if not errorlevel 1 set "STUDYOS_PYTHON=%BUNDLED_PYTHON%"
)

if not defined STUDYOS_PYTHON (
  py -3 -c "import sys" >nul 2>nul
  if not errorlevel 1 (
    set "STUDYOS_PYTHON=py"
    set "STUDYOS_PY_ARGS=-3"
  )
)

if not defined STUDYOS_PYTHON (
  python -c "import sys" >nul 2>nul
  if not errorlevel 1 set "STUDYOS_PYTHON=python"
)

if not defined STUDYOS_PYTHON (
  echo.
  echo  [ERRO] O Python nao foi encontrado neste computador.
  echo.
  echo  Instale o Python 3 em https://www.python.org/downloads/
  echo  Durante a instalacao, marque "Add Python to PATH".
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing ('http://127.0.0.1:'+$env:STUDYOS_PORT+'/health') -TimeoutSec 1; if($r.StatusCode -eq 200){exit 0}else{exit 1} } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 (
  echo.
  echo  StudyOS ja esta rodando em http://localhost:%STUDYOS_PORT%
  start "" "http://localhost:%STUDYOS_PORT%"
  exit /b 0
)

echo.
echo  ========================================
echo            StudyOS - Servidor local
echo  ========================================
echo.
echo  Iniciando em http://localhost:%STUDYOS_PORT%
echo  Para encerrar, pressione Ctrl+C ou use encerrar.bat.
echo.

set "STUDYOS_OPEN_BROWSER=1"
"%STUDYOS_PYTHON%" %STUDYOS_PY_ARGS% server.py

set "STUDYOS_EXIT=%ERRORLEVEL%"
if not "%STUDYOS_EXIT%"=="0" (
  echo.
  echo  [ERRO] O servidor foi encerrado com o codigo %STUDYOS_EXIT%.
  echo  Verifique a mensagem acima para identificar o problema.
  echo.
  pause
)
exit /b %STUDYOS_EXIT%
