@echo off
chcp 65001 >nul
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
cd /d "%~dp0"
echo ============================================================
echo TRANSSA URBAN INTELLIGENCE - PRUEBA MANUAL COMPLETA
echo ============================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0actualizar_y_publicar_tui.ps1"
set "CODIGO=%ERRORLEVEL%"
echo.
if not "%CODIGO%"=="0" (
    echo LA PRUEBA TERMINO CON ERROR. REVISA _local\logs.
) else (
    echo PRUEBA COMPLETADA CORRECTAMENTE.
)
pause
exit /b %CODIGO%
