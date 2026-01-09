# 🏪 Panel de Comercio - Guía Rápida

## ✅ Sistema Implementado Completamente

### 🎯 Flujo Principal

```
1. Registro de Comercio
   ↓
2. Modal de Verificación con ID
   ↓
3. Click "🏪 Ir a Mi Panel"
   ↓
4. Panel Personal del Comercio
```

---

## 📦 Funcionalidades del Panel

### **Tab 1: Pedidos Recibidos** (Principal)
Pedidos que los clientes hacen AL comercio.

✅ **Estadísticas en tiempo real:**
- Pedidos Pendientes
- En Proceso
- Completados Hoy
- Ventas Hoy

✅ **Acciones disponibles:**
- 🚴 **Asignar Repartidor** → Modal con lista de repartidores disponibles
- 👁️ Ver Detalle
- ❌ Cancelar pedido

✅ **Filtros:**
- Todos | Pendientes | Asignados | En Camino | Entregados

---

### **Tab 2: Mis Pedidos** (Como Cliente)
Pedidos que el comercio CREA para repartidores.

✅ **Botón: ➕ Crear Pedido**

**Formulario incluye:**
- Descripción del pedido
- Dirección de entrega
- Destinatario y teléfono
- Monto a cobrar
- Notas adicionales

**Ejemplo:** Un restaurante necesita que un repartidor lleve comida a un cliente que pidió por teléfono.

---

### **Tab 3: Estadísticas**
Métricas del comercio:
- Total Pedidos Recibidos
- Ventas Totales
- Calificación Promedio
- Clientes Únicos

---

### **Tab 4: Configuración**
Gestión de datos del comercio:
- Nombre, Categoría, Dirección
- Teléfono, Email, Horario
- Descripción

**Botón:** 💾 Guardar Cambios

---

## 🚴 Sistema de Asignación de Repartidores

### Proceso:
1. Comercio recibe pedido (estado: **Pendiente**)
2. Click en **"🚴 Asignar Repartidor"**
3. Se abre modal con repartidores disponibles
4. Muestra: Nombre, Teléfono, Vehículo, Calificación
5. Click en repartidor → Se selecciona
6. **"✅ Confirmar Asignación"**
7. Pedido cambia a estado: **Asignado**

### Estados de Pedidos:
- ⏳ **Pendiente** → Sin repartidor
- 📋 **Asignado** → Repartidor asignado
- 🚚 **En Camino** → Repartidor en ruta
- ✅ **Entregado** → Completado
- ❌ **Cancelado**

---

## 🔌 Endpoints API Principales

### Comercios
```http
GET  /api/comercio/:id           # Obtener comercio
PATCH /api/comercio/:id          # Actualizar comercio
```

### Pedidos
```http
GET   /api/pedidos?comercioId=COM-XXX    # Pedidos recibidos
GET   /api/pedidos?clienteId=COM-XXX     # Pedidos creados
POST  /api/pedidos                        # Crear pedido
PATCH /api/pedidos/:id/asignar           # Asignar repartidor
PATCH /api/pedidos/:id/estado            # Actualizar estado
PATCH /api/pedidos/:id                   # Actualizar pedido
```

### Repartidores
```http
GET /api/repartidores?disponible=true   # Listar disponibles
```

---

## 📱 Acceso al Panel

### Desde el registro:
1. Completar formulario de comercio
2. Click **"Registrarse"**
3. Aparece modal con ID: `COM-XXXXXXXXXX`
4. Click **"🏪 Ir a Mi Panel"**
5. Se abre: `panel-comercio.html?id=COM-XXXXXXXXXX`

### Acceso directo:
```
http://localhost:5501/panel-comercio.html?id=COM-1733369852154
```

---

## 💡 Casos de Uso

### Caso 1: Restaurante recibe pedido telefónico
1. Cliente llama y pide 2 pizzas
2. Pedido aparece en "Pedidos Recibidos" (Pendiente)
3. Comercio asigna repartidor disponible
4. Repartidor entrega
5. Estado → Entregado
6. Estadísticas se actualizan automáticamente

### Caso 2: Farmacia necesita repartidor
1. Cliente pide medicamentos por teléfono
2. Farmacia va a "Mis Pedidos"
3. Click "➕ Crear Pedido"
4. Completa datos y monto
5. Pedido queda disponible para repartidores
6. Repartidor acepta y entrega

---

## 🎨 Características de la Interfaz

✅ **Diseño moderno:**
- Gradientes violeta/púrpura
- Cards con sombras
- Animaciones suaves
- Responsive (móvil/desktop)

✅ **Auto-refresh:**
- Actualiza pedidos cada 30 segundos
- No requiere recargar página

✅ **Estadísticas visuales:**
- Números grandes para métricas importantes
- Iconos descriptivos
- Colores según estado

---

## 🔒 Validaciones

✅ **Panel:**
- Verifica que comercio exista
- Si no existe → redirige a home

✅ **Asignación:**
- Solo pedidos pendientes
- Repartidor debe estar disponible

✅ **Pedidos:**
- Campos obligatorios validados
- Monto ≥ 0

---

## 🚀 Servidor Activo

**URL:** http://localhost:5501

**Endpoints disponibles:**
```
GET  /                        → Página principal
GET  /panel-comercio.html     → Panel del comercio
POST /api/guardar-comercio    → Registrar comercio
GET  /api/comercio/:id        → Obtener comercio
PATCH /api/comercio/:id       → Actualizar comercio
GET  /api/pedidos             → Listar pedidos (con filtros)
POST /api/pedidos             → Crear pedido
PATCH /api/pedidos/:id/asignar → Asignar repartidor
GET  /api/repartidores        → Listar repartidores
```

---

## 📝 Archivos Clave

### Frontend:
- `panel-comercio.html` → Panel completo del comercio
- `index.html` → Página principal con formularios
- `styles.css` → Estilos globales

### Backend:
- `server.js` → API y endpoints
- `/registros/servicios-*/*.json` → Datos de comercios
- `/registros/pedidos/*.json` → Datos de pedidos (futuro)
- `/informes-ceo/comercios/*.json` → Reportes CEO

### Documentación:
- `docs/SISTEMA_COMERCIOS.md` → Documentación completa
- `docs/GUIA_RAPIDA_COMERCIOS.md` → Este archivo

---

## ✨ Próximos Pasos

### Para comercios:
1. ✅ Registrarse en el sistema
2. ✅ Acceder al panel personal
3. ✅ Configurar datos del comercio
4. ✅ Empezar a recibir pedidos
5. ✅ Asignar repartidores
6. ⏳ Sistema de autenticación (en desarrollo)
7. ⏳ Notificaciones push (en desarrollo)

---

## 🆘 Soporte

**Problemas comunes:**

❓ **No puedo acceder al panel**
- Verifica que el ID sea correcto
- Revisa que el servidor esté corriendo
- Comprueba la URL: `panel-comercio.html?id=COM-XXX`

❓ **No aparecen repartidores disponibles**
- Verifica que haya repartidores registrados
- Comprueba que estén marcados como `disponible: true`

❓ **No se guardan los cambios**
- Revisa la consola del navegador (F12)
- Verifica que todos los campos obligatorios estén completos

---

**Última actualización:** 4 de diciembre de 2024  
**Versión:** 1.0  
**Estado:** ✅ Completamente funcional
