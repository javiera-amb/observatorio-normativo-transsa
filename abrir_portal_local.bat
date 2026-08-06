@echo off
setlocal
cd /d "%~dp0"

start "TUI servidor local" /min python -m http.server 8000
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000/#mapa"

endlocal
exit /b 0
