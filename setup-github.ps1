# ========================================
# SCRIPT DE CONFIGURACIÓN DE YAVOYOK
# ========================================
# Este script configura el repositorio de GitHub
# para YAvoy y lo prepara para deploy en Hostinger
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   🚀 YAvoyOk - Setup GitHub" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en un repositorio git
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: No estás en un repositorio git" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Estado actual del repositorio:" -ForegroundColor Green
git log --oneline -5
Write-Host ""

# Solicitar nombre de usuario de GitHub
Write-Host "📝 Ingresa tu nombre de usuario de GitHub:" -ForegroundColor Yellow
$githubUser = Read-Host "Usuario"

if ([string]::IsNullOrWhiteSpace($githubUser)) {
    Write-Host "❌ Error: Debes ingresar un nombre de usuario" -ForegroundColor Red
    exit 1
}

# Verificar si ya existe un remoto
$existingRemote = git remote | Select-String "origin"
if ($existingRemote) {
    Write-Host "⚠️  Ya existe un remoto 'origin'. ¿Deseas reemplazarlo? (S/N)" -ForegroundColor Yellow
    $replace = Read-Host
    if ($replace -eq "S" -or $replace -eq "s") {
        Write-Host "🗑️  Eliminando remoto anterior..." -ForegroundColor Cyan
        git remote remove origin
    }
    else {
        Write-Host "❌ Operación cancelada" -ForegroundColor Red
        exit 1
    }
}

# Construir URL del repositorio
$repoUrl = "https://github.com/$githubUser/YAvoyOk.git"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📦 Configurando repositorio remoto:" -ForegroundColor Green
Write-Host "   URL: $repoUrl" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Agregar remoto
Write-Host "🔗 Agregando remoto 'origin'..." -ForegroundColor Cyan
git remote add origin $repoUrl

# Verificar
$remotes = git remote -v
Write-Host "✅ Remoto configurado:" -ForegroundColor Green
Write-Host $remotes -ForegroundColor White
Write-Host ""

# Preguntar si desea hacer push
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 ¿Deseas hacer push ahora? (S/N)" -ForegroundColor Yellow
Write-Host "   ⚠️  Asegúrate de haber creado el repositorio en GitHub primero" -ForegroundColor Red
Write-Host "   📝 URL: https://github.com/new" -ForegroundColor White
Write-Host "   📝 Nombre: YAvoyOk" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
$doPush = Read-Host

if ($doPush -eq "S" -or $doPush -eq "s") {
    Write-Host ""
    Write-Host "📤 Haciendo push a GitHub..." -ForegroundColor Cyan
    Write-Host "   Esto puede tardar unos minutos..." -ForegroundColor Yellow
    Write-Host ""
    
    # Intentar push
    try {
        git push -u origin main --force
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "   ✅ ¡ÉXITO! Código subido a GitHub" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Tu repositorio está en:" -ForegroundColor Cyan
        Write-Host "   https://github.com/$githubUser/YAvoyOk" -ForegroundColor White
        Write-Host ""
        Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
        Write-Host "   1. Ve a GitHub y verifica que todo se subió correctamente" -ForegroundColor White
        Write-Host "   2. Descarga el ZIP o haz clone en Hostinger" -ForegroundColor White
        Write-Host "   3. Sube el contenido a public_html de yavoy.space" -ForegroundColor White
        Write-Host "   4. ¡Listo! Tu sitio estará en https://yavoy.space" -ForegroundColor White
        Write-Host ""
    }
    catch {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "   ❌ Error al hacer push" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Posibles causas:" -ForegroundColor Yellow
        Write-Host "   1. El repositorio no existe en GitHub" -ForegroundColor White
        Write-Host "   2. No tienes permisos para subir al repositorio" -ForegroundColor White
        Write-Host "   3. Credenciales incorrectas" -ForegroundColor White
        Write-Host ""
        Write-Host "Solución:" -ForegroundColor Yellow
        Write-Host "   1. Crea el repositorio en: https://github.com/new" -ForegroundColor White
        Write-Host "   2. Nombre: YAvoyOk" -ForegroundColor White
        Write-Host "   3. NO marques ninguna opción (README, .gitignore, license)" -ForegroundColor White
        Write-Host "   4. Ejecuta este script de nuevo" -ForegroundColor White
        Write-Host ""
        exit 1
    }
}
else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "   ⏸️  Push cancelado" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para hacer push manualmente más tarde:" -ForegroundColor Cyan
    Write-Host "   git push -u origin main --force" -ForegroundColor White
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   📚 Documentación completa en:" -ForegroundColor Green
Write-Host "   SETUP_GITHUB_YAVOYOK.md" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
