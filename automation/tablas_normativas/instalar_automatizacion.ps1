param(
    [string]$SistemaOperativoDEI,
    [int]$CadaMinutos = 15
)

$ErrorActionPreference = "Stop"

function Fail([string]$message) {
    Write-Host "ERROR: $message" -ForegroundColor Red
    exit 1
}

if (-not $SistemaOperativoDEI) {
    Write-Host "Pega la ruta local sincronizada de la carpeta 'Sistema Operativo DEI'." -ForegroundColor Cyan
    $SistemaOperativoDEI = Read-Host "Ruta"
}

$SistemaOperativoDEI = $SistemaOperativoDEI.Trim('"').Trim()
if (-not (Test-Path -LiteralPath $SistemaOperativoDEI)) {
    Fail "No existe la ruta: $SistemaOperativoDEI"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = (Resolve-Path (Join-Path $scriptDir "..\..")).Path
$iptRoot = Join-Path $SistemaOperativoDEI "02_PRODUCCION_DEI\01_CARTOGRAFIA\00_IPT_Nacional"
$master = Join-Path $iptRoot "02_Tablas_normativas\01_TABLAS_CANONICAS\PRC_SQL2.xlsx"
$output = Join-Path $iptRoot "02_Tablas_normativas\NORMALIZADAS"
$launcher = Join-Path $scriptDir "ejecutar_automatizacion.ps1"

if (-not (Test-Path -LiteralPath $iptRoot)) {
    Fail "La ruta seleccionada no contiene 02_PRODUCCION_DEI\01_CARTOGRAFIA\00_IPT_Nacional."
}
if (-not (Test-Path -LiteralPath $master)) {
    Fail "No se encontró el maestro PRC_SQL2.xlsx en la ruta oficial."
}
if (-not (Test-Path -LiteralPath $output)) {
    New-Item -ItemType Directory -Path $output -Force | Out-Null
}
if (-not (Test-Path -LiteralPath $launcher)) {
    Fail "No se encontró el lanzador del motor: $launcher"
}

$python = Get-Command py -ErrorAction SilentlyContinue
if ($python) {
    $pythonExe = $python.Source
    $pipArgs = @("-3", "-m", "pip", "install", "-r", (Join-Path $repo "automation\requirements.txt"))
} else {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if (-not $python) { Fail "No se encontró Python 3. Instala Python y vuelve a ejecutar este archivo." }
    $pythonExe = $python.Source
    $pipArgs = @("-m", "pip", "install", "-r", (Join-Path $repo "automation\requirements.txt"))
}

Write-Host "Verificando dependencias de Python..." -ForegroundColor Cyan
& $pythonExe @pipArgs
if ($LASTEXITCODE -ne 0) { Fail "No se pudieron instalar/verificar las dependencias Python." }

$localState = Join-Path $env:LOCALAPPDATA "TUI_DEI"
New-Item -ItemType Directory -Path $localState -Force | Out-Null
$configPath = Join-Path $localState "config_tablas_normativas.json"
$statePath = Join-Path $localState "estado_tablas_normativas.json"

$config = [ordered]@{
    schema_version = 1
    sistema_operativo_dei = $SistemaOperativoDEI
    repo_path = $repo
    prc_root = $iptRoot
    master = $master
    output = $output
    state = $statePath
    interval_minutes = $CadaMinutos
}
$config | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $configPath -Encoding UTF8

# Prueba obligatoria antes de programar: si falla, no se crea una tarea rota.
Write-Host "Ejecutando prueba inicial..." -ForegroundColor Cyan
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $launcher -ConfigPath $configPath
if ($LASTEXITCODE -ne 0) { Fail "La prueba inicial falló. No se creó la tarea programada." }

$taskName = "TUI DEI - Tablas Normativas"
$taskCommand = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$launcher`" -ConfigPath `"$configPath`""

# schtasks no requiere una aplicación adicional y ejecuta bajo el usuario actual.
& schtasks.exe /Create /F /SC MINUTE /MO $CadaMinutos /TN $taskName /TR $taskCommand | Out-Null
if ($LASTEXITCODE -ne 0) { Fail "No se pudo crear la tarea programada '$taskName'." }

Write-Host "" 
Write-Host "Automatización instalada correctamente." -ForegroundColor Green
Write-Host "Canal: Sistema Operativo DEI"
Write-Host "Maestro: $master"
Write-Host "Salida final: $output"
Write-Host "Frecuencia: cada $CadaMinutos minutos"
Write-Host "Estado local: $statePath"
Write-Host "Tarea Windows: $taskName"
Write-Host "" 
Write-Host "Desde ahora no es necesario abrir Python ni ejecutar el motor manualmente." -ForegroundColor Green
