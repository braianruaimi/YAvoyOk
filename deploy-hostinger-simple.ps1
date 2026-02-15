# Deploy Rápido a Hostinger para YAvoy
Write-Host "🚀 YAvoy - Deploy a Hostinger para Acceso Mundial" -ForegroundColor Cyan
Write-Host ""

# Credenciales
$usuario = "u695828542"
$host = "147.79.84.219"
$puerto = "65002"

Write-Host "📦 Conectando a Hostinger..." -ForegroundColor Yellow
Write-Host "🌐 Una vez conectado, ejecuta estos comandos:" -ForegroundColor Green
Write-Host ""
Write-Host "cd ~/public_html" -ForegroundColor White
Write-Host "rm -rf * .[^.]*" -ForegroundColor White
Write-Host "git clone https://github.com/braianruaimi/YAvoyOk.git ." -ForegroundColor White
Write-Host "npm install" -ForegroundColor White
Write-Host ""
Write-Host "# Crear archivo .env:" -ForegroundColor Yellow
Write-Host 'cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u695828542_yavoy_web
DB_USER=u695828542_yavoyen5
DB_PASSWORD=Yavoy26!
NODE_ENV=production
PORT=5502
JWT_SECRET=YAvoy_Enterprise_JWT_Secret_2024_Ultra_Secure_MySQL
SESSION_SECRET=YAvoy_Session_Secret_2024_MySQL_Enterprise
ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=yavoyen5@yavoy.space
SMTP_PASS=BrainCesar26!
EOF' -ForegroundColor White
Write-Host ""
Write-Host "# Iniciar servidor con PM2:" -ForegroundColor Yellow
Write-Host "npm install -g pm2" -ForegroundColor White
Write-Host "pm2 delete yavoy" -ForegroundColor White
Write-Host "pm2 start server.js --name yavoy" -ForegroundColor White
Write-Host "pm2 save" -ForegroundColor White
Write-Host "pm2 startup" -ForegroundColor White
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Después de ejecutar los comandos, tu app estará en:" -ForegroundColor Green
Write-Host "https://yavoy.space" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Enter para conectar por SSH..." -ForegroundColor Yellow
Read-Host

# Conectar por SSH
$sshCommand = "u695828542@147.79.84.219"
ssh -p 65002 $sshCommand
