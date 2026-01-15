#!/bin/bash
# YAvoy v3.1 - Startup Script Definitivo
# Este script siempre iniciará el servidor correctamente

echo "============================================="
echo "  🚀 YAVOY v3.1 - STARTUP DEFINITIVO"
echo "============================================="

# Limpiar procesos anteriores
echo "🧹 Limpiando procesos anteriores..."
pkill -f "node.*server" 2>/dev/null || true
sleep 2

# Verificar directorio
if [ ! -f "server-simple.js" ]; then
    echo "❌ Error: No se encuentra server-simple.js"
    echo "   Asegúrate de estar en el directorio correcto"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

# Verificar dependencias
echo "📦 Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo "🔄 Instalando dependencias..."
    npm install
fi

# Verificar puerto libre
PORT=5502
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null; then
    echo "⚠️  Puerto $PORT ocupado, matando proceso..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo "🚀 Iniciando servidor en puerto $PORT..."
exec node server-simple.js