# ========================================
# SETUP POSTGRESQL - YAvoy v3.1 Enterprise
# ========================================
# Ejecuta estos comandos para configurar la base de datos

Write-Host "🔧 Configuración de PostgreSQL para YAvoy" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar que PostgreSQL está corriendo
Write-Host "1️⃣  Verificando PostgreSQL..." -ForegroundColor Yellow
$pgStatus = Get-Service -Name postgresql* -ErrorAction SilentlyContinue
if ($pgStatus) {
    Write-Host "✅ PostgreSQL encontrado: $($pgStatus.DisplayName) - Estado: $($pgStatus.Status)" -ForegroundColor Green
    if ($pgStatus.Status -ne "Running") {
        Write-Host "⚠️  PostgreSQL no está corriendo. Iniciando..." -ForegroundColor Yellow
        Start-Service -Name $pgStatus.Name
        Write-Host "✅ PostgreSQL iniciado" -ForegroundColor Green
    }
} else {
    Write-Host "❌ PostgreSQL no encontrado como servicio de Windows" -ForegroundColor Red
    Write-Host "📝 Verifica la instalación o usa: pg_ctl -D 'C:\Program Files\PostgreSQL\16\data' status" -ForegroundColor Yellow
}

Write-Host ""

# 2. Crear base de datos
Write-Host "2️⃣  Creando base de datos 'yavoy_db'..." -ForegroundColor Yellow
Write-Host "   (Si ya existe, recibirás un error - es normal)" -ForegroundColor Gray

$createDB = @"
psql -U postgres -c "CREATE DATABASE yavoy_db WITH ENCODING 'UTF8' LC_COLLATE='Spanish_Argentina.1252' LC_CTYPE='Spanish_Argentina.1252' TEMPLATE=template0;"
"@

Invoke-Expression $createDB

Write-Host ""

# 3. Verificar que la base existe
Write-Host "3️⃣  Verificando base de datos..." -ForegroundColor Yellow
psql -U postgres -c "\l yavoy_db"

Write-Host ""

# 4. Ejecutar schema
Write-Host "4️⃣  Ejecutando schema SQL..." -ForegroundColor Yellow
if (Test-Path ".\database-schema.sql") {
    psql -U postgres -d yavoy_db -f ".\database-schema.sql"
    Write-Host "✅ Schema ejecutado" -ForegroundColor Green
} else {
    Write-Host "❌ No se encuentra database-schema.sql" -ForegroundColor Red
}

Write-Host ""

# 5. Verificar tablas
Write-Host "5️⃣  Verificando tablas creadas..." -ForegroundColor Yellow
psql -U postgres -d yavoy_db -c "\dt"

Write-Host ""
Write-Host "✅ Setup completado" -ForegroundColor Green
Write-Host "🚀 Ahora puedes ejecutar: npm run init:check" -ForegroundColor Cyan
Write-Host ""
