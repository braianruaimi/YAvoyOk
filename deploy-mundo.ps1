# Deploy YAvoy a Hostinger
Write-Host "Deploy YAvoy a Hostinger para Acceso Mundial" -ForegroundColor Cyan
Write-Host ""

Write-Host "Conectando a Hostinger..." -ForegroundColor Yellow
Write-Host "Una vez conectado, copia y pega estos comandos:" -ForegroundColor Green
Write-Host ""
Write-Host "cd ~/public_html"
Write-Host "rm -rf *"
Write-Host "git clone https://github.com/braianruaimi/YAvoyOk.git ."
Write-Host "npm install"
Write-Host ""
Write-Host "Crear archivo .env (copia todo el bloque):"
Write-Host "cat > .env << 'ENDOFENV'"
Write-Host "DB_HOST=localhost"
Write-Host "DB_PORT=3306"
Write-Host "DB_NAME=u695828542_yavoy_web"
Write-Host "DB_USER=u695828542_yavoyen5"
Write-Host "DB_PASSWORD=Yavoy26!"
Write-Host "NODE_ENV=production"
Write-Host "PORT=5502"
Write-Host "JWT_SECRET=YAvoy_Enterprise_JWT_Secret_2024_Ultra_Secure_MySQL"
Write-Host "SESSION_SECRET=YAvoy_Session_Secret_2024_MySQL_Enterprise"
Write-Host "ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space"
Write-Host "SMTP_HOST=smtp.hostinger.com"
Write-Host "SMTP_PORT=587"
Write-Host "SMTP_USER=yavoyen5@yavoy.space"
Write-Host "SMTP_PASS=BrainCesar26!"
Write-Host "ENDOFENV"
Write-Host ""
Write-Host "Iniciar PM2:"
Write-Host "npm install -g pm2"
Write-Host "pm2 delete yavoy"
Write-Host "pm2 start server.js --name yavoy"
Write-Host "pm2 save"
Write-Host "pm2 startup"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tu app estará disponible en:" -ForegroundColor Green
Write-Host "https://yavoy.space" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Enter para conectar..."
$null = Read-Host

ssh -p 65002 u695828542@147.79.84.219
BrainCesar26!
