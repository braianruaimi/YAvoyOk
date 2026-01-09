# ========================================
# YAVOY - INICIO RÁPIDO
# ========================================

Write-Host "`n🚀 Iniciando YaVoy..." -ForegroundColor Cyan

# Limpiar procesos anteriores
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Iniciar servidor
$process = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3

# Verificar
try {
    $test = Invoke-RestMethod -Uri "http://localhost:5501/api/repartidores" -TimeoutSec 5
    Write-Host "✅ Servidor iniciado (PID: $($process.Id))" -ForegroundColor Green
    Write-Host "`n📍 URLs:" -ForegroundColor Yellow
    Write-Host "   http://localhost:5501" -ForegroundColor Cyan
    Write-Host "   http://localhost:5501/panel-repartidor.html" -ForegroundColor Cyan
    Write-Host "`n🔑 ID Repartidor: REP-01`n" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Error al iniciar" -ForegroundColor Red
}
