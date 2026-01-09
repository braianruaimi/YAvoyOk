<#
.SYNOPSIS
    Script de limpieza de archivos residuales para YAvoy v3.1 Enterprise

.DESCRIPTION
    Identifica y elimina archivos obsoletos después de la migración a PostgreSQL:
    - Archivos .json de registros/
    - Scripts .bat antiguos
    - Archivos de testing obsoletos
    - Carpetas duplicadas (v3.0_socio)
    - Logs antiguos
    
.PARAMETER Listar
    Solo muestra archivos a eliminar sin borrar nada

.PARAMETER Eliminar
    Elimina los archivos después de confirmación

.PARAMETER Force
    Elimina sin pedir confirmación (¡PELIGROSO!)

.EXAMPLE
    .\LIMPIAR_ARCHIVOS_RESIDUALES.ps1 -Listar
    .\LIMPIAR_ARCHIVOS_RESIDUALES.ps1 -Eliminar
    .\LIMPIAR_ARCHIVOS_RESIDUALES.ps1 -Eliminar -Force

.NOTES
    Version: 1.0.0
    Date: 21 de diciembre de 2025
    Author: Principal Software Engineer Team
#>

[CmdletBinding()]
param(
    [Parameter(ParameterSetName='List')]
    [switch]$Listar,
    
    [Parameter(ParameterSetName='Delete')]
    [switch]$Eliminar,
    
    [Parameter(ParameterSetName='Delete')]
    [switch]$Force
)

# ============================================
# CONFIGURACIÓN
# ============================================

$RootPath = $PSScriptRoot
$BackupFolder = Join-Path $RootPath "backups"
$LogFile = Join-Path $RootPath "limpieza.log"

# Categorías de archivos residuales
$ArchivosAEliminar = @{
    "JSON_Registros" = @{
        Pattern = "registros/**/*.json"
        Description = "Archivos JSON de persistencia (reemplazados por PostgreSQL)"
        Critical = $true
    }
    "Scripts_BAT" = @{
        Patterns = @(
            "*.bat",
            "INICIAR_*.bat",
            "ABRIR_*.bat"
        )
        Description = "Scripts batch antiguos (reemplazados por PowerShell)"
        Critical = $false
    }
    "Archivos_Test" = @{
        Patterns = @(
            "test-*.html",
            "test-*.js",
            "*-test.js",
            "prueba*.html"
        )
        Description = "Archivos de testing legacy"
        Critical = $false
    }
    "Carpeta_v3_0_socio" = @{
        Path = "v3.0_socio"
        Description = "Carpeta v3.0_socio (ya integrada en v3.1)"
        Critical = $true
    }
    "Logs_Antiguos" = @{
        Patterns = @(
            "logs/*.log",
            "logs/**/*.log.old",
            "*.log"
        )
        Description = "Logs antiguos (> 30 días)"
        Critical = $false
        AgeLimit = 30
    }
    "Documentos_Obsoletos" = @{
        Patterns = @(
            "CORRECCIONES_*.txt",
            "RESUMEN_*.txt",
            "INSTRUCCIONES_*.txt",
            "CAMBIOS_*.txt"
        )
        Description = "Documentos de trabajo antiguos"
        Critical = $false
    }
    "Carpetas_Antiguas" = @{
        Paths = @(
            "servicios-comercio",
            "servicios-cliente",
            "servicios-repartidor"
        )
        Description = "Carpetas de servicios legacy (si existen)"
        Critical = $false
    }
}

# ============================================
# FUNCIONES
# ============================================

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('Info','Warning','Error','Success')]
        [string]$Level = 'Info'
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    # Color según nivel
    $color = switch ($Level) {
        'Info'    { 'White' }
        'Warning' { 'Yellow' }
        'Error'   { 'Red' }
        'Success' { 'Green' }
    }
    
    Write-Host $logMessage -ForegroundColor $color
    Add-Content -Path $LogFile -Value $logMessage
}

function Get-FilesSize {
    param([array]$Files)
    
    $totalBytes = ($Files | Measure-Object -Property Length -Sum).Sum
    $totalMB = [math]::Round($totalBytes / 1MB, 2)
    return $totalMB
}

function Find-ResidualesFiles {
    Write-Log "🔍 Escaneando archivos residuales..." -Level Info
    
    $todosLosArchivos = @()
    $resumen = @{}
    
    foreach ($categoria in $ArchivosAEliminar.Keys) {
        $config = $ArchivosAEliminar[$categoria]
        $archivos = @()
        
        # Buscar por patrón único
        if ($config.Pattern) {
            $fullPattern = Join-Path $RootPath $config.Pattern
            $archivos = Get-ChildItem -Path $fullPattern -File -ErrorAction SilentlyContinue
        }
        
        # Buscar por múltiples patrones
        if ($config.Patterns) {
            foreach ($pattern in $config.Patterns) {
                $fullPattern = Join-Path $RootPath $pattern
                $found = Get-ChildItem -Path $fullPattern -File -Recurse:$false -ErrorAction SilentlyContinue
                $archivos += $found
            }
        }
        
        # Buscar carpetas
        if ($config.Path) {
            $fullPath = Join-Path $RootPath $config.Path
            if (Test-Path $fullPath) {
                $carpetaInfo = Get-Item $fullPath
                $archivos = @($carpetaInfo)
            }
        }
        
        if ($config.Paths) {
            foreach ($path in $config.Paths) {
                $fullPath = Join-Path $RootPath $path
                if (Test-Path $fullPath) {
                    $archivos += Get-Item $fullPath
                }
            }
        }
        
        # Filtrar por edad si aplica
        if ($config.AgeLimit -and $archivos.Count -gt 0) {
            $fechaLimite = (Get-Date).AddDays(-$config.AgeLimit)
            $archivos = $archivos | Where-Object { $_.LastWriteTime -lt $fechaLimite }
        }
        
        if ($archivos.Count -gt 0) {
            $size = Get-FilesSize -Files $archivos
            
            $resumen[$categoria] = @{
                Count = $archivos.Count
                SizeMB = $size
                Description = $config.Description
                Critical = $config.Critical
                Files = $archivos
            }
            
            $todosLosArchivos += $archivos
        }
    }
    
    return @{
        Resumen = $resumen
        Archivos = $todosLosArchivos
    }
}

function Show-Summary {
    param($Resultado)
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   RESUMEN DE ARCHIVOS RESIDUALES" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    $totalArchivos = 0
    $totalSizeMB = 0
    $categoriasCriticas = 0
    
    foreach ($categoria in $Resultado.Resumen.Keys) {
        $info = $Resultado.Resumen[$categoria]
        
        $totalArchivos += $info.Count
        $totalSizeMB += $info.SizeMB
        
        $icon = if ($info.Critical) { "⚠️ " ; $categoriasCriticas++ } else { "ℹ️ " }
        $color = if ($info.Critical) { "Yellow" } else { "Gray" }
        
        Write-Host "$icon $categoria" -ForegroundColor $color
        Write-Host "   $($info.Description)" -ForegroundColor Gray
        Write-Host "   Archivos: $($info.Count) | Tamaño: $($info.SizeMB) MB" -ForegroundColor White
        Write-Host ""
        
        # Mostrar primeros 3 archivos de cada categoría
        $muestraArchivos = $info.Files | Select-Object -First 3
        foreach ($file in $muestraArchivos) {
            $relativePath = $file.FullName.Replace($RootPath, ".")
            Write-Host "     • $relativePath" -ForegroundColor DarkGray
        }
        
        if ($info.Count -gt 3) {
            Write-Host "     ... y $($info.Count - 3) más" -ForegroundColor DarkGray
        }
        Write-Host ""
    }
    
    Write-Host "───────────────────────────────────────────────────────────" -ForegroundColor Cyan
    Write-Host "  TOTALES:" -ForegroundColor White
    Write-Host "  • Archivos/Carpetas: $totalArchivos" -ForegroundColor White
    Write-Host "  • Tamaño total: $totalSizeMB MB" -ForegroundColor White
    Write-Host "  • Categorías críticas: $categoriasCriticas" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function New-BackupBeforeDelete {
    param($Archivos)
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupPath = Join-Path $BackupFolder "limpieza_$timestamp"
    
    Write-Log "📦 Creando backup en: $backupPath" -Level Info
    
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    
    foreach ($archivo in $Archivos) {
        try {
            $relativePath = $archivo.FullName.Replace($RootPath + "\", "")
            $destino = Join-Path $backupPath $relativePath
            $destinoFolder = Split-Path $destino -Parent
            
            if (!(Test-Path $destinoFolder)) {
                New-Item -ItemType Directory -Path $destinoFolder -Force | Out-Null
            }
            
            if ($archivo.PSIsContainer) {
                Copy-Item -Path $archivo.FullName -Destination $destino -Recurse -Force
            } else {
                Copy-Item -Path $archivo.FullName -Destination $destino -Force
            }
        }
        catch {
            Write-Log "❌ Error al respaldar: $($archivo.Name) - $($_.Exception.Message)" -Level Error
        }
    }
    
    Write-Log "✅ Backup completado" -Level Success
    return $backupPath
}

function Remove-ResidualesFiles {
    param($Archivos)
    
    $eliminados = 0
    $errores = 0
    
    foreach ($archivo in $Archivos) {
        try {
            $relativePath = $archivo.FullName.Replace($RootPath + "\", "")
            
            if ($archivo.PSIsContainer) {
                Remove-Item -Path $archivo.FullName -Recurse -Force
                Write-Log "🗑️  Carpeta eliminada: $relativePath" -Level Info
            } else {
                Remove-Item -Path $archivo.FullName -Force
                Write-Log "🗑️  Archivo eliminado: $relativePath" -Level Info
            }
            
            $eliminados++
        }
        catch {
            Write-Log "❌ Error al eliminar: $relativePath - $($_.Exception.Message)" -Level Error
            $errores++
        }
    }
    
    return @{
        Eliminados = $eliminados
        Errores = $errores
    }
}

# ============================================
# MAIN
# ============================================

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  YAvoy v3.1 Enterprise - Limpieza de Archivos Residuales ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Escanear archivos
$resultado = Find-ResidualesFiles

if ($resultado.Archivos.Count -eq 0) {
    Write-Host "✅ No se encontraron archivos residuales para eliminar" -ForegroundColor Green
    Write-Host ""
    exit 0
}

# Mostrar resumen
Show-Summary -Resultado $resultado

# Acción según parámetros
if ($Listar -or (!$Eliminar)) {
    Write-Host "💡 Para eliminar estos archivos, ejecuta:" -ForegroundColor Yellow
    Write-Host "   .\LIMPIAR_ARCHIVOS_RESIDUALES.ps1 -Eliminar" -ForegroundColor White
    Write-Host ""
    exit 0
}

if ($Eliminar) {
    if (!$Force) {
        Write-Host ""
        Write-Host "⚠️  ADVERTENCIA: Estás a punto de eliminar $($resultado.Archivos.Count) archivos/carpetas" -ForegroundColor Yellow
        Write-Host "⚠️  Se creará un backup automático antes de eliminar" -ForegroundColor Yellow
        Write-Host ""
        $confirmacion = Read-Host "Escribe 'ELIMINAR' para confirmar"
        
        if ($confirmacion -ne 'ELIMINAR') {
            Write-Host "❌ Operación cancelada" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host ""
    Write-Log "🚀 Iniciando proceso de limpieza..." -Level Info
    
    # Crear backup
    $backupPath = New-BackupBeforeDelete -Archivos $resultado.Archivos
    
    # Eliminar archivos
    Write-Host ""
    $resultadoEliminacion = Remove-ResidualesFiles -Archivos $resultado.Archivos
    
    # Resumen final
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   LIMPIEZA COMPLETADA" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ Archivos eliminados: $($resultadoEliminacion.Eliminados)" -ForegroundColor Green
    
    if ($resultadoEliminacion.Errores -gt 0) {
        Write-Host "⚠️  Errores: $($resultadoEliminacion.Errores)" -ForegroundColor Yellow
    }
    
    Write-Host "📦 Backup guardado en: $backupPath" -ForegroundColor Cyan
    Write-Host "📄 Log guardado en: $LogFile" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎯 PRÓXIMOS PASOS:" -ForegroundColor Yellow
    Write-Host "   1. Verificar que el sistema funciona correctamente" -ForegroundColor White
    Write-Host "   2. Si todo está OK, puedes eliminar el backup después de 7 días" -ForegroundColor White
    Write-Host "   3. Ejecutar: .\ELIMINAR_v3.0_socio.ps1 -Verificar" -ForegroundColor White
    Write-Host ""
}
