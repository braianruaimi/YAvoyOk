# 🚀 DESPLEGAR YAVOY EN HOSTINGER - ACCESO PÚBLICO DESDE CELULARES

## 📋 ESTADO ACTUAL

✅ Servidor funcionando localmente en `localhost:5502`
✅ MySQL configurado (con fallback a JSON si falla)
✅ CORS configurado para yavoy.space
⚠️ Necesita deployment en Hostinger para acceso público

---

## 🎯 PASOS PARA DEPLOYMENT EN HOSTINGER

### 1️⃣ CONECTAR POR SSH A HOSTINGER

```bash
ssh -p 65002 u695828542@147.79.84.219
# Contraseña: Yavoy25!
```

### 2️⃣ NAVEGAR AL DIRECTORIO PUBLIC_HTML

```bash
cd ~/public_html
```

### 3️⃣ SINCRONIZAR CÓDIGO DESDE GITHUB

```bash
# Si es primera vez, clonar el repositorio
git clone https://github.com/braianruaimi/YAvoyOk.git .

# Si ya existe, hacer pull
git pull origin main
```

### 4️⃣ INSTALAR DEPENDENCIAS

```bash
npm install
```

### 5️⃣ CONFIGURAR VARIABLES DE ENTORNO

Crear archivo `.env` en el servidor:

```bash
nano .env
```

Copiar este contenido (ajustar si es necesario):

```env
# BASE DE DATOS MYSQL HOSTINGER
DB_HOST=srv1722.hstgr.io
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
```

Guardar: `Ctrl + O`, `Enter`, `Ctrl + X`

### 6️⃣ CONFIGURAR ACCESO REMOTO A MYSQL

**IMPORTANTE:** Para que MySQL funcione desde Hostinger, necesitas permitir el acceso remoto:

1. Ve al panel de Hostinger: https://hpanel.hostinger.com
2. Navega a: **Databases** → **Remote MySQL**
3. Agrega la IP del servidor Hostinger o usa `%` (cualquier IP)
4. Guarda los cambios

Alternativamente, si estás usando phpMyAdmin:

```sql
-- Desde phpMyAdmin en Hostinger
GRANT ALL PRIVILEGES ON u695828542_yavoy_web.*
TO 'u695828542_yavoyen5'@'%'
IDENTIFIED BY 'Yavoy25!';
FLUSH PRIVILEGES;
```

### 7️⃣ INICIAR EL SERVIDOR CON PM2

```bash
# Instalar PM2 si no está instalado
npm install -g pm2

# Iniciar el servidor
pm2 start server.js --name yavoy

# Ver logs
pm2 logs yavoy

# Verificar estado
pm2 status
```

### 8️⃣ CONFIGURAR PM2 PARA AUTO-INICIO

```bash
# Guardar configuración actual
pm2 save

# Configurar inicio automático
pm2 startup
# Ejecutar el comando que te muestre PM2
```

### 9️⃣ CONFIGURAR PROXY REVERSO (OPCIONAL)

Si usas Apache, crea/edita `.htaccess` en `public_html`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5502/$1 [P,L]
```

Si usas Nginx, edita la configuración del sitio:

```nginx
location / {
    proxy_pass http://localhost:5502;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

## 🔍 VERIFICACIÓN

### Verificar que el servidor está corriendo:

```bash
pm2 status
```

### Probar desde el navegador:

```
https://yavoy.space
https://yavoy.space/api/auth/docs
```

### Probar desde tu celular:

1. Abre el navegador en tu celular
2. Ve a: `https://yavoy.space`
3. Intenta registrarte como comercio o repartidor

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: MySQL Access Denied

**Solución:** Verifica que el usuario MySQL tenga permisos desde la IP de Hostinger:

```bash
# Conectar por SSH
ssh -p 65002 u695828542@147.79.84.219

# Ver la IP del servidor
curl ifconfig.me

# Agregar esa IP en Hostinger Panel → Remote MySQL
```

### Servidor no inicia

```bash
# Ver logs detallados
pm2 logs yavoy --lines 100

# Reiniciar servidor
pm2 restart yavoy
```

### Puerto 5502 ocupado

```bash
# Ver qué proceso usa el puerto
lsof -i :5502

# Matar el proceso
pm2 delete yavoy
pm2 start server.js --name yavoy
```

---

## 📱 ACCESO DESDE CELULARES

Una vez desplegado en Hostinger, **cualquier persona** podrá acceder desde su celular usando:

- URL Web: `https://yavoy.space`
- URL API: `https://yavoy.space/api`

**Endpoints principales:**

- Registro comercio: `POST https://yavoy.space/api/auth/register/comercio`
- Registro repartidor: `POST https://yavoy.space/api/auth/register/repartidor`
- Login: `POST https://yavoy.space/api/auth/login`

---

## 🔐 SEGURIDAD ADICIONAL

### 1. Configurar HTTPS (SSL)

Hostinger incluye SSL gratuito. Verifica que esté activo:

- Panel Hostinger → SSL → Activar Let's Encrypt

### 2. Configurar Firewall

```bash
# Solo si tienes acceso root (VPS)
ufw allow 5502
ufw allow 80
ufw allow 443
ufw enable
```

### 3. Actualizar contraseñas

Cambia las contraseñas por defecto en `.env`:

- JWT_SECRET
- SESSION_SECRET
- DB_PASSWORD (en el panel de Hostinger)

---

## ✅ CHECKLIST FINAL

- [ ] Código sincronizado desde GitHub
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env` configurado
- [ ] MySQL acceso remoto habilitado
- [ ] PM2 iniciado y guardado
- [ ] SSL/HTTPS activo
- [ ] Probado desde navegador web
- [ ] Probado desde celular
- [ ] Endpoints funcionando correctamente

---

## 📞 SOPORTE

Si tienes problemas con el deployment:

1. Revisa los logs: `pm2 logs yavoy`
2. Verifica estado: `pm2 status`
3. Reinicia: `pm2 restart yavoy`

**¡Tu app YAvoy estará accesible desde cualquier celular en el mundo!** 🌎📱
