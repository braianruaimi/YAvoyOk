# DEPLOY YAVOY A HOSTINGER
# Script simplificado

Write-Host "Preparando archivos para Hostinger..." -ForegroundColor Cyan

$source = $PSScriptRoot
$dest = Join-Path $env:USERPROFILE "Desktop\YAvoy_Deploy"

# Crear carpeta destino
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
New-Item -ItemType Directory -Path $dest | Out-Null

Write-Host "Copiando archivos HTML..." -ForegroundColor Yellow
Copy-Item "$source\*.html" $dest -Force

Write-Host "Copiando JavaScript..." -ForegroundColor Yellow
Copy-Item "$source\server*.js" $dest -Force
Copy-Item "$source\ecosystem.config.js" $dest -Force

Write-Host "Copiando carpetas..." -ForegroundColor Yellow
$folders = @("css", "js", "styles", "icons", "components", "middleware", "config", "utils", "data")
foreach ($folder in $folders) {
    $src = Join-Path $source $folder
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $dest $folder) -Recurse -Force
    }
}

Write-Host "Copiando configuración..." -ForegroundColor Yellow
Copy-Item "$source\package.json" $dest -Force
Copy-Item "$source\manifest.json" $dest -Force
Copy-Item "$source\*.sql" $dest -Force

Write-Host "Creando .env..." -ForegroundColor Yellow
@"
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DB_HOST=srv1722.hstgr.io
DB_USER=u695828542_yavoyspace
DB_PASSWORD=[CAMBIAR_AQUI]
DB_NAME=u695828542_yavoysql
DB_PORT=3306
JWT_SECRET=YAvoy_Enterprise_JWT_Secret_2026
SESSION_SECRET=YAvoy_Session_Secret_2026
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=univerzasite@gmail.com
EMAIL_PASS=Univerzasite25!
FRONTEND_URL=https://yavoy.space
API_URL=https://yavoy.space/api
"@ | Out-File -FilePath (Join-Path $dest ".env") -Encoding utf8

Write-Host "Creando README..." -ForegroundColor Yellow
@"
DEPLOY YAVOY A HOSTINGER
========================

1. Conectar por SFTP a Hostinger:
   Host: srv1722.hstgr.io
   Puerto: 22
   Usuario: [tu usuario]
   
2. Subir TODO a public_html/

3. Configurar Node.js en panel Hostinger:
   - Versión: 18.x
   - Archivo: server-simple.js
   - Dominio: yavoy.space

4. Editar .env con password de BD

5. En SSH ejecutar:
   cd public_html
   npm install --production
   npm start

6. Visitar: https://yavoy.space
"@ | Out-File -FilePath (Join-Path $dest "README.txt") -Encoding utf8

Write-Host ""
Write-Host "LISTO!" -ForegroundColor Green
Write-Host "Carpeta: $dest" -ForegroundColor Yellow
Write-Host ""

Start-Process explorer.exe $dest
