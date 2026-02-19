# Script para crear ZIP del proyecto YAvoyOk
$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CREANDO ZIP DE YAVOYOK" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$sourcePath = "C:\Users\estudiante\Downloads\YAvoyOk"
$zipName = "YAvoyOk-Deploy-$(Get-Date -Format 'yyyyMMdd-HHmm').zip"
$zipPath = "C:\Users\estudiante\Downloads\$zipName"

# Eliminar ZIP si ya existe
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
    Write-Host "Archivo existente eliminado" -ForegroundColor Gray
}

Write-Host "Carpeta origen: $sourcePath" -ForegroundColor White
Write-Host "Archivo destino: $zipName" -ForegroundColor White
Write-Host "`nComprimiendo archivos..." -ForegroundColor Yellow
Write-Host "(Esto puede tardar 1-2 minutos dependiendo del tamaño)`n" -ForegroundColor Gray

try {
    # Método 1: .NET Framework
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory(
        $sourcePath, 
        $zipPath, 
        [System.IO.Compression.CompressionLevel]::Fastest, 
        $false
    )
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  ARCHIVO CREADO EXITOSAMENTE!" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Green
    
    $fileInfo = Get-Item $zipPath
    Write-Host "Nombre:    " -NoNewline -ForegroundColor White
    Write-Host $fileInfo.Name -ForegroundColor Yellow
    Write-Host "Tamaño:   " -NoNewline -ForegroundColor White
    Write-Host "$([math]::Round($fileInfo.Length/1MB,2)) MB" -ForegroundColor Yellow
    Write-Host "Ubicacion: " -NoNewline -ForegroundColor White
    Write-Host $fileInfo.FullName -ForegroundColor Gray
    Write-Host "`n========================================`n" -ForegroundColor Green
    
    # Abrir explorador con el archivo seleccionado
    explorer.exe /select,"$zipPath"
    
} catch {
    Write-Host "`nERROR al crear ZIP:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nIntentando metodo alternativo..." -ForegroundColor Yellow
    
    # Método 2: PowerShell nativo
    try {
        Compress-Archive -Path "$sourcePath\*" -DestinationPath $zipPath -CompressionLevel Fastest -Force
        Write-Host "ZIP creado con metodo alternativo!" -ForegroundColor Green
        explorer.exe /select,"$zipPath"
    } catch {
        Write-Host "Error con metodo alternativo:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host "`nPor favor, crea el ZIP manualmente:" -ForegroundColor Yellow
        Write-Host "1. Ve a: C:\Users\estudiante\Downloads\YAvoyOk" -ForegroundColor White
        Write-Host "2. Selecciona TODO (Ctrl+A)" -ForegroundColor White
        Write-Host "3. Click derecho > Enviar a > Carpeta comprimida (ZIP)" -ForegroundColor White
    }
}

Write-Host "`nPresiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
