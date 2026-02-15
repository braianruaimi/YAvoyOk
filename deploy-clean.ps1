# ========================================
# YAVOY - DEPLOY AUTOMATICO A HOSTINGER
# ========================================

param(
    [string]$mensaje = "Actualizacion automatica"
)

Write-Host ""
Write-Host "YAvoy Deploy Automatico" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar cambios
Write-Host "Verificando cambios..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "Archivos modificados:" -ForegroundColor Gray
    Write-Host $status -ForegroundColor White
}
else {
    Write-Host "No hay cambios nuevos para subir" -ForegroundColor Yellow
    Write-Host "Continuando con el deploy del codigo actual..." -ForegroundColor Cyan
}

# 2. Git add (si hay cambios)
if ($status) {
    Write-Host ""
    Write-Host "Agregando archivos..." -ForegroundColor Yellow
    git add .
    
    # 3. Git commit
    Write-Host "Guardando cambios..." -ForegroundColor Yellow
    git commit -m "$mensaje"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error en commit" -ForegroundColor Red
        exit 1
    }
    
    # 4. Git push
    Write-Host "Subiendo a GitHub..." -ForegroundColor Yellow
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error en push. Puede que necesites hacer git pull primero" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Cambios subidos a GitHub correctamente" -ForegroundColor Green
}

# 5. Instrucciones para deploy SSH
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "INSTRUCCIONES PARA DEPLOY SSH" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$SSH_HOST = "147.79.84.219"
$SSH_PORT = "65002"
$SSH_USER = "u695828542"

Write-Host "Para completar el deploy en Hostinger:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Abre PuTTY o tu cliente SSH favorito" -ForegroundColor White
Write-Host ""
Write-Host "2. Conecta con estos datos:" -ForegroundColor White
Write-Host "   Host: $SSH_HOST" -ForegroundColor Cyan
Write-Host "   Puerto: $SSH_PORT" -ForegroundColor Cyan
Write-Host "   Usuario: $SSH_USER" -ForegroundColor Cyan
Write-Host "   Password: Yavoy25!" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Una vez conectado, ejecuta estos comandos:" -ForegroundColor White
Write-Host ""
Write-Host "   cd ~/public_html" -ForegroundColor Green
Write-Host "   git pull origin main" -ForegroundColor Green
Write-Host "   npm install" -ForegroundColor Green
Write-Host "   pm2 restart yavoy || pm2 start server.js --name yavoy" -ForegroundColor Green
Write-Host "   pm2 save" -ForegroundColor Green
Write-Host ""
Write-Host "4. Verifica que el servidor este corriendo:" -ForegroundColor White
Write-Host "   pm2 status" -ForegroundColor Green
Write-Host "   pm2 logs yavoy --lines 20" -ForegroundColor Green
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tu aplicacion estara disponible en: https://yavoy.space" -ForegroundColor Green
Write-Host ""
Write-Host "Deploy local completado!" -ForegroundColor Green
Write-Host ""
