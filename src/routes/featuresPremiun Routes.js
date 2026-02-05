/**
 * YAvoy v3.1 - Rutas API de Features Premium
 * Endpoints para Calificaciones, Puntos y Propinas
 */

const express = require('express');
const router = express.Router();

// Controllers
const calificacionesController = require('../controllers/calificacionesController');
const puntosRecompensasController = require('../controllers/puntosRecompensasController');
const propinasController = require('../controllers/propinasController');

// Middleware (placeholder - implementar autenticación real)
const { requireAuth } = require('../middleware/auth');

/**
 * ====================================
 * RUTAS CALIFICACIONES (Reviews)
 * ====================================
 */

// POST /api/features/calificaciones - Crear calificación
router.post('/calificaciones', requireAuth, (req, res) => {
  calificacionesController.crearCalificacion(req, res);
});

// GET /api/features/calificaciones/:usuarioId - Obtener calificaciones de un usuario
router.get('/calificaciones/:usuarioId', (req, res) => {
  calificacionesController.obtenerCalificacionesPorUsuario(req, res);
});

// GET /api/features/calificaciones/:usuarioId/resumen - Resumen de rating
router.get('/calificaciones/:usuarioId/resumen', (req, res) => {
  calificacionesController.obtenerResumenRating(req, res);
});

// GET /api/features/calificaciones/:usuarioId/destacadas - Calificaciones más útiles
router.get('/calificaciones/:usuarioId/destacadas', (req, res) => {
  calificacionesController.obtenerCalificacionesDestacadas(req, res);
});

// POST /api/features/calificaciones/:calificacionId/responder - Responder reseña
router.post('/calificaciones/:calificacionId/responder', requireAuth, (req, res) => {
  calificacionesController.responderCalificacion(req, res);
});

// POST /api/features/calificaciones/:calificacionId/util - Marcar como útil
router.post('/calificaciones/:calificacionId/util', (req, res) => {
  calificacionesController.marcarUtil(req, res);
});

/**
 * ====================================
 * RUTAS PUNTOS Y RECOMPENSAS
 * ====================================
 */

// GET /api/features/puntos/saldo - Obtener saldo de puntos
router.get('/puntos/saldo', requireAuth, (req, res) => {
  puntosRecompensasController.obtenerSaldo(req, res);
});

// POST /api/features/puntos/agregar - Agregar puntos (admin/sistema)
router.post('/puntos/agregar', requireAuth, (req, res) => {
  puntosRecompensasController.agregarPuntos(req, res);
});

// GET /api/features/puntos/recompensas - Obtener recompensas disponibles
router.get('/puntos/recompensas', requireAuth, (req, res) => {
  puntosRecompensasController.obtenerRecompensas(req, res);
});

// POST /api/features/puntos/canjear - Canjear recompensa
router.post('/puntos/canjear', requireAuth, (req, res) => {
  puntosRecompensasController.canjeRecompensa(req, res);
});

// GET /api/features/puntos/historial - Historial de movimientos
router.get('/puntos/historial', requireAuth, (req, res) => {
  puntosRecompensasController.obtenerHistorial(req, res);
});

/**
 * ====================================
 * RUTAS PROPINAS DIGITALES
 * ====================================
 */

// POST /api/features/propinas/ofrecer - Cliente ofrece propina
router.post('/propinas/ofrecer', requireAuth, (req, res) => {
  propinasController.ofrecerPropina(req, res);
});

// POST /api/features/propinas/:propinaId/responder - Repartidor responde propina
router.post('/propinas/:propinaId/responder', requireAuth, (req, res) => {
  propinasController.responderPropina(req, res);
});

// GET /api/features/propinas/mis-propinas - Mis propinas como repartidor
router.get('/propinas/mis-propinas', requireAuth, (req, res) => {
  propinasController.obtenerPropinasPorRepartidor(req, res);
});

// GET /api/features/propinas/estadisticas - Estadísticas de propinas
router.get('/propinas/estadisticas', requireAuth, (req, res) => {
  propinasController.obtenerEstadisticas(req, res);
});

// GET /api/features/propinas/ranking - Ranking de repartidores
router.get('/propinas/ranking', (req, res) => {
  propinasController.obtenerRanking(req, res);
});

module.exports = router;
