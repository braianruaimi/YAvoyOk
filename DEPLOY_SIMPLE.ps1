# YAvoy Deploy Script para Hostinger
Write-Host "Preparando deploy para yavoy.space..." -ForegroundColor Cyan

$projectPath = "C:\Users\estudiante\Downloads\YAvoy_DEFINITIVO\YAvoy_DEFINITIVO"
$deployPath = "C:\Users\estudiante\Desktop\YAvoy_Deploy"
$zipPath = "C:\Users\estudiante\Desktop\YAvoy_Space_Update.zip"

# Limpiar y crear carpeta
if (Test-Path $deployPath) { Remove-Item $deployPath -Recurse -Force }
New-Item -ItemType Directory -Path $deployPath | Out-Null

# Copiar archivos HTML
Write-Host "Copiando archivos..." -ForegroundColor Yellow
Copy-Item "$projectPath\*.html" -Destination $deployPath -Force

# Copiar archivos JS raíz
Get-ChildItem "$projectPath\*.js" -File | Where-Object { $_.Name -ne "vscode-master.js" } | ForEach-Object {
    Copy-Item $_.FullName -Destination $deployPath -Force
}

# Copiar archivos específicos
Copy-Item "$projectPath\manifest.json" -Destination $deployPath -Force
Copy-Item "$projectPath\.htaccess" -Destination $deployPath -Force
Copy-Item "$projectPath\init-mysql-hostinger.sql" -Destination $deployPath -Force
Copy-Item "$projectPath\package.json" -Destination $deployPath -Force

# Copiar carpetas
$folders = @("css", "js", "styles", "icons", "middleware", "src", "config", "utils", "components")
foreach ($folder in $folders) {
    $src = Join-Path $projectPath $folder
    if (Test-Path $src) {
        Copy-Item $src -Destination $deployPath -Recurse -Force
        Write-Host "  Copiado: $folder" -ForegroundColor Green
    }
}

# Crear archivo .env
$envContent = @"
NODE_ENV=production
PORT=5502
DB_HOST=srv1722.hstgr.io
DB_PORT=3306
DB_USER=u695828542_yavoyspace
DB_PASSWORD=Yavoy25!
DB_NAME=u695828542_yavoysql
JWT_SECRET=YAvoy_Enterprise_Production_2026
SESSION_SECRET=YAvoy_Session_Production_2026
ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space
"@
Set-Content -Path "$deployPath\.env" -Value $envContent -Encoding UTF8
Write-Host "  .env creado" -ForegroundColor Green

# Crear README
$readme = @"
YAvoy v3.1 Enterprise - Deploy Hostinger
=========================================

PASOS DE INSTALACION:

1. Subir este ZIP a Hostinger
   - Accede a hpanel.hostinger.com
   - Ve a Administrador de archivos
   - Sube el ZIP a public_html/
   - Extrae el archivo

2. Configurar Node.js en el panel
   - Seccion: Node.js
   - Archivo de inicio: server-simple.js
   - Version: 18.x o superior
   - Puerto: 5502

3. Instalar dependencias
   - Abre SSH Terminal
   - cd public_html
   - npm install

4. Importar base de datos
   - Ve a phpMyAdmin
   - Selecciona: u695828542_yavoysql
   - Importa: init-mysql-hostinger.sql

5. Iniciar aplicacion
   - pm2 start server-simple.js
   - pm2 save

ACCESO:
- Sitio: https://yavoy.space
- Panel CEO: https://yavoy.space/dashboard-ceo.html
- Usuario: Braian.R / Cesar.C
- Password: Braian2026! / Cesar2026!
"@
Set-Content -Path "$deployPath\README.txt" -Value $readme -Encoding UTF8

# Comprimir
Write-Host "Comprimiendo..." -ForegroundColor Yellow
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$deployPath\*" -DestinationPath $zipPath -CompressionLevel Optimal

$size = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host ""
Write-Host "LISTO! Archivo: $zipPath ($size MB)" -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Subir ZIP a Hostinger" -ForegroundColor White
Write-Host "2. Extraer en public_html/" -ForegroundColor White
Write-Host "3. Configurar Node.js" -ForegroundColor White
Write-Host "4. npm install" -ForegroundColor White
Write-Host "5. Importar BD" -ForegroundColor White
Write-Host "6. pm2 start server-simple.js" -ForegroundColor White
Write-Host ""

# Limpiar
Remove-Item $deployPath -Recurse -Force

# Abrir carpeta
Invoke-Item (Split-Path $zipPath)
