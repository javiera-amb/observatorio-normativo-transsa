@echo off
setlocal EnableExtensions
chcp 65001 >nul

title Consolidado SIG AUDITADO v3 - Transsa Urban Intelligence

set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"
set "OUT=%REPO%\_local\sig_ipt"

echo ================================================================
echo CONSOLIDADO SIG COMUNAL AUDITADO - VERSION 3
echo ================================================================
echo.
echo Este proceso NO vuelve a recorrer los GPKG/SHP.
echo Reutiliza el inventario ya generado.
echo.
echo Reglas v3:
echo - En Desarrollo NO afecta la aptitud vigente.
echo - La fecha del archivo NO prueba incorporacion normativa.
echo - SIG comunal sin match exacto = REVISAR, no NO.
echo - SI = candidato apto, con QA final pendiente.
echo.

if not exist "%OUT%\capas_sig_ipt.json" (
    echo ERROR: falta _local\sig_ipt\capas_sig_ipt.json
    echo Primero debe existir el inventario SIG.
    echo.
    pause
    exit /b 2
)

if not exist "%OUT%\vinculacion_sig_ipt.json" (
    echo ERROR: falta _local\sig_ipt\vinculacion_sig_ipt.json
    echo Primero debe existir la vinculacion SIG.
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

rem Eliminamos SOLO los tres consolidados anteriores para impedir confundir resultados viejos.
del /q "%OUT%\consolidado_sig_comunal.csv" 2>nul
del /q "%OUT%\consolidado_sig_comunal.json" 2>nul
del /q "%OUT%\consolidado_sig_comunal.js" 2>nul
del /q "%OUT%\consolidado_sig_comunal_AUDITADO.csv" 2>nul

echo Ejecutando metodologia auditada v3...
echo.
%PYTHON_CMD% "%REPO%\scripts\consolidar_sig_comunal_v3.py" --repo "%REPO%"
set "RESULTADO=%errorlevel%"

echo.
if "%RESULTADO%"=="0" (
    if not exist "%OUT%\consolidado_sig_comunal.csv" (
        echo ERROR: Python termino sin error pero no genero el CSV esperado.
        pause
        exit /b 20
    )

    copy /y "%OUT%\consolidado_sig_comunal.csv" "%OUT%\consolidado_sig_comunal_AUDITADO.csv" >nul

    echo ================================================================
    echo LISTO. CONSOLIDADO AUDITADO V3 GENERADO CORRECTAMENTE.
    echo ================================================================
    echo.
    echo SUBE ESTE ARCHIVO AL CHAT:
    echo.
    echo   consolidado_sig_comunal_AUDITADO.csv
    echo.
    start "" "%OUT%"
) else (
    echo ================================================================
    echo ERROR. No se pudo generar el consolidado auditado v3.
    echo Codigo devuelto por Python: %RESULTADO%
    echo ================================================================
)

echo.
pause
exit /b %RESULTADO%
