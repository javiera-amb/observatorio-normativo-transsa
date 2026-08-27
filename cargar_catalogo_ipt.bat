@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if "%~1"=="" (
  echo.
  echo Arrastra el archivo Revision_Correcta_854_IPT_Origenes.xlsx
  echo sobre este BAT para cargar el catalogo nacional de IPT.
  echo.
  pause
  exit /b 1
)

set "PYTHON_CMD="
where py >nul 2>nul && set "PYTHON_CMD=py"
if not defined PYTHON_CMD (
  where python >nul 2>nul && set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD (
  echo ERROR: No se encontro Python.
  pause
  exit /b 1
)

%PYTHON_CMD% scripts\cargar_catalogo_ipt_desde_excel.py "%~1"
if errorlevel 1 (
  echo.
  echo La carga termino con errores.
  pause
  exit /b 1
)

echo.
echo Catalogo IPT cargado correctamente.
echo Abre el portal local y revisa IPT y vigencia.
echo.
pause
endlocal
