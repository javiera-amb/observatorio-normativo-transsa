@echo off
cd /d "%~dp0"
echo ============================================================
echo TRANSSA URBAN INTELLIGENCE - INSTALAR TAREA DIARIA
echo ============================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar_tarea_diaria_tui.ps1"
if errorlevel 1 (
    echo.
    echo ERROR: no se pudo instalar la tarea.
    pause
    exit /b 1
)
echo.
pause
