# ============================================
# 🚀 YAVOY v3.1 - DEPLOY AUTOMÁTICO HOSTINGER
# ============================================
# Script para deploy completo en Hostinger VPS
# Evita problemas de acceso remoto usando localhost

Write-Host ""
Write-Host "🚀 ============================================" -ForegroundColor Green
Write-Host "🚀   YAVOY v3.1 - DEPLOY HOSTINGER VPS      " -ForegroundColor Green  
Write-Host "🚀 ============================================" -ForegroundColor Green
Write-Host ""

# Credenciales de Hostinger
$SSH_HOST = "147.79.84.219"
$SSH_PORT = "65002" 
$SSH_USER = "u695828542"
$SSH_PASSWORD = "Yavoy25!"

Write-Host "📋 INFORMACIÓN DEL DEPLOY:" -ForegroundColor Yellow
Write-Host "   🖥️  Host: $SSH_HOST" -ForegroundColor White
Write-Host "   🔌  Puerto: $SSH_PORT" -ForegroundColor White
Write-Host "   👤  Usuario: $SSH_USER" -ForegroundColor White
Write-Host "   🌐  URL Final: https://yavoy.space" -ForegroundColor Green
Write-Host ""

# Crear script de comandos para SSH
$sshCommands = @"
# Limpiar directorio public_html
echo "🧹 Limpiando directorio..."
cd ~/public_html
rm -rf *

# Clonar código desde GitHub
echo "📥 Clonando código desde GitHub..."
git clone https://github.com/braianruaimi/YAvoyOk.git .

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Crear archivo .env con credenciales localhost
echo "⚙️ Configurando .env..."
cat > .env << 'EOF'
# BASE DE DATOS MYSQL (LOCALHOST EN HOSTINGER - SIN ACCESO REMOTO)
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

# EMAIL
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=yavoyen5@yavoy.space
SMTP_PASS=BrainCesar26!
SMTP_SECURE=false
SMTP_TLS=true

# VAPID
VAPID_PUBLIC_KEY=BL4P9zTOxEkQBAmTV3XiyK9305PJDZKoPr52a0NNedpV5OVfuZGlf9SL21zVE9D4AwNfgWzKw8bHA-peL_g-qZs
VAPID_PRIVATE_KEY=SmZvfO1ZhLtbCrewuGFDnG0gfuTeV5DT9vRBjmWlBL4
VAPID_SUBJECT=mailto:yavoyen5@yavoy.space
EOF

# Instalar PM2 globalmente si no está
echo "🔧 Verificando PM2..."
which pm2 || npm install -g pm2

# Detener procesos previos
echo "🛑 Deteniendo procesos previos..."
pm2 delete yavoy 2>/dev/null || true

# Iniciar aplicación con PM2
echo "🚀 Iniciando YAvoyOk v3.1 Enterprise..."
pm2 start server.js --name yavoy

# Guardar configuración PM2
pm2 save
pm2 startup

# Crear .htaccess para proxy
echo "🌐 Configurando proxy web..."
cat > .htaccess << 'EOF'
RewriteEngine On

# Redirigir todo a Node.js en puerto 5502
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5502/$1 [P,L]

# Headers para Socket.IO
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
</IfModule>
EOF

# Verificar estado
echo "✅ Verificando estado..."
pm2 status
pm2 logs yavoy --lines 10

echo ""
echo "🎉 ==============================================="
echo "🎉   DEPLOY COMPLETADO EXITOSAMENTE            "
echo "🎉 ==============================================="
echo "📱 App disponible en: https://yavoy.space"
echo "📊 Panel CEO: https://yavoy.space/panel-ceo-master.html"
echo "📋 API Docs: https://yavoy.space/api/auth/docs"
echo ""
"@

# Guardar comandos en archivo temporal
$tempScript = "ssh-commands.sh"
$sshCommands | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "📝 Script de comandos creado: $tempScript" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 INSTRUCCIONES PARA COMPLETAR EL DEPLOY:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣ Ejecuta este comando para conectar por SSH:" -ForegroundColor White
Write-Host "   ssh -p $SSH_PORT $SSH_USER@$SSH_HOST" -ForegroundColor Cyan
Write-Host ""
Write-Host "2️⃣ Cuando te pida la contraseña, ingresa:" -ForegroundColor White
Write-Host "   $SSH_PASSWORD" -ForegroundColor Yellow
Write-Host ""  
Write-Host "3️⃣ Una vez conectado, ejecuta estos comandos:" -ForegroundColor White
Write-Host ""

# Mostrar comandos uno por uno
$commandLines = $sshCommands -split "`n"
foreach ($line in $commandLines) {
    if ($line.Trim() -ne "" -and -not $line.StartsWith("#")) {
        Write-Host "   $line" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "🎯 RESULTADO ESPERADO:" -ForegroundColor Green  
Write-Host "   ✅ Servidor YAvoyOk v3.1 corriendo en PM2" -ForegroundColor White
Write-Host "   ✅ MySQL conectado via localhost (sin acceso remoto)" -ForegroundColor White
Write-Host "   ✅ Aplicación accesible desde https://yavoy.space" -ForegroundColor White
Write-Host "   ✅ Features Premium completamente funcionales" -ForegroundColor White
Write-Host ""
Write-Host "🚀 ¡Tu aplicación estará 100% FUNCIONAL en producción!" -ForegroundColor Green
Write-Host ""

# También crear script directo
Write-Host "💡 ALTERNATIVA RÁPIDA:" -ForegroundColor Yellow
Write-Host "Copia y pega este comando completo:" -ForegroundColor White
Write-Host ""
$singleCommand = "ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
Write-Host $singleCommand -ForegroundColor Green
Write-Host ""