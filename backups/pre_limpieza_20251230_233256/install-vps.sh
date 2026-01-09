#!/bin/bash
# ============================================
# YAVOY v3.1 ENTERPRISE - INSTALACIÓN RÁPIDA
# ============================================
# 
# Script de instalación automatizada para Hostinger VPS
# Ubuntu 22.04 LTS
# 
# MODO DE USO:
# chmod +x install-vps.sh
# ./install-vps.sh
# 
# @version 1.0.0
# @date 21 de diciembre de 2025
# ============================================

set -e  # Salir si hay errores

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  YAvoy v3.1 Enterprise - Instalación Automatizada        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# ============================================
# COLORES
# ============================================
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================
# FUNCIONES
# ============================================

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_step() {
    echo ""
    echo -e "${YELLOW}═══ $1 ═══${NC}"
    echo ""
}

# ============================================
# VERIFICACIONES INICIALES
# ============================================

print_step "VERIFICANDO REQUISITOS"

# Verificar que es root o tiene sudo
if [ "$EUID" -eq 0 ]; then 
    print_warning "Ejecutando como root (no recomendado en producción)"
    SUDO=""
else 
    SUDO="sudo"
    if ! command -v sudo &> /dev/null; then
        print_error "sudo no está instalado. Instálalo o ejecuta como root."
        exit 1
    fi
fi

# Verificar Ubuntu
if [ ! -f /etc/lsb-release ]; then
    print_error "Este script está diseñado para Ubuntu 22.04 LTS"
    exit 1
fi

source /etc/lsb-release
if [ "$DISTRIB_RELEASE" != "22.04" ]; then
    print_warning "Se recomienda Ubuntu 22.04 LTS (tienes $DISTRIB_RELEASE)"
fi

print_success "Sistema verificado"

# ============================================
# ACTUALIZAR SISTEMA
# ============================================

print_step "ACTUALIZANDO SISTEMA"
$SUDO apt update && $SUDO apt upgrade -y
$SUDO apt install -y curl wget git build-essential
print_success "Sistema actualizado"

# ============================================
# INSTALAR NODE.JS 18
# ============================================

print_step "INSTALANDO NODE.JS 18"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_warning "Node.js ya está instalado: $NODE_VERSION"
    read -p "¿Reinstalar Node.js 18? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Saltando instalación de Node.js"
    else
        # Instalar NVM
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        
        nvm install 18
        nvm use 18
        nvm alias default 18
    fi
else
    # Instalar NVM
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    nvm install 18
    nvm use 18
    nvm alias default 18
fi

print_success "Node.js instalado: $(node -v)"

# ============================================
# INSTALAR PM2
# ============================================

print_step "INSTALANDO PM2"
npm install -g pm2
print_success "PM2 instalado: $(pm2 -v)"

# ============================================
# INSTALAR NGINX
# ============================================

print_step "INSTALANDO NGINX"
$SUDO apt install -y nginx
$SUDO systemctl start nginx
$SUDO systemctl enable nginx
print_success "Nginx instalado"

# ============================================
# INSTALAR POSTGRESQL 14
# ============================================

print_step "INSTALANDO POSTGRESQL 14"

if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    print_warning "PostgreSQL ya está instalado: $PSQL_VERSION"
else
    $SUDO sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | $SUDO apt-key add -
    $SUDO apt update
    $SUDO apt install -y postgresql-14 postgresql-contrib-14
    $SUDO systemctl start postgresql
    $SUDO systemctl enable postgresql
    print_success "PostgreSQL 14 instalado"
fi

# ============================================
# CONFIGURAR FIREWALL
# ============================================

print_step "CONFIGURANDO FIREWALL (UFW)"

if command -v ufw &> /dev/null; then
    $SUDO ufw allow 22/tcp   # SSH
    $SUDO ufw allow 80/tcp   # HTTP
    $SUDO ufw allow 443/tcp  # HTTPS
    
    # Activar UFW (con confirmación)
    echo "y" | $SUDO ufw enable
    
    print_success "Firewall configurado"
    $SUDO ufw status
else
    print_warning "UFW no está disponible, configurar firewall manualmente"
fi

# ============================================
# CONFIGURAR POSTGRESQL
# ============================================

print_step "CONFIGURANDO POSTGRESQL"

print_warning "Necesitas configurar PostgreSQL manualmente:"
echo ""
echo "1. Crear base de datos y usuario:"
echo "   sudo -u postgres psql"
echo "   CREATE DATABASE yavoy_db;"
echo "   CREATE USER yavoy_user WITH ENCRYPTED PASSWORD 'tu_password';"
echo "   GRANT ALL PRIVILEGES ON DATABASE yavoy_db TO yavoy_user;"
echo "   \q"
echo ""
echo "2. Aplicar esquema:"
echo "   psql -U yavoy_user -d yavoy_db -h localhost -f database-schema.sql"
echo ""
read -p "Presiona ENTER cuando hayas completado la configuración de PostgreSQL..."

# ============================================
# CLONAR PROYECTO
# ============================================

print_step "PREPARANDO PROYECTO"

if [ -d "$HOME/yavoy" ]; then
    print_warning "La carpeta ~/yavoy ya existe"
    read -p "¿Sobrescribir? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf $HOME/yavoy
    else
        print_error "Instalación cancelada"
        exit 1
    fi
fi

print_warning "Opciones de instalación:"
echo "1. Clonar desde Git"
echo "2. Ya subí los archivos via SCP (carpeta actual)"
read -p "Elige opción (1/2): " -n 1 -r
echo

if [[ $REPLY == "1" ]]; then
    read -p "URL del repositorio Git: " GIT_REPO
    git clone $GIT_REPO $HOME/yavoy
elif [[ $REPLY == "2" ]]; then
    if [ ! -d "./yavoy" ]; then
        print_error "No se encuentra la carpeta ./yavoy"
        exit 1
    fi
    cp -r ./yavoy $HOME/yavoy
fi

cd $HOME/yavoy
print_success "Proyecto en: $HOME/yavoy"

# ============================================
# INSTALAR DEPENDENCIAS NODE
# ============================================

print_step "INSTALANDO DEPENDENCIAS NODE.JS"
npm install --production
print_success "Dependencias instaladas"

# ============================================
# CONFIGURAR .ENV
# ============================================

print_step "CONFIGURANDO VARIABLES DE ENTORNO"

if [ -f .env ]; then
    print_warning ".env ya existe"
    read -p "¿Sobrescribir? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Usando .env existente"
    else
        cp .env.postgresql .env
        print_warning "Edita el archivo .env antes de continuar:"
        print_warning "  nano .env"
    fi
else
    cp .env.postgresql .env
    print_warning "Archivo .env creado desde plantilla"
    print_warning "DEBES editarlo antes de iniciar:"
    print_warning "  nano .env"
fi

read -p "Presiona ENTER cuando hayas configurado .env..."

# ============================================
# CREAR CARPETAS
# ============================================

print_step "CREANDO CARPETAS NECESARIAS"
mkdir -p logs
mkdir -p backups
print_success "Carpetas creadas"

# ============================================
# MIGRAR DATOS (OPCIONAL)
# ============================================

print_step "MIGRACIÓN DE DATOS"
read -p "¿Migrar datos de JSON a PostgreSQL? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run migrate:postgresql
    print_success "Datos migrados"
else
    print_warning "Migración omitida"
fi

# ============================================
# INICIAR CON PM2
# ============================================

print_step "INICIANDO APLICACIÓN CON PM2"
pm2 start ecosystem.config.js
pm2 save
print_success "Aplicación iniciada"

# Configurar PM2 para inicio automático
pm2 startup
print_warning "Ejecuta el comando que PM2 te muestra arriba (con sudo)"

# ============================================
# RESUMEN FINAL
# ============================================

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  ✅ INSTALACIÓN COMPLETADA                                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
print_success "Node.js: $(node -v)"
print_success "PM2: Aplicación corriendo"
print_success "Nginx: Instalado y activo"
print_success "PostgreSQL: Instalado"
print_success "Firewall: Configurado (22, 80, 443)"
echo ""
print_warning "PRÓXIMOS PASOS MANUALES:"
echo ""
echo "1. CONFIGURAR NGINX:"
echo "   sudo nano /etc/nginx/sites-available/yavoy"
echo "   (Ver DESPLIEGUE_HOSTINGER.md para config completa)"
echo ""
echo "2. ACTIVAR SITIO NGINX:"
echo "   sudo ln -s /etc/nginx/sites-available/yavoy /etc/nginx/sites-enabled/"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""
echo "3. CONFIGURAR SSL (Let's Encrypt):"
echo "   sudo certbot certonly --standalone -d tu_dominio.com"
echo ""
echo "4. VERIFICAR HEALTH CHECK:"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "5. VER LOGS:"
echo "   pm2 logs yavoy-enterprise"
echo ""
echo "📘 Documentación completa: DESPLIEGUE_HOSTINGER.md"
echo ""
