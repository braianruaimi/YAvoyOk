# ========================================
# SCRIPT DE ELIMINACIÓN QUIRÚRGICA v3.0_socio
# ========================================
# Este script verifica la integración y elimina la carpeta v3.0_socio
# Solo se ejecuta después de confirmación manual

param(
    [switch]$Verificar,
    [switch]$Eliminar,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   YAvoy v3.1 - ELIMINACIÓN QUIRÚRGICA v3.0_socio" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$rootPath = Split-Path $PSScriptRoot -Parent
$v3_0_Path = Join-Path $rootPath "v3.0_socio"

# ============================================
# VERIFICACIÓN DE INTEGRACIÓN
# ============================================

function Test-Integracion {
    Write-Host "🔍 VERIFICANDO INTEGRACIÓN..." -ForegroundColor Yellow
    Write-Host ""

    $errores = @()
    $advertencias = @()

    # 1. Verificar que existe server-enterprise.js
    if (!(Test-Path (Join-Path $rootPath "server-enterprise.js"))) {
        $errores += "❌ No existe server-enterprise.js"
    } else {
        Write-Host "✅ server-enterprise.js encontrado" -ForegroundColor Green
    }

    # 2. Verificar esquema de validación Joi
    if (!(Test-Path (Join-Path $rootPath "src\validation\schemas.js"))) {
        $errores += "❌ No existe src/validation/schemas.js"
    } else {
        Write-Host "✅ Esquemas de validación Joi encontrados" -ForegroundColor Green
    }

    # 3. Verificar database-schema.sql
    if (!(Test-Path (Join-Path $rootPath "database-schema.sql"))) {
        $advertencias += "⚠️  No existe database-schema.sql"
    } else {
        Write-Host "✅ database-schema.sql encontrado" -ForegroundColor Green
    }

    # 4. Verificar migrate-to-postgresql.js
    if (!(Test-Path (Join-Path $rootPath "migrate-to-postgresql.js"))) {
        $advertencias += "⚠️  No existe migrate-to-postgresql.js"
    } else {
        Write-Host "✅ migrate-to-postgresql.js encontrado" -ForegroundColor Green
    }

    # 5. Verificar que db.js fue refactorizado
    $dbJsPath = Join-Path $rootPath "js\db.js"
    if (Test-Path $dbJsPath) {
        $dbContent = Get-Content $dbJsPath -Raw
        if ($dbContent -match "CACHÉ DE SOLO LECTURA") {
            Write-Host "✅ db.js refactorizado como caché read-only" -ForegroundColor Green
        } else {
            $advertencias += "⚠️  db.js no parece estar refactorizado"
        }
    }

    # 6. Verificar archivos únicos de v3.0_socio
    $archivosUnicos = @(
        "js\tracking-gps.js",
        "js\referidos-sistema.js",
        "js\recompensas-sistema.js",
        "js\propinas-sistema.js",
        "js\pedidos-grupales.js",
        "js\soporte-chatbot.js",
        "utils\simuladorRepartidor.js",
        "js\inventario-sistema.js"
    )

    Write-Host ""
    Write-Host "📂 Verificando archivos únicos de v3.0_socio:" -ForegroundColor Yellow

    foreach ($archivo in $archivosUnicos) {
        $archivoPath = Join-Path $v3_0_Path $archivo
        if (Test-Path $archivoPath) {
            Write-Host "   ⚠️  $archivo aún existe en v3.0_socio" -ForegroundColor Yellow
            $advertencias += "Funcionalidad no migrada: $archivo"
        } else {
            Write-Host "   ✅ $archivo" -ForegroundColor Gray
        }
    }

    # Resumen
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   RESUMEN DE VERIFICACIÓN" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    if ($errores.Count -eq 0) {
        Write-Host "✅ No se encontraron errores críticos" -ForegroundColor Green
    } else {
        Write-Host "❌ ERRORES CRÍTICOS ENCONTRADOS:" -ForegroundColor Red
        foreach ($error in $errores) {
            Write-Host "   $error" -ForegroundColor Red
        }
    }

    if ($advertencias.Count -gt 0) {
        Write-Host ""
        Write-Host "⚠️  ADVERTENCIAS ($($advertencias.Count)):" -ForegroundColor Yellow
        foreach ($adv in $advertencias) {
            Write-Host "   $adv" -ForegroundColor Yellow
        }
    }

    Write-Host ""

    return @{
        Errores = $errores
        Advertencias = $advertencias
        PuedeEliminar = ($errores.Count -eq 0)
    }
}

# ============================================
# CREAR BACKUP
# ============================================

function New-Backup {
    Write-Host "📦 CREANDO BACKUP..." -ForegroundColor Yellow

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupPath = Join-Path $rootPath "backups\v3.0_socio_backup_$timestamp"

    if (!(Test-Path (Join-Path $rootPath "backups"))) {
        New-Item -ItemType Directory -Path (Join-Path $rootPath "backups") | Out-Null
    }

    try {
        Copy-Item -Path $v3_0_Path -Destination $backupPath -Recurse -Force
        Write-Host "✅ Backup creado en: $backupPath" -ForegroundColor Green
        return $backupPath
    } catch {
        Write-Host "❌ Error creando backup: $_" -ForegroundColor Red
        return $null
    }
}

# ============================================
# ELIMINAR v3.0_socio
# ============================================

function Remove-V3_0_Socio {
    param([bool]$CreateBackup = $true)

    Write-Host ""
    Write-Host "🗑️  ELIMINANDO v3.0_socio..." -ForegroundColor Red
    Write-Host ""

    if ($CreateBackup) {
        $backupPath = New-Backup
        if ($null -eq $backupPath) {
            Write-Host "❌ No se pudo crear backup. Abortando eliminación." -ForegroundColor Red
            return $false
        }
    }

    try {
        # Eliminar carpeta
        Remove-Item -Path $v3_0_Path -Recurse -Force

        Write-Host "✅ Carpeta v3.0_socio eliminada exitosamente" -ForegroundColor Green
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "   ELIMINACIÓN COMPLETADA" -ForegroundColor Cyan
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "✅ v3.0_socio ha sido eliminado" -ForegroundColor Green
        Write-Host "📦 Backup disponible en: $backupPath" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "⚠️  PRÓXIMOS PASOS:" -ForegroundColor Yellow
        Write-Host "   1. Ejecutar: npm install" -ForegroundColor White
        Write-Host "   2. Configurar .env con credenciales de PostgreSQL" -ForegroundColor White
        Write-Host "   3. Ejecutar: npm run migrate:postgresql" -ForegroundColor White
        Write-Host "   4. Iniciar: node server-enterprise.js" -ForegroundColor White
        Write-Host ""

        return $true

    } catch {
        Write-Host "❌ Error eliminando carpeta: $_" -ForegroundColor Red
        return $false
    }
}

# ============================================
# EJECUCIÓN PRINCIPAL
# ============================================

if ($Verificar) {
    $resultado = Test-Integracion

    if ($resultado.PuedeEliminar) {
        Write-Host "✅ SISTEMA LISTO PARA ELIMINACIÓN DE v3.0_socio" -ForegroundColor Green
        Write-Host ""
        Write-Host "Para eliminar, ejecuta:" -ForegroundColor Yellow
        Write-Host "   .\ELIMINAR_v3.0_socio.ps1 -Eliminar" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "❌ NO ES SEGURO ELIMINAR v3.0_socio" -ForegroundColor Red
        Write-Host "   Corrige los errores críticos antes de continuar" -ForegroundColor Yellow
        exit 1
    }

} elseif ($Eliminar) {
    Write-Host "⚠️  ADVERTENCIA: Estás a punto de eliminar v3.0_socio" -ForegroundColor Red
    Write-Host ""

    if (!$Force) {
        # Verificar primero
        $resultado = Test-Integracion

        if (!$resultado.PuedeEliminar) {
            Write-Host "❌ Verificación falló. No se puede eliminar." -ForegroundColor Red
            exit 1
        }

        Write-Host ""
        $confirmacion = Read-Host "¿Estás SEGURO? Escribe 'ELIMINAR' para confirmar"

        if ($confirmacion -ne "ELIMINAR") {
            Write-Host "❌ Operación cancelada" -ForegroundColor Yellow
            exit 0
        }
    }

    $exito = Remove-V3_0_Socio -CreateBackup $true

    if ($exito) {
        exit 0
    } else {
        exit 1
    }

} else {
    # Sin parámetros, mostrar ayuda
    Write-Host "USO:" -ForegroundColor Cyan
    Write-Host "   .\ELIMINAR_v3.0_socio.ps1 -Verificar" -ForegroundColor White
    Write-Host "      Verifica si la integración está completa" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   .\ELIMINAR_v3.0_socio.ps1 -Eliminar" -ForegroundColor White
    Write-Host "      Elimina v3.0_socio después de verificación" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   .\ELIMINAR_v3.0_socio.ps1 -Eliminar -Force" -ForegroundColor White
    Write-Host "      Elimina SIN confirmación (usar con precaución)" -ForegroundColor Gray
    Write-Host ""
}
