# =======================================
# 🚀 DEPLOY YAVOY v3.1 - PASO A PASO
# =======================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  🚀 YAVOY v3.1 ENTERPRISE - DEPLOY PRODUCTION  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📋 INFORMACIÓN DE CONEXIÓN:" -ForegroundColor Yellow
Write-Host "   🖥️  Servidor: 147.79.84.219:65002" -ForegroundColor White
Write-Host "   👤  Usuario: u695828542" -ForegroundColor White  
Write-Host "   🔑  Password: Yavoy25!" -ForegroundColor Yellow
Write-Host "   🌐  URL Final: https://yavoy.space" -ForegroundColor Green
Write-Host ""

Write-Host "🔥 VENTAJAS DE ESTE DEPLOY:" -ForegroundColor Cyan
Write-Host "   ✅ Sin problemas de acceso remoto MySQL" -ForegroundColor White
Write-Host "   ✅ Aplicación 100% funcional con Features Premium" -ForegroundColor White
Write-Host "   ✅ PM2 para gestión automática de procesos" -ForegroundColor White
Write-Host "   ✅ HTTPS automático con certificado Hostinger" -ForegroundColor White
Write-Host "   ✅ Accesible desde cualquier dispositivo mundial" -ForegroundColor White
Write-Host ""

Write-Host "🚀 PASOS A SEGUIR:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1️⃣ CONECTAR POR SSH" -ForegroundColor Green
Write-Host "   Ejecuta este comando en tu PowerShell:" -ForegroundColor White
Write-Host "   ssh -p 65002 u695828542@147.79.84.219" -ForegroundColor Cyan
Write-Host ""

Write-Host "2️⃣ CUANDO TE PIDA LA CONTRASEÑA:" -ForegroundColor Green  
Write-Host "   Yavoy25!" -ForegroundColor Yellow
Write-Host ""

Write-Host "3️⃣ EJECUTAR COMANDOS DE DEPLOY:" -ForegroundColor Green
Write-Host "   Una vez conectado por SSH, ejecuta UNO POR UNO:" -ForegroundColor White
Write-Host ""

$comandos = @(
    "cd ~/public_html",
    "rm -rf *",
    "git clone https://github.com/braianruaimi/YAvoyOk.git .",
    "npm install",
    "nano .env  # Crear archivo de configuración",
    "npm install -g pm2",
    "pm2 start server.js --name yavoy",
    "pm2 save",
    "nano .htaccess  # Configurar proxy web"
)

$contador = 1
foreach ($comando in $comandos) {
    Write-Host "   $contador. $comando" -ForegroundColor Cyan
    $contador++
}

Write-Host ""
Write-Host "📝 CONTENIDO DEL ARCHIVO .env:" -ForegroundColor Yellow
Write-Host "   (Copia y pega exactamente esto):" -ForegroundColor White
Write-Host ""

$envContent = @"
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u695828542_yavoy_web
DB_USER=u695828542_yavoyen5
DB_PASSWORD=Yavoy25!
NODE_ENV=production
PORT=5502
JWT_SECRET=YAvoy_Enterprise_JWT_Secret_2024_Ultra_Secure_MySQL
ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=yavoyen5@yavoy.space
SMTP_PASS=BrainCesar26!
VAPID_PUBLIC_KEY=BL4P9zTOxEkQBAmTV3XiyK9305PJDZKoPr52a0NNedpV5OVfuZGlf9SL21zVE9D4AwNfgWzKw8bHA-peL_g-qZs
VAPID_PRIVATE_KEY=SmZvfO1ZhLtbCrewuGFDnG0gfuTeV5DT9vRBjmWlBL4
VAPID_SUBJECT=mailto:yavoyen5@yavoy.space
"@

Write-Host $envContent -ForegroundColor Gray
Write-Host ""

Write-Host "🌐 CONTENIDO DEL ARCHIVO .htaccess:" -ForegroundColor Yellow
Write-Host "   (Copia y pega exactamente esto):" -ForegroundColor White
Write-Host ""

$htaccessContent = @"
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5502/$1 [P,L]
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
</IfModule>
"@

Write-Host $htaccessContent -ForegroundColor Gray
Write-Host ""

Write-Host "🎯 RESULTADO FINAL:" -ForegroundColor Green
Write-Host "   📱 App Live: https://yavoy.space" -ForegroundColor Green
Write-Host "   📊 Panel CEO: https://yavoy.space/panel-ceo-master.html" -ForegroundColor Green
Write-Host "   📋 API: https://yavoy.space/api/auth/docs" -ForegroundColor Green
Write-Host ""

Write-Host "✨ COMANDOS ÚTILES EN SSH:" -ForegroundColor Cyan
Write-Host "   pm2 status          # Ver estado del servidor" -ForegroundColor White
Write-Host "   pm2 logs yavoy      # Ver logs en tiempo real" -ForegroundColor White
Write-Host "   pm2 restart yavoy   # Reiniciar aplicación" -ForegroundColor White
Write-Host "   pm2 stop yavoy      # Detener aplicación" -ForegroundColor White
Write-Host ""

Write-Host "🔥 ¡LISTO! Tu YAvoy v3.1 Enterprise estará LIVE en producción!" -ForegroundColor Green -BackgroundColor Black
Write-Host ""