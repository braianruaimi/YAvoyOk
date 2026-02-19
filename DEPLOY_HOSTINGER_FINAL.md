# 🚀 GUÍA DE DEPLOYMENT FINAL - HOSTINGER

## ✅ CONFIGURACIÓN COMPLETADA

```
✅ MercadoPago - Access Token, Public Key, Webhook Secret
✅ Email Gmail - yavoyen5@gmail.com con App Password
✅ Base de datos MySQL - u695828542_YAvoyOk26
✅ JWT Secrets configurados
✅ VAPID Keys configurados
✅ Código en GitHub
```

---

## 📋 INFORMACIÓN DE ACCESO HOSTINGER

```
🌐 Dominio: yavoy.space
🔑 Usuario SSH: u695828542
🖥️  Host: 147.79.84.219
🔌 Puerto SSH: 65002
📂 Directorio: /home/u695828542/public_html
```

---

## 🚀 OPCIÓN 1: DEPLOYMENT VÍA SSH (RECOMENDADO)

### **PASO 1: Conectar por SSH**

**Desde PowerShell o Git Bash:**

```bash
ssh -p 65002 u695828542@147.79.84.219
```

Ingresa tu contraseña de Hostinger cuando te la pida.

---

### **PASO 2: Navegar al directorio web**

```bash
cd public_html
```

---

### **PASO 3: Clonar el repositorio desde GitHub**

```bash
# Si ya existe código antiguo, hacer backup
mv public_html public_html_backup_$(date +%Y%m%d) 2>/dev/null

# Clonar repositorio
git clone https://github.com/braianruaimi/YAvoyOk.git .
```

**Nota:** El punto (.) al final es importante, clona en el directorio actual.

---

### **PASO 4: Crear archivo .env de producción**

```bash
nano .env
```

Copiar y pegar **EXACTAMENTE** este contenido:

```env
# BASE DE DATOS MYSQL HOSTINGER
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u695828542_YAvoyOk26
DB_USER=u695828542_ssh
DB_PASSWORD=Yavoy26!
DB_POOL_MIN=2
DB_POOL_MAX=20

# SEGURIDAD
NODE_ENV=production
PORT=5502
WS_PORT=5501
JWT_SECRET=a7b9c5d8e1f2g3h4i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5
JWT_EXPIRES_IN=24h
SESSION_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8t7s6r5q4p3o2n1m0l9k8j7i6h5g4f3e2d1c0b9a8z7y6x5w4v3u2t1s0r9q8p7o6n5m4l3k2j1i0h9g8f7e6d5c4b3a2z1y0x9w8v7u6t5s4r3q2p1o0n9m8l7k6j5i4h3g2f1e0d9c8b7a6z5y4x3w2v1u0t9s8r7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a0

# MERCADOPAGO
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1669843029634117-021901-044acdd220c1e28bddc123272f9031a4-2691839466
MERCADOPAGO_PUBLIC_KEY=APP_USR-c77b3180-f0c7-4a98-9cc9-ba06142251af
MERCADOPAGO_WEBHOOK_SECRET=404dcf91f249a7c24da374d93cd9ccebc00ce10d1a912721cf19fd1ea6d95ee8

# CORS
ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space,http://yavoy.space,http://www.yavoy.space

# EMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yavoyen5@gmail.com
SMTP_PASS=ldbe jejw mwno vkal
SMTP_SECURE=false
SMTP_TLS=true

# VAPID
VAPID_PUBLIC_KEY=BArHtk-2oHn3uS9-G3x9JQHxBSznJNsAbyX8kvbruTAy3vSCwrDniZKJq8zZLU592XblBVJjZz82q7I-7mGmBts
VAPID_PRIVATE_KEY=CaRPt_eELXSGntML7NeeLkEYWG0ofydj6ivEyegFY5s
VAPID_SUBJECT=mailto:yavoyen5@gmail.com

# DOMINIO
FRONTEND_URL=https://yavoy.space
API_URL=https://yavoy.space/api
WEBSOCKET_URL=https://yavoy.space

# LOGGING
LOG_LEVEL=info
LOG_FILE=logs/yavoy.log
ERROR_LOG_FILE=logs/error.log
ACCESS_LOG_FILE=logs/access.log

# SEGURIDAD
CSRF_SECRET=YAvoy2026_CSRF_Enterprise_Protection
ENCRYPT_SECRET=YAvoy2026_Encryption_Master_Key
CEO_RATE_LIMIT_MAX=10
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=1800000
```

**Guardar:** `Ctrl + X` → `Y` → `Enter`

---

### **PASO 5: Instalar dependencias**

```bash
# Verificar versión de Node.js (debe ser v18+)
node --version

# Instalar dependencias de producción
npm install --production

# Ver progreso
npm list --depth=0
```

---

### **PASO 6: Crear directorios necesarios**

```bash
mkdir -p logs backup uploads
chmod 755 logs backup uploads
```

---

### **PASO 7: Iniciar con PM2**

```bash
# Instalar PM2 globalmente (si no está instalado)
npm install -g pm2

# Iniciar la aplicación
pm2 start server.js --name yavoy

# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs yavoy --lines 50
```

---

### **PASO 8: Configurar auto-inicio**

```bash
# Guardar configuración actual
pm2 save

# Configurar PM2 para auto-iniciar
pm2 startup

# Copiar y ejecutar el comando que PM2 te muestre
```

---

### **PASO 9: Verificar funcionamiento**

```bash
# Ver logs
pm2 logs yavoy

# Ver métricas
pm2 monit

# Probar endpoints
curl http://localhost:5502/api/health
curl http://localhost:5502/api/test
```

---

## 🌐 OPCIÓN 2: DEPLOYMENT MANUAL (FileZilla/WinSCP)

### **PASO 1: Conectar con SFTP**

**En FileZilla o WinSCP:**

```
Host: sftp://147.79.84.219
Port: 65002
Username: u695828542
Password: [Tu contraseña de Hostinger]
```

---

### **PASO 2: Subir archivos**

**Subir estos archivos/carpetas A `/home/u695828542/public_html`:**

```
✅ server.js
✅ package.json
✅ config/
✅ models/
✅ src/
✅ public/
✅ *.html (todos los archivos HTML)
✅ *.css
✅ *.js (frontend)
✅ sw.js
✅ manifest.json

❌ NO subir:
   - node_modules/
   - .git/
   - .env (crear manualmente en servidor)
   - logs/
   - backups/
```

---

### **PASO 3: Crear .env**

Usar el **File Manager de Hostinger** o conectar por SSH y crear el archivo `.env` como se indica en la Opción 1.

---

### **PASO 4: Instalar y arrancar**

Seguir pasos 5-8 de la Opción 1.

---

## ✅ VERIFICACIÓN POST-DEPLOYMENT

### **1. Verificar que el servidor esté corriendo**

```bash
pm2 status
# Debería mostrar: yavoy | online
```

---

### **2. Verificar logs sin errores**

```bash
pm2 logs yavoy --lines 100
```

**Buscar estas líneas:**

```
✅ Conexión a MySQL establecida
✅ Servidor Express corriendo en puerto 5502
✅ WebSocket server listening on port 5501
```

---

### **3. Probar desde el navegador**

- **Frontend:** https://yavoy.space
- **API Test:** https://yavoy.space/api/test
- **Health Check:** https://yavoy.space/api/health

---

### **4. Verificar base de datos**

```bash
# Conectar por SSH y ejecutar
mysql -h localhost -u u695828542_ssh -p u695828542_YAvoyOk26

# Dentro de MySQL
SHOW TABLES;
SELECT COUNT(*) FROM usuarios;
EXIT;
```

---

## 🔧 COMANDOS ÚTILES POST-DEPLOYMENT

```bash
# Ver logs en tiempo real
pm2 logs yavoy

# Reiniciar servidor
pm2 restart yavoy

# Detener servidor
pm2 stop yavoy

# Ver uso de recursos
pm2 monit

# Actualizar código (git pull)
cd ~/public_html
git pull origin main
pm2 restart yavoy

# Ver procesos corriendo
pm2 list

# Eliminar proceso
pm2 delete yavoy
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### **Error: Puerto ya en uso**

```bash
pm2 delete yavoy
pm2 start server.js --name yavoy
```

---

### **Error: MySQL no conecta**

Verificar en `.env`:

```env
DB_HOST=localhost  # ← DEBE SER localhost, NO srv1722.hstgr.io
```

---

### **Error: Módulos no encontrados**

```bash
npm install --production
pm2 restart yavoy
```

---

### **Error: Permisos**

```bash
chmod 755 server.js
chmod -R 755 src/ config/ models/
```

---

### **Ver errores detallados**

```bash
pm2 logs yavoy --err --lines 200
```

---

## 📞 SOPORTE

- **Panel Hostinger:** https://hpanel.hostinger.com
- **Soporte 24/7:** Chat en vivo en el panel
- **Documentación:** https://support.hostinger.com

---

## 🎉 ¡DEPLOYMENT COMPLETADO!

Una vez verificado que todo funciona:

```
✅ Servidor corriendo en PM2
✅ Base de datos conectada
✅ Email funcionando
✅ MercadoPago configurado
✅ SSL/HTTPS activo
✅ Accesible desde: https://yavoy.space
```

**Tu aplicación YAvoy v3.1 Enterprise está EN PRODUCCIÓN** 🚀
