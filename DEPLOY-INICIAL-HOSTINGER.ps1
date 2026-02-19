# ============================================
# YAVOY v3.1 - DEPLOYMENT INICIAL HOSTINGER
# ============================================
# Este script hace el deployment completo en Hostinger
# Solo ejecutalo UNA VEZ para configurar todo

param(
    [string]$HostingerIP = "147.79.84.219",
    [string]$HostingerPort = "65002",
    [string]$HostingerUser = "u695828542",
    [string]$HostingerPassword = "Yavoy26!"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   YAVOY v3.1 - DEPLOYMENT HOSTINGER" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Función para ejecutar comandos SSH
function Invoke-SSHCommand {
    param([string]$Command)
    
    Write-Host "Ejecutando: $Command" -ForegroundColor Gray
    
    # Usar plink para ejecutar comandos
    $result = cmd /c "echo y | plink -ssh -P $HostingerPort -pw $HostingerPassword $HostingerUser@$HostingerIP `"$Command`" 2>&1"
    
    return $result
}

# PASO 1: Verificar conexión SSH
Write-Host "[1/8] Verificando conexión SSH..." -ForegroundColor Yellow
try {
    $testSSH = Invoke-SSHCommand "echo 'Conexion exitosa'"
    if ($testSSH -match "exitosa") {
        Write-Host "✅ Conexión SSH establecida" -ForegroundColor Green
    } else {
        Write-Host "❌ Error de conexión SSH" -ForegroundColor Red
        Write-Host "Asegúrate de tener plink instalado (viene con PuTTY)" -ForegroundColor Yellow
        Write-Host "Descarga: https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html" -ForegroundColor Cyan
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

# PASO 2: Verificar Node.js
Write-Host ""
Write-Host "[2/8] Verificando Node.js en servidor..." -ForegroundColor Yellow
$nodeVersion = Invoke-SSHCommand "node --version 2>&1"

if ($nodeVersion -match "v\d+\.\d+\.\d+") {
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
    $hasNodeJS = $true
} else {
    Write-Host "⚠️  Node.js NO disponible en tu plan" -ForegroundColor Yellow
    Write-Host "   Necesitarás usar Render.com para el backend" -ForegroundColor Yellow
    $hasNodeJS = $false
    
    $continue = Read-Host "¿Continuar sin Node.js? (solo frontend estático) [s/n]"
    if ($continue -ne "s") {
        Write-Host "Deployment cancelado" -ForegroundColor Red
        exit 0
    }
}

# PASO 3: Limpiar directorio
Write-Host ""
Write-Host "[3/8] Limpiando directorio web..." -ForegroundColor Yellow
Invoke-SSHCommand "cd ~/public_html && rm -rf * .[^.]* 2>/dev/null || true" | Out-Null
Write-Host "✅ Directorio limpio" -ForegroundColor Green

# PASO 4: Clonar repositorio
Write-Host ""
Write-Host "[4/8] Clonando repositorio desde GitHub..." -ForegroundColor Yellow
$cloneResult = Invoke-SSHCommand "cd ~/public_html && git clone https://github.com/braianruaimi/YAvoyOk.git . 2>&1"

if ($cloneResult -match "done|100%|Receiving objects") {
    Write-Host "✅ Repositorio clonado exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al clonar repositorio" -ForegroundColor Red
    Write-Host $cloneResult -ForegroundColor Gray
    exit 1
}

if ($hasNodeJS) {
    # PASO 5: Instalar dependencias
    Write-Host ""
    Write-Host "[5/8] Instalando dependencias npm..." -ForegroundColor Yellow
    Write-Host "   (Esto puede tardar 2-3 minutos)" -ForegroundColor Gray
    
    $npmInstall = Invoke-SSHCommand "cd ~/public_html && npm install --production 2>&1"
    
    if ($npmInstall -match "added|up to date") {
        Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Advertencia en instalación de dependencias" -ForegroundColor Yellow
    }

    # PASO 6: Crear archivo .env
    Write-Host ""
    Write-Host "[6/8] Creando archivo .env de producción..." -ForegroundColor Yellow
    
    $envContent = @"
# YAVOY v3.1 PRODUCTION
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u695828542_YAvoyOk26
DB_USER=u695828542_ssh
DB_PASSWORD=Yavoy26!
DB_POOL_MIN=2
DB_POOL_MAX=5

NODE_ENV=production
PORT=3000

JWT_SECRET=a7b9c5d8e1f2g3h4i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5
JWT_EXPIRES_IN=24h
SESSION_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8t7s6r5q4p3o2n1m0l9k8j7i6h5g4f3e2d1c0b9a8z7y6x5w4v3u2t1s0r9q8p7o6n5m4l3k2j1i0h9g8f7e6d5c4b3a2z1y0x9w8v7u6t5s4r3q2p1o0n9m8l7k6j5i4h3g2f1e0d9c8b7a6z5y4x3w2v1u0t9s8r7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a0

MERCADOPAGO_ACCESS_TOKEN=APP_USR-1669843029634117-021901-044acdd220c1e28bddc123272f9031a4-2691839466
MERCADOPAGO_PUBLIC_KEY=APP_USR-c77b3180-f0c7-4a98-9cc9-ba06142251af
MERCADOPAGO_WEBHOOK_SECRET=404dcf91f249a7c24da374d93cd9ccebc00ce10d1a912721cf19fd1ea6d95ee8

ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space,http://yavoy.space

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yavoyen5@gmail.com
SMTP_PASS=ldbe jejw mwno vkal
SMTP_SECURE=false
SMTP_TLS=true

VAPID_PUBLIC_KEY=BL4P9zTOxEkQBAmTV3XiyK9305PJDZKoPr52a0NNedpV5OVfuZGlf9SL21zVE9D4AwNfgWzKw8bHA-peL_g-qZs
VAPID_PRIVATE_KEY=SmZvfO1ZhLtbCrewuGFDnG0gfuTeV5DT9vRBjmWlBL4
VAPID_SUBJECT=mailto:yavoyen5@gmail.com
"@

    # Escapar comillas para SSH
    $envContentEscaped = $envContent -replace '"', '\"' -replace '`', '\`'
    
    Invoke-SSHCommand "cd ~/public_html && cat > .env << 'EOFENV'`n$envContent`nEOFENV" | Out-Null
    Write-Host "✅ Archivo .env creado" -ForegroundColor Green

    # PASO 7: Verificar si hay Node.js Selector
    Write-Host ""
    Write-Host "[7/8] Intentando iniciar aplicación..." -ForegroundColor Yellow
    
    # Intentar con node directamente
    $startResult = Invoke-SSHCommand "cd ~/public_html && node server.js > app.log 2>&1 &"
    
    Write-Host "✅ Aplicación iniciada en background" -ForegroundColor Green
    Write-Host "   NOTA: Si tienes Node.js Selector en hPanel, úsalo para gestionarla" -ForegroundColor Yellow
    
} else {
    # Sin Node.js - Solo frontend
    Write-Host ""
    Write-Host "[5/8] Configurando solo frontend (sin backend)..." -ForegroundColor Yellow
    Write-Host "✅ Archivos estáticos listos" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "[6/8] Configurando .htaccess..." -ForegroundColor Yellow
    
    $htaccess = @"
# YAvoy v3.1 - Routing
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# HTTPS Redirect
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# CORS Headers
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
"@

    Invoke-SSHCommand "cd ~/public_html && cat > .htaccess << 'EOFHTACCESS'`n$htaccess`nEOFHTACCESS" | Out-Null
    Write-Host "✅ .htaccess configurado" -ForegroundColor Green
}

# PASO 8: Verificación final
Write-Host ""
Write-Host "[8/8] Verificando deployment..." -ForegroundColor Yellow

$fileCheck = Invoke-SSHCommand "cd ~/public_html && ls -la | grep -E 'index.html|server.js|package.json'"

if ($fileCheck -match "index.html") {
    Write-Host "✅ Archivos verificados" -ForegroundColor Green
} else {
    Write-Host "⚠️  Algunos archivos podrían faltar" -ForegroundColor Yellow
}

# Resumen final
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   ✅ DEPLOYMENT COMPLETADO" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if ($hasNodeJS) {
    Write-Host "🌐 SITIO: https://yavoy.space" -ForegroundColor Green
    Write-Host "📂 PATH: /home/u695828542/public_html" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "   Ve a hPanel > Node.js Selector (si existe)" -ForegroundColor White
    Write-Host "   Y configura:" -ForegroundColor White
    Write-Host "   - Application root: /home/u695828542/public_html" -ForegroundColor Gray
    Write-Host "   - Application startup file: server.js" -ForegroundColor Gray
    Write-Host "   - Application mode: production" -ForegroundColor Gray
    Write-Host "   - Node.js version: 18.x o superior" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 Ver logs:" -ForegroundColor Cyan
    Write-Host "   ssh -p $HostingerPort $HostingerUser@$HostingerIP" -ForegroundColor Gray
    Write-Host "   tail -f ~/public_html/app.log" -ForegroundColor Gray
} else {
    Write-Host "🌐 FRONTEND: https://yavoy.space" -ForegroundColor Green
    Write-Host "📂 PATH: /home/u695828542/public_html" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  BACKEND:" -ForegroundColor Yellow
    Write-Host "   Tu plan NO soporta Node.js" -ForegroundColor White
    Write-Host "   Opciones:" -ForegroundColor White
    Write-Host "   1. Deploy backend en Render.com (gratis)" -ForegroundColor Gray
    Write-Host "   2. Upgrade a VPS Hostinger (~$5/mes)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📚 Guía completa: DEPLOY_HOSTINGER_BUSINESS_PLAN.md" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Preguntar si quiere configurar auto-deployment
Write-Host "¿Quieres configurar auto-deployment con GitHub Actions? [s/n]" -ForegroundColor Yellow
$setupActions = Read-Host

if ($setupActions -eq "s") {
    Write-Host ""
    Write-Host "Ejecuta ahora:" -ForegroundColor Cyan
    Write-Host "   .\SETUP-AUTO-DEPLOYMENT.ps1" -ForegroundColor White
    Write-Host ""
}

Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
