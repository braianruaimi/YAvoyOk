# 🏪 Sistema Completo de Comercios - YaVoy

## 📋 Índice
1. [Flujo Completo del Sistema](#flujo-completo)
2. [Panel del Comercio](#panel-del-comercio)
3. [Funcionalidades Principales](#funcionalidades-principales)
4. [Endpoints API](#endpoints-api)
5. [Casos de Uso](#casos-de-uso)

---

## 🔄 Flujo Completo del Sistema

### 1️⃣ Registro Inicial
```
Cliente → Formulario de Registro → Verificación CEO → Aprobación
```

**Datos requeridos:**
- Nombre del comercio
- Nombre del propietario
- Email
- Teléfono / WhatsApp
- Categoría (Alimentación, Salud, Bazar, Indumentaria, Kiosco, Otros)
- Dirección

**Resultado:**
- Se genera un ID único: `COM-{timestamp}`
- Se crea archivo JSON en `/registros/servicios-{categoria}/`
- Se genera informe CEO en `/informes-ceo/comercios/`
- Se muestra modal de verificación con:
  - ID del comercio
  - Botón "Copiar ID"
  - Botón **"🏪 Ir a Mi Panel"** → Acceso directo al panel

---

### 2️⃣ Acceso al Panel
```
Modal Verificación → Botón "Ir a Mi Panel" → panel-comercio.html?id=COM-XXX
```

**URL del panel:**
```
http://localhost:5501/panel-comercio.html?id=COM-1733369852154
```

**Validación:**
- El panel verifica que el ID exista
- Carga datos del comercio desde el servidor
- Si no existe, redirige a página principal

---

### 3️⃣ Configuración Inicial (Primera vez)
Cuando el comercio accede por primera vez:

1. **Tab Configuración** (⚙️)
   - Completar/actualizar datos del comercio
   - Nombre, categoría, dirección, teléfono, email
   - Horario de atención
   - Descripción del comercio
   - Botón: **"💾 Guardar Cambios"**

2. **Sistema de actualización:**
   ```javascript
   PATCH /api/comercio/:id
   Body: {
     nombre: "...",
     categoria: "...",
     direccion: "...",
     telefono: "...",
     email: "...",
     horario: "...",
     descripcion: "..."
   }
   ```

---

## 🎛️ Panel del Comercio

### Estructura de Tabs

#### 1. 📦 **Pedidos Recibidos** (Principal)
Pedidos que los clientes hacen AL comercio.

**Estadísticas Rápidas:**
- Pedidos Pendientes
- En Proceso (asignados + en camino)
- Completados Hoy
- Ventas Hoy ($$$)

**Filtros:**
- Todos
- Pendientes
- Asignados
- En Camino
- Entregados

**Información de cada pedido:**
- ID del pedido
- Estado visual (badge con color)
- Cliente
- Dirección de entrega
- Monto
- Fecha/hora
- Descripción

**Acciones disponibles:**
- 🚴 **Asignar Repartidor** (solo pendientes)
- 👁️ Ver Detalle
- ❌ Cancelar (solo pendientes)

---

#### 2. 🛒 **Mis Pedidos** (Como Cliente)
Pedidos que el COMERCIO crea para que repartidores entreguen.

**Ejemplo de uso:**
> Un restaurante necesita que un repartidor lleve comida preparada a un cliente que pidió por teléfono.

**Botón principal:**
- ➕ **Crear Pedido**

**Formulario de nuevo pedido:**
```javascript
{
  clienteId: "COM-XXX", // ID del comercio
  clienteNombre: "Nombre del Comercio",
  descripcion: "Descripción del pedido",
  direccionEntrega: "Calle, número, barrio",
  destinatario: "Nombre destinatario",
  telefonoDestinatario: "Teléfono contacto",
  monto: 0.00,
  notas: "Instrucciones especiales"
}
```

**Estados del pedido:**
- ⏳ Pendiente → Sin repartidor asignado
- 📋 Asignado → Repartidor asignado, aún no salió
- 🚚 En Camino → Repartidor en ruta
- ✅ Entregado → Pedido completado
- ❌ Cancelado

---

#### 3. 📊 **Estadísticas**
Métricas del comercio:

- **Total Pedidos Recibidos:** Pedidos de clientes
- **Ventas Totales:** Ingresos por pedidos entregados
- **Calificación Promedio:** Rating del comercio
- **Clientes Únicos:** Cantidad de clientes diferentes

---

#### 4. ⚙️ **Configuración**
Gestión de datos del comercio:

**Campos editables:**
- Nombre del Comercio *
- Categoría *
- Dirección *
- Teléfono *
- Email *
- Horario de Atención
- Descripción del Comercio

**Validación:**
- Campos con * son obligatorios
- Email formato válido
- Teléfono numérico

---

## 🚴 Sistema de Asignación de Repartidores

### Flujo de Asignación

1. **Comercio recibe pedido pendiente**
2. Click en botón **"🚴 Asignar Repartidor"**
3. **Modal se abre** con lista de repartidores disponibles:

```
┌─────────────────────────────────────────┐
│  🚴 Asignar Repartidor                  │
├─────────────────────────────────────────┤
│                                         │
│  Selecciona un repartidor disponible:  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Braian Ruaimi                   │   │
│  │ 📱 3794123456 | 🏍️ moto        │   │
│  │ ⭐ 5.0                    ✓ Disponible│
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ María González                  │   │
│  │ 📱 3794654321 | 🚗 auto        │   │
│  │ ⭐ 4.8                    ✓ Disponible│
│  └─────────────────────────────────┘   │
│                                         │
│  [✅ Confirmar Asignación]              │
└─────────────────────────────────────────┘
```

4. **Click en repartidor** → Se marca como seleccionado (borde verde)
5. **Click "Confirmar Asignación"** → Se ejecuta:

```javascript
PATCH /api/pedidos/:id/asignar
Body: { repartidorId: "REP-001" }

Resultado:
- pedido.estado = "asignado"
- pedido.repartidorId = "REP-001"
- pedido.repartidor = { id, nombre, telefono, vehiculo }
- pedido.fechaAsignacion = timestamp
```

6. **Pedido actualizado** en la lista → Badge cambia a "📋 Asignado"

---

## 🔌 Endpoints API

### Comercios

#### Obtener comercio por ID
```http
GET /api/comercio/:id
```
**Parámetros:**
- `:id` - ID del comercio (COM-XXX)

**Respuesta:**
```json
{
  "success": true,
  "comercio": {
    "id": "COM-1733369852154",
    "nombreComercio": "Pizzería Don Mario",
    "nombrePropietario": "Mario Rodríguez",
    "email": "mario@pizza.com",
    "telefono": "3794123456",
    "categoria": "alimentacion",
    "direccion": "Av. 9 de Julio 123",
    "horario": "Lun-Sab 18:00-00:00",
    "descripcion": "Pizzas artesanales a la piedra",
    "pedidosRecibidos": 0,
    "ventasTotal": 0,
    "activo": true,
    "fechaRegistro": "2024-12-04T..."
  }
}
```

#### Actualizar comercio
```http
PATCH /api/comercio/:id
Content-Type: application/json

{
  "nombre": "Nuevo nombre",
  "categoria": "alimentacion",
  "direccion": "Nueva dirección",
  "telefono": "3794XXXXXX",
  "email": "nuevo@email.com",
  "horario": "Lun-Vie 9:00-18:00",
  "descripcion": "Nueva descripción"
}
```

**Respuesta:**
```json
{
  "success": true,
  "comercio": { /* comercio actualizado */ }
}
```

---

### Pedidos

#### Listar pedidos con filtros
```http
GET /api/pedidos?comercioId=COM-XXX
GET /api/pedidos?clienteId=COM-XXX
GET /api/pedidos?estado=pendiente
GET /api/pedidos?repartidorId=REP-001
```

**Parámetros query:**
- `comercioId` - Pedidos recibidos por el comercio
- `clienteId` - Pedidos creados por el comercio (como cliente)
- `estado` - Filtrar por estado
- `repartidorId` - Pedidos de un repartidor específico

**Respuesta:**
```json
{
  "success": true,
  "pedidos": [
    {
      "id": "PED-1733370000000",
      "nombreCliente": "Juan Pérez",
      "telefonoCliente": "3794111222",
      "direccionEntrega": "Calle Falsa 123",
      "descripcion": "2 pizzas muzza",
      "destinatario": "Juan Pérez",
      "telefonoDestinatario": "3794111222",
      "notas": "Sin cebolla",
      "monto": 2500,
      "estado": "pendiente",
      "comercioId": "COM-1733369852154",
      "clienteId": null,
      "cliente": null,
      "repartidorId": null,
      "repartidor": null,
      "timestamp": "2024-12-04T...",
      "updatedAt": "2024-12-04T..."
    }
  ],
  "total": 1
}
```

#### Crear pedido (comercio como cliente)
```http
POST /api/pedidos
Content-Type: application/json

{
  "clienteId": "COM-1733369852154",
  "clienteNombre": "Pizzería Don Mario",
  "descripcion": "Entregar 3 pizzas a domicilio",
  "direccionEntrega": "Av. Libertad 456",
  "destinatario": "María López",
  "telefonoDestinatario": "3794333444",
  "monto": 3750,
  "notas": "Tocar timbre 3 veces"
}
```

#### Asignar repartidor a pedido
```http
PATCH /api/pedidos/:id/asignar
Content-Type: application/json

{
  "repartidorId": "REP-001"
}
```

**Validaciones:**
- El pedido debe existir
- El pedido debe estar en estado "pendiente"
- El repartidor debe existir

**Resultado:**
- Estado cambia a "asignado"
- Se asigna información del repartidor
- Se registra fecha de asignación

#### Actualizar pedido
```http
PATCH /api/pedidos/:id
Content-Type: application/json

{
  "estado": "cancelado"
  // O cualquier otro campo: descripcion, monto, notas, direccionEntrega
}
```

#### Actualizar estado de pedido
```http
PATCH /api/pedidos/:id/estado
Content-Type: application/json

{
  "estado": "entregado"
}
```

**Estados válidos:**
- `pendiente`
- `asignado`
- `en-camino`
- `entregado`
- `cancelado`

**Comportamiento especial:**
- Cuando estado = `entregado`:
  - Actualiza estadísticas del repartidor
  - Suma al saldo total
  - Incrementa pedidos completados
  - Agrega al historial del repartidor
  - Actualiza informe CEO

---

### Repartidores

#### Listar repartidores disponibles
```http
GET /api/repartidores?disponible=true
```

**Respuesta:**
```json
{
  "success": true,
  "repartidores": [
    {
      "id": "REP-001",
      "nombre": "Braian Ruaimi",
      "telefono": "3794123456",
      "email": "braian@example.com",
      "vehiculo": "moto",
      "disponible": true,
      "calificacion": 5.0,
      "pedidosCompletados": 0,
      "saldoTotal": 0
    }
  ],
  "total": 1
}
```

---

## 💼 Casos de Uso

### Caso 1: Restaurante Recibe Pedido

**Escenario:**
> Un cliente llama al restaurante "Pizzería Don Mario" para pedir 2 pizzas. El encargado toma el pedido y necesita asignar un repartidor.

**Flujo:**
1. Cliente llama y pide 2 pizzas muzza ($2500)
2. Encargado ingresa pedido manualmente al sistema (o lo registra el cliente desde la app)
3. Pedido aparece en **"📦 Pedidos Recibidos"** con estado **"⏳ Pendiente"**
4. Encargado hace click en **"🚴 Asignar Repartidor"**
5. Ve lista de repartidores disponibles: **Braian Ruaimi** está disponible
6. Selecciona a Braian y confirma
7. Pedido cambia a **"📋 Asignado"**
8. Braian recibe notificación en su panel (futuro)
9. Braian entrega el pedido
10. Actualiza estado a **"✅ Entregado"**
11. Estadísticas se actualizan:
    - Ventas Hoy: +$2500
    - Completados Hoy: +1
    - Saldo Braian: +$2000 (80%)
    - Comisión YaVoy: +$500 (20%)

---

### Caso 2: Comercio Crea Pedido Propio

**Escenario:**
> Una farmacia necesita enviar medicamentos urgentes a un cliente que hizo un pedido telefónico.

**Flujo:**
1. Farmacia recibe llamada: "Necesito ibuprofeno 600mg"
2. Encargado va a **"🛒 Mis Pedidos"**
3. Click en **"➕ Crear Pedido"**
4. Completa formulario:
   - Descripción: "Ibuprofeno 600mg x 10 comprimidos"
   - Dirección: "Av. Sarmiento 789"
   - Destinatario: "Carlos Martínez"
   - Teléfono: "3794555666"
   - Monto a cobrar: $1500
   - Notas: "Urgente - Paciente postrado"
5. Click **"✅ Crear Pedido"**
6. Sistema genera `PED-XXXXXXXXXX`
7. Pedido aparece en "Mis Pedidos" con estado **"⏳ Pendiente"**
8. Farmacia puede ver estado en tiempo real
9. Repartidores disponibles ven el pedido (futuro: panel repartidor)
10. Un repartidor acepta el pedido
11. Estado cambia a **"📋 Asignado"** → **"🚚 En Camino"** → **"✅ Entregado"**

---

### Caso 3: Panel de Comercio - Configuración

**Escenario:**
> Un kiosco recién registrado necesita completar sus datos.

**Flujo:**
1. Kiosco se registra desde página principal
2. Recibe ID: `COM-1733370123456`
3. Click en **"🏪 Ir a Mi Panel"** desde modal de verificación
4. Se abre panel en: `panel-comercio.html?id=COM-1733370123456`
5. Sistema carga datos básicos del registro
6. Comercio va a tab **"⚙️ Configuración"**
7. Completa/actualiza:
   - Horario: "Lun-Dom 7:00-23:00"
   - Descripción: "Kiosco 24/7 con amplia variedad de productos"
8. Click **"💾 Guardar Cambios"**
9. Sistema actualiza archivo JSON
10. Nombre en header se actualiza automáticamente

---

## 🔒 Seguridad y Validaciones

### Validaciones del Panel

1. **Acceso al panel:**
   - Requiere ID válido en URL
   - Verifica que el comercio exista
   - Si no existe → redirige a index.html

2. **Actualización de datos:**
   - Valida campos obligatorios
   - Email con formato válido
   - Teléfono numérico
   - Preserva ID original (inmutable)

3. **Asignación de repartidores:**
   - Solo pedidos pendientes
   - Repartidor debe existir
   - Repartidor debe estar disponible

4. **Creación de pedidos:**
   - Todos los campos obligatorios
   - Monto numérico ≥ 0
   - Dirección no vacía

---

## 🎨 Interfaz y UX

### Colores y Estados

**Estados de pedidos:**
```css
⏳ Pendiente    → #fef5e7 (amarillo claro)
📋 Asignado     → #ebf8ff (azul claro)
🚚 En Camino    → #e6fffa (verde agua)
✅ Entregado    → #f0fff4 (verde claro)
❌ Cancelado    → #fee (rojo claro)
```

**Tabs activos:**
```css
Color primario: #667eea (violeta)
Hover: transición suave
```

**Botones principales:**
```css
Gradiente: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Hover: translateY(-2px) + sombra
```

### Responsive Design

**Breakpoint: 768px**
- Header en columna
- Tabs en scroll horizontal
- Pedidos en una sola columna
- Detalles apilados verticalmente

---

## 🔄 Auto-Refresh

El panel actualiza datos automáticamente cada **30 segundos**:

```javascript
setInterval(async () => {
  await cargarPedidosRecibidos();
  await cargarMisPedidos();
}, 30000);
```

**Esto permite:**
- Ver nuevos pedidos sin recargar
- Actualizar estados en tiempo real
- Mantener estadísticas al día

---

## 📱 Próximas Funcionalidades

### En Desarrollo:
- [ ] Sistema de autenticación con contraseña
- [ ] Notificaciones push cuando llega pedido nuevo
- [ ] Chat en tiempo real con repartidores
- [ ] Historial completo de pedidos (paginación)
- [ ] Exportar reportes PDF/Excel
- [ ] Dashboard con gráficos de ventas
- [ ] Sistema de calificaciones (clientes califican comercio)
- [ ] Gestión de productos/servicios
- [ ] Horarios de disponibilidad automáticos
- [ ] Integración con sistemas de pago

### Mejoras Planeadas:
- [ ] Filtros avanzados (rango de fechas, monto)
- [ ] Búsqueda de pedidos por ID/cliente
- [ ] Modo oscuro
- [ ] Acceso offline (PWA)
- [ ] Notificaciones sonoras
- [ ] Mapa de ubicación de repartidores

---

## 🆘 Soporte y Contacto

**Para cualquier duda o problema:**

1. Revisar este documento
2. Verificar que el servidor esté corriendo
3. Comprobar ID del comercio en URL
4. Revisar consola del navegador (F12) para errores

**Logs del servidor:**
```bash
✓ Comercio COM-XXX actualizado
✓ Pedido PED-XXX asignado a repartidor REP-XXX
✓ Pedido PED-XXX - Estado actualizado a: entregado
```

---

**Documentación actualizada:** 4 de diciembre de 2024  
**Versión del sistema:** 1.0  
**Autor:** YaVoy Development Team
