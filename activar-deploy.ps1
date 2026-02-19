# ========================================
# ACTIVAR YAVOY EN HOSTINGER - ACCESO PÚBLICO
# ========================================

Write-Host ""
Write-Host "🚀 ACTIVAR DEPLOY EN HOSTINGER" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

Write-Host "📋 INFORMACIÓN DE CONEXIÓN:" -ForegroundColor Yellow
Write-Host "   SSH: ssh -p 65002 u695828542@147.79.84.219" -ForegroundColor White
Write-Host "   Password: Yavoy26!" -ForegroundColor Gray
Write-Host ""

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "OPCIÓN 1: CONFIGURAR .HTACCESS (Recomendado)" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""
Write-Host "Ejecuta estos comandos en SSH:" -ForegroundColor Yellow
Write-Host ""

Write-Host "# 1. Buscar directorio público" -ForegroundColor Cyan
Write-Host 'find ~ -type d -name "public_html" 2>/dev/null' -ForegroundColor White
Write-Host ""

Write-Host "# 2. CD al directorio encontrado (ajustar según resultado)" -ForegroundColor Cyan
Write-Host "cd ~/public_html" -ForegroundColor White
Write-Host "# O si está en: cd ~/domains/yavoy.space/public_html" -ForegroundColor Gray
Write-Host ""

Write-Host "# 3. Crear archivo .htaccess con proxy reverso" -ForegroundColor Cyan
Write-Host 'cat > .htaccess << '"'"'EOF'"'"'' -ForegroundColor White
Write-Host "<IfModule mod_rewrite.c>" -ForegroundColor Gray
Write-Host "    RewriteEngine On" -ForegroundColor Gray
Write-Host "    RewriteCond %{REQUEST_FILENAME} !-f" -ForegroundColor Gray
Write-Host "    RewriteCond %{REQUEST_FILENAME} !-d" -ForegroundColor Gray
Write-Host '    RewriteRule ^(.*)$ http://127.0.0.1:5502/$1 [P,L]' -ForegroundColor Gray
Write-Host "</IfModule>" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "<IfModule mod_proxy.c>" -ForegroundColor Gray
Write-Host "    ProxyPreserveHost On" -ForegroundColor Gray
Write-Host "    ProxyPass / http://127.0.0.1:5502/" -ForegroundColor Gray
Write-Host "    ProxyPassReverse / http://127.0.0.1:5502/" -ForegroundColor Gray
Write-Host "</IfModule>" -ForegroundColor Gray
Write-Host "EOF" -ForegroundColor White
Write-Host ""

Write-Host "# 4. Verificar servidor PM2" -ForegroundColor Cyan
Write-Host "pm2 status" -ForegroundColor White
Write-Host "pm2 restart yavoy" -ForegroundColor White
Write-Host ""

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "OPCIÓN 2: CONFIGURAR DESDE HPANEL (Más Fácil)" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""
Write-Host "1. Abre: https://hpanel.hostinger.com" -ForegroundColor White
Write-Host "2. Selecciona tu VPS/Hosting" -ForegroundColor White
Write-Host "3. Ve a: Advanced → Setup Node.js Application" -ForegroundColor White
Write-Host "4. Click 'Create Application' y configura:" -ForegroundColor White
Write-Host ""
Write-Host "   Application Name:        YAvoy Enterprise" -ForegroundColor Gray
Write-Host "   Application Mode:        Production" -ForegroundColor Gray
Write-Host "   Node.js Version:         18.x" -ForegroundColor Gray
Write-Host "   Application Root:        /home/u695828542/yavoy-app" -ForegroundColor Gray
Write-Host "   Application Startup:     server.js" -ForegroundColor Gray
Write-Host "   Custom Port:            5502" -ForegroundColor Gray
Write-Host "   Domain:                  yavoy.space" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Click 'Create' y espera 1-2 minutos" -ForegroundColor White
Write-Host ""

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "OPCIÓN 3: CONTACTAR SOPORTE HOSTINGER" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""
Write-Host "Si no ves 'Setup Node.js Application', abre un ticket:" -ForegroundColor White
Write-Host ""
Write-Host "Mensaje para soporte:" -ForegroundColor Yellow
Write-Host "---------------------------------------------------------" -ForegroundColor Gray
Write-Host "Hola," -ForegroundColor White
Write-Host ""  -ForegroundColor White
Write-Host "Necesito configurar un proxy reverso Apache/Nginx" -ForegroundColor White
Write-Host "para mi aplicación Node.js:" -ForegroundColor White
Write-Host ""  -ForegroundColor White
Write-Host "- Ruta aplicación: /home/u695828542/yavoy-app" -ForegroundColor White
Write-Host "- Archivo inicio: server.js" -ForegroundColor White
Write-Host "- Puerto interno: 5502" -ForegroundColor White
Write-Host "- Dominio: yavoy.space" -ForegroundColor White
Write-Host "- Node.js: v18.20.8 (instalado con NVM)" -ForegroundColor White
Write-Host "- Process Manager: PM2 (ya configurado y corriendo)" -ForegroundColor White
Write-Host ""  -ForegroundColor White
Write-Host "Por favor configuren el proxy reverso para que:" -ForegroundColor White
Write-Host "https://yavoy.space → http://localhost:5502" -ForegroundColor White
Write-Host ""  -ForegroundColor White
Write-Host "Gracias." -ForegroundColor White
Write-Host "---------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""
Write-Host "🌐 URL tu aplicación: https://yavoy.space" -ForegroundColor Green
Write-Host "📊 Estado actual: Servidor corriendo, esperando proxy" -ForegroundColor Yellow
Write-Host ""

Write-Host "¿Deseas abrir el panel de Hostinger ahora? (S/N): " -ForegroundColor Cyan -NoNewline
$respuesta = Read-Host

if ($respuesta -eq "S" -or $respuesta -eq "s") {
    Start-Process "https://hpanel.hostinger.com"
    Write-Host "✅ Panel de Hostinger abierto en el navegador" -ForegroundColor Green
}

Write-Host ""
Write-Host "¿Deseas conectarte por SSH ahora? (S/N): " -ForegroundColor Cyan -NoNewline
$respuesta2 = Read-Host

if ($respuesta2 -eq "S" -or $respuesta2 -eq "s") {
    Write-Host ""
    Write-Host "🔌 Abriendo conexión SSH..." -ForegroundColor Green
    Write-Host "Password: Yavoy26!" -ForegroundColor Gray
    Write-Host ""
    ssh -p 65002 u695828542@147.79.84.219
}

Write-Host ""
Write-Host "✅ Script completado" -ForegroundColor Green
Write-Host ""
