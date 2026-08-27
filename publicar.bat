@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo  PUBLICAR OBSERVATORIO NORMATIVO URBANO
echo ==========================================
echo.

where npx >nul 2>&1
if errorlevel 1 (
  echo No se encontro npx.
  echo Instala Node.js desde el sitio oficial y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

echo Iniciando publicacion...
npx wrangler pages deploy . --project-name observatorio-normativo

echo.
echo Proceso terminado.
pause
