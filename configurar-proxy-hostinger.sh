#!/bin/bash
# ============================================
# Script de Configuración Proxy Reverso
# YAvoy v3.1 Enterprise - Hostinger VPS
# ============================================

echo "🔧 Configurando Proxy Reverso para YAvoy..."
echo ""

# Determinar el directorio web público
PUBLIC_HTML="/home/u695828542/public_html"

# Verificar si existe Apache o Nginx
if command -v apache2 &> /dev/null || command -v httpd &> /dev/null; then
    echo "✅ Apache detectado - Configurando .htaccess"
    
    # Crear .htaccess para proxy reverso
    cat > "$PUBLIC_HTML/.htaccess" << 'HTACCESS_END'
# YAvoy Proxy Reverso - Apache
RewriteEngine On

# Redirigir todo el tráfico HTTP a HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proxy reverso a Node.js en puerto 5502
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:5502/$1 [P,L]

# Headers de proxy
<IfModule mod_headers.c>
    Header set X-Forwarded-For "%{REMOTE_ADDR}s"
    Header set X-Forwarded-Proto "https"
    Header set X-Real-IP "%{REMOTE_ADDR}s"
</IfModule>

# Habilitar ProxyPass (si está disponible)
<IfModule mod_proxy.c>
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:5502/
    ProxyPassReverse / http://127.0.0.1:5502/
</IfModule>
HTACCESS_END

    echo "✅ .htaccess creado en $PUBLIC_HTML"
    
elif command -v nginx &> /dev/null; then
    echo "✅ Nginx detectado - Configurando virtual host"
    
    # Configuración Nginx
    NGINX_CONF="/etc/nginx/sites-available/yavoy.space"
    
    cat > "$NGINX_CONF" << 'NGINX_END'
server {
    listen 80;
    listen [::]:80;
    server_name yavoy.space www.yavoy.space;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yavoy.space www.yavoy.space;

    # SSL (configurar certificados)
    # ssl_certificate /path/to/cert.pem;
    # ssl_certificate_key /path/to/key.pem;

    # Logs
    access_log /var/log/nginx/yavoy-access.log;
    error_log /var/log/nginx/yavoy-error.log;

    # Proxy reverso a Node.js
    location / {
        proxy_pass http://127.0.0.1:5502;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5502;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX_END

    echo "✅ Nginx config creado (requiere permisos root para activar)"
    echo "   Ejecutar como root:"
    echo "   sudo ln -s $NGINX_CONF /etc/nginx/sites-enabled/"
    echo "   sudo nginx -t"
    echo "   sudo systemctl reload nginx"
    
else
    echo "⚠️  No se detectó Apache ni Nginx"
    echo "   Contacta al soporte de Hostinger para configurar proxy reverso"
fi

echo ""
echo "✅ Configuración completada"
echo ""
echo "📋 PASOS SIGUIENTES:"
echo "1. Si usas Apache: El .htaccess ya está activo"
echo "2. Si usas Nginx: Ejecuta los comandos mostrados arriba"
echo "3. Verifica: https://yavoy.space"
echo ""
