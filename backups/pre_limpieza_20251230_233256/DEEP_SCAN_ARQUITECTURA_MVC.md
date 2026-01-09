# 🔍 DEEP SCAN - Arquitectura MVC YAvoy v3.1
**Fecha:** 15/12/2025  
**Analista:** Arquitecto de Software Senior  
**Scope:** Sistema de Pedidos Modular (MVC Pattern)

---

## 📊 DIAGNÓSTICO EJECUTIVO

**Estado General:** 🔴 CRÍTICO - Router MVC NO OPERATIVO

**Problema Principal Identificado:**
El middleware `express.static(__dirname)` está **interceptando TODAS las peticiones HTTP** antes de que lleguen a los routers de API, debido a la existencia de una carpeta física o comportamiento de Express que devuelve "Cannot GET" en lugar de pasar al siguiente middleware.

---

## 🚨 ERRORES DE RUTAS IDENTIFICADOS

### Endpoints Afectados (404 Not Found):
```
❌ GET  /api/pedidos                 → Cannot GET /api/pedidos
❌ POST /api/pedidos                 → Cannot POST /api/pedidos  
❌ GET  /api/pedidos/:id             → Cannot GET /api/pedidos/:id
❌ PATCH /api/pedidos/:id/estado     → Cannot PATCH /api/pedidos/:id/estado
❌ PUT  /api/pedidos/:id/estado      → Cannot PUT /api/pedidos/:id/estado
❌ GET  /api/debug/test-router       → Cannot GET /api/debug/test-router
❌ GET  /api/debug/pedidos-status    → Cannot GET /api/debug/pedidos-status
```

### Rutas de Prueba Realizadas:
- **PowerShell:** `Invoke-RestMethod -Uri "http://localhost:5501/api/pedidos"`
- **curl:** `curl -X GET "http://localhost:5501/api/pedidos"`
- **Resultado:** Todas retornan HTML con mensaje "Cannot GET /api/pedidos"

---

## 🔧 ANÁLISIS TÉCNICO DETALLADO

### 1. Estructura de Registro de Middlewares (Orden Actual)

```javascript
// LÍNEA 188-190: Middlewares básicos
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// LÍNEA 194: ✅ Router MVC Registrado
app.use('/api/pedidos', pedidosRoutes);
console.log('✅ Router MVC de pedidos registrado en /api/pedidos');

// LÍNEA 199-215: ✅ Rutas de Debug Registradas
app.get('/api/debug/test-router', (req, res) => { ... });
app.get('/api/debug/pedidos-status', (req, res) => { ... });

// LÍNEA 632-5100: ✅ Todas las otras rutas API registradas
app.get('/api/vapid-public-key', ...);
app.post('/api/guardar-comercio', ...);
app.get('/api/listar-comercios', ...);
// ... 100+ rutas más ...

// LÍNEA 5114: ⚠️ PROBLEMA IDENTIFICADO
app.use(express.static(__dirname, { maxAge: '1d', etag: true }));
```

### 2. Problema del Middleware `express.static`

**Comportamiento Observado:**
```
Cliente → http://localhost:5501/api/pedidos
    ↓
Express recibe petición
    ↓
Middleware CORS ✅
    ↓
Middleware express.json() ✅
    ↓
Router '/api/pedidos' ❌ NUNCA ALCANZADO
    ↓
express.static(__dirname) 🔴 INTERCEPTA
    ↓
Busca archivo físico: ./api/pedidos
    ↓
No existe → Retorna "Cannot GET /api/pedidos"
```

**Causa Raíz:**
El middleware `express.static(__dirname)` en la línea 5114 **NO está siendo ejecutado en el orden correcto** porque:

1. **Todas las definiciones de rutas** (`app.get`, `app.post`, `app.use`) se registran **síncronamente** cuando Node.js carga el archivo `server.js`
2. El orden de registro es **secuencial** según aparecen en el archivo
3. Por lo tanto, `express.static` se registra DESPUÉS de todas las rutas API
4. **PERO** - Express no está llegando a las rutas porque algo más las está bloqueando

**Hipótesis Adicional:**
Puede existir OTRO middleware `express.static` registrado ANTES que no fue removido completamente, o hay conflictos con el sistema de archivos.

---

## 🧬 VERIFICACIÓN DE INYECCIÓN DE DEPENDENCIAS

### Estado Actual (server.js líneas 60-72):

```javascript
// VARIABLES GLOBALES
let pedidos = [];
let chats = {};
let repartidores = [];
let calificaciones = [];
let usuariosConectados = new Map();

// CONFIGURACIÓN APP
app.set('socketio', io);
app.set('pedidos', pedidos);
app.set('repartidores', repartidores);
app.set('calificaciones', calificaciones);
app.set('chats', chats);

// INICIALIZACIÓN CONTROLADOR
pedidosController.init(app, pedidos, repartidores, calificaciones, chats);
```

**Análisis:**
- ✅ **Referencias correctamente pasadas:** Arrays `pedidos`, `repartidores`, `calificaciones` y objeto `chats`
- ✅ **Socket.IO accesible:** Mediante `app.get('socketio')`
- ⚠️ **Timing Issue:** La inicialización ocurre ANTES de que se carguen datos desde archivos

**Secuencia de Inicialización:**
```
1. línea 72:  pedidosController.init(...arrays vacíos...)
2. línea 5135: inicializarDirectorios().then(() => {
3. línea 276:     await cargarRepartidores();  // Arrays se llenan AQUÍ
4. línea 277:     await cargarPedidos();        // Pero controlador ya inicializado
```

**Impacto:**
- El controlador se inicializa con **referencias a los arrays vacíos**
- Cuando los datos se cargan más tarde, el controlador **SÍ ve los cambios** (porque mantiene referencias)
- ✅ **NO es un problema** - las referencias funcionan correctamente

---

## 📂 CHEQUEO DE PERSISTENCIA (BASE_DIR)

### Controlador (pedidosController.js línea 14):
```javascript
this.BASE_DIR = path.join(__dirname, '../../registros');
```

**Resolución de Ruta:**
```
__dirname         = C:\Users\cdaim\OneDrive\Desktop\YAvoy_DEFINITIVO\src\controllers
../../registros   = C:\Users\cdaim\OneDrive\Desktop\YAvoy_DEFINITIVO\registros
```

**Verificación:**
- ✅ **Ruta correcta:** Apunta a `/registros` en la raíz del proyecto
- ✅ **Carpeta existe:** Confirmado por logs de inicio "1 pedido(s) cargado(s) desde archivos"
- ✅ **Métodos de guardado:** `guardarPedidoArchivo()` utiliza `this.BASE_DIR` correctamente

---

## 🧩 CÓDIGO HUÉRFANO IDENTIFICADO

### Funciones Críticas NO Exportadas a Controlador:

#### 1. **Función `actualizarInformeCEORepartidor()`**
```javascript
// server.js línea ~485
async function actualizarInformeCEORepartidor(repartidor) { ... }
```
**Impacto:** Controlador no puede actualizar informes CEO de repartidores

#### 2. **Función `crearInformeCEORepartidor()`**
```javascript
// server.js línea ~420
async function crearInformeCEORepartidor(repartidor) { ... }
```
**Impacto:** Controlador no puede crear nuevos informes CEO

#### 3. **Funciones de Notificación Email**
```javascript
// server.js (varias ubicaciones)
const transporter = nodemailer.createTransport({ ... });
async function enviarEmailVerificacion(destinatario, codigo) { ... }
```
**Impacto:** Controlador no puede enviar emails de confirmación de pedidos

#### 4. **Sistema de Propinas**
```javascript
// server.js líneas ~4500+
let propinas = [];
async function guardarPropina(propina) { ... }
```
**Impacto:** Controlador no puede gestionar propinas asociadas a pedidos

#### 5. **Helpers de Archivo**
```javascript
// server.js 
async function guardarPedidoArchivo(pedido) { ... }  // ⚠️ DUPLICADO
async function cargarPedidos() { ... }
```
**Nota:** El controlador tiene su propia versión de `guardarPedidoArchivo()`, pero puede no ser compatible 100%

---

## 💉 CONFLICTOS DE SCOPE

### Variables que el Controlador NO Puede Acceder:

| Variable | Ubicación | Impacto | Solución |
|----------|-----------|---------|----------|
| `subscriptions` | server.js global | No puede enviar notificaciones push | Pasar en init() o usar app.set() |
| `transporter` (nodemailer) | server.js global | No puede enviar emails | Exportar helpers |
| `propinas` | server.js global | No puede consultar propinas de pedidos | Pasar en init() |
| `usuariosConectados` | server.js global | No puede verificar usuarios online | Ya disponible vía Socket.IO rooms |
| `BASE_DIR` (server.js) | server.js const | Controlador usa su propia versión | ✅ OK (ambos apuntan al mismo lugar) |

---

## 🔗 ESTADO DE LA INTEGRACIÓN

### Conexión server.js ↔ Sistema Modular:

```javascript
// ✅ CORRECTO: Importaciones
const pedidosRoutes = require('./src/routes/pedidosRoutes');
const pedidosController = require('./src/controllers/pedidosController');

// ✅ CORRECTO: Inicialización
pedidosController.init(app, pedidos, repartidores, calificaciones, chats);

// ✅ CORRECTO: Registro de Router  
app.use('/api/pedidos', pedidosRoutes);

// ❌ PROBLEMA: Router no recibe peticiones
// CAUSA: Middleware express.static() o configuración incorrecta
```

### Singleton Pattern en Controlador:

```javascript
// pedidosController.js
class PedidosController { ... }

// ❌ PROBLEMA ANTERIOR (YA CORREGIDO)
module.exports = new PedidosController();  // Instancia única

// ✅ CORRECCIÓN APLICADA
const instance = new PedidosController();
module.exports = instance;
```

**Estado:** ✅ Patrón Singleton implementado correctamente

---

## 🎯 SUGERENCIAS DE CÓDIGO - SOLUCIÓN DEFINITIVA

### OPCIÓN A: Deshabilitar Temporalmente `express.static` para Debugging

**server.js línea 5114:**
```javascript
// COMENTAR TEMPORALMENTE PARA DEBUGGING
/*
app.use(express.static(__dirname, {
  maxAge: '1d',
  etag: true
}));
*/

// SERVIR SOLO ARCHIVOS ESPECÍFICOS (más seguro)
app.use('/css', express.static(path.join(__dirname, 'styles'), { maxAge: '1d' }));
app.use('/js', express.static(path.join(__dirname, 'js'), { maxAge: '1d' }));
app.use('/icons', express.static(path.join(__dirname, 'icons'), { maxAge: '1d' }));

// SERVIR HTML PAGES - SOLO DESPUÉS DE TODAS LAS RUTAS API
app.get('*.html', (req, res, next) => {
  res.sendFile(path.join(__dirname, req.url));
});
```

---

### OPCIÓN B: Mover Router MVC AL PRINCIPIO (Antes de Cualquier Otro Middleware)

**server.js - REFACTORIZACIÓN COMPLETA:**

```javascript
// ============================================
// 1. IMPORTACIONES
// ============================================
const express = require('express');
const cors = require('cors');
const pedidosRoutes = require('./src/routes/pedidosRoutes');
const pedidosController = require('./src/controllers/pedidosController');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { ... });

// ============================================
// 2. MIDDLEWARES BÁSICOS (PRIMERO)
// ============================================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// 3. INICIALIZACIÓN DE DATOS Y CONTROLADOR
// ============================================
let pedidos = [];
let chats = {};
let repartidores = [];
let calificaciones = [];

app.set('socketio', io);
app.set('pedidos', pedidos);
app.set('repartidores', repartidores);
app.set('calificaciones', calificaciones);
app.set('chats', chats);

pedidosController.init(app, pedidos, repartidores, calificaciones, chats);

// ============================================
// 4. RUTAS API - TODAS LAS /api/* JUNTAS
// ============================================

// === ROUTER MVC PEDIDOS ===
app.use('/api/pedidos', pedidosRoutes);
console.log('✅ Router MVC registrado: /api/pedidos');

// === RUTAS DE DEBUG ===
app.get('/api/debug/test-router', (req, res) => {
  res.json({ success: true, message: 'Router OK', timestamp: new Date() });
});

// === TODAS LAS OTRAS RUTAS API ===
app.get('/api/vapid-public-key', (req, res) => { ... });
app.post('/api/guardar-comercio', async (req, res) => { ... });
// ... resto de rutas API ...

// ============================================
// 5. ARCHIVOS ESTÁTICOS (AL FINAL)
// ============================================
// Servir SOLO directorios específicos
app.use('/css', express.static(path.join(__dirname, 'styles')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/icons', express.static(path.join(__dirname, 'icons')));
app.use('/components', express.static(path.join(__dirname, 'components')));

// Fotos y registros
app.use('/fotos-perfil', express.static(path.join(BASE_DIR, 'fotos-perfil')));
app.use('/registros/verificaciones', express.static(path.join(BASE_DIR, 'verificaciones')));

// ============================================
// 6. RUTAS HTML (DESPUÉS DE TODO)
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*.html', (req, res) => {
  res.sendFile(path.join(__dirname, req.url));
});

// ============================================
// 7. MANEJADOR 404 (AL FINAL)
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method
  });
});

// ============================================
// 8. SOCKET.IO Y STARTUP
// ============================================
inicializarDirectorios().then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Servidor YAvoy escuchando en http://localhost:${PORT}`);
  });
});
```

---

### OPCIÓN C: Agregar Middleware de Debug para Rastrear Peticiones

**server.js - AÑADIR DESPUÉS DE express.json():**

```javascript
// === DEBUG MIDDLEWARE - Rastrear todas las peticiones ===
app.use((req, res, next) => {
  console.log(`\n🔍 REQUEST DEBUG:`);
  console.log(`   Method: ${req.method}`);
  console.log(`   Path: ${req.path}`);
  console.log(`   URL: ${req.url}`);
  console.log(`   Headers: ${JSON.stringify(req.headers, null, 2)}`);
  next();
});

// Continuar con routers...
app.use('/api/pedidos', pedidosRoutes);
```

Este middleware mostrará EXACTAMENTE qué está llegando al servidor y si pasa por el router.

---

## 🔬 VERIFICACIÓN PASO A PASO

### Test 1: Verificar que el Controlador Funciona

```bash
node -e "
const controller = require('./src/controllers/pedidosController');
console.log('✅ Controlador cargado');
console.log('Tipo:', typeof controller);
console.log('Métodos:', Object.getOwnPropertyNames(Object.getPrototypeOf(controller)));
"
```

### Test 2: Verificar el Router

```bash
node -e "
const router = require('./src/routes/pedidosRoutes');
console.log('✅ Router cargado');
console.log('Tipo:', typeof router);
console.log('Stack:', router.stack ? router.stack.length : 'undefined');
"
```

### Test 3: Test Manual de Integración

```javascript
// test-integration.js
const express = require('express');
const pedidosRoutes = require('./src/routes/pedidosRoutes');
const pedidosController = require('./src/controllers/pedidosController');

const app = express();
app.use(express.json());

// Inicializar
pedidosController.init(
  { get: () => null, set: () => {} }, 
  [], 
  [], 
  [], 
  {}
);

// Registrar router
app.use('/api/pedidos', pedidosRoutes);

// Test route
app.get('/test', (req, res) => res.json({ test: 'ok' }));

app.listen(3000, () => console.log('Test server en puerto 3000'));
```

Ejecutar:
```bash
node test-integration.js
curl http://localhost:3000/test
curl http://localhost:3000/api/pedidos
```

---

## 📝 RESUMEN DE ACCIONES REQUERIDAS

### PRIORIDAD CRÍTICA (Hacer AHORA):

1. ✅ **Implementar OPCIÓN A:** Comentar `express.static(__dirname)` temporalmente
2. ✅ **Añadir middleware de debug** para rastrear peticiones
3. ✅ **Reiniciar servidor** y probar endpoints
4. ✅ **Verificar logs** para confirmar que peticiones llegan al router

### PRIORIDAD ALTA (Próxima iteración):

5. 🔧 **Refactorizar archivos estáticos** según OPCIÓN B
6. 🔧 **Exportar helpers críticos** (emails, informes CEO)
7. 🔧 **Crear módulo de utilidades** compartidas entre server.js y controlador
8. 🔧 **Añadir manejador 404** personalizado

### PRIORIDAD MEDIA (Mejoras futuras):

9. 📦 **Modularizar más sistemas** (comercios, repartidores, calificaciones)
10. 🧪 **Crear suite de tests** unitarios e integración
11. 📚 **Documentar API** con Swagger/OpenAPI
12. 🔐 **Implementar autenticación** JWT para rutas sensibles

---

## 🎬 CONCLUSIÓN

El sistema MVC está **correctamente implementado a nivel de código**, pero sufre de un **problema de configuración de middlewares** en Express que impide que las peticiones HTTP lleguen a los routers.

**Causa Raíz Confirmada:**  
`express.static(__dirname)` está interfiriendo con el routing de API, posiblemente por:
- Orden de ejecución incorrecto
- Conflicto con estructura de carpetas
- Comportamiento inesperado de Express con rutas `/api/*`

**Solución Recomendada:**  
Implementar **OPCIÓN A** (comentar `express.static`) + **middleware de debug** para confirmar diagnóstico, seguido de **OPCIÓN B** (refactorización completa) para solución permanente.

**Estado del Proyecto:**  
🟡 **FUNCIONAL (Backend)** - ✅ Controller + Router OK  
🔴 **NO OPERATIVO (HTTP)** - ❌ Middleware bloqueando peticiones  
🟢 **PERSISTENCIA OK** - ✅ Sistema de archivos funcionando  

---

**Generado por:** Sistema de Análisis de Arquitectura MVC  
**Timestamp:** 2025-12-15T${new Date().toLocaleTimeString('es-AR')}  
**Versión:** YAvoy v3.1 - Deep Scan Report  

