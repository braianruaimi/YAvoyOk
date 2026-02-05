# Instalacion automatica de Google OAuth en Hostinger
Write-Host "Instalando Google OAuth en yavoy.space..." -ForegroundColor Cyan

$commands = @"
cd public_html
git pull origin main
npm install googleapis --save
pm2 restart all
echo 'Instalacion completada'
"@

# Guardar comandos en archivo temporal
$scriptFile = "C:\Users\estudiante\Downloads\YAvoyOk\hostinger-install.sh"
Set-Content -Path $scriptFile -Value $commands -Encoding UTF8

Write-Host "Conectando a servidor..." -ForegroundColor Yellow

# Ejecutar con ssh
$env:SSHPASS = "Yavoy25!"
ssh -o StrictHostKeyChecking=no -p 65002 u695828542@147.79.84.219 "cd public_html && git pull origin main && npm install googleapis && pm2 restart all"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Instalacion completada con exito!" -ForegroundColor Green
    Write-Host "Prueba Google OAuth en: https://yavoy.space" -ForegroundColor Cyan
}
else {
    Write-Host ""
    Write-Host "Error en la instalacion." -ForegroundColor Red
}

Remove-Item $scriptFile -ErrorAction SilentlyContinue
