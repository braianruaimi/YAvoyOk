#!/bin/bash
# =======================================
# 🚀 YAVOY v3.1 - COMANDOS SSH HOSTINGER  
# =======================================
# Ejecutar estos comandos UNO POR UNO en SSH

# 1. Limpiar directorio
echo "🧹 Limpiando directorio..."
cd ~/public_html
rm -rf *

# 2. Clonar código
echo "📥 Clonando código desde GitHub..."
git clone https://github.com/braianruaimi/YAvoyOk.git .

# 3. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# 4. Crear archivo .env (CRÍTICO: DB_HOST=localhost)
echo "⚙️ Configurando .env..."
cat > .env << 'EOF'
# BASE DE DATOS MYSQL (LOCALHOST - SIN ACCESO REMOTO)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u695828542_yavoy_web
DB_USER=u695828542_yavoyen5
DB_PASSWORD=Yavoy25!
DB_POOL_MIN=2
DB_POOL_MAX=20

# SEGURIDAD
NODE_ENV=production
PORT=5502
JWT_SECRET=YAvoy_Enterprise_JWT_Secret_2024_Ultra_Secure_MySQL
SESSION_SECRET=YAvoy_Session_Secret_2024_MySQL_Enterprise

# CORS  
ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space,http://yavoy.space

# EMAIL
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=yavoyen5@yavoy.space
SMTP_PASS=BrainCesar26!
SMTP_SECURE=false
SMTP_TLS=true

# VAPID
VAPID_PUBLIC_KEY=BL4P9zTOxEkQBAmTV3XiyK9305PJDZKoPr52a0NNedpV5OVfuZGlf9SL21zVE9D4AwNfgWzKw8bHA-peL_g-qZs
VAPID_PRIVATE_KEY=SmZvfO1ZhLtbCrewuGFDnG0gfuTeV5DT9vRBjmWlBL4
VAPID_SUBJECT=mailto:yavoyen5@yavoy.space
EOF

# 5. Instalar PM2
echo "🔧 Instalando PM2..."
npm install -g pm2

# 6. Detener procesos previos
echo "🛑 Deteniendo procesos previos..."
pm2 delete yavoy 2>/dev/null || true

# 7. Iniciar aplicación
echo "🚀 Iniciando YAvoyOk v3.1 Enterprise..."
pm2 start server.js --name yavoy

# 8. Guardar configuración PM2
pm2 save
pm2 startup

# 9. Crear proxy .htaccess
echo "🌐 Configurando proxy web..."
cat > .htaccess << 'EOF'
RewriteEngine On

# Redirigir todo a Node.js en puerto 5502
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5502/$1 [P,L]

# Headers para Socket.IO
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
</IfModule>
EOF

# 10. Verificar estado final
echo "✅ Verificando estado..."
pm2 status
pm2 logs yavoy --lines 10

echo ""
echo "🎉 ==============================================="
echo "🎉   DEPLOY COMPLETADO - YAVOY v3.1 LIVE       "
echo "🎉 ==============================================="
echo ""
echo "📱 Aplicación: https://yavoy.space"
echo "📊 Panel CEO: https://yavoy.space/panel-ceo-master.html"
echo "📋 API Docs: https://yavoy.space/api/auth/docs"
echo ""
echo "🔥 ¡PRODUCCIÓN LISTA!"