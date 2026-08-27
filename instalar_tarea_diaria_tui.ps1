param(
    [string]$RepoPath = (Split-Path -Parent $MyInvocation.MyCommand.Path)
)

$ErrorActionPreference = "Stop"

$taskName = "Transsa Urban Intelligence - Actualización diaria"
$scriptPath = Join-Path $RepoPath "actualizar_y_publicar_tui.ps1"

if (-not (Test-Path $scriptPath)) {
    throw "No se encontró actualizar_y_publicar_tui.ps1 en $RepoPath"
}

if (-not (Test-Path (Join-Path $RepoPath ".git"))) {
    throw "La carpeta no parece ser la raíz del repositorio Git."
}

$usuario = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$accion = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

$disparador = New-ScheduledTaskTrigger -Daily -At "08:30"

$configuracion = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Hours 4)

$principal = New-ScheduledTaskPrincipal `
    -UserId $usuario `
    -LogonType Interactive `
    -RunLevel Limited

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $accion `
    -Trigger $disparador `
    -Settings $configuracion `
    -Principal $principal `
    -Description "Revisa el Diario Oficial con Ollama, genera reportes, valida y publica los resultados de Transsa Urban Intelligence." `
    -Force | Out-Null

Write-Host ""
Write-Host "TAREA INSTALADA CORRECTAMENTE." -ForegroundColor Green
Write-Host "Nombre: $taskName"
Write-Host "Horario: todos los días a las 08:30"
Write-Host "Usuario: $usuario"
Write-Host ""
Write-Host "La tarea se ejecuta cuando tu sesión de Windows está iniciada."
Write-Host "Si el equipo estaba suspendido a las 08:30, se iniciará cuando vuelva a estar disponible."
