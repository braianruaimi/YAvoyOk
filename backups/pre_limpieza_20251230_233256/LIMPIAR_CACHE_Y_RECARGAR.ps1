# 🔄 Script para limpiar caché y recargar estilos - YAvoy
# Este script limpia la caché del navegador y reinicia el servidor

Write-Host "🔄 LIMPIANDO CACHE Y RECARGANDO ESTILOS..." -ForegroundColor Cyan
Write-Host ""

# 1. Detener proceso Node.js anterior
Write-Host "🛑 Deteniendo servidor Node.js..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 2. Limpiar caché de navegadores (archivos temporales)
Write-Host "🧹 Limpiando caché del navegador..." -ForegroundColor Yellow

# Chrome
$chromeCachePath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache"
if (Test-Path $chromeCachePath) {
    Remove-Item -Path "$chromeCachePath\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ Cache de Chrome limpiado" -ForegroundColor Green
}

# Edge
$edgeCachePath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache"
if (Test-Path $edgeCachePath) {
    Remove-Item -Path "$edgeCachePath\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ Cache de Edge limpiado" -ForegroundColor Green
}

# Firefox
$firefoxPath = "$env:APPDATA\Mozilla\Firefox\Profiles"
if (Test-Path $firefoxPath) {
    Get-ChildItem -Path $firefoxPath -Recurse -Filter "cache2" -ErrorAction SilentlyContinue | 
    ForEach-Object { Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }
    Write-Host "  ✅ Cache de Firefox limpiado" -ForegroundColor Green
}

Write-Host ""
Write-Host "3. Incrementar versión de CSS..." -ForegroundColor Yellow

# Actualizar versión en los archivos HTML principales
$version = Get-Random -Minimum 100 -Maximum 999
$archivos = @(
    "index.html",
    "panel-admin.html",
    "panel-repartidor.html",
    "panel-comercio.html",
    "panel-ceo-master.html",
    "dashboard-ceo.html",
    "dashboard-analytics.html"
)

foreach ($archivo in $archivos) {
    if (Test-Path $archivo) {
        $contenido = Get-Content $archivo -Raw
        $contenido = $contenido -replace 'styles\.css\?v=\d+', "styles.css?v=$version"
        $contenido = $contenido -replace 'animations-improved\.css\?v=\d+', "animations-improved.css?v=$version"
        Set-Content $archivo -Value $contenido
    }
}

Write-Host "  ✅ Versión de CSS actualizada a v=$version" -ForegroundColor Green
Write-Host ""

# 4. Reiniciar el servidor
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node server.js"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ PROCESO COMPLETADO" -ForegroundColor Green
Write-Host ""
Write-Host "📋 INSTRUCCIONES:" -ForegroundColor Yellow
Write-Host "1. Abre el navegador en modo incógnito: Ctrl+Shift+N (Chrome/Edge) o Ctrl+Shift+P (Firefox)"
Write-Host "2. Navega a: http://localhost:3000"
Write-Host "3. Si aún ves problemas, presiona Ctrl+Shift+R para forzar recarga"
Write-Host ""
Write-Host "🎨 Cambios aplicados:" -ForegroundColor Cyan
Write-Host "  ✓ Todos los paneles ahora cargan styles.css principal"
Write-Host "  ✓ Animaciones mejoradas activadas"
Write-Host "  ✓ Tema oscuro unificado (#0f1724)"
Write-Host "  ✓ Color primario cyan (#06b6d4)"
Write-Host ""

Read-Host "Presiona Enter para cerrar"
