@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================================
echo TRANSSA URBAN INTELLIGENCE - CORRECCION V0.5.3.1
echo ============================================================
echo.
echo Esta correccion hace que las pruebas de GitHub Actions creen
echo una base SQLite temporal. No usa ni publica la base local.
echo.

where py >nul 2>nul
if %errorlevel%==0 (
    set "PYTHON_CMD=py"
) else (
    where python >nul 2>nul
    if %errorlevel%==0 (
        set "PYTHON_CMD=python"
    ) else (
        echo ERROR: No se encontro Python.
        pause
        exit /b 1
    )
)

echo Ejecutando 25 pruebas automaticas...
%PYTHON_CMD% -m unittest discover -s tests -v
if errorlevel 1 (
    echo.
    echo LA CORRECCION TERMINO CON ERRORES. NO HAGAS COMMIT.
    pause
    exit /b 1
)

echo.
echo Validando portal...
%PYTHON_CMD% automation\validar_sitio.py
if errorlevel 1 (
    echo.
    echo LA VALIDACION DEL PORTAL TERMINO CON ERRORES. NO HAGAS COMMIT.
    pause
    exit /b 1
)

echo.
echo CORRECCION V0.5.3.1 INSTALADA Y VALIDADA CORRECTAMENTE.
echo Ahora puedes hacer commit y push del cambio.
echo.
pause
exit /b 0
