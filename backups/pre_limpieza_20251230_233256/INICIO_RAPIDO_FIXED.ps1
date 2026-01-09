#!/usr/bin/env pwsh
# ============================================
# INICIO RÁPIDO - YAvoy v3.1 Enterprise
# ============================================

param(
    [switch]$SkipValidation,
    [switch]$NoDB
)

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  YAvoy v3.1 Enterprise - INICIO RÁPIDO                   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. VALIDAR SINTAXIS
if (-not $SkipValidation) {
    Write-Host "🔍 1. Validando sintaxis de archivos críticos..." -ForegroundColor Yellow
    
    # Validar package.json
    try {
        $null = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
        Write-Host "   ✅ package.json válido" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ ERROR: package.json inválido" -ForegroundColor Red
        exit 1
    }
    
    # Validar server-enterprise.js
    $syntaxCheck = node -c server-enterprise.js 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ server-enterprise.js válido" -ForegroundColor Green
    } else {
        Write-Host "   ❌ ERROR: server-enterprise.js tiene errores de sintaxis" -ForegroundColor Red
        Write-Host "   $syntaxCheck" -ForegroundColor Red
        exit 1
    }
}

# 2. VERIFICAR .ENV
Write-Host ""
Write-Host "🔍 2. Verificando configuración .env..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "   ⚠️  WARNING: .env no encontrado" -ForegroundColor Yellow
    Write-Host "   Creando .env básico desde .env.example..." -ForegroundColor Gray
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "   ✅ .env creado - RECUERDA EDITAR LAS CREDENCIALES" -ForegroundColor Green
    } else {
        Write-Host "   ❌ ERROR: .env.example tampoco existe" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✅ .env encontrado" -ForegroundColor Green
    
    # Verificar variables críticas
    $envContent = Get-Content ".env" -Raw
    $criticalVars = @("DB_PASSWORD", "JWT_SECRET")
    
    foreach ($var in $criticalVars) {
        if ($envContent -match "$var=\w+") {
            Write-Host "   ✅ $var configurado" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  WARNING: $var no configurado o vacío" -ForegroundColor Yellow
        }
    }
}

# 3. VERIFICAR NODE_MODULES
Write-Host ""
Write-Host "🔍 3. Verificando dependencias..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "   ⚠️  node_modules no encontrado, instalando..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Dependencias instaladas" -ForegroundColor Green
    } else {
        Write-Host "   ❌ ERROR: npm install falló" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✅ node_modules encontrado" -ForegroundColor Green
}

# 4. VERIFICAR POSTGRESQL (OPCIONAL)
if (-not $NoDB) {
    Write-Host ""
    Write-Host "🔍 4. Verificando PostgreSQL..." -ForegroundColor Yellow
    
    $dbCheck = psql -U yavoy_user -d yavoy_production -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ PostgreSQL conectado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  WARNING: No se pudo conectar a PostgreSQL" -ForegroundColor Yellow
        Write-Host "   Asegúrate de que PostgreSQL esté corriendo y configurado" -ForegroundColor Gray
        Write-Host "   Puedes usar -NoDB para saltar esta verificación" -ForegroundColor Gray
    }
}

# 5. INICIAR SERVIDOR
Write-Host ""
Write-Host "🚀 5. Iniciando servidor..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Servidor iniciando en puerto 3000..." -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Gray
Write-Host ""

node server-enterprise.js
