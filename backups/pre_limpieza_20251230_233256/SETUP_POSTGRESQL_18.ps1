# ========================================
# SETUP POSTGRESQL 18 - YAvoy v3.1
# ========================================
# Ejecutar DESPUÉS de instalar PostgreSQL 18

Write-Host "`n🚀 Configurando PostgreSQL 18 para YAvoy..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. VERIFICAR SERVICIO POSTGRESQL 18
# ============================================
Write-Host "1️⃣  Verificando servicio PostgreSQL 18..." -ForegroundColor Yellow

$pgService = Get-Service -Name postgresql* -ErrorAction SilentlyContinue

if ($pgService) {
    Write-Host "   ✅ Servicio encontrado: $($pgService.DisplayName)" -ForegroundColor Green
    Write-Host "   Estado: $($pgService.Status)" -ForegroundColor Cyan
    
    if ($pgService.Status -ne "Running") {
        Write-Host "   ⚙️  Iniciando PostgreSQL..." -ForegroundColor Yellow
        Start-Service -Name $pgService.Name
        Start-Sleep -Seconds 2
        Write-Host "   ✅ PostgreSQL iniciado" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Servicio no encontrado" -ForegroundColor Red
    Write-Host "   📝 Verifica que la instalación se completó correctamente" -ForegroundColor Yellow
    exit 1
}

# ============================================
# 2. AGREGAR POSTGRESQL AL PATH
# ============================================
Write-Host "`n2️⃣  Agregando PostgreSQL 18 al PATH..." -ForegroundColor Yellow

$pgPath = "C:\Program Files\PostgreSQL\18\bin"

if (Test-Path $pgPath) {
    Write-Host "   ✅ PostgreSQL encontrado en: $pgPath" -ForegroundColor Green
    
    # Agregar al PATH de esta sesión
    $env:Path += ";$pgPath"
    Write-Host "   ✅ PATH actualizado para esta sesión" -ForegroundColor Green
    
    # Verificar psql
    try {
        $psqlVersion = psql --version
        Write-Host "   ✅ $psqlVersion" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  psql no accesible aún" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ No se encontró PostgreSQL en $pgPath" -ForegroundColor Red
    Write-Host "   📝 Verifica la ruta de instalación" -ForegroundColor Yellow
    exit 1
}

# ============================================
# 3. CREAR BASE DE DATOS
# ============================================
Write-Host "`n3️⃣  Creando base de datos 'yavoy_db'..." -ForegroundColor Yellow
Write-Host "   (Se te pedirá la contraseña de postgres)" -ForegroundColor Gray
Write-Host ""

try {
    & psql -U postgres -c "CREATE DATABASE yavoy_db WITH ENCODING 'UTF8';"
    Write-Host "   ✅ Base de datos 'yavoy_db' creada" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Error creando la base de datos" -ForegroundColor Yellow
    Write-Host "   Posibles causas:" -ForegroundColor Gray
    Write-Host "   - La base de datos ya existe (no es un error)" -ForegroundColor Gray
    Write-Host "   - Contraseña incorrecta" -ForegroundColor Gray
    Write-Host "   - Servicio PostgreSQL no está corriendo" -ForegroundColor Gray
}

# ============================================
# 4. VERIFICAR BASE DE DATOS
# ============================================
Write-Host "`n4️⃣  Verificando base de datos..." -ForegroundColor Yellow

try {
    $dbList = & psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datname = 'yavoy_db';"
    
    if ($dbList -match "yavoy_db") {
        Write-Host "   ✅ Base de datos 'yavoy_db' confirmada" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Base de datos 'yavoy_db' no encontrada" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ⚠️  No se pudo verificar la base de datos" -ForegroundColor Yellow
}

# ============================================
# 5. EJECUTAR SCHEMA SQL
# ============================================
Write-Host "`n5️⃣  Ejecutando schema SQL (14 tablas)..." -ForegroundColor Yellow

if (Test-Path "database-schema.sql") {
    Write-Host "   📄 Archivo encontrado: database-schema.sql" -ForegroundColor Cyan
    Write-Host "   ⏳ Ejecutando (esto puede tomar 10-15 segundos)..." -ForegroundColor Gray
    Write-Host ""
    
    try {
        & psql -U postgres -d yavoy_db -f "database-schema.sql"
        Write-Host ""
        Write-Host "   ✅ Schema ejecutado exitosamente" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Error ejecutando el schema" -ForegroundColor Red
        Write-Host "   📝 Ejecuta manualmente: psql -U postgres -d yavoy_db -f database-schema.sql" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "   ❌ Archivo database-schema.sql no encontrado" -ForegroundColor Red
    exit 1
}

# ============================================
# 6. VERIFICAR TABLAS CREADAS
# ============================================
Write-Host "`n6️⃣  Verificando tablas creadas..." -ForegroundColor Yellow

try {
    Write-Host ""
    & psql -U postgres -d yavoy_db -c "\dt"
    Write-Host ""
    
    $tableCount = & psql -U postgres -d yavoy_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
    $count = [int]$tableCount.Trim()
    
    if ($count -eq 14) {
        Write-Host "   ✅ Las 14 tablas fueron creadas correctamente" -ForegroundColor Green
    } elseif ($count -gt 0) {
        Write-Host "   ⚠️  Se crearon $count tablas (se esperaban 14)" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ No se crearon tablas" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ⚠️  No se pudo verificar las tablas" -ForegroundColor Yellow
}

# ============================================
# 7. ACTUALIZAR .env CON CONTRASEÑA
# ============================================
Write-Host "`n7️⃣  Verificando archivo .env..." -ForegroundColor Yellow

if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "DB_PASSWORD=postgres") {
        Write-Host "   ⚠️  .env usa contraseña por defecto 'postgres'" -ForegroundColor Yellow
        Write-Host "   📝 Si tu contraseña es diferente, edítala:" -ForegroundColor Cyan
        Write-Host "      notepad .env" -ForegroundColor Blue
    } else {
        Write-Host "   ✅ Archivo .env configurado" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Archivo .env no encontrado" -ForegroundColor Red
}

# ============================================
# 8. EJECUTAR VERIFICACIÓN COMPLETA
# ============================================
Write-Host "`n8️⃣  Ejecutando verificación completa del sistema..." -ForegroundColor Yellow
Write-Host ""

try {
    npm run init:check
} catch {
    Write-Host "   ⚠️  Error ejecutando npm run init:check" -ForegroundColor Yellow
}

# ============================================
# RESUMEN FINAL
# ============================================
Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ POSTGRESQL 18 CONFIGURADO                      ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📝 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Si npm run init:check pasó todos los tests:" -ForegroundColor White
Write-Host "      npm start" -ForegroundColor Blue
Write-Host ""
Write-Host "   2. O con PM2:" -ForegroundColor White
Write-Host "      pm2 start ecosystem.config.js" -ForegroundColor Blue
Write-Host ""
Write-Host "   3. Verificar servidor:" -ForegroundColor White
Write-Host "      Abre http://localhost:3000 en tu navegador" -ForegroundColor Blue
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
