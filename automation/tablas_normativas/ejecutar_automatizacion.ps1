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
    # Nunca se audita contra una versión vieja del inventario nacional.
    $git = Get-Command git -ErrorAction SilentlyContinue
    if (-not $git) {
        throw "No se encontró Git. Se cancela para evitar auditar con normativa desactualizada."
    }

    & $git.Source pull --ff-only
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo actualizar el repositorio TUI con git pull --ff-only. Se cancela para evitar auditar con normativa desactualizada."
    }

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
        "--tracking", (Join-Path $repo "data\seguimiento_normativo.js"),
        "--certificate-dir", (Join-Path $repo "config\tablas_normativas_vigencia"),
        "--evidence-dir", (Join-Path $repo "config\tablas_normativas_vigencia_evidencia"),
        "--policy", (Join-Path $repo "config\tablas_normativas_vigencia_policy.json"),
        "--sig", (Join-Path $repo "consolidados\vigencia\consolidado_sig_comunal.csv"),
        "--state", $state
    )
    & $pythonExe @arguments
    if ($LASTEXITCODE -ne 0) {
        throw "El motor V5 terminó con código $LASTEXITCODE."
    }

    # Si V5 generó o renovó certificados, se publican en Git para que la TUI y
    # GitHub Actions evalúen exactamente la misma evidencia que el equipo local.
    & $git.Source add -- "config/tablas_normativas_vigencia/*.json"
    & $git.Source diff --cached --quiet
    $certificadosCambian = ($LASTEXITCODE -ne 0)
    if ($certificadosCambian) {
        & $git.Source config user.name "TUI DEI Vigencia Bot"
        & $git.Source config user.email "actions@users.noreply.github.com"
        & $git.Source commit -m "data: refrescar certificados de vigencia normativa"
        if ($LASTEXITCODE -ne 0) {
            throw "No se pudieron registrar los certificados de vigencia."
        }
        & $git.Source pull --rebase origin main
        if ($LASTEXITCODE -ne 0) {
            throw "No se pudo rebasar la certificación contra main."
        }
        & $git.Source push origin main
        if ($LASTEXITCODE -ne 0) {
            throw "No se pudieron publicar los certificados de vigencia en GitHub."
        }
    }
} finally {
    Pop-Location
}
