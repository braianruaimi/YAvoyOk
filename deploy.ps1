# ========================================
# 🚀 YAVOY - DEPLOY AUTOMÁTICO COMPLETO
# ========================================
# Uso: .\deploy.ps1 "mensaje del commit"
# Ejemplo: .\deploy.ps1 "Cambios en footer"

param(
    [string]$mensaje = "Actualización automática"
)

Write-Host ""
Write-Host "🚀 YAvoy Deploy Automático" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar cambios
Write-Host "📝 Verificando cambios..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "   Archivos modificados:" -ForegroundColor Gray
    Write-Host $status -ForegroundColor White
}
else {
    Write-Host "   ⚠️  No hay cambios para subir" -ForegroundColor Yellow
    exit 0
}

# 2. Git add
Write-Host ""
Write-Host "📦 Agregando archivos..." -ForegroundColor Yellow
git add .

# 3. Git commit
Write-Host "💾 Guardando cambios..." -ForegroundColor Yellow
git commit -m "$mensaje"
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️  Error en commit" -ForegroundColor Red
    exit 1
}

# 4. Git push
Write-Host "☁️  Subiendo a GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️  Error en push. Puede que necesites hacer git pull primero" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Cambios subidos a GitHub" -ForegroundColor Green

# 5. Actualizar servidor
Write-Host ""
Write-Host "🌐 Actualizando servidor en línea..." -ForegroundColor Yellow
Write-Host "   Abriendo navegador..." -ForegroundColor Gray

Start-Sleep -Seconds 2

# Abrir navegador con la URL de actualización
Start-Process "https://yavoy.space/update-server.php?key=Yavoy2026"

Write-Host ""
Write-Host "✅ Deploy completado!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Verifica tus cambios en: https://yavoy.space" -ForegroundColor Cyan
Write-Host ""
