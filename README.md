# YAvoy - Sistema Unificado Definitivo

![YAvoy](icons/icon-yavoy.png)

## 🚀 Plataforma de Reparto Local

Sistema completo de gestión de pedidos y entregas que conecta **clientes**, **comercios** y **repartidores**.

---

## ✨ Características Principales

### Para Clientes
- 🛍️ Realizar pedidos desde comercios locales
- 📍 Seguimiento en tiempo real
- 💬 Chat con repartidor
- ⭐ Sistema de calificaciones

### Para Comercios
- 🏪 Panel de administración completo
- 📊 Gestión de pedidos
- 💰 Control de ventas
- 📈 Estadísticas y reportes

### Para Repartidores
- 🚴 Panel de trabajo en tiempo real
- 📱 Notificaciones push de nuevos pedidos
- 💵 Control de ganancias (80% por envío)
- 🗺️ Rutas optimizadas

---

## 📋 Requisitos Previos

- **Node.js** 16+ (https://nodejs.org/)
- **NPM** (incluido con Node.js)
- **Navegador moderno** (Chrome, Firefox, Edge)

---

## ⚡ Instalación Rápida

### Opción 1: Inicio Automático (Recomendado)

**Windows CMD:**
```bash
INICIAR_YAVOY_FINAL.bat
```

**PowerShell:**
```powershell
.\INICIAR_SERVIDOR.ps1
```

### Opción 2: Inicio Manual

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor
node server.js
```

El servidor se iniciará en: **http://localhost:5501**

---

## 🗂️ Estructura del Proyecto

```
YAvoy_DEFINITIVO/
├── index.html              # Página principal
├── panel-comercio.html     # Panel para comercios
├── panel-repartidor.html   # Panel para repartidores
├── server.js               # Servidor Express + API
├── sw.js                   # Service Worker (PWA)
├── script.js               # JavaScript principal
├── styles.css              # Estilos principales
│
├── js/                     # Módulos JavaScript
│   ├── db.js              # IndexedDB
│   ├── forms.js           # Validación de formularios
│   ├── notifications.js   # Web Push Notifications
│   └── ui.js              # Interfaz de usuario
│
├── styles/                 # Estilos adicionales
│   ├── animations.css
│   └── modales.css
│
├── icons/                  # Iconos PWA
├── docs/                   # Documentación
└── registros/              # Base de datos local (JSON)
    ├── comercios/
    ├── repartidores/
    └── pedidos/
```

---

## 🔌 API Endpoints

### Comercios
- `POST /api/comercios` - Registrar nuevo comercio
- `GET /api/comercios` - Listar comercios activos

### Repartidores
- `POST /api/repartidores` - Registrar repartidor
- `GET /api/repartidores` - Listar repartidores
- `GET /api/repartidores/:id` - Obtener repartidor específico

### Pedidos
- `POST /api/pedidos` - Crear nuevo pedido
- `GET /api/pedidos` - Listar todos los pedidos
- `GET /api/pedidos/:id` - Obtener pedido específico
- `PUT /api/pedidos/:id/estado` - Actualizar estado del pedido

### Notificaciones
- `POST /api/subscribe` - Suscribir a notificaciones push
- `GET /api/vapid-public-key` - Obtener clave pública VAPID

### Chat
- `GET /api/chats/:pedidoId` - Obtener mensajes del chat
- `POST /api/chats/:pedidoId/mensajes` - Enviar mensaje

---

## 🔧 Configuración

Las claves VAPID ya están configuradas en el servidor. Para cambiarlas, edita `server.js`.

---

## 🌐 PWA (Progressive Web App)

La aplicación es instalable como PWA:

1. Abre la app en Chrome/Edge
2. Click en el ícono de instalación en la barra de direcciones
3. Confirma la instalación
4. ¡Listo! Ya puedes usarla como app nativa

---

## 🧪 Características Técnicas

- ✅ **PWA** con Service Worker y caché offline
- ✅ **Web Push Notifications** (VAPID)
- ✅ **IndexedDB** para almacenamiento local
- ✅ **Sincronización en segundo plano**
- ✅ **Responsive Design**
- ✅ **API RESTful**
- ✅ **Sistema de archivos JSON** (sin DB externa)
- ✅ **ES6 Modules**

---

## 📱 Uso del Sistema

### 1. Registro de Comercio
1. Click en "Soy Comercio" → "Registrarme"
2. Completa el formulario
3. Recibirás un **ID de Comercio** (ej: `COM-001`)
4. Accede a tu panel con ese ID

### 2. Registro de Repartidor
1. Click en "Soy Repartidor" → "Registrarme"
2. Completa datos personales
3. Sube DNI (frente y dorso)
4. Sube cédula del vehículo (si aplica)
5. Acepta términos y condiciones
6. Recibirás un **ID de Repartidor** (ej: `REP-001`)

### 3. Crear Pedido (Cliente)
1. Click en "Quiero Pedir" → "Hacer Pedido"
2. Completa datos de entrega
3. Describe el pedido
4. Recibirás un **Número de Pedido** (ej: `PED-001`)

---

## 🔒 Seguridad

- ✅ Validación de formularios del lado del cliente y servidor
- ✅ Sanitización de inputs
- ✅ CORS configurado
- ✅ Almacenamiento seguro de documentos
- ✅ Sin exposición de claves privadas

---

## 📊 Modelo de Negocio

- **Repartidor recibe:** 80% del costo de envío
- **Plataforma retiene:** 20% del costo de envío

---

## 🐛 Solución de Problemas

### El servidor no inicia
```bash
# Verificar que Node.js esté instalado
node --version

# Reinstalar dependencias
npm install

# Iniciar manualmente
node server.js
```

### Las notificaciones no funcionan
1. Verifica que estés usando HTTPS o localhost
2. Acepta los permisos de notificaciones
3. Revisa la consola del navegador

### Error de puertos
Si el puerto 5501 está ocupado, edita `server.js`:
```javascript
const PORT = 5502; // Cambiar a otro puerto
```

---

## 📝 Notas Importantes

- ⚠️ Los archivos en `registros/` son la base de datos local
- ⚠️ No eliminar la carpeta `node_modules/`
- ⚠️ Hacer backup regular de `registros/`
- ⚠️ Para producción, migrar a base de datos real (MongoDB, PostgreSQL)

---

## 🤝 Soporte

Para consultas técnicas o reportar problemas:
- 📧 Email: yavoyen5@gmail.com
- 📱 WhatsApp: +54 221 504 7962

---

**¡Gracias por usar YAvoy! 🚀**
