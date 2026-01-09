#!/usr/bin/env pwsh
# ============================================
# YAVOY - INICIAR SERVIDOR (Script Mejorado)
# ============================================

$Host.UI.RawUI.WindowTitle = "YAvoy Server - Puerto 3000"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                          ║" -ForegroundColor Cyan
Write-Host "║          🚀 INICIANDO SERVIDOR YAVOY v3.1 🚀            ║" -ForegroundColor Cyan
Write-Host "║                                                          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "[1/4] Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if (!$nodeVersion) {
    Write-Host "❌ ERROR: Node.js no está instalado" -ForegroundColor Red
    Write-Host "📥 Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}
Write-Host "✅ Node.js $nodeVersion detectado" -ForegroundColor Green
Write-Host ""

# Verificar puerto 3000
Write-Host "[2/4] Verificando puerto 3000..." -ForegroundColor Yellow
$existingProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "⚠️  Puerto 3000 en uso. Liberando..." -ForegroundColor Yellow
    $pid = $existingProcess.OwningProcess | Select-Object -First 1
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}
Write-Host "✅ Puerto 3000 disponible" -ForegroundColor Green
Write-Host ""

# Cambiar al directorio del script
Write-Host "[3/4] Configurando entorno..." -ForegroundColor Yellow
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
Write-Host "✅ Directorio: $scriptPath" -ForegroundColor Green
Write-Host ""

# Iniciar servidor
Write-Host "[4/4] Iniciando servidor..." -ForegroundColor Yellow
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  🌐 Servidor iniciándose..." -ForegroundColor White
Write-Host "  📡 Puerto: 3000" -ForegroundColor White
Write-Host "  🔧 Modo: Development" -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Esperar un momento antes de mostrar URLs
Start-Sleep -Seconds 2

Write-Host "✅ SERVIDOR INICIADO EXITOSAMENTE" -ForegroundColor Green
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📋 ACCESOS DIRECTOS:" -ForegroundColor White
Write-Host ""
Write-Host "     🏠 Principal:" -ForegroundColor Yellow
Write-Host "        http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "     🚴 Repartidor:" -ForegroundColor Yellow
Write-Host "        http://localhost:3000/panel-repartidor.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "     🏪 Comercio:" -ForegroundColor Yellow
Write-Host "        http://localhost:3000/panel-comercio.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "     👤 Cliente:" -ForegroundColor Yellow
Write-Host "        http://localhost:3000/panel-cliente-pro.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "     🎯 CEO/Admin:" -ForegroundColor Yellow
Write-Host "        http://localhost:3000/panel-ceo-master.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ℹ️  INFORMACIÓN:" -ForegroundColor White
Write-Host "     • Para detener: Presiona Ctrl+C" -ForegroundColor Gray
Write-Host "     • Logs en tiempo real más abajo" -ForegroundColor Gray
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Iniciar servidor (esto bloqueará hasta que termine)
node server.js

# Si el servidor se detiene
Write-Host ""
Write-Host "⚠️  Servidor detenido" -ForegroundColor Yellow
Read-Host "Presiona Enter para salir"
