@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

title Inspector SIG IPT - Transsa Urban Intelligence

REM Carpeta del repositorio: quitamos la barra final para evitar una comilla sobrante al llamar Python.
set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"

set "CARPETA_SIG=C:\Users\Javiera Morales\OneDrive - Transsa\DEI - Cartografía Transsa_GENERAL\PRC_Actualización Transsa_2026_S2"

REM También puedes arrastrar otra carpeta sobre este archivo .bat.
if not "%~1"=="" set "CARPETA_SIG=%~1"

echo ================================================================
echo INSPECTOR SIG IPT - TRANSSA URBAN INTELLIGENCE
echo ================================================================
echo.
echo Repositorio:
echo %REPO%
echo.
echo Carpeta SIG:
echo %CARPETA_SIG%
echo.
echo Este proceso SOLO LEE la cartografia. No modifica GPKG ni SHP.
echo.
echo Version 2: interpreta IPT_Region / tipo IPT / comuna / archivo,
echo separa planes seccionales y excluye predios/RGC de referencia.
echo.

if not exist "%REPO%\index.html" (
    echo ERROR: este archivo no esta dentro del repositorio esperado.
    echo Ruta detectada: %REPO%
    echo.
    pause
    exit /b 3
)

if not exist "%REPO%\scripts\inspector_sig_ipt_v2.py" (
    echo ERROR: falta scripts\inspector_sig_ipt_v2.py en el repositorio.
    echo Haz Fetch origin y Pull origin en GitHub Desktop y vuelve a intentar.
    echo.
    pause
    exit /b 4
)

if not exist "%CARPETA_SIG%" (
    echo ERROR: No encuentro la carpeta SIG indicada.
    echo.
    echo Puedes arrastrar la carpeta correcta sobre REVISAR_CARTOGRAFIA_IPT.bat
    echo o editar la variable CARPETA_SIG dentro de este archivo.
    echo.
    pause
    exit /b 2
)

set "RESULTADO=10"

where py >nul 2>nul
if not errorlevel 1 (
    py -3 "%REPO%\scripts\inspector_sig_ipt_v2.py" --root "%CARPETA_SIG%" --repo "%REPO%"
    set "RESULTADO=!errorlevel!"
    goto :FIN
)

where python >nul 2>nul
if not errorlevel 1 (
    python "%REPO%\scripts\inspector_sig_ipt_v2.py" --root "%CARPETA_SIG%" --repo "%REPO%"
    set "RESULTADO=!errorlevel!"
    goto :FIN
)

echo ERROR: No encuentro Python en este computador.
echo Instala Python o agrega Python al PATH y vuelve a ejecutar este archivo.
set "RESULTADO=10"

:FIN
echo.
if "%RESULTADO%"=="0" (
    echo ================================================================
    echo LISTO. El inventario SIG termino correctamente.
    echo ================================================================
    echo.
    echo Resultados:
    echo %REPO%\_local\sig_ipt
    echo.
    echo Abriendo carpeta de resultados...
    if exist "%REPO%\_local\sig_ipt" start "" "%REPO%\_local\sig_ipt"
) else (
    echo ================================================================
    echo ERROR. El inventario SIG NO termino correctamente.
    echo Codigo devuelto por Python: %RESULTADO%
    echo ================================================================
    echo.
    echo No se mostrara un mensaje de exito hasta que el proceso termine de verdad.
)
echo.
pause
exit /b %RESULTADO%
