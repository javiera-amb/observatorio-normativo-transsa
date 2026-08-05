@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo TRANSSA URBAN INTELLIGENCE - DIARIO OFICIAL LOCAL
echo ============================================================
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

rem En Windows, zoneinfo necesita la base IANA provista por tzdata.
%PYTHON_CMD% -c "from zoneinfo import ZoneInfo; ZoneInfo('America/Santiago')" >nul 2>nul
if %errorlevel% neq 0 (
  echo Instalando soporte de zona horaria para Chile...
  %PYTHON_CMD% -m pip install "tzdata>=2025.2,<2027"
  if %errorlevel% neq 0 goto :timezone_error
)

%PYTHON_CMD% automation\actualizar_desde_diario.py
set "RESULT=%errorlevel%"

echo.
if "%RESULT%"=="0" (
  echo ACTUALIZACION DEL DIARIO OFICIAL COMPLETADA CORRECTAMENTE.
) else if "%RESULT%"=="4" (
  echo EL PROCESO TERMINO CON ERRORES PARCIALES. REVISA EL MANIFIESTO.
) else (
  echo LA ACTUALIZACION TERMINO CON ERROR. NO PUBLIQUES CAMBIOS AUN.
)
echo.
pause
exit /b %RESULT%

:timezone_error
echo.
echo ERROR: No se pudo instalar el soporte de zona horaria America/Santiago.
echo Ejecuta instalar_correccion_v0_5_1.bat y comparte la salida si persiste.
echo.
pause
exit /b 1
