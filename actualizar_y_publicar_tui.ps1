param(
    [string]$RepoPath = (Split-Path -Parent $MyInvocation.MyCommand.Path)
)

$ErrorActionPreference = "Stop"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"
Set-Location -LiteralPath $RepoPath

$logDir = Join-Path $RepoPath "_local\logs"
$lockDir = Join-Path $RepoPath "_local"
$lockFile = Join-Path $lockDir "actualizacion_diaria.lock"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
New-Item -ItemType Directory -Force -Path $lockDir | Out-Null

$fecha = Get-Date -Format "yyyy-MM-dd"
$hora = Get-Date -Format "HH-mm-ss"
$logFile = Join-Path $logDir "actualizacion_${fecha}_${hora}.log"

function Escribir-Paso {
    param([string]$Mensaje)
    $marca = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$marca] $Mensaje"
}

function Ejecutar-Python {
    param([string[]]$Argumentos)

    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) {
        & py -3 @Argumentos | Out-Host
        return [int]$LASTEXITCODE
    }

    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) {
        & python @Argumentos | Out-Host
        return [int]$LASTEXITCODE
    }

    throw "No se encontró Python en PATH."
}

function Ruta-Permitida {
    param([string]$Ruta)

    $normalizada = $Ruta.Replace("\", "/")

    return (
        $normalizada -eq "data/reportes.js" -or
        $normalizada -eq "data/eventos.js" -or
        $normalizada.StartsWith("data/events/") -or
        $normalizada.StartsWith("documentos/reportes/")
    )
}

Start-Transcript -Path $logFile -Append | Out-Null

try {
    Escribir-Paso "Inicio de actualización diaria de Transsa Urban Intelligence."

    if (Test-Path $lockFile) {
        $edad = (Get-Date) - (Get-Item $lockFile).LastWriteTime
        if ($edad.TotalHours -lt 6) {
            Escribir-Paso "Ya existe una ejecución activa o reciente. Se omite esta ejecución."
            exit 0
        }
        Remove-Item $lockFile -Force
    }

    Set-Content -Path $lockFile -Value ("Inicio: " + (Get-Date).ToString("s")) -Encoding UTF8

    if (-not (Test-Path (Join-Path $RepoPath ".git"))) {
        throw "La carpeta no es un repositorio Git: $RepoPath"
    }

    $rama = (git rev-parse --abbrev-ref HEAD).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($rama)) {
        throw "No fue posible determinar la rama Git actual."
    }
    if ($rama -eq "HEAD") {
        throw "El repositorio está en detached HEAD. Cambia a tu rama de trabajo antes de ejecutar."
    }
    if ($rama -eq "main" -or $rama -eq "master") {
        throw "Por gobernanza TUI, la actualización local no publica directamente en '$rama'. Cambia a tu rama de trabajo y vuelve a ejecutar."
    }

    Escribir-Paso "Rama de trabajo detectada: $rama"
    Escribir-Paso "Comprobando cambios locales no relacionados con la actualización..."
    $estado = @(git status --porcelain)
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo consultar el estado de Git."
    }

    $cambiosNoPermitidos = @()
    foreach ($linea in $estado) {
        if ([string]::IsNullOrWhiteSpace($linea)) { continue }

        $ruta = ""
        if ($linea.Length -ge 4) {
            $ruta = $linea.Substring(3).Trim()
        }

        if ($ruta.Contains(" -> ")) {
            $ruta = ($ruta -split " -> ")[-1].Trim()
        }

        if (-not (Ruta-Permitida $ruta)) {
            $cambiosNoPermitidos += $ruta
        }
    }

    if ($cambiosNoPermitidos.Count -gt 0) {
        $detalle = ($cambiosNoPermitidos | Sort-Object -Unique) -join ", "
        throw "Hay cambios locales de código o configuración pendientes. No se ejecutará el proceso automático para evitar incluirlos en un commit: $detalle"
    }

    Escribir-Paso "Actualizando la rama '$rama' desde GitHub..."
    git pull --ff-only origin $rama
    if ($LASTEXITCODE -ne 0) {
        throw "git pull falló para '$rama'. Revisa conexión, credenciales o cambios remotos."
    }

    Escribir-Paso "Comprobando Ollama local..."
    try {
        $ollama = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 15
    }
    catch {
        throw "Ollama no está disponible en http://localhost:11434. Abre Ollama y vuelve a ejecutar."
    }

    $modelos = @($ollama.models | ForEach-Object { $_.name })
    if (-not ($modelos -contains "qwen3:8b")) {
        throw "El modelo qwen3:8b no está disponible en Ollama."
    }

    Escribir-Paso "Ejecutando pipeline del Diario Oficial..."
    $codigo = Ejecutar-Python @("automation\actualizar_desde_diario.py")
    if ($codigo -ne 0) {
        throw "El pipeline terminó con código de salida $codigo."
    }

    Escribir-Paso "Ejecutando pruebas automáticas..."
    $codigo = Ejecutar-Python @("-m", "unittest", "discover", "-s", "tests", "-v")
    if ($codigo -ne 0) {
        throw "Las pruebas automáticas fallaron con código $codigo."
    }

    Escribir-Paso "Validando el portal..."
    $codigo = Ejecutar-Python @("automation\validar_sitio.py")
    if ($codigo -ne 0) {
        throw "La validación del portal falló con código $codigo."
    }

    Escribir-Paso "Preparando únicamente los archivos públicos generados..."
    $rutasPublicas = @(
        "data/reportes.js",
        "data/eventos.js",
        "data/events",
        "documentos/reportes"
    )

    $rutasExistentes = @()
    foreach ($ruta in $rutasPublicas) {
        if (Test-Path (Join-Path $RepoPath $ruta)) {
            $rutasExistentes += $ruta
        }
    }

    if ($rutasExistentes.Count -eq 0) {
        throw "No se encontraron archivos públicos para revisar."
    }

    git add -- $rutasExistentes
    if ($LASTEXITCODE -ne 0) {
        throw "git add falló."
    }

    git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Escribir-Paso "No hay cambios nuevos para publicar. Proceso finalizado."
        exit 0
    }
    elseif ($LASTEXITCODE -ne 1) {
        throw "No se pudo comprobar el contenido preparado para commit."
    }

    $mensaje = "Actualización diaria TUI $fecha"
    Escribir-Paso "Creando commit en '$rama': $mensaje"
    git commit -m $mensaje
    if ($LASTEXITCODE -ne 0) {
        throw "git commit falló."
    }

    Escribir-Paso "Publicando resultados en la rama '$rama'..."
    git push origin $rama
    if ($LASTEXITCODE -ne 0) {
        throw "git push falló para '$rama'."
    }

    Escribir-Paso "Actualización completada en rama de trabajo. La integración a main requiere revisión/PR por separado."
}
catch {
    Escribir-Paso ("ERROR: " + $_.Exception.Message)
    exit 1
}
finally {
    if (Test-Path $lockFile) {
        Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    }
    Stop-Transcript | Out-Null
}
