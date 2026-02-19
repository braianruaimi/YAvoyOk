# Crear ZIP sin archivos innecesarios (sin node_modules, .git, backups)
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CREANDO ZIP LIGERO (SIN NODE_MODULES)" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$source = "C:\Users\estudiante\Downloads\YAvoyOk"
$zipName = "YAvoyOk-LIGERO-$(Get-Date -Format 'yyyyMMdd-HHmm').zip"
$zipPath = "C:\Users\estudiante\Downloads\$zipName"

# Carpetas y archivos a excluir
$exclude = @(
    "node_modules",
    ".git",
    "backups",
    ".npm",
    ".vscode",
    "*.zip",
    "*.log"
)

Write-Host "Recopilando archivos (excluyendo node_modules, .git, backups)..." -ForegroundColor Yellow

# Crear temporal para comprimir
$tempFolder = "C:\Users\estudiante\Downloads\YAvoy-TEMP"
if (Test-Path $tempFolder) { Remove-Item $tempFolder -Recurse -Force }
New-Item -ItemType Directory -Path $tempFolder -Force | Out-Null

# Copiar archivos excluyendo carpetas pesadas
Write-Host "Copiando archivos necesarios..." -ForegroundColor Gray
robocopy $source $tempFolder /E /XD node_modules .git backups .npm .vscode /XF *.zip *.log /NFL /NDL /NJH /NJS /nc /ns /np

# Comprimir
Write-Host "Comprimiendo..." -ForegroundColor Yellow
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory(
    $tempFolder,
    $zipPath,
    [System.IO.Compression.CompressionLevel]::Fastest,
    $false
)

# Limpiar temporal
Remove-Item $tempFolder -Recurse -Force

$fileInfo = Get-Item $zipPath
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  ZIP LIGERO CREADO!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Green
Write-Host "Nombre:  " -NoNewline -ForegroundColor White
Write-Host $fileInfo.Name -ForegroundColor Yellow
Write-Host "Tamaño:  " -NoNewline -ForegroundColor White
Write-Host "$([math]::Round($fileInfo.Length/1MB,2)) MB" -ForegroundColor Yellow
Write-Host "`nEste archivo es MAS RAPIDO de subir!" -ForegroundColor Green
Write-Host "Luego ejecuta en SSH: npm install`n" -ForegroundColor Gray

explorer /select, $zipPath

Write-Host "========================================`n" -ForegroundColor Green
