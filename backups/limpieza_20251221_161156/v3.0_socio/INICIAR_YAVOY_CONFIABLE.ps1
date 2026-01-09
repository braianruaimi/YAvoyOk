# Script PowerShell para iniciar YaVoy de forma confiable
# INICIAR_YAVOY.ps1

# Colores
$Host.UI.RawUI.WindowTitle = "YaVoy - Sistema de Gestión de Pedidos"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Clear-Host
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                          ║" -ForegroundColor Cyan
Write-Host "║          🚀 INICIANDO SERVIDOR YAVOY 🚀                 ║" -ForegroundColor Cyan
Write-Host "║                                                          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "[INFO] Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if (!$nodeVersion) {
    Write-Host "[ERROR] Node.js no está instalado" -ForegroundColor Red
    Write-Host "[INFO] Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}
Write-Host "[OK] Node.js $nodeVersion detectado" -ForegroundColor Green

# Verificar puerto 5501
Write-Host "[INFO] Verificando puerto 5501..." -ForegroundColor Yellow
$existingProcess = Get-NetTCPConnection -LocalPort 5501 -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "[WARN] Puerto 5501 en uso" -ForegroundColor Yellow
    $pid = $existingProcess.OwningProcess
    Write-Host "[INFO] Deteniendo proceso $pid..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}
Write-Host "[OK] Puerto 5501 disponible" -ForegroundColor Green

# Cambiar al directorio del script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  🌐 Iniciando servidor..." -ForegroundColor White
Write-Host ""
Write-Host "  Esto puede tomar unos segundos..." -ForegroundColor Gray
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Iniciar servidor en proceso separado
$process = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -WindowStyle Hidden

# Esperar a que el servidor inicie
Start-Sleep -Seconds 3

# Verificar que el servidor está corriendo
$serverRunning = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5501/api/repartidores" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $serverRunning = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if ($serverRunning) {
    Write-Host "✅ SERVIDOR INICIADO CORRECTAMENTE" -ForegroundColor Green
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  📋 ACCESOS DIRECTOS:" -ForegroundColor White
    Write-Host "     • http://localhost:5501" -ForegroundColor Cyan
    Write-Host "     • http://localhost:5501/panel-repartidor.html" -ForegroundColor Cyan
    Write-Host "     • http://localhost:5501/panel-comercio.html" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  📊 CREDENCIALES DE PRUEBA:" -ForegroundColor White
    Write-Host "     • Repartidor ID: REP-01" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  🔧 PROCESO:" -ForegroundColor White
    Write-Host "     • PID: $($process.Id)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Preguntar si abrir navegador
    $openBrowser = Read-Host "¿Abrir panel de repartidor en navegador? (S/N)"
    if ($openBrowser -eq "S" -or $openBrowser -eq "s") {
        Start-Process "http://localhost:5501/panel-repartidor.html"
    }
    
    Write-Host ""
    Write-Host "✅ Sistema listo para usar" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para detener el servidor, ejecuta:" -ForegroundColor Yellow
    Write-Host "  Stop-Process -Id $($process.Id)" -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host "❌ ERROR: El servidor no pudo iniciarse" -ForegroundColor Red
    Write-Host ""
    Write-Host "Revisa:" -ForegroundColor Yellow
    Write-Host "  1. El archivo server.js existe" -ForegroundColor Gray
    Write-Host "  2. Las dependencias están instaladas (npm install)" -ForegroundColor Gray
    Write-Host "  3. El puerto 5501 no está bloqueado por firewall" -ForegroundColor Gray
    Write-Host ""
    
    # Intentar detener el proceso
    if ($process -and !$process.HasExited) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Read-Host "Presiona Enter para salir"
