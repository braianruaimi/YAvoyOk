# 🚀 GUÍA COMPLETA DE DEPLOYMENT - HOSTINGER VPS

## YAvoy v3.1 Enterprise - Configuración de Producción

> **✅ PROYECTO LISTO PARA PRODUCCIÓN**  
> Esta guía te ayudará a configurar y desplegar YAvoyOk en Hostinger con todas las funcionalidades empresariales activas.

---

## 📋 **CHECKLIST PRE-DEPLOYMENT**

### 🔴 **CRÍTICO - CONFIGURAR ANTES DEL DEPLOY**

#### **1. 💳 Credenciales MercadoPago (OBLIGATORIO)**
- [ ] Crear cuenta MercadoPago business
- [ ] Obtener credenciales de PRODUCCIÓN
- [ ] Configurar webhook para pagos

#### **2. 🗄️ Base de Datos PostgreSQL**
- [ ] Crear base de datos en Hostinger
- [ ] Configurar conexión segura
- [ ] Ejecutar migraciones

#### **3. 📧 Configuración SMTP**
- [ ] Configurar email corporativo
- [ ] Verificar envío de notificaciones

#### **4. 🔐 Seguridad Enterprise**
- [ ] Generar JWT secrets únicos
- [ ] Configurar CORS para dominio
- [ ] Establecer IPs CEO autorizadas

---

## 🌐 **PASO 1: CONFIGURAR HOSTING HOSTINGER**

### **Requisitos VPS Mínimos**
- **RAM**: 2GB mínimo, 4GB recomendado
- **CPU**: 2 vCores mínimo
- **Storage**: 40GB SSD
- **Node.js**: v18+ o v20+
- **PM2**: Para gestión de procesos
- **PostgreSQL**: v13+ o servicio externo

### **Acceso SSH**
```bash
ssh usuario@tu-dominio.com
# o con IP específica
ssh usuario@123.456.789.123
```

---

## 🔧 **PASO 2: CONFIGURAR VARIABLES DE ENTORNO**

### **Crear archivo `.env` de producción**

```bash
# En el servidor Hostinger
nano .env
```

### **Variables críticas (completar con tus datos reales):**

```bash
# ====================================
# 🚀 YAVOY v3.1 - PRODUCCIÓN HOSTINGER
# ====================================

# 🌐 SERVIDOR
NODE_ENV=production
PORT=5502
HOST=0.0.0.0

# 🔐 SEGURIDAD JWT
JWT_SECRET=TU_JWT_SECRET_UNICO_64_CARACTERES_MINIMO
SESSION_SECRET=TU_SESSION_SECRET_UNICO_64_CARACTERES_MINIMO
CSRF_SECRET=TU_CSRF_SECRET_UNICO
ENCRYPT_SECRET=TU_ENCRYPTION_KEY_UNICO

# 🗄️ BASE DE DATOS POSTGRESQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yavoy_production
DB_USER=yavoy_user
DB_PASSWORD=TU_PASSWORD_POSTGRESQL_SEGURO
DATABASE_URL=postgresql://yavoy_user:PASSWORD@localhost:5432/yavoy_production

# 💳 MERCADOPAGO PRODUCCIÓN
MERCADOPAGO_ACCESS_TOKEN=APP_USR-TU-ACCESS-TOKEN-REAL
MERCADOPAGO_PUBLIC_KEY=APP_USR-TU-PUBLIC-KEY-REAL
MERCADOPAGO_WEBHOOK_SECRET=TU_WEBHOOK_SECRET

# 📧 EMAIL CORPORATIVO
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=soporte@tudominio.com
SMTP_PASS=TU_PASSWORD_EMAIL
EMAIL_FROM=soporte@tudominio.com

# 🌐 CORS - Tu dominio real
ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com

# 🔒 SEGURIDAD CEO
CEO_RATE_LIMIT_MAX=10
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=1800000
CEO_AUTHORIZED_IPS=TU_IP,OTRA_IP_AUTORIZADA
```

---

## 📦 **PASO 3: DEPLOYMENT AUTOMÁTICO**

### **Opción A: Deploy via GitHub (RECOMENDADO)**

```bash
# 1. Conectar a Hostinger
ssh usuario@tudominio.com

# 2. Ir al directorio web
cd public_html

# 3. Clonar repositorio
git clone https://github.com/braianruaimi/YAvoyOk.git .

# 4. Instalar dependencias
npm install --production

# 5. Configurar variables
cp .env.example .env
nano .env  # Editar con tus valores reales

# 6. Ejecutar migraciones
npm run migrate:postgresql

# 7. Iniciar con PM2
npm install -g pm2
pm2 start ecosystem.config.js --env production
```

### **Opción B: Deploy via Script**

```bash
# Desde tu PC local
node vscode-master.js deploy
```

---

## 🗄️ **PASO 4: CONFIGURAR BASE DE DATOS**

### **PostgreSQL en Hostinger**

```sql
-- 1. Crear base de datos
CREATE DATABASE yavoy_production;
CREATE USER yavoy_user WITH ENCRYPTED PASSWORD 'password_seguro';
GRANT ALL PRIVILEGES ON DATABASE yavoy_production TO yavoy_user;
```

### **Ejecutar migraciones**
```bash
# Desde directorio del proyecto
node -e "
const fs = require('fs');
const sql = fs.readFileSync('./migracion_v3.1.sql', 'utf8');
console.log('Ejecutar este SQL en PostgreSQL:');
console.log(sql);
"
```

---

## 💳 **PASO 5: CONFIGURAR MERCADOPAGO**

### **Obtener credenciales de producción**

1. **Ir a MercadoPago Developers:**
   - URL: https://www.mercadopago.com.ar/developers/panel
   
2. **Crear aplicación:**
   - Nombre: "YAvoy Delivery"
   - Descripción: "Plataforma de delivery"
   
3. **Obtener credenciales:**
   ```
   Access Token: APP_USR-1234567890-xxxxxxxxxx-abcdefghijk
   Public Key: APP_USR-abcd1234-5678-90ef-ghij-klmnopqrstuv
   ```

4. **Configurar Webhook:**
   - URL: `https://tudominio.com/api/mercadopago/webhook`
   - Eventos: `payment.created`, `payment.updated`

---

## 🚀 **PASO 6: INICIAR APLICACIÓN**

### **Con PM2 (RECOMENDADO)**

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Verificar estado
pm2 status
pm2 logs yavoy-enterprise-v3.1

# Configurar auto-start
pm2 startup
pm2 save
```

### **Verificar funcionamiento**
```bash
# Verificar que el servidor responde
curl http://localhost:5502/api/debug/test-router

# Verificar logs
pm2 logs --lines 50
```

---

## 🔍 **PASO 7: VERIFICACIONES POST-DEPLOY**

### **Checklist de verificación:**

- [ ] **Servidor activo**: http://tudominio.com:5502
- [ ] **Base de datos conectada**: Verificar en `/api/debug/test-router`
- [ ] **MercadoPago funcionando**: Crear pedido de prueba
- [ ] **Emails enviándose**: Probar registro de usuario
- [ ] **WebSockets activos**: Chat en tiempo real funcionando
- [ ] **PM2 estable**: `pm2 status` sin errores

### **URLs importantes:**
```
🏠 Landing Page:     https://tudominio.com
🏪 Panel Comercio:   https://tudominio.com/panel-comercio.html
🚴 Panel Repartidor: https://tudominio.com/panel-repartidor.html  
👑 Panel CEO:        https://tudominio.com/panel-ceo-master.html
📊 Analytics:        https://tudominio.com/dashboard-analytics.html
```

---

## 🛠️ **COMANDOS ÚTILES POST-DEPLOY**

### **Gestión PM2**
```bash
pm2 restart yavoy-enterprise-v3.1  # Reiniciar
pm2 stop yavoy-enterprise-v3.1     # Detener
pm2 delete yavoy-enterprise-v3.1   # Eliminar
pm2 logs yavoy-enterprise-v3.1     # Ver logs
pm2 monit                          # Monitor en tiempo real
```

### **Actualizar aplicación**
```bash
git pull origin main               # Descargar cambios
npm install                       # Instalar nuevas dependencias
pm2 restart yavoy-enterprise-v3.1 # Reiniciar aplicación
```

### **Backup base de datos**
```bash
pg_dump yavoy_production > backup_$(date +%Y%m%d).sql
```

---

## 🔥 **FUNCIONALIDADES ENTERPRISE ACTIVAS**

### **✅ Sistema de Pagos**
- MercadoPago QR dinámico
- Webhook de confirmación
- Split payments para comisiones

### **✅ Seguridad Empresarial**
- JWT con refresh tokens
- Rate limiting por IP
- Autenticación 2FA WebAuthn
- Encriptación end-to-end

### **✅ Monitoreo en Tiempo Real**
- Dashboard CEO con métricas live
- Sistema de notificaciones push
- Analytics avanzados
- Socket.IO clustering

### **✅ Gestión Avanzada**
- Panel CEO con 13 secciones
- Sistema de calificaciones
- Inventario inteligente
- Referidos y recompensas

---

## ⚠️ **SOLUCIÓN DE PROBLEMAS COMUNES**

### **Error de conexión a BD**
```bash
# Verificar PostgreSQL activo
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### **Error de permisos**
```bash
# Dar permisos a archivos
chmod 755 server-enterprise.js
chown -R usuario:usuario /path/to/yavoy
```

### **Error de puertos**
```bash
# Verificar que puerto 5502 esté libre
lsof -i :5502
netstat -tulpn | grep 5502
```

### **Error de memoria**
```bash
# Reiniciar PM2 si consume mucha RAM
pm2 restart yavoy-enterprise-v3.1 --update-env
```

---

## 🎯 **RESULTADO ESPERADO**

Después de seguir esta guía, tendrás:

- ✅ **YAvoy v3.1 Enterprise** funcionando en producción
- ✅ **Base de datos PostgreSQL** configurada y optimizada  
- ✅ **Pagos MercadoPago** totalmente funcionales
- ✅ **Sistema de notificaciones** por email y push
- ✅ **Monitoreo PM2** con auto-restart
- ✅ **Panel CEO** con todos los analytics
- ✅ **Seguridad empresarial** completa activada

**🌐 Tu plataforma estará lista para manejar cientos de pedidos simultáneos con monitoreo 24/7.**

---

> **💡 SOPORTE TÉCNICO**  
> Si encuentras algún problema durante el deployment, revisa los logs con `pm2 logs` y verifica que todas las variables de entorno estén correctamente configuradas.