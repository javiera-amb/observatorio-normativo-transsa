@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo.
echo ==========================================
echo  Transsa Urban Intelligence - Portal local
echo ==========================================
echo.

set "PYTHON_CMD="
where py >nul 2>nul && set "PYTHON_CMD=py"
if not defined PYTHON_CMD (
  where python >nul 2>nul && set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD (
  echo ERROR: No se encontro Python en el equipo.
  echo Abre una terminal en esta carpeta y ejecuta: py -m http.server 8000
  echo.
  pause
  exit /b 1
)

echo Iniciando servidor con: %PYTHON_CMD%
start "Servidor TUI - NO CERRAR" cmd /k "%PYTHON_CMD% -m http.server 8000"

echo Esperando que el servidor responda...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; for($i=0;$i -lt 30;$i++){ try { Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:8000/' -TimeoutSec 1 | Out-Null; $ok=$true; break } catch { Start-Sleep -Milliseconds 500 } }; if($ok){ exit 0 } else { exit 1 }"

if errorlevel 1 (
  echo.
  echo ERROR: El servidor no inicio correctamente.
  echo Revisa la ventana llamada "Servidor TUI - NO CERRAR" para ver el mensaje de Python.
  echo.
  pause
  exit /b 1
)

echo Servidor activo. Abriendo el portal...
start "" "http://127.0.0.1:8000/#mapa"

endlocal
exit /b 0
