// ========================================
// RUTAS DE REPARTIDORES - YAvoy v3.1
// ========================================
// Mapeo de endpoints REST al controlador de repartidores

const express = require('express');
const router = express.Router();

// Importar controlador
const repartidoresController = require('../controllers/repartidoresController');

// Importar middlewares de autenticación
const { requireAuth, requireRole, requireCEO } = require('../middleware/auth');

// ============================================
// ENDPOINTS PÚBLICOS (Sin autenticación)
// ============================================

/**
 * Registrar nuevo repartidor
 * POST /api/repartidores
 * Registro abierto para nuevos repartidores
 */
router.post('/repartidores', repartidoresController.registrarRepartidor);

/**
 * Listar repartidores disponibles
 * GET /api/repartidores
 * Acceso público para ver repartidores disponibles
 */
router.get('/repartidores', repartidoresController.listarRepartidores);

// ============================================
// ENDPOINTS PROTEGIDOS (Requieren autenticación)
// ============================================

/**
 * Actualizar ubicación del repartidor (seguimiento en tiempo real)
 * PATCH /api/repartidores/:id/ubicacion
 * Usa lat/lng (DECIMAL) - Compatible con MySQL
 */
router.patch('/repartidores/:id/ubicacion', requireAuth, repartidoresController.actualizarUbicacion);

/**
 * Configurar método de pago del repartidor (Mercado Pago)
 * POST /api/repartidores/:id/configurar-pago
 * Vincula cuenta de Mercado Pago (CBU/CVU/Alias)
 */
router.post('/repartidores/:id/configurar-pago', requireAuth, repartidoresController.configurarPago);

/**
 * Actualizar disponibilidad del repartidor (online/offline)
 * PATCH /api/repartidores/:id/disponibilidad
 * Solo el repartidor autenticado puede cambiar su estado
 */
router.patch('/repartidores/:id/disponibilidad', requireAuth, repartidoresController.actualizarDisponibilidad);

/**
 * Actualizar perfil del repartidor
 * PATCH /api/repartidores/:id/perfil
 * Modifica datos del perfil (nombre, teléfono, email, etc.)
 */
router.patch('/repartidores/:id/perfil', requireAuth, repartidoresController.actualizarPerfil);

/**
 * Subir foto de perfil del repartidor
 * POST /api/repartidores/:id/foto-perfil
 * Sube imagen en base64 y la convierte a archivo
 */
router.post('/repartidores/:id/foto-perfil', requireAuth, repartidoresController.actualizarFotoPerfil);

// ============================================
// ENDPOINTS CEO (Requieren rol CEO)
// ============================================

/**
 * Aprobar verificación de repartidor (CEO)
 * POST /api/repartidores/:id/aprobar-verificacion
 * Solo CEO puede aprobar la verificación de documentos
 */
router.post('/repartidores/:id/aprobar-verificacion', requireCEO, repartidoresController.aprobarVerificacion);

/**
 * Rechazar verificación de repartidor (CEO)
 * POST /api/repartidores/:id/rechazar-verificacion
 * Solo CEO puede rechazar la verificación con motivo
 */
router.post('/repartidores/:id/rechazar-verificacion', requireCEO, repartidoresController.rechazarVerificacion);

// ============================================
// EXPORTAR ROUTER
// ============================================

module.exports = router;

console.log('✅ Rutas de repartidores cargadas:');
console.log('   📌 POST   /api/repartidores (público)');
console.log('   📌 GET    /api/repartidores (público)');
console.log('   📌 PATCH  /api/repartidores/:id/ubicacion (auth)');
console.log('   📌 POST   /api/repartidores/:id/configurar-pago (auth)');
console.log('   📌 PATCH  /api/repartidores/:id/disponibilidad (auth)');
console.log('   📌 PATCH  /api/repartidores/:id/perfil (auth)');
console.log('   📌 POST   /api/repartidores/:id/foto-perfil (auth)');
console.log('   📌 POST   /api/repartidores/:id/aprobar-verificacion (CEO)');
console.log('   📌 POST   /api/repartidores/:id/rechazar-verificacion (CEO)');
