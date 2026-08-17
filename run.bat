@echo off
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
  set "PY=python"
) else (
  where py >nul 2>nul
  if %errorlevel%==0 (
    set "PY=py -3"
  ) else (
    echo Python not found. Install from https://www.python.org/downloads/
    pause
    exit /b 1
  )
)

start "AnyAPI Chat" cmd /c "title AnyAPI Chat Server & %PY% -m http.server 8000"
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000/"
endlocal