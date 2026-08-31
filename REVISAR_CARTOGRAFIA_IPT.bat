@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

title Inspector SIG IPT - herramienta local opcional

set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"
set "CARPETA_SIG=%~1"

echo ================================================================
echo INSPECTOR SIG IPT - HERRAMIENTA LOCAL OPCIONAL

echo NO FORMA PARTE DE LA OPERACION PRODUCTIVA TUI.
echo TUI PRODUCTIVO FUNCIONA SHAREPOINT ^> POWER AUTOMATE ^> GITHUB ACTIONS.
echo ================================================================
echo.

if "%CARPETA_SIG%"=="" (
    echo No se definio una carpeta SIG.
    echo.
    echo Esta utilidad NO usa rutas personales por defecto.
    echo Para ejecutarla manualmente, arrastra la carpeta 00_IPT_Nacional
    echo sobre este BAT o ejecuta:
    echo.
    echo   REVISAR_CARTOGRAFIA_IPT.bat "RUTA_A_00_IPT_Nacional"
    echo.
    pause
    exit /b 2
)

echo Repositorio:
echo %REPO%
echo.
echo Carpeta SIG proporcionada manualmente:
echo %CARPETA_SIG%
echo.
echo Este proceso SOLO LEE la cartografia. No modifica GPKG ni SHP.
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
    echo.
    pause
    exit /b 4
)

if not exist "%REPO%\scripts\consolidar_sig_comunal.py" (
    echo ERROR: falta scripts\consolidar_sig_comunal.py en el repositorio.
    echo.
    pause
    exit /b 5
)

if not exist "%CARPETA_SIG%" (
    echo ERROR: No encuentro la carpeta SIG indicada.
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
    echo LISTO. El diagnostico local termino correctamente.
    echo ================================================================
    echo.
    echo Resultados locales:
    echo %REPO%\_local\sig_ipt
    echo.
    if exist "%REPO%\_local\sig_ipt" start "" "%REPO%\_local\sig_ipt"
) else (
    echo ================================================================
    echo ERROR. El proceso local NO termino correctamente.
    echo Codigo devuelto por Python: %RESULTADO%
    echo ================================================================
)
echo.
pause
exit /b %RESULTADO%
