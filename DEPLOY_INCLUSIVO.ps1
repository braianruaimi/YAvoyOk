# YAvoy Deploy Script - Sistema Inclusivo Completo
Write-Host "🌟 Deployando YAvoy con Sistema de Inclusión Digital..." -ForegroundColor Cyan

# Rutas dinámicas basadas en el usuario actual
$currentUser = $env:USERNAME
$currentPath = Get-Location
$projectPath = $currentPath.Path
$deployPath = Join-Path $env:USERPROFILE "Desktop\YAvoy_Inclusivo_Deploy"
$zipPath = Join-Path $env:USERPROFILE "Desktop\YAvoy_Inclusivo_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"

Write-Host "📁 Proyecto: $projectPath" -ForegroundColor Yellow
Write-Host "📦 Deploy: $deployPath" -ForegroundColor Yellow

# Limpiar y crear carpeta de deploy
if (Test-Path $deployPath) { 
    Remove-Item $deployPath -Recurse -Force 
    Write-Host "🧹 Limpiando deploy anterior..." -ForegroundColor Gray
}
New-Item -ItemType Directory -Path $deployPath | Out-Null

# ===============================================
# ARCHIVOS PRINCIPALES DE ACCESIBILIDAD
# ===============================================

Write-Host "`n🔧 Copiando Sistema de Inclusión Digital..." -ForegroundColor Green

# Archivos HTML principales
$htmlFiles = @(
    "index.html",           # Sistema principal con accesibilidad integrada
    "accesibilidad.html",   # Página de accesibilidad completa (ex-demo)
    "*.html"               # Resto de páginas
)

foreach ($file in $htmlFiles) {
    if (Test-Path $file -PathType Leaf) {
        Copy-Item $file -Destination $deployPath -Force
        Write-Host "  ✅ $file" -ForegroundColor Green
    } elseif ($file -eq "*.html") {
        Get-ChildItem "*.html" | ForEach-Object {
            Copy-Item $_.FullName -Destination $deployPath -Force
            Write-Host "  ✅ $($_.Name)" -ForegroundColor Green
        }
    }
}

# Manifests PWA para accesibilidad
$manifestFiles = @(
    "manifest.json",
    "manifest-accesibilidad.json",
    "manifest-demo.json"
)

foreach ($manifest in $manifestFiles) {
    if (Test-Path $manifest) {
        Copy-Item $manifest -Destination $deployPath -Force
        Write-Host "  ✅ $manifest (PWA)" -ForegroundColor Cyan
    }
}

# Service Workers
$swFiles = @("sw-demo.js", "sw.js", "service-worker.js")
foreach ($sw in $swFiles) {
    if (Test-Path $sw) {
        Copy-Item $sw -Destination $deployPath -Force
        Write-Host "  ✅ $sw (Service Worker)" -ForegroundColor Cyan
    }
}

# ===============================================
# SISTEMA JAVASCRIPT E IA
# ===============================================

Write-Host "`n🤖 Copiando Sistema IA y Scripts..." -ForegroundColor Blue

# Archivos JavaScript raíz
Get-ChildItem "*.js" -File | Where-Object { 
    $_.Name -notmatch "vscode|test|spec" -and 
    $_.Name -notmatch "\.min\.js$"
} | ForEach-Object {
    Copy-Item $_.FullName -Destination $deployPath -Force
    Write-Host "  ✅ $($_.Name)" -ForegroundColor Blue
}

# Carpetas de JavaScript y componentes
$jsFolders = @(
    "js",           # Scripts principales incluyen yavoy-ai-advanced.js, yavoy-ai-integration.js
    "components",   # Componentes de chatbot
    "styles",       # Estilos complementarios
    "css"           # Estilos principales
)

foreach ($folder in $jsFolders) {
    if (Test-Path $folder -PathType Container) {
        Copy-Item $folder -Destination $deployPath -Recurse -Force
        $fileCount = (Get-ChildItem $folder -Recurse -File).Count
        Write-Host "  ✅ $folder ($fileCount archivos)" -ForegroundColor Blue
    }
}

# ===============================================
# ARCHIVOS DE CONFIGURACIÓN
# ===============================================

Write-Host "`n⚙️ Copiando configuración..." -ForegroundColor Yellow

$configFiles = @(
    ".htaccess",
    "package.json",
    "init-mysql-hostinger.sql",
    "ecosystem.config.js",
    "jsconfig.json"
)

foreach ($config in $configFiles) {
    if (Test-Path $config) {
        Copy-Item $config -Destination $deployPath -Force
        Write-Host "  ✅ $config" -ForegroundColor Yellow
    }
}

# ===============================================
# CARPETAS ADICIONALES
# ===============================================

$additionalFolders = @(
    "middleware",
    "src", 
    "config",
    "utils",
    "icons",
    "images"
)

Write-Host "`n📁 Copiando carpetas adicionales..." -ForegroundColor Magenta
foreach ($folder in $additionalFolders) {
    if (Test-Path $folder -PathType Container) {
        Copy-Item $folder -Destination $deployPath -Recurse -Force
        Write-Host "  ✅ $folder" -ForegroundColor Magenta
    }
}

# ===============================================
# CONFIGURACIÓN PRODUCCIÓN
# ===============================================

Write-Host "`n🔐 Creando configuración de producción..." -ForegroundColor Red

# Crear archivo .env para producción
$envContent = @"
NODE_ENV=production
PORT=5502

# Base de datos Hostinger
DB_HOST=srv1722.hstgr.io
DB_PORT=3306
DB_USER=u695828542_yavoyspace
DB_PASSWORD=Yavoy25!
DB_NAME=u695828542_yavoysql

# Seguridad
JWT_SECRET=YAvoy_Enterprise_Production_$(Get-Random -Minimum 10000 -Maximum 99999)
SESSION_SECRET=YAvoy_Session_Production_$(Get-Random -Minimum 10000 -Maximum 99999)

# CORS
ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space

# Accesibilidad y PWA
PWA_ENABLED=true
ACCESSIBILITY_MODE=true
AI_CHATBOT_ENABLED=true
DEVICE_DETECTION_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FILE=yavoy_production.log
"@

Set-Content -Path "$deployPath\.env" -Value $envContent -Encoding UTF8
Write-Host "  ✅ .env (configuración producción)" -ForegroundColor Red

# ===============================================
# COMPRIMIR PARA DEPLOY
# ===============================================

Write-Host "`n📦 Creando archivo ZIP para deploy..." -ForegroundColor Cyan

# Comprimir todo
Compress-Archive -Path "$deployPath\*" -DestinationPath $zipPath -Force

# Estadísticas
$totalFiles = (Get-ChildItem $deployPath -Recurse -File).Count
$zipSize = (Get-Item $zipPath).Length / 1MB
$deploySize = (Get-ChildItem $deployPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

# ===============================================
# REPORTE FINAL
# ===============================================

Write-Host "`n" -NoNewline
Write-Host "🎉 DEPLOY COMPLETADO - SISTEMA INCLUSIVO YAVOY" -ForegroundColor Green -BackgroundColor Black
Write-Host "`n" -NoNewline

Write-Host "📊 ESTADÍSTICAS:" -ForegroundColor White
Write-Host "   📁 Archivos totales: $totalFiles" -ForegroundColor Gray
Write-Host "   💾 Tamaño deploy: $([math]::Round($deploySize, 2)) MB" -ForegroundColor Gray  
Write-Host "   📦 Tamaño ZIP: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Gray

Write-Host "`n🌟 CARACTERÍSTICAS INCLUIDAS:" -ForegroundColor White
Write-Host "   ♿ Sistema de accesibilidad completo" -ForegroundColor Green
Write-Host "   📱 PWA con detección de dispositivos" -ForegroundColor Green  
Write-Host "   🤖 IA chatbot empático integrado" -ForegroundColor Green
Write-Host "   🎯 Inclusión digital WCAG 2.1" -ForegroundColor Green
Write-Host "   🔊 Síntesis de voz y navegación" -ForegroundColor Green
Write-Host "   📳 Soporte vibración móvil" -ForegroundColor Green

Write-Host "`n📁 ARCHIVOS GENERADOS:" -ForegroundColor White
Write-Host "   📂 Deploy: $deployPath" -ForegroundColor Cyan
Write-Host "   📦 ZIP: $zipPath" -ForegroundColor Cyan

Write-Host "`n🚀 PRÓXIMOS PASOS:" -ForegroundColor White
Write-Host "   1. Subir ZIP a Hostinger via File Manager" -ForegroundColor Yellow
Write-Host "   2. Extraer en public_html/" -ForegroundColor Yellow
Write-Host "   3. Verificar permisos .htaccess" -ForegroundColor Yellow
Write-Host "   4. Probar accesibilidad en yavoy.space/accesibilidad.html" -ForegroundColor Yellow
Write-Host "   5. Verificar PWA instalable" -ForegroundColor Yellow

Write-Host "`n✨ El sistema YAvoy ahora es completamente inclusivo ✨" -ForegroundColor Green

# Abrir explorador con los archivos
if (Test-Path $deployPath) {
    Start-Process explorer.exe $deployPath
}