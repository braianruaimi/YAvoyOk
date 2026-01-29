#!/bin/bash
# ====================================
# YAVOY v3.1 - SCRIPT RÁPIDO HOSTINGER
# ====================================
# Deploy optimizado y automatizado

set -e  # Salir si hay errores

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ====================================
# DEPLOYMENT AUTOMÁTICO HOSTINGER
# ====================================

log "🚀 Iniciando deployment YAvoy v3.1 Enterprise..."

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "package.json no encontrado. Ejecutar desde directorio raíz del proyecto."
    exit 1
fi

# ====================================
# 1. INSTALAR DEPENDENCIAS
# ====================================
log "📦 Instalando dependencias..."
npm install --production --no-optional

# ====================================
# 2. VERIFICAR/CREAR ARCHIVO .env
# ====================================
if [ ! -f ".env" ]; then
    warn "Archivo .env no encontrado. Creando desde ejemplo..."
    cp .env.example .env
    warn "⚠️  IMPORTANTE: Editar .env con credenciales reales antes de continuar"
    warn "Ejecutar: nano .env"
    exit 1
fi

# ====================================
# 3. VERIFICAR CONFIGURACIÓN CRÍTICA
# ====================================
log "🔍 Verificando configuración..."

# Verificar que existan variables críticas
if ! grep -q "MERCADOPAGO_ACCESS_TOKEN=APP_USR" .env 2>/dev/null; then
    warn "⚠️  MercadoPago: Credenciales de TEST detectadas"
    warn "Para producción, usar credenciales APP_USR-xxx"
fi

if ! grep -q "DATABASE_URL=postgresql" .env 2>/dev/null; then
    warn "⚠️  Base de datos: Verificar configuración PostgreSQL"
fi

# ====================================
# 4. INSTALAR PM2 SI NO EXISTE
# ====================================
if ! command -v pm2 &> /dev/null; then
    log "📦 Instalando PM2..."
    npm install -g pm2
fi

# ====================================
# 5. CONFIGURAR PM2
# ====================================
log "🔄 Configurando PM2..."

# Detener aplicación anterior si existe
pm2 delete yavoy-enterprise-v3.1 2>/dev/null || true

# Iniciar aplicación
log "🚀 Iniciando YAvoy v3.1 Enterprise con PM2..."
pm2 start ecosystem.config.js --env production

# ====================================
# 6. VERIFICACIONES POST-DEPLOY
# ====================================
log "✅ Verificando deployment..."

# Esperar que la aplicación inicie
sleep 5

# Verificar estado PM2
if pm2 list | grep -q "yavoy-enterprise-v3.1.*online"; then
    log "✅ Aplicación iniciada correctamente"
else
    error "❌ Error iniciando aplicación"
    pm2 logs yavoy-enterprise-v3.1 --lines 20
    exit 1
fi

# Verificar puerto activo
if netstat -tuln | grep -q ":5502 "; then
    log "✅ Puerto 5502 activo"
else
    warn "⚠️  Puerto 5502 no está escuchando"
fi

# ====================================
# 7. CONFIGURAR AUTO-START
# ====================================
log "🔧 Configurando auto-start..."
pm2 startup 2>/dev/null || warn "No se pudo configurar startup automático"
pm2 save

# ====================================
# 8. MOSTRAR INFORMACIÓN FINAL
# ====================================
echo ""
log "🎉 ¡DEPLOYMENT COMPLETADO!"
echo ""
echo "📊 Estado de la aplicación:"
pm2 list

echo ""
echo "🌐 URLs importantes:"
echo "   • Aplicación: http://$(hostname):5502"
echo "   • API Test: http://$(hostname):5502/api/debug/test-router"
echo "   • Panel CEO: http://$(hostname):5502/panel-ceo-master.html"

echo ""
echo "🔧 Comandos útiles:"
echo "   • Ver logs: pm2 logs yavoy-enterprise-v3.1"
echo "   • Reiniciar: pm2 restart yavoy-enterprise-v3.1"
echo "   • Estado: pm2 status"
echo "   • Monitor: pm2 monit"

echo ""
echo "⚠️  PRÓXIMOS PASOS:"
echo "   1. Configurar dominio/DNS apuntando a este servidor"
echo "   2. Verificar credenciales MercadoPago en .env"
echo "   3. Configurar SSL/HTTPS con Let's Encrypt"
echo "   4. Probar funcionalidades críticas"

log "✅ YAvoy v3.1 Enterprise desplegado exitosamente"