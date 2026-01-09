# 📦 Sistema de Gestión de Pedidos - YaVoy

## Descripción General

Sistema completo de creación, asignación y seguimiento de pedidos en tiempo real con chat integrado entre clientes y repartidores.

---

## 🎯 Características Principales

### 1. Creación de Pedidos
- ✅ Formulario intuitivo para crear pedidos
- ✅ Múltiples productos por pedido
- ✅ Asociación con comercios registrados
- ✅ Validación de datos en frontend y backend

### 2. Gestión de Estados
Los pedidos siguen un flujo de estados:

```
PENDIENTE → ASIGNADO → EN CAMINO → ENTREGADO
                ↓
            CANCELADO
```

**Estados disponibles:**
- **pendiente**: Pedido recién creado, esperando asignación
- **asignado**: Repartidor asignado al pedido
- **en-camino**: Repartidor en camino a entregar
- **entregado**: Pedido entregado exitosamente
- **cancelado**: Pedido cancelado

### 3. Asignación de Repartidores
- ✅ Asignación manual a repartidores disponibles
- ✅ Visualización de repartidores disponibles/ocupados
- ✅ Contador de pedidos activos por repartidor

### 4. Chat en Tiempo Real
- ✅ Chat entre cliente y repartidor por pedido
- ✅ Mensajes con timestamp
- ✅ Identificación de remitente (cliente/repartidor)
- ✅ Interfaz desplegable en cada tarjeta de pedido

### 5. Panel de Estadísticas
- Total de pedidos
- Pedidos pendientes
- Pedidos en camino
- Pedidos entregados

### 6. Filtros Avanzados
- Filtrar por estado del pedido
- Filtrar por repartidor asignado
- Visualización dinámica de resultados

---

## 🛠️ API Endpoints

### Pedidos

#### Crear Pedido
```http
POST /api/pedidos
Content-Type: application/json

{
  "clienteNombre": "Juan Pérez",
  "clienteTelefono": "123456789",
  "direccion": "Calle Falsa 123",
  "comercioId": "COM-12345",
  "productos": [
    {
      "nombre": "Pizza Napolitana",
      "cantidad": 2,
      "precio": 1500
    }
  ],
  "total": 3000
}
```

**Respuesta:**
```json
{
  "success": true,
  "pedido": {
    "id": "PED-1234567890",
    "clienteNombre": "Juan Pérez",
    "clienteTelefono": "123456789",
    "direccion": "Calle Falsa 123",
    "productos": [...],
    "comercioId": "COM-12345",
    "total": 3000,
    "estado": "pendiente",
    "repartidorId": null,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

#### Listar Pedidos
```http
GET /api/pedidos
GET /api/pedidos?estado=pendiente
GET /api/pedidos?repartidorId=REP-123
GET /api/pedidos?estado=en-camino&repartidorId=REP-123
```

**Respuesta:**
```json
{
  "success": true,
  "pedidos": [...],
  "total": 5
}
```

---

#### Obtener Pedido Específico
```http
GET /api/pedidos/:id
```

**Respuesta:**
```json
{
  "success": true,
  "pedido": { ... }
}
```

---

#### Asignar Repartidor
```http
POST /api/pedidos/:id/asignar
Content-Type: application/json

{
  "repartidorId": "REP-1234567890"
}
```

**Respuesta:**
```json
{
  "success": true,
  "pedido": {
    "id": "PED-1234567890",
    "estado": "asignado",
    "repartidorId": "REP-1234567890",
    "updatedAt": "2025-01-15T10:35:00.000Z"
  }
}
```

---

#### Actualizar Estado
```http
PATCH /api/pedidos/:id/estado
Content-Type: application/json

{
  "estado": "en-camino"
}
```

**Estados válidos:** `pendiente`, `asignado`, `en-camino`, `entregado`, `cancelado`

**Respuesta:**
```json
{
  "success": true,
  "pedido": {
    "id": "PED-1234567890",
    "estado": "en-camino",
    "updatedAt": "2025-01-15T10:40:00.000Z"
  }
}
```

---

### Chat

#### Enviar Mensaje
```http
POST /api/pedidos/:id/chat
Content-Type: application/json

{
  "mensaje": "¿Ya salió el pedido?",
  "remitente": "cliente"
}
```

**Remitentes válidos:** `cliente`, `repartidor`

**Respuesta:**
```json
{
  "success": true,
  "mensaje": {
    "id": "MSG-1234567890",
    "mensaje": "¿Ya salió el pedido?",
    "remitente": "cliente",
    "timestamp": "2025-01-15T10:45:00.000Z"
  }
}
```

---

#### Obtener Mensajes del Chat
```http
GET /api/pedidos/:id/chat
```

**Respuesta:**
```json
{
  "success": true,
  "mensajes": [
    {
      "id": "MSG-1234567890",
      "mensaje": "¿Ya salió el pedido?",
      "remitente": "cliente",
      "timestamp": "2025-01-15T10:45:00.000Z"
    },
    {
      "id": "MSG-1234567891",
      "mensaje": "Sí, ya voy en camino",
      "remitente": "repartidor",
      "timestamp": "2025-01-15T10:46:00.000Z"
    }
  ],
  "total": 2
}
```

---

### Repartidores

#### Registrar Repartidor
```http
POST /api/repartidores
Content-Type: application/json

{
  "nombre": "Carlos Gómez",
  "telefono": "987654321",
  "email": "carlos@example.com",
  "vehiculo": "moto"
}
```

**Vehículos válidos:** `moto`, `bicicleta`, `auto`, `a-pie`

**Respuesta:**
```json
{
  "success": true,
  "repartidor": {
    "id": "REP-1234567890",
    "nombre": "Carlos Gómez",
    "telefono": "987654321",
    "email": "carlos@example.com",
    "vehiculo": "moto",
    "disponible": true,
    "pedidosActivos": 0,
    "ubicacion": null,
    "createdAt": "2025-01-15T10:50:00.000Z"
  }
}
```

---

#### Listar Repartidores
```http
GET /api/repartidores
GET /api/repartidores?disponible=true
```

**Respuesta:**
```json
{
  "success": true,
  "repartidores": [...],
  "total": 3
}
```

---

#### Actualizar Ubicación del Repartidor
```http
PATCH /api/repartidores/:id/ubicacion
Content-Type: application/json

{
  "lat": -34.6037,
  "lng": -58.3816
}
```

**Respuesta:**
```json
{
  "success": true,
  "repartidor": {
    "id": "REP-1234567890",
    "ubicacion": {
      "lat": -34.6037,
      "lng": -58.3816,
      "timestamp": "2025-01-15T10:55:00.000Z"
    }
  }
}
```

---

## 💻 Interfaz de Usuario

### Acceso
URL: `http://localhost:5501/pedidos.html`

O desde la página principal: Clic en **"📦 Gestión de Pedidos"**

### Pestañas Disponibles

#### 1. Crear Pedido
- Formulario para crear nuevos pedidos
- Agregar múltiples productos dinámicamente
- Selección de comercio (opcional)
- Validación en tiempo real

#### 2. Lista de Pedidos
- Tarjetas visuales con información completa
- Badges de estado con colores diferenciados
- Filtros por estado y repartidor
- Estadísticas en tiempo real
- Acciones contextuales según el estado:
  - **Pendiente**: Botón "Asignar"
  - **Asignado**: Botón "En Camino"
  - **En Camino**: Botón "Entregar"
- Chat desplegable en cada pedido

#### 3. Repartidores
- Formulario de registro
- Lista de repartidores con estado de disponibilidad
- Contador de pedidos activos

---

## 🎨 Elementos Visuales

### Badges de Estado
- **PENDIENTE**: Amarillo (`#ffc107`)
- **ASIGNADO**: Cian (`#17a2b8`)
- **EN CAMINO**: Azul (`#007bff`)
- **ENTREGADO**: Verde (`#28a745`)
- **CANCELADO**: Rojo (`#dc3545`)

### Estadísticas
- Total Pedidos
- Pendientes
- En Camino
- Entregados

---

## 🔄 Flujo de Trabajo

### Crear y Procesar un Pedido

1. **Cliente crea pedido**
   - Accede a "Crear Pedido"
   - Completa formulario
   - Agrega productos
   - Envía pedido
   - Estado: `pendiente`

2. **Asignar repartidor**
   - En "Lista de Pedidos"
   - Click en "Asignar" en pedido pendiente
   - Ingresa ID del repartidor
   - Estado cambia a: `asignado`

3. **Repartidor recoge pedido**
   - Click en "En Camino"
   - Estado cambia a: `en-camino`

4. **Entrega completada**
   - Click en "Entregar"
   - Estado cambia a: `entregado`

### Chat durante el proceso

En cualquier momento, tanto cliente como repartidor pueden:
- Abrir chat (botón 💬)
- Escribir mensaje
- Seleccionar remitente (cliente/repartidor)
- Enviar mensaje
- Ver historial completo

---

## 📱 Características Futuras Planeadas

- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Mapa con ubicación del repartidor
- [ ] Notificaciones push por cambio de estado
- [ ] Estimación de tiempo de llegada
- [ ] Calificación del servicio
- [ ] Historial de pedidos por cliente
- [ ] Panel de métricas para administradores
- [ ] Exportación de reportes
- [ ] Integración con pasarelas de pago
- [ ] Sistema de recompensas para repartidores

---

## 🐛 Solución de Problemas

### El pedido no aparece en la lista
- Verificar que el servidor esté corriendo
- Revisar consola del navegador (F12)
- Comprobar que el pedido se creó correctamente

### No puedo asignar un repartidor
- Verificar que existan repartidores registrados
- Asegurarse de copiar correctamente el ID del repartidor (incluye "REP-")
- El pedido debe estar en estado "pendiente"

### El chat no carga mensajes
- Verificar que el pedido existe
- Revisar conexión al servidor
- Comprobar que los mensajes se envían correctamente

### Errores comunes
```
Error: Pedido no encontrado
→ Verificar que el ID del pedido sea correcto

Error: Estado inválido
→ Solo se permiten: pendiente, asignado, en-camino, entregado, cancelado

Error: El pedido ya fue asignado
→ Solo se pueden asignar pedidos en estado "pendiente"
```

---

## 📊 Almacenamiento de Datos

Actualmente, los datos se almacenan en memoria del servidor:

```javascript
// Arrays en memoria
let pedidos = [];
let chats = {};
let repartidores = [];
```

**Nota:** Los datos se pierden al reiniciar el servidor. Para producción se recomienda implementar persistencia en base de datos (MongoDB, PostgreSQL, etc.)

---

## 🔐 Seguridad

### Validaciones Implementadas
- ✅ Validación de campos requeridos
- ✅ Validación de estados válidos
- ✅ Verificación de existencia de pedidos/repartidores
- ✅ Sanitización básica de datos

### Mejoras Recomendadas para Producción
- [ ] Autenticación de usuarios
- [ ] Autorización por roles (cliente, repartidor, admin)
- [ ] Rate limiting
- [ ] Encriptación de datos sensibles
- [ ] Logs de auditoría

---

## 🚀 Inicio Rápido

1. **Iniciar servidor:**
   ```bash
   node server.js
   # O usar INICIAR_YAVOY.bat
   ```

2. **Acceder a la aplicación:**
   ```
   http://localhost:5501
   ```

3. **Ir a gestión de pedidos:**
   - Click en "📦 Gestión de Pedidos"
   - O acceder directamente a: `http://localhost:5501/pedidos.html`

4. **Registrar repartidor (opcional):**
   - Pestaña "Repartidores"
   - Completar formulario
   - Copiar el ID generado (REP-XXXXXXXXXX)

5. **Crear pedido de prueba:**
   - Pestaña "Crear Pedido"
   - Completar datos
   - Agregar productos
   - Enviar

6. **Probar flujo completo:**
   - Ir a "Lista de Pedidos"
   - Asignar repartidor
   - Cambiar estados
   - Probar chat

---

## 📞 Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.

**Versión:** 1.0.0  
**Última actualización:** Enero 2025
