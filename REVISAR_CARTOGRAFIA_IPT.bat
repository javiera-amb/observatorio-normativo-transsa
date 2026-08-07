@echo off
setlocal EnableExtensions
chcp 65001 >nul

title Inspector SIG IPT - Transsa Urban Intelligence

set "REPO=%~dp0"
set "CARPETA_SIG=C:\Users\Javiera Morales\OneDrive - Transsa\DEI - Cartografía Transsa_GENERAL\PRC_Actualización Transsa_2026_S2"

REM También puedes arrastrar otra carpeta sobre este archivo .bat.
if not "%~1"=="" set "CARPETA_SIG=%~1"

echo ================================================================
echo INSPECTOR SIG IPT - TRANSSA URBAN INTELLIGENCE
echo ================================================================
echo.
echo Carpeta SIG:
echo %CARPETA_SIG%
echo.
echo Este proceso SOLO LEE la cartografia. No modifica GPKG ni SHP.
echo.

if not exist "%CARPETA_SIG%" (
    echo ERROR: No encuentro la carpeta SIG indicada.
    echo.
    echo Puedes arrastrar la carpeta correcta sobre REVISAR_CARTOGRAFIA_IPT.bat
    echo o editar la variable CARPETA_SIG dentro de este archivo.
    echo.
    pause
    exit /b 2
)

where py >nul 2>nul
if %errorlevel%==0 (
    py -3 "%REPO%scripts\inspector_sig_ipt.py" --root "%CARPETA_SIG%" --repo "%REPO%"
    set "RESULTADO=%errorlevel%"
    goto :FIN
)

where python >nul 2>nul
if %errorlevel%==0 (
    python "%REPO%scripts\inspector_sig_ipt.py" --root "%CARPETA_SIG%" --repo "%REPO%"
    set "RESULTADO=%errorlevel%"
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
    echo Abriendo carpeta de resultados...
    if exist "%REPO%_local\sig_ipt" start "" "%REPO%_local\sig_ipt"
) else (
    echo ================================================================
    echo El proceso termino con un error. Codigo: %RESULTADO%
    echo ================================================================
)
echo.
pause
exit /b %RESULTADO%
