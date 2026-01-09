# 🔔 Sistema de Notificaciones Push - YAvoy

## 📋 Descripción General

Sistema completo de notificaciones push que alerta a usuarios cuando cambia el estado de un pedido. Funciona tanto con el navegador abierto como en background gracias al Service Worker.

---

## ✨ Características

### ✅ Notificaciones Automáticas
- Se envían **automáticamente** al cambiar estado de pedido
- Funcionan **en segundo plano** (incluso con navegador cerrado en dispositivos compatibles)
- **Mensajes personalizados** según el estado del pedido
- **Emojis visuales** para identificación rápida

### 🎯 Estados que Disparan Notificaciones

| Estado | Emoji | Mensaje |
|--------|-------|---------|
| **Pendiente** | ⏳ | "Nuevo pedido creado: [Comercio]" |
| **Aceptado** | ✅ | "Pedido aceptado por [Repartidor]" |
| **En Camino** | 🚴 | "Tu pedido está en camino 🚴" |
| **Entregado** | 📦 | "¡Pedido entregado! Gracias por usar YAvoy" |
| **Cancelado** | ❌ | "Pedido cancelado" |

### 🔧 Configuración de Usuario
- **Toggle ON/OFF** en el header (botón 🔔/🔕)
- Preferencia guardada en `localStorage`
- Solicitud de permiso automática al activar
- Notificación de prueba al habilitar

---

## 🛠️ Implementación Técnica

### 1. Service Worker (`sw.js`)

```javascript
// Event listener para push notifications
self.addEventListener('push', (event) => {
  let data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag || 'yavoy-notification',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Enfocar ventana existente o abrir nueva
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        return clients.openWindow(urlToOpen);
      })
  );
});
```

### 2. Script Principal (`script.js`)

#### Solicitar Permiso
```javascript
async function solicitarPermisoNotificaciones() {
  if (!('Notification' in window)) {
    console.warn('Notificaciones no soportadas');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}
```

#### Mostrar Notificación
```javascript
function mostrarNotificacionPush(titulo, opciones = {}) {
  if (!notificacionesHabilitadas) return;
  
  if (Notification.permission === 'granted') {
    const opcionesPorDefecto = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'yavoy-notification',
      requireInteraction: false,
      ...opciones
    };

    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(titulo, opcionesPorDefecto);
    });
  }
}
```

#### Integración con Estados de Pedidos
```javascript
function actualizarEstadoPedido(pedidoId, nuevoEstado, repartidorInfo) {
  // ... código de validación ...
  
  const config = ESTADO_CONFIG[nuevoEstado];
  
  // Mensajes personalizados por estado
  const mensajes = {
    pendiente: `Nuevo pedido creado: ${pedido.comercioNombre}`,
    aceptado: `Pedido aceptado por ${pedido.repartidorNombre}`,
    en_camino: `Tu pedido está en camino 🚴`,
    entregado: `¡Pedido entregado! Gracias por usar YAvoy`,
    cancelado: `Pedido cancelado`
  };

  // Disparar notificación push
  mostrarNotificacionPush(`${config.emoji} ${config.label}`, {
    body: mensajes[nuevoEstado],
    tag: `pedido-${pedido.id}`,
    data: {
      pedidoId: pedido.id,
      url: '#pedidos'
    },
    actions: [
      { action: 'ver', title: 'Ver Pedido' }
    ]
  });
}
```

### 3. Toggle de Activación (`index.html` + `script.js`)

#### HTML
```html
<button id="toggleNotificaciones" 
        class="btn-notificaciones" 
        aria-label="Activar/Desactivar Notificaciones" 
        title="Notificaciones">
    <span class="icon-bell">🔔</span>
    <span class="icon-bell-off" style="display:none;">🔕</span>
</button>
```

#### JavaScript
```javascript
const btnNotificaciones = document.getElementById('toggleNotificaciones');

btnNotificaciones.addEventListener('click', () => {
  const activar = localStorage.getItem('notificacionesHabilitadas') === 'false';
  toggleNotificaciones(activar);
  
  // Cambiar ícono
  iconBell.style.display = activar ? 'inline' : 'none';
  iconBellOff.style.display = activar ? 'none' : 'inline';
  
  mostrarNotificacion(
    activar ? '🔔 Notificaciones activadas' : '🔕 Notificaciones desactivadas',
    activar ? 'success' : 'info'
  );
});
```

---

## 📱 Uso del Usuario

### Primera Vez

1. **Abrir YAvoy** en el navegador
2. Hacer click en el **botón 🔔** (arriba a la derecha)
3. El navegador pedirá permiso → Click en **"Permitir"**
4. Aparecerá notificación de prueba: *"✅ Las notificaciones están activas"*

### Desactivar Notificaciones

1. Click en el **botón 🔔** (cambiará a 🔕)
2. No se enviarán más notificaciones
3. Preferencia guardada en localStorage

### Volver a Activar

1. Click en el **botón 🔕** (cambiará a 🔔)
2. Si ya dio permiso antes, se activan automáticamente
3. Si no, pedirá permiso nuevamente

---

## 🔍 Estados de Permiso

| Estado | Descripción | Acción |
|--------|-------------|--------|
| **default** | No se ha pedido permiso | Solicitar al activar |
| **granted** | Permiso concedido | Notificaciones funcionan |
| **denied** | Permiso denegado | No se pueden enviar notificaciones |

### Cambiar Permiso Denegado

Si el usuario denegó el permiso, debe cambiarlo desde:

**Chrome/Edge:**
1. Click en el candado 🔒 (barra de dirección)
2. Permisos del sitio
3. Notificaciones → Permitir

**Firefox:**
1. Click en el candado 🔒
2. Permisos → Notificaciones → Permitir

---

## 🎨 Personalización de Notificaciones

### Iconos
- **icon**: `/icons/icon-192x192.png` (grande)
- **badge**: `/icons/icon-72x72.png` (pequeño, solo Android)

### Vibración
```javascript
vibrate: [200, 100, 200] // Patrón: vibrar 200ms, pausa 100ms, vibrar 200ms
```

### Tag (Agrupación)
```javascript
tag: `pedido-${pedidoId}` // Agrupa notificaciones del mismo pedido
```

### Acciones (Botones)
```javascript
actions: [
  { action: 'ver', title: 'Ver Pedido' },
  { action: 'cancelar', title: 'Cancelar' }
]
```

### Interacción Requerida
```javascript
requireInteraction: true // Notificación no se cierra automáticamente
```

---

## 🧪 Testing

### Probar Notificaciones Manualmente

1. Abrir consola del navegador (F12)
2. Ejecutar:

```javascript
// Solicitar permiso
await solicitarPermisoNotificaciones();

// Mostrar notificación de prueba
mostrarNotificacionPush('Prueba YAvoy', {
  body: 'Esta es una notificación de prueba',
  tag: 'test',
  data: { url: '#pedidos' }
});
```

### Probar Cambio de Estado

1. Crear un pedido de prueba
2. Cambiar su estado (Pendiente → Aceptado → En Camino → Entregado)
3. Verificar que aparece notificación en cada cambio

### Probar con Navegador Cerrado

1. Activar notificaciones
2. Crear pedido
3. **Cerrar navegador** (en desktop puede no funcionar, depende del OS)
4. **En móvil**: Cambiar estado desde otro dispositivo
5. Debe aparecer notificación incluso con navegador cerrado

---

## 🌐 Compatibilidad

| Navegador | Desktop | Móvil | Background |
|-----------|---------|-------|------------|
| **Chrome** | ✅ | ✅ | ❌ (desktop) / ✅ (mobile) |
| **Edge** | ✅ | ✅ | ❌ (desktop) / ✅ (mobile) |
| **Firefox** | ✅ | ✅ | ❌ (desktop) / ⚠️ (mobile) |
| **Safari** | ⚠️ | ⚠️ | ❌ |
| **Opera** | ✅ | ✅ | ❌ (desktop) / ✅ (mobile) |

**Leyenda:**
- ✅ Soporte completo
- ⚠️ Soporte parcial/limitado
- ❌ No soportado

### Limitaciones

- **Desktop**: Notificaciones solo con navegador abierto (excepto Chrome con extensión)
- **iOS Safari**: Requiere iOS 16.4+ y añadir a Home Screen
- **Background**: Solo funciona en móvil Android/iOS PWA instaladas

---

## 📊 Datos Guardados

### localStorage
```javascript
{
  "notificacionesHabilitadas": "true" | "false"
}
```

### Notificación Data
```javascript
{
  pedidoId: "PED1701367890123_abcd",
  url: "#pedidos"
}
```

---

## 🐛 Debugging

### Ver estado de permisos
```javascript
console.log('Permiso:', Notification.permission);
console.log('Habilitadas:', localStorage.getItem('notificacionesHabilitadas'));
```

### Ver Service Workers registrados
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});
```

### Logs del Service Worker
1. F12 → Application → Service Workers
2. Click en "inspect" junto al worker activo
3. Ver consola del worker

---

## 🚀 Próximas Mejoras

### Notificaciones Server-Side (Push API)
Actualmente las notificaciones son **locales** (se disparan desde el cliente). Para notificaciones **server-side** verdaderas:

1. Implementar **Web Push Protocol**
2. Usar servicio como **Firebase Cloud Messaging (FCM)**
3. Almacenar subscripciones en backend
4. Enviar notificaciones desde `server.js`

#### Ejemplo con FCM
```javascript
// En script.js
navigator.serviceWorker.ready.then(registration => {
  registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY'
  }).then(subscription => {
    // Enviar subscription al servidor
    fetch('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: { 'Content-Type': 'application/json' }
    });
  });
});
```

### Configuración Avanzada
- Elegir qué estados notificar
- Sonidos personalizados
- Horarios de silencio (No Molestar)
- Notificaciones agrupadas por comercio/repartidor

---

## 📝 Changelog

### v9.0 (30 Nov 2025)
- ✅ Sistema de notificaciones push implementado
- ✅ Toggle de activación/desactivación en header
- ✅ Notificaciones automáticas al cambiar estado
- ✅ Mensajes personalizados por estado
- ✅ Service Worker con event listeners
- ✅ Compatibilidad con PWA instaladas
- ✅ Vibración en dispositivos móviles

---

## 🔗 Referencias

- [Notifications API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)

---

**Versión:** v9  
**Autor:** GitHub Copilot  
**Fecha:** 30 de noviembre de 2025
