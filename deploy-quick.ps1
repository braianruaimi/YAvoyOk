# Cerrar cualquier proceso SSH bloqueante
Get-Process | Where-Object { $_.MainWindowTitle -like '*ssh*' -or $_.ProcessName -eq 'ssh' } | Stop-Process -Force -ErrorAction SilentlyContinue

# Deploy
Write-Host "🚀 YAvoy Deploy Automático" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Git add
Write-Host "📦 Agregando archivos..." -ForegroundColor Yellow
git add .

# Git commit
Write-Host "💾 Guardando cambios..." -ForegroundColor Yellow
git commit -m "Agregado boton Registrarme con modal de formulario completo"

# Git push
Write-Host "☁️  Subiendo a GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "✅ Cambios subidos a GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Ahora actualiza el servidor en:" -ForegroundColor Cyan
Write-Host "   https://yavoy.space/update-server.php?key=Yavoy2026" -ForegroundColor White
Write-Host ""

# Abrir navegador
Start-Process "https://yavoy.space/update-server.php?key=Yavoy2026"
