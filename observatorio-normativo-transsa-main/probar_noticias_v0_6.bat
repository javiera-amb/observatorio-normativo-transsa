@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

set "SALIDA=data\inbox\noticias\dry_run_noticias_v0_6.json"

where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set "PYTHON=py"
) else (
    set "PYTHON=python"
)

echo ============================================================
echo TRANSSA URBAN INTELLIGENCE - PRUEBA NOTICIAS v0.6
echo ============================================================
echo.

echo [1/3] Validando registro de fuentes...
%PYTHON% scripts\validate_news_sources.py
if errorlevel 1 goto :error

echo.
echo [2/3] Ejecutando pruebas automáticas...
%PYTHON% -m unittest discover -s tests -v
if errorlevel 1 goto :error

echo.
echo [3/3] Probando feeds habilitados sin modificar la base...
if not exist "data\inbox\noticias" mkdir "data\inbox\noticias"
%PYTHON% scripts\run_news_dry_run.py --output "%SALIDA%"
if errorlevel 1 goto :error

echo.
echo ============================================================
echo PRUEBA COMPLETADA CORRECTAMENTE
echo Resultado: %SALIDA%
echo ============================================================
pause
exit /b 0

:error
echo.
echo ============================================================
echo LA PRUEBA TERMINO CON ERRORES
ECHO Copia o toma una captura del mensaje y enviala para revision.
echo ============================================================
pause
exit /b 1
