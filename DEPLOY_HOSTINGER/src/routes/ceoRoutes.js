// ========================================
// RUTAS CEO - YAvoy v3.1
// ========================================
// Rutas de administración central y panel de control

const express = require('express');
const router = express.Router();

// Importar controlador CEO
const ceoController = require('../controllers/ceoController');

// Importar middleware de autenticación CEO
const { requireCEO } = require('../middleware/auth');

// ============================================
// ENDPOINTS PÚBLICOS (Login)
// ============================================

/**
 * Login CEO
 * POST /api/ceo/login
 * Acceso sin autenticación (para iniciar sesión)
 */
router.post('/login', ceoController.loginCEO);

// ============================================
// ENDPOINTS PROTEGIDOS (Requieren rol CEO)
// ============================================

/**
 * Verificar sesión CEO
 * GET /api/ceo/verificar
 * Valida el token JWT del CEO
 */
router.get('/verificar', requireCEO, ceoController.verificarSesion);

/**
 * Dashboard principal  del CEO
 * GET /api/ceo/dashboard
 * Métricas generales del sistema
 */
router.get('/dashboard', requireCEO, ceoController.getDashboard);

/**
 * Obtener informes de todos los repartidores
 * GET /api/ceo/repartidores
 * Lista completa con estadísticas agregadas
 */
router.get('/repartidores', requireCEO, ceoController.getInformesRepartidores);

/**
 * Obtener informe de un repartidor específico
 * GET /api/ceo/repartidores/:id
 * Detalles completos de un repartidor
 */
router.get('/repartidores/:id', requireCEO, ceoController.getInformeRepartidor);

/**
 * Obtener informes de todos los comercios
 * GET /api/ceo/comercios
 * Lista completa con estadísticas agregadas
 */
router.get('/comercios', requireCEO, ceoController.getInformesComercios);

/**
 * Obtener informes de todos los clientes
 * GET /api/ceo/clientes
 * Lista completa con estadísticas agregadas
 */
router.get('/clientes', requireCEO, ceoController.getInformesClientes);

/**
 * Enviar email de verificación (simulado)
 * POST /api/ceo/enviar-verificacion-email
 * Envía email de verificación a nuevos registros
 */
router.post('/enviar-verificacion-email', requireCEO, ceoController.enviarVerificacionEmail);

// ============================================
// EXPORTAR ROUTER
// ============================================

module.exports = router;

console.log('✅ Rutas CEO cargadas:');
console.log('   📌 POST   /api/ceo/login (público)');
console.log('   📌 GET    /api/ceo/verificar (CEO)');
console.log('   📌 GET    /api/ceo/dashboard (CEO)');
console.log('   📌 GET    /api/ceo/repartidores (CEO)');
console.log('   📌 GET    /api/ceo/repartidores/:id (CEO)');
console.log('   📌 GET    /api/ceo/comercios (CEO)');
console.log('   📌 GET    /api/ceo/clientes (CEO)');
console.log('   📌 POST   /api/ceo/enviar-verificacion-email (CEO)');
