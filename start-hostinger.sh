#!/bin/bash
# Script de inicio para Hostinger
echo "🚀 Iniciando YAvoyOk v3.1 Enterprise..."

# Instalar dependencias si no están
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Instalar PM2 globalmente si no está
which pm2 >/dev/null 2>&1 || {
    echo "🔧 Instalando PM2..."
    npm install -g pm2
}

# Copiar archivo .env
mv .env.hostinger .env

# Detener proceso previo si existe
pm2 delete yavoy 2>/dev/null || true

# Iniciar con PM2
echo "▶️ Iniciando servidor..."
pm2 start server.js --name yavoy

# Guardar configuración
pm2 save
pm2 startup

echo "✅ YAvoyOk v3.1 Enterprise iniciado correctamente!"
echo "🌐 Disponible en: https://yavoy.space"
