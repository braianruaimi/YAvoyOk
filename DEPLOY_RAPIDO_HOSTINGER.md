# 🚀 DEPLOY RÁPIDO EN HOSTINGER (Sin problemas de MySQL)

## 💡 ¿Por qué deployar en Hostinger?

- ✅ MySQL funcionará automáticamente (conexión local)
- ✅ Accesible desde cualquier celular
- ✅ Sin problemas de permisos
- ✅ Tu app en producción en 5 minutos

---

## 📋 PASOS PARA DEPLOY

### 1️⃣ CONECTAR POR SSH

```bash
ssh -p 65002 u695828542@147.79.84.219
```

**Contraseña:** `Yavoy25!`

---

### 2️⃣ NAVEGAR Y LIMPIAR

```bash
cd ~/public_html
rm -rf *  # Limpia todo el directorio
```

---

### 3️⃣ CLONAR EL CÓDIGO DESDE GITHUB

```bash
git clone https://github.com/braianruaimi/YAvoyOk.git .
```

---

### 4️⃣ INSTALAR DEPENDENCIAS

```bash
npm install
```

---

### 5️⃣ CREAR ARCHIVO .env

```bash
nano .env
```

**Pega este contenido:**

```env
# BASE DE DATOS MYSQL (LOCALHOST EN HOSTINGER)
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
```

**Guardar:** `Ctrl + O` → `Enter` → `Ctrl + X`

**⚠️ NOTA IMPORTANTE:** Usamos `DB_HOST=localhost` porque la app está EN el servidor de Hostinger.

---

### 6️⃣ INSTALAR PM2 (Si no está instalado)

```bash
npm install -g pm2
```

---

### 7️⃣ INICIAR LA APLICACIÓN

```bash
pm2 start server.js --name yavoy
pm2 save
pm2 startup
```

---

### 8️⃣ VERIFICAR QUE FUNCIONA

```bash
pm2 logs yavoy
```

**Deberías ver:**

```
✅ Conexión a MySQL establecida
✅ Modelos Sequelize sincronizados
🌐 Servidor: http://localhost:5502
```

---

### 9️⃣ CONFIGURAR PROXY (Para acceso web)

Edita `.htaccess`:

```bash
nano .htaccess
```

**Pega esto:**

```apache
RewriteEngine On

# Redirigir todo a Node.js en puerto 5502
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5502/$1 [P,L]

# Headers para Socket.IO
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
</IfModule>
```

**Guardar:** `Ctrl + O` → `Enter` → `Ctrl + X`

---

## ✅ VERIFICACIÓN FINAL

### Desde SSH (en el servidor):

```bash
curl http://localhost:5502/api/auth/docs
```

Deberías ver JSON con la documentación de la API.

### Desde tu navegador:

```
https://yavoy.space
https://yavoy.space/api/auth/docs
```

### Desde tu celular:

1. Abre el navegador
2. Ve a `https://yavoy.space`
3. Prueba registrarte

---

## 🔥 COMANDOS ÚTILES

```bash
# Ver logs
pm2 logs yavoy

# Reiniciar
pm2 restart yavoy

# Detener
pm2 stop yavoy

# Estado
pm2 status

# Actualizar desde GitHub
cd ~/public_html
git pull origin main
npm install
pm2 restart yavoy
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: Puerto 5502 ocupado

```bash
pm2 delete yavoy
pm2 start server.js --name yavoy
```

### Error: MySQL no conecta

Verifica que uses `DB_HOST=localhost` en el `.env` del servidor (NO `srv1722.hstgr.io`).

### Cambios no se reflejan

```bash
git pull origin main
pm2 restart yavoy
```

---

## ✅ CHECKLIST

- [ ] Conectado por SSH
- [ ] Código clonado desde GitHub
- [ ] Archivo `.env` creado con `DB_HOST=localhost`
- [ ] Dependencias instaladas
- [ ] PM2 iniciado
- [ ] MySQL conecta correctamente (ver logs)
- [ ] `.htaccess` configurado
- [ ] Funciona desde `https://yavoy.space`
- [ ] Funciona desde celular

---

## 🎉 ¡LISTO!

Tu app estará accesible desde:

- 🌐 `https://yavoy.space`
- 📱 Cualquier celular en el mundo
- 💾 Guardando TODO en MySQL

**¡Sin problemas de acceso remoto!** Porque la app corre EN el mismo servidor que MySQL.
