# =============================================
# 🚀 YAVOY v3.1 - DEPLOY RÁPIDO A HOSTINGER
# =============================================

Write-Host ""
Write-Host "🚀 ================================================" -ForegroundColor Green
Write-Host "🚀   YAVOY v3.1 - DEPLOY HOSTINGER AUTOMÁTICO   " -ForegroundColor Green  
Write-Host "🚀 ================================================" -ForegroundColor Green
Write-Host ""

# Credenciales Hostinger
$SSH_HOST = "147.79.84.219"
$SSH_PORT = "65002"
$SSH_USER = "u695828542"

Write-Host "📋 INFORMACIÓN DE CONEXIÓN:" -ForegroundColor Yellow
Write-Host "   🖥️  Host: $SSH_HOST" -ForegroundColor White
Write-Host "   🔌  Puerto: $SSH_PORT" -ForegroundColor White
Write-Host "   👤  Usuario: $SSH_USER" -ForegroundColor White
Write-Host "   🌐  Dominio: yavoy.space" -ForegroundColor White
Write-Host ""

Write-Host "📦 ARCHIVOS NECESARIOS CREADOS:" -ForegroundColor Cyan
Write-Host "   ✅ .env.hostinger.production (configuración producción)" -ForegroundColor Green
Write-Host "   ✅ DEPLOY_HOSTINGER_FINAL.md (guía completa)" -ForegroundColor Green
Write-Host ""

Write-Host "🔑 PASO 1: CONECTAR POR SSH" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ejecuta este comando en una terminal:" -ForegroundColor White
Write-Host ""
Write-Host "   ssh -p $SSH_PORT ${SSH_USER}@${SSH_HOST}" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Cuando te pida la contraseña, ingresa tu contraseña de Hostinger" -ForegroundColor Gray
Write-Host ""

Write-Host "📂 PASO 2: NAVEGAR AL DIRECTORIO WEB" -ForegroundColor Yellow
Write-Host ""
Write-Host "   cd public_html" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔄 PASO 3: CLONAR REPOSITORIO" -ForegroundColor Yellow
Write-Host ""
Write-Host "   git clone https://github.com/braianruaimi/YAvoyOk.git ." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Nota: El punto (.) al final es importante" -ForegroundColor Gray
Write-Host ""

Write-Host "📝 PASO 4: CREAR ARCHIVO .env" -ForegroundColor Yellow
Write-Host ""
Write-Host "   nano .env" -ForegroundColor Cyan
Write-Host ""
Write-Host "Luego copia el contenido de:" -ForegroundColor White
Write-Host "   .env.hostinger.production" -ForegroundColor Cyan
Write-Host ""
Write-Host "Guardar: Ctrl+X → Y → Enter" -ForegroundColor Gray
Write-Host ""

Write-Host "📦 PASO 5: INSTALAR DEPENDENCIAS" -ForegroundColor Yellow
Write-Host ""
Write-Host "   npm install --production" -ForegroundColor Cyan
Write-Host ""

Write-Host "📁 PASO 6: CREAR DIRECTORIOS" -ForegroundColor Yellow
Write-Host ""
Write-Host "   mkdir -p logs backup uploads" -ForegroundColor Cyan
Write-Host "   chmod 755 logs backup uploads" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 PASO 7: INICIAR CON PM2" -ForegroundColor Yellow
Write-Host ""
Write-Host "   npm install -g pm2" -ForegroundColor Cyan
Write-Host "   pm2 start server.js --name yavoy" -ForegroundColor Cyan
Write-Host "   pm2 save" -ForegroundColor Cyan
Write-Host "   pm2 startup" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ PASO 8: VERIFICAR" -ForegroundColor Yellow
Write-Host ""
Write-Host "   pm2 status" -ForegroundColor Cyan
Write-Host "   pm2 logs yavoy" -ForegroundColor Cyan
Write-Host ""

Write-Host "================================================" -ForegroundColor Green
Write-Host "📚 PARA MÁS DETALLES, VER:" -ForegroundColor Cyan
Write-Host "   DEPLOY_HOSTINGER_FINAL.md" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

Write-Host "💡 COMANDOS RÁPIDOS DESPUÉS DEL DEPLOY:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Ver logs:          pm2 logs yavoy" -ForegroundColor White
Write-Host "   Reiniciar:         pm2 restart yavoy" -ForegroundColor White
Write-Host "   Estado:            pm2 status" -ForegroundColor White
Write-Host "   Monitorear:        pm2 monit" -ForegroundColor White
Write-Host "   Actualizar código: git pull && pm2 restart yavoy" -ForegroundColor White
Write-Host ""

Write-Host "🌐 URL DE TU APLICACIÓN:" -ForegroundColor Cyan
Write-Host "   https://yavoy.space" -ForegroundColor Green
Write-Host ""

# Preguntar si quiere abrir el archivo .env de producción
Write-Host "¿Deseas abrir el archivo .env de producción para revisarlo? (S/N)" -ForegroundColor Yellow
$respuesta = Read-Host

if ($respuesta -eq "S" -or $respuesta -eq "s") {
    Start-Process notepad.exe ".env.hostinger.production"
}

Write-Host ""
Write-Host "🎉 ¡Listo para deploy!" -ForegroundColor Green
Write-Host ""
