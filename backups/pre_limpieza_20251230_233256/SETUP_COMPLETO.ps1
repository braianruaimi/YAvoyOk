# ========================================
# SCRIPT DE INSTALACIÓN Y SETUP - YAvoy v3.1
# ========================================
# Ejecutar con: .\SETUP_COMPLETO.ps1

Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 YAvoy v3.1 Enterprise - Setup Completo         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

$errores = 0

# ============================================
# 1. VERIFICAR NODE.JS
# ============================================
Write-Host "1️⃣  Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "   ✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js no instalado" -ForegroundColor Red
    Write-Host "   📝 Descargar: https://nodejs.org/" -ForegroundColor Yellow
    $errores++
}

# ============================================
# 2. VERIFICAR PM2
# ============================================
Write-Host "`n2️⃣  Verificando PM2..." -ForegroundColor Yellow
try {
    $pm2Version = pm2 --version 2>$null
    Write-Host "   ✅ PM2: $pm2Version" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  PM2 no instalado globalmente" -ForegroundColor Yellow
    Write-Host "   📝 Instalando PM2..." -ForegroundColor Cyan
    npm install -g pm2
    Write-Host "   ✅ PM2 instalado" -ForegroundColor Green
}

# ============================================
# 3. VERIFICAR POSTGRESQL
# ============================================
Write-Host "`n3️⃣  Verificando PostgreSQL..." -ForegroundColor Yellow

# Buscar servicio PostgreSQL
$pgService = Get-Service -Name postgresql* -ErrorAction SilentlyContinue

if ($pgService) {
    Write-Host "   ✅ PostgreSQL encontrado: $($pgService.DisplayName)" -ForegroundColor Green
    
    if ($pgService.Status -eq "Running") {
        Write-Host "   ✅ PostgreSQL está corriendo" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  PostgreSQL detenido. Iniciando..." -ForegroundColor Yellow
        try {
            Start-Service -Name $pgService.Name
            Write-Host "   ✅ PostgreSQL iniciado" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ No se pudo iniciar PostgreSQL" -ForegroundColor Red
            Write-Host "   📝 Inicia manualmente: Services.msc → $($pgService.DisplayName)" -ForegroundColor Yellow
            $errores++
        }
    }
} else {
    Write-Host "   ❌ PostgreSQL NO INSTALADO" -ForegroundColor Red
    Write-Host "" -ForegroundColor Yellow
    Write-Host "   📥 INSTALACIÓN REQUERIDA:" -ForegroundColor Cyan
    Write-Host "   ─────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "   Opción 1: Instalador oficial (Recomendado)" -ForegroundColor White
    Write-Host "   https://www.postgresql.org/download/windows/" -ForegroundColor Blue
    Write-Host "   - Descargar PostgreSQL 16.x" -ForegroundColor Gray
    Write-Host "   - Ejecutar instalador" -ForegroundColor Gray
    Write-Host "   - Puerto: 5432" -ForegroundColor Gray
    Write-Host "   - Usuario: postgres" -ForegroundColor Gray
    Write-Host "   - Contraseña: (anotar para .env)" -ForegroundColor Gray
    Write-Host "" -ForegroundColor Yellow
    Write-Host "   Opción 2: Chocolatey" -ForegroundColor White
    Write-Host "   choco install postgresql16 -y" -ForegroundColor Blue
    Write-Host "   ─────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host ""
    $errores++
}

# Buscar psql en PATH
Write-Host "`n   🔍 Buscando psql..." -ForegroundColor Cyan
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if ($psqlPath) {
    Write-Host "   ✅ psql disponible: $($psqlPath.Source)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  psql no está en PATH" -ForegroundColor Yellow
    
    # Buscar en ubicaciones comunes
    $posiblesRutas = @(
        "C:\Program Files\PostgreSQL\16\bin",
        "C:\Program Files\PostgreSQL\15\bin",
        "C:\Program Files\PostgreSQL\14\bin",
        "C:\PostgreSQL\16\bin"
    )
    
    $rutaEncontrada = $null
    foreach ($ruta in $posiblesRutas) {
        if (Test-Path "$ruta\psql.exe") {
            $rutaEncontrada = $ruta
            Write-Host "   ✅ PostgreSQL encontrado en: $ruta" -ForegroundColor Green
            break
        }
    }
    
    if ($rutaEncontrada) {
        Write-Host "   📝 Agregando al PATH de esta sesión..." -ForegroundColor Cyan
        $env:Path += ";$rutaEncontrada"
        Write-Host "   ✅ psql ahora disponible" -ForegroundColor Green
    } else {
        Write-Host "   ❌ No se encontró psql.exe" -ForegroundColor Red
        Write-Host "   📝 Verifica la instalación de PostgreSQL" -ForegroundColor Yellow
        $errores++
    }
}

# ============================================
# 4. VERIFICAR DEPENDENCIAS NPM
# ============================================
Write-Host "`n4️⃣  Verificando dependencias npm..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules existe" -ForegroundColor Green
    
    $package = Get-Content "package.json" | ConvertFrom-Json
    $dependencias = $package.dependencies.PSObject.Properties | Measure-Object
    Write-Host "   📦 $($dependencias.Count) dependencias de producción" -ForegroundColor Cyan
} else {
    Write-Host "   ⚠️  node_modules no existe. Instalando..." -ForegroundColor Yellow
    npm install
    Write-Host "   ✅ Dependencias instaladas" -ForegroundColor Green
}

# Verificar dependencias críticas
$criticas = @("pg", "express", "socket.io", "jsonwebtoken", "joi", "dotenv", "winston")
Write-Host "`n   🔍 Verificando paquetes críticos:" -ForegroundColor Cyan

foreach ($dep in $criticas) {
    if (Test-Path "node_modules\$dep") {
        Write-Host "   ✅ $dep" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $dep FALTANTE" -ForegroundColor Red
        $errores++
    }
}

# ============================================
# 5. VERIFICAR ARCHIVO .ENV
# ============================================
Write-Host "`n5️⃣  Verificando configuración .env..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "   ✅ Archivo .env existe" -ForegroundColor Green
    
    # Verificar variables críticas
    $envContent = Get-Content ".env" -Raw
    $variablesCriticas = @("DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD", "JWT_SECRET", "PORT")
    
    foreach ($var in $variablesCriticas) {
        if ($envContent -match "$var=.+") {
            Write-Host "   ✅ $var configurado" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $var FALTANTE" -ForegroundColor Red
            $errores++
        }
    }
} else {
    Write-Host "   ❌ Archivo .env no existe" -ForegroundColor Red
    
    if (Test-Path ".env.example") {
        Write-Host "   📝 Creando .env desde .env.example..." -ForegroundColor Cyan
        Copy-Item ".env.example" ".env"
        Write-Host "   ✅ .env creado - EDITA LAS CREDENCIALES" -ForegroundColor Yellow
    }
    $errores++
}

# ============================================
# 6. RESUMEN FINAL
# ============================================
Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📊 RESUMEN DE VERIFICACIÓN                         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($errores -eq 0) {
    Write-Host "✅ TODAS LAS VERIFICACIONES PASARON" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 PRÓXIMOS PASOS:" -ForegroundColor Cyan
    Write-Host "   1. Crear base de datos:" -ForegroundColor White
    Write-Host "      psql -U postgres -c `"CREATE DATABASE yavoy_db;`"" -ForegroundColor Blue
    Write-Host ""
    Write-Host "   2. Ejecutar schema:" -ForegroundColor White
    Write-Host "      psql -U postgres -d yavoy_db -f database-schema.sql" -ForegroundColor Blue
    Write-Host ""
    Write-Host "   3. Verificar sistema:" -ForegroundColor White
    Write-Host "      npm run init:check" -ForegroundColor Blue
    Write-Host ""
    Write-Host "   4. Iniciar servidor:" -ForegroundColor White
    Write-Host "      npm start" -ForegroundColor Blue
    Write-Host ""
} else {
    Write-Host "❌ $errores ERROR(ES) ENCONTRADO(S)" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 SOLUCIONES:" -ForegroundColor Yellow
    Write-Host "   1. Instala PostgreSQL 16 si falta" -ForegroundColor White
    Write-Host "   2. Configura credenciales en .env" -ForegroundColor White
    Write-Host "   3. Ejecuta nuevamente: .\SETUP_COMPLETO.ps1" -ForegroundColor White
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
