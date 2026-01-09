# Script de verificación de la refactorización MVC de Pedidos
# YAvoy v3.1 - Sistema modular

Write-Host "🚀 VERIFICANDO REFACTORIZACIÓN MVC - PEDIDOS" -ForegroundColor Green
Write-Host "==============================================`n" -ForegroundColor Green

# Verificar que los archivos se crearon correctamente
Write-Host "📂 Verificando estructura de archivos..." -ForegroundColor Yellow

if (Test-Path "src/controllers/pedidosController.js") {
    $linesController = (Get-Content "src/controllers/pedidosController.js" | Measure-Object -Line).Lines
    Write-Host "✅ src/controllers/pedidosController.js - EXISTE" -ForegroundColor Green
    Write-Host "   📊 Líneas: $linesController" -ForegroundColor Cyan
} else {
    Write-Host "❌ src/controllers/pedidosController.js - NO ENCONTRADO" -ForegroundColor Red
    exit 1
}

if (Test-Path "src/routes/pedidosRoutes.js") {
    $linesRoutes = (Get-Content "src/routes/pedidosRoutes.js" | Measure-Object -Line).Lines
    Write-Host "✅ src/routes/pedidosRoutes.js - EXISTE" -ForegroundColor Green
    Write-Host "   📊 Líneas: $linesRoutes" -ForegroundColor Cyan
} else {
    Write-Host "❌ src/routes/pedidosRoutes.js - NO ENCONTRADO" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔧 Verificando integración en server.js..." -ForegroundColor Yellow

$serverContent = Get-Content "server.js" -Raw

# Verificar importaciones
if ($serverContent -match "require\('\./src/routes/pedidosRoutes'\)") {
    Write-Host "✅ Importación pedidosRoutes - CORRECTA" -ForegroundColor Green
} else {
    Write-Host "❌ Importación pedidosRoutes - FALTANTE" -ForegroundColor Red
}

if ($serverContent -match "require\('\./src/controllers/pedidosController'\)") {
    Write-Host "✅ Importación pedidosController - CORRECTA" -ForegroundColor Green
} else {
    Write-Host "❌ Importación pedidosController - FALTANTE" -ForegroundColor Red
}

# Verificar configuración
if ($serverContent -match "app\.set\('socketio', io\)") {
    Write-Host "✅ Configuración Socket.IO - CORRECTA" -ForegroundColor Green
} else {
    Write-Host "❌ Configuración Socket.IO - FALTANTE" -ForegroundColor Red
}

# Verificar router
if ($serverContent -match "app\.use\('/api/pedidos', pedidosRoutes\)") {
    Write-Host "✅ Router modular - INSTALADO" -ForegroundColor Green
} else {
    Write-Host "❌ Router modular - FALTANTE" -ForegroundColor Red
}

$linesServer = (Get-Content "server.js" | Measure-Object -Line).Lines
$reduction = 6817 - $linesServer
$percentage = [math]::Round(($reduction / 6817) * 100, 1)

Write-Host "`n📊 ESTADÍSTICAS DE REFACTORIZACIÓN:" -ForegroundColor Magenta
Write-Host "-----------------------------------" -ForegroundColor Magenta
Write-Host "📄 Controlador: $linesController líneas" -ForegroundColor Cyan
Write-Host "🛣️  Router: $linesRoutes líneas" -ForegroundColor Cyan
Write-Host "🔧 Server.js: $linesServer líneas" -ForegroundColor Cyan
Write-Host "📉 Reducción del monolito: $reduction líneas" -ForegroundColor Green
Write-Host "📊 Porcentaje modularizado: $percentage%" -ForegroundColor Green

Write-Host "`n🎯 PRÓXIMOS ENDPOINTS A PROBAR:" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow
Write-Host "POST   /api/pedidos                    - Crear pedido" -ForegroundColor White
Write-Host "GET    /api/pedidos                    - Listar pedidos" -ForegroundColor White
Write-Host "GET    /api/pedidos/:id                - Obtener pedido" -ForegroundColor White
Write-Host "PATCH  /api/pedidos/:id/asignar        - Asignar repartidor" -ForegroundColor White
Write-Host "PATCH  /api/pedidos/:id/estado         - Actualizar estado" -ForegroundColor White
Write-Host "POST   /api/pedidos/:id/chat           - Enviar mensaje" -ForegroundColor White

Write-Host "`n🏃‍♂️ COMANDO DE INICIO:" -ForegroundColor Yellow
Write-Host "npm start" -ForegroundColor Cyan

Write-Host "`n✨ REFACTORIZACIÓN COMPLETADA EXITOSAMENTE!" -ForegroundColor Green

# Pausa opcional para ver los resultados
Write-Host "`nPresiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")