# ==============================================================================
#              🗑️ SCRIPT DE LIMPIEZA - ELIMINAR CARPETAS ANTIGUAS
# ==============================================================================
# Este script elimina las 3 carpetas antiguas del proyecto YAvoy
# Solo ejecutar DESPUÉS de verificar que YAvoy_DEFINITIVO funciona correctamente
# ==============================================================================

param(
    [switch]$Confirmar
)

Clear-Host

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "      🗑️ ELIMINAR CARPETAS ANTIGUAS DE YAVOY 🗑️" -ForegroundColor Red
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

# Carpetas a eliminar
$carpetasEliminar = @(
    "C:\Users\cdaim\OneDrive\Desktop\YAvoy",
    "C:\Users\cdaim\OneDrive\Desktop\YAvoy_UNIFICADO",
    "C:\Users\cdaim\OneDrive\Desktop\YaVOY_UNIFICADO_FINAL - copia"
)

Write-Host "⚠️  ADVERTENCIA:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Este script eliminará PERMANENTEMENTE las siguientes carpetas:" -ForegroundColor White
Write-Host ""

$totalSize = 0
foreach ($carpeta in $carpetasEliminar) {
    if (Test-Path $carpeta) {
        $size = (Get-ChildItem $carpeta -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $sizeGB = [math]::Round($size / 1GB, 2)
        $sizeMB = [math]::Round($size / 1MB, 2)
        $totalSize += $size
        
        Write-Host "   📁 $carpeta" -ForegroundColor Cyan
        if ($sizeGB -gt 0.1) {
            Write-Host "      Tamaño: $sizeGB GB" -ForegroundColor Gray
        } else {
            Write-Host "      Tamaño: $sizeMB MB" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ✓ $carpeta (ya no existe)" -ForegroundColor Green
    }
}

Write-Host ""
$totalSizeGB = [math]::Round($totalSize / 1GB, 2)
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

if ($totalSizeGB -gt 0.1) {
    Write-Host "   💾 Espacio total a liberar: $totalSizeGB GB" -ForegroundColor Yellow
} else {
    Write-Host "   💾 Espacio total a liberar: $totalSizeMB MB" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

# Verificar que YAvoy_DEFINITIVO existe
if (-not (Test-Path "C:\Users\cdaim\OneDrive\Desktop\YAvoy_DEFINITIVO")) {
    Write-Host "❌ ERROR: La carpeta YAvoy_DEFINITIVO no existe!" -ForegroundColor Red
    Write-Host ""
    Write-Host "No se puede continuar sin la carpeta definitiva." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "✓ Carpeta YAvoy_DEFINITIVO encontrada" -ForegroundColor Green
Write-Host ""

# Confirmar acción
if (-not $Confirmar) {
    Write-Host "⚠️  PASOS PREVIOS RECOMENDADOS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   1. Verificar que YAvoy_DEFINITIVO funciona correctamente" -ForegroundColor White
    Write-Host "   2. Probar todas las funcionalidades principales" -ForegroundColor White
    Write-Host "   3. Hacer un backup si lo deseas:" -ForegroundColor White
    Write-Host ""
    Write-Host '      Compress-Archive -Path "C:\Users\cdaim\OneDrive\Desktop\YAvoy_DEFINITIVO" `' -ForegroundColor Gray
    Write-Host '                       -DestinationPath "C:\Users\cdaim\OneDrive\Desktop\YAvoy_BACKUP.zip"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    
    $respuesta = Read-Host "¿Estás SEGURO que quieres eliminar estas carpetas? (escribe 'SI' para confirmar)"
    
    if ($respuesta -ne "SI") {
        Write-Host ""
        Write-Host "❌ Operación cancelada" -ForegroundColor Red
        Write-Host ""
        Read-Host "Presiona Enter para salir"
        exit 0
    }
}

Write-Host ""
Write-Host "🗑️  Iniciando eliminación..." -ForegroundColor Yellow
Write-Host ""

# Eliminar carpetas
$eliminadas = 0
foreach ($carpeta in $carpetasEliminar) {
    if (Test-Path $carpeta) {
        try {
            Write-Host "   Eliminando: $carpeta" -ForegroundColor Cyan
            Remove-Item $carpeta -Recurse -Force -ErrorAction Stop
            Write-Host "   ✓ Eliminada correctamente" -ForegroundColor Green
            $eliminadas++
        } catch {
            Write-Host "   ❌ Error al eliminar: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ℹ️  No existe: $carpeta" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "   ✅ LIMPIEZA COMPLETADA" -ForegroundColor Green
Write-Host ""
Write-Host "   📊 Estadísticas:" -ForegroundColor White
Write-Host "      • Carpetas eliminadas: $eliminadas / $($carpetasEliminar.Count)" -ForegroundColor White
if ($totalSizeGB -gt 0.1) {
    Write-Host "      • Espacio liberado: $totalSizeGB GB" -ForegroundColor White
} else {
    Write-Host "      • Espacio liberado: $totalSizeMB MB" -ForegroundColor White
}
Write-Host ""
Write-Host "   🎯 Tu proyecto unificado está en:" -ForegroundColor Yellow
Write-Host "      C:\Users\cdaim\OneDrive\Desktop\YAvoy_DEFINITIVO" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Read-Host "Presiona Enter para salir"
