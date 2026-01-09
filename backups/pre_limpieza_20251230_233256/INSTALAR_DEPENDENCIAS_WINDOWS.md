# 📦 INSTALACIÓN COMPLETA - Windows

## ✅ PAQUETES NECESARIOS

### 1️⃣ Node.js 18+ (Ya instalado ✅)
```powershell
node --version  # Debe ser >= 18.0.0
npm --version   # Debe ser >= 8.0.0
```

### 2️⃣ PostgreSQL 16 (REQUERIDO)

**Opción A: Instalador oficial (Recomendado)**
1. Descargar: https://www.postgresql.org/download/windows/
2. Ejecutar instalador PostgreSQL 16.x
3. Durante instalación:
   - ✅ PostgreSQL Server (puerto 5432)
   - ✅ pgAdmin 4
   - ✅ Command Line Tools
   - ⚠️ **Anotar la contraseña de postgres**

**Opción B: Chocolatey**
```powershell
choco install postgresql16 -y
```

**Verificar instalación:**
```powershell
# Buscar servicio PostgreSQL
Get-Service -Name postgresql*

# Si está detenido, iniciarlo
Start-Service -Name postgresql-x64-16
```

### 3️⃣ PM2 Process Manager (Ya instalado ✅)
```powershell
pm2 --version
```

---

## 🔧 CONFIGURACIÓN POSTGRESQL

### Agregar PostgreSQL al PATH (si no está)
```powershell
# Buscar instalación de PostgreSQL
$pgPath = "C:\Program Files\PostgreSQL\16\bin"

# Agregar temporalmente al PATH
$env:Path += ";$pgPath"

# Verificar
psql --version
```

### Crear Base de Datos
```powershell
# Opción 1: Usando psql
psql -U postgres -c "CREATE DATABASE yavoy_db WITH ENCODING 'UTF8';"

# Opción 2: Usando pgAdmin 4
# 1. Abrir pgAdmin 4
# 2. Conectar con contraseña de postgres
# 3. Click derecho en Databases → Create → Database
# 4. Nombre: yavoy_db
# 5. Encoding: UTF8
```

### Ejecutar Schema SQL
```powershell
# Navegar a la carpeta del proyecto
cd C:\Users\cdaim\OneDrive\Desktop\YAvoy_DEFINITIVO

# Ejecutar schema
psql -U postgres -d yavoy_db -f database-schema.sql

# Verificar tablas creadas
psql -U postgres -d yavoy_db -c "\dt"
```

---

## 📝 COMPLETAR CONFIGURACIÓN .env

Ya actualicé tu archivo `.env` con valores por defecto:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yavoy_db
DB_USER=postgres
DB_PASSWORD=postgres  # Cambiar por tu contraseña real
```

**Si tu contraseña es diferente, edítala:**
```powershell
notepad .env
# O usar VS Code:
code .env
```

---

## ✅ VERIFICACIÓN COMPLETA

```powershell
# 1. Verificar dependencias npm
npm list --depth=0

# 2. Verificar PostgreSQL
psql -U postgres -c "\l"

# 3. Verificar base de datos yavoy_db
psql -U postgres -d yavoy_db -c "\dt"

# 4. Ejecutar checks del sistema
npm run init:check
```

**Resultado esperado:**
```
✅ Todas las variables de entorno están configuradas
✅ Conexión exitosa a PostgreSQL
✅ Todas las 14 tablas requeridas existen
✅ Todos los archivos críticos existen

╔════════════════════════════════════════════════╗
║  ✅ SISTEMA LISTO PARA PRODUCCIÓN             ║
╚════════════════════════════════════════════════╝
```

---

## 🚀 INICIAR SERVIDOR

```powershell
# Desarrollo (con nodemon)
npm run dev

# Producción (una vez)
npm start

# Producción con PM2 (recomendado)
pm2 start ecosystem.config.js
pm2 logs yavoy-enterprise
pm2 status
```

---

## 📋 CHECKLIST INSTALACIÓN

- [ ] Node.js 18+ instalado y funcionando
- [ ] PostgreSQL 16 instalado y servicio corriendo
- [ ] psql accesible desde PowerShell (PATH configurado)
- [ ] Base de datos `yavoy_db` creada
- [ ] Schema ejecutado (14 tablas confirmadas)
- [ ] Archivo `.env` configurado con credenciales correctas
- [ ] `npm install` completado sin errores
- [ ] `npm run init:check` pasa todos los tests ✅
- [ ] PM2 instalado globalmente
- [ ] Servidor inicia: `npm start`

---

## 🔍 COMANDOS DE DIAGNÓSTICO

```powershell
# Ver servicios PostgreSQL
Get-Service -Name postgresql*

# Iniciar PostgreSQL
Start-Service -Name postgresql-x64-16

# Conectar a PostgreSQL
psql -U postgres

# Listar bases de datos
psql -U postgres -c "\l"

# Ver tablas en yavoy_db
psql -U postgres -d yavoy_db -c "\dt"

# Contar registros
psql -U postgres -d yavoy_db -c "SELECT COUNT(*) FROM users;"

# Ver logs de PM2
pm2 logs yavoy-enterprise --lines 50

# Ver procesos Node.js
Get-Process -Name node
```

---

## ⚠️ ERRORES COMUNES

### Error: "psql: command not found"
**Solución:** Agregar PostgreSQL al PATH
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
```

### Error: "password authentication failed"
**Solución:** Verificar contraseña en .env coincide con la de PostgreSQL

### Error: "database yavoy_db does not exist"
**Solución:**
```powershell
psql -U postgres -c "CREATE DATABASE yavoy_db;"
```

### Error: "EADDRINUSE: address already in use"
**Solución:** Otro proceso usa el puerto 3000
```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :3000

# Matar proceso
taskkill /PID <PID_NUMBER> /F

# O cambiar puerto en .env
PORT=3001
```

---

## 📦 LISTA COMPLETA DE DEPENDENCIAS NPM

**Producción (package.json):**
```json
{
  "pg": "^8.16.3",              // PostgreSQL client ✅
  "express": "^5.1.0",           // Web framework ✅
  "socket.io": "^4.8.1",         // WebSockets ✅
  "jsonwebtoken": "^9.0.3",      // JWT auth ✅
  "joi": "^18.0.2",              // Validation ✅
  "dotenv": "^17.2.3",           // Env variables ✅
  "winston": "^3.11.0",          // Logging ✅
  "bcryptjs": "^3.0.3",          // Password hashing ✅
  "cors": "^2.8.5",              // CORS ✅
  "helmet": "^8.1.0",            // Security headers ✅
  "express-rate-limit": "^8.2.1", // Rate limiting ✅
  "compression": "^1.7.4",       // Gzip compression ✅
  "morgan": "^1.10.0"            // HTTP logger ✅
}
```

**Desarrollo:**
```json
{
  "nodemon": "^3.0.2",           // Auto-reload ✅
  "eslint": "^9.39.1",           // Linter ✅
  "prettier": "^3.7.3"           // Code formatter ✅
}
```

**Globales:**
```powershell
npm list -g --depth=0
# Debe incluir:
# pm2@latest ✅
```

---

## 🎯 PRÓXIMO PASO

1. **Instalar PostgreSQL** (si aún no lo hiciste)
2. **Crear la base de datos:** `psql -U postgres -c "CREATE DATABASE yavoy_db;"`
3. **Ejecutar el schema:** `psql -U postgres -d yavoy_db -f database-schema.sql`
4. **Verificar:** `npm run init:check`
5. **Iniciar:** `npm start`

Si todos los pasos anteriores están completos, el sistema debería iniciar sin problemas.
