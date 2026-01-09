# 📦 Sistema de Gestión de Pedidos - YAvoy v8

## 🎯 Descripción General

Sistema completo de pedidos que conecta comercios con repartidores en tiempo real. Implementa flujo de estados, asignación automática, persistencia de datos y notificaciones visuales.

---

## ✨ Funcionalidades Implementadas

### 1. **Creación de Pedidos**
- ✅ Modal con formulario completo
- ✅ Selección de comercio desde lista registrada
- ✅ Campos: Producto, Destino, Teléfono, Precio, Notas
- ✅ Validación de campos requeridos
- ✅ ID único autogenerado (formato: PED{timestamp}{random})
- ✅ Fecha/hora de creación automática

### 2. **Estados del Pedido**
```
📊 FLUJO DE ESTADOS:

┌─────────────┐     ┌──────────┐     ┌───────────┐     ┌────────────┐
│  PENDIENTE  │ --> │ ACEPTADO │ --> │ EN CAMINO │ --> │ ENTREGADO  │
│     ⏳      │     │    ✅    │     │    🚴     │     │    📦      │
└─────────────┘     └──────────┘     └───────────┘     └────────────┘
       │
       v
┌─────────────┐
│  CANCELADO  │
│     ❌      │
└─────────────┘
```

**Configuración de Estados:**
| Estado | Emoji | Color | Siguiente Estado Válido |
|--------|-------|-------|------------------------|
| Pendiente | ⏳ | `#f59e0b` (Amber) | Aceptado, Cancelado |
| Aceptado | ✅ | `#10b981` (Green) | En Camino, Cancelado |
| En Camino | 🚴 | `#3b82f6` (Blue) | Entregado, Cancelado |
| Entregado | 📦 | `#6366f1` (Indigo) | - |
| Cancelado | ❌ | `#ef4444` (Red) | - |

### 3. **Vistas con Tabs**

#### **Tab 1: Pedidos Activos**
- Muestra pedidos en estados: Pendiente, Aceptado, En Camino
- Botones de acción según estado actual
- Vista para comercios que crearon pedidos

#### **Tab 2: Historial**
- Pedidos Entregados y Cancelados
- Ordenados por fecha de actualización (más recientes primero)
- Solo lectura con botón "Ver Detalles"

#### **Tab 3: Disponibles (Repartidores)**
- Solo pedidos en estado Pendiente
- Botón "Aceptar Pedido" para repartidores
- Asignación automática al aceptar

### 4. **Tarjetas de Pedido**

**Información Visible:**
- 🆔 ID corto (últimos 8 caracteres)
- 🏷️ Badge de estado con color
- 🏪 Nombre del comercio
- 📦 Descripción del producto
- 📍 Dirección de destino
- 💰 Precio formateado (ARS)
- 🛵 Repartidor asignado (si aplica)
- 🕐 Fecha de creación

**Acciones Disponibles:**
- Ver Detalles (todos)
- Aceptar Pedido (repartidores, si está pendiente)
- En Camino (repartidor, si está aceptado)
- Entregar (repartidor, si está en camino)

### 5. **Modal de Detalle**

**Secciones:**
1. **Información Completa**
   - ID completo
   - Estado actual con badge
   - Comercio solicitante
   - Producto/descripción
   - Dirección de destino
   - Teléfono del cliente (con link WhatsApp)
   - Precio
   - Repartidor asignado
   - Notas adicionales
   - Fecha creación y actualización

2. **Historial de Estados**
   - Lista cronológica de todos los cambios
   - Badge + Fecha/hora de cada transición
   - Útil para auditoría y seguimiento

3. **Botones de Acción Contextuales**
   - Según el estado actual del pedido
   - Solo permite transiciones válidas

---

## 🛠️ Implementación Técnica

### **Archivos Modificados:**

#### 1. `index.html` (v8)
```html
<!-- Nueva sección agregada -->
<section id="pedidos" class="seccion-pedidos">
  <!-- Tabs: Activos | Historial | Disponibles -->
  <!-- Grids de tarjetas por categoría -->
</section>

<!-- Modales agregados -->
<div id="modalNuevoPedido">...</div>
<div id="modalDetallePedido">...</div>
```

#### 2. `script.js` (v8)
**Funciones Principales:**
```javascript
// Gestión de Pedidos
crearPedido(datos)                    // Crear nuevo pedido
actualizarEstadoPedido(id, estado)    // Cambiar estado con validación
obtenerPedidosActivos()               // Filtrar activos
obtenerPedidosHistorial()             // Filtrar completados
obtenerPedidosDisponibles()           // Filtrar pendientes

// Validación
validarTransicionEstado(actual, nuevo) // Verifica transiciones permitidas
validarFormulario(form)                // Validación campos requeridos

// UI
renderizarTarjetaPedido(pedido, tipo) // Crear card HTML
verDetallePedido(id)                   // Abrir modal detalle
aceptarPedido(id)                      // Asignar repartidor
cambiarEstado(id, nuevoEstado)         // Actualizar estado

// Inicialización
inicializarFormularioNuevoPedido()    // Setup formulario
inicializarTabs()                      // Configurar tabs
actualizarVistas()                     // Refresh todas las vistas
```

**Estructura de Datos:**
```javascript
const pedido = {
  id: 'PED1701381234567abc',
  comercioId: 'COM123',
  comercioNombre: 'Pizzería Napolitana',
  producto: '2 pizzas medianas + gaseosa',
  destino: 'Calle 50 entre 10 y 11',
  telefono: '2215047962',
  precio: 5500,
  notas: 'Sin cebolla, timbre roto',
  estado: 'pendiente',
  repartidorId: null,
  repartidorNombre: null,
  fechaCreacion: 1701381234567,
  fechaActualizacion: 1701381234567,
  historialEstados: [
    { estado: 'pendiente', fecha: 1701381234567 },
    { estado: 'aceptado', fecha: 1701381345678 }
  ]
};
```

#### 3. `styles.css` (v8)
**Nuevas Clases:**
```css
/* Sección principal */
.seccion-pedidos
.pedidos-header
.pedidos-tabs
.tab-btn (.active)
.tab-content (.active)

/* Grid y tarjetas */
.pedidos-grid
.pedido-card
.pedido-header / .pedido-body / .pedido-actions
.pedido-id / .pedido-comercio / .pedido-producto
.pedido-destino / .pedido-precio / .pedido-repartidor

/* Estados */
.badge
.badge-pendiente / .badge-aceptado / .badge-en_camino
.badge-entregado / .badge-cancelado

/* Modal detalle */
.detalle-pedido
.detalle-row
.detalle-label / .detalle-value
.historial-estados
.historial-item

/* Responsive */
@media (max-width: 768px) { ... }
@media (max-width: 480px) { ... }
```

#### 4. `server.js` (v8)
**Nuevos Endpoints:**

**POST `/api/guardar-pedidos`**
```json
// Request
{
  "pedidos": [{ pedido1 }, { pedido2 }]
}

// Response
{
  "success": true,
  "total": 2
}
```

**GET `/api/listar-pedidos`**
```json
// Response
{
  "pedidos": [{ pedido1 }, { pedido2 }],
  "total": 2
}
```

**Persistencia:**
- Archivo: `registros/pedidos/pedidos.json`
- Backup automático en localStorage
- Sincronización dual (cliente + servidor)

---

## 🎨 Diseño y UX

### **Paleta de Colores por Estado**
```css
Pendiente:  #f59e0b (Amber 500)   - Atención necesaria
Aceptado:   #10b981 (Emerald 500) - Confirmado
En Camino:  #3b82f6 (Blue 500)    - En proceso
Entregado:  #6366f1 (Indigo 500)  - Completado
Cancelado:  #ef4444 (Red 500)     - Error/Cancelado
```

### **Responsive Design**
- **Desktop (>768px):** Grid 3 columnas
- **Tablet (768px):** Grid 2 columnas
- **Mobile (<480px):** Grid 1 columna, stack buttons

### **Animaciones**
```css
.pedido-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(6, 182, 212, 0.2);
}
```

### **Accesibilidad**
- ✅ Labels semánticos
- ✅ ARIA roles en modales
- ✅ Focus visible en tabs
- ✅ Colores con contraste WCAG AA

---

## 📊 Flujo de Usuario

### **Comercio Crea Pedido:**
```
1. Click "Crear Pedido"
2. Completa formulario (comercio, producto, destino, precio)
3. Submit → Pedido en estado "Pendiente"
4. Aparece en tab "Activos" y "Disponibles"
```

### **Repartidor Acepta Pedido:**
```
1. Ve pedidos en tab "Disponibles"
2. Click "Aceptar Pedido"
3. Se asigna automáticamente al pedido
4. Estado cambia a "Aceptado"
5. Pedido sale de "Disponibles", queda en "Activos"
```

### **Repartidor Entrega Pedido:**
```
1. Click "En Camino" → Estado "En Camino"
2. Llega al destino
3. Click "Entregar" → Estado "Entregado"
4. Pedido se mueve a "Historial"
```

---

## 🔐 Validaciones Implementadas

### **Creación de Pedido**
- ✅ Comercio seleccionado
- ✅ Producto no vacío
- ✅ Destino no vacío
- ✅ Teléfono no vacío
- ✅ Precio > 0

### **Transiciones de Estado**
```javascript
pendiente   → [aceptado, cancelado]     ✅
aceptado    → [en_camino, cancelado]    ✅
en_camino   → [entregado, cancelado]    ✅
entregado   → []                        🔒 Final
cancelado   → []                        🔒 Final
```

### **Seguridad**
- ✅ IDs únicos con timestamp + random
- ✅ Validación de transiciones
- ✅ Sanitización de inputs
- ✅ Persistencia dual (cliente + servidor)

---

## 📈 Métricas y Analytics

**Datos Rastreables:**
- 📊 Total de pedidos creados
- ⏱️ Tiempo promedio por estado
- 🛵 Pedidos por repartidor
- 🏪 Pedidos por comercio
- 💰 Volumen total de ventas
- ❌ Tasa de cancelación
- ⭐ Tiempo de entrega promedio

---

## 🚀 Próximas Mejoras Sugeridas

### **Corto Plazo**
1. **Notificaciones Push** cuando cambie estado
2. **Chat interno** comercio ↔ repartidor
3. **Geolocalización** tracking en tiempo real
4. **Filtros avanzados** por fecha, comercio, estado
5. **Búsqueda** por ID, producto, destino

### **Mediano Plazo**
6. **Calificaciones** de comercio y repartidor
7. **Pagos integrados** con MercadoPago
8. **Comisiones automáticas** (80% repartidor, 20% YAvoy)
9. **Estadísticas** panel con gráficos
10. **Exportación** CSV/PDF de pedidos

### **Largo Plazo**
11. **App móvil nativa** React Native
12. **IA para rutas** optimización con ML
13. **Predicción de demanda** por zona/horario
14. **Programa de fidelidad** puntos y recompensas

---

## 🧪 Testing

### **Casos de Prueba**
✅ Crear pedido con datos válidos  
✅ Crear pedido con campos vacíos (debe fallar)  
✅ Aceptar pedido pendiente  
✅ Intentar saltar estados (debe fallar)  
✅ Ver detalle con historial completo  
✅ Filtrar por tabs (Activos/Historial/Disponibles)  
✅ Responsive en móvil (320px)  
✅ Persistencia tras recargar página  

---

## 📞 Soporte

**Contacto Técnico:**
- 📧 Email: YAvoy5@gmail.com
- 💬 WhatsApp: +54 221 504 7962
- 📍 Oficina: Ensenada

**Versión:** v8.0  
**Última Actualización:** 30 Nov 2025  
**Autor:** Sistema YAvoy

---

## 📄 Licencia

Este módulo es parte del proyecto YAvoy PWA.  
© 2025 Todos los derechos reservados.
