# 🔔 Sistema de Notificaciones Persistentes - YAvoy

## 📋 Descripción General

Sistema completo de notificaciones en tiempo real para clientes usando **Firestore**, **React** y **Tailwind CSS**. Monitorea cambios en pedidos activos y alerta al usuario mediante notificaciones visuales y sonoras.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTE (React)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  useNotifications Hook                                │   │
│  │  • Escucha cambios en Firestore                       │   │
│  │  • Detecta estados: Aceptado, Cerca, Entregado       │   │
│  │  • Calcula distancias en tiempo real                 │   │
│  │  • Emite notificaciones                              │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐   │
│  │  NotificationCenter Component                         │   │
│  │  • Renderiza toasts animados                          │   │
│  │  • Auto-dismiss después de 8s                        │   │
│  │  • Sonido + notificaciones del navegador            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ onSnapshot (tiempo real)
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    FIRESTORE (Backend)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Colección: pedidos                                   │   │
│  │  • clienteId, repartidorId, estado                   │   │
│  │  • ubicacionOrigen, ubicacionDestino                 │   │
│  │  • ubicacionRepartidor (actualización cada 5s)       │   │
│  │  • historialEstados                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Colección: notificaciones (opcional)                │   │
│  │  • Historial persistente                             │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementación

### 1️⃣ Configuración de Firestore

```javascript
// firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### 2️⃣ Uso del Hook

```jsx
// pages/MisPedidos.jsx
import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCenter from '../components/NotificationCenter';

const MisPedidos = () => {
  const user = { uid: 'user_abc' }; // Desde tu auth context
  const { pedidosActivos } = useNotifications(user.uid);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Mis Pedidos Activos</h1>
      
      {/* Lista de pedidos */}
      {pedidosActivos.map(pedido => (
        <PedidoCard key={pedido.id} pedido={pedido} />
      ))}

      {/* Centro de notificaciones */}
      <NotificationCenter />
    </div>
  );
};
```

### 3️⃣ Crear Pedido con Datos Completos

```javascript
// services/pedidoService.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const crearPedido = async (datosPedido) => {
  const nuevoPedido = {
    clienteId: datosPedido.clienteId,
    comercioId: datosPedido.comercioId,
    repartidorId: null, // Se asigna después
    estado: 'Pendiente',
    
    items: datosPedido.items,
    total: datosPedido.total,
    
    ubicacionOrigen: {
      lat: -34.6037,
      lng: -58.3816,
      direccion: datosPedido.direccionComercio
    },
    ubicacionDestino: {
      lat: datosPedido.latCliente,
      lng: datosPedido.lngCliente,
      direccion: datosPedido.direccionCliente
    },
    ubicacionRepartidor: null,
    
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    horaEstimadaEntrega: new Date(Date.now() + 30 * 60000), // +30min
    
    historialEstados: [{
      estado: 'Pendiente',
      timestamp: new Date(),
      nota: 'Pedido creado'
    }]
  };

  const docRef = await addDoc(collection(db, 'pedidos'), nuevoPedido);
  return docRef.id;
};
```

### 4️⃣ Asignar Repartidor (Backend/Cloud Function)

```javascript
// functions/asignarRepartidor.js
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';

export const asignarRepartidor = async (pedidoId, repartidorId) => {
  const pedidoRef = doc(db, 'pedidos', pedidoId);
  
  await updateDoc(pedidoRef, {
    repartidorId: repartidorId,
    estado: 'Aceptado',
    updatedAt: serverTimestamp(),
    historialEstados: arrayUnion({
      estado: 'Aceptado',
      timestamp: new Date(),
      repartidorId: repartidorId,
      nota: 'Pedido aceptado por repartidor'
    })
  });
};
```

### 5️⃣ Iniciar Simulación de Repartidor

```javascript
// En el panel de administración o backend
import { iniciarSimulacion } from '../utils/simuladorRepartidor';

// Al asignar repartidor, iniciar simulación
const pedido = await obtenerPedido(pedidoId);
const simulador = iniciarSimulacion(pedido);

// Para testing rápido (2x velocidad)
simulador.acelerar(2);

// Detener manualmente si es necesario
// simulador.detener();
```

---

## 🎯 Tipos de Notificaciones

| Tipo | Trigger | Mensaje | Icono | Color |
|------|---------|---------|-------|-------|
| **PEDIDO_ACEPTADO** | `repartidorId`: null → ID | "¡Tu pedido ha sido aceptado!" | ✅ | Verde |
| **REPARTIDOR_CERCA** | Distancia < 500m | "¡Tu repartidor está cerca!" | 🏍️ | Amarillo |
| **ENTREGA_EXITOSA** | `estado`: → "Entregado" | "¡Pedido entregado con éxito!" | 📦 | Verde |
| **ESTADO_ACTUALIZADO** | `estado`: → "EnCamino" | "Tu pedido está en camino" | 🛵 | Azul |

---

## 📊 Reglas de Seguridad Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Pedidos: Solo el cliente puede leer sus propios pedidos
    match /pedidos/{pedidoId} {
      allow read: if request.auth != null && 
                     resource.data.clienteId == request.auth.uid;
      
      allow create: if request.auth != null &&
                       request.resource.data.clienteId == request.auth.uid;
      
      // Solo backend puede actualizar (Cloud Functions)
      allow update: if request.auth.token.admin == true;
    }
    
    // Notificaciones (opcional)
    match /notificaciones/{notifId} {
      allow read: if request.auth != null &&
                     resource.data.clienteId == request.auth.uid;
      allow write: if false; // Solo backend
    }
  }
}
```

---

## 🧪 Testing

### Escenario 1: Pedido Aceptado
```javascript
// 1. Crear pedido
const pedidoId = await crearPedido({...});

// 2. Esperar 3 segundos
setTimeout(async () => {
  // 3. Asignar repartidor
  await asignarRepartidor(pedidoId, 'repartidor_123');
  
  // ✅ Debería aparecer notificación "Pedido Aceptado"
}, 3000);
```

### Escenario 2: Repartidor Cerca
```javascript
// 1. Asignar repartidor + iniciar simulación
await asignarRepartidor(pedidoId, 'repartidor_123');
const simulador = iniciarSimulacion(pedido);

// 2. Acelerar simulación para testing
simulador.acelerar(10); // 10x más rápido

// ✅ En ~20-30 segundos debería aparecer "Repartidor Cerca"
```

### Escenario 3: Entrega Exitosa
```javascript
// La simulación marca automáticamente como entregado
// al llegar al destino (después de 50 pasos)

// ✅ Debería aparecer notificación "Entrega Exitosa"
```

---

## 🎨 Personalización

### Cambiar Tiempo de Auto-Dismiss
```jsx
// En NotificationCenter.jsx, línea 22
setTimeout(() => {
  clearNotification(notif.pedidoId, notif.tipo);
}, 12000); // Cambiar a 12 segundos
```

### Ajustar Umbral de Distancia
```javascript
// En useNotifications.js, línea 94
if (distancia < 800 && (!distanciaPrevia || distanciaPrevia >= 800)) {
  // Cambiar de 500m a 800m
```

### Cambiar Velocidad de Simulación
```javascript
// En simuladorRepartidor.js, línea 68
this.intervalo = setInterval(() => {
  this.actualizarUbicacion();
}, 3000); // Cambiar de 5s a 3s (más rápido)
```

---

## 📦 Dependencias Requeridas

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "firebase": "^10.7.0",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## 🔧 Troubleshooting

### ❌ No aparecen notificaciones
1. Verificar que el usuario esté autenticado (`clienteId` válido)
2. Comprobar que existan pedidos con estado en `['Pendiente', 'Aceptado', 'EnCamino']`
3. Revisar console.log para errores de Firestore
4. Verificar reglas de seguridad de Firestore

### ❌ Notificaciones duplicadas
- El hook usa `estadosPrevios` para evitar duplicados
- Verificar que el `pedidoId` + `tipo` sean únicos
- Asegurarse de que no haya múltiples instancias del hook

### ❌ Simulador no actualiza ubicación
- Verificar permisos de escritura en Firestore
- Comprobar que `ubicacionOrigen` y `ubicacionDestino` existan
- Revisar console para errores de `updateDoc`

---

## 📚 Próximas Mejoras

- [ ] Persistir historial de notificaciones en Firestore
- [ ] Agregar notificaciones push con Firebase Cloud Messaging
- [ ] Panel de configuración para activar/desactivar tipos de notificaciones
- [ ] Integración con mapas (Google Maps / Mapbox) para tracking visual
- [ ] Soporte para múltiples idiomas (i18n)
- [ ] Modo offline con cache de notificaciones

---

## 🤝 Contribución

Este sistema es parte del proyecto **YAvoy**. Para mejoras o bugs, contactar al equipo de desarrollo.

---

**Última actualización:** 29 de noviembre de 2025
