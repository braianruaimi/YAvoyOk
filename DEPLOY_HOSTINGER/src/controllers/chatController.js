/**
 * ====================================
 * 💬 CHAT CONTROLLER - YAVOY
 * ====================================
 * 
 * Controlador para gestión de mensajes de chat
 * Persistencia en archivo JSON + MySQL (futuro)
 * 
 * @author YAvoy Team
 * @version 3.0
 */

const path = require('path');
const fs = require('fs').promises;

const BASE_DIR = path.join(__dirname, '..', '..', 'registros');

// Almacenamiento en memoria (caché)
let chats = {};

/**
 * Cargar historial de chat desde archivo
 */
async function cargarChat(pedidoId) {
  try {
    const chatPath = path.join(BASE_DIR, 'chats', `${pedidoId}.json`);
    const data = await fs.readFile(chatPath, 'utf-8');
    const mensajes = JSON.parse(data);
    chats[pedidoId] = mensajes;
    return mensajes;
  } catch (error) {
    // Si no existe el archivo, devolver array vacío
    return [];
  }
}

/**
 * Guardar chat en archivo JSON
 */
async function guardarChat(pedidoId, mensajes) {
  try {
    const chatDir = path.join(BASE_DIR, 'chats');
    await fs.mkdir(chatDir, { recursive: true });
    
    const chatPath = path.join(chatDir, `${pedidoId}.json`);
    await fs.writeFile(chatPath, JSON.stringify(mensajes, null, 2));
    
    return true;
  } catch (error) {
    console.error(`Error guardando chat ${pedidoId}:`, error);
    return false;
  }
}

/**
 * GET /api/chat/:pedidoId
 * Obtener historial completo de chat de un pedido
 */
async function obtenerHistorial(req, res) {
  const { pedidoId } = req.params;
  
  try {
    // Intentar cargar desde archivo
    let mensajes = await cargarChat(pedidoId);
    
    // Si no hay en archivo, intentar desde memoria
    if (mensajes.length === 0 && chats[pedidoId]) {
      mensajes = chats[pedidoId];
    }
    
    res.json({
      success: true,
      pedidoId,
      mensajes,
      total: mensajes.length
    });
    
  } catch (error) {
    console.error('Error al obtener chat:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial de chat'
    });
  }
}

/**
 * POST /api/chat/:pedidoId/mensaje
 * Enviar mensaje al chat (también disponible vía Socket.IO)
 */
async function enviarMensaje(req, res) {
  const { pedidoId } = req.params;
  const { mensaje, remitente, remitenteId } = req.body;
  
  try {
    // Validaciones
    if (!mensaje || !remitente || !remitenteId) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: mensaje, remitente, remitenteId'
      });
    }
    
    // Inicializar chat si no existe
    if (!chats[pedidoId]) {
      chats[pedidoId] = await cargarChat(pedidoId);
    }
    
    // Crear nuevo mensaje
    const nuevoMensaje = {
      id: `MSG-${Date.now()}`,
      pedidoId,
      mensaje,
      remitente, // 'cliente', 'repartidor', 'comercio', 'ceo'
      remitenteId,
      fecha: new Date().toISOString(),
      leido: false
    };
    
    // Agregar a array en memoria
    chats[pedidoId].push(nuevoMensaje);
    
    // Guardar en archivo
    await guardarChat(pedidoId, chats[pedidoId]);
    
    // Emitir por Socket.IO (si está disponible)
    const socketService = require('../services/socketService');
    socketService.notificarPedido(pedidoId, 'nuevoMensaje', nuevoMensaje);
    
    res.json({
      success: true,
      mensaje: nuevoMensaje
    });
    
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar mensaje'
    });
  }
}

/**
 * PATCH /api/chat/:pedidoId/marcar-leido/:mensajeId
 * Marcar mensaje como leído
 */
async function marcarLeido(req, res) {
  const { pedidoId, mensajeId } = req.params;
  
  try {
    // Cargar chat si no está en memoria
    if (!chats[pedidoId]) {
      chats[pedidoId] = await cargarChat(pedidoId);
    }
    
    // Buscar mensaje
    const mensaje = chats[pedidoId].find(m => m.id === mensajeId);
    
    if (!mensaje) {
      return res.status(404).json({
        success: false,
        error: 'Mensaje no encontrado'
      });
    }
    
    // Marcar como leído
    mensaje.leido = true;
    
    // Guardar cambios
    await guardarChat(pedidoId, chats[pedidoId]);
    
    res.json({
      success: true,
      mensaje
    });
    
  } catch (error) {
    console.error('Error al marcar mensaje como leído:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar mensaje como leído'
    });
  }
}

/**
 * DELETE /api/chat/:pedidoId
 * Eliminar historial completo de chat (admin)
 */
async function eliminarChat(req, res) {
  const { pedidoId } = req.params;
  
  try {
    // Eliminar de memoria
    delete chats[pedidoId];
    
    // Eliminar archivo
    const chatPath = path.join(BASE_DIR, 'chats', `${pedidoId}.json`);
    try {
      await fs.unlink(chatPath);
    } catch (error) {
      // Archivo no existe, ignorar
    }
    
    res.json({
      success: true,
      message: `Chat del pedido ${pedidoId} eliminado`
    });
    
  } catch (error) {
    console.error('Error al eliminar chat:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar chat'
    });
  }
}

/**
 * GET /api/chat/:pedidoId/no-leidos
 * Obtener cantidad de mensajes no leídos
 */
async function obtenerNoLeidos(req, res) {
  const { pedidoId } = req.params;
  const { remitenteId } = req.query; // Filtrar por remitente
  
  try {
    // Cargar chat
    let mensajes = await cargarChat(pedidoId);
    
    if (mensajes.length === 0 && chats[pedidoId]) {
      mensajes = chats[pedidoId];
    }
    
    // Filtrar mensajes no leídos
    let noLeidos = mensajes.filter(m => !m.leido);
    
    // Si se especifica remitenteId, filtrar solo mensajes de otros
    if (remitenteId) {
      noLeidos = noLeidos.filter(m => m.remitenteId !== remitenteId);
    }
    
    res.json({
      success: true,
      pedidoId,
      noLeidos: noLeidos.length,
      mensajes: noLeidos
    });
    
  } catch (error) {
    console.error('Error al obtener mensajes no leídos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener mensajes no leídos'
    });
  }
}

module.exports = {
  obtenerHistorial,
  enviarMensaje,
  marcarLeido,
  eliminarChat,
  obtenerNoLeidos,
  cargarChat,
  guardarChat
};
