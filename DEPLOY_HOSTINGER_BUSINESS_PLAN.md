# 🚀 DEPLOYMENT YAVOY - HOSTINGER BUSINESS PLAN

## 📊 TU PLAN: Hostinger Business

**Características del plan Business:**
- ✅ 100 GB SSD Storage
- ✅ ~100 sitios web
- ✅ Acceso SSH (limitado)
- ✅ MySQL remoto habilitado
- ✅ Git integration
- ⚠️ Node.js Selector (disponible en ALGUNOS servidores)
- ❌ NO es VPS (recursos compartidos)
- ❌ NO puedes usar PM2 daemon

---

## 🔍 PASO 1: VERIFICAR SI TIENES NODE.JS

### Método A: Desde hPanel

1. Ve a: https://hpanel.hostinger.com
2. Selecciona tu sitio web (yavoy.space)
3. Busca en el sidebar izquierdo:
   - **"Node.js"** o
   - **"Advanced" > "Select PHP Version"** (a veces está ahí) o
   - **"Software" > "Node.js Selector"**

**Si encuentras "Node.js Selector" o "Node.js":**
- ✅ **Tu servidor SÍ soporta Node.js** → Sigue a **OPCIÓN A**
- ❌ **No lo ves** → Tu servidor NO soporta Node.js → Sigue a **OPCIÓN B**

### Método B: Verificar por SSH

```bash
# Conectar por SSH
ssh u695828542@147.79.84.219 -p 65002

# Una vez dentro, verificar Node.js
which node
node --version

# Si responde con versión (ej: v18.x.x)
# → Tienes Node.js disponible

# Si dice "command not found"
# → No tienes Node.js
```

---

## 🎯 OPCIÓN A: TU SERVIDOR SOPORTA NODE.JS

### Configuración Node.js Selector

**1. Activar Node.js en hPanel:**

1. Ve a: Node.js Selector o Node.js Management
2. **Configuración:**
   - **Domain/Directory:** `yavoy.space` o `public_html`
   - **Node.js version:** `18.x` o `20.x` (la más reciente disponible)
   - **Application mode:** `production`
   - **Application root:** `/home/u695828542/public_html`
   - **Application URL:** `https://yavoy.space`
   - **Application startup file:** `server.js`

3. Click **"Enable"** o **"Create"**

**2. Instalar dependencias:**

```bash
# Conectar por SSH
ssh u695828542@147.79.84.219 -p 65002

# Ir al directorio
cd ~/public_html

# Clonar repositorio (si no está)
git clone https://github.com/braianruaimi/YAvoyOk.git .

# Instalar dependencias
npm install --production

# Crear archivo .env
cat > .env << 'EOF'
# BASE DE DATOS
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u695828542_YAvoyOk26
DB_USER=u695828542_ssh
DB_PASSWORD=Yavoy26!
DB_POOL_MIN=2
DB_POOL_MAX=5

# PRODUCCIÓN
NODE_ENV=production
PORT=3000

# JWT
JWT_SECRET=a7b9c5d8e1f2g3h4i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5
JWT_EXPIRES_IN=24h
SESSION_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8t7s6r5q4p3o2n1m0l9k8j7i6h5g4f3e2d1c0b9a8z7y6x5w4v3u2t1s0r9q8p7o6n5m4l3k2j1i0h9g8f7e6d5c4b3a2z1y0x9w8v7u6t5s4r3q2p1o0n9m8l7k6j5i4h3g2f1e0d9c8b7a6z5y4x3w2v1u0t9s8r7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a0

# MERCADOPAGO
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1669843029634117-021901-044acdd220c1e28bddc123272f9031a4-2691839466
MERCADOPAGO_PUBLIC_KEY=APP_USR-c77b3180-f0c7-4a98-9cc9-ba06142251af
MERCADOPAGO_WEBHOOK_SECRET=404dcf91f249a7c24da374d93cd9ccebc00ce10d1a912721cf19fd1ea6d95ee8

# CORS
ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space,http://yavoy.space

# EMAIL GMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yavoyen5@gmail.com
SMTP_PASS=ldbe jejw mwno vkal
SMTP_SECURE=false
SMTP_TLS=true

# VAPID
VAPID_PUBLIC_KEY=BL4P9zTOxEkQBAmTV3XiyK9305PJDZKoPr52a0NNedpV5OVfuZGlf9SL21zVE9D4AwNfgWzKw8bHA-peL_g-qZs
VAPID_PRIVATE_KEY=SmZvfO1ZhLtbCrewuGFDnG0gfuTeV5DT9vRBjmWlBL4
VAPID_SUBJECT=mailto:yavoyen5@gmail.com
EOF
```

**3. Crear archivo .htaccess para proxy:**

```bash
cat > .htaccess << 'EOF'
# Proxy para Node.js
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# CORS headers
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"
EOF
```

**4. Reiniciar la aplicación:**

Desde hPanel > Node.js Selector:
- Click en **"Restart"** o **"Stop/Start"**

**5. Verificar:**

```bash
# Ver logs
tail -f ~/logs/app.log

# O en Node.js Selector, ver sección "Logs"
```

---

## 🎯 OPCIÓN B: TU SERVIDOR NO SOPORTA NODE.JS

Si no encontraste Node.js Selector, tu única opción es arquitectura dividida:

### Frontend (Hostinger) + Backend (Externo Gratis)

#### PASO 1: Subir Frontend a Hostinger

**Via File Manager:**

1. Ve a: https://hpanel.hostinger.com
2. Abre **File Manager**
3. Ve a: `/home/u695828542/public_html`
4. **Elimina** todo el contenido actual
5. **Sube SOLO estos archivos:**

```
✅ Todos los archivos .html
✅ /css/ (completa)
✅ /js/ (completa)
✅ /icons/
✅ /images/
✅ manifest.json
✅ sw.js
✅ .htaccess
```

**NO subas:**
```
❌ server.js
❌ server-*.js
❌ node_modules/
❌ config/
❌ models/
❌ src/
❌ .env
❌ package.json
```

#### PASO 2: Deploy Backend en Render.com (GRATIS)

**1. Crear cuenta:**
- Ve a: https://render.com
- Sign up con GitHub

**2. Nuevo servicio:**
1. Click "New +" → "Web Service"
2. Connect tu repo: `braianruaimi/YAvoyOk`
3. Configuración:
   ```
   Name: yavoy-backend
   Region: Oregon (US West)
   Branch: main
   Runtime: Node
   Build Command: npm install
   Start Command: node server.js
   Instance Type: Free
   ```

**3. Variables de entorno en Render:**

```env
NODE_ENV=production
PORT=10000

# MySQL Hostinger (acceso remoto)
DB_HOST=srv1722.hstgr.io
DB_PORT=3306
DB_NAME=u695828542_YAvoyOk26
DB_USER=u695828542_ssh
DB_PASSWORD=Yavoy26!

# JWT y Secrets
JWT_SECRET=a7b9c5d8e1f2g3h4i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5
JWT_EXPIRES_IN=24h
SESSION_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8t7s6r5q4p3o2n1m0l9k8j7i6h5g4f3e2d1c0b9a8z7y6x5w4v3u2t1s0r9q8p7o6n5m4l3k2j1i0h9g8f7e6d5c4b3a2z1y0x9w8v7u6t5s4r3q2p1o0n9m8l7k6j5i4h3g2f1e0d9c8b7a6z5y4x3w2v1u0t9s8r7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a0

# CORS (tu dominio)
ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1669843029634117-021901-044acdd220c1e28bddc123272f9031a4-2691839466
MERCADOPAGO_PUBLIC_KEY=APP_USR-c77b3180-f0c7-4a98-9cc9-ba06142251af
MERCADOPAGO_WEBHOOK_SECRET=404dcf91f249a7c24da374d93cd9ccebc00ce10d1a912721cf19fd1ea6d95ee8

# Email Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yavoyen5@gmail.com
SMTP_PASS=ldbe jejw mwno vkal
SMTP_SECURE=false
SMTP_TLS=true

# VAPID
VAPID_PUBLIC_KEY=BL4P9zTOxEkQBAmTV3XiyK9305PJDZKoPr52a0NNedpV5OVfuZGlf9SL21zVE9D4AwNfgWzKw8bHA-peL_g-qZs
VAPID_PRIVATE_KEY=SmZvfO1ZhLtbCrewuGFDnG0gfuTeV5DT9vRBjmWlBL4
VAPID_SUBJECT=mailto:yavoyen5@gmail.com
```

**4. Deploy:**
- Click "Create Web Service"
- Espera 5-10 minutos
- Obtendrás: `https://yavoy-backend.onrender.com`

#### PASO 3: Conectar Frontend → Backend

**Crear archivo de configuración API:**

En tu proyecto local, crea: `js/config.js`

```javascript
// js/config.js
const API_CONFIG = {
  // URL del backend en Render
  BASE_URL: 'https://yavoy-backend.onrender.com',
  
  // Endpoints
  ENDPOINTS: {
    auth: '/api/auth',
    comercios: '/api/comercios',
    pedidos: '/api/pedidos',
    repartidores: '/api/repartidores',
    mercadopago: '/api/mercadopago',
    // ... etc
  },
  
  // Timeout para despertar el backend
  TIMEOUT: 35000 // 35 segundos
};

// Helper para hacer peticiones
async function apiFetch(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include'
    });
    
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

**Actualizar archivos JS:**

En todos tus archivos JS que hacen peticiones API, reemplaza:

```javascript
// ANTES
fetch('/api/auth/login', { ... })

// DESPUÉS
apiFetch('/api/auth/login', { ... })
```

**Agregar script en HTML:**

En todos tus archivos HTML, antes de otros scripts:

```html
<script src="js/config.js"></script>
```

**Subir archivos actualizados a Hostinger:**

Via File Manager o FileZilla/WinSCP.

---

## 🎯 OPCIÓN C: UPGRADE A VPS (~$5/mes)

Si quieres la mejor experiencia y que todo funcione perfecto:

**VPS 1 de Hostinger** (~$4-6/mes):
- ✅ SSH completo con root
- ✅ PM2 funcionando
- ✅ Node.js 100% compatible
- ✅ Instrucciones de tu socio funcionarán perfectas
- ✅ IP dedicada
- ✅ Sin limitaciones

**Para upgrade:**
1. Ve a: https://hpanel.hostinger.com
2. Busca "Upgrade" o "VPS"
3. Selecciona VPS 1 (el más económico)
4. Migración automática de datos

---

## 📊 COMPARACIÓN DE OPCIONES

| Característica | A: Node.js Selector | B: Render.com | C: VPS |
|----------------|---------------------|---------------|--------|
| **Costo** | Incluido | Gratis | ~$5/mes |
| **Setup** | Medio | Fácil | Complejo |
| **Performance** | Medio | Medio* | Alto |
| **Control** | Limitado | Ninguno | Total |
| **Mantenimiento** | Bajo | Ninguno | Alto |
| **Latency** | Baja | Media | Baja |
| **Recomendado para** | Pruebas | MVP | Producción |

*Backend en Render se duerme tras 15 min inactividad

---

## ✅ RECOMENDACIÓN FINAL

**Para empezar YA (0 costo adicional):**
1. Verifica si tienes Node.js Selector → **OPCIÓN A**
2. Si no → **OPCIÓN B** (Render.com)

**Para producción seria:**
- **OPCIÓN C** (Upgrade a VPS)

---

## 📞 PRÓXIMOS PASOS

1. **Verifica Node.js:**
   - Ve a hPanel y busca "Node.js"
   - O conéctate por SSH: `ssh u695828542@147.79.84.219 -p 65002`
   - Ejecuta: `node --version`

2. **Avísame el resultado:**
   - "SÍ tengo Node.js" → Te ayudo con OPCIÓN A
   - "NO tengo Node.js" → Configuramos OPCIÓN B
   - "Quiero VPS" → Te ayudo con el upgrade

**¿Qué encontraste? ¿Tienes Node.js Selector en tu panel?**
