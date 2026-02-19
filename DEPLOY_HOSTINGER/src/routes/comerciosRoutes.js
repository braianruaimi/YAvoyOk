// ========================================
// RUTAS DE COMERCIOS - YAvoy v3.1
// ========================================
// Definición de endpoints para gestión de comercios

const express = require('express');
const router = express.Router();
const comerciosController = require('../controllers/comerciosController');
const { requireAuth, requireRole, requireCEO } = require('../middleware/auth');

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

/**
 * Listar comercios
 * GET /api/listar-comercios?carpeta=servicios-alimentacion
 */
router.get('/listar-comercios', comerciosController.listarComercios);

/**
 * Obtener comercio individual por ID
 * GET /api/comercio/:id
 */
router.get('/comercio/:id', comerciosController.obtenerComercioPorId);

/**
 * Obtener comercios por estado (activo/inactivo)
 * GET /api/comercios/por-estado?activo=true
 */
router.get('/comercios/por-estado', comerciosController.obtenerComerciosPorEstado);

// ========================================
// RUTAS PROTEGIDAS - COMERCIO
// ========================================

/**
 * Guardar nuevo comercio
 * POST /api/guardar-comercio
 * Requiere: autenticación
 */
router.post('/guardar-comercio', requireAuth, comerciosController.guardarComercio);

/**
 * Actualizar datos del comercio
 * PATCH /api/comercio/:id
 * Requiere: autenticación
 */
router.patch('/comercio/:id', requireAuth, comerciosController.actualizarComercio);

/**
 * Subir foto de perfil del comercio
 * POST /api/comercio/:id/foto-perfil
 * Requiere: autenticación
 */
router.post('/comercio/:id/foto-perfil', requireAuth, comerciosController.actualizarFotoPerfil);

/**
 * Subir fotos de productos/servicios
 * POST /api/comercio/:id/fotos-productos
 * Requiere: autenticación
 */
router.post('/comercio/:id/fotos-productos', requireAuth, comerciosController.subirFotosProductos);

/**
 * Eliminar foto de producto
 * DELETE /api/comercio/:id/fotos-productos/:fotoId
 * Requiere: autenticación
 */
router.delete('/comercio/:id/fotos-productos/:fotoId', requireAuth, comerciosController.eliminarFotoProducto);

/**
 * Actualizar estado activo/inactivo del comercio
 * PATCH /api/comercio/:id/estado
 * Requiere: autenticación
 */
router.patch('/comercio/:id/estado', requireAuth, comerciosController.actualizarEstadoComercio);

/**
 * Solicitar creación de tienda premium
 * POST /api/comercio/solicitar-tienda
 * Requiere: autenticación
 */
router.post('/comercio/solicitar-tienda', requireAuth, comerciosController.solicitarTienda);

/**
 * Solicitar publicidad
 * POST /api/comercio/solicitar-publicidad
 * Requiere: autenticación
 */
router.post('/comercio/solicitar-publicidad', requireAuth, comerciosController.solicitarPublicidad);

// ========================================
// RUTAS PROTEGIDAS - ADMIN/CEO
// ========================================

/**
 * Obtener solicitudes de tienda (solo CEO)
 * GET /api/admin/solicitudes-tienda
 * Requiere: rol CEO
 */
router.get('/admin/solicitudes-tienda', requireCEO, comerciosController.obtenerSolicitudesTienda);

/**
 * Obtener solicitudes de publicidad (solo CEO)
 * GET /api/admin/solicitudes-publicidad
 * Requiere: rol CEO
 */
router.get('/admin/solicitudes-publicidad', requireCEO, comerciosController.obtenerSolicitudesPublicidad);

module.exports = router;
