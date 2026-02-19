# 🚨 GUÍA DE DEPLOYMENT - HOSTINGER SHARED HOSTING

## ⚠️ IMPORTANTE: Tu plan NO es VPS

**Tipo de hosting:** Shared Hosting / Hosting Compartido  
**Limitaciones detectadas:**
- ❌ No tienes acceso SSH completo
- ❌ No puedes usar PM2 / Node.js daemon processes
- ❌ No puedes instalar Node.js/NPM libremente
- ❌ Limitaciones de recursos (CPU, RAM, procesos)

---

## 🎯 SOLUCIONES VIABLES

### OPCIÓN 1: Usar Node.js Hosting de Hostinger (SI ESTÁ DISPONIBLE)

Algunos planes de Hostinger tienen soporte experimental para Node.js:

**Pasos:**
1. Ve a: https://hpanel.hostinger.com
2. Busca sección: **"Node.js" o "Advanced" > "Node.js Selector"**
3. Si existe:
   - Selecciona versión de Node.js (18.x o 20.x)
   - Especifica archivo de entrada: `server.js`
   - Modo: `Production`
   - Auto-start: `Enabled`

**Si NO ves esta opción, tu plan NO soporta Node.js nativo.**

---

### OPCIÓN 2: Backend Estático + API Externa (RECOMENDADO)

Ya que el hosting compartido no soporta Node.js, debes separar:

#### **Frontend en Hostinger (archivos estáticos):**
```
✅ index.html
✅ panel-cliente-pro.html
✅ panel-comercio.html
✅ repartidor-app.html
✅ /css/
✅ /js/
✅ /icons/
✅ manifest.json
✅ sw.js
```

#### **Backend en servicio gratuito con Node.js:**

**Opciones gratuitas:**
1. **Render.com** - https://render.com (RECOMENDADO)
   - Free tier con Node.js
   - Deploy automático desde GitHub
   - Sleep after 15 min inactivity
   
2. **Railway.app** - https://railway.app
   - $5 crédito mensual gratis
   - Deploy desde GitHub
   
3. **Vercel** - https://vercel.com
   - Serverless functions
   - Deploy desde GitHub
   
4. **Fly.io** - https://fly.io
   - Free tier generoso

---

### OPCIÓN 3: Upgrade a VPS de Hostinger

**Planes VPS de Hostinger que SÍ soportan Node.js:**

| Plan | Precio/mes | Recursos | Node.js |
|------|-----------|----------|---------|
| **VPS 1** | ~$4-6 USD | 1 CPU, 4GB RAM | ✅ Completo |
| **VPS 2** | ~$6-8 USD | 2 CPU, 8GB RAM | ✅ Completo |
| **VPS 3** | ~$10-12 USD | 4 CPU, 12GB RAM | ✅ Completo |

**Ventajas VPS:**
- ✅ SSH completo
- ✅ Root access
- ✅ PM2, Node.js, Docker
- ✅ Sin limitaciones
- ✅ IP dedicada

---

## 🚀 SOLUCIÓN INMEDIATA: Deploy Frontend + Backend Externo

### PASO 1: Subir Frontend a Hostinger

**Via File Manager (hPanel):**

1. Ve a: https://hpanel.hostinger.com
2. Abre **File Manager**
3. Ve a carpeta: `public_html`
4. **SUBE SOLO archivos frontend:**

```bash
# Archivos HTML
index.html
login.html
panel-cliente-pro.html
panel-comercio.html
repartidor-app.html
acerca-de.html
faq.html
terminos.html
privacidad.html
# ... todos los .html

# Assets
/css/
/js/
/icons/
/images/
manifest.json
sw.js
.htaccess
```

5. **NO subas:**
   - ❌ server.js
   - ❌ node_modules/
   - ❌ config/
   - ❌ models/
   - ❌ src/
   - ❌ .env

---

### PASO 2: Deploy Backend en Render.com (GRATIS)

**2.1. Crear cuenta en Render:**
- Ve a: https://render.com
- Sign up con GitHub

**2.2. Conectar repositorio:**
1. Click en "New +"
2. Selecciona "Web Service"
3. Conecta tu repo: `braianruaimi/YAvoyOk`
4. Branch: `main`

**2.3. Configurar servicio:**
```
Name: yavoy-backend
Region: Oregon (US West)
Branch: main
Root Directory: (dejar vacío)
Runtime: Node
Build Command: npm install
Start Command: node server.js
Plan: Free
```

**2.4. Agregar variables de entorno:**

En Render, ve a "Environment" y agrega:

```env
NODE_ENV=production
PORT=10000

# Base de datos (tu Hostinger MySQL)
DB_HOST=srv1722.hstgr.io
DB_PORT=3306
DB_NAME=u695828542_YAvoyOk26
DB_USER=u695828542_yavoyen5
DB_PASSWORD=Yavoy26!

# JWT
JWT_SECRET=a7b9c5d8e1f2g3h4i6j7k8l9m0n1o2p3...
JWT_EXPIRES_IN=24h

# CORS (tu dominio Hostinger)
ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1669843029634117-...
MERCADOPAGO_PUBLIC_KEY=APP_USR-c77b3180-f0c7-...

# Email Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yavoyen5@gmail.com
SMTP_PASS=ldbe jejw mwno vkal
```

**2.5. Deploy:**
- Click "Create Web Service"
- Espera 5-10 minutos
- Obtendrás una URL: `https://yavoy-backend.onrender.com`

---

### PASO 3: Conectar Frontend con Backend

**3.1. Actualizar URLs en frontend:**

En tus archivos HTML/JS, cambia las llamadas API:

**Antes:**
```javascript
const API_URL = '/api';
```

**Después:**
```javascript
const API_URL = 'https://yavoy-backend.onrender.com/api';
```

**Archivos a modificar:**
- `js/auth.js`
- `js/api-client.js`
- `js/comercio-service.js`
- `js/repartidor-service.js`
- `js/cliente-service.js`

**3.2. Habilitar CORS en backend:**

Ya configurado en tus variables de entorno de Render.

**3.3. Re-subir archivos JS a Hostinger:**

Sube los archivos JS actualizados via File Manager.

---

## ✅ RESULTADO FINAL

**Frontend:** https://yavoy.space (Hostinger Shared)  
**Backend:** https://yavoy-backend.onrender.com (Render Free)  
**Base de datos:** MySQL en Hostinger  

**Pros:**
- ✅ Funciona con tu plan actual
- ✅ Sin costo adicional (Render free tier)
- ✅ Frontend rápido (estático)
- ✅ Backend con Node.js completo

**Contras:**
- ⚠️ Backend se duerme después de 15 min de inactivity (Render free)
- ⚠️ Primera carga después de sleep: ~30 segundos
- ⚠️ Dos dominios diferentes (frontend y backend)

---

## 🎯 RECOMENDACIÓN FINAL

**Si tu presupuesto es 0:** Opción 2 (Frontend Hostinger + Backend Render)

**Si puedes invertir $5-6/mes:** Upgrade a VPS Hostinger
- Tendrás control total
- Todo en un solo servidor
- Sin limitaciones
- Las instrucciones de tu socio funcionarán

---

## 📞 SOPORTE

**Verificar tu plan actual:**
1. Ve a: https://hpanel.hostinger.com
2. Click en tu dominio
3. Ve a "Dashboard"
4. Busca: "Hosting Plan" o "Plan Type"

Si dice "Shared", "Business", "Premium" → Hosting Compartido (NO VPS)  
Si dice "VPS 1", "VPS 2", etc. → Tienes VPS

---

## ⚡ PRÓXIMOS PASOS

1. **Verifica tu plan en hPanel**
2. **Decide:**
   - ¿Upgrade a VPS? → Usar instrucciones del socio
   - ¿Mantener shared? → Seguir esta guía (Render.com)
3. **Avísame tu decisión** para configurar el deployment correcto

---

**Pregunta:** ¿Qué plan de Hostinger tienen exactamente?
