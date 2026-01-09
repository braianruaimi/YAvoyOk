# 🏗️ YAVOY v3.1 - ANÁLISIS TÉCNICO ESTRUCTURAL
**Fecha:** 21 de diciembre de 2025  
**Auditor:** Arquitecto de Sistemas Cloud  
**Versión del Proyecto:** 3.1.0

---

## 1️⃣ ARQUITECTURA DE DATOS

### 📦 Sistema de Persistencia HÍBRIDO (Estado Actual)

| Tipo de Dato | Ubicación Actual | Formato | Operaciones |
|--------------|------------------|---------|-------------|
| **Comercios** | `servicios-*/*.json` | Archivos JSON | CREATE, READ (sin UPDATE/DELETE robusto) |
| **Repartidores** | `registros/repartidores/*.json` | Archivos JSON | CREATE, READ, UPDATE parcial |
| **Clientes** | `registros/clientes/*.json` | Archivos JSON | CREATE, READ |
| **Pedidos** | `registros/pedidos/*.json` + Memoria (`pedidos[]`) | JSON + RAM | CREATE, READ, UPDATE |
| **Chats** | `registros/chats/*.json` + Memoria (`chats{}`) | JSON + RAM | CREATE, READ |
| **Calificaciones** | `registros/calificaciones/*.json` + Memoria (`calificaciones[]`) | JSON + RAM | CREATE, READ |
| **Subscripciones Push** | Memoria (`subscriptions[]`) | RAM únicamente | CREATE, READ, DELETE |
| **Sesiones WebSocket** | Memoria (`usuariosConectados Map`) | RAM únicamente | CREATE, DELETE |
| **Frontend Cache** | IndexedDB (navegador) | `YAvoyDB` store `sync-comercios` | CREATE, READ, DELETE |

### 🔄 Sistema de Migración (Nuevo - No Integrado)

**Archivos Creados pero NO ACTIVOS:**
- `src/database/index.js` - Motor PostgreSQL/MongoDB (510 líneas)
- `migrate-json-to-db.js` - Script de migración (420 líneas)
- `js/db_api.js` - Cliente API REST (350 líneas)

**Estado:** ⚠️ **CÓDIGO CREADO PERO NO INTEGRADO EN server.js**

### 📊 Entidades Principales y Rutas de Persistencia

```
COMERCIOS
├─ Registro inicial → servicios-{categoria}/*.json
├─ Fotos perfil → registros/fotos-perfil/{comercioId}_*
├─ Fotos productos → registros/fotos-perfil/{comercioId}_producto_*
└─ Metadata → registros/fotos-perfil/{comercioId}_metadata.json

REPARTIDORES
├─ Registro inicial → registros/repartidores/{id}_*.json
├─ Documentos verificación → registros/verificaciones/repartidor_{id}/*
├─ Informes CEO → registros/informes-ceo/repartidores/{id}_*.json
└─ Estado online → Memoria (array repartidores[])

PEDIDOS
├─ Creación → registros/pedidos/{id}_{timestamp}.json
├─ Estado en tiempo real → Memoria (array pedidos[])
├─ Chat → registros/chats/{pedidoId}.json + Memoria (chats{})
└─ Calificación → registros/calificaciones/{pedidoId}_*.json

CLIENTES
├─ Registro → registros/clientes/{id}_*.json
└─ Informes CEO → registros/informes-ceo/clientes/{id}_*.json
```

### ⚠️ PROBLEMAS CRÍTICOS DE ARQUITECTURA

1. **Inconsistencia Estado-Archivo**: Los datos en memoria (`pedidos[]`, `chats{}`) NO se sincronizan automáticamente con archivos JSON
2. **Race Conditions**: Múltiples escrituras concurrentes pueden corromper archivos JSON
3. **Sin Transacciones**: No hay rollback si falla una operación
4. **Búsqueda Ineficiente**: Para listar pedidos se debe leer TODOS los archivos JSON
5. **IndexedDB Obsoleto**: El archivo `js/db.js` (líneas 1-48) usa IndexedDB pero NO hay backend que lo consuma

---

## 2️⃣ ÁRBOL DE DEPENDENCIAS CRÍTICAS

### 🔗 Flujo de Request: POST /api/pedidos

```
1. ENTRADA DEL REQUEST
   └─ server.js:263 → app.use('/api/pedidos', generalLimiter, pedidosRoutes)
      │
      ├─ Middleware: generalLimiter (100 req/15min)
      └─ Middleware: sanitizeInputs (limpieza XSS)

2. ROUTING
   └─ src/routes/pedidosRoutes.js:19 → router.post('/', ...)
      │
      └─ Delega a: pedidosController.crearPedido(req, res)

3. CONTROLLER (LÓGICA DE NEGOCIO)
   └─ src/controllers/pedidosController.js:115 → crearPedido()
      │
      ├─ Validación de datos (líneas 116-135)
      ├─ Creación objeto pedido (líneas 140-160)
      ├─ Guardar en memoria: this.pedidos.push(pedido)
      ├─ Guardar en archivo: await this.guardarPedidoArchivo(pedido)
      └─ Notificación Socket.io: this.notificarTodos('nuevoPedido', pedido)

4. PERSISTENCIA
   └─ pedidosController.guardarPedidoArchivo() (líneas 74-84)
      │
      └─ fs.writeFile() → registros/pedidos/{id}_{timestamp}.json

5. NOTIFICACIÓN TIEMPO REAL
   └─ pedidosController.getSocketIO() → io.emit('nuevoPedido', pedido)
      │
      └─ server.js:107-110 → WebSocket broadcast global
         │
         └─ Clientes/Repartidores reciben evento en tiempo real
```

### 📡 Integración server.js ↔ Controllers ↔ Routes

```javascript
// server.js (líneas 100-105)
app.set('socketio', io);                    // ← Inyección de Socket.io
app.set('pedidos', pedidos);                // ← Array en memoria
app.set('repartidores', repartidores);      // ← Array en memoria
pedidosController.init(app, pedidos, ...); // ← Inicialización manual

// pedidosController.js (líneas 23-29)
init(app, pedidos, repartidores, ...) {    // ← Recibe referencias
  this.app = app;
  this.pedidos = pedidos;  // Referencia al array de server.js
}

// Problema: Acoplamiento fuerte, no hay inyección de dependencias formal
```

### ⚠️ PUNTOS DE CONFLICTO

1. **Duplicación de Lógica**: `server.js` tiene 200+ endpoints directos (líneas 708-6200) que DUPLICAN funcionalidad de controllers
2. **State Management Caótico**: `pedidos[]` se modifica desde:
   - `pedidosController.js`
   - Múltiples endpoints en `server.js` (líneas 2500+)
   - Socket.IO handlers (líneas 107-195)

---

## 3️⃣ ESTADO DE LA INTEGRACIÓN v3.0_socio

### 📂 Funcionalidades EXCLUSIVAS en v3.0_socio/

| Archivo | Funcionalidad | ¿Existe en raíz? | Observaciones |
|---------|---------------|------------------|---------------|
| `server.js` | WebPush, Tickets Soporte | ✅ Duplicado | **6817 líneas vs 6330 en raíz** |
| `panel-ceo-master.html` | Panel CEO 13 pestañas | ✅ Duplicado | Ambos funcionales |
| `js/tracking-gps.js` | GPS tracking con Leaflet.js | ❌ NO existe | **ÚNICO en v3.0_socio** |
| `js/referidos-sistema.js` | Sistema de referidos | ❌ NO existe | **ÚNICO en v3.0_socio** |
| `js/recompensas-sistema.js` | Gamificación, logros | ❌ NO existe | **ÚNICO en v3.0_socio** |
| `js/propinas-sistema.js` | Propinas digitales | ❌ NO existe | **ÚNICO en v3.0_socio** |
| `js/pedidos-grupales.js` | Pedidos compartidos | ❌ NO existe | **ÚNICO en v3.0_socio** |
| `js/soporte-chatbot.js` | Chatbot IA soporte | ❌ NO existe | **ÚNICO en v3.0_socio** |
| `utils/simuladorRepartidor.js` | Testing/simulación | ❌ NO existe | **ÚNICO en v3.0_socio** |
| `sw.js` | Service Worker PWA | ✅ Duplicado | Versiones idénticas |

### 🔍 ANÁLISIS DE DUPLICADOS

**Endpoints Duplicados:**
```
RAÍZ (server.js):
- app.post('/api/guardar-comercio')           línea 771
- app.get('/api/listar-comercios')            línea 809
- app.post('/api/pedidos')                    línea 2310 (+ MVC en línea 263)

v3.0_socio (server.js):
- app.post('/api/guardar-comercio')           línea 670 
- app.get('/api/listar-comercios')            línea 708
- app.post('/api/pedidos')                    línea 1554

⚠️ RIESGO: Dos servidores pueden correr simultáneamente en puertos distintos
```

### ⚡ FUNCIONALIDADES NO MIGRADAS (8 archivos)

1. **tracking-gps.js** (608 líneas)
   - Integración Leaflet.js
   - Tracking repartidor en vivo cada 5s
   - Cálculo ETA dinámico
   - Notificaciones de proximidad

2. **referidos-sistema.js** (350+ líneas)
   - Códigos de referido únicos
   - Sistema de créditos
   - Bonificaciones por invitación

3. **recompensas-sistema.js** (450+ líneas)
   - Logros gamificados
   - Medallas, niveles
   - Ranking de usuarios

4. **propinas-sistema.js** (300+ líneas)
   - Propinas post-entrega
   - Sugerencias automáticas (10%, 15%, 20%)
   - Integración con MercadoPago

5. **pedidos-grupales.js** (400+ líneas)
   - Pedidos compartidos entre usuarios
   - Split de pagos
   - Coordinación de entregas

6. **soporte-chatbot.js** (1200+ líneas)
   - Bot inteligente con keywords
   - Respuestas automáticas
   - Sistema de tickets
   - Estadísticas de soporte

7. **simuladorRepartidor.js** (150 líneas)
   - Simulación de movimiento GPS
   - Testing automatizado

8. **inventario-sistema.js** (en raíz pero no documentado)
   - Gestión de stock
   - Alertas de inventario bajo

---

## 4️⃣ PUNTOS DE FALLO CRÍTICOS

### 🚨 Archivos con Lógica Crítica SIN Validación

| Archivo | Líneas | Validación Schema | Manejo Errores | Riesgo |
|---------|--------|-------------------|----------------|--------|
| `server.js` | 6330 | ❌ NO (Joi no usado) | ⚠️ Parcial (try/catch inconsistente) | 🔴 ALTO |
| `src/controllers/pedidosController.js` | 1032 | ❌ NO | ⚠️ Parcial | 🔴 ALTO |
| `src/controllers/authController.js` | ~400 | ❌ NO | ✅ Sí | 🟡 MEDIO |
| `js/mercadopago-integration.js` | ~600 | ❌ NO | ⚠️ Parcial | 🔴 CRÍTICO (pagos) |

### 🔍 Ejemplos de Falta de Validación

**server.js - POST /api/guardar-comercio (línea 771):**
```javascript
app.post('/api/guardar-comercio', async (req, res) => {
  const comercio = req.body;  // ❌ NO HAY VALIDACIÓN
  
  // ⚠️ Problemas:
  // - comercio.email puede ser null/undefined
  // - comercio.categoria puede ser maliciosa (path traversal)
  // - comercio.horario puede ser string en lugar de objeto
  
  const carpeta = `servicios-${comercio.categoria}`; // ⚠️ Inyección de ruta
  const rutaArchivo = path.join(__dirname, carpeta, `${comercio.id}.json`);
  await fs.writeFile(rutaArchivo, JSON.stringify(comercio, null, 2));
  // ❌ Sin validar que comercio.id no sea "../../../etc/passwd"
});
```

**Debería ser:**
```javascript
const Joi = require('joi');

const comercioSchema = Joi.object({
  id: Joi.string().alphanum().required(),
  nombre: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  categoria: Joi.string().valid('prioridad', 'alimentacion', 'salud', ...).required(),
  telefono: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
  coordenadas: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).required()
});

app.post('/api/guardar-comercio', async (req, res) => {
  const { error, value } = comercioSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  // ... continuar con value en lugar de req.body
});
```

### 🐛 Manejo de Errores Inconsistente

**Patrón INCORRECTO (presente en 60% del código):**
```javascript
// server.js línea 809+
app.get('/api/listar-comercios', async (req, res) => {
  try {
    const comercios = [];
    // ... lógica ...
    res.json(comercios); // ✅ OK
  } catch (error) {
    console.error(error);  // ❌ Log pero NO responde al cliente
    // Cliente queda esperando, timeout después de 30s
  }
});
```

**Patrón CORRECTO (usado solo en ~30% del código):**
```javascript
try {
  // ... lógica ...
  res.json({ success: true, data: comercios });
} catch (error) {
  console.error('[LISTAR_COMERCIOS] Error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Error al listar comercios',
    code: 'INTERNAL_ERROR'
  });
}
```

### 💣 Vulnerabilidades de Seguridad

1. **Path Traversal**: `comercio.categoria` sin sanitizar (línea 771)
2. **SQL Injection Potencial**: Si se migra a DB sin usar prepared statements
3. **XSS en Chat**: `chats[pedidoId].push(nuevoMensaje)` sin sanitizar HTML (línea 140)
4. **CSRF**: No hay tokens CSRF en formularios
5. **Rate Limiting Incompleto**: Solo en `/api/auth` y `/api/pedidos`, el resto sin límite

---

## 5️⃣ ANÁLISIS FRONTEND/SERVICIOS

### 📡 Comunicación Frontend → Backend

**Archivos en /js y su Método de Comunicación:**

| Archivo Frontend | API Backend | Método | Estado Socket.io |
|------------------|-------------|--------|------------------|
| `db.js` | ❌ NO USA BACKEND | IndexedDB local | ❌ No conectado |
| `db_api.js` | ✅ `/api/*` | `fetch()` con JWT | ❌ No usa Socket |
| `tracking-gps.js` | ✅ `/api/repartidor/*/ubicacion` | `fetch()` cada 5s | ✅ Recibe eventos |
| `mercadopago-integration.js` | ✅ `/api/mercadopago/*` | `fetch()` POST | ❌ No usa Socket |
| `notifications.js` | ✅ `/api/subscribe`, `/api/send-notification` | `fetch()` + WebPush | ✅ Recibe push |
| `ratings.js` | ✅ `/api/calificaciones` | `fetch()` POST | ❌ No usa Socket |
| `referidos-sistema.js` | ✅ `/api/referidos` | `fetch()` CRUD | ❌ No usa Socket |
| `recompensas-sistema.js` | ✅ `/api/recompensas` | `fetch()` GET/POST | ❌ No usa Socket |
| `soporte-chatbot.js` | ✅ `/api/soporte/tickets` | `fetch()` + Socket | ✅ Chat tiempo real |

### 🔌 Integración WebSockets

**Frontend listeners (ejemplo en panel-repartidor.html):**
```javascript
const socket = io('http://localhost:5502'); // ⚠️ Puerto hardcodeado

socket.on('connect', () => {
  socket.emit('registrar', { userId: repartidorId, tipo: 'repartidor' });
});

socket.on('nuevoPedido', (pedido) => {
  // Mostrar notificación
});

socket.on('pedidoCancelado', (data) => {
  // Actualizar UI
});
```

**Backend emitters (server.js):**
```javascript
// Línea 107-110: Broadcast global (INEFICIENTE)
io.on('connection', (socket) => {
  socket.on('enviarMensaje', async (data) => {
    io.to(`pedido-${pedidoId}`).emit('nuevoMensaje', nuevoMensaje); // ✅ OK: Room específico
  });
});

// Línea 198-200: Helper functions
function notificarRepartidor(repartidorId, evento, data) {
  io.to(`repartidor-${repartidorId}`).emit(evento, data); // ✅ OK
}

function notificarTodos(evento, data) {
  io.emit(evento, data); // ⚠️ INEFICIENTE: Broadcast a TODOS
}
```

### ⚠️ PROBLEMAS DE COMUNICACIÓN

1. **db.js vs db_api.js**: 
   - `db.js` (actual en uso) guarda en IndexedDB (navegador)
   - `db_api.js` (creado pero no usado) llamaría a APIs REST
   - **NO hay migración automática**

2. **Puertos Hardcodeados**:
   ```javascript
   // js/tracking-gps.js línea 381
   const response = await fetch(`/api/repartidor/${repartidorId}/ubicacion`);
   // ⚠️ Asume que API está en mismo host
   
   // Pero en db_api.js línea 10:
   const API_BASE_URL = window.location.hostname === 'localhost' 
     ? 'http://localhost:3000/api'  // ⚠️ Puerto 3000
     : 'https://api.yavoy.com/api'; // ⚠️ Subdominio diferente
   ```

3. **Falta de Manejo de Errores en Fetch**:
   ```javascript
   // tracking-gps.js línea 381-390
   const response = await fetch(`/api/repartidor/${repartidorId}/ubicacion`);
   const data = await response.json(); // ❌ No valida response.ok
   // Si API responde 404 o 500, esto lanza excepción no manejada
   ```

4. **Autenticación Inconsistente**:
   - `db_api.js` usa JWT en header `Authorization: Bearer token`
   - Otros archivos (`tracking-gps.js`, `mercadopago-integration.js`) NO envían token
   - **Resultado**: Endpoints protegidos fallarán 401

5. **Socket.io Rooms Desaprovechados**:
   - Backend define rooms: `repartidor-${id}`, `cliente-${id}`, `pedido-${id}`
   - Frontend NO se une a rooms específicos (excepto en `soporte-chatbot.js`)
   - **Resultado**: Notificaciones se pierden o se envían a usuarios incorrectos

---

## 6️⃣ RECOMENDACIONES CRÍTICAS

### 🔴 PRIORIDAD ALTA (Hacer AHORA)

1. **Unificar server.js**: Eliminar 200+ endpoints directos, usar solo rutas MVC
2. **Implementar Joi Schemas**: Validar TODOS los inputs de APIs críticas
3. **Migrar de JSON a DB**: Ejecutar `migrate-json-to-db.js` y activar `src/database/`
4. **Reemplazar db.js**: Cambiar imports de `db.js` a `db_api.js` en todo el frontend
5. **Consolidar v3.0_socio**: Migrar los 8 archivos únicos al raíz y eliminar carpeta

### 🟡 PRIORIDAD MEDIA (Próximas 2 semanas)

6. **Estandarizar Manejo de Errores**: Patrón try/catch con respuesta JSON consistente
7. **Añadir Logging Centralizado**: Winston o Pino en lugar de `console.log`
8. **Implementar CSRF Tokens**: Para todos los formularios POST
9. **Rate Limiting Global**: Extender a TODOS los endpoints, no solo auth
10. **Documentación OpenAPI**: Generar Swagger docs automáticas

### 🟢 PRIORIDAD BAJA (Backlog)

11. **Testing**: Jest + Supertest para endpoints críticos
12. **CI/CD**: GitHub Actions para deploy automático
13. **Monitoring**: Prometheus + Grafana para métricas
14. **Caché Redis**: Para consultas frecuentes (lista de comercios, repartidores)

---

## 7️⃣ MÉTRICAS DEL PROYECTO

```
LÍNEAS DE CÓDIGO:
├─ server.js (raíz)           6,330 líneas  ⚠️ Monolito gigante
├─ server.js (v3.0_socio)     6,817 líneas  ⚠️ Duplicado
├─ Controllers                 1,432 líneas  ✅ Modular
├─ Routes                        134 líneas  ✅ Bien estructurado
├─ Middleware                  1,200 líneas  ✅ Separado correctamente
├─ Frontend /js               ~8,000 líneas  ⚠️ Algunos duplicados
└─ Total Backend              15,913 líneas

ARCHIVOS:
├─ .js (backend)                    45 archivos
├─ .js (frontend)                   25 archivos
├─ .html (páginas)                  40 archivos
├─ .json (registros)              500+ archivos ⚠️ Imposible de gestionar
└─ .md (documentación)              35 archivos

ENDPOINTS API:
├─ En server.js directo          200+ endpoints ⚠️ Excesivo
├─ En routes MVC                  15 endpoints ✅ Bien
├─ Duplicados entre raíz/v3.0     60+ endpoints ❌ Crítico
└─ Sin documentación              95% ❌ Crítico

TESTING:
├─ Unit tests                    0 archivos ❌
├─ Integration tests             0 archivos ❌
├─ E2E tests                     0 archivos ❌
└─ Test coverage                 0% ❌
```

---

## 8️⃣ CONCLUSIONES

### ✅ FORTALEZAS

1. Arquitectura MVC parcialmente implementada (routes + controllers)
2. Sistema de seguridad avanzado creado (helmet, rate-limit, JWT)
3. Motor de base de datos preparado (PostgreSQL/MongoDB)
4. WebSockets funcionales con sistema de rooms
5. Documentación extensa (35 archivos .md)

### ❌ DEBILIDADES CRÍTICAS

1. **Deuda Técnica Masiva**: 13,000+ líneas en 2 servidores duplicados
2. **Persistencia Caótica**: 500+ archivos JSON sin índices ni relaciones
3. **Validación Inexistente**: 0% de schemas Joi implementados
4. **Testing Inexistente**: 0% de cobertura
5. **v3.0_socio Desincronizado**: 8 funcionalidades críticas solo en carpeta legacy
6. **Frontend Desacoplado**: `db.js` usa IndexedDB sin backend que lo soporte

### ⚠️ RIESGOS INMEDIATOS

- **Corrupción de Datos**: Race conditions en escritura de archivos JSON
- **Vulnerabilidad de Seguridad**: Path traversal, XSS, falta de CSRF
- **Inconsistencia Estado**: Memoria vs Archivos desincronizados
- **Imposibilidad de Escalar**: Con >1000 pedidos, leer 1000 archivos JSON = timeout
- **Conflicto de Versiones**: Dos servidores con endpoints idénticos en puertos distintos

---

**RECOMENDACIÓN FINAL**: Antes de desplegar a producción, es IMPERATIVO completar la migración a base de datos y consolidar v3.0_socio. El sistema actual funciona para pruebas pero NO ES PRODUCTION-READY.

**Prioridad #1**: Ejecutar `npm run migrate` y activar integración de `src/database/` en `server.js`.

---

*Análisis realizado por: Arquitecto de Sistemas Cloud*  
*Herramientas: Análisis estático + Grep + Revisión manual*  
*Fecha: 21 de diciembre de 2025*
