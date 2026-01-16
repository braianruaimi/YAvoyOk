# ====================================
# SCRIPT DE DEPLOY PARA HOSTINGER
# Dominio: yavoy.sbs
# ====================================

Write-Host "🚀 Preparando YAvoy para deploy en Hostinger..." -ForegroundColor Cyan
Write-Host ""

# Directorio del proyecto
$projectPath = "C:\Users\estudiante\Downloads\YAvoy_DEFINITIVO\YAvoy_DEFINITIVO"
$deployPath = "C:\Users\estudiante\Desktop\YAvoy_Deploy_Hostinger"
$zipPath = "C:\Users\estudiante\Desktop\YAvoy_Hostinger_yavoy.sbs.zip"

# Crear carpeta temporal de deploy
Write-Host "📁 Creando carpeta temporal..." -ForegroundColor Yellow
if (Test-Path $deployPath) {
    Remove-Item $deployPath -Recurse -Force
}
New-Item -ItemType Directory -Path $deployPath | Out-Null

# Copiar archivos necesarios
Write-Host "📋 Copiando archivos..." -ForegroundColor Yellow

$filesToCopy = @(
    "*.html",
    "*.js",
    "*.json",
    ".htaccess",
    ".env.production",
    "init-mysql-hostinger.sql"
)

$folderstoCopy = @(
    "css",
    "js",
    "styles",
    "icons",
    "components",
    "middleware",
    "src",
    "config",
    "utils"
)

# Copiar archivos raíz
foreach ($pattern in $filesToCopy) {
    Get-ChildItem -Path $projectPath -Filter $pattern -File | ForEach-Object {
        Copy-Item $_.FullName -Destination $deployPath -Force
        Write-Host "  ✓ $($_.Name)" -ForegroundColor Green
    }
}

# Copiar carpetas
foreach ($folder in $folderstoCopy) {
    $sourcePath = Join-Path $projectPath $folder
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $deployPath $folder
        Copy-Item $sourcePath -Destination $destPath -Recurse -Force
        Write-Host "  ✓ Carpeta: $folder" -ForegroundColor Green
    }
}

# Renombrar .env.production a .env
Write-Host "🔧 Configurando archivos de producción..." -ForegroundColor Yellow
$envProdPath = Join-Path $deployPath ".env.production"
$envPath = Join-Path $deployPath ".env"
if (Test-Path $envProdPath) {
    Copy-Item $envProdPath -Destination $envPath -Force
    Write-Host "  ✓ .env creado para producción" -ForegroundColor Green
}

# Crear package.json optimizado para producción
$packageJson = @{
    name         = "yavoy-app"
    version      = "3.1.0-enterprise"
    description  = "YAvoy v3.1 Enterprise - Sistema de delivery"
    main         = "server-simple.js"
    scripts      = @{
        start = "node server-simple.js"
        prod  = "NODE_ENV=production node server-simple.js"
    }
    engines      = @{
        node = ">=18.0.0"
        npm  = ">=8.0.0"
    }
    dependencies = @{
        "bcryptjs"    = "^3.0.3"
        "compression" = "^1.8.1"
        "cors"        = "^2.8.5"
        "dotenv"      = "^17.2.3"
        "express"     = "^5.1.0"
        "helmet"      = "^8.1.0"
        "mysql2"      = "^3.16.0"
        "speakeasy"   = "^2.0.0"
    }
}

$packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path (Join-Path $deployPath "package.json")
Write-Host "  ✓ package.json optimizado" -ForegroundColor Green

# Crear README para Hostinger
$readmeContent = "YAvoy v3.1 Enterprise - Hostinger Deploy`n`n" +
"Instalacion en Hostinger`n`n" +
"1. Extrae este ZIP en public_html/`n" +
"2. Configura Node.js en el panel`n" +
"   - Archivo de inicio: server-simple.js`n" +
"   - Version Node.js: 18.x o superior`n" +
"3. Abre terminal SSH y ejecuta: npm install`n" +
"4. Importa la base de datos: init-mysql-hostinger.sql`n" +
"5. Accede a: https://yavoy.sbs`n`n" +
"Credenciales CEO`n" +
"- Usuario: Braian.R o Cesar.C`n" +
"- Contraseña: Braian2026! o Cesar2026!`n`n" +
"URLs Importantes`n" +
"- Panel CEO: https://yavoy.sbs/dashboard-ceo.html`n" +
"- API Test: https://yavoy.sbs/api/test`n" +
"- API Health: https://yavoy.sbs/api/health"

$readmeContent | Set-Content -Path (Join-Path $deployPath "README_HOSTINGER.txt")
Write-Host "  ✓ README creado" -ForegroundColor Green

# Comprimir todo
Write-Host ""
Write-Host "📦 Comprimiendo archivos..." -ForegroundColor Yellow
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path "$deployPath\*" -DestinationPath $zipPath -CompressionLevel Optimal

$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "  ✓ ZIP creado: $('{0:N2}' -f $zipSize) MB" -ForegroundColor Green

# Limpiar carpeta temporal
Write-Host ""
Write-Host "🧹 Limpiando..." -ForegroundColor Yellow
Remove-Item $deployPath -Recurse -Force

Write-Host ""
Write-Host "="*60 -ForegroundColor Green
Write-Host "✅ DEPLOY PREPARADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Green
Write-Host ""
Write-Host "📦 Archivo listo: $zipPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Ve a https://hpanel.hostinger.com" -ForegroundColor White
Write-Host "2. Sube el ZIP a public_html/" -ForegroundColor White
Write-Host "3. Extrae el ZIP" -ForegroundColor White
Write-Host "4. Configura Node.js (archivo: server-simple.js)" -ForegroundColor White
Write-Host "5. Instala dependencias: npm install" -ForegroundColor White
Write-Host "6. Importa la base de datos: init-mysql-hostinger.sql" -ForegroundColor White
Write-Host "7. Inicia la app: pm2 start server-simple.js" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Tu sitio estará en: https://yavoy.sbs" -ForegroundColor Cyan
Write-Host "🔐 Panel CEO: https://yavoy.sbs/dashboard-ceo.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Enter para abrir el archivo ZIP..." -ForegroundColor Yellow
Read-Host
Invoke-Item (Split-Path $zipPath)
