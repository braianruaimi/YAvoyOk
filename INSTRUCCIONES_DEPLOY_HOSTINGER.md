# 🚀 Deploy YAvoy en Hostinger - yavoy.sbs

## ✅ Pre-requisitos Completados

- ✅ Dominio: yavoy.sbs
- ✅ Base de datos MySQL: u695828542_yavoysql
- ✅ Host: srv1722.hstgr.io
- ✅ Usuario: u695828542_yavoyspace

---

## 📋 Pasos para Deploy

### 1️⃣ Acceder a Hostinger

1. Ve a: https://hpanel.hostinger.com
2. Inicia sesión con tus credenciales
3. Selecciona tu hosting donde está **yavoy.sbs**

---

### 2️⃣ Configurar Node.js

1. **Panel Hostinger** → **Avanzado** → **Node.js**
2. Haz clic en **"Crear aplicación"**
3. Configura:
   - **Modo de aplicación**: Production
   - **Versión de Node.js**: 18.x o 20.x (la más reciente)
   - **Directorio de la aplicación**: `public_html` (o donde subas el proyecto)
   - **Archivo de inicio**: `server-simple.js`
   - **Dominio**: yavoy.sbs

4. Haz clic en **"Crear"**

---

### 3️⃣ Subir Archivos por SFTP

#### Opción A: FileZilla (Recomendado)

1. **Obtener credenciales SFTP**:
   - Panel Hostinger → **Archivos** → **FTP/SFTP**
   - Anota: Host, Puerto (22), Usuario, Contraseña

2. **Conectar con FileZilla**:
   - Host: `srv1722.hstgr.io`
   - Usuario: tu usuario SFTP
   - Contraseña: tu contraseña
   - Puerto: 22
   - Protocolo: SFTP

3. **Subir proyecto**:
   - Navega a `public_html/` en el servidor
   - Sube TODOS los archivos del proyecto
   - **IMPORTANTE**: Sube también `.env.production` y renómbralo a `.env`

#### Opción B: Administrador de Archivos

1. **Comprimir proyecto localmente**:

```powershell
cd C:\Users\estudiante\Downloads\YAvoy_DEFINITIVO
Compress-Archive -Path YAvoy_DEFINITIVO\* -DestinationPath YAvoy_Deploy.zip
```

2. **Subir ZIP**:
   - Panel Hostinger → **Archivos** → **Administrador de archivos**
   - Navega a `public_html/`
   - Sube `YAvoy_Deploy.zip`
   - Click derecho → **Extraer**

---

### 4️⃣ Configurar Base de Datos

La base de datos ya está creada. Solo necesitas importar el schema:

1. **Panel Hostinger** → **Bases de datos** → **phpMyAdmin**
2. Selecciona la base de datos: `u695828542_yavoysql`
3. Ve a la pestaña **"Importar"**
4. Sube el archivo: `init-mysql-hostinger.sql`
5. Haz clic en **"Continuar"**

---

### 5️⃣ Instalar Dependencias

1. **Panel Hostinger** → **Avanzado** → **Terminal SSH**
2. Ejecuta:

```bash
# Navegar al directorio
cd public_html

# Instalar dependencias
npm install --production

# Verificar instalación
npm list
```

---

### 6️⃣ Configurar Variables de Entorno

1. En el servidor, edita el archivo `.env`:

```bash
nano .env
```

2. Verifica que tenga la configuración correcta (ya está en `.env.production`)

3. Guarda y cierra: `Ctrl + X`, luego `Y`, luego `Enter`

---

### 7️⃣ Iniciar Aplicación

#### Opción A: Panel Node.js

1. **Panel Hostinger** → **Node.js**
2. Tu aplicación debería aparecer listada
3. Haz clic en **"Iniciar"** o **"Reiniciar"**

#### Opción B: PM2 (Terminal)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
pm2 start server-simple.js --name yavoy

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

---

### 8️⃣ Verificar Funcionamiento

1. **Abre tu navegador**:
   - https://yavoy.sbs
   - https://yavoy.sbs/dashboard-ceo.html

2. **Verifica endpoints**:
   - https://yavoy.sbs/api/test
   - https://yavoy.sbs/api/health

---

### 9️⃣ Configurar SSL (HTTPS)

1. **Panel Hostinger** → **Seguridad** → **SSL**
2. Si no está activado:
   - Selecciona tu dominio: yavoy.sbs
   - Haz clic en **"Instalar SSL"**
   - Espera 5-10 minutos

---

### 🔟 Configurar DNS (Si es necesario)

Si acabas de comprar el dominio:

1. **Panel Hostinger** → **Dominios** → **yavoy.sbs** → **DNS**
2. Verifica que los registros A apunten a tu IP del servidor
3. Agrega registro A:
   - Tipo: A
   - Nombre: @
   - Apunta a: [IP de tu hosting]
   - TTL: 14400

---

## 🎯 Accesos Finales

### URLs de Acceso:

- **Landing**: https://yavoy.sbs
- **Panel CEO**: https://yavoy.sbs/dashboard-ceo.html
- **Panel Comercio**: https://yavoy.sbs/panel-comercio-pro.html
- **Panel Repartidor**: https://yavoy.sbs/panel-repartidor-pro.html
- **Panel Cliente**: https://yavoy.sbs/panel-cliente-pro.html

### API Endpoints:

- https://yavoy.sbs/api/test
- https://yavoy.sbs/api/health
- https://yavoy.sbs/api/metrics
- https://yavoy.sbs/api/status

### Credenciales CEO:

- **Usuario**: Braian.R o Cesar.C
- **Contraseña**: `Braian2026!` o `Cesar2026!`

---

## 🔧 Troubleshooting

### Si el servidor no inicia:

```bash
# Ver logs de PM2
pm2 logs yavoy

# Ver logs de Node.js (panel Hostinger)
# Panel → Node.js → Tu app → Ver logs
```

### Si hay error de conexión a BD:

1. Verifica que `.env` tenga las credenciales correctas
2. Verifica que la IP del servidor esté en la whitelist de MySQL
3. Panel → Bases de datos → Acceso remoto

### Si no carga la página:

1. Verifica que el dominio apunte al hosting correcto
2. Limpia caché del navegador (Ctrl + Shift + R)
3. Verifica que el SSL esté activo

---

## 📞 Soporte

- **Hostinger Support**: https://www.hostinger.com/contact
- **Chat en vivo**: Disponible 24/7 en el panel

---

**¡Listo!** Tu aplicación YAvoy estará funcionando en https://yavoy.sbs 🚀
