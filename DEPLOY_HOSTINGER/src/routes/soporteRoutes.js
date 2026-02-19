/**
 * 🛣️ RUTAS DE SOPORTE - YAVOY
 * 
 * Endpoints para tickets de soporte técnico
 * Gestión de solicitudes de ayuda de usuarios
 */

const express = require('express');
const router = express.Router();
const soporteController = require('../controllers/soporteController');
const { requireAuth, requireCEO } = require('../middleware/auth');

// POST /api/soporte/tickets
// Crear nuevo ticket (cualquier usuario autenticado)
router.post('/tickets', requireAuth, soporteController.crearTicket);

// GET /api/soporte/tickets
// Listar tickets (con filtros)
router.get('/tickets', requireAuth, soporteController.listarTickets);

// GET /api/soporte/tickets/:id
// Obtener ticket específico
router.get('/tickets/:id', requireAuth, soporteController.obtenerTicket);

// PUT /api/soporte/tickets/:id
// Actualizar ticket (cambiar estado, agregar respuesta)
router.put('/tickets/:id', requireAuth, soporteController.actualizarTicket);

// DELETE /api/soporte/tickets/:id
// Eliminar ticket (solo admin/CEO)
router.delete('/tickets/:id', requireCEO, soporteController.eliminarTicket);

// GET /api/soporte/estadisticas
// Obtener estadísticas de soporte
router.get('/estadisticas', requireCEO, soporteController.getEstadisticas);

module.exports = router;
