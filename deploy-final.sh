#!/bin/bash
# YAvoy Deployment Script - Hostinger
# Versión: 3.1 Enterprise

echo "=================================="
echo "🚀 YAvoy Deployment - Hostinger"
echo "=================================="
echo ""

# Navegar al directorio
cd ~/public_html || exit 1

# Limpiar todo
echo "🧹 Limpiando directorio..."
rm -rf * .[^.]*

# Clonar repositorio
echo "📦 Clonando repositorio desde GitHub..."
git clone https://github.com/braianruaimi/YAvoyOk.git . || exit 1

# Instalar dependencias
echo "📥 Instalando dependencias Node.js..."
npm install || exit 1

# Crear .env
echo "⚙️ Creando archivo .env..."
cat > .env << 'ENVEOF'
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u695828542_yavoy_web
DB_USER=u695828542_yavoyen5
DB_PASSWORD=Yavoy26!
DB_POOL_MIN=2
DB_POOL_MAX=20
NODE_ENV=production
PORT=5502
JWT_SECRET=YAvoy_Enterprise_JWT_Secret_2024_Ultra_Secure_MySQL
SESSION_SECRET=YAvoy_Session_Secret_2024_MySQL_Enterprise
CSRF_SECRET=YAvoy2026_CSRF_Enterprise_Protection
ENCRYPT_SECRET=YAvoy2026_Encryption_Master_Key
ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space,http://yavoy.space
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=yavoyen5@yavoy.space
SMTP_PASS=BrainCesar26!
SMTP_SECURE=false
SMTP_TLS=true
VAPID_PUBLIC_KEY=BL4P9zTOxEkQBAmTV3XiyK9305PJDZKoPr52a0NNedpV5OVfuZGlf9SL21zVE9D4AwNfgWzKw8bHA-peL_g-qZs
VAPID_PRIVATE_KEY=SmZvfO1ZhLtbCrewuGFDnG0gfuTeV5DT9vRBjmWlBL4
VAPID_SUBJECT=mailto:yavoyen5@yavoy.space
CEO_USERNAME=admin
CEO_PASSWORD=admin123
ENVEOF

# PM2
echo "🔧 Configurando PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

pm2 delete yavoy 2>/dev/null || true
pm2 start server.js --name yavoy
pm2 save

echo ""
echo "✅ Deployment completado exitosamente!"
echo ""
echo "📊 Mostrando logs (Ctrl+C para salir):"
pm2 logs yavoy --lines 50
