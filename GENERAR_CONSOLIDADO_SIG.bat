@echo off
setlocal EnableExtensions
chcp 65001 >nul

title Consolidado SIG comunal - Transsa Urban Intelligence

set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"

echo ================================================================
echo CONSOLIDADO SIG COMUNAL - TRANSSA URBAN INTELLIGENCE
echo ================================================================
echo.
echo Este proceso reutiliza el inventario SIG existente.
echo NO vuelve a recorrer los GPKG/SHP originales.
echo.

if not exist "%REPO%\_local\sig_ipt\capas_sig_ipt.json" (
    echo ERROR: no existe _local\sig_ipt\capas_sig_ipt.json
    echo Primero ejecuta REVISAR_CARTOGRAFIA_IPT.bat
    echo.
    pause
    exit /b 2
)

if not exist "%REPO%\_local\sig_ipt\vinculacion_sig_ipt.json" (
    echo ERROR: no existe _local\sig_ipt\vinculacion_sig_ipt.json
    echo Primero ejecuta REVISAR_CARTOGRAFIA_IPT.bat
    echo.
    pause
    exit /b 3
)

set "PYTHON_CMD="
where py >nul 2>nul
if not errorlevel 1 set "PYTHON_CMD=py -3"
if not defined PYTHON_CMD (
    where python >nul 2>nul
    if not errorlevel 1 set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD (
    echo ERROR: No encuentro Python en este computador.
    echo.
    pause
    exit /b 10
)

rem La version v2 reconstruye los 1.784 actos con la misma logica
rem que utiliza la pagina web y luego llama al consolidado existente.
%PYTHON_CMD% "%REPO%\scripts\consolidar_sig_comunal_v2.py" --repo "%REPO%"
set "RESULTADO=%errorlevel%"

echo.
if "%RESULTADO%"=="0" (
    echo ================================================================
    echo LISTO. El consolidado SIG comunal termino correctamente.
    echo ================================================================
    echo.
    echo Archivos generados:
    echo - _local\sig_ipt\consolidado_sig_comunal.csv
    echo - _local\sig_ipt\consolidado_sig_comunal.json
    echo - _local\sig_ipt\consolidado_sig_comunal.js
    echo.
    start "" "%REPO%\_local\sig_ipt"
) else (
    echo ================================================================
    echo ERROR. No se pudo generar el consolidado SIG comunal.
    echo Codigo devuelto por Python: %RESULTADO%
    echo ================================================================
)

echo.
pause
exit /b %RESULTADO%
