# ========================================
# ACTIVAR DEPLOY EN HOSTINGER - PROXY REVERSO
# ========================================

Write-Host "🚀 Configurando acceso público para YAvoy en Hostinger..." -ForegroundColor Cyan
Write-Host ""

$SSHHost = "u695828542@147.79.84.219"
$SSHPort = "65002"
$Password = "Yavoy26!"
$ScriptPath = "./setup-proxy-hostinger.sh"

# 1. Subir script al servidor
Write-Host "📤 Subiendo script de configuración..." -ForegroundColor Yellow

$ScpCommand = "echo y | pscp -P $SSHPort $ScriptPath ${SSHHost}:~/"

try {
    Invoke-Expression $ScpCommand
    Write-Host "✅ Script subido" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Error al subir script. Usando método alternativo..." -ForegroundColor Yellow
}

# 2. Ejecutar configuración en el servidor
Write-Host ""
Write-Host "🔧 Ejecutando configuración automática..." -ForegroundColor Yellow
Write-Host ""

$SSHCommands = @"
cd ~ && bash setup-proxy-hostinger.sh
"@

# Crear archivo temporal con comandos
$SSHCommands | Out-File -FilePath ".\temp-ssh-commands.txt" -Encoding ASCII

Write-Host "📋 Comandos a ejecutar:" -ForegroundColor Cyan
Write-Host $SSHCommands
Write-Host ""

# Instrucciones manuales
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "🔑 EJECUTA ESTOS COMANDOS MANUALMENTE EN SSH:" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""
Write-Host "1️⃣ Conectarse por SSH:" -ForegroundColor White
Write-Host "   ssh -p $SSHPort $SSHHost" -ForegroundColor Cyan
Write-Host "   Password: $Password" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣ Buscar directorio público:" -ForegroundColor White
Write-Host "   find ~ -type d -name 'public_html' 2>/dev/null" -ForegroundColor Cyan
Write-Host ""
Write-Host "3️⃣ Ir al directorio (ejemplo):" -ForegroundColor White
Write-Host "   cd ~/public_html" -ForegroundColor Cyan
Write-Host "   # O: cd ~/domains/yavoy.space/public_html" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣ Crear archivo .htaccess:" -ForegroundColor White
Write-Host "   cat > .htaccess << 'EOF'" -ForegroundColor Cyan
Write-Host "<IfModule mod_rewrite.c>" -ForegroundColor Cyan
Write-Host "    RewriteEngine On" -ForegroundColor Cyan
Write-Host "    " -ForegroundColor Cyan
Write-Host "    # Forzar HTTPS" -ForegroundColor Cyan
Write-Host "    RewriteCond %{HTTPS} off" -ForegroundColor Cyan
Write-Host "    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]" -ForegroundColor Cyan
Write-Host "    " -ForegroundColor Cyan
Write-Host "    # Proxy a Node.js (puerto 5502)" -ForegroundColor Cyan
Write-Host "    RewriteCond %{REQUEST_FILENAME} !-f" -ForegroundColor Cyan
Write-Host "    RewriteCond %{REQUEST_FILENAME} !-d" -ForegroundColor Cyan
Write-Host "    RewriteRule ^(.*)$ http://127.0.0.1:5502/$1 [P,L]" -ForegroundColor Cyan
Write-Host "</IfModule>" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan
Write-Host "<IfModule mod_proxy.c>" -ForegroundColor Cyan
Write-Host "    ProxyPreserveHost On" -ForegroundColor Cyan
Write-Host "    ProxyPass / http://127.0.0.1:5502/" -ForegroundColor Cyan
Write-Host "    ProxyPassReverse / http://127.0.0.1:5502/" -ForegroundColor Cyan
Write-Host "</IfModule>" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan
Write-Host "<IfModule mod_headers.c>" -ForegroundColor Cyan
Write-Host "    Header set X-Forwarded-Proto 'https'" -ForegroundColor Cyan
Write-Host "    Header set X-Real-IP '%{REMOTE_ADDR}e'" -ForegroundColor Cyan
Write-Host "</IfModule>" -ForegroundColor Cyan
Write-Host "EOF" -ForegroundColor Cyan
Write-Host ""
Write-Host "5️⃣ Verificar servidor PM2:" -ForegroundColor White
Write-Host "   pm2 status" -ForegroundColor Cyan
Write-Host "   pm2 restart yavoy" -ForegroundColor Cyan
Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

# Opción: Abrir sesión SSH automáticamente
Write-Host "💡 ¿Quieres abrir la conexión SSH ahora? (S/N): " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -eq "S" -or $response -eq "s") {
    Write-Host ""
    Write-Host "🔌 Abriendo SSH..." -ForegroundColor Green
    Write-Host "Password: $Password" -ForegroundColor Gray
    Write-Host ""
    
    Start-Process "ssh" -ArgumentList "-p $SSHPort $SSHHost" -NoNewWindow -Wait
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "📊 ALTERNATIVA: CONFIGURAR DESDE HPANEL" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""
Write-Host "Si .htaccess no funciona, configura desde el panel:" -ForegroundColor White
Write-Host ""
Write-Host "1. Ve a: https://hpanel.hostinger.com" -ForegroundColor Cyan
Write-Host "2. Selecciona tu VPS" -ForegroundColor Cyan
Write-Host "3. Busca: Advanced → Setup Node.js Application" -ForegroundColor Cyan
Write-Host "4. Configura:" -ForegroundColor Cyan
Write-Host "   - Application Root: /home/u695828542/yavoy-app" -ForegroundColor Gray
Write-Host "   - Startup File: server.js" -ForegroundColor Gray
Write-Host "   - Node Version: 18.x" -ForegroundColor Gray
Write-Host "   - Port: 5502" -ForegroundColor Gray
Write-Host "   - Domain: yavoy.space" -ForegroundColor Gray
Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""
Write-Host "🌐 Una vez configurado, accede a:" -ForegroundColor Green
Write-Host "   https://yavoy.space" -ForegroundColor Cyan
Write-Host ""
