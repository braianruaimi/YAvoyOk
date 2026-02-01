# 🚀 GUÍA FINAL DE DEPLOYMENT A HOSTINGER

## Estado Actual
✅ **Deep Scan:** 98.44% exitoso  
✅ **Sintaxis:** 0 errores  
✅ **Arquitectura:** PostgreSQL + Sequelize  
✅ **Seguridad:** JWT + bcryptjs + Rate Limiting  

---

## 📋 PASO 1: PREPARACIÓN DE CREDENCIALES HOSTINGER

### 1.1 Obtener datos de acceso
1. Ingresar a [Hostinger Panel](https://hpanel.hostinger.com)
2. Buscar sección **Bases de Datos** → PostgreSQL
3. Crear nueva BD:
   - **Nombre:** `yavoy_db`
   - **Usuario:** `yavoy_user`
   - **Host:** `localhost` o IP proporcionado
   - **Puerto:** `5432` (default)

4. Copiar credenciales en `.env`:
```bash
DB_NAME=yavoy_db
DB_USER=yavoy_user
DB_PASS=<password_generado>
DB_HOST=localhost
DB_PORT=5432
```

### 1.2 Configurar Email SMTP
1. Ir a **Correo Electrónico** en Hostinger
2. Crear cuenta: `noreply@yavoy.com` (o tu dominio)
3. En panel, obtener:
   - **Host:** `mail.yavoy.com` o `smtp.hostinger.com`
   - **Puerto:** `465` (SSL) o `587` (TLS)
   - **Usuario:** `noreply@yavoy.com`
   - **Contraseña:** Guardada en Hostinger

4. Actualizar `.env`:
```bash
SMTP_HOST=mail.yavoy.com
SMTP_PORT=465
SMTP_USER=noreply@yavoy.com
SMTP_PASS=<password_email>
```

### 1.3 Variables de Seguridad
```bash
JWT_SECRET=<generar_string_aleatorio_64_caracteres>
FRONTEND_URL=https://yavoy.com
NODE_ENV=production
PORT=8443
```

---

## 📦 PASO 2: SUBIR CÓDIGO A HOSTINGER

### Opción A: SFTP (Recomendado)
```bash
# Usar WinSCP o similar
# Host: ftp.yavoy.com
# Usuario: hostinger_user
# Contraseña: hostinger_pass

# Subir a: /public_html/backend/
# Estructura esperada:
/public_html/backend/
├── server.js
├── package.json
├── .env (NO SUBIR, crear en servidor)
├── .env.example
├── config/
├── models/
├── src/
└── scripts/
```

### Opción B: Git (Si Hostinger lo soporta)
```bash
# En terminal Hostinger
cd /home/yavoyok/public_html/backend
git clone <repo> .
```

---

## 🔧 PASO 3: CONFIGURAR SERVIDOR EN HOSTINGER

### 3.1 Conectar por SSH
```bash
# Terminal local (Windows PowerShell o Git Bash)
ssh yavoyok@yavoy.com

# O usar Hostinger File Manager → SSH
```

### 3.2 Navegar a directorio
```bash
cd public_html/backend
# o donde esté el código
```

### 3.3 Crear archivo `.env`
```bash
# Crear archivo
nano .env

# Pegar contenido (reemplazar valores):
DB_NAME=yavoy_db
DB_USER=yavoy_user
DB_PASS=SecurePass123!
DB_HOST=localhost
DB_PORT=5432

SMTP_HOST=mail.yavoy.com
SMTP_PORT=465
SMTP_USER=noreply@yavoy.com
SMTP_PASS=EmailPass123!

JWT_SECRET=aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4cD5eF6gH7iJ8
FRONTEND_URL=https://yavoy.com
NODE_ENV=production
PORT=8443

# Guardar: Ctrl+X → Y → Enter
```

### 3.4 Instalar dependencias
```bash
# Verificar Node.js
node --version  # Debe ser v14+

# Instalar dependencias
npm install

# Verificar instalación
npm list --depth=0
```

---

## 🗄️ PASO 4: CONFIGURAR BASE DE DATOS

### 4.1 Conectar a PostgreSQL
```bash
# Desde SSH Hostinger
psql -h localhost -U yavoy_user -d yavoy_db

# Ingresar contraseña
```

### 4.2 Crear tablas (Sequelize)
```bash
# Volver a directorio backend
cd /home/yavoyok/public_html/backend

# Ejecutar sync de Sequelize
node -e "
const sequelize = require('./config/database');
sequelize.sync({ alter: true }).then(() => {
  console.log('✅ Tablas creadas/actualizadas');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
"
```

### 4.3 Migrar datos (si hay JSON legacy)
```bash
# Si tienes archivos JSON en registros/
node scripts/migrateData.js

# Si no hay datos legacy, omitir este paso
```

---

## ▶️ PASO 5: INICIAR SERVIDOR

### Opción A: Node.js directo (testing)
```bash
npm start

# Debe mostrar:
# ✅ Servidor ejecutándose en puerto 8443
# ✅ Conectado a PostgreSQL
# ✅ Email service listo
```

### Opción B: PM2 (Recomendado - Producción)
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar con PM2
pm2 start server.js --name "yavoy-backend" --env production

# Ver logs
pm2 logs yavoy-backend

# Auto-restart en reboot
pm2 startup
pm2 save
```

### Opción C: Forever
```bash
npm install -g forever

forever start server.js

# Ver procesos
forever list
```

---

## ✅ PASO 6: VERIFICAR FUNCIONAMIENTO

### 6.1 Health Check
```bash
# Desde terminal local
curl https://yavoy.com/api/health

# Debe responder: {"status": "ok"}
```

### 6.2 Test de Login
```bash
# Test registro
curl -X POST https://yavoy.com/api/auth/register/comercio \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test",
    "apellido": "User",
    "email": "test@yavoy.test",
    "telefono": "5551234567",
    "password": "TestPass123!",
    "nombreComercio": "Test Shop",
    "direccion": "Calle 1 123"
  }'

# Debe responder: {"success": true, "data": {...}}
```

### 6.3 Test de Password Recovery
```bash
# Solicitar recuperación
curl -X POST https://yavoy.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@yavoy.test"}'

# Debe responder: {"success": true, "message": "..."}
# Email debe estar en bandeja
```

### 6.4 Revisar logs
```bash
# Con PM2
pm2 logs yavoy-backend

# Con Forever
tail -f /root/.forever/yavoy-backend.log

# Con directo
# Revisar consola del servidor
```

---

## 🔍 PASO 7: CONFIGURAR PROXY REVERSO

### Si usas Apache (Host Hostinger)
```apache
<VirtualHost *:443>
  ServerName yavoy.com
  ServerAlias www.yavoy.com
  
  SSLEngine On
  SSLCertificateFile /path/to/certificate.crt
  SSLCertificateKeyFile /path/to/key.key
  
  ProxyPreserveHost On
  ProxyPass / http://localhost:8443/
  ProxyPassReverse / http://localhost:8443/
  
  # CORS Headers
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</VirtualHost>
```

### Si usas Nginx
```nginx
server {
  listen 443 ssl;
  server_name yavoy.com www.yavoy.com;
  
  ssl_certificate /path/to/certificate.crt;
  ssl_certificate_key /path/to/key.key;
  
  location / {
    proxy_pass http://localhost:8443;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## 🛡️ PASO 8: CONFIGURACIÓN DE SEGURIDAD

### 8.1 SSL/TLS
```bash
# Hostinger proporciona Let's Encrypt automático
# Verificar en Admin → SSL Certificates
# Auto-renew debe estar ENABLED
```

### 8.2 Firewall
```bash
# Permitir puertos
sudo ufw allow 8443/tcp  # Node.js
sudo ufw allow 5432/tcp  # PostgreSQL (si acceso remoto)
sudo ufw allow 465/tcp   # SMTP
sudo ufw allow 587/tcp   # SMTP alternative
sudo ufw allow 22/tcp    # SSH

# Reiniciar firewall
sudo ufw reload
```

### 8.3 Backups
```bash
# Configurar backup automático de BD en Hostinger panel
# Frecuencia: Diaria
# Retención: 30 días
```

---

## 📊 PASO 9: MONITOREO

### Logs
```bash
# Ver últimas líneas
pm2 logs --lines 100

# Monitorear en tiempo real
pm2 monit
```

### Errores comunes
```
❌ Error: connect ECONNREFUSED 127.0.0.1:5432
→ PostgreSQL no está corriendo, contactar Hostinger

❌ Error: SMTP Error
→ Verificar credenciales SMTP en .env

❌ Error: JWT_SECRET not defined
→ Verificar .env existe y tiene JWT_SECRET

❌ Error: ENOTFOUND yavoy.com
→ DNS no apunta a Hostinger, esperar 24-48h o contactar Hostinger
```

---

## 🎯 CHECKLIST FINAL

- [ ] Base de datos PostgreSQL creada en Hostinger
- [ ] Credenciales DB en `.env`
- [ ] Email SMTP configurado en Hostinger
- [ ] Credenciales SMTP en `.env`
- [ ] JWT_SECRET generado (64+ caracteres)
- [ ] NODE_ENV=production
- [ ] Código subido por SFTP/Git
- [ ] `npm install` ejecutado
- [ ] `.env` creado en servidor (NO en repo)
- [ ] Sequelize sync completado
- [ ] PM2/Forever iniciado
- [ ] Health check respondiendo 200
- [ ] Emails siendo enviados correctamente
- [ ] Logs verificados sin errores críticos
- [ ] DNS apuntando a Hostinger
- [ ] SSL/TLS activo
- [ ] Firewall configurado

---

## 📞 SOPORTE

Si hay errores después de deploy:

1. **Revisar logs:** `pm2 logs yavoy-backend`
2. **Verificar BD:** `psql -h localhost -U yavoy_user -d yavoy_db -c "SELECT 1;"`
3. **Verificar email:** `telnet mail.yavoy.com 465`
4. **Contactar Hostinger:** Support → Crear ticket con logs

---

## 🎉 FELICIDADES

Una vez completados todos los pasos:

✅ Sistema YAvoy 3.1 estará en producción  
✅ Base de datos PostgreSQL funcional  
✅ Autenticación JWT completa  
✅ Password recovery con email  
✅ Rate limiting en endpoints  
✅ Seguridad en todos los niveles  

**¡Listo para recibir usuarios!**

---

*Última actualización: ${new Date().toISOString()}*
*Versión: YAvoy 3.1 PostgreSQL Edition*
