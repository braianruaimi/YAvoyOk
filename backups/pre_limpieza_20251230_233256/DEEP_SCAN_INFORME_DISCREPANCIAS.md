# 🔍 YAvoy v3.1 Enterprise - DEEP SCAN: INFORME DE DISCREPANCIAS

**Fecha:** 21 de diciembre de 2025  
**Analista:** Deep Scan QA System  
**Sistema:** YAvoy v3.1 (Post-Migración PostgreSQL)  
**Error Inicial:** PM2 Exit Code: 1 (Fallo al iniciar server-enterprise.js)

---

## 📊 RESUMEN EJECUTIVO

### Estadísticas del Análisis
- **Total de Discrepancias Encontradas:** 18  
- **Errores CRÍTICOS:** 6  
- **Errores MEDIOS:** 8  
- **Errores BAJOS:** 4  

### Impacto en el Sistema
| Severidad | Bloqueante | No Bloqueante | Porcentaje |
|-----------|-----------|---------------|-----------|
| CRÍTICA   | 6         | 0             | 33%       |
| MEDIA     | 0         | 8             | 45%       |
| BAJA      | 0         | 4             | 22%       |

**🚨 CONCLUSIÓN:** El sistema tiene **6 errores CRÍTICOS** que impiden el arranque y operación básica. Debe solucionarse en orden de prioridad antes de despliegue en Hostinger.

---

## 🔥 ERRORES CRÍTICOS (Bloqueantes)

### C-01: Sintaxis Inválida en package.json (PM2 No Puede Iniciar)

**📌 Ubicación:**  
[package.json](package.json#L130-L145)

**🔍 Descripción:**  
El archivo `package.json` contiene una estructura malformada en las líneas 130-145. Los comentarios de JavaScript (`//`) y la sintaxis de objeto ES6 (`module.exports = {`) están mezclados dentro de un archivo JSON, lo cual es inválido según el estándar JSON.

**💥 Impacto:**  
- **PM2 NO PUEDE INICIAR:** Al ejecutar `pm2 start ecosystem.config.js`, PM2 intenta leer `package.json` y falla con `SyntaxError: Unexpected token` (Exit Code: 1).
- El sistema completo no arranca.
- Bloquea cualquier despliegue en producción.

**📍 Código Actual (INCORRECTO):**
```json
// Líneas 130-145 de package.json
  deploy: {  
    production: {  
      user: 'yavoy',    
      host: 'TU_IP_O_DOMINIO_VPS',      
      repo: 'https://github.com/TU_USUARIO/yavoy.git',      
      path: '/home/yavoy/yavoy',      
      'post-deploy': 'npm install && npm run migrate:postgresql && pm2 reload ecosystem.config.js --env production',      
      'pre-setup': 'apt-get install git'      
    }      
  }    
};  
}
```

**✅ Solución:**  
**ELIMINAR completamente las líneas 130-145** de `package.json`. La configuración de PM2 deploy debe estar **EXCLUSIVAMENTE** en [ecosystem.config.js](ecosystem.config.js), NO en package.json.

**🛠️ Comando de Reparación:**
```powershell
# Abrir package.json y eliminar manualmente las líneas 130-145
# O ejecutar:
(Get-Content package.json | Select-Object -Skip 129 | Select-Object -First -16) | Out-Null
```

**📝 Verificación:**
```powershell
# Validar sintaxis JSON
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"
# Si no hay output, el archivo es válido
```

---

### C-02: Missing Database Tables (5 Tablas Faltantes)

**📌 Ubicación:**  
[database-schema.sql](database-schema.sql#L1-L511)

**🔍 Descripción:**  
El schema de PostgreSQL solo define **8 tablas** (`users`, `delivery_persons`, `shops`, `orders`, `order_status_history`, `reviews`, `chat_messages`, `system_logs`), pero el sistema YAvoy v3.1 con las features de v3.0_socio requiere **13 tablas**. Faltan 5 tablas críticas:

1. `products` (inventario de comercios)
2. `referral_codes` (códigos de referidos generados por usuario)
3. `referrals` (registro de referidos completados)
4. `rewards` (sistema de recompensas)
5. `tips` (propinas a repartidores)

**💥 Impacto:**  
- **Endpoints Rotos:** [server-enterprise.js](server-enterprise.js#L655) tiene `POST /api/productos` que hace INSERT en tabla `products` inexistente → Error 500.
- **Endpoint /api/referidos:** [server-enterprise.js](server-enterprise.js#L673-L694) hace SELECT/INSERT en `referral_codes` y `referrals` → Error 500.
- **Features v3.0_socio No Operativas:** Sistema de recompensas, propinas y pedidos grupales sin persistencia.
- Los endpoints devuelven `relation "products" does not exist`.

**📍 Endpoints Afectados:**
| Endpoint | Línea | Tabla Faltante | Query |
|----------|-------|----------------|-------|
| `POST /api/productos` | 655-666 | `products` | `INSERT INTO products (...)` |
| `POST /api/referidos` | 676-682 | `referral_codes` | `SELECT FROM referral_codes WHERE codigo = $1` |
| `POST /api/referidos` | 685-694 | `referrals` | `INSERT INTO referrals (...)` |

**✅ Solución:**  
Agregar las 5 tablas faltantes al final de [database-schema.sql](database-schema.sql#L511) **ANTES de ejecutar migrate-to-postgresql.js**.

**🛠️ Código de Reparación:**
```sql
-- ============================================
-- TABLAS FALTANTES (Features v3.0_socio)
-- ============================================

-- TABLA: products (Inventario de comercios)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    precio DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_shop ON products(shop_id);
CREATE INDEX idx_products_categoria ON products(categoria);
CREATE INDEX idx_products_activo ON products(activo);

-- TABLA: referral_codes (Códigos de referidos)
CREATE TABLE referral_codes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT true,
    usos INTEGER DEFAULT 0,
    usos_maximos INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_codigo ON referral_codes(codigo);

-- TABLA: referrals (Registro de referidos)
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    referrer_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    codigo_usado VARCHAR(20) NOT NULL,
    credito_otorgado DECIMAL(10,2) DEFAULT 50.00,
    estado VARCHAR(50) DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);

-- TABLA: rewards (Sistema de recompensas)
CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    valor DECIMAL(10,2),
    canjeado BOOLEAN DEFAULT false,
    fecha_obtencion TIMESTAMP DEFAULT NOW(),
    fecha_caducidad TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rewards_user ON rewards(user_id);
CREATE INDEX idx_rewards_canjeado ON rewards(canjeado);

-- TABLA: tips (Propinas a repartidores)
CREATE TABLE tips (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    repartidor_id VARCHAR(100) NOT NULL REFERENCES delivery_persons(id) ON DELETE CASCADE,
    monto DECIMAL(10,2) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'efectivo',
    metodo_pago VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tips_order ON tips(order_id);
CREATE INDEX idx_tips_repartidor ON tips(repartidor_id);

-- Triggers para updated_at
CREATE TRIGGER trigger_products_updated
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_rewards_updated
    BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**📝 Comando para Aplicar:**
```powershell
# Agregar al final de database-schema.sql
psql -U yavoy_user -d yavoy_production -f database-schema.sql
```

---

### C-03: WebSocket 'ciudad' Parameter Missing (Frontend)

**📌 Ubicación:**  
- [chat.html](chat.html#L359)  
- [panel-repartidor-pro.html](panel-repartidor-pro.html#L702)  

**🔍 Descripción:**  
El backend [server-enterprise.js](server-enterprise.js#L394-L429) requiere el parámetro `ciudad` en el evento WebSocket `registrar` para crear rooms geográficas (`ciudad-{ciudad}`). El frontend solo envía `{userId, tipo}`, causando que `ciudad` sea `undefined`.

**💥 Impacto:**  
- **WebSocket Rooms No Funcionan:** El repartidor se registra en `ciudad-undefined` en lugar de `ciudad-Córdoba`.
- **Push Notifications Fallidos:** Cuando se emite `io.to('ciudad-Córdoba').emit('nuevoPedido', {...})`, los usuarios en `ciudad-undefined` NO reciben el evento.
- **Geolocalización Rota:** El sistema de asignación de pedidos por proximidad no funciona.

**📍 Código Actual (INCORRECTO):**
```javascript
// chat.html línea 359
socket.emit('registrar', {
  userId: userId,
  tipo: userTipo
  // ❌ Falta: ciudad, ubicacion
});

// panel-repartidor-pro.html línea 702
socket.emit('registrar', { 
  userId: 'REP-01',  // ❌ Hardcoded ID
  tipo: 'repartidor'
  // ❌ Falta: ciudad, ubicacion
});
```

**📍 Backend Esperado (server-enterprise.js línea 398-403):**
```javascript
socket.on('registrar', (data) => {
    const { userId, tipo, ciudad, ubicacion } = data; // ✅ Requiere ciudad
    
    socket.join(`user-${userId}`);
    socket.join(`tipo-${tipo}`);
    socket.join(`ciudad-${ciudad}`); // ❌ ciudad es undefined
    
    if (tipo === 'repartidor' && ubicacion) {
        socket.join(`pedido-${ubicacion.pedidoId}`);
    }
});
```

**✅ Solución:**  
Modificar las llamadas `socket.emit('registrar', {...})` en el frontend para incluir `ciudad` y `ubicacion`.

**🛠️ Código de Reparación (chat.html):**
```javascript
// chat.html - Reemplazar línea 359
socket.emit('registrar', {
  userId: userId,
  tipo: userTipo,
  ciudad: localStorage.getItem('userCiudad') || 'Córdoba', // ✅ Agregar ciudad
  ubicacion: pedidoActual ? { 
    lat: parseFloat(localStorage.getItem('userLat')) || -31.4201, 
    lng: parseFloat(localStorage.getItem('userLng')) || -64.1888,
    pedidoId: pedidoActual 
  } : null
});
```

**🛠️ Código de Reparación (panel-repartidor-pro.html):**
```javascript
// panel-repartidor-pro.html - Reemplazar línea 702
socket.emit('registrar', { 
  userId: repartidorActual.id, // ✅ Usar ID real del repartidor autenticado
  tipo: 'repartidor',
  ciudad: repartidorActual.ciudad || 'Córdoba', // ✅ Agregar ciudad del perfil
  ubicacion: {
    lat: repartidorActual.ubicacionLat || -31.4201,
    lng: repartidorActual.ubicacionLng || -64.1888
  }
});
```

**📝 Validación:**
```javascript
// Agregar en socket.on('conectado', ...) para debug
socket.on('conectado', (data) => {
  console.log('✅ Registrado en rooms:', data.rooms);
  // Debe mostrar: ["user-REP123", "tipo-repartidor", "ciudad-Córdoba"]
});
```

---

### C-04: Hardcoded Repartidor ID 'REP-01' (panel-repartidor-pro.html)

**📌 Ubicación:**  
[panel-repartidor-pro.html](panel-repartidor-pro.html#L702)

**🔍 Descripción:**  
El panel de repartidor usa `userId: 'REP-01'` hardcoded en lugar de obtener el ID real del usuario autenticado desde `localStorage` o JWT token.

**💥 Impacto:**  
- **Todos los repartidores comparten el mismo ID:** Si 5 repartidores abren el panel, todos usan `REP-01`.
- **Colisión de WebSocket Rooms:** El backend sobrescribe el socket anterior cuando un nuevo repartidor se conecta con el mismo ID.
- **Asignación de Pedidos Incorrecta:** El sistema asigna pedidos siempre a `REP-01`, ignorando al repartidor real.

**📍 Código Actual (INCORRECTO):**
```javascript
// panel-repartidor-pro.html línea 702
socket.emit('registrar', { 
  userId: 'REP-01', // ❌ Hardcoded
  tipo: 'repartidor'
});
```

**✅ Solución:**  
Obtener el ID real desde autenticación (localStorage o token JWT).

**🛠️ Código de Reparación:**
```javascript
// Agregar al inicio del <script>
const repartidorActual = JSON.parse(localStorage.getItem('currentUser')) || {
  id: 'REP-DEMO', // Fallback para demo
  nombre: 'Demo Repartidor',
  ciudad: 'Córdoba',
  ubicacionLat: -31.4201,
  ubicacionLng: -64.1888
};

// Reemplazar línea 702
socket.emit('registrar', { 
  userId: repartidorActual.id, // ✅ ID real
  tipo: 'repartidor',
  ciudad: repartidorActual.ciudad,
  ubicacion: {
    lat: repartidorActual.ubicacionLat,
    lng: repartidorActual.ubicacionLng
  }
});
```

---

### C-05: Missing Endpoints (12+ Rutas No Implementadas)

**📌 Ubicación:**  
[server-enterprise.js](server-enterprise.js#L294-L694) solo tiene 8 endpoints

**🔍 Descripción:**  
El análisis grep encontró **20+ llamadas `fetch()`** en archivos HTML activos, pero [server-enterprise.js](server-enterprise.js) solo implementa **8 endpoints**. Faltan mínimo 12 endpoints críticos.

**💥 Impacto:**  
- **404 Not Found:** Frontend hace fetch a endpoints inexistentes → Error 404.
- **Funcionalidades Rotas:** Panel de repartidor, verificaciones CEO, soporte no operan.

**📍 Endpoints Implementados (8):**
| Endpoint | Método | Línea |
|----------|--------|-------|
| `/api/health` | GET | 294 |
| `/api/pedidos` | GET | 530 |
| `/api/pedidos` | POST | 558 |
| `/api/comercios` | GET | 591 |
| `/api/comercios` | POST | 613 |
| `/api/repartidores/disponibles` | GET | 641 |
| `/api/productos` | POST | 655 |
| `/api/referidos` | POST | 673 |

**📍 Endpoints FALTANTES (ejemplos críticos):**
| Endpoint Faltante | Usado En | Línea | Método |
|-------------------|----------|-------|--------|
| `/api/repartidores` | panel-repartidor.html | 518 | GET |
| `/api/repartidores/:id/disponibilidad` | panel-repartidor.html | 716 | PATCH |
| `/api/pedidos/:id/asignar` | panel-repartidor.html | 874 | POST |
| `/api/pedidos/:id/estado` | panel-repartidor.html | 905 | PUT |
| `/api/pedidos/:id` | panel-comercio.html | 1539 | DELETE |
| `/api/repartidores/:id/aprobar-verificacion` | panel-ceo-verificaciones.html | 780 | POST |
| `/api/repartidores/:id/rechazar-verificacion` | panel-ceo-verificaciones.html | 819 | POST |
| `/api/soporte/tickets` | soporte-tickets.html | 577 | GET/POST |

**✅ Solución:**  
Implementar los endpoints faltantes en [server-enterprise.js](server-enterprise.js) después de línea 694.

**🛠️ Código de Reparación (Ejemplo: GET /api/repartidores):**
```javascript
// Agregar después de línea 694 en server-enterprise.js
app.get('/api/repartidores', asyncHandler(async (req, res) => {
    const { disponible, ciudad } = req.query;
    
    let query = `
        SELECT dp.*, u.nombre, u.apellido, u.whatsapp, u.activo
        FROM delivery_persons dp
        JOIN users u ON dp.id = u.id
        WHERE 1=1
    `;
    const params = [];
    
    if (disponible === 'true') {
        query += ` AND dp.disponible = true`;
    }
    
    if (ciudad) {
        params.push(ciudad);
        query += ` AND u.ciudad = $${params.length}`;
    }
    
    query += ` ORDER BY dp.rating DESC, dp.total_entregas DESC`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, repartidores: result.rows });
}));

// PATCH /api/repartidores/:id/disponibilidad
app.patch('/api/repartidores/:id/disponibilidad', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { disponible } = req.body;
    
    const result = await pool.query(`
        UPDATE delivery_persons 
        SET disponible = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
    `, [disponible, id]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Repartidor no encontrado' });
    }
    
    res.json({ success: true, repartidor: result.rows[0] });
}));

// POST /api/pedidos/:id/asignar
app.post('/api/pedidos/:id/asignar', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { repartidorId } = req.body;
    
    const result = await pool.query(`
        UPDATE orders 
        SET repartidor_id = $1, estado = 'aceptado', updated_at = NOW()
        WHERE id = $2
        RETURNING *
    `, [repartidorId, id]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    }
    
    // Emitir WebSocket
    io.to(`repartidor-${repartidorId}`).emit('pedidoAsignado', result.rows[0]);
    
    res.json({ success: true, pedido: result.rows[0] });
}));

// PUT /api/pedidos/:id/estado
app.put('/api/pedidos/:id/estado', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    
    // Validar estado
    const estadosValidos = ['pendiente', 'aceptado', 'preparando', 'en_camino', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ success: false, error: 'Estado inválido' });
    }
    
    const result = await pool.query(`
        UPDATE orders 
        SET estado = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
    `, [estado, id]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    }
    
    // Registrar en historial
    await pool.query(`
        INSERT INTO order_status_history (order_id, estado_anterior, estado_nuevo)
        VALUES ($1, (SELECT estado FROM orders WHERE id = $1), $2)
    `, [id, estado]);
    
    res.json({ success: true, pedido: result.rows[0] });
}));
```

---

### C-06: Database Schema Missing 'ciudad' Column in Users Table

**📌 Ubicación:**  
[database-schema.sql](database-schema.sql#L20-L64) tabla `users`

**🔍 Descripción:**  
La tabla `users` NO tiene columna `ciudad`, pero el sistema WebSocket [server-enterprise.js](server-enterprise.js#L399) espera que `data.ciudad` provenga del perfil del usuario. Además, los endpoints de búsqueda por ciudad fallan.

**💥 Impacto:**  
- **WebSocket Rooms Rotas:** El backend no puede hacer `socket.join('ciudad-' + ciudad)` si `ciudad` no está en la DB.
- **Búsqueda Geográfica Fallida:** Query `WHERE u.ciudad = $1` falla con `column "ciudad" does not exist`.

**📍 Código Actual (database-schema.sql):**
```sql
-- Línea 20-64: Tabla users NO tiene columna ciudad
CREATE TABLE users (
    id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255),
    whatsapp VARCHAR(20) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('cliente', 'repartidor', 'comercio', 'admin')),
    direccion_calle VARCHAR(255),
    direccion_numero VARCHAR(20),
    direccion_piso VARCHAR(20),
    direccion_barrio VARCHAR(100),
    direccion_ciudad VARCHAR(100),  -- ❌ Se llama direccion_ciudad, no ciudad
    direccion_provincia VARCHAR(100),
    direccion_codigo_postal VARCHAR(20),
    -- ...
);
```

**✅ Solución:**  
Agregar columna `ciudad` indexada + migrar datos desde `direccion_ciudad`.

**🛠️ Código de Reparación:**
```sql
-- Agregar columna ciudad
ALTER TABLE users ADD COLUMN ciudad VARCHAR(100);

-- Migrar datos existentes
UPDATE users SET ciudad = COALESCE(direccion_ciudad, 'Córdoba');

-- Crear índice para búsquedas geográficas
CREATE INDEX idx_users_ciudad ON users(ciudad);

-- Hacer NOT NULL después de migración
ALTER TABLE users ALTER COLUMN ciudad SET NOT NULL;
```

---

## ⚠️ ERRORES MEDIOS (No Bloqueantes, Pero Críticos)

### M-01: Inconsistent Error Handling (Console.error vs Logger)

**📌 Ubicación:**  
[server-enterprise.js](server-enterprise.js) múltiples líneas

**🔍 Descripción:**  
El código tiene **20+ instancias** donde se usa `console.error()` y `console.log()` en lugar del logger Winston configurado. Esto rompe la centralización de logs y auditoría.

**💥 Impacto:**  
- **Logs No Persistidos:** Los `console.error` no se guardan en [logs/winston-error.log](logs/winston-error.log) ni en tabla `system_logs`.
- **Auditoría Incompleta:** Sistema de logging centralizado inútil si solo se usa en algunos lugares.

**📍 Ejemplos de Uso Incorrecto:**
```javascript
// Línea 247
console.error('Error pool PostgreSQL:', err);

// Línea 272
console.log(`✅ PostgreSQL conectado: ${pool.totalCount} conexiones`);

// Línea 394
console.log('🔌 WEBSOCKET - Nuevo socket conectado:', socket.id);

// Línea 464
console.error('❌ Error actualizando ubicación:', error);

// Línea 482
console.error('❌ Error enviando mensaje:', error);
```

**✅ Solución:**  
Reemplazar todos los `console.error/log` por llamadas al logger Winston.

**🛠️ Código de Reparación:**
```javascript
// Importar logger al inicio de server-enterprise.js
const logger = require('./src/config/logger');

// Reemplazar línea 247
logger.error('Error pool PostgreSQL', { error: err.message, stack: err.stack });

// Reemplazar línea 272
logger.info(`PostgreSQL conectado: ${pool.totalCount} conexiones`);

// Reemplazar línea 394
logger.info('WEBSOCKET - Nuevo socket conectado', { socketId: socket.id });

// Reemplazar línea 464
logger.error('Error actualizando ubicación', { 
  error: error.message, 
  userId: data.userId,
  ubicacion: data.ubicacion 
});

// Reemplazar línea 482
logger.error('Error enviando mensaje', { 
  error: error.message, 
  pedidoId: data.pedidoId 
});
```

---

### M-02: Silent Errors (Catch Blocks Sin Response)

**📌 Ubicación:**  
[server-enterprise.js](server-enterprise.js#L464) línea 464 y otros

**🔍 Descripción:**  
Varios `catch (error) {}` loggean el error pero NO envían respuesta JSON al cliente ni emiten evento WebSocket de error.

**💥 Impacto:**  
- **Cliente Queda Esperando:** Frontend hace `fetch()` → timeout después de 30s sin respuesta.
- **UX Rota:** El usuario no recibe feedback de que falló la operación.

**📍 Código Actual (INCORRECTO):**
```javascript
// Línea 464 - WebSocket actualizarUbicacion
socket.on('actualizarUbicacion', async (data) => {
    try {
        // ... código ...
    } catch (error) {
        console.error('❌ Error actualizando ubicación:', error);
        // ❌ NO hay socket.emit('error', ...) ni callback
    }
});

// Línea 482 - WebSocket enviarMensaje
socket.on('enviarMensaje', async (data) => {
    try {
        // ... código ...
    } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
        // ❌ NO hay socket.emit('error', ...)
    }
});
```

**✅ Solución:**  
Agregar respuestas de error en todos los catch blocks.

**🛠️ Código de Reparación:**
```javascript
// Línea 464 - Actualizar WebSocket actualizarUbicacion
socket.on('actualizarUbicacion', async (data) => {
    try {
        // ... código existente ...
    } catch (error) {
        logger.error('Error actualizando ubicación', { 
          error: error.message, 
          userId: data.userId 
        });
        
        // ✅ Emitir error al cliente
        socket.emit('errorUbicacion', { 
          success: false, 
          error: 'No se pudo actualizar la ubicación' 
        });
    }
});

// Línea 482 - Actualizar WebSocket enviarMensaje
socket.on('enviarMensaje', async (data) => {
    try {
        // ... código existente ...
    } catch (error) {
        logger.error('Error enviando mensaje', { 
          error: error.message, 
          pedidoId: data.pedidoId 
        });
        
        // ✅ Emitir error al cliente
        socket.emit('errorMensaje', { 
          success: false, 
          error: 'No se pudo enviar el mensaje' 
        });
    }
});
```

**📝 Frontend Update Required:**
```javascript
// Agregar en archivos HTML con WebSockets
socket.on('errorUbicacion', (data) => {
  console.error('Error ubicación:', data.error);
  mostrarNotificacion('Error', data.error, 'error');
});

socket.on('errorMensaje', (data) => {
  console.error('Error mensaje:', data.error);
  mostrarNotificacion('Error', data.error, 'error');
});
```

---

### M-03: Missing Response Status Codes in Catch Blocks

**📌 Ubicación:**  
[server-enterprise.js](server-enterprise.js) varios endpoints

**🔍 Descripción:**  
Algunos endpoints no envían código de estado HTTP correcto en errores (siempre 200 o 500).

**💥 Impacto:**  
- **REST API No Estándar:** El frontend recibe 200 OK cuando hubo un error de validación (debería ser 400).
- **Logging Incorrecto:** Los logs de error HTTP no reflejan códigos reales.

**✅ Solución:**  
Estandarizar códigos HTTP:
- 400: Bad Request (validación, datos inválidos)
- 401: Unauthorized (JWT inválido)
- 404: Not Found (recurso no existe)
- 409: Conflict (duplicado)
- 500: Internal Server Error (errores inesperados)

---

### M-04: No JWT Authentication Middleware

**📌 Ubicación:**  
[server-enterprise.js](server-enterprise.js#L294-L694) endpoints sin protección

**🔍 Descripción:**  
Los endpoints NO validan JWT tokens. Cualquier usuario puede llamar a endpoints administrativos.

**💥 Impacto:**  
- **Vulnerabilidad Crítica:** Endpoint `/api/repartidores/:id/aprobar-verificacion` puede ser llamado sin autenticación.
- **GDPR Violation:** Datos personales accesibles sin autenticación.

**✅ Solución:**  
Implementar middleware JWT:
```javascript
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'Token requerido' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Token inválido' });
    }
};

// Aplicar a endpoints protegidos
app.get('/api/pedidos', verificarToken, asyncHandler(async (req, res) => {
    // ...
}));
```

---

### M-05: Missing CORS Origin Configuration

**📌 Ubicación:**  
[server-enterprise.js](server-enterprise.js#L51) 

**🔍 Descripción:**  
CORS configurado como `origin: '*'` (permite todos los orígenes).

**💥 Impacto:**  
- **Vulnerabilidad XSS:** Cualquier dominio puede hacer requests a la API.
- **No Apto para Producción:** Violación de seguridad básica.

**✅ Solución:**  
```javascript
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://www.yavoy.com',
    credentials: true
}));
```

---

### M-06: No Rate Limiting Implementation

**📌 Ubicación:**  
[server-enterprise.js](server-enterprise.js) sin rate limiting activo

**🔍 Descripción:**  
Aunque se importa `express-rate-limit`, NO se aplica a los endpoints.

**💥 Impacto:**  
- **DDoS Vulnerable:** Un atacante puede hacer 1000 requests/segundo.
- **Abuso de API:** Endpoints `/api/pedidos` pueden ser scrapeados sin límite.

**✅ Solución:**  
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: { success: false, error: 'Demasiadas peticiones, intenta más tarde' }
});

app.use('/api/', apiLimiter);
```

---

### M-07: SQL Injection Risk (No Prepared Statements in Some Queries)

**📌 Ubicación:**  
[server-enterprise.js](server-enterprise.js#L530-L555) GET /api/pedidos

**🔍 Descripción:**  
Algunas queries concatenan parámetros en lugar de usar prepared statements.

**💥 Impacto:**  
- **SQL Injection:** `?estado='; DROP TABLE orders; --` podría ejecutarse.

**✅ Solución:**  
Siempre usar `$1, $2` en queries:
```javascript
// ❌ INCORRECTO
const query = `SELECT * FROM orders WHERE estado = '${req.query.estado}'`;

// ✅ CORRECTO
const query = `SELECT * FROM orders WHERE estado = $1`;
await pool.query(query, [req.query.estado]);
```

---

### M-08: No Database Connection Pool Exhaustion Handling

**📌 Ubicación:**  
[server-enterprise.js](server-enterprise.js#L191-L208) configuración pool

**🔍 Descripción:**  
El pool tiene `max: 20` conexiones, pero no hay lógica para manejar exhaustion.

**💥 Impacto:**  
- **Deadlock:** Si 20 conexiones están ocupadas, nuevas requests cuelgan indefinidamente.

**✅ Solución:**  
Agregar timeout:
```javascript
const pool = new Pool({
    // ... config existente ...
    connectionTimeoutMillis: 5000, // ✅ Timeout de 5s
    idleTimeoutMillis: 30000 // ✅ Liberar conexiones idle después de 30s
});
```

---

## 📉 ERRORES BAJOS (Mejoras Recomendadas)

### B-01: Joi Telefono Pattern Too Strict

**📌 Ubicación:**  
[src/validation/schemas.js](src/validation/schemas.js#L15)

**🔍 Descripción:**  
El pattern `/^[0-9]{10,15}$/` rechaza números internacionales con `+` o espacios (`+54 351 123 4567`).

**💥 Impacto:**  
- **UX Negativa:** Usuarios con formato internacional no pueden registrarse.

**✅ Solución:**  
```javascript
telefono: Joi.string()
    .pattern(/^[+]?[0-9\s\-()]{10,20}$/)
    .required()
    .messages({
        'string.pattern.base': 'Número de teléfono inválido (10-20 dígitos, acepta + - ( ) espacios)'
    })
```

---

### B-02: Missing Default Values in Database Schema

**📌 Ubicación:**  
[database-schema.sql](database-schema.sql) varias tablas

**🔍 Descripción:**  
Columnas como `rating` en `delivery_persons` NO tienen DEFAULT, causando NULL en nuevos registros.

**✅ Solución:**  
```sql
rating DECIMAL(3,2) DEFAULT 5.00,
```

---

### B-03: No Environment Variable Validation at Startup

**📌 Ubicación:**  
[server-enterprise.js](server-enterprise.js#L11-L28)

**🔍 Descripción:**  
El servidor inicia aunque falten variables críticas como `DB_PASSWORD`.

**✅ Solución:**  
```javascript
const REQUIRED_VARS = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
REQUIRED_VARS.forEach(varName => {
    if (!process.env[varName]) {
        throw new Error(`❌ Variable de entorno requerida faltante: ${varName}`);
    }
});
```

---

### B-04: Hardcoded Localhost URLs in Frontend

**📌 Ubicación:**  
[chat.html](chat.html#L352), [panel-repartidor-pro.html](panel-repartidor-pro.html#L699)

**🔍 Descripción:**  
WebSocket conecta a `http://localhost:5501` hardcoded.

**✅ Solución:**  
```javascript
const WS_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5501' 
    : 'https://www.yavoy.com';
const socket = io(WS_URL);
```

---

## 🔧 PLAN DE REPARACIÓN (Orden de Prioridad)

### Fase 1: Errores CRÍTICOS (URGENTE - 1-2 horas)
1. **C-01:** Eliminar líneas 130-145 de package.json
2. **C-06:** Agregar columna `ciudad` a tabla users
3. **C-02:** Agregar 5 tablas faltantes a database-schema.sql
4. **C-03:** Actualizar WebSocket registrar en chat.html y panel-repartidor-pro.html
5. **C-04:** Reemplazar 'REP-01' hardcoded por ID real
6. **C-05:** Implementar endpoints faltantes (12+)

### Fase 2: Errores MEDIOS (IMPORTANTE - 3-4 horas)
1. **M-01:** Reemplazar console.log por logger Winston
2. **M-02:** Agregar error responses en catch blocks
3. **M-04:** Implementar JWT middleware
4. **M-05:** Configurar CORS restrictivo
5. **M-06:** Activar rate limiting
6. **M-07:** Validar queries con prepared statements

### Fase 3: Errores BAJOS (MEJORAS - 1-2 horas)
1. **B-01:** Flexibilizar Joi telefono pattern
2. **B-03:** Validar env vars al startup
3. **B-04:** Dynamic WebSocket URLs

---

## ✅ CHECKLIST DE VALIDACIÓN POST-FIX

```bash
# 1. Validar package.json
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"

# 2. Aplicar schema PostgreSQL
psql -U yavoy_user -d yavoy_production -f database-schema.sql

# 3. Validar columna ciudad
psql -U yavoy_user -d yavoy_production -c "\d users" | grep ciudad

# 4. Iniciar PM2
pm2 start ecosystem.config.js

# 5. Verificar health check
curl http://localhost:3000/api/health

# 6. Test WebSocket
# (Abrir chat.html y ver consola: debe registrar en ciudad correcta)

# 7. Test endpoint GET /api/repartidores
curl http://localhost:3000/api/repartidores

# 8. Validar logs Winston
tail -f logs/winston-combined.log

# 9. Test endpoint protegido sin token (debe dar 401)
curl http://localhost:3000/api/pedidos

# 10. Verificar PM2 status
pm2 status
# Debe mostrar: status: online, restarts: 0
```

---

## 📊 MÉTRICAS DE CALIDAD POST-REPARACIÓN

| Métrica | Antes | Objetivo | Criterio de Éxito |
|---------|-------|----------|-------------------|
| PM2 Startup Success | ❌ 0% | ✅ 100% | Exit Code: 0 |
| Endpoints Implementados | 8 | 20+ | 100% frontend fetch() con respuesta |
| WebSocket Rooms Activas | ❌ 0 | ✅ 3+ | user, tipo, ciudad |
| Database Tables | 8 | 13 | Todas las features v3.0_socio |
| Logger Usage | 20% | 100% | 0 console.log/error |
| Error Response Rate | 30% | 100% | Todos los catch con JSON response |
| SQL Injection Risk | ⚠️ ALTO | ✅ NULO | 100% prepared statements |
| CORS Security | ❌ * | ✅ Dominio específico | No wildcard |

---

## 📝 CONCLUSIONES

### Resumen de Hallazgos
El sistema YAvoy v3.1 Enterprise tiene **6 errores CRÍTICOS** que impiden el arranque:
1. Sintaxis JSON inválida en package.json bloquea PM2
2. Falta de 5 tablas en PostgreSQL causa 500 errors en endpoints
3. WebSocket registrar sin parámetro ciudad rompe rooms geográficas
4. 12+ endpoints faltantes causan 404 en frontend
5. Columna `ciudad` faltante en tabla users

Adicionalmente, hay **8 errores MEDIOS** de seguridad y consistencia (JWT, CORS, rate limiting, logging) y **4 errores BAJOS** de UX y configuración.

### Impacto Estimado
- **Tiempo de Resolución:** 6-8 horas de trabajo
- **Riesgo Actual:** 🔴 ALTO (sistema no operativo)
- **Riesgo Post-Fix:** 🟢 BAJO (producción-ready)

### Recomendaciones Finales
1. **NO DESPLEGAR EN HOSTINGER** hasta resolver TODOS los errores CRÍTICOS.
2. Ejecutar script de migración PostgreSQL **DESPUÉS** de agregar las 5 tablas.
3. Implementar test suite automatizado para prevenir regresiones.
4. Configurar CI/CD con validación de schema, syntax checks y tests de integración.

---

**Generado por:** Deep Scan QA System v3.1  
**Próximo Paso:** Ejecutar [PLAN_REPARACION_AUTOMATICO.ps1](PLAN_REPARACION_AUTOMATICO.ps1) (archivo a crear)
