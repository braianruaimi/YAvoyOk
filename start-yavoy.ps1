# PowerShell Startup Script - YAvoy v3.1
# Uso: .\start-yavoy.ps1

param(
    [int]$Port = 5502
)

Write-Host "=============================================" -ForegroundColor Green
Write-Host "  🚀 YAVOY v3.1 - STARTUP DEFINITIVO" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar directorio correcto
if (!(Test-Path "server-simple.js")) {
    Write-Host "❌ Error: No se encuentra server-simple.js" -ForegroundColor Red
    Write-Host "   Asegúrate de estar en el directorio YAvoy2026" -ForegroundColor Yellow
    exit 1
}

# Limpiar procesos anteriores
Write-Host "🧹 Limpiando procesos anteriores..." -ForegroundColor Cyan
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2

# Verificar puerto libre
$portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  Puerto $Port ocupado, liberando..." -ForegroundColor Yellow
    $processId = $portInUse.OwningProcess
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep 1
}

# Verificar dependencias
Write-Host "📦 Verificando dependencias..." -ForegroundColor Cyan
if (!(Test-Path "node_modules")) {
    Write-Host "🔄 Instalando dependencias..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🚀 Iniciando servidor en puerto $Port..." -ForegroundColor Green
Write-Host "🌐 URL: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "⚠️  Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Iniciar servidor
try {
    node server-simple.js
} catch {
    Write-Host ""
    Write-Host "❌ Error al iniciar servidor" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}