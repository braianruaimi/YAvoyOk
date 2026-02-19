/**
 * 🛣️ RUTAS DE ANALYTICS - YAVOY
 * 
 * Endpoints para métricas y visualización de datos
 * Dashboard del CEO con estadísticas en tiempo real
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { requireCEO } = require('../middleware/auth');

// Todas las rutas de analytics requieren autenticación CEO
router.use(requireCEO);

// GET /api/analytics/dashboard
// Dashboard general con todas las métricas
router.get('/dashboard', analyticsController.getDashboard);

// GET /api/analytics/pedidos
// Estadísticas detalladas de pedidos (con filtros de fecha)
router.get('/pedidos', analyticsController.getEstadisticasPedidos);

// GET /api/analytics/repartidores
// Estadísticas detalladas de repartidores (rankings, finanzas)
router.get('/repartidores', analyticsController.getEstadisticasRepartidores);

// GET /api/analytics/finanzas
// Reporte financiero consolidado (ingresos, comisiones, transferencias)
router.get('/finanzas', analyticsController.getReporteFinanzas);

module.exports = router;
