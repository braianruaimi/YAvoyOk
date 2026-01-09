# YAvoy SFTP Deployment Automation Script
# Automatiza el proceso de despliegue a Hostinger

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("full", "quick", "backup", "verify")]
    [string]$Action = "quick",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production"
)

# Configuración
$ProjectPath = $PSScriptRoot
$SftpConfigPath = "$ProjectPath\.vscode\sftp.json"

Write-Host "🚀 YAvoy SFTP Deployment Automation" -ForegroundColor Green
Write-Host "Acción: $Action | Entorno: $Environment" -ForegroundColor Yellow
Write-Host "Ruta: $ProjectPath" -ForegroundColor Gray

# Verificar que existe la configuración SFTP
if (-not (Test-Path $SftpConfigPath)) {
    Write-Host "❌ Error: No se encuentra el archivo .vscode\sftp.json" -ForegroundColor Red
    Write-Host "Ejecuta VS Code y configura la extensión SFTP primero." -ForegroundColor Yellow
    exit 1
}

# Función para verificar VS Code y extensión SFTP
function Test-VSCodeSFTP {
    try {
        $vscodePath = Get-Command "code" -ErrorAction SilentlyContinue
        if (-not $vscodePath) {
            Write-Host "⚠️  VS Code no está en el PATH del sistema" -ForegroundColor Yellow
            return $false
        }
        return $true
    } catch {
        return $false
    }
}

# Función para realizar backup local antes de deployment
function Invoke-LocalBackup {
    Write-Host "📦 Creando backup local..." -ForegroundColor Cyan
    
    $BackupPath = "$ProjectPath\backups\deployment_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    
    if (-not (Test-Path "$ProjectPath\backups")) {
        New-Item -Path "$ProjectPath\backups" -ItemType Directory -Force | Out-Null
    }
    
    # Archivos críticos a respaldar
    $CriticalFiles = @(
        "index.html",
        "dashboard-ceo.html", 
        "panel-comercio*.html",
        "panel-repartidor*.html",
        "css\theme-enhancement.css",
        "js\theme-*.js",
        "manifest.json"
    )
    
    New-Item -Path $BackupPath -ItemType Directory -Force | Out-Null
    
    foreach ($pattern in $CriticalFiles) {
        $files = Get-ChildItem -Path $ProjectPath -Filter $pattern -Recurse
        foreach ($file in $files) {
            $relativePath = $file.FullName.Substring($ProjectPath.Length + 1)
            $destPath = Join-Path $BackupPath $relativePath
            $destDir = Split-Path $destPath -Parent
            
            if (-not (Test-Path $destDir)) {
                New-Item -Path $destDir -ItemType Directory -Force | Out-Null
            }
            
            Copy-Item $file.FullName $destPath -Force
        }
    }
    
    Write-Host "✅ Backup creado en: $BackupPath" -ForegroundColor Green
    return $BackupPath
}

# Función para verificar archivos antes del deployment
function Test-DeploymentFiles {
    Write-Host "🔍 Verificando archivos críticos..." -ForegroundColor Cyan
    
    $CriticalFiles = @(
        "index.html",
        "dashboard-ceo.html",
        "css\theme-enhancement.css", 
        "js\theme-color-polyfill.js",
        "manifest.json"
    )
    
    $MissingFiles = @()
    
    foreach ($file in $CriticalFiles) {
        $fullPath = Join-Path $ProjectPath $file
        if (-not (Test-Path $fullPath)) {
            $MissingFiles += $file
        }
    }
    
    if ($MissingFiles.Count -gt 0) {
        Write-Host "❌ Archivos críticos faltantes:" -ForegroundColor Red
        $MissingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        return $false
    }
    
    Write-Host "✅ Todos los archivos críticos están presentes" -ForegroundColor Green
    return $true
}

# Función para ejecutar comandos SFTP via VS Code
function Invoke-SFTPCommand {
    param([string]$Command)
    
    if (-not (Test-VSCodeSFTP)) {
        Write-Host "❌ No se puede ejecutar VS Code" -ForegroundColor Red
        return $false
    }
    
    try {
        # Usar VS Code CLI para ejecutar comandos SFTP
        Write-Host "📤 Ejecutando: $Command" -ForegroundColor Blue
        
        switch ($Command) {
            "upload-project" {
                & code $ProjectPath --command "sftp.upload.project"
            }
            "upload-active" {
                & code $ProjectPath --command "sftp.upload.activeFolder" 
            }
            "download-project" {
                & code $ProjectPath --command "sftp.download.project"
            }
            "sync-local-remote" {
                & code $ProjectPath --command "sftp.sync.localToRemote"
            }
        }
        
        Start-Sleep -Seconds 2
        Write-Host "✅ Comando SFTP ejecutado" -ForegroundColor Green
        return $true
        
    } catch {
        Write-Host "❌ Error ejecutando comando SFTP: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Función principal de deployment
function Invoke-Deployment {
    param([string]$Type)
    
    Write-Host "`n🎯 Iniciando deployment: $Type" -ForegroundColor Magenta
    
    # Verificar archivos críticos
    if (-not (Test-DeploymentFiles)) {
        Write-Host "❌ Deployment abortado por archivos faltantes" -ForegroundColor Red
        return $false
    }
    
    switch ($Type) {
        "full" {
            Write-Host "🔄 Deployment completo..." -ForegroundColor Yellow
            
            # Backup local
            $backupPath = Invoke-LocalBackup
            
            # Subir proyecto completo
            if (Invoke-SFTPCommand "upload-project") {
                Write-Host "✅ Deployment completo exitoso" -ForegroundColor Green
                Write-Host "📁 Backup en: $backupPath" -ForegroundColor Blue
                return $true
            } else {
                Write-Host "❌ Error en deployment completo" -ForegroundColor Red
                return $false
            }
        }
        
        "quick" {
            Write-Host "⚡ Deployment rápido..." -ForegroundColor Yellow
            
            # Solo sincronizar cambios
            if (Invoke-SFTPCommand "sync-local-remote") {
                Write-Host "✅ Deployment rápido exitoso" -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ Error en deployment rápido" -ForegroundColor Red
                return $false
            }
        }
        
        "backup" {
            Write-Host "📥 Descargando backup del servidor..." -ForegroundColor Yellow
            
            if (Invoke-SFTPCommand "download-project") {
                Write-Host "✅ Backup descargado exitosamente" -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ Error descargando backup" -ForegroundColor Red
                return $false
            }
        }
    }
}

# Función para verificar el deployment
function Test-DeploymentResult {
    Write-Host "`n🔍 Verificando deployment..." -ForegroundColor Cyan
    
    # Leer configuración SFTP para obtener el host
    try {
        $sftpConfig = Get-Content $SftpConfigPath | ConvertFrom-Json
        $hostName = $sftpConfig.host
        
        if ($hostName -and $hostName -ne "localhost" -and $hostName -ne "tu-dominio.com") {
            Write-Host "🌐 Verificando sitio web: https://$hostName" -ForegroundColor Blue
            
            try {
                $response = Invoke-WebRequest -Uri "https://$hostName" -TimeoutSec 10 -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    Write-Host "✅ Sitio web responde correctamente (HTTP $($response.StatusCode))" -ForegroundColor Green
                } else {
                    Write-Host "⚠️  Sitio web responde con código: $($response.StatusCode)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "⚠️  No se puede verificar el sitio web automáticamente" -ForegroundColor Yellow
                Write-Host "   Verifica manualmente: https://$hostName" -ForegroundColor Gray
            }
        } else {
            Write-Host "⚠️  Configura el host en sftp.json para verificación automática" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  No se puede leer la configuración SFTP" -ForegroundColor Yellow
    }
    
    # Lista de verificaciones manuales
    Write-Host "`n📋 Lista de verificación manual:" -ForegroundColor Cyan
    Write-Host "  ✓ Página principal carga correctamente" -ForegroundColor Gray
    Write-Host "  ✓ Dashboard CEO funciona" -ForegroundColor Gray
    Write-Host "  ✓ Paneles de comercio/repartidor operativos" -ForegroundColor Gray  
    Write-Host "  ✓ Temas CSS aplicados correctamente" -ForegroundColor Gray
    Write-Host "  ✓ JavaScript sin errores (F12 console)" -ForegroundColor Gray
    Write-Host "  ✓ PWA manifest funcional" -ForegroundColor Gray
}

# Ejecución principal
Write-Host "===========================================" -ForegroundColor Cyan

switch ($Action) {
    "full" {
        if (Invoke-Deployment "full") {
            Test-DeploymentResult
        }
    }
    "quick" {
        if (Invoke-Deployment "quick") {
            Test-DeploymentResult  
        }
    }
    "backup" {
        Invoke-Deployment "backup"
    }
    "verify" {
        Test-DeploymentResult
    }
}

Write-Host "`n🎯 Deployment automation completado" -ForegroundColor Magenta
Write-Host "===========================================" -ForegroundColor Cyan

# Mostrar comandos útiles
Write-Host "`n📚 Comandos disponibles:" -ForegroundColor Blue
Write-Host "  .\DEPLOY_SFTP.ps1 -Action full     # Deployment completo con backup" -ForegroundColor Gray
Write-Host "  .\DEPLOY_SFTP.ps1 -Action quick    # Deployment rápido de cambios" -ForegroundColor Gray  
Write-Host "  .\DEPLOY_SFTP.ps1 -Action backup   # Descargar backup del servidor" -ForegroundColor Gray
Write-Host "  .\DEPLOY_SFTP.ps1 -Action verify   # Verificar deployment actual" -ForegroundColor Gray