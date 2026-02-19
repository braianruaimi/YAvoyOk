#!/bin/bash
# ========================================
# CONFIGURAR PROXY REVERSO EN HOSTINGER
# ========================================

echo "🔧 Configurando proxy reverso para YAvoy..."

# 1. Buscar directorio web público
echo "📁 Buscando directorio público..."
PUBLIC_DIR=""

if [ -d ~/public_html ]; then
    PUBLIC_DIR=~/public_html
elif [ -d ~/domains/yavoy.space/public_html ]; then
    PUBLIC_DIR=~/domains/yavoy.space/public_html
elif [ -d ~/htdocs ]; then
    PUBLIC_DIR=~/htdocs
else
    echo "❌ No se encontró directorio público"
    echo "Directorios disponibles:"
    find ~ -maxdepth 3 -type d -name "public_html" 2>/dev/null
    exit 1
fi

echo "✅ Directorio público encontrado: $PUBLIC_DIR"

# 2. Crear archivo .htaccess
echo "📝 Creando archivo .htaccess..."

cat > "$PUBLIC_DIR/.htaccess" << 'HTACCESS'
# ========================================
# YAVOY PROXY REVERSO - Node.js App
# ========================================

<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Forzar HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # Proxy a Node.js (puerto 5502)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ http://127.0.0.1:5502/$1 [P,L]
</IfModule>

# Habilitar proxy
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:5502/
    ProxyPassReverse / http://127.0.0.1:5502/
    
    # WebSocket support
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/(.*) ws://127.0.0.1:5502/$1 [P,L]
</IfModule>

# Headers de seguridad
<IfModule mod_headers.c>
    Header set X-Forwarded-Proto "https"
    Header set X-Forwarded-Host "%{HTTP_HOST}e"
    Header set X-Real-IP "%{REMOTE_ADDR}e"
    
    # CORS para API
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
HTACCESS

echo "✅ Archivo .htaccess creado en: $PUBLIC_DIR/.htaccess"

# 3. Verificar que PM2 está corriendo
echo "🔍 Verificando servidor PM2..."
pm2 status

if pm2 list | grep -q "yavoy"; then
    echo "✅ PM2 está corriendo"
else
    echo "⚠️ PM2 no está corriendo. Iniciando..."
    cd ~/yavoy-app
    pm2 start server.js --name yavoy
    pm2 save
fi

# 4. Verificar que el servidor responde
echo "🌐 Probando servidor..."
if curl -s http://localhost:5502/ | grep -q "YAvoy"; then
    echo "✅ Servidor Node.js funcionando correctamente"
else
    echo "⚠️ El servidor no responde en puerto 5502"
fi

# 5. Mostrar contenido del .htaccess
echo ""
echo "📄 Contenido de .htaccess:"
cat "$PUBLIC_DIR/.htaccess"

echo ""
echo "================================"
echo "✅ CONFIGURACIÓN COMPLETADA"
echo "================================"
echo ""
echo "🌐 Tu aplicación debería estar accesible en:"
echo "   https://yavoy.space"
echo ""
echo "⏱️ Espera 1-2 minutos para que Apache/Nginx actualice"
echo ""
echo "🔧 Si no funciona, contacta al soporte de Hostinger"
echo "   y solicita habilitar módulos: mod_proxy, mod_rewrite"
echo ""
