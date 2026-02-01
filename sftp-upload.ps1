# Script para subir update-server.php a Hostinger via SFTP
# Usando WinSCP (se descarga automáticamente si no existe)

$winscp_url = "https://winscp.net/download/WinSCP-5.21.7-Portable.zip"
$winscp_zip = "$env:TEMP\winscp.zip"
$winscp_dir = "$env:TEMP\winscp"

Write-Host "🚀 Preparando upload a Hostinger..." -ForegroundColor Cyan

# Descargar WinSCP portable si no existe
if (!(Test-Path "$winscp_dir\WinSCPnet.dll")) {
    Write-Host "📥 Descargando WinSCP..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $winscp_url -OutFile $winscp_zip
    Expand-Archive -Path $winscp_zip -DestinationPath $winscp_dir -Force
}

# Cargar WinSCP .NET assembly
Add-Type -Path "$winscp_dir\WinSCPnet.dll"

try {
    # Configurar sesión
    $sessionOptions = New-Object WinSCP.SessionOptions -Property @{
        Protocol                             = [WinSCP.Protocol]::Sftp
        HostName                             = "147.79.84.219"
        PortNumber                           = 65002
        UserName                             = "u695828542"
        Password                             = "Yavoy25!"
        GiveUpSecurityAndAcceptAnySshHostKey = $true
    }

    $session = New-Object WinSCP.Session

    Write-Host "🔌 Conectando a servidor..." -ForegroundColor Cyan
    $session.Open($sessionOptions)

    Write-Host "📤 Subiendo update-server.php..." -ForegroundColor Yellow
    
    # Subir archivo
    $localPath = "C:\Users\estudiante\Downloads\YAvoyOk\update-server.php"
    $remotePath = "/public_html/update-server.php"
    
    $transferResult = $session.PutFiles($localPath, $remotePath)
    
    # Verificar resultado
    $transferResult.Check()
    
    Write-Host "✅ Archivo subido exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Ahora abre en tu navegador:" -ForegroundColor Cyan
    Write-Host "   https://yavoy.space/update-server.php?key=Yavoy2026" -ForegroundColor White
    Write-Host ""
    Write-Host "Esto actualizará automáticamente el sitio con tus cambios de UI." -ForegroundColor Gray
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    if ($session) { $session.Dispose() }
}
