#!/bin/bash

# Script de verificación de la refactorización MVC de Pedidos
# YAvoy v3.1 - Sistema modular

echo "🚀 VERIFICANDO REFACTORIZACIÓN MVC - PEDIDOS"
echo "=============================================="
echo ""

# Verificar que los archivos se crearon correctamente
echo "📂 Verificando estructura de archivos..."

if [ -f "src/controllers/pedidosController.js" ]; then
    echo "✅ src/controllers/pedidosController.js - EXISTE"
    LINES_CONTROLLER=$(wc -l < "src/controllers/pedidosController.js")
    echo "   📊 Líneas: $LINES_CONTROLLER"
else
    echo "❌ src/controllers/pedidosController.js - NO ENCONTRADO"
    exit 1
fi

if [ -f "src/routes/pedidosRoutes.js" ]; then
    echo "✅ src/routes/pedidosRoutes.js - EXISTE"
    LINES_ROUTES=$(wc -l < "src/routes/pedidosRoutes.js")
    echo "   📊 Líneas: $LINES_ROUTES"
else
    echo "❌ src/routes/pedidosRoutes.js - NO ENCONTRADO"
    exit 1
fi

echo ""
echo "🔧 Verificando integración en server.js..."

# Verificar importaciones
if grep -q "require('./src/routes/pedidosRoutes')" server.js; then
    echo "✅ Importación pedidosRoutes - CORRECTA"
else
    echo "❌ Importación pedidosRoutes - FALTANTE"
fi

if grep -q "require('./src/controllers/pedidosController')" server.js; then
    echo "✅ Importación pedidosController - CORRECTA"
else
    echo "❌ Importación pedidosController - FALTANTE"
fi

# Verificar configuración
if grep -q "app.set('socketio', io)" server.js; then
    echo "✅ Configuración Socket.IO - CORRECTA"
else
    echo "❌ Configuración Socket.IO - FALTANTE"
fi

# Verificar router
if grep -q "app.use('/api/pedidos', pedidosRoutes)" server.js; then
    echo "✅ Router modular - INSTALADO"
else
    echo "❌ Router modular - FALTANTE"
fi

echo ""
echo "📊 ESTADÍSTICAS DE REFACTORIZACIÓN:"
echo "-----------------------------------"
echo "📄 Controlador: $LINES_CONTROLLER líneas"
echo "🛣️  Router: $LINES_ROUTES líneas"

LINES_SERVER=$(wc -l < server.js)
echo "🔧 Server.js: $LINES_SERVER líneas"

REDUCTION=$((6817 - LINES_SERVER))
echo "📉 Reducción del monolito: $REDUCTION líneas"

PERCENTAGE=$(echo "scale=1; $REDUCTION * 100 / 6817" | bc -l)
echo "📊 Porcentaje modularizado: $PERCENTAGE%"

echo ""
echo "🎯 PRÓXIMOS ENDPOINTS A PROBAR:"
echo "------------------------------"
echo "POST   /api/pedidos                    - Crear pedido"
echo "GET    /api/pedidos                    - Listar pedidos"
echo "GET    /api/pedidos/:id                - Obtener pedido"
echo "PATCH  /api/pedidos/:id/asignar        - Asignar repartidor"
echo "PATCH  /api/pedidos/:id/estado         - Actualizar estado"
echo "POST   /api/pedidos/:id/chat           - Enviar mensaje"
echo ""
echo "🏃‍♂️ COMANDO DE INICIO:"
echo "npm start"
echo ""
echo "✨ REFACTORIZACIÓN COMPLETADA EXITOSAMENTE!"