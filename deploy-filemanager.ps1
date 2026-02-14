# =============================================
# 📁 DEPLOY YAVOY v3.1 - FILE MANAGER METHOD
# =============================================
# Método alternativo SIN SSH usando panel Hostinger

Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  📁 DEPLOY SIN SSH - FILE MANAGER HOSTINGER    ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🔥 ESTE MÉTODO ES MÁS FÁCIL QUE SSH" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 PASOS A SEGUIR:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣ CREAR ARCHIVO DE PRODUCCIÓN:" -ForegroundColor Green
Write-Host "   Creando .env para Hostinger..." -ForegroundColor White

# Crear el archivo .env para producción
$envContent = @"
# BASE DE DATOS MYSQL (LOCALHOST EN HOSTINGER)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u695828542_yavoy_web  
DB_USER=u695828542_yavoyen5
DB_PASSWORD=Yavoy25!
DB_POOL_MIN=2
DB_POOL_MAX=20

# SEGURIDAD
NODE_ENV=production
PORT=5502
JWT_SECRET=YAvoy_Enterprise_JWT_Secret_2024_Ultra_Secure_MySQL
SESSION_SECRET=YAvoy_Session_Secret_2024_MySQL_Enterprise

# CORS
ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space,http://yavoy.space

# EMAIL HOSTINGER
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=yavoyen5@yavoy.space
SMTP_PASS=BrainCesar26!
SMTP_SECURE=false
SMTP_TLS=true

# VAPID NOTIFICATIONS
VAPID_PUBLIC_KEY=BL4P9zTOxEkQBAmTV3XiyK9305PJDZKoPr52a0NNedpV5OVfuZGlf9SL21zVE9D4AwNfgWzKw8bHA-peL_g-qZs
VAPID_PRIVATE_KEY=SmZvfO1ZhLtbCrewuGFDnG0gfuTeV5DT9vRBjmWlBL4
VAPID_SUBJECT=mailto:yavoyen5@yavoy.space

# LOGGING
LOG_LEVEL=info
"@

$envContent | Out-File -FilePath ".env.hostinger" -Encoding UTF8
Write-Host "   ✅ Archivo .env.hostinger creado" -ForegroundColor Green

# Crear .htaccess
$htaccessContent = @"
RewriteEngine On

# Redirigir todo a Node.js en puerto 5502
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5502/$1 [P,L]

# Headers para Socket.IO y CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
</IfModule>

# Compresión
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>
"@

$htaccessContent | Out-File -FilePath ".htaccess.hostinger" -Encoding UTF8
Write-Host "   ✅ Archivo .htaccess.hostinger creado" -ForegroundColor Green

# Crear script de inicio
$startScript = @"
#!/bin/bash
# Script de inicio para Hostinger
echo "🚀 Iniciando YAvoyOk v3.1 Enterprise..."

# Instalar dependencias si no están
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Instalar PM2 globalmente si no está
which pm2 >/dev/null 2>&1 || {
    echo "🔧 Instalando PM2..."
    npm install -g pm2
}

# Copiar archivo .env
mv .env.hostinger .env

# Detener proceso previo si existe
pm2 delete yavoy 2>/dev/null || true

# Iniciar con PM2
echo "▶️ Iniciando servidor..."
pm2 start server.js --name yavoy

# Guardar configuración
pm2 save
pm2 startup

echo "✅ YAvoyOk v3.1 Enterprise iniciado correctamente!"
echo "🌐 Disponible en: https://yavoy.space"
"@

$startScript | Out-File -FilePath "start-hostinger.sh" -Encoding UTF8
Write-Host "   ✅ Script start-hostinger.sh creado" -ForegroundColor Green
Write-Host ""

Write-Host "2️⃣ ACCEDER AL PANEL HOSTINGER:" -ForegroundColor Green
Write-Host "   🌐 Ve a: https://hpanel.hostinger.com" -ForegroundColor Cyan
Write-Host "   👤 Usa tus credenciales de Hostinger" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣ ABRIR FILE MANAGER:" -ForegroundColor Green
Write-Host "   📁 Hosting → File Manager" -ForegroundColor White
Write-Host "   📂 Navega a public_html" -ForegroundColor White
Write-Host "   🗑️  Elimina todo lo que esté dentro" -ForegroundColor White
Write-Host ""

Write-Host "4️⃣ SUBIR ARCHIVOS:" -ForegroundColor Green
Write-Host "   📤 Upload → Select Files" -ForegroundColor White
Write-Host "   📁 Selecciona TODOS los archivos del proyecto YAvoyOk" -ForegroundColor White
Write-Host "   ⚠️  INCLUIR: .env.hostinger y start-hostinger.sh" -ForegroundColor Yellow
Write-Host ""

Write-Host "5️⃣ EJECUTAR EN TERMINAL (File Manager):" -ForegroundColor Green
Write-Host "   💻 Terminal → Open Terminal" -ForegroundColor White
Write-Host "   ▶️ bash start-hostinger.sh" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎯 ARCHIVOS CRÍTICOS CREADOS:" -ForegroundColor Yellow
Write-Host "   📄 .env.hostinger - Configuración MySQL localhost" -ForegroundColor White
Write-Host "   🌐 .htaccess.hostinger - Proxy web configurado" -ForegroundColor White  
Write-Host "   🚀 start-hostinger.sh - Script de inicio automático" -ForegroundColor White
Write-Host ""

Write-Host "✅ RESULTADO ESPERADO:" -ForegroundColor Green
Write-Host "   🌐 App live en: https://yavoy.space" -ForegroundColor Green
Write-Host "   📊 Panel CEO: https://yavoy.space/panel-ceo-master.html" -ForegroundColor Green
Write-Host "   📋 API: https://yavoy.space/api/auth/docs" -ForegroundColor Green
Write-Host "   ⭐ Features Premium: https://yavoy.space/api/premium/health" -ForegroundColor Green
Write-Host ""

Write-Host "🔥 ¡ESTE MÉTODO ES 100% VISUAL Y MÁS FÁCIL!" -ForegroundColor Green -BackgroundColor Black
Write-Host ""