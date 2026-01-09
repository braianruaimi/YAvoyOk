# 🚀 GUÍA DE DESPLIEGUE FINAL - YAvoy v3.1 Enterprise

## ✅ ARCHIVOS CREADOS

Los siguientes archivos están listos para producción:

1. **`.env`** - Variables de entorno configuradas (editar credenciales reales)
2. **`.env.example`** - Plantilla de ejemplo
3. **`init-prod.js`** - Script de verificación pre-producción
4. **`ecosystem.config.js`** - Configuración PM2
5. **`package.json`** - Scripts actualizados con `prestart` hook

---

## 📋 CHECKLIST PRE-PRODUCCIÓN

### 1️⃣ INSTALAR POSTGRESQL

#### Windows (Local Development):
```powershell
# Opción A: Chocolatey
choco install postgresql

# Opción B: Descarga manual
# https://www.postgresql.org/download/windows/
# Instalar PostgreSQL 16.x con pgAdmin 4
```

#### Ubuntu/Debian (Hostinger VPS):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Configurar contraseña de postgres:**
```bash
sudo -u postgres psql
ALTER USER postgres PASSWORD 'tu_password_seguro';
\q
```

---

### 2️⃣ CREAR BASE DE DATOS

#### Opción A: Usando psql
```bash
# Conectar como postgres
psql -U postgres

# Crear base de datos
CREATE DATABASE yavoy_db WITH ENCODING 'UTF8';

# Listar bases de datos
\l

# Salir
\q
```

#### Opción B: Con comando directo
```bash
psql -U postgres -c "CREATE DATABASE yavoy_db;"
```

---

### 3️⃣ EJECUTAR SCHEMA SQL

```bash
# Ejecutar el schema completo (14 tablas + índices + triggers)
psql -U postgres -d yavoy_db -f database-schema.sql

# Verificar tablas creadas
psql -U postgres -d yavoy_db -c "\dt"
```

**Resultado esperado:**
```
 public | chat_messages         | table | postgres
 public | delivery_persons      | table | postgres
 public | order_status_history  | table | postgres
 public | orders                | table | postgres
 public | pedidos_grupales      | table | postgres
 public | products              | table | postgres
 public | referral_codes        | table | postgres
 public | referrals             | table | postgres
 public | reviews               | table | postgres
 public | rewards               | table | postgres
 public | shops                 | table | postgres
 public | system_logs           | table | postgres
 public | tips                  | table | postgres
 public | users                 | table | postgres
```

---

### 4️⃣ CONFIGURAR `.env`

Edita el archivo `.env` con tus credenciales reales:

```bash
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yavoy_db
DB_USER=postgres
DB_PASSWORD=tu_password_postgresql_aqui

# JWT Secret (genera uno nuevo)
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=tu_jwt_secret_generado_128_caracteres

# Puerto
PORT=3000

# CORS (dominios permitidos)
ALLOWED_ORIGINS=http://localhost:3000,https://yavoy.com
```

**Generar JWT Secret seguro:**
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### 5️⃣ INSTALAR DEPENDENCIAS NPM

```bash
# Instalar todas las dependencias
npm install

# Verificar instalación
npm list --depth=0
```

**Dependencias críticas que deben aparecer:**
- ✅ pg@8.16.3
- ✅ express@5.1.0
- ✅ socket.io@4.8.1
- ✅ jsonwebtoken@9.0.3
- ✅ joi@18.0.2
- ✅ dotenv@17.2.3
- ✅ winston@3.11.0

---

### 6️⃣ EJECUTAR VERIFICACIÓN PRE-PRODUCCIÓN

```bash
# Ejecutar checks automáticos
npm run init:check
```

**Resultado esperado:**
```
╔════════════════════════════════════════════════╗
║  ✅ SISTEMA LISTO PARA PRODUCCIÓN             ║
║                                                ║
║  Todos los checks pasaron exitosamente        ║
║  Puedes iniciar el servidor con seguridad     ║
╚════════════════════════════════════════════════╝
```

Si falla, el script te dirá exactamente qué está mal:
- ❌ Variables de entorno faltantes
- ❌ PostgreSQL no conecta
- ❌ Tablas faltantes
- ❌ Archivos críticos ausentes

---

### 7️⃣ INICIAR SERVIDOR

#### Desarrollo (con auto-restart):
```bash
npm run dev
```

#### Producción (una vez):
```bash
npm start
# o
npm run prod
```

#### Producción con PM2 (recomendado):
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar con PM2
pm2 start ecosystem.config.js --env production

# Ver estado
pm2 status

# Ver logs
pm2 logs yavoy-enterprise

# Reiniciar
pm2 restart yavoy-enterprise

# Detener
pm2 stop yavoy-enterprise
```

---

## 🧪 VERIFICAR QUE TODO FUNCIONA

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-21T23:45:00.000Z",
  "uptime": 10.5
}
```

### 2. Verificar WebSockets
```bash
curl http://localhost:5501/socket.io/
```

Debe responder con datos del handshake de Socket.io.

### 3. Test de endpoint protegido
```bash
curl http://localhost:3000/api/pedidos
```

Si JWT no está implementado, devolverá 401 Unauthorized.

---

## 🔧 TROUBLESHOOTING

### Error: "psql: FATAL: password authentication failed"
```bash
# Editar pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Cambiar 'peer' o 'md5' a 'trust' temporalmente
local   all   postgres   trust

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Cambiar contraseña
psql -U postgres -c "ALTER USER postgres PASSWORD 'nueva_password';"

# Revertir pg_hba.conf a 'md5'
```

### Error: "Cannot find module 'pg'"
```bash
npm install pg
```

### Error: "JWT_SECRET is required"
```bash
# Genera un secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Agrégalo a .env
JWT_SECRET=el_secret_generado_aqui
```

### Error: "EADDRINUSE: address already in use"
```bash
# Ver qué proceso usa el puerto 3000
netstat -ano | findstr :3000

# Matar proceso (Windows)
taskkill /PID <PID> /F

# O cambiar puerto en .env
PORT=3001
```

---

## 📊 SCRIPTS DISPONIBLES EN package.json

| Script | Comando | Descripción |
|--------|---------|-------------|
| `npm start` | `node server-enterprise.js` | Inicia servidor (ejecuta prestart automáticamente) |
| `npm run dev` | `nodemon server-enterprise.js` | Modo desarrollo con auto-reload |
| `npm run init:check` | `node init-prod.js` | Verifica sistema pre-producción |
| `npm run migrate:postgresql` | `node migrate-to-postgresql.js` | Migra datos JSON a PostgreSQL |
| `npm run prod` | `NODE_ENV=production node server-enterprise.js` | Modo producción explícito |

---

## 🚀 DESPLIEGUE EN HOSTINGER VPS

### 1. Conectar al VPS
```bash
ssh root@tu_servidor_hostinger.com
```

### 2. Instalar Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Debe ser >= 18.0.0
```

### 3. Instalar PostgreSQL
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Clonar repositorio
```bash
cd /var/www
git clone <tu_repositorio> yavoy
cd yavoy
```

### 5. Configurar .env
```bash
cp .env.example .env
nano .env
# Editar credenciales de producción
```

### 6. Setup completo
```bash
npm install
npm run init:check  # Verificar todo
npm start           # O pm2 start ecosystem.config.js
```

### 7. Configurar Nginx (opcional)
```nginx
server {
    listen 80;
    server_name yavoy.com www.yavoy.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5501;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

---

## ✅ CHECKLIST FINAL

- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `yavoy_db` creada
- [ ] Schema ejecutado (14 tablas)
- [ ] Archivo `.env` configurado con credenciales reales
- [ ] JWT_SECRET generado con crypto.randomBytes
- [ ] `npm install` completado
- [ ] `npm run init:check` pasa todos los tests
- [ ] `npm start` inicia sin errores
- [ ] Health check responde: `curl http://localhost:3000/api/health`
- [ ] WebSockets funcionan: conexión en puerto 5501
- [ ] PM2 configurado (producción)

---

## 📞 SOPORTE

Si encuentras errores:

1. Ejecuta `npm run init:check` - te dirá exactamente qué falta
2. Revisa logs en `./logs/combined.log`
3. Verifica PostgreSQL: `psql -U postgres -d yavoy_db -c "\dt"`
4. Consulta el archivo [POST_CORRECCIONES_VALIDACION.md](POST_CORRECCIONES_VALIDACION.md)

---

**Sistema:** YAvoy v3.1 Enterprise  
**Estado:** ✅ LISTO PARA PRODUCCIÓN  
**Última actualización:** 21 de diciembre de 2025
