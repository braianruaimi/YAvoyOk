// ========================================
// SOCKET SERVICE - YAvoy v3.1
// ========================================
// Servicio de Socket.IO para notificaciones en tiempo real
// Exportable para uso en controladores de pedidos y otros módulos

const fs = require('fs').promises;
const path = require('path');
const locationService = require('./locationService');
const pool = require('../config/database');

// Variables globales compartidas
let io = null;
const BASE_DIR = path.join(__dirname, '../../registros');
const usuariosConectados = new Map();
const chats = {};

/**
 * Inicializar Socket.IO con el servidor HTTP
 * @param {Server} server - Servidor HTTP de Express
 * @param {SocketIO} ioInstance - Instancia de Socket.IO
 * @returns {Object} - API pública del servicio
 */
function initSocket(server, ioInstance) {
  io = ioInstance;
  
  console.log('🔌 Inicializando Socket.IO Service...');

  // ====================================
  // MANEJO DE CONEXIONES
  // ====================================
  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);

    // ====================================
    // REGISTRAR USUARIO CONECTADO
    // ====================================
    socket.on('registrar', (data) => {
      const { userId, tipo } = data; // tipo: 'repartidor', 'cliente', 'ceo', 'comercio'
      usuariosConectados.set(socket.id, { userId, tipo });
      
      // Unirse a sala específica
      socket.join(`${tipo}-${userId}`);
      socket.join(tipo); // Sala general por tipo
      
      console.log(`✅ ${tipo.toUpperCase()} registrado:`, userId);
      
      // Notificar conexión
      socket.emit('conectado', { userId, tipo, socketId: socket.id });
    });

    // ====================================
    // CHAT EN TIEMPO REAL
    // ====================================
    socket.on('enviarMensaje', async (data) => {
      const { pedidoId, mensaje, remitente, remitenteId } = data;
      
      if (!chats[pedidoId]) {
        chats[pedidoId] = [];
      }
      
      const nuevoMensaje = {
        id: `MSG-${Date.now()}`,
        pedidoId,
        mensaje,
        remitente, // 'cliente', 'repartidor', 'ceo'
        remitenteId,
        fecha: new Date().toISOString(),
        leido: false
      };
      
      chats[pedidoId].push(nuevoMensaje);
      
      // Guardar en archivo
      try {
        const chatPath = path.join(BASE_DIR, 'chats', `${pedidoId}.json`);
        await fs.writeFile(chatPath, JSON.stringify(chats[pedidoId], null, 2));
      } catch (error) {
        console.error('Error guardando chat:', error);
      }
      
      // Emitir a todos en la sala del pedido
      io.to(`pedido-${pedidoId}`).emit('nuevoMensaje', nuevoMensaje);
      
      console.log(`💬 Mensaje en pedido ${pedidoId}:`, mensaje.substring(0, 50));
    });

    // ====================================
    // UNIRSE A SALA DE PEDIDO
    // ====================================
    socket.on('unirseAPedido', (pedidoId) => {
      socket.join(`pedido-${pedidoId}`);
      console.log(`📦 Socket ${socket.id} unido a pedido-${pedidoId}`);
    });

    // ====================================
    // MARCAR MENSAJES COMO LEÍDOS
    // ====================================
    socket.on('marcarLeido', async (data) => {
      const { pedidoId, mensajeId } = data;
      
      if (chats[pedidoId]) {
        const mensaje = chats[pedidoId].find(m => m.id === mensajeId);
        if (mensaje) {
          mensaje.leido = true;
          
          try {
            const chatPath = path.join(BASE_DIR, 'chats', `${pedidoId}.json`);
            await fs.writeFile(chatPath, JSON.stringify(chats[pedidoId], null, 2));
          } catch (error) {
            console.error('Error guardando estado leído:', error);
          }
        }
      }
    });

    // ====================================
    // GEOLOCALIZACIÓN - REPARTIDOR (Modo Pasivo)
    // ====================================
    socket.on('actualizarUbicacion', async (data) => {
      const { lat, lng, pedidoId } = data;
      const usuario = usuariosConectados.get(socket.id);
      
      if (!usuario || usuario.tipo !== 'repartidor') {
        socket.emit('error', { mensaje: 'Solo repartidores pueden enviar ubicación' });
        return;
      }
      
      try {
        // Guardar en base de datos
        const resultado = await locationService.guardarUbicacion(
          usuario.userId,
          parseFloat(lat),
          parseFloat(lng),
          pedidoId
        );
        
        // Si hay pedido activo, notificar a los interesados
        if (pedidoId) {
          // Obtener datos del pedido
          const [pedidos] = await pool.query(`
            SELECT 
              cliente_id,
              comercio_id,
              direccion_entrega_lat,
              direccion_entrega_lng,
              estado
            FROM orders
            WHERE id = ?
          `, [pedidoId]);
          
          if (pedidos.length > 0) {
            const pedido = pedidos[0];
            
            // Enviar ubicación al cliente
            io.to(`cliente-${pedido.cliente_id}`).emit('ubicacionRepartidor', {
              pedidoId,
              repartidorId: usuario.userId,
              lat,
              lng,
              zona: resultado.zona,
              timestamp: resultado.timestamp
            });
            
            // Enviar al comercio
            io.to(`comercio-${pedido.comercio_id}`).emit('ubicacionRepartidor', {
              pedidoId,
              repartidorId: usuario.userId,
              lat,
              lng,
              zona: resultado.zona,
              timestamp: resultado.timestamp
            });
            
            // Verificar proximidad al destino (< 500m)
            if (pedido.direccion_entrega_lat && pedido.direccion_entrega_lng) {
              const proximidad = await locationService.verificarProximidad(
                usuario.userId,
                parseFloat(pedido.direccion_entrega_lat),
                parseFloat(pedido.direccion_entrega_lng)
              );
              
              if (proximidad.cerca) {
                // Notificar al cliente que el repartidor está cerca
                io.to(`cliente-${pedido.cliente_id}`).emit('order-nearby', {
                  pedidoId,
                  distancia: proximidad.distancia,
                  eta: proximidad.eta,
                  mensaje: proximidad.mensaje
                });
                
                console.log(`🎯 Repartidor cercano - Pedido ${pedidoId}: ${proximidad.distancia}m`);
              }
            }
          }
        }
        
        // Confirmar al repartidor
        socket.emit('ubicacionActualizada', {
          success: true,
          zona: resultado.zona,
          enZona: resultado.enZona
        });
        
      } catch (error) {
        console.error('Error actualizando ubicación:', error);
        socket.emit('error', { mensaje: 'Error al actualizar ubicación' });
      }
    });

    // ====================================
    // SOLICITAR UBICACIÓN DE REPARTIDOR
    // ====================================
    socket.on('solicitarUbicacion', async (data) => {
      const { repartidorId } = data;
      const usuario = usuariosConectados.get(socket.id);
      
      if (!usuario) {
        socket.emit('error', { mensaje: 'Usuario no registrado' });
        return;
      }
      
      try {
        // Verificar permisos
        if (usuario.tipo === 'cliente') {
          // El cliente solo puede ver la ubicación de su repartidor asignado
          const [pedidos] = await pool.query(`
            SELECT id FROM orders
            WHERE cliente_id = ?
            AND repartidor_id = ?
            AND estado IN ('aceptado', 'en_camino', 'recogido')
            LIMIT 1
          `, [usuario.userId, repartidorId]);
          
          if (pedidos.length === 0) {
            socket.emit('error', { mensaje: 'No tienes un pedido activo con este repartidor' });
            return;
          }
        }
        
        // Obtener ubicación
        const ubicacion = await locationService.obtenerUbicacion(repartidorId);
        
        if (!ubicacion) {
          socket.emit('ubicacionNoDisponible', { 
            repartidorId,
            mensaje: 'Ubicación no disponible' 
          });
          return;
        }
        
        socket.emit('ubicacionRecibida', {
          repartidorId,
          ...ubicacion
        });
        
      } catch (error) {
        console.error('Error solicitando ubicación:', error);
        socket.emit('error', { mensaje: 'Error al obtener ubicación' });
      }
    });

    // ====================================
    // SUSCRIBIRSE A ACTUALIZACIONES DE MAPA
    // ====================================
    socket.on('suscribirMapa', (data) => {
      const { tipo } = data; // 'comercio' o 'ceo'
      const usuario = usuariosConectados.get(socket.id);
      
      if (!usuario || !['comercio', 'ceo'].includes(usuario.tipo)) {
        socket.emit('error', { mensaje: 'No autorizado para suscribirse al mapa' });
        return;
      }
      
      socket.join('mapa-general');
      console.log(`🗺️ ${usuario.tipo.toUpperCase()} ${usuario.userId} suscrito al mapa`);
    });

    // ====================================
    // DESCONEXIÓN
    // ====================================
    socket.on('disconnect', () => {
      const usuario = usuariosConectados.get(socket.id);
      if (usuario) {
        console.log(`🔌 ${usuario.tipo.toUpperCase()} desconectado:`, usuario.userId);
        usuariosConectados.delete(socket.id);
      } else {
        console.log('🔌 Cliente desconectado:', socket.id);
      }
    });
  });

  console.log('✅ Socket.IO Service inicializado correctamente');

  // Retornar API pública
  return {
    notificarRepartidor,
    notificarCEO,
    notificarCliente,
    notificarComercio,
    notificarTodos,
    notificarPedido,
    getUsuariosConectados,
    getChats,
    io // Exportar instancia para casos avanzados
  };
}

// ====================================
// FUNCIONES PÚBLICAS DE NOTIFICACIÓN
// ====================================

/**
 * Notificar a un repartidor específico
 * @param {string} repartidorId - ID del repartidor
 * @param {string} evento - Nombre del evento
 * @param {object} data - Datos a enviar
 */
function notificarRepartidor(repartidorId, evento, data) {
  if (!io) {
    console.warn('⚠️ Socket.IO no inicializado. No se puede enviar notificación.');
    return false;
  }
  io.to(`repartidor-${repartidorId}`).emit(evento, data);
  console.log(`🔔 Notificación enviada a repartidor ${repartidorId}:`, evento);
  return true;
}

/**
 * Notificar al CEO
 * @param {string} evento - Nombre del evento
 * @param {object} data - Datos a enviar
 */
function notificarCEO(evento, data) {
  if (!io) {
    console.warn('⚠️ Socket.IO no inicializado. No se puede enviar notificación.');
    return false;
  }
  io.to('ceo').emit(evento, data);
  console.log(`🔔 Notificación enviada al CEO:`, evento);
  return true;
}

/**
 * Notificar a un cliente específico
 * @param {string} clienteId - ID del cliente
 * @param {string} evento - Nombre del evento
 * @param {object} data - Datos a enviar
 */
function notificarCliente(clienteId, evento, data) {
  if (!io) {
    console.warn('⚠️ Socket.IO no inicializado. No se puede enviar notificación.');
    return false;
  }
  io.to(`cliente-${clienteId}`).emit(evento, data);
  console.log(`🔔 Notificación enviada a cliente ${clienteId}:`, evento);
  return true;
}

/**
 * Notificar a un comercio específico
 * @param {string} comercioId - ID del comercio
 * @param {string} evento - Nombre del evento
 * @param {object} data - Datos a enviar
 */
function notificarComercio(comercioId, evento, data) {
  if (!io) {
    console.warn('⚠️ Socket.IO no inicializado. No se puede enviar notificación.');
    return false;
  }
  io.to(`comercio-${comercioId}`).emit(evento, data);
  console.log(`🔔 Notificación enviada a comercio ${comercioId}:`, evento);
  return true;
}

/**
 * Notificar a todos los usuarios de un pedido específico
 * @param {string} pedidoId - ID del pedido
 * @param {string} evento - Nombre del evento
 * @param {object} data - Datos a enviar
 */
function notificarPedido(pedidoId, evento, data) {
  if (!io) {
    console.warn('⚠️ Socket.IO no inicializado. No se puede enviar notificación.');
    return false;
  }
  io.to(`pedido-${pedidoId}`).emit(evento, data);
  console.log(`🔔 Notificación enviada a pedido ${pedidoId}:`, evento);
  return true;
}

/**
 * Notificar a todos los usuarios conectados (broadcast)
 * @param {string} evento - Nombre del evento
 * @param {object} data - Datos a enviar
 */
function notificarTodos(evento, data) {
  if (!io) {
    console.warn('⚠️ Socket.IO no inicializado. No se puede enviar notificación.');
    return false;
  }
  io.emit(evento, data);
  console.log(`🔔 Notificación broadcast:`, evento);
  return true;
}

/**
 * Obtener usuarios conectados actualmente
 * @returns {Map} - Mapa de usuarios conectados
 */
function getUsuariosConectados() {
  return usuariosConectados;
}

/**
 * Obtener historial de chats
 * @returns {object} - Objeto con todos los chats
 */
function getChats() {
  return chats;
}

/**
 * Cargar chat de un pedido desde archivo
 * @param {string} pedidoId - ID del pedido
 * @returns {Promise<Array>} - Mensajes del chat
 */
async function cargarChat(pedidoId) {
  try {
    const chatPath = path.join(BASE_DIR, 'chats', `${pedidoId}.json`);
    const contenido = await fs.readFile(chatPath, 'utf-8');
    const mensajes = JSON.parse(contenido);
    chats[pedidoId] = mensajes;
    return mensajes;
  } catch (error) {
    // Si no existe el archivo, devolver array vacío
    return [];
  }
}

// ====================================
// EXPORTAR MÓDULO
// ====================================

module.exports = {
  initSocket,
  notificarRepartidor,
  notificarCEO,
  notificarCliente,
  notificarComercio,
  notificarPedido,
  notificarTodos,
  getUsuariosConectados,
  getChats,
  cargarChat
};
