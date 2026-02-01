# ====================================
# DEPLOY YAVOY A HOSTINGER - SCRIPT SIMPLIFICADO
# ====================================

Write-Host "🚀 DEPLOY YAVOY A HOSTINGER - yavoy.space" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$projectPath = $PSScriptRoot
$deployFolder = Join-Path $env:USERPROFILE "Desktop\YAvoy_Deploy_Hostinger"
$zipFile = Join-Path $env:USERPROFILE "Desktop\YAvoy_Hostinger.zip"

Write-Host "📁 Proyecto: $projectPath" -ForegroundColor Yellow
Write-Host "📦 Deploy: $deployFolder" -ForegroundColor Yellow
Write-Host ""

# Paso 1: Crear carpeta de deploy
Write-Host "📁 Creando carpeta de deploy..." -ForegroundColor Green
if (Test-Path $deployFolder) {
    Remove-Item $deployFolder -Recurse -Force
}
New-Item -ItemType Directory -Path $deployFolder | Out-Null
Write-Host "   ✓ Carpeta creada" -ForegroundColor Gray

# Paso 2: Copiar archivos HTML
Write-Host "📄 Copiando archivos HTML..." -ForegroundColor Green
Get-ChildItem -Path $projectPath -Filter "*.html" | ForEach-Object {
    Copy-Item $_.FullName -Destination $deployFolder -Force
    Write-Host "   ✓ $($_.Name)" -ForegroundColor Gray
}

# Paso 3: Copiar archivos JS principales
Write-Host "📜 Copiando archivos JavaScript..." -ForegroundColor Green
$jsFiles = @("server.js", "server-simple.js", "server-enterprise.js", "ecosystem.config.js")
foreach ($file in $jsFiles) {
    $sourcePath = Join-Path $projectPath $file
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath -Destination $deployFolder -Force
        Write-Host "   ✓ $file" -ForegroundColor Gray
    }
}

# Paso 4: Copiar carpetas completas
Write-Host "📂 Copiando carpetas del proyecto..." -ForegroundColor Green
$folders = @("css", "js", "styles", "icons", "components", "middleware", "config", "utils", "data")
foreach ($folder in $folders) {
    $sourcePath = Join-Path $projectPath $folder
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $deployFolder $folder
        Copy-Item $sourcePath -Destination $destPath -Recurse -Force
        Write-Host "   ✓ $folder\" -ForegroundColor Gray
    }
}

# Paso 5: Copiar archivos de configuración
Write-Host "⚙️  Copiando archivos de configuración..." -ForegroundColor Green
$configFiles = @("package.json", "manifest.json", ".htaccess", "init-mysql-hostinger.sql", 
    "database-schema.sql", "migracion_v3.1.sql")
foreach ($file in $configFiles) {
    $sourcePath = Join-Path $projectPath $file
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath -Destination $deployFolder -Force
        Write-Host "   ✓ $file" -ForegroundColor Gray
    }
}

# Paso 6: Crear archivo .env para producción
Write-Host "🔧 Creando archivo .env para producción..." -ForegroundColor Green
$envLines = @(
    "# YAvoy v3.1 Enterprise - Producción Hostinger",
    "NODE_ENV=production",
    "PORT=3000",
    "HOST=0.0.0.0",
    "",
    "# Base de datos Hostinger",
    "DB_HOST=srv1722.hstgr.io",
    "DB_USER=u695828542_yavoyspace",
    "DB_PASSWORD=[TU_PASSWORD_BD]",
    "DB_NAME=u695828542_yavoysql",
    "DB_PORT=3306",
    "",
    "# Seguridad",
    "JWT_SECRET=YAvoy_Enterprise_JWT_Secret_2026_Production",
    "SESSION_SECRET=YAvoy_Session_Secret_Enterprise_2026",
    "",
    "# Email Hostinger",
    "EMAIL_HOST=smtp.hostinger.com",
    "EMAIL_PORT=587",
    "EMAIL_USER=univerzasite@gmail.com",
    "EMAIL_PASS=Univerzasite25!",
    "EMAIL_FROM=YAvoy",
    "",
    "# URLs",
    "FRONTEND_URL=https://yavoy.space",
    "API_URL=https://yavoy.space/api",
    "",
    "# Características",
    "ENABLE_PWA=true",
    "ENABLE_PUSH_NOTIFICATIONS=true",
    "ENABLE_ANALYTICS=true",
    "ENABLE_CEO_PANEL=true"
)
$envLines | Out-File -FilePath (Join-Path $deployFolder ".env") -Encoding utf8
Write-Host "   ✓ .env creado" -ForegroundColor Gray

# Paso 7: Crear package.json optimizado
Write-Host "📦 Creando package.json optimizado..." -ForegroundColor Green
$pkgLines = @(
    '{',
    '  "name": "yavoy-app",',
    '  "version": "3.1.0-enterprise",',
    '  "description": "YAvoy v3.1 Enterprise - Sistema de delivery profesional",',
    '  "main": "server-simple.js",',
    '  "scripts": {',
    '    "start": "node server-simple.js",',
    '    "prod": "NODE_ENV=production node server-simple.js",',
    '    "enterprise": "node server-enterprise.js"',
    '  },',
    '  "engines": {',
    '    "node": ">=18.0.0",',
    '    "npm": ">=8.0.0"',
    '  },',
    '  "dependencies": {',
    '    "bcryptjs": "^3.0.3",',
    '    "compression": "^1.8.1",',
    '    "cors": "^2.8.5",',
    '    "dotenv": "^17.2.3",',
    '    "express": "^5.1.0",',
    '    "helmet": "^8.1.0",',
    '    "mysql2": "^3.16.0",',
    '    "speakeasy": "^2.0.0",',
    '    "qrcode": "^1.5.3",',
    '    "nodemailer": "^6.9.15"',
    '  }',
    '}'
)
$pkgLines | Out-File -FilePath (Join-Path $deployFolder "package.json") -Encoding utf8
Write-Host "   ✓ package.json creado" -ForegroundColor Gray

# Paso 8: Crear archivo README de instrucciones
Write-Host "📝 Creando instrucciones de deploy..." -ForegroundColor Green
$readmeLines = @(
    "====================================",
    "YAVOY v3.1 Enterprise - Deploy Hostinger",
    "====================================",
    "",
    "PASOS PARA SUBIR A yavoy.space:",
    "",
    "1. Acceso a Hostinger",
    "   - Ve a: https://hpanel.hostinger.com",
    "   - Inicia sesión",
    "   - Selecciona hosting de yavoy.space",
    "",
    "2. Configurar Node.js",
    "   - Panel -> Avanzado -> Node.js",
    "   - Crear aplicación:",
    "     * Versión: Node.js 18.x",
    "     * Modo: Production",
    "     * Archivo inicio: server-simple.js",
    "     * Dominio: yavoy.space",
    "",
    "3. Subir archivos por SFTP",
    "   - Host: srv1722.hstgr.io",
    "   - Puerto: 22 (SFTP)",
    "   - Subir TODO a public_html/",
    "",
    "4. Configurar Base de Datos",
    "   - Importar: init-mysql-hostinger.sql",
    "   - Base de datos: u695828542_yavoysql",
    "",
    "5. Editar .env",
    "   - Cambiar [TU_PASSWORD_BD] por tu contraseña real",
    "",
    "6. Instalar dependencias",
    "   cd public_html",
    "   npm install --production",
    "",
    "7. Iniciar aplicación",
    "   npm start",
    "",
    "8. Verificar",
    "   - Visita: https://yavoy.space",
    "",
    "¡Listo para producción!"
)
$readmeLines | Out-File -FilePath (Join-Path $deployFolder "README_DEPLOY.txt") -Encoding utf8
Write-Host "   ✓ README_DEPLOY.txt creado" -ForegroundColor Gray

# Paso 9: Crear archivo .htaccess para Apache
Write-Host "🔧 Creando archivo .htaccess..." -ForegroundColor Green
$htaccessLines = @(
    "# YAvoy v3.1 Enterprise - Configuración Apache Hostinger",
    "",
    "# Forzar HTTPS",
    "RewriteEngine On",
    "RewriteCond %{HTTPS} off",
    "RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]",
    "",
    "# Configuración de seguridad",
    'Header set X-Frame-Options "SAMEORIGIN"',
    'Header set X-Content-Type-Options "nosniff"',
    'Header set X-XSS-Protection "1; mode=block"',
    'Header set Referrer-Policy "strict-origin-when-cross-origin"',
    "",
    "# Comprimir archivos",
    "<IfModule mod_deflate.c>",
    "    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json",
    "</IfModule>",
    "",
    "# Proteger archivos sensibles",
    '<FilesMatch "^\.env$">',
    "    Order allow,deny",
    "    Deny from all",
    "</FilesMatch>"
)
$htaccessLines | Out-File -FilePath (Join-Path $deployFolder ".htaccess") -Encoding utf8
Write-Host "   ✓ .htaccess creado" -ForegroundColor Gray

# Paso 10: Resumen final
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOY PREPARADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Ubicación: $deployFolder" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 SIGUIENTE PASO:" -ForegroundColor Cyan
Write-Host "   1. Abre la carpeta: $deployFolder" -ForegroundColor White
Write-Host "   2. Lee el archivo: README_DEPLOY.txt" -ForegroundColor White
Write-Host "   3. Sube los archivos a Hostinger por SFTP" -ForegroundColor White
Write-Host "   4. Configura Node.js app en el panel de Hostinger" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Dominio: https://yavoy.space" -ForegroundColor Green
Write-Host ""

# Abrir carpeta de deploy
Write-Host "🔍 Abriendo carpeta de deploy..." -ForegroundColor Yellow
Start-Process explorer.exe $deployFolder

Write-Host ""
Write-Host "✨ ¡Listo para subir a Hostinger! ✨" -ForegroundColor Green
Write-Host ""
