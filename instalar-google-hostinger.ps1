# Script para instalar Google OAuth en Hostinger
Write-Host "🔐 Instalando Google OAuth en yavoy.space..." -ForegroundColor Cyan
Write-Host ""

$host_ip = "147.79.84.219"
$port = "65002"
$user = "u695828542"
$password = "Yavoy25!"

# Crear archivo temporal con comandos
$tempScript = @"
cd public_html
echo "📦 Actualizando código desde GitHub..."
git pull origin main
echo "📥 Instalando googleapis..."
npm install googleapis --save
echo "🔄 Reiniciando servidor..."
pm2 restart all || node server.js &
echo "✅ Google OAuth instalado correctamente!"
exit
"@

$tempFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tempFile -Value $tempScript

Write-Host "🔌 Conectando a Hostinger..." -ForegroundColor Yellow

# Usar ssh con password automático
$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "ssh"
$processInfo.Arguments = "-o StrictHostKeyChecking=no -p $port ${user}@${host_ip}"
$processInfo.UseShellExecute = $false
$processInfo.RedirectStandardInput = $true
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true

try {
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    $process.Start() | Out-Null
    
    # Enviar password
    Start-Sleep -Milliseconds 500
    $process.StandardInput.WriteLine($password)
    
    # Enviar comandos
    Start-Sleep -Seconds 1
    $process.StandardInput.WriteLine("cd public_html")
    $process.StandardInput.WriteLine("git pull origin main")
    $process.StandardInput.WriteLine("npm install googleapis --save")
    $process.StandardInput.WriteLine("pm2 restart all")
    $process.StandardInput.WriteLine("exit")
    
    # Esperar resultado
    $output = $process.StandardOutput.ReadToEnd()
    $error = $process.StandardError.ReadToEnd()
    
    $process.WaitForExit()
    
    Write-Host ""
    Write-Host "📤 Salida del servidor:" -ForegroundColor Green
    Write-Host $output
    
    if ($error -and $error.Length -gt 0) {
        Write-Host ""
        Write-Host "⚠️ Errores:" -ForegroundColor Yellow
        Write-Host $error
    }
    
    Write-Host ""
    Write-Host "✅ Instalación completada!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Prueba Google OAuth en: https://yavoy.space" -ForegroundColor Cyan
    
}
catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Prueba manualmente:" -ForegroundColor Yellow
    Write-Host "   ssh -p $port ${user}@${host_ip}" -ForegroundColor White
    Write-Host "   cd public_html" -ForegroundColor White
    Write-Host "   git pull origin main" -ForegroundColor White
    Write-Host "   npm install googleapis" -ForegroundColor White
    Write-Host "   pm2 restart all" -ForegroundColor White
}

Remove-Item $tempFile -ErrorAction SilentlyContinue
