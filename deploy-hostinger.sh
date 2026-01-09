#!/bin/bash
# ====================================
# YAVOY v3.1 ENTERPRISE - SCRIPT DE INICIO HOSTINGER
# ====================================
# Optimizado para VPS Hostinger con PM2 y seguridad enterprise

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Banner de inicio
echo -e "${PURPLE}"
echo "=================================================="
echo "🚀 YAVOY v3.1 ENTERPRISE - HOSTINGER DEPLOY"
echo "=================================================="
echo -e "${NC}"

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecutar desde el directorio del proyecto."
    exit 1
fi

log "Iniciando despliegue YAvoy v3.1 Enterprise..."

# ========================================
# 1. VERIFICAR DEPENDENCIAS SISTEMA
# ========================================
info "Verificando dependencias del sistema..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js no está instalado"
    exit 1
fi

NODE_VERSION=$(node --version)
log "Node.js detectado: $NODE_VERSION"

# Verificar npm
if ! command -v npm &> /dev/null; then
    error "npm no está instalado"
    exit 1
fi

NPM_VERSION=$(npm --version)
log "npm detectado: $NPM_VERSION"

# ========================================
# 2. INSTALAR DEPENDENCIAS
# ========================================
log "Instalando dependencias npm..."

# Limpiar cache npm
npm cache clean --force 2>/dev/null

# Instalar dependencias
npm install --production --no-optional

if [ $? -ne 0 ]; then
    error "Error instalando dependencias npm"
    exit 1
fi

log "✅ Dependencias npm instaladas correctamente"

# ========================================
# 3. CONFIGURAR VARIABLES DE ENTORNO
# ========================================
log "Configurando variables de entorno para Hostinger..."

# Crear .env si no existe
if [ ! -f ".env" ]; then
    cat > .env << EOF
# YAvoy v3.1 Enterprise - Configuración Hostinger
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Base de datos (configurar según Hostinger)
DATABASE_URL=postgresql://username:password@localhost:5432/yavoy_db

# Seguridad
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPT_SECRET=$(openssl rand -base64 32)

# VAPID para Push Notifications
VAPID_SUBJECT=mailto:contacto@yavoy.com
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Configuración de dominio
FRONTEND_URL=https://tu-dominio.com
API_URL=https://tu-dominio.com/api

# Límites de seguridad
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
CEO_RATE_LIMIT_MAX=10

# Configuración de logs
LOG_LEVEL=info
LOG_FILE=logs/yavoy.log
EOF
    
    warning "Archivo .env creado. IMPORTANTE: Configurar variables antes del despliegue"
else
    log "Archivo .env existente encontrado"
fi

# ========================================
# 4. CREAR ESTRUCTURA DE CARPETAS
# ========================================
log "Creando estructura de carpetas..."

# Carpetas principales
mkdir -p data/{pedidos,usuarios,chats,ubicaciones,analytics,security}
mkdir -p logs
mkdir -p backup
mkdir -p uploads

# Carpetas de seguridad
mkdir -p data/security/{logs,blocked-ips,sessions}

# Carpetas de cache
mkdir -p cache/{images,data,sessions}

log "✅ Estructura de carpetas creada"

# ========================================
# 5. CONFIGURAR PERMISOS
# ========================================
log "Configurando permisos de archivos..."

# Permisos para carpetas de datos
chmod 755 data/
chmod -R 700 data/security/
chmod -R 755 data/pedidos/
chmod -R 755 data/usuarios/
chmod -R 755 logs/

# Permisos para uploads
chmod 755 uploads/
chmod 755 cache/

log "✅ Permisos configurados"

# ========================================
# 6. INSTALAR PM2 GLOBALMENTE
# ========================================
log "Verificando PM2..."

if ! command -v pm2 &> /dev/null; then
    info "Instalando PM2 globalmente..."
    npm install -g pm2
    
    if [ $? -ne 0 ]; then
        error "Error instalando PM2"
        exit 1
    fi
    
    log "✅ PM2 instalado correctamente"
else
    log "PM2 ya está instalado"
fi

# ========================================
# 7. CONFIGURAR ECOSYSTEM PM2
# ========================================
log "Configurando PM2 ecosystem..."

# Crear ecosystem.config.js optimizado para Hostinger
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'yavoy-enterprise',
    script: './server-enterprise.js',
    instances: 1, // Ajustar según recursos Hostinger
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000
    },
    // Configuración de memoria y CPU
    max_memory_restart: '500MB', // Ajustar según plan Hostinger
    min_uptime: '10s',
    max_restarts: 5,
    
    // Logs
    log_file: './logs/yavoy.log',
    out_file: './logs/yavoy-out.log',
    error_file: './logs/yavoy-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto restart en cambios (desarrollo)
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'data'],
    
    // Variables de entorno específicas
    env_vars: {
      'NODE_OPTIONS': '--max-old-space-size=400'
    }
  }]
};
EOF

log "✅ Ecosystem PM2 configurado"

# ========================================
# 8. OPTIMIZAR PARA HOSTINGER
# ========================================
log "Aplicando optimizaciones para Hostinger VPS..."

# Crear script de monitoreo de recursos
cat > monitor-resources.js << EOF
// Monitor de recursos para Hostinger VPS
const os = require('os');
const fs = require('fs');

function checkResources() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = (usedMem / totalMem) * 100;
    
    const cpuUsage = os.loadavg()[0];
    
    console.log(\`📊 Memoria: \${memUsage.toFixed(2)}% | CPU Load: \${cpuUsage.toFixed(2)}\`);
    
    // Alertas
    if (memUsage > 80) {
        console.warn('⚠️  Alto uso de memoria:', memUsage.toFixed(2) + '%');
    }
    
    if (cpuUsage > 1.5) {
        console.warn('⚠️  Alta carga de CPU:', cpuUsage.toFixed(2));
    }
}

// Monitorear cada 30 segundos
setInterval(checkResources, 30000);
checkResources();
EOF

# ========================================
# 9. CONFIGURAR NGINX (OPCIONAL)
# ========================================
log "Generando configuración Nginx sugerida..."

cat > nginx-config-example.conf << EOF
# Configuración Nginx para YAvoy v3.1 Enterprise
# Colocar en: /etc/nginx/sites-available/yavoy

server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Redirigir HTTP a HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Certificados SSL (configurar con Hostinger)
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Headers de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Proxy a Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # WebSockets para GPS tracking
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Cache para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

log "✅ Configuración Nginx generada (nginx-config-example.conf)"

# ========================================
# 10. SCRIPTS DE MANTENIMIENTO
# ========================================
log "Creando scripts de mantenimiento..."

# Script de backup
cat > backup.sh << 'EOF'
#!/bin/bash
# Script de backup para YAvoy

BACKUP_DIR="backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup de datos
cp -r data/ "$BACKUP_DIR/"

# Backup de configuración
cp .env "$BACKUP_DIR/"
cp ecosystem.config.js "$BACKUP_DIR/"

# Comprimir
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo "✅ Backup creado: $BACKUP_DIR.tar.gz"
EOF

chmod +x backup.sh

# Script de actualización
cat > update.sh << 'EOF'
#!/bin/bash
# Script de actualización para YAvoy

echo "🔄 Iniciando actualización..."

# Detener PM2
pm2 stop yavoy-enterprise

# Backup antes de actualizar
./backup.sh

# Instalar dependencias
npm install --production

# Reiniciar PM2
pm2 start ecosystem.config.js --env production

echo "✅ Actualización completada"
EOF

chmod +x update.sh

# Script de logs
cat > logs.sh << 'EOF'
#!/bin/bash
# Ver logs de YAvoy

case "$1" in
    "live"|"")
        pm2 logs yavoy-enterprise --lines 50
        ;;
    "error")
        tail -f logs/yavoy-error.log
        ;;
    "all")
        tail -f logs/yavoy.log
        ;;
    *)
        echo "Uso: ./logs.sh [live|error|all]"
        ;;
esac
EOF

chmod +x logs.sh

log "✅ Scripts de mantenimiento creados"

# ========================================
# 11. VERIFICACIÓN FINAL
# ========================================
log "Ejecutando verificaciones finales..."

# Verificar estructura
if [ -d "data" ] && [ -d "logs" ] && [ -f "ecosystem.config.js" ]; then
    log "✅ Estructura de proyecto correcta"
else
    error "❌ Estructura de proyecto incompleta"
    exit 1
fi

# Verificar archivo principal
if [ -f "server-enterprise.js" ]; then
    log "✅ Servidor enterprise encontrado"
else
    error "❌ Archivo server-enterprise.js no encontrado"
    exit 1
fi

# Test de sintaxis Node.js
node -c server-enterprise.js
if [ $? -eq 0 ]; then
    log "✅ Sintaxis del servidor correcta"
else
    error "❌ Error de sintaxis en server-enterprise.js"
    exit 1
fi

# ========================================
# 12. INSTRUCCIONES FINALES
# ========================================
echo -e "${GREEN}"
echo "=================================================="
echo "🎉 YAVOY v3.1 ENTERPRISE CONFIGURADO"
echo "=================================================="
echo -e "${NC}"

echo -e "${YELLOW}📋 PASOS SIGUIENTES:${NC}"
echo "1. Configurar variables en .env (BASE DE DATOS OBLIGATORIO)"
echo "2. Configurar dominio en Hostinger"
echo "3. Configurar SSL/HTTPS"
echo -e "${CYAN}4. Iniciar: pm2 start ecosystem.config.js --env production${NC}"
echo ""

echo -e "${YELLOW}🔧 COMANDOS ÚTILES:${NC}"
echo -e "${CYAN}• Iniciar:${NC}    pm2 start ecosystem.config.js --env production"
echo -e "${CYAN}• Detener:${NC}   pm2 stop yavoy-enterprise"
echo -e "${CYAN}• Reiniciar:${NC} pm2 restart yavoy-enterprise"
echo -e "${CYAN}• Logs:${NC}      ./logs.sh live"
echo -e "${CYAN}• Backup:${NC}    ./backup.sh"
echo -e "${CYAN}• Update:${NC}    ./update.sh"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "• Configurar .env con datos reales de Hostinger"
echo "• Configurar certificado SSL"
echo "• Configurar base de datos PostgreSQL"
echo "• Verificar puertos disponibles en Hostinger"
echo ""

echo -e "${GREEN}🚀 Listo para despliegue en Hostinger VPS${NC}"

# Guardar información del despliegue
cat > DEPLOYMENT_INFO.md << EOF
# YAvoy v3.1 Enterprise - Información de Despliegue

## Configuración Completada
- ✅ Dependencias npm instaladas
- ✅ Estructura de carpetas creada
- ✅ PM2 configurado
- ✅ Scripts de mantenimiento creados
- ✅ Servidor optimizado sin SMTP

## Archivos Importantes
- \`server-enterprise.js\`: Servidor principal optimizado
- \`ecosystem.config.js\`: Configuración PM2
- \`.env\`: Variables de entorno (CONFIGURAR ANTES DE USAR)
- \`nginx-config-example.conf\`: Configuración Nginx sugerida

## Comandos de Mantenimiento
- \`pm2 start ecosystem.config.js --env production\`: Iniciar servidor
- \`./logs.sh live\`: Ver logs en tiempo real
- \`./backup.sh\`: Crear backup
- \`./update.sh\`: Actualizar aplicación

## Próximos Pasos
1. Configurar variables en .env
2. Configurar base de datos PostgreSQL
3. Configurar dominio y SSL en Hostinger
4. Iniciar con PM2

Fecha de configuración: $(date)
EOF

log "✅ Información guardada en DEPLOYMENT_INFO.md"

exit 0