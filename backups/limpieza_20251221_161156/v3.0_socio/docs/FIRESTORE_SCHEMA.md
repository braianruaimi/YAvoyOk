# 📊 Esquema de Firestore - YAvoy

## Colección: `pedidos`

```javascript
{
  id: "pedido_123456",
  clienteId: "user_abc",
  comercioId: "comercio_xyz",
  repartidorId: null, // null hasta que sea asignado, luego "repartidor_def"
  estado: "Pendiente", // "Pendiente" | "Aceptado" | "EnCamino" | "Entregado" | "Cancelado"
  
  // Información del pedido
  items: [
    {
      nombre: "Pizza Napolitana",
      cantidad: 2,
      precio: 15.99
    }
  ],
  total: 31.98,
  
  // Ubicaciones
  ubicacionOrigen: {
    lat: -34.6037,
    lng: -58.3816,
    direccion: "Av. Corrientes 1234, CABA"
  },
  ubicacionDestino: {
    lat: -34.6118,
    lng: -58.3925,
    direccion: "Av. Santa Fe 5678, CABA"
  },
  ubicacionRepartidor: {
    lat: -34.6050, // Se actualiza en tiempo real cada 5-10 segundos
    lng: -34.3850,
    timestamp: Timestamp
  },
  
  // Metadatos
  createdAt: Timestamp,
  updatedAt: Timestamp,
  horaEstimadaEntrega: Timestamp,
  
  // Historial de estados
  historialEstados: [
    {
      estado: "Pendiente",
      timestamp: Timestamp,
      nota: "Pedido creado"
    },
    {
      estado: "Aceptado",
      timestamp: Timestamp,
      repartidorId: "repartidor_def",
      nota: "Asignado a Juan Pérez"
    }
  ]
}
```

## Colección: `notificaciones` (opcional, para historial)

```javascript
{
  id: "notif_789",
  pedidoId: "pedido_123456",
  clienteId: "user_abc",
  tipo: "PEDIDO_ACEPTADO", // "PEDIDO_ACEPTADO" | "REPARTIDOR_CERCA" | "ENTREGA_EXITOSA"
  mensaje: "¡Tu pedido ha sido aceptado por un repartidor!",
  leida: false,
  createdAt: Timestamp,
  metadata: {
    repartidorId: "repartidor_def",
    nombreRepartidor: "Juan Pérez"
  }
}
```

## Índices Recomendados

```javascript
// Firestore Indexes
pedidos:
  - clienteId + estado (ASC/DESC)
  - repartidorId + estado (ASC/DESC)
  - createdAt (DESC)

notificaciones:
  - clienteId + leida + createdAt (DESC)
```
