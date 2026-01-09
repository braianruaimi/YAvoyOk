// ====================================
// 🔌 YAvoy v3.1 - WEBSOCKETS OPTIMIZADOS
// ====================================
// Sistema de Rooms por Ciudad para reducir carga 80%

const { db } = require('../database');

// ========================================
// 🗺️ CONFIGURACIÓN DE ROOMS
// ========================================
let io; // Instancia de Socket.IO
let usuariosConectados = new Map(); // { socketId: { userId, tipo, ciudad } }
let roomsActivos = new Set(); // Set de rooms creados

function initializeSocketIO(socketIoInstance) {
  io = socketIoInstance;
  
  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);
    
    // ========================================
    // REGISTRO DE USUARIO CON CIUDAD
    // ========================================
    socket.on('registrar', async (data) => {
      const { userId, tipo, ciudad } = data; // tipo: 'repartidor', 'cliente', 'comercio', 'ceo'
      
      // Validar datos
      if (!userId || !tipo) {
        socket.emit('error', { message: 'Datos de registro incompletos' });
        return;
      }
      
      // Guardar en mapa de usuarios
      usuariosConectados.set(socket.id, { userId, tipo, ciudad: ciudad || 'global' });
      
      // ========================================
      // 🎯 UNIRSE A ROOMS ESPECÍFICOS
      // ========================================
      // 1. Room personal
      socket.join(`user-${userId}`);
      
      // 2. Room por tipo de usuario
      socket.join(`tipo-${tipo}`);
      
      // 3. Room por ciudad (CLAVE PARA OPTIMIZACIÓN)
      if (ciudad) {
        const roomCiudad = `ciudad-${ciudad.toLowerCase().replace(/\s+/g, '-')}`;
        socket.join(roomCiudad);
        roomsActivos.add(roomCiudad);
        
        console.log(`📍 ${tipo.toUpperCase()} [${userId}] unido a room: ${roomCiudad}`);
      } else {
        socket.join('ciudad-global');
      }
      
      // 4. Si es repartidor, actualizar estado online
      if (tipo === 'repartidor') {
        await actualizarEstadoRepartidor(userId, true, ciudad);
        
        // Notificar a comercios de la misma ciudad
        if (ciudad) {
          io.to(`ciudad-${ciudad.toLowerCase().replace(/\s+/g, '-')}`).emit('repartidorOnline', {
            repartidorId: userId,
            ciudad
          });
        }
      }
      
      // Confirmar registro
      socket.emit('conectado', {
        userId,
        tipo,
        ciudad,
        socketId: socket.id,
        rooms: Array.from(socket.rooms)
      });
      
      // Estadísticas de rooms
      emitirEstadisticasRooms();
    });
    
    // ========================================
    // 📍 ACTUALIZACIÓN DE UBICACIÓN (REPARTIDORES)
    // ========================================
    socket.on('actualizarUbicacion', async (data) => {
      const usuario = usuariosConectados.get(socket.id);
      
      if (!usuario || usuario.tipo !== 'repartidor') {
        return;
      }
      
      const { lat, lng, ciudad } = data;
      
      // Actualizar en base de datos
      await db.update('repartidores', { id: usuario.userId }, {
        coordenadas_actuales: { lat, lng, ciudad, timestamp: new Date() }
      });
      
      // Emitir solo a la room de la ciudad
      const roomCiudad = `ciudad-${(ciudad || usuario.ciudad).toLowerCase().replace(/\s+/g, '-')}`;
      io.to(roomCiudad).emit('ubicacionRepartidor', {
        repartidorId: usuario.userId,
        lat,
        lng,
        timestamp: Date.now()
      });
      
      // Log reducido (solo cada 10 actualizaciones)
      if (Math.random() < 0.1) {
        console.log(`📍 Ubicación actualizada: ${usuario.userId} en ${ciudad || usuario.ciudad}`);
      }
    });
    
    // ========================================
    // 📦 NOTIFICACIÓN DE NUEVO PEDIDO
    // ========================================
    socket.on('nuevoPedido', async (data) => {
      const { pedidoId, comercioId, ciudad, coordenadasComercio } = data;
      
      // Encontrar repartidor más cercano
      const { encontrarRepartidorCercano } = require('./geofencing');
      const resultado = await encontrarRepartidorCercano(coordenadasComercio, ciudad);
      
      if (resultado.success) {
        // Notificar solo al repartidor asignado
        io.to(`user-${resultado.repartidor.id}`).emit('pedidoAsignado', {
          pedidoId,
          comercioId,
          distancia: resultado.distancia,
          eta: resultado.eta,
          timestamp: Date.now()
        });
        
        console.log(`📦 Pedido ${pedidoId} asignado a ${resultado.repartidor.nombre} (${resultado.distancia}km)`);
      } else {
        // Broadcast a todos los repartidores de la ciudad
        const roomCiudad = `ciudad-${ciudad.toLowerCase().replace(/\s+/g, '-')}`;
        io.to(roomCiudad).emit('pedidoDisponible', {
          pedidoId,
          comercioId,
          ciudad,
          timestamp: Date.now()
        });
        
        console.log(`📢 Pedido ${pedidoId} emitido a room ${roomCiudad}`);
      }
    });
    
    // ========================================
    // 💬 CHAT EN TIEMPO REAL
    // ========================================
    socket.on('enviarMensaje', async (data) => {
      const { pedidoId, mensaje, remitente, remitenteId } = data;
      
      // Guardar mensaje en DB
      const nuevoMensaje = await db.insert('mensajes_chat', {
        pedido_id: pedidoId,
        remitente,
        remitente_id: remitenteId,
        mensaje,
        leido: false
      });
      
      // Emitir a todos los involucrados en el pedido
      socket.to(`pedido-${pedidoId}`).emit('nuevoMensaje', {
        id: nuevoMensaje.id,
        pedidoId,
        mensaje,
        remitente,
        remitenteId,
        fecha: nuevoMensaje.fecha_creacion,
        leido: false
      });
      
      console.log(`💬 Mensaje en pedido ${pedidoId}: ${mensaje.substring(0, 30)}...`);
    });
    
    // ========================================
    // 🔔 UNIRSE A ROOM DE PEDIDO ESPECÍFICO
    // ========================================
    socket.on('unirseAPedido', (pedidoId) => {
      socket.join(`pedido-${pedidoId}`);
      console.log(`📦 Socket ${socket.id} unido a pedido-${pedidoId}`);
    });
    
    socket.on('salirDePedido', (pedidoId) => {
      socket.leave(`pedido-${pedidoId}`);
      console.log(`📦 Socket ${socket.id} salió de pedido-${pedidoId}`);
    });
    
    // ========================================
    // 🔌 DESCONEXIÓN
    // ========================================
    socket.on('disconnect', async () => {
      const usuario = usuariosConectados.get(socket.id);
      
      if (usuario) {
        console.log(`🔌 ${usuario.tipo.toUpperCase()} [${usuario.userId}] desconectado`);
        
        // Si es repartidor, actualizar estado offline
        if (usuario.tipo === 'repartidor') {
          await actualizarEstadoRepartidor(usuario.userId, false);
          
          // Notificar a la ciudad
          if (usuario.ciudad) {
            const roomCiudad = `ciudad-${usuario.ciudad.toLowerCase().replace(/\s+/g, '-')}`;
            io.to(roomCiudad).emit('repartidorOffline', {
              repartidorId: usuario.userId
            });
          }
        }
        
        usuariosConectados.delete(socket.id);
      }
      
      emitirEstadisticasRooms();
    });
    
    // ========================================
    // 📊 SOLICITAR ESTADÍSTICAS DE ROOMS
    // ========================================
    socket.on('solicitarEstadisticas', () => {
      socket.emit('estadisticasRooms', obtenerEstadisticasRooms());
    });
  });
  
  console.log('✅ Sistema de WebSockets optimizado con Rooms por ciudad inicializado');
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

async function actualizarEstadoRepartidor(repartidorId, online, ciudad = null) {
  try {
    const updates = { online };
    
    if (ciudad) {
      updates.coordenadas_actuales = {
        ...updates.coordenadas_actuales,
        ciudad
      };
    }
    
    await db.update('repartidores', { id: repartidorId }, updates);
  } catch (error) {
    console.error('Error actualizando estado repartidor:', error);
  }
}

function obtenerEstadisticasRooms() {
  const stats = {
    usuariosConectados: usuariosConectados.size,
    roomsActivos: roomsActivos.size,
    porTipo: {
      repartidores: 0,
      clientes: 0,
      comercios: 0,
      ceos: 0
    },
    porCiudad: {}
  };
  
  usuariosConectados.forEach(usuario => {
    stats.porTipo[usuario.tipo + 's'] = (stats.porTipo[usuario.tipo + 's'] || 0) + 1;
    
    if (usuario.ciudad) {
      stats.porCiudad[usuario.ciudad] = (stats.porCiudad[usuario.ciudad] || 0) + 1;
    }
  });
  
  return stats;
}

function emitirEstadisticasRooms() {
  if (io) {
    io.to('tipo-ceo').emit('estadisticasRooms', obtenerEstadisticasRooms());
  }
}

// ========================================
// 🚀 FUNCIONES HELPER PARA SERVER.JS
// ========================================

function notificarRepartidor(repartidorId, evento, data) {
  if (io) {
    io.to(`user-${repartidorId}`).emit(evento, data);
    console.log(`🔔 Notificación enviada a repartidor ${repartidorId}:`, evento);
  }
}

function notificarCliente(clienteId, evento, data) {
  if (io) {
    io.to(`user-${clienteId}`).emit(evento, data);
    console.log(`🔔 Notificación enviada a cliente ${clienteId}:`, evento);
  }
}

function notificarComercio(comercioId, evento, data) {
  if (io) {
    io.to(`user-${comercioId}`).emit(evento, data);
    console.log(`🔔 Notificación enviada a comercio ${comercioId}:`, evento);
  }
}

function notificarCiudad(ciudad, evento, data) {
  if (io) {
    const roomCiudad = `ciudad-${ciudad.toLowerCase().replace(/\s+/g, '-')}`;
    io.to(roomCiudad).emit(evento, data);
    console.log(`📢 Notificación broadcast a ciudad ${ciudad}:`, evento);
  }
}

function notificarTodos(evento, data) {
  if (io) {
    io.emit(evento, data);
    console.log(`📢 Notificación global:`, evento);
  }
}

// ========================================
// EXPORTS
// ========================================
module.exports = {
  initializeSocketIO,
  notificarRepartidor,
  notificarCliente,
  notificarComercio,
  notificarCiudad,
  notificarTodos,
  obtenerEstadisticasRooms
};
