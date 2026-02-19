#!/bin/bash
# ============================================
# YAVOY v3.1 - DEPLOY MANUAL SSH HOSTINGER
# ============================================

echo "============================================"
echo "YAVOY v3.1 - DEPLOY HOSTINGER VPS"
echo "============================================"
echo ""

# Ir al directorio correcto
cd ~/public_html
echo "✅ Directorio: $(pwd)"

# Limpiar todo (CUIDADO: esto borra todo)
echo ""
echo "🧹 Limpiando directorio anterior..."
rm -rf * .[^.]*

# Clonar desde GitHub
echo ""
echo "📥 Clonando código desde GitHub..."
git clone https://github.com/braianruaimi/YAvoyOk.git .

# Verificar que se clonó correctamente
if [ ! -f "server.js" ]; then
    echo "❌ ERROR: No se clonó correctamente"
    exit 1
fi

echo "✅ Código clonado correctamente"

# Instalar dependencias
echo ""
echo "📦 Instalando dependencias npm..."
npm install --production

# Crear archivo .env
echo ""
echo "⚙️ Creando archivo .env..."
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u695828542_yavoy_web
DB_USER=u695828542_yavoyen5
DB_PASSWORD=Yavoy26!
NODE_ENV=production
PORT=5502
JWT_SECRET=YAvoy_Enterprise_JWT_Secret_2024_Ultra_Secure_MySQL
SESSION_SECRET=YAvoy_Session_Secret_2024_MySQL_Enterprise
ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=yavoyen5@yavoy.space
SMTP_PASS=BrainCesar26!
SMTP_SECURE=false
SMTP_TLS=true
VAPID_PUBLIC_KEY=BL4P9zTOxEkQBAmTV3XiyK9305PJDZKoPr52a0NNedpV5OVfuZGlf9SL21zVE9D4AwNfgWzKw8bHA-peL_g-qZs
VAPID_PRIVATE_KEY=SmZvfO1ZhLtbCrewuGFDnG0gfuTeV5DT9vRBjmWlBL4
VAPID_SUBJECT=mailto:yavoyen5@yavoy.space
EOF

echo "✅ Archivo .env creado"

# Verificar/Instalar PM2
echo ""
echo "🔧 Verificando PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2 globalmente..."
    npm install -g pm2
fi

# Detener procesos anteriores
echo ""
echo "🛑 Deteniendo procesos anteriores..."
pm2 delete yavoy 2>/dev/null || true

# Iniciar aplicación con PM2
echo ""
echo "🚀 Iniciando YAvoyOk v3.1 Enterprise..."
pm2 start server.js --name yavoy

# Guardar configuración PM2
pm2 save
pm2 startup

# Verificar estado
echo ""
echo "✅ Verificando estado..."
pm2 status
echo ""
echo "📊 Últimos logs:"
pm2 logs yavoy --lines 20

echo ""
echo "============================================"
echo "🎉 DEPLOY COMPLETADO EXITOSAMENTE"
echo "============================================"
echo "📱 App disponible en: https://yavoy.space"
echo "============================================"
