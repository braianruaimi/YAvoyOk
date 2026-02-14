# ============================================
# 🔑 CONEXIÓN SSH ASISTIDA HOSTINGER
# ============================================

Write-Host ""
Write-Host "🔑 CONEXIÓN SSH ASISTIDA" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Solicitar credenciales de forma explícita
Write-Host "📋 DATOS DE CONEXIÓN HOSTINGER:" -ForegroundColor Yellow
Write-Host "   Host: 147.79.84.219" -ForegroundColor White
Write-Host "   Puerto: 65002" -ForegroundColor White
Write-Host "   Usuario: u695828542" -ForegroundColor White
Write-Host ""

Write-Host "🔐 CONTRASEÑAS POSIBLES A PROBAR:" -ForegroundColor Cyan
Write-Host "   1. Yavoy25!" -ForegroundColor Green
Write-Host "   2. BrainCesar26!" -ForegroundColor Green  
Write-Host "   3. Yavoy26!" -ForegroundColor Green
Write-Host ""

Write-Host "💡 INSTRUCCIONES PARA SSH:" -ForegroundColor Yellow
Write-Host "   1. Cuando veas 'password:' escribe una contraseña" -ForegroundColor White
Write-Host "   2. ⚠️  NO VERÁS LO QUE ESCRIBES (es normal)" -ForegroundColor Red
Write-Host "   3. Presiona Enter después de escribir" -ForegroundColor White
Write-Host "   4. Si falla, prueba la siguiente contraseña" -ForegroundColor White
Write-Host ""

Write-Host "🚀 EJECUTA ESTE COMANDO:" -ForegroundColor Green
Write-Host "ssh -p 65002 u695828542@147.79.84.219" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔄 ALTERNATIVA (si SSH sigue fallando):" -ForegroundColor Yellow
Write-Host "   1. Ve al panel Hostinger: https://hpanel.hostinger.com" -ForegroundColor White
Write-Host "   2. Files → File Manager" -ForegroundColor White  
Write-Host "   3. Subir archivos manualmente" -ForegroundColor White
Write-Host ""

Write-Host "📱 TAMBIÉN PUEDES USAR SCP PARA TRANSFERIR:" -ForegroundColor Cyan
$scpCommand = "scp -P 65002 server.js u695828542@147.79.84.219:~/public_html/"
Write-Host $scpCommand -ForegroundColor Green
Write-Host ""