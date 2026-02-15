# Script de Deploy Automático para Hostinger
Write-Host "🚀 DEPLOY AUTOMÁTICO YAVOY EN HOSTINGER" -ForegroundColor Cyan
Write-Host ""

$HOST_IP = "147.79.84.219"
$PORT = "65002"
$USER = "u695828542"
$PASSWORD = "Yavoy25!"

Write-Host "📋 Configuración:" -ForegroundColor Yellow
Write-Host "   Host: $HOST_IP"
Write-Host "   Puerto: $PORT"
Write-Host "   Usuario: $USER"
Write-Host ""

# Crear archivo de comandos a ejecutar en el servidor
$comandos = @"
cd ~/public_html
echo '🧹 Limpiando directorio...'
rm -rf * .git .gitignore 2>/dev/null || true
echo '📥 Clonando código desde GitHub...'
git clone https://github.com/braianruaimi/YAvoyOk.git .
echo '📦 Instalando dependencias...'
npm install
echo '⚙️ Creando archivo .env...'
cat > .env << 'ENVFILE'
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
CSRF_SECRET=YAvoy2026_CSRF_Enterprise_Protection
ENCRYPT_SECRET=YAvoy2026_Encryption_Master_Key

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

# CEO
CEO_USERNAME=admin
CEO_PASSWORD=admin123
ENVFILE
echo '🔄 Verificando/Instalando PM2...'
npm list -g pm2 || npm install -g pm2
echo '🚀 Iniciando aplicación con PM2...'
pm2 delete yavoy 2>/dev/null || true
pm2 start server.js --name yavoy
pm2 save
echo '📊 Estado del servidor:'
pm2 status
echo '📝 Logs (últimas 30 líneas):'
pm2 logs yavoy --lines 30 --nostream
echo ''
echo '✅ DEPLOY COMPLETADO!'
echo '🌐 Tu app está en: https://yavoy.space'
exit
"@

# Guardar comandos en archivo temporal
$tempScript = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tempScript -Value $comandos -Encoding UTF8

Write-Host "🔐 Conectando a Hostinger..." -ForegroundColor Green
Write-Host ""

# Intentar conexión con expect (si está disponible) o mostrar instrucciones manuales
$expectInstalled = Get-Command expect -ErrorAction SilentlyContinue

if ($expectInstalled) {
    # Si expect está instalado, usarlo
    $expectScript = @"
#!/usr/bin/expect -f
set timeout -1
spawn ssh -p $PORT ${USER}@${HOST_IP}
expect "password:"
send "${PASSWORD}\r"
expect "$ "
send "bash\r"
$(Get-Content $tempScript -Raw)
interact
"@
    
    $expectFile = [System.IO.Path]::GetTempFileName() + ".exp"
    Set-Content -Path $expectFile -Value $expectScript
    
    & expect $expectFile
}
else {
    Write-Host "⚠️  No se detectó 'expect'. Usando método interactivo." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Copia estos comandos y ejecútalos EN EL SERVIDOR:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host $comandos -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "🔌 Ahora conectando por SSH..." -ForegroundColor Green
    Write-Host "   Contraseña: $PASSWORD" -ForegroundColor Yellow
    Write-Host ""
    
    # Iniciar SSH interactivo
    ssh -p $PORT ${USER}@${HOST_IP}
}

Remove-Item $tempScript -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✨ Si todo salió bien, tu app ya está corriendo en:" -ForegroundColor Green
Write-Host "   🌐 https://yavoy.space" -ForegroundColor Cyan
Write-Host "   📱 Accesible desde cualquier celular" -ForegroundColor Cyan
Write-Host ""
