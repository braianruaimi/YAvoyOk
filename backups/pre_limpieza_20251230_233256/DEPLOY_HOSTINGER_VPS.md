# 🚀 YAvoy v3.1 - GUÍA DE DESPLIEGUE EN HOSTINGER VPS
> Arquitectura de Producción Profesional

---

## 📋 REQUISITOS PREVIOS

### En tu VPS de Hostinger:
- **Sistema Operativo:** Ubuntu 20.04+ / Debian 11+
- **RAM:** Mínimo 2GB (Recomendado: 4GB)
- **CPU:** 2 vCores mínimo
- **Almacenamiento:** 20GB+ SSD
- **Node.js:** v18.x o superior
- **PostgreSQL:** v14+ **O** MongoDB v5+
- **Nginx:** Como reverse proxy
- **Certbot:** Para certificados SSL (Let's Encrypt)

---

## 🔧 INSTALACIÓN PASO A PASO

### 1️⃣ Conectar a tu VPS

```bash
ssh root@tu-ip-del-vps
# O con tu usuario personalizado
ssh usuario@tu-ip-del-vps
```

### 2️⃣ Actualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

### 3️⃣ Instalar Node.js v18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Debe mostrar v18.x o superior
npm --version
```

### 4️⃣ Instalar PostgreSQL (Recomendado)

```bash
sudo apt install -y postgresql postgresql-contrib

# Configurar PostgreSQL
sudo -u postgres psql

# Dentro de psql:
CREATE DATABASE yavoy_prod;
CREATE USER yavoy_user WITH ENCRYPTED PASSWORD 'TU_PASSWORD_SEGURO_AQUI';
GRANT ALL PRIVILEGES ON DATABASE yavoy_prod TO yavoy_user;
\q
```

**Alternativa: MongoDB**

```bash
# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 5️⃣ Clonar Proyecto YAvoy

```bash
cd /var/www/
sudo mkdir -p yavoy
sudo chown -R $USER:$USER yavoy
cd yavoy

# Subir archivos (usar FTP, Git, o SCP)
# Ejemplo con SCP desde tu máquina local:
# scp -r /ruta/local/YAvoy_DEFINITIVO/* usuario@tu-ip:/var/www/yavoy/
```

### 6️⃣ Instalar Dependencias

```bash
cd /var/www/yavoy
npm install --production

# Instalar PM2 para mantener la app corriendo
sudo npm install -g pm2
```

### 7️⃣ Configurar Variables de Entorno

```bash
cd /var/www/yavoy
cp .env.production .env
nano .env
```

**Edita el archivo `.env` con tus datos:**

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Base de Datos
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yavoy_prod
DB_USER=yavoy_user
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI

# JWT
JWT_SECRET=$(openssl rand -base64 64)  # Genera uno seguro
JWT_EXPIRES_IN=7d

# Email
SMTP_USER=yavoyen5@gmail.com
SMTP_PASS=TU_APP_PASSWORD_DE_GMAIL

# Origenes permitidos
ALLOWED_ORIGINS=https://yavoy.com,https://www.yavoy.com

# MercadoPago (Producción)
MERCADOPAGO_ACCESS_TOKEN=TU_ACCESS_TOKEN_PRODUCCION
MERCADOPAGO_PUBLIC_KEY=TU_PUBLIC_KEY_PRODUCCION
```

Guarda con `Ctrl+O`, Enter, `Ctrl+X`

### 8️⃣ Ejecutar Migración de Datos

```bash
cd /var/www/yavoy
node migrate-json-to-db.js
```

Verifica que se migren todos los datos exitosamente.

### 9️⃣ Iniciar Aplicación con PM2

```bash
cd /var/www/yavoy
pm2 start server.js --name yavoy-api --max-memory-restart 500M

# Configurar para que se inicie automáticamente al reiniciar el servidor
pm2 startup
pm2 save

# Ver logs
pm2 logs yavoy-api
pm2 status
```

### 🔟 Configurar Nginx como Reverse Proxy

```bash
sudo apt install -y nginx

# Crear configuración del sitio
sudo nano /etc/nginx/sites-available/yavoy
```

**Pega la siguiente configuración:**

```nginx
server {
    listen 80;
    server_name yavoy.com www.yavoy.com;

    # Limite de tamaño de archivos (para fotos)
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSockets Support
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # Archivos estáticos (opcional)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Activar sitio:**

```bash
sudo ln -s /etc/nginx/sites-available/yavoy /etc/nginx/sites-enabled/
sudo nginx -t  # Verificar configuración
sudo systemctl restart nginx
```

### 1️⃣1️⃣ Instalar Certificado SSL (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL gratis de Let's Encrypt
sudo certbot --nginx -d yavoy.com -d www.yavoy.com

# Seguir instrucciones en pantalla
# Renovación automática cada 90 días
sudo systemctl status certbot.timer
```

---

## 🔒 SEGURIDAD ADICIONAL

### Configurar Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### Cambiar Puerto SSH (Opcional)

```bash
sudo nano /etc/ssh/sshd_config
# Cambiar Port 22 a Port 2222 (o cualquier otro)
sudo systemctl restart sshd
```

### Fail2Ban (Protección contra fuerza bruta)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 📊 MONITOREO Y MANTENIMIENTO

### Ver logs de la aplicación

```bash
pm2 logs yavoy-api
pm2 logs yavoy-api --lines 100
```

### Ver estado de la aplicación

```bash
pm2 status
pm2 monit  # Monitor interactivo
```

### Reiniciar aplicación

```bash
pm2 restart yavoy-api
```

### Actualizar código

```bash
cd /var/www/yavoy
git pull origin main  # Si usas Git
npm install --production
pm2 restart yavoy-api
```

### Backups de Base de Datos

**PostgreSQL:**

```bash
# Crear backup
pg_dump -U yavoy_user yavoy_prod > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U yavoy_user yavoy_prod < backup_20250101.sql
```

**MongoDB:**

```bash
# Crear backup
mongodump --db yavoy_prod --out /var/backups/mongo/$(date +%Y%m%d)

# Restaurar backup
mongorestore --db yavoy_prod /var/backups/mongo/20250101/yavoy_prod
```

---

## 🚀 OPTIMIZACIONES DE RENDIMIENTO

### 1. Redis para Caché (Opcional)

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
```

Actualiza `.env`:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 2. Compresión Gzip en Nginx

Edita `/etc/nginx/nginx.conf`:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

Reinicia Nginx: `sudo systemctl restart nginx`

### 3. PM2 Cluster Mode

```bash
pm2 delete yavoy-api
pm2 start server.js --name yavoy-api -i max  # Usa todos los CPU cores
pm2 save
```

---

## 🔍 VERIFICACIÓN DE DESPLIEGUE

### 1. Verificar que la API responde

```bash
curl http://localhost:3000/api/ping
# Debe responder: {"success":true,"message":"Servidor YAvoy v3.1 funcionando"}
```

### 2. Verificar Base de Datos

```bash
# PostgreSQL
psql -U yavoy_user -d yavoy_prod -c "SELECT COUNT(*) FROM comercios;"

# MongoDB
mongosh yavoy_prod --eval "db.comercios.countDocuments()"
```

### 3. Verificar desde Internet

Abre en tu navegador:
- `https://yavoy.com` → Debe cargar el index.html
- `https://yavoy.com/api/ping` → Debe responder JSON

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: Puerto ya en uso

```bash
sudo lsof -ti:3000 | xargs kill -9
pm2 restart yavoy-api
```

### Error: Base de datos no conecta

```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Error: Nginx 502 Bad Gateway

```bash
# Verificar que la app esté corriendo
pm2 status

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

### Reiniciar todo el stack

```bash
pm2 restart yavoy-api
sudo systemctl restart postgresql
sudo systemctl restart nginx
```

---

## 📞 SOPORTE

**Documentación adicional:**
- [README.md](./README.md)
- [RESUMEN_EJECUTIVO.md](./RESUMEN_EJECUTIVO.md)
- [INICIO_RAPIDO.md](./INICIO_RAPIDO_SEGURIDAD.md)

**Desarrollado por:** YAvoy Dev Team  
**Versión:** 3.1.0  
**Fecha:** Diciembre 2025

---

## 🎉 ¡LISTO PARA PRODUCCIÓN!

Tu aplicación YAvoy ahora está corriendo en un VPS profesional con:

✅ Base de datos real (PostgreSQL/MongoDB)  
✅ SSL/HTTPS configurado  
✅ Reverse proxy con Nginx  
✅ PM2 para alta disponibilidad  
✅ WebSockets optimizados por ciudad  
✅ Rate limiting y seguridad avanzada  
✅ Geofencing con asignación inteligente  
✅ Backups automáticos  

**¡A destruir la competencia! 🚀🔥**
