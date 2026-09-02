param(
    [string]$ConfigPath = "$env:LOCALAPPDATA\TUI_DEI\config_tablas_normativas.json"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ConfigPath)) {
    throw "No existe la configuración de Tablas Normativas: $ConfigPath"
}

$config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$repo = [string]$config.repo_path
$prcRoot = [string]$config.prc_root
$master = [string]$config.master
$output = [string]$config.output
$state = [string]$config.state

foreach ($path in @($repo, $prcRoot, $master, $output)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Ruta requerida no disponible o aún no sincronizada: $path"
    }
}

$python = Get-Command py -ErrorAction SilentlyContinue
if ($python) {
    $pythonExe = $python.Source
    $pythonPrefix = @("-3")
} else {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if (-not $python) { throw "No se encontró Python 3 en el equipo." }
    $pythonExe = $python.Source
    $pythonPrefix = @()
}

Push-Location $repo
try {
    $arguments = @()
    $arguments += $pythonPrefix
    $arguments += @(
        "-m", "automation.tablas_normativas.runner_v5",
        "--prc-root", $prcRoot,
        "--master", $master,
        "--output", $output,
        "--exact-rules", (Join-Path $repo "config\tablas_normativas_reglas.json"),
        "--conditional-rules", (Join-Path $repo "config\tablas_normativas_condicionales.json"),
        "--source-rules", (Join-Path $repo "config\tablas_normativas_fuente.json"),
        "--source-dir", (Join-Path $repo "config\tablas_normativas_fuentes"),
        "--migration-dir", (Join-Path $repo "config\tablas_normativas_migraciones"),
        "--review-resolutions", (Join-Path $repo "config\tablas_normativas_revisiones_resueltas.json"),
        "--aliases", (Join-Path $repo "config\tablas_normativas_codigo_aliases.json"),
        "--coverage", (Join-Path $repo "config\tablas_normativas_cobertura.json"),
        "--structure", (Join-Path $repo "config\tablas_normativas_estructura.json"),
        "--state", $state
    )
    & $pythonExe @arguments
    if ($LASTEXITCODE -ne 0) {
        throw "El motor terminó con código $LASTEXITCODE."
    }
} finally {
    Pop-Location
}
