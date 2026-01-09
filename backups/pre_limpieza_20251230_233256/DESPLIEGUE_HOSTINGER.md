# 🚀 GUÍA DE DESPLIEGUE EN HOSTINGER VPS

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Preparación del VPS](#preparación-del-vps)
3. [Instalación de Dependencias](#instalación-de-dependencias)
4. [Configuración de PostgreSQL](#configuración-de-postgresql)
5. [Configuración de la Aplicación](#configuración-de-la-aplicación)
6. [Configuración de Nginx](#configuración-de-nginx)
7. [Configuración de PM2](#configuración-de-pm2)
8. [SSL con Let's Encrypt](#ssl-con-lets-encrypt)
9. [Backup Automático](#backup-automático)
10. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Requisitos Previos

### VPS Hostinger Recomendado
- **Plan**: VPS 2 o superior
- **RAM**: Mínimo 4GB (8GB recomendado)
- **Disco**: Mínimo 50GB SSD
- **CPU**: 2 cores mínimo
- **OS**: Ubuntu 22.04 LTS

### Conocimientos Necesarios
- ✅ SSH básico
- ✅ Linux command line
- ✅ Conceptos de Node.js y PM2
- ✅ Nginx básico
- ✅ PostgreSQL básico

---

## 🖥️ Preparación del VPS

### 1. Conectar via SSH

```bash
ssh root@TU_IP_DEL_VPS
```

### 2. Actualizar Sistema

```bash
apt update && apt upgrade -y
apt install -y curl wget git build-essential
```

### 3. Crear Usuario para la Aplicación

```bash
# Crear usuario 'yavoy' (no usar root en producción)
adduser yavoy
usermod -aG sudo yavoy

# Cambiar a usuario yavoy
su - yavoy
```

### 4. Configurar Firewall

```bash
# Instalar UFW si no está
sudo apt install -y ufw

# Configurar reglas
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 3000/tcp    # Node.js (solo para testing, cerrar después)

# Activar firewall
sudo ufw enable
sudo ufw status
```

---

## 📦 Instalación de Dependencias

### 1. Instalar Node.js v18 LTS

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Instalar Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verificar
node --version  # Debe mostrar v18.x.x
npm --version
```

### 2. Instalar PM2 (Process Manager)

```bash
npm install -g pm2

# Configurar PM2 para inicio automático
pm2 startup
sudo env PATH=$PATH:/home/yavoy/.nvm/versions/node/v18.x.x/bin pm2 startup systemd -u yavoy --hp /home/yavoy
```

### 3. Instalar Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Instalar PostgreSQL 14

```bash
# Agregar repositorio oficial
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

sudo apt update
sudo apt install -y postgresql-14 postgresql-contrib-14

# Iniciar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## 🗄️ Configuración de PostgreSQL

### 1. Crear Base de Datos y Usuario

```bash
# Entrar a PostgreSQL
sudo -u postgres psql

# Dentro de psql:
CREATE DATABASE yavoy_db;
CREATE USER yavoy_user WITH ENCRYPTED PASSWORD 'TU_PASSWORD_SEGURO_AQUI';
GRANT ALL PRIVILEGES ON DATABASE yavoy_db TO yavoy_user;
\q
```

### 2. Configurar Acceso Local

```bash
# Editar pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Agregar esta línea (antes de las otras reglas):
# local   yavoy_db   yavoy_user   md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### 3. Optimizar para Producción

```bash
# Editar postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Ajustar estos valores según tu VPS:
# shared_buffers = 1GB                # 25% de RAM total
# effective_cache_size = 3GB          # 75% de RAM total
# work_mem = 50MB
# maintenance_work_mem = 256MB
# max_connections = 100
# checkpoint_completion_target = 0.9

# Reiniciar
sudo systemctl restart postgresql
```

---

## ⚙️ Configuración de la Aplicación

### 1. Clonar o Subir el Proyecto

**Opción A: Via Git (recomendado)**

```bash
cd ~
git clone https://github.com/TU_USUARIO/yavoy.git
cd yavoy
```

**Opción B: Via SCP**

```bash
# En tu PC local:
scp -r c:\Users\cdaim\OneDrive\Desktop\YAvoy_DEFINITIVO yavoy@TU_IP:/home/yavoy/yavoy
```

### 2. Instalar Dependencias Node.js

```bash
cd ~/yavoy
npm install --production

# Instalar dependencias adicionales para producción
npm install winston winston-daily-rotate-file
```

### 3. Configurar Variables de Entorno

```bash
# Copiar template
cp .env.postgresql .env

# Editar con nano o vim
nano .env
```

**Configuración mínima .env:**

```env
NODE_ENV=production
PORT=3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yavoy_db
DB_USER=yavoy_user
DB_PASSWORD=TU_PASSWORD_POSTGRESQL_REAL

# JWT (generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=TU_JWT_SECRET_ALEATORIO_64_CARACTERES_MINIMO

# CORS (tu dominio real)
CORS_ORIGIN=https://yavoy.com,https://www.yavoy.com
ALLOWED_ORIGINS=https://yavoy.com,https://www.yavoy.com

# MercadoPago (credenciales reales)
MERCADOPAGO_PUBLIC_KEY=APP_USR-XXXXXXXX-XXXXXX-XXXXXXXX-XXXXXXXX
MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXX-XXXXXX-XXXXXXXXXXXXXXXXXXXX-XXXXXXXX

# Proxy (CRÍTICO para Nginx)
TRUST_PROXY=1

# Email para alertas
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_app_password_gmail
ADMIN_EMAIL=admin@tu_dominio.com
```

### 4. Aplicar Esquema de Base de Datos

```bash
# Aplicar schema
psql -U yavoy_user -d yavoy_db -h localhost -f database-schema.sql

# Verificar tablas creadas
psql -U yavoy_user -d yavoy_db -h localhost -c "\dt"
```

### 5. Migrar Datos (si vienes de JSON)

```bash
npm run migrate:postgresql
```

### 6. Crear Carpeta de Logs

```bash
mkdir -p logs
chmod 755 logs
```

---

## 🌐 Configuración de Nginx

### 1. Crear Configuración del Sitio

```bash
sudo nano /etc/nginx/sites-available/yavoy
```

**Contenido:**

```nginx
# ============================================
# YAvoy v3.1 Enterprise - Nginx Config
# ============================================

# Upstream para Node.js
upstream yavoy_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

# Redirect HTTP -> HTTPS
server {
    listen 80;
    server_name yavoy.com www.yavoy.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yavoy.com www.yavoy.com;

    # SSL Certificates (se configuran después con certbot)
    ssl_certificate /etc/letsencrypt/live/yavoy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yavoy.com/privkey.pem;
    
    # SSL Configuration (Mozilla Modern Config)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Logs
    access_log /var/log/nginx/yavoy_access.log;
    error_log /var/log/nginx/yavoy_error.log;
    
    # Max upload size
    client_max_body_size 10M;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss;
    
    # Root for static files
    root /home/yavoy/yavoy;
    
    # Health check (sin rate limit)
    location = /api/health {
        proxy_pass http://yavoy_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API Endpoints (con rate limiting)
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://yavoy_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSockets (sin rate limit)
    location /socket.io/ {
        proxy_pass http://yavoy_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts largos para WebSockets
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
    
    # Static files (cache 1 año)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # HTML files (sin cache)
    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri =404;
    }
    
    # Root y otras rutas
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 2. Activar Sitio

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/yavoy /etc/nginx/sites-enabled/

# Eliminar sitio default si existe
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Si todo está OK, recargar
sudo systemctl reload nginx
```

---

## 🔄 Configuración de PM2

### 1. Crear Archivo ecosystem.config.js

```bash
nano ~/yavoy/ecosystem.config.js
```

**Contenido:**

```javascript
module.exports = {
  apps: [{
    name: 'yavoy-enterprise',
    script: './server-enterprise.js',
    instances: 'max', // Usar todos los cores disponibles
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 10000,
    // Health check
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};
```

### 2. Iniciar con PM2

```bash
cd ~/yavoy

# Iniciar aplicación
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Ver logs
pm2 logs yavoy-enterprise

# Ver estado
pm2 status
pm2 monit
```

### 3. Comandos Útiles PM2

```bash
# Reiniciar
pm2 restart yavoy-enterprise

# Detener
pm2 stop yavoy-enterprise

# Reload sin downtime (graceful)
pm2 reload yavoy-enterprise

# Ver logs en tiempo real
pm2 logs --lines 100

# Limpiar logs
pm2 flush
```

---

## 🔒 SSL con Let's Encrypt

### 1. Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtener Certificado

```bash
# Detener Nginx temporalmente
sudo systemctl stop nginx

# Obtener certificado
sudo certbot certonly --standalone -d yavoy.com -d www.yavoy.com --email tu_email@gmail.com --agree-tos

# Reiniciar Nginx
sudo systemctl start nginx
```

### 3. Configurar Renovación Automática

```bash
# Testear renovación
sudo certbot renew --dry-run

# Certbot ya configura un cron automáticamente en:
# /etc/cron.d/certbot

# Verificar cron
sudo cat /etc/cron.d/certbot
```

---

## 💾 Backup Automático

### 1. Crear Script de Backup

```bash
sudo nano /usr/local/bin/yavoy-backup.sh
```

**Contenido:**

```bash
#!/bin/bash
# YAvoy v3.1 - Backup Automático

BACKUP_DIR="/var/backups/yavoy"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="yavoy_db"
DB_USER="yavoy_user"
RETENTION_DAYS=7

# Crear carpeta si no existe
mkdir -p $BACKUP_DIR

# Backup de PostgreSQL
echo "🔄 Iniciando backup de PostgreSQL..."
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Backup de archivos de la aplicación (sin node_modules)
echo "🔄 Iniciando backup de archivos..."
tar -czf $BACKUP_DIR/app_$TIMESTAMP.tar.gz \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='*.log' \
    -C /home/yavoy yavoy

# Eliminar backups antiguos
echo "🗑️  Eliminando backups de más de $RETENTION_DAYS días..."
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completado: $BACKUP_DIR"
```

```bash
# Dar permisos de ejecución
sudo chmod +x /usr/local/bin/yavoy-backup.sh
```

### 2. Configurar Cron para Backup Diario

```bash
# Editar crontab
sudo crontab -e

# Agregar esta línea (backup diario a las 2 AM)
0 2 * * * /usr/local/bin/yavoy-backup.sh >> /var/log/yavoy-backup.log 2>&1
```

### 3. Restaurar Backup

```bash
# Restaurar base de datos
gunzip -c /var/backups/yavoy/db_20251221_020000.sql.gz | psql -U yavoy_user -d yavoy_db

# Restaurar archivos
tar -xzf /var/backups/yavoy/app_20251221_020000.tar.gz -C /home/yavoy/
```

---

## 📊 Monitoreo y Mantenimiento

### 1. Monitoreo con PM2 Plus (Opcional)

```bash
pm2 link XXXXXXXXX YYYYYYYY yavoy-production
```

### 2. Logs

```bash
# Logs de aplicación (Winston)
tail -f ~/yavoy/logs/combined-$(date +%Y-%m-%d).log
tail -f ~/yavoy/logs/error-$(date +%Y-%m-%d).log

# Logs de PM2
pm2 logs

# Logs de Nginx
sudo tail -f /var/log/nginx/yavoy_access.log
sudo tail -f /var/log/nginx/yavoy_error.log

# Logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 3. Health Checks

```bash
# Verificar aplicación
curl https://yavoy.com/api/health

# Debería responder:
# {
#   "status": "healthy",
#   "checks": {
#     "database": { "status": "healthy" },
#     "websockets": { "status": "healthy" }
#   }
# }
```

### 4. Limpieza de Logs Antiguos

```bash
# Crear script
sudo nano /usr/local/bin/clean-logs.sh
```

```bash
#!/bin/bash
# Limpiar logs de más de 30 días
find /home/yavoy/yavoy/logs -name "*.log" -mtime +30 -delete
find /var/log/nginx -name "*.log.*" -mtime +30 -delete
echo "✅ Logs antiguos eliminados"
```

```bash
sudo chmod +x /usr/local/bin/clean-logs.sh

# Agregar a cron (cada domingo a las 3 AM)
sudo crontab -e
# 0 3 * * 0 /usr/local/bin/clean-logs.sh
```

---

## 🔧 Troubleshooting

### Problema: Aplicación no inicia

```bash
# Ver logs de PM2
pm2 logs yavoy-enterprise --lines 100

# Ver errores de Node.js
node server-enterprise.js
```

### Problema: PostgreSQL no acepta conexiones

```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Verificar conexión
psql -U yavoy_user -d yavoy_db -h localhost

# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Problema: Nginx retorna 502 Bad Gateway

```bash
# Verificar que Node.js está corriendo
pm2 status

# Verificar puerto 3000
netstat -tulpn | grep 3000

# Ver logs de Nginx
sudo tail -f /var/log/nginx/yavoy_error.log
```

### Problema: SSL no funciona

```bash
# Verificar certificados
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --force-renewal

# Ver logs de certbot
sudo cat /var/log/letsencrypt/letsencrypt.log
```

### Problema: Rate limiting muy estricto

```bash
# Editar límites en Nginx
sudo nano /etc/nginx/sites-available/yavoy

# Buscar: limit_req zone=api_limit burst=20
# Cambiar burst a 50 o 100 según necesidad

sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Checklist Final

Antes de poner en producción, verificar:

- [ ] PostgreSQL corriendo y con datos migrados
- [ ] Variables de entorno configuradas (.env con valores reales)
- [ ] PM2 iniciado y guardado (pm2 save)
- [ ] Nginx configurado y SSL activo
- [ ] Firewall configurado (UFW)
- [ ] Backup automático configurado (cron)
- [ ] Health check respondiendo 200 OK
- [ ] Logs rotando correctamente
- [ ] DNS apuntando al VPS
- [ ] MercadoPago/AstroPay configurados
- [ ] Email de alertas configurado

---

## 📞 Soporte

**Documentación relacionada:**
- [CIRUGIA_CORAZON_ABIERTO.md](CIRUGIA_CORAZON_ABIERTO.md)
- [GUIA_MIGRACION_POSTGRESQL.md](GUIA_MIGRACION_POSTGRESQL.md)
- [database-schema.sql](database-schema.sql)

**Comandos rápidos de diagnóstico:**
```bash
pm2 status && sudo systemctl status nginx && sudo systemctl status postgresql
curl -I https://yavoy.com/api/health
pm2 logs --lines 50
```

---

**Documentado por:** Principal Software Engineer Team  
**Última actualización:** 21 de diciembre de 2025  
**Versión:** YAvoy v3.1.0-enterprise
