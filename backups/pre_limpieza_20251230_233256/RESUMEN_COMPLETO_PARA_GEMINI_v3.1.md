# 📦 YAVOY v3.1 - RESUMEN COMPLETO DEL SISTEMA

**Fecha de actualización:** Diciembre 2025  
**Versión:** 3.1 (Security Update)  
**Tipo de aplicación:** PWA (Progressive Web App) de entregas/delivery  
**Ubicación:** Argentina (Ensenada/La Plata)

---

## 🎯 DESCRIPCIÓN GENERAL

**YAvoy** es una plataforma completa de delivery/entregas que conecta **comercios**, **repartidores** y **clientes** en tiempo real. Similar a Rappi/PedidosYa pero enfocada en la región de Ensenada y La Plata, Argentina.

### Propuesta de Valor
- 🏪 Comercios pueden publicar productos y recibir pedidos
- 🚴 Repartidores pueden aceptar entregas y ganar dinero
- 👥 Clientes pueden pedir productos con entrega a domicilio
- 📊 Panel CEO para administración y analytics
- 💰 Integración con MercadoPago para pagos
- 🔔 Notificaciones push en tiempo real
- 💬 Chat integrado entre todas las partes

---

## 🏗️ ARQUITECTURA TÉCNICA

### Stack Tecnológico

#### Backend (Node.js)
```javascript
{
  "runtime": "Node.js v18+",
  "framework": "Express v5.1.0",
  "arquitectura": "MVC (Modularizada)",
  "persistencia": "JSON Files (25 carpetas)",
  "realtime": "Socket.IO",
  "seguridad": [
    "JWT + bcrypt",
    "Helmet",
    "Rate Limiting",
    "Joi Validation",
    "CORS Restrictivo"
  ]
}
```

#### Frontend (PWA)
```javascript
{
  "tipo": "Progressive Web App",
  "tecnologias": [
    "HTML5",
    "CSS3",
    "JavaScript Vanilla",
    "Service Worker (offline support)",
    "Web Push API"
  ],
  "responsive": true,
  "offline": true
}
```

#### Integraciones
- **MercadoPago:** QR payments, webhooks, checkout
- **Web Push:** Notificaciones push del navegador
- **Gmail SMTP:** Envío de emails (opcional)
- **Socket.IO:** WebSockets para tiempo real

### Estructura del Servidor (server.js - 6,300+ líneas)

```
┌─────────────────────────────────────────┐
│         Express.js Server               │
│         Puerto: 5501/5502               │
└─────────────────────────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼───────┐    ┌───────▼────────┐
│  HTTP     │    │   Socket.IO     │
│  API      │    │   WebSockets    │
└───┬───────┘    └───────┬────────┘
    │                    │
    │            ┌───────▼──────────┐
    │            │  Notificaciones  │
    │            │  Tiempo Real     │
    │            └──────────────────┘
    │
┌───▼─────────────────────────────────┐
│         Middleware Stack            │
├─────────────────────────────────────┤
│  1. dotenv (variables entorno)      │
│  2. Helmet (headers seguros)        │
│  3. CORS (control acceso)           │
│  4. express.json (parseo JSON)      │
│  5. Sanitización (anti-inyección)   │
│  6. Security Logger                 │
│  7. Rate Limiting (anti-DDoS)       │
└───┬─────────────────────────────────┘
    │
┌───▼─────────────────────────────────┐
│          Sistema Modular MVC        │
├─────────────────────────────────────┤
│  /api/auth/*       (JWT Auth)       │
│  /api/pedidos/*    (Orders MVC)     │
│  /api/comercios/*  (Businesses)     │
│  /api/repartidores/* (Delivery)     │
│  /api/mercadopago/* (Payments)      │
│  /api/notificaciones/* (Push)       │
│  /api/chat/*       (Messaging)      │
│  /api/soporte/*    (Support)        │
└───┬─────────────────────────────────┘
    │
┌───▼─────────────────────────────────┐
│     Persistencia (JSON Files)       │
├─────────────────────────────────────┤
│  /registros/                        │
│    ├── pedidos/                     │
│    ├── comercios/                   │
│    ├── repartidores/                │
│    ├── clientes/                    │
│    ├── chats/                       │
│    ├── calificaciones/              │
│    ├── notificaciones/              │
│    ├── soporte/                     │
│    ├── pagos/                       │
│    └── ... (25 carpetas total)      │
└─────────────────────────────────────┘
```

---

## 🔐 SISTEMA DE SEGURIDAD (v3.1 - RECIÉN IMPLEMENTADO)

### Capas de Protección

#### 1. JWT Authentication
```javascript
// Archivo: src/middleware/auth.js (276 líneas)
{
  "algoritmo": "HS256",
  "access_token": "24 horas",
  "refresh_token": "7 días",
  "roles": ["admin", "ceo", "comercio", "repartidor", "cliente"],
  "permisos": "RBAC (Role-Based Access Control)"
}
```

**Endpoints de autenticación:**
```
POST /api/auth/register/comercio    - Registrar comercio
POST /api/auth/register/repartidor  - Registrar repartidor
POST /api/auth/login                - Login universal
POST /api/auth/refresh              - Renovar token
GET  /api/auth/me [AUTH]            - Info usuario
POST /api/auth/change-password [AUTH] - Cambiar contraseña
```

#### 2. bcrypt - Hash de Contraseñas
```javascript
// 10 salt rounds (2^10 = 1024 iteraciones)
const hashedPassword = await bcrypt.hash(password, 10);
```

**Requisitos de contraseña:**
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número

#### 3. Helmet - Headers de Seguridad HTTP
```javascript
// Archivo: src/middleware/security.js
{
  "Content-Security-Policy": "configurado",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "habilitado",
  "X-XSS-Protection": "1; mode=block"
}
```

#### 4. Rate Limiting

| Endpoint | Límite | Ventana | Propósito |
|----------|--------|---------|-----------|
| API General | 100 req | 15 min | Protección general |
| Auth | 5 req | 15 min | Anti brute force |
| Pedidos | 10 req | 5 min | Anti spam |
| Webhooks | 50 req | 1 min | MercadoPago |

#### 5. Validación con Joi
```javascript
// Archivo: src/middleware/validation.js (378 líneas)
{
  "authSchemas": "Login, registro, cambio contraseña",
  "pedidoSchemas": "CRUD pedidos",
  "pagoSchemas": "Pagos y webhooks",
  "repartidorSchemas": "Ubicación, disponibilidad",
  "comercioSchemas": "Perfiles"
}
```

#### 6. CORS Restrictivo
```javascript
origin: process.env.ALLOWED_ORIGINS || "http://localhost:5502"
credentials: true
methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
```

#### 7. Input Sanitization
```javascript
// Previene XSS, inyección, eventos inline
sanitizeString(input);  // Elimina <>, javascript:, on*=
```

---

## 📂 ESTRUCTURA DE ARCHIVOS

```
YAvoy_DEFINITIVO/
│
├── 📄 server.js (6,304 líneas)        # Servidor principal
├── 📄 package.json                    # Dependencias
├── 📄 .env                            # Variables secretas (JWT, etc.)
├── 📄 .env.example                    # Plantilla configuración
├── 📄 .gitignore                      # Ignorar archivos sensibles
│
├── 📁 src/                            # Código modular MVC
│   ├── 📁 middleware/
│   │   ├── auth.js (276 líneas)      # JWT + RBAC
│   │   ├── security.js (178 líneas)  # Helmet, rate limit, CORS
│   │   └── validation.js (378 líneas) # Joi schemas
│   │
│   ├── 📁 controllers/
│   │   ├── authController.js (541 líneas)   # Login, registro
│   │   └── pedidosController.js (1,032 líneas) # CRUD pedidos
│   │
│   └── 📁 routes/
│       ├── authRoutes.js (194 líneas)       # Rutas auth
│       └── pedidosRoutes.js (65 líneas)     # Rutas pedidos
│
├── 📁 registros/                      # Base de datos JSON (25 carpetas)
│   ├── pedidos/                       # Órdenes
│   ├── comercios/                     # Negocios registrados
│   ├── repartidores/                  # Delivery drivers
│   ├── clientes/                      # Clientes
│   ├── chats/                         # Mensajes
│   ├── calificaciones/                # Reviews
│   ├── notificaciones/                # Notificaciones push
│   ├── soporte/                       # Tickets soporte
│   ├── pagos/                         # Transacciones
│   ├── informes-ceo/                  # Analytics CEO
│   └── ... (16 carpetas más)
│
├── 📁 HTML (Vistas PWA)
│   ├── index.html                     # Landing page
│   ├── panel-comercio.html            # Panel comercio
│   ├── panel-repartidor.html          # Panel repartidor
│   ├── panel-ceo-master.html          # Panel CEO
│   ├── pedidos.html                   # Gestión pedidos
│   ├── chat.html                      # Chat tiempo real
│   ├── pagar-pedido.html              # Checkout MercadoPago
│   └── ... (30+ archivos HTML)
│
├── 📁 js/                             # JavaScript frontend
│   ├── panel-comercio.js
│   ├── panel-repartidor.js
│   ├── mercadopago.js
│   └── ...
│
├── 📁 styles/                         # CSS
│   └── styles.css
│
├── 📁 docs/                           # Documentación (v3.1)
│   ├── PLAN_SEGURIDAD_COMPLETO.md     # Guía seguridad (600+ líneas)
│   ├── INICIO_RAPIDO_SEGURIDAD.md     # Quick start
│   ├── RESUMEN_SEGURIDAD.md           # Resumen ejecutivo
│   ├── CHANGELOG_SEGURIDAD.md         # Cambios v3.1
│   ├── DEPLOY_HOSTINGER.md            # Deploy instructions
│   ├── FIRESTORE_SCHEMA.md            # Schema BD (futuro)
│   └── ... (20+ documentos)
│
├── 📄 sw.js                           # Service Worker (PWA)
├── 📄 manifest.json                   # PWA Manifest
└── 📄 offline.html                    # Página offline
```

---

## 🔌 API ENDPOINTS COMPLETA

### 🔐 Autenticación (v3.1)

```http
POST   /api/auth/register/comercio        # Registrar comercio
POST   /api/auth/register/repartidor      # Registrar repartidor
POST   /api/auth/login                    # Login universal
POST   /api/auth/refresh                  # Renovar token
GET    /api/auth/me                       # Info usuario [AUTH]
POST   /api/auth/change-password          # Cambiar contraseña [AUTH]
GET    /api/auth/docs                     # Documentación API
```

### 📦 Pedidos (MVC)

```http
POST   /api/pedidos                       # Crear pedido
GET    /api/pedidos                       # Listar pedidos
GET    /api/pedidos/:id                   # Ver pedido específico
PATCH  /api/pedidos/:id/estado            # Actualizar estado
PUT    /api/pedidos/:id/estado            # Actualizar estado (alt)
DELETE /api/pedidos/:id                   # Cancelar pedido
POST   /api/pedidos/:id/asignar           # Asignar repartidor
POST   /api/pedidos/:id/calificar         # Calificar pedido
```

### 🏪 Comercios

```http
POST   /api/guardar-comercio              # Registrar comercio (legacy)
GET    /api/listar-comercios              # Listar comercios
GET    /api/comercios/:id                 # Ver comercio específico
PUT    /api/comercios/:id                 # Actualizar comercio
DELETE /api/comercios/:id                 # Eliminar comercio
GET    /api/comercios/:id/estadisticas    # Stats del comercio
```

### 🚴 Repartidores

```http
POST   /api/repartidores                  # Registrar repartidor
GET    /api/repartidores                  # Listar repartidores
GET    /api/repartidores/disponibles      # Repartidores disponibles
GET    /api/repartidores/:id              # Ver repartidor específico
PUT    /api/repartidores/:id              # Actualizar repartidor
POST   /api/repartidores/:id/ubicacion    # Actualizar ubicación GPS
GET    /api/repartidores/:id/historial    # Historial entregas
GET    /api/repartidores/:id/estadisticas # Stats del repartidor
POST   /api/repartidores/:id/verificar    # Verificar documentos
```

### 💰 MercadoPago

```http
GET    /api/mercadopago/public-key        # Obtener public key
POST   /api/mercadopago/crear-qr          # Generar QR de pago
POST   /api/mercadopago/crear-preferencia # Crear preferencia
POST   /api/mercadopago/webhook           # Webhook notificaciones
GET    /api/mercadopago/payment/:id       # Ver estado de pago
```

### 🔔 Notificaciones Push

```http
POST   /api/subscribe                     # Suscribirse a push
POST   /api/notificar                     # Enviar notificación
GET    /api/notificaciones/:userId        # Listar notificaciones
POST   /api/notificaciones/:id/leer       # Marcar como leída
```

### 💬 Chat

```http
GET    /api/chats/:pedidoId               # Ver chat del pedido
POST   /api/chats/:pedidoId/mensaje       # Enviar mensaje
GET    /api/chats/usuario/:userId         # Chats del usuario
```

### 🎫 Soporte

```http
POST   /api/soporte/ticket                # Crear ticket
GET    /api/soporte/tickets               # Listar tickets
GET    /api/soporte/tickets/:id           # Ver ticket
POST   /api/soporte/tickets/:id/responder # Responder ticket
PUT    /api/soporte/tickets/:id/estado    # Cambiar estado
```

### 📊 CEO/Admin

```http
GET    /api/ceo/dashboard                 # Dashboard CEO
GET    /api/ceo/estadisticas              # Estadísticas generales
GET    /api/ceo/repartidores              # Gestión repartidores
GET    /api/ceo/comercios                 # Gestión comercios
GET    /api/ceo/ingresos                  # Reporte ingresos
GET    /api/ceo/verificaciones            # Pendientes verificación
POST   /api/ceo/verificar/:tipo/:id       # Verificar usuario/comercio
```

### ⭐ Calificaciones

```http
POST   /api/calificaciones                # Crear calificación
GET    /api/calificaciones/:tipo/:id      # Ver calificaciones
GET    /api/calificaciones/promedio/:id   # Promedio rating
```

### 🧪 Debug (Development)

```http
GET    /api/debug/test-router             # Test conexión
GET    /api/debug/security-status         # Estado seguridad
GET    /api/debug/pedidos-status          # Estado pedidos
```

---

## 💾 BASE DE DATOS (JSON FILES)

### Estructura de Datos

#### Pedidos (pedidos.json)
```json
{
  "id": "PED1703456789012",
  "comercioId": "COM1703123456789",
  "nombreComercio": "Pizzería Don Juan",
  "nombreCliente": "María García",
  "telefonoCliente": "+54 221 456-7890",
  "direccionEntrega": {
    "calle": "Av. Constitución",
    "numero": "1234",
    "ciudad": "Ensenada",
    "referencia": "Casa azul"
  },
  "productos": [
    {
      "nombre": "Pizza Muzzarella",
      "cantidad": 2,
      "precio": 3500
    }
  ],
  "monto": 7000,
  "estado": "pendiente",
  "metodoPago": "mercadopago",
  "repartidorId": null,
  "fechaCreacion": "2025-12-21T10:30:00.000Z",
  "fechaAsignacion": null,
  "fechaEntrega": null,
  "calificacion": null,
  "notas": "Sin cebolla"
}
```

#### Comercios (comercios.json)
```json
{
  "id": "COM1703123456789",
  "nombre": "Pizzería Don Juan",
  "email": "contacto@donjuan.com",
  "password": "$2a$10$...",  // bcrypt hash
  "telefono": "+54 221 456-7890",
  "direccion": "Av. San Martín 456, Ensenada",
  "rubro": "restaurante",
  "estado": "activo",
  "verificado": true,
  "fechaRegistro": "2025-01-15T08:00:00.000Z",
  "rating": 4.8,
  "pedidosCompletados": 245,
  "horarios": {
    "apertura": "10:00",
    "cierre": "23:00"
  }
}
```

#### Repartidores (repartidores.json)
```json
{
  "id": "REP1703234567890",
  "nombre": "Carlos Rodríguez",
  "email": "carlos@email.com",
  "password": "$2a$10$...",  // bcrypt hash
  "telefono": "+54 221 567-8901",
  "dni": "38456789",
  "vehiculo": "moto",
  "zonaCobertura": ["Ensenada", "La Plata"],
  "estado": "disponible",
  "verificado": true,
  "verificadoEmail": true,
  "verificadoDocumentos": true,
  "fechaRegistro": "2025-02-01T09:00:00.000Z",
  "rating": 4.9,
  "entregasCompletadas": 456,
  "saldoTotal": 125600,
  "ubicacionActual": {
    "latitud": -34.8656,
    "longitud": -57.9144,
    "timestamp": "2025-12-21T11:00:00.000Z"
  },
  "pedidosActivos": []
}
```

#### Chats (chat_PED123.json)
```json
{
  "pedidoId": "PED1703456789012",
  "mensajes": [
    {
      "id": "MSG1703456789100",
      "remitente": "comercio",
      "remitenteId": "COM1703123456789",
      "mensaje": "El pedido está listo",
      "timestamp": "2025-12-21T11:05:00.000Z",
      "leido": true
    },
    {
      "id": "MSG1703456789101",
      "remitente": "repartidor",
      "remitenteId": "REP1703234567890",
      "mensaje": "Voy en camino",
      "timestamp": "2025-12-21T11:10:00.000Z",
      "leido": false
    }
  ]
}
```

---

## 🌐 SOCKET.IO - EVENTOS EN TIEMPO REAL

### Eventos del Cliente

```javascript
// Conectar y registrarse
socket.emit('registrar', {
  userId: 'REP1703234567890',
  tipo: 'repartidor'  // comercio, repartidor, cliente, ceo
});

// Chat
socket.emit('enviarMensaje', {
  pedidoId: 'PED123',
  mensaje: 'Hola',
  remitente: 'repartidor',
  remitenteId: 'REP123'
});

// Actualizar ubicación (repartidor)
socket.emit('actualizarUbicacion', {
  repartidorId: 'REP123',
  latitud: -34.8656,
  longitud: -57.9144
});
```

### Eventos del Servidor

```javascript
// Nuevo pedido
socket.on('nuevoPedido', (data) => {
  // data: { pedido: {...} }
});

// Actualización de pedido
socket.on('actualizacionPedido', (data) => {
  // data: { pedidoId, nuevoEstado, ... }
});

// Nuevo mensaje en chat
socket.on('nuevoMensaje', (data) => {
  // data: { pedidoId, mensaje: {...} }
});

// Ubicación actualizada
socket.on('ubicacionActualizada', (data) => {
  // data: { repartidorId, latitud, longitud }
});

// Notificación general
socket.on('notificacion', (data) => {
  // data: { titulo, mensaje, tipo }
});
```

---

## ⚙️ CONFIGURACIÓN Y VARIABLES DE ENTORNO

### Archivo .env

```env
# Seguridad
NODE_ENV=development
PORT=5502
JWT_SECRET=<clave_generada_64_chars>
JWT_EXPIRES_IN=24h
SESSION_SECRET=<otra_clave_64_chars>

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=TEST-YOUR-TOKEN
MERCADOPAGO_PUBLIC_KEY=TEST-YOUR-KEY
MERCADOPAGO_WEBHOOK_SECRET=<webhook_secret>

# CORS
ALLOWED_ORIGINS=http://localhost:5502,https://tudominio.com

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=<app_password>

# Web Push
VAPID_PUBLIC_KEY=<public_key>
VAPID_PRIVATE_KEY=<private_key>
VAPID_SUBJECT=mailto:tu_email@gmail.com
```

---

## 📱 FLUJO DE USUARIO TÍPICO

### 1. Comercio crea pedido

```
1. Comercio se registra/login → Obtiene JWT token
2. Cliente llama y hace pedido por teléfono
3. Comercio ingresa pedido en panel-comercio.html
4. POST /api/pedidos → Pedido creado
5. Socket.IO notifica a todos los repartidores disponibles
6. Repartidor ve pedido en su panel
```

### 2. Repartidor acepta y entrega

```
1. Repartidor acepta pedido
2. POST /api/pedidos/:id/asignar
3. Estado cambia: pendiente → confirmado → en_camino
4. Comercio y cliente reciben notificaciones Socket.IO
5. Repartidor actualiza ubicación GPS cada 30 seg
6. Cliente ve mapa en tiempo real
7. Repartidor marca como entregado
8. Estado: entregado
9. Cliente califica: POST /api/calificaciones
```

### 3. Pago con MercadoPago

```
1. POST /api/mercadopago/crear-qr
2. Cliente escanea QR o paga por link
3. MercadoPago envía webhook: POST /api/mercadopago/webhook
4. Sistema verifica pago
5. Actualiza estado del pedido
6. Notifica a todas las partes
```

---

## 📊 CARACTERÍSTICAS PRINCIPALES

### ✅ Implementadas y Funcionando

1. **Autenticación JWT completa** (v3.1)
   - Login/registro comercios y repartidores
   - Tokens con expiración
   - Refresh tokens
   - Sistema de roles y permisos

2. **Sistema MVC Modularizado**
   - Controladores separados
   - Rutas organizadas
   - Middleware centralizado

3. **Seguridad Multi-Capa**
   - Helmet, CORS, Rate Limiting
   - bcrypt hash (10 rounds)
   - Validación con Joi
   - Sanitización de inputs

4. **Notificaciones Push**
   - Web Push API
   - Suscripciones persistentes
   - Notificaciones en tiempo real

5. **Chat en Tiempo Real**
   - Socket.IO
   - Chat por pedido
   - Mensajes instantáneos

6. **Integración MercadoPago**
   - QR de pago
   - Webhooks
   - Verificación de pagos

7. **Panel CEO/Analytics**
   - Dashboard con métricas
   - Verificación de usuarios
   - Gestión de comercios/repartidores
   - Reportes financieros

8. **Sistema de Calificaciones**
   - Rating 1-5 estrellas
   - Comentarios
   - Promedio calculado

9. **Soporte/Tickets**
   - Sistema de tickets
   - Estados: abierto/en_proceso/cerrado
   - Respuestas de admin

10. **PWA Completa**
    - Service Worker
    - Funciona offline
    - Instalable en móvil
    - App-like experience

### 🚧 En Desarrollo / Pendientes

1. **Base de Datos SQL/NoSQL**
   - Migrar de JSON a MongoDB/PostgreSQL
   - Mayor escalabilidad
   - Búsquedas más eficientes

2. **HTTPS/SSL**
   - Certificado Let's Encrypt
   - Obligatorio para producción

3. **2FA (Two-Factor Authentication)**
   - SMS o email
   - Mayor seguridad

4. **OAuth2**
   - Login con Google/Facebook
   - Simplificar registro

5. **Email Verification**
   - Confirmar email al registrarse
   - Reset password por email

6. **Geolocalización Avanzada**
   - Cálculo de rutas
   - Estimación de tiempo de entrega
   - Zonas de cobertura

7. **App Móvil Nativa**
   - React Native o Flutter
   - Mejor experiencia móvil

---

## 🔧 DEPENDENCIAS (package.json)

```json
{
  "name": "yavoy-api",
  "version": "3.1.0",
  "dependencies": {
    "express": "^5.1.0",
    "socket.io": "^4.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "web-push": "^3.6.6",
    "nodemailer": "^6.9.7",
    
    // Seguridad v3.1
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "joi": "^17.11.0",
    "express-rate-limit": "^7.1.5"
  }
}
```

---

## 🚀 COMANDOS DE EJECUCIÓN

### Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor (desarrollo)
node server.js
# o
npm start

# Puerto por defecto: 5501 o 5502
# Acceder: http://localhost:5502
```

### Producción (recomendado)

```bash
# Usar PM2 para gestión de procesos
npm install -g pm2

pm2 start server.js --name yavoy
pm2 startup  # Autoarranque
pm2 save     # Guardar configuración
```

### Testing

```bash
# Test de seguridad
Invoke-WebRequest http://localhost:5502/api/debug/security-status

# Test de autenticación
curl -X POST http://localhost:5502/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}'

# Test de pedidos
curl -X GET http://localhost:5502/api/pedidos \
  -H "Authorization: Bearer <token>"
```

---

## 🎨 DISEÑO Y UX

### Paleta de Colores

```css
:root {
  --primary: #4CAF50;      /* Verde principal */
  --secondary: #2196F3;    /* Azul */
  --danger: #f44336;       /* Rojo */
  --warning: #ff9800;      /* Naranja */
  --success: #4CAF50;      /* Verde */
  --dark: #1a1a1a;        /* Negro */
  --light: #f5f5f5;       /* Gris claro */
}
```

### Responsive Design

- 📱 Mobile First
- 💻 Desktop optimizado
- 🖥️ Tablets soportadas
- ✨ Animaciones CSS
- 🎯 UX intuitiva

---

## 📈 MÉTRICAS Y ANALYTICS

### Dashboard CEO incluye:

1. **Pedidos**
   - Total pedidos hoy/semana/mes
   - Pedidos completados vs cancelados
   - Tiempo promedio de entrega
   - Gráfico de tendencias

2. **Repartidores**
   - Total activos
   - Disponibles ahora
   - Rating promedio
   - Ganancias totales

3. **Comercios**
   - Total registrados
   - Activos vs inactivos
   - Top 10 por volumen
   - Rating promedio

4. **Financiero**
   - Ingresos totales
   - Comisiones generadas
   - Pagos pendientes
   - Gráficos de ingresos

5. **Usuarios**
   - Clientes activos
   - Nuevos registros
   - Retención de usuarios

---

## 🐛 DEBUGGING Y LOGS

### Logs del Sistema

```javascript
// Logs disponibles en consola
[SECURITY] timestamp | IP | METHOD /api/path
[JWT] Token generado para usuario X
[PEDIDOS] Nuevo pedido creado: PED123
[SOCKET.IO] Cliente conectado: socketId
[MERCADOPAGO] Webhook recibido: payment_id
[ERROR] Descripción del error
```

### Endpoints de Debug

```http
GET /api/debug/test-router         # Test básico
GET /api/debug/security-status     # Estado seguridad
GET /api/debug/pedidos-status      # Estado pedidos
```

---

## 🔒 SEGURIDAD - NIVEL ACTUAL

### Antes de v3.1
```
Seguridad: ▓▓░░░░░░░░ 2/10 🔴 CRÍTICO
- Sin autenticación
- Contraseñas en texto plano
- Sin rate limiting
- CORS abierto (*)
- Sin validación robusta
```

### Después de v3.1
```
Seguridad: ▓▓▓▓▓▓▓▓░░ 8/10 🟢 SÓLIDO
✅ JWT + bcrypt
✅ Rate limiting
✅ Helmet (headers seguros)
✅ CORS restrictivo
✅ Validación Joi
✅ Sanitización inputs
✅ Logs de seguridad
```

### Para llegar a 10/10

1. ✅ HTTPS obligatorio (Let's Encrypt)
2. ✅ Migrar a base de datos
3. ✅ 2FA para usuarios
4. ✅ Auditoría de seguridad externa
5. ✅ Penetration testing

---

## 🚀 ROADMAP FUTURO

### Corto Plazo (1-3 meses)

- [ ] HTTPS en producción
- [ ] Migrar a MongoDB
- [ ] Deploy en servidor cloud (AWS/Azure/Hostinger)
- [ ] Email verification
- [ ] Tests automatizados (Jest)

### Mediano Plazo (3-6 meses)

- [ ] App móvil nativa (React Native)
- [ ] OAuth2 (Google, Facebook)
- [ ] 2FA obligatorio para comercios
- [ ] Sistema de cupones/descuentos
- [ ] Programa de referidos

### Largo Plazo (6-12 meses)

- [ ] IA para predicción de demanda
- [ ] Chatbot automático
- [ ] Sistema de fidelización
- [ ] Expansión a otras ciudades
- [ ] API pública para integraciones

---

## 💡 CASOS DE USO PRINCIPALES

### 1. Comercio (Pizzería)

```
Usuario: Pizzería Don Juan
Necesidad: Recibir y gestionar pedidos de delivery

Flujo:
1. Se registra en /api/auth/register/comercio
2. Accede a panel-comercio.html con JWT
3. Cliente llama: "Quiero 2 pizzas"
4. Comercio crea pedido en sistema
5. Sistema notifica a repartidores disponibles
6. Repartidor acepta → Comercio recibe notificación
7. Prepara pedido
8. Repartidor llega → Entrega pedido
9. Comercio ve estadísticas en tiempo real
```

### 2. Repartidor (Delivery)

```
Usuario: Carlos (motoquero)
Necesidad: Ganar dinero haciendo deliveries

Flujo:
1. Se registra en /api/auth/register/repartidor
2. Sube documentos (DNI, licencia)
3. CEO verifica y aprueba
4. Accede a panel-repartidor.html
5. Ve pedidos disponibles en tiempo real
6. Acepta pedido → Recibe dirección
7. GPS actualiza ubicación automáticamente
8. Chat con comercio si hay dudas
9. Marca como entregado
10. Recibe calificación + pago
```

### 3. CEO/Admin

```
Usuario: Administrador de YAvoy
Necesidad: Gestionar plataforma y ver analytics

Flujo:
1. Login en panel-ceo-master.html
2. Dashboard con métricas en tiempo real
3. Verifica nuevos comercios/repartidores
4. Ve pedidos activos en mapa
5. Gestiona tickets de soporte
6. Analiza reportes financieros
7. Toma decisiones basadas en datos
```

---

## 🔍 TECNOLOGÍAS Y CONCEPTOS CLAVE

### Backend Avanzado

- **Express Router**: Routing modular
- **Middleware Stack**: Pipeline de procesamiento
- **Singleton Pattern**: Controlador único
- **Event-Driven**: Socket.IO events
- **RESTful API**: Estándar REST
- **JWT**: Stateless authentication
- **bcrypt**: Cryptographic hashing
- **Rate Limiting**: DDoS protection

### Frontend Moderno

- **PWA**: Progressive Web App
- **Service Worker**: Offline support
- **Web Push API**: Browser notifications
- **LocalStorage**: Client-side storage
- **Fetch API**: HTTP requests
- **Socket.IO Client**: WebSocket client
- **Responsive Design**: Mobile-first
- **CSS Grid/Flexbox**: Modern layouts

### DevOps

- **dotenv**: Environment variables
- **PM2**: Process management
- **Git**: Version control
- **npm**: Package management
- **Let's Encrypt**: Free SSL/TLS

---

## 📚 DOCUMENTACIÓN DISPONIBLE

1. **PLAN_SEGURIDAD_COMPLETO.md** (600+ líneas)
   - Arquitectura de seguridad
   - Flujos de autenticación
   - Configuración detallada
   - Testing y validación

2. **INICIO_RAPIDO_SEGURIDAD.md**
   - Quick start guide
   - Ejemplos de código
   - Comandos útiles
   - Troubleshooting

3. **RESUMEN_SEGURIDAD.md**
   - Resumen ejecutivo
   - Métricas antes/después
   - ROI de seguridad
   - Checklist deployment

4. **CHANGELOG_SEGURIDAD.md**
   - Historia de cambios v3.1
   - Breaking changes
   - Migración de datos

5. **DEPLOY_HOSTINGER.md**
   - Instrucciones de deploy
   - Configuración servidor
   - DNS y dominios

6. **FIRESTORE_SCHEMA.md**
   - Migración futura a Firestore
   - Estructura de colecciones

---

## ⚠️ LIMITACIONES ACTUALES

### Técnicas

1. **Base de Datos JSON**
   - No escalable para muchos usuarios
   - Búsquedas lentas
   - Sin transacciones ACID
   - Archivos pueden corromperse

2. **HTTP (sin HTTPS)**
   - Inseguro para producción
   - Datos viajan en texto plano
   - No cumple estándares modernos

3. **Monolítico**
   - Todo en un solo archivo (server.js)
   - Difícil de mantener a largo plazo
   - (Mejorado con MVC pero aún monolito)

### Funcionales

1. **Sin App Móvil Nativa**
   - PWA funciona pero experiencia limitada
   - Sin notificaciones push offline

2. **Geolocalización Básica**
   - Solo muestra ubicación
   - No calcula rutas optimizadas
   - Sin ETAs precisos

3. **Sin Tests Automatizados**
   - Testing manual
   - Riesgo de regresiones

### De Negocio

1. **Single Tenant**
   - Solo funciona para una ciudad/región
   - No multi-tenancy

2. **Sin Sistema de Pagos a Repartidores**
   - Pagos manuales
   - No automatizado

---

## 🎯 PUNTOS CLAVE PARA GEMINI

### Lo que YAvoy HACE BIEN:

✅ **Arquitectura modular** (MVC implementado)  
✅ **Seguridad robusta** (7 capas de protección)  
✅ **Tiempo real** (Socket.IO funcional)  
✅ **PWA completa** (offline support)  
✅ **Pagos integrados** (MercadoPago)  
✅ **UX intuitiva** (fácil de usar)  
✅ **Documentación completa** (4 docs principales)  

### Lo que YAvoy NECESITA:

⚠️ **Base de datos escalable** (MongoDB/PostgreSQL)  
⚠️ **HTTPS obligatorio** (Let's Encrypt)  
⚠️ **Tests automatizados** (Jest/Mocha)  
⚠️ **Deploy en cloud** (AWS/Azure/Hostinger)  
⚠️ **CI/CD pipeline** (GitHub Actions)  
⚠️ **Monitoring/APM** (New Relic/Datadog)  

### Lo que Gemini PUEDE AYUDAR:

🤖 **Migración a base de datos** (scripts automáticos)  
🤖 **Generación de tests** (casos de prueba)  
🤖 **Optimización de código** (refactoring)  
🤖 **Documentación automática** (JSDoc/Swagger)  
🤖 **IA para predicciones** (demanda, rutas)  
🤖 **Chatbot inteligente** (atención cliente)  

---

## 📞 INFORMACIÓN DE CONTACTO

**Proyecto:** YAvoy v3.1  
**Ubicación:** Ensenada/La Plata, Argentina  
**Email:** yavoyen5@gmail.com  
**Estado:** ✅ Operativo en desarrollo  
**Última actualización:** Diciembre 2025  

---

## 🏁 CONCLUSIÓN

YAvoy v3.1 es una **plataforma de delivery completa y funcional** con:

- ✅ **Backend robusto** con Node.js/Express
- ✅ **Seguridad enterprise-level** (JWT, bcrypt, Helmet, etc.)
- ✅ **Frontend PWA** con offline support
- ✅ **Tiempo real** con Socket.IO
- ✅ **Pagos** con MercadoPago
- ✅ **Arquitectura MVC** modularizada
- ✅ **Documentación completa**

**El sistema está listo para:**
- Desarrollo continuo
- Testing con usuarios reales
- Deploy en staging
- Expansión de features

**Lo que falta para producción:**
1. Migrar a base de datos SQL/NoSQL
2. Implementar HTTPS
3. Deploy en servidor cloud
4. Tests automatizados
5. Monitoring y logs

**Total de código:**
- Backend: ~8,000 líneas
- Frontend: ~5,000 líneas
- Documentación: ~3,000 líneas
- **TOTAL: ~16,000 líneas**

---

**🎉 YAvoy v3.1 - Sistema completo de delivery listo para evolucionar** 🚀
