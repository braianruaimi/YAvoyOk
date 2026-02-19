/**
 * 🛣️ RUTAS DE CHAT - YAVOY
 * 
 * Endpoints para gestión de mensajes en tiempo real
 * Persistencia en JSON + Socket.io
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// GET /api/chat/:pedidoId
// Obtener historial completo de chat
router.get('/:pedidoId', chatController.obtenerHistorial);

// POST /api/chat/:pedidoId/mensaje
// Enviar nuevo mensaje al chat
router.post('/:pedidoId/mensaje', chatController.enviarMensaje);

// PATCH /api/chat/:pedidoId/marcar-leido/:mensajeId
// Marcar mensaje específico como leído
router.patch('/:pedidoId/marcar-leido/:mensajeId', chatController.marcarLeido);

// GET /api/chat/:pedidoId/no-leidos
// Obtener cantidad de mensajes no leídos
router.get('/:pedidoId/no-leidos', chatController.obtenerNoLeidos);

// DELETE /api/chat/:pedidoId
// Eliminar historial completo de chat (admin)
router.delete('/:pedidoId', chatController.eliminarChat);

module.exports = router;
