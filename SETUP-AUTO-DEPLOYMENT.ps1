# ============================================
# CONFIGURAR AUTO-DEPLOYMENT CON GITHUB ACTIONS
# ============================================

param(
    [string]$HostingerIP = "147.79.84.219",
    [string]$HostingerPort = "65002",
    [string]$HostingerUser = "u695828542",
    [string]$DeployPath = "/home/u695828542/public_html",
    [string]$AppURL = "https://yavoy.space"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   SETUP AUTO-DEPLOYMENT - YAVOY v3.1" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Este script configurará deployment automático en cada push a GitHub" -ForegroundColor White
Write-Host ""

# PASO 1: Verificar si GitHub está configurado
Write-Host "[1/5] Verificando configuración de GitHub..." -ForegroundColor Yellow

$gitRemote = git remote -v 2>&1
if ($gitRemote -match "github.com.*YAvoyOk") {
    Write-Host "✅ Repositorio GitHub configurado" -ForegroundColor Green
}else {
    Write-Host "❌ Error: No se detectó repositorio GitHub configurado" -ForegroundColor Red
    Write-Host "   Ejecuta: git remote add origin https://github.com/braianruaimi/YAvoyOk.git" -ForegroundColor Yellow
    exit 1
}

# PASO 2: Generar clave SSH para GitHub Actions
Write-Host ""
Write-Host "[2/5] Generando clave SSH para GitHub Actions..." -ForegroundColor Yellow

$sshKeyPath = "$env:USERPROFILE\.ssh\yavoy_github_actions"

if (Test-Path $sshKeyPath) {
    Write-Host "⚠️  Ya existe una clave SSH" -ForegroundColor Yellow
    $overwrite = Read-Host "¿Generar nueva clave? [s/n]"
    if ($overwrite -ne "s") {
        Write-Host "Usando clave existente" -ForegroundColor Gray
    } else {
        ssh-keygen -t rsa -b 4096 -f $sshKeyPath -N '""' -C "github-actions-yavoy" -q
    }
} else {
    ssh-keygen -t rsa -b 4096 -f $sshKeyPath -N '""' -C "github-actions-yavoy" -q
    Write-Host "✅ Clave SSH generada" -ForegroundColor Green
}

# Leer clave privada
$privateKey = Get-Content "$sshKeyPath" -Raw
$publicKey = Get-Content "$sshKeyPath.pub" -Raw

Write-Host "✅ Claves SSH listas" -ForegroundColor Green

# PASO 3: Copiar clave pública al servidor
Write-Host ""
Write-Host "[3/5] Configurando acceso SSH en Hostinger..." -ForegroundColor Yellow

# Mostrar instrucciones para agregar la clave pública
Write-Host ""
Write-Host "IMPORTANTE: Debes agregar esta clave pública a Hostinger" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host $publicKey -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pasos:" -ForegroundColor White
Write-Host "1. Copia la clave pública de arriba" -ForegroundColor Gray
Write-Host "2. Conéctate por SSH: ssh -p $HostingerPort $HostingerUser@$HostingerIP" -ForegroundColor Gray
Write-Host "3. Ejecuta: mkdir -p ~/.ssh && echo 'PEGA_LA_CLAVE_AQUI' >> ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host "4. Ejecuta: chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host ""

# Copiar clave pública al clipboard si es posible
try {
    $publicKey | Set-Clipboard
    Write-Host "✅ Clave pública copiada al portapapeles" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Copia manual necesaria" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Presiona ENTER cuando hayas agregado la clave a Hostinger..." -ForegroundColor Cyan
Read-Host

# PASO 4: Configurar GitHub Secrets
Write-Host ""
Write-Host "[4/5] Configurando GitHub Secrets..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Debes agregar estos Secrets en GitHub:" -ForegroundColor White
Write-Host "  https://github.com/braianruaimi/YAvoyOk/settings/secrets/actions" -ForegroundColor Cyan
Write-Host ""

# Crear archivo temporal con todos los secrets
$secretsFile = "github-secrets-TEMP.txt"

$secretsContent = @"
============================================
GITHUB SECRETS PARA YAVOY AUTO-DEPLOYMENT
============================================

Ve a: https://github.com/braianruaimi/YAvoyOk/settings/secrets/actions
Click en "New repository secret" y agrega cada uno:

1. HOSTINGER_SSH_KEY
   Value:
$privateKey

2. HOSTINGER_HOST
   Value: $HostingerIP

3. HOSTINGER_PORT
   Value: $HostingerPort

4. HOSTINGER_USER
   Value: $HostingerUser

5. HOSTINGER_DEPLOY_PATH
   Value: $DeployPath

6. APP_URL
   Value: $AppURL

============================================
IMPORTANTE: 
- Borra este archivo después de configurar los secrets
- Nunca  commitees este archivo a GitHub
============================================
"@

$secretsContent | Out-File -FilePath $secretsFile -Encoding UTF8

Write-Host "✅ Secrets guardados en: $secretsFile" -ForegroundColor Green
Write-Host ""
Write-Host "Pasos:" -ForegroundColor White
Write-Host "1. Abre: $secretsFile" -ForegroundColor Gray
Write-Host "2. Ve a: https://github.com/braianruaimi/YAvoyOk/settings/secrets/actions" -ForegroundColor Gray
Write-Host "3. Agrega cada secret (6 en total)" -ForegroundColor Gray
Write-Host "4. BORRA el archivo $secretsFile cuando termines" -ForegroundColor Yellow
Write-Host ""

# Abrir archivo automáticamente
try {
    Start-Process notepad.exe -ArgumentList $secretsFile
} catch {
    Write-Host "Abre manualmente: $secretsFile" -ForegroundColor Yellow
}

Write-Host "Presiona ENTER cuando hayas configurado todos los secrets..." -ForegroundColor Cyan
Read-Host

# PASO 5: Verificar workflow
Write-Host ""
Write-Host "[5/5] Verificando workflow de GitHub Actions..." -ForegroundColor Yellow

$workflowFile = ".github/workflows/auto-deploy.yml"

if (Test-Path $workflowFile) {
    Write-Host "✅ Workflow encontrado: $workflowFile" -ForegroundColor Green
} else {
    Write-Host "❌ Workflow no encontrado" -ForegroundColor Red
    Write-Host "   Asegúrate de que exista: $workflowFile" -ForegroundColor Yellow
    exit 1
}

# Commit y push del workflow si aún no está
$gitStatus = git status --porcelain .github/
if ($gitStatus -match "auto-deploy.yml") {
    Write-Host ""
    Write-Host "Haciendo commit del workflow..." -ForegroundColor Yellow
    
    git add .github/workflows/auto-deploy.yml
    git commit -m "🤖 Setup: Auto-deployment con GitHub Actions

- Workflow configurado para deploy automático en cada push
- Incluye health checks y rollback automático
- Notificaciones de estado del deployment"
    
    Write-Host "✅ Workflow commiteado" -ForegroundColor Green
}

# Resumen final
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   ✅ AUTO-DEPLOYMENT CONFIGURADO" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎉 ¡Listo! Ahora el sistema está automatizado:" -ForegroundColor Green
Write-Host ""
Write-Host "📋 CÓMO FUNCIONA:" -ForegroundColor Yellow
Write-Host "  1. Haces cambios en tu código local" -ForegroundColor White
Write-Host "  2. git add ." -ForegroundColor Gray
Write-Host "  3. git commit -m 'tu mensaje'" -ForegroundColor Gray
Write-Host "  4. git push" -ForegroundColor Gray
Write-Host "  5. 🤖 GitHub Actions automáticamente:" -ForegroundColor Cyan
Write-Host "     - Conecta a tu servidor Hostinger" -ForegroundColor Gray
Write-Host "     - Actualiza el código" -ForegroundColor Gray
Write-Host "     - Instala dependencias" -ForegroundColor Gray
Write-Host "     - Reinicia la aplicación" -ForegroundColor Gray
Write-Host "     - Verifica que funcione" -ForegroundColor Gray
Write-Host ""

Write-Host "📊 VER DEPLOYMENTS:" -ForegroundColor Yellow
Write-Host "  https://github.com/braianruaimi/YAvoyOk/actions" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  - Borra el archivo: $secretsFile" -ForegroundColor Red
Write-Host "  - Nunca compartas tu clave SSH privada" -ForegroundColor Red
Write-Host "  - Los secrets de GitHub están seguros" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 PRUEBA EL SISTEMA:" -ForegroundColor Yellow
Write-Host "  git push origin main" -ForegroundColor White
Write-Host "  Luego ve a: https://github.com/braianruaimi/YAvoyOk/actions" -ForegroundColor Cyan
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Preguntar si quiere hacer push ahora
Write-Host "¿Quieres hacer push ahora para probar el auto-deployment? [s/n]" -ForegroundColor Yellow
$doPush = Read-Host

if ($doPush -eq "s") {
    Write-Host ""
    Write-Host "Haciendo push..." -ForegroundColor Yellow
    git push origin main
    
    Write-Host ""
    Write-Host "✅ Push completado" -ForegroundColor Green
    Write-Host "Ve a GitHub Actions para ver el deployment en vivo:" -ForegroundColor Cyan
    Write-Host "https://github.com/braianruaimi/YAvoyOk/actions" -ForegroundColor White
    
    # Abrir GitHub Actions en navegador
    Start-Process "https://github.com/braianruaimi/YAvoyOk/actions"
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
