@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

title Inspector SIG IPT - Transsa Urban Intelligence

set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"

set "CARPETA_SIG=C:\Users\Javiera Morales\OneDrive - Transsa\DEI - Cartografía Transsa_GENERAL\00_IPT_Nacional"

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
echo Luego genera un consolidado por comuna para evaluar si el SIG
echo puede utilizarse en el visor o requiere revision normativa.
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

if not exist "%REPO%\scripts\consolidar_sig_comunal.py" (
    echo ERROR: falta scripts\consolidar_sig_comunal.py en el repositorio.
    echo Haz Fetch origin y Pull origin en GitHub Desktop y vuelve a intentar.
    echo.
    pause
    exit /b 5
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

set "PYTHON_CMD="
where py >nul 2>nul
if not errorlevel 1 set "PYTHON_CMD=py -3"
if not defined PYTHON_CMD (
    where python >nul 2>nul
    if not errorlevel 1 set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD (
    echo ERROR: No encuentro Python en este computador.
    set "RESULTADO=10"
    goto :FIN
)

%PYTHON_CMD% "%REPO%\scripts\inspector_sig_ipt_v2.py" --root "%CARPETA_SIG%" --repo "%REPO%"
set "RESULTADO=!errorlevel!"
if not "!RESULTADO!"=="0" goto :FIN

echo.
echo ================================================================
echo GENERANDO CONSOLIDADO SIG POR COMUNA
echo ================================================================
echo.
%PYTHON_CMD% "%REPO%\scripts\consolidar_sig_comunal.py" --repo "%REPO%"
set "RESULTADO=!errorlevel!"

:FIN
echo.
if "%RESULTADO%"=="0" (
    echo ================================================================
    echo LISTO. El inventario y consolidado SIG terminaron correctamente.
    echo ================================================================
    echo.
    echo Resultados:
    echo %REPO%\_local\sig_ipt
    echo.
    echo Archivos clave:
    echo - resumen_sig_ipt.json
    echo - consolidado_sig_comunal.csv
    echo - consolidado_sig_comunal.json
    echo.
    echo Abriendo carpeta de resultados...
    if exist "%REPO%\_local\sig_ipt" start "" "%REPO%\_local\sig_ipt"
) else (
    echo ================================================================
    echo ERROR. El proceso SIG NO termino correctamente.
    echo Codigo devuelto por Python: %RESULTADO%
    echo ================================================================
)
echo.
pause
exit /b %RESULTADO%
