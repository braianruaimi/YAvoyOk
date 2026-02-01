# Deploy rápido a Hostinger
$password = "Yavoy25!"
$commands = @"
cd public_html
pwd
git pull origin main
pm2 restart all 2>&1 || echo 'PM2 no disponible, reiniciando manualmente...'
"@

# Usar plink o ssh con expect
Write-Host "🚀 Conectando a servidor Hostinger..." -ForegroundColor Cyan

# Intentar con plink (PuTTY) si está disponible
if (Get-Command plink -ErrorAction SilentlyContinue) {
    echo y | plink -ssh -P 65002 u695828542@147.79.84.219 -pw $password $commands
}
else {
    Write-Host "⚠️  Plink no encontrado. Instalando con WinGet..." -ForegroundColor Yellow
    winget install -e --id PuTTY.PuTTY --silent
    echo y | plink -ssh -P 65002 u695828542@147.79.84.219 -pw $password $commands
}

Write-Host "✅ Deploy completado!" -ForegroundColor Green
