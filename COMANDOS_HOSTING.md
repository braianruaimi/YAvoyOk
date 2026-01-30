# 🔧 COMANDOS ÚTILES PARA HOSTING

## Comandos esenciales para gestionar YAvoy en producción

### 🚀 **DEPLOYMENT INICIAL**

```bash
# 1. Conectar a Hostinger
ssh usuario@tudominio.com

# 2. Clonar repositorio (primera vez)
cd public_html
git clone https://github.com/braianruaimi/YAvoyOk.git .

# 3. Deploy rápido
chmod +x deploy-rapido.sh
./deploy-rapido.sh
```

### 📦 **GESTIÓN PM2**

```bash
# Ver estado de todas las aplicaciones
pm2 status

# Ver logs en tiempo real
pm2 logs yavoy-enterprise-v3.1

# Ver logs específicos (últimas 50 líneas)
pm2 logs yavoy-enterprise-v3.1 --lines 50

# Reiniciar aplicación
pm2 restart yavoy-enterprise-v3.1

# Recargar aplicación (sin downtime)
pm2 reload yavoy-enterprise-v3.1

# Detener aplicación
pm2 stop yavoy-enterprise-v3.1

# Eliminar aplicación del PM2
pm2 delete yavoy-enterprise-v3.1

# Monitor en tiempo real (CPU, memoria)
pm2 monit

# Lista detallada con información de recursos
pm2 list

# Guardar configuración actual
pm2 save

# Configurar PM2 para inicio automático
pm2 startup
```

### 🔄 **ACTUALIZACIONES**

```bash
# Actualizar código desde GitHub
git pull origin main

# Reinstalar dependencias si hay cambios
npm install --production

# Reiniciar aplicación con nuevos cambios
pm2 restart yavoy-enterprise-v3.1

# Ver qué cambió
git log --oneline -10
```

### 🗄️ **BASE DE DATOS**

```bash
# Conectar a PostgreSQL
psql -U yavoy_user -d yavoy_production

# Backup de base de datos
pg_dump yavoy_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
psql -U yavoy_user -d yavoy_production < backup_file.sql

# Ver tamaño de base de datos
psql -U yavoy_user -d yavoy_production -c "\l+"

# Ver tablas
psql -U yavoy_user -d yavoy_production -c "\dt"
```

### 🔍 **DIAGNÓSTICO**

```bash
# Verificar que el servidor responde
curl http://localhost:5502/api/debug/test-router

# Verificar puertos en uso
netstat -tulpn | grep 5502

# Verificar procesos Node.js
ps aux | grep node

# Verificar uso de CPU y memoria
htop

# Verificar espacio en disco
df -h

# Verificar logs del sistema
tail -f /var/log/syslog

# Test de conexión a base de datos (desde Node.js)
node -e "
const { Client } = require('pg');
const client = new Client(process.env.DATABASE_URL || 'postgresql://yavoy_user:password@localhost:5432/yavoy_production');
client.connect().then(() => console.log('✅ BD conectada')).catch(err => console.log('❌ Error BD:', err.message));
"
```

### 🔐 **SEGURIDAD**

```bash
# Verificar configuración de firewall
ufw status

# Abrir puerto 5502 si es necesario
sudo ufw allow 5502

# Ver intentos de login
tail -f /var/log/auth.log

# Verificar usuarios activos
who

# Cambiar permisos de archivos sensibles
chmod 600 .env
chmod 755 server-enterprise.js
```

### 📧 **CONFIGURACIÓN EMAIL**

```bash
# Test de envío de email (instalar mailutils si no existe)
echo "Test desde servidor" | mail -s "Test YAvoy" tu@email.com

# Verificar configuración SMTP en Node.js
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
    host: 'smtp.hostinger.com',
    port: 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
transporter.verify().then(() => console.log('✅ SMTP OK')).catch(err => console.log('❌ SMTP Error:', err.message));
"
```

### 💳 **MERCADOPAGO**

```bash
# Test de credenciales MercadoPago
node -e "
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (accessToken && accessToken.startsWith('APP_USR')) {
    console.log('✅ Credenciales de PRODUCCIÓN configuradas');
} else {
    console.log('⚠️  Usando credenciales de TEST');
}
"

# Verificar webhook MercadoPago
curl -X POST http://localhost:5502/api/mercadopago/webhook \
  -H "Content-Type: application/json" \
  -d '{"data":{"id":"test"},"type":"payment","action":"payment.updated"}'
```

### 📱 **SSL/HTTPS (Opcional)**

```bash
# Instalar Certbot para SSL gratuito
sudo apt install certbot

# Obtener certificado SSL
sudo certbot certonly --standalone -d tudominio.com

# Renovar certificados
sudo certbot renew --dry-run
```

### 🔧 **MAINTENANCE MODE**

```bash
# Activar modo mantenimiento (crear página temporal)
echo "<!DOCTYPE html><html><head><title>Mantenimiento</title></head><body style='text-align:center;padding:50px;font-family:Arial'><h1>🔧 En Mantenimiento</h1><p>YAvoy estará disponible en breve.</p></body></html>" > maintenance.html

# Detener aplicación para mantenimiento
pm2 stop yavoy-enterprise-v3.1

# Reactivar después del mantenimiento
pm2 start yavoy-enterprise-v3.1
rm maintenance.html
```

### 📊 **MONITOREO AVANZADO**

```bash
# Ver estadísticas de PM2 en tiempo real
pm2 monit

# Información detallada de un proceso
pm2 show yavoy-enterprise-v3.1

# Resetear estadísticas de PM2
pm2 reset yavoy-enterprise-v3.1

# Configurar alertas por email (avanzado)
pm2 install pm2-notify
```

### 🚨 **TROUBLESHOOTING RÁPIDO**

```bash
# Aplicación no inicia
pm2 logs yavoy-enterprise-v3.1 --err --lines 20

# Puerto ocupado
sudo lsof -i :5502
# Matar proceso: kill -9 PID

# Memoria agotada
pm2 restart yavoy-enterprise-v3.1

# Base de datos no conecta
sudo systemctl status postgresql
sudo systemctl restart postgresql

# Reinstalación completa en caso de problemas
pm2 delete yavoy-enterprise-v3.1
rm -rf node_modules package-lock.json
npm install
pm2 start ecosystem.config.js --env production
```

### 🎯 **COMANDOS DE UN VISTAZO**

```bash
# Deploy inicial completo
git clone https://github.com/braianruaimi/YAvoyOk.git . && ./deploy-rapido.sh

# Actualización rápida
git pull && npm install && pm2 restart yavoy-enterprise-v3.1

# Ver estado completo
pm2 status && pm2 logs yavoy-enterprise-v3.1 --lines 5

# Backup rápido
pg_dump yavoy_production > backup_$(date +%Y%m%d).sql && ls -la backup_*.sql
```

---

> **💡 TIP:** Guarda estos comandos en un script personal para acceso rápido. La mayoría de problemas se resuelven con restart de PM2 y verificación de logs.