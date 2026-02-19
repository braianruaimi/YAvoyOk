# ============================================
# Mover YAvoy a public_html/app
# Para Shared Hosting Hostinger
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR YAVOY - SHARED HOSTING" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Este script:"  -ForegroundColor White
Write-Host "1. Copia tu aplicación a /public_html/app" -ForegroundColor Gray
Write-Host "2. Detiene PM2 (no necesario en shared)" -ForegroundColor Gray
Write-Host "3. Te guía para configurarlo en hPanel`n" -ForegroundColor Gray

$confirmar = Read-Host "¿Continuar? (s/n)"

if ($confirmar -ne "s") {
    Write-Host "`nCancelado.`n" -ForegroundColor Yellow
    exit
}

Write-Host "`nConectando al servidor..." -ForegroundColor Cyan

$bashScript = @'
#!/bin/bash
cd ~
echo "[1/5] Creando directorio public_html/app..."
mkdir -p public_html/app

echo "[2/5] Copiando aplicación..."
shopt -s dotglob
cp -r yavoy-app/* public_html/app/ 2>/dev/null || true

echo "[3/5] Verificando archivos copiados..."
ls -la public_html/app | head -15

echo "[4/5] Deteniendo PM2..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

echo "[5/5] COMPLETADO"
echo ""
echo "Ubicación: /home/u695828542/public_html/app"
echo "Archivos copiados: $(ls -1 public_html/app | wc -l)"
'@

$bashScript | ssh -p 65002 u695828542@147.79.84.219 bash

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  APLICACIÓN COPIADA EXITOSAMENTE" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "Nueva ubicación:" -ForegroundColor Cyan
    Write-Host "/home/u695828542/public_html/app`n" -ForegroundColor Yellow
    
    Write-Host "SIGUIENTE PASO - Configurar en hPanel:" -ForegroundColor Cyan
    Write-Host "1. Ve a: Advanced > Setup Node.js Application" -ForegroundColor White
    Write-Host "2. Clic en: Create Application" -ForegroundColor White
    Write-Host "3. Rellena los campos:" -ForegroundColor White
    Write-Host "   - Application root: /public_html/app" -ForegroundColor Gray
    Write-Host "   - Application URL: http://yavoy.space" -ForegroundColor Gray
    Write-Host "   - Startup file: server.js" -ForegroundColor Gray
    Write-Host "   - Node version: 18.x" -ForegroundColor Gray
    Write-Host "4. Clic en CREATE" -ForegroundColor White
    Write-Host "5. Espera 1-2 minutos" -ForegroundColor White
    Write-Host "6. Verifica: https://yavoy.space`n" -ForegroundColor White
    
    Write-Host "¿Abrir hPanel ahora? (s/n): " -ForegroundColor Cyan -NoNewline
    $abrir = Read-Host
    
    if ($abrir -eq "s") {
        Write-Host "Abriendo hPanel...`n" -ForegroundColor Yellow
        Start-Process "https://hpanel.hostinger.com/hosting/advanced/nodejs"
    }
    
} else {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  ERROR AL COPIAR ARCHIVOS" -ForegroundColor Yellow
    Write-Host "========================================`n" -ForegroundColor Red
    
    Write-Host "Opciones:" -ForegroundColor Cyan
    Write-Host "1. Intenta nuevamente" -ForegroundColor White
    Write-Host "2. Contacta soporte Hostinger" -ForegroundColor White
    Write-Host ""
    Write-Host "Mensaje para soporte:" -ForegroundColor Gray
    Write-Host "------------------------------------" -ForegroundColor Gray
    Write-Host "Necesito configurar Node.js app en:" -ForegroundColor White
    Write-Host "/home/u695828542/public_html/app" -ForegroundColor Yellow
    Write-Host "Dominio: yavoy.space" -ForegroundColor Yellow
    Write-Host "Startup: server.js" -ForegroundColor Yellow
    Write-Host "------------------------------------`n" -ForegroundColor Gray
}

Write-Host "========================================`n" -ForegroundColor Cyan
