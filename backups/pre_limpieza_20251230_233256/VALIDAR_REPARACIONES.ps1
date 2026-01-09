#!/usr/bin/env pwsh
# ============================================
# SCRIPT DE VALIDACIÓN POST-REPARACIÓN
# ============================================

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  YAvoy v3.1 - VALIDACIÓN POST-REPARACIÓN CRÍTICA         ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$errores = 0
$warnings = 0

# 1. VALIDAR PACKAGE.JSON
Write-Host "🔍 1. Validando package.json..." -ForegroundColor Yellow
try {
    $packageContent = Get-Content -Path "package.json" -Raw
    $package = $packageContent | ConvertFrom-Json
    Write-Host "   ✅ package.json es válido" -ForegroundColor Green
    Write-Host "   📦 Versión: $($package.version)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ ERROR: package.json tiene sintaxis inválida" -ForegroundColor Red
    Write-Host "   Detalle: $($_.Exception.Message)" -ForegroundColor Red
    $errores++
}

# 2. VALIDAR DATABASE SCHEMA
Write-Host ""
Write-Host "🔍 2. Validando database-schema.sql..." -ForegroundColor Yellow
$schemaContent = Get-Content -Path "database-schema.sql" -Raw

if ($schemaContent -match "CREATE TABLE products") {
    Write-Host "   ✅ Tabla products encontrada" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERROR: Tabla products faltante" -ForegroundColor Red
    $errores++
}

if ($schemaContent -match "CREATE TABLE referral_codes") {
    Write-Host "   ✅ Tabla referral_codes encontrada" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERROR: Tabla referral_codes faltante" -ForegroundColor Red
    $errores++
}

if ($schemaContent -match "CREATE TABLE referrals") {
    Write-Host "   ✅ Tabla referrals encontrada" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERROR: Tabla referrals faltante" -ForegroundColor Red
    $errores++
}

if ($schemaContent -match "CREATE TABLE rewards") {
    Write-Host "   ✅ Tabla rewards encontrada" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERROR: Tabla rewards faltante" -ForegroundColor Red
    $errores++
}

if ($schemaContent -match "CREATE TABLE tips") {
    Write-Host "   ✅ Tabla tips encontrada" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERROR: Tabla tips faltante" -ForegroundColor Red
    $errores++
}

if ($schemaContent -match "ciudad VARCHAR\(100\) NOT NULL DEFAULT") {
    Write-Host "   ✅ Columna ciudad agregada a users" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  WARNING: Columna ciudad no encontrada en users" -ForegroundColor Yellow
    $warnings++
}

# 3. VALIDAR SERVER-ENTERPRISE.JS
Write-Host ""
Write-Host "🔍 3. Validando server-enterprise.js..." -ForegroundColor Yellow
$serverContent = Get-Content -Path "server-enterprise.js" -Raw

if ($serverContent -match "const jwt = require\('jsonwebtoken'\)") {
    Write-Host "   ✅ JWT importado correctamente" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERROR: JWT no importado" -ForegroundColor Red
    $errores++
}

if ($serverContent -match "const verificarToken") {
    Write-Host "   ✅ Middleware verificarToken implementado" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERROR: Middleware JWT faltante" -ForegroundColor Red
    $errores++
}

$endpoints = @(
    "/api/repartidores",
    "/api/repartidores/:id/disponibilidad",
    "/api/repartidores/:id/aprobar-verificacion",
    "/api/pedidos/:id/asignar",
    "/api/pedidos/:id/estado",
    "/api/soporte/tickets",
    "/api/recompensas"
)

foreach ($endpoint in $endpoints) {
    $pattern = $endpoint -replace ":", "\\:"
    if ($serverContent -match $pattern) {
        Write-Host "   ✅ Endpoint $endpoint implementado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ ERROR: Endpoint $endpoint faltante" -ForegroundColor Red
        $errores++
    }
}

# 4. VALIDAR WEBSOCKETS
Write-Host ""
Write-Host "🔍 4. Validando WebSockets en frontend..." -ForegroundColor Yellow

$chatContent = Get-Content -Path "chat.html" -Raw
if ($chatContent -match "ciudad:") {
    Write-Host "   ✅ chat.html envía parámetro ciudad" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERROR: chat.html no envía ciudad" -ForegroundColor Red
    $errores++
}

$panelContent = Get-Content -Path "panel-repartidor-pro.html" -Raw
if ($panelContent -match "repartidorActual") {
    Write-Host "   ✅ panel-repartidor-pro.html obtiene ID real" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERROR: panel-repartidor-pro.html usa ID hardcoded" -ForegroundColor Red
    $errores++
}

# 5. VALIDAR JOI SCHEMAS
Write-Host ""
Write-Host "🔍 5. Validando schemas.js..." -ForegroundColor Yellow
$schemasContent = Get-Content -Path "src\validation\schemas.js" -Raw
if ($schemasContent -match "telefono: /\^\[\+\]") {
    Write-Host "   ✅ Patrón de teléfono flexible implementado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  WARNING: Patrón de teléfono sigue estricto" -ForegroundColor Yellow
    $warnings++
}

# RESUMEN FINAL
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  RESUMEN DE VALIDACIÓN                                    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "❌ Errores Críticos: $errores" -ForegroundColor $(if ($errores -eq 0) { "Green" } else { "Red" })
Write-Host "⚠️  Warnings: $warnings" -ForegroundColor $(if ($warnings -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

if ($errores -eq 0) {
    Write-Host "✅ VALIDACIÓN EXITOSA - Sistema listo para iniciar" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Configurar .env con credenciales reales" -ForegroundColor Gray
    Write-Host "2. Ejecutar migraciones: npm run migrate:postgresql" -ForegroundColor Gray
    Write-Host "3. Iniciar servidor: npm start" -ForegroundColor Gray
    Write-Host "4. Verificar health: curl http://localhost:3000/api/health" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "❌ VALIDACIÓN FALLIDA - Revisar errores arriba" -ForegroundColor Red
    exit 1
}
