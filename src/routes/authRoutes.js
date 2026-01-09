/**
 * ====================================
 * YAVOY v3.1 - RUTAS DE AUTENTICACIÓN
 * ====================================
 * 
 * Endpoints para registro, login y gestión de sesiones
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

// ========================================
// 📝 REGISTRO DE USUARIOS
// ========================================

/**
 * POST /api/auth/register/comercio
 * Registra un nuevo comercio
 * Body: { nombre, email, password, telefono?, direccion?, rubro? }
 */
router.post('/register/comercio', 
    authLimiter,
    (req, res) => authController.registerComercio(req, res)
);

/**
 * POST /api/auth/register/repartidor
 * Registra un nuevo repartidor
 * Body: { nombre, email, password, telefono?, vehiculo?, zonaCobertura? }
 */
router.post('/register/repartidor',
    authLimiter,
    (req, res) => authController.registerRepartidor(req, res)
);

// ========================================
// 🔓 LOGIN Y SESIONES
// ========================================

/**
 * POST /api/auth/login
 * Login universal (comercio o repartidor)
 * Body: { email, password }
 */
router.post('/login',
    authLimiter,
    (req, res) => authController.login(req, res)
);

/**
 * POST /api/auth/refresh
 * Renueva el token de acceso
 * Body: { refreshToken }
 */
router.post('/refresh',
    (req, res) => authController.refreshToken(req, res)
);

// ========================================
// 👤 INFORMACIÓN DEL USUARIO
// ========================================

/**
 * GET /api/auth/me
 * Obtiene información del usuario autenticado
 * Headers: Authorization: Bearer <token>
 */
router.get('/me',
    requireAuth,
    (req, res) => authController.getMe(req, res)
);

/**
 * POST /api/auth/change-password
 * Cambia la contraseña del usuario
 * Body: { currentPassword, newPassword }
 * Headers: Authorization: Bearer <token>
 */
router.post('/change-password',
    requireAuth,
    authLimiter,
    (req, res) => authController.changePassword(req, res)
);

// ========================================
// 📋 DOCUMENTACIÓN DE ENDPOINTS
// ========================================

/**
 * GET /api/auth/docs
 * Documentación de la API de autenticación
 */
router.get('/docs', (req, res) => {
    res.json({
        version: '3.1',
        endpoints: {
            'POST /api/auth/register/comercio': {
                description: 'Registra un nuevo comercio',
                body: {
                    nombre: 'string (requerido)',
                    email: 'string (requerido)',
                    password: 'string (requerido, mín 8 chars)',
                    telefono: 'string (opcional)',
                    direccion: 'string (opcional)',
                    rubro: 'string (opcional)'
                },
                response: {
                    comercio: 'objeto',
                    token: 'JWT token',
                    refreshToken: 'JWT refresh token'
                }
            },
            'POST /api/auth/register/repartidor': {
                description: 'Registra un nuevo repartidor',
                body: {
                    nombre: 'string (requerido)',
                    email: 'string (requerido)',
                    password: 'string (requerido, mín 8 chars)',
                    telefono: 'string (opcional)',
                    vehiculo: 'string (opcional)',
                    zonaCobertura: 'array (opcional)'
                },
                response: {
                    repartidor: 'objeto',
                    token: 'JWT token',
                    refreshToken: 'JWT refresh token'
                }
            },
            'POST /api/auth/login': {
                description: 'Login universal para comercios y repartidores',
                body: {
                    email: 'string (requerido)',
                    password: 'string (requerido)'
                },
                response: {
                    usuario: 'objeto',
                    rol: 'comercio | repartidor',
                    token: 'JWT token',
                    refreshToken: 'JWT refresh token'
                }
            },
            'POST /api/auth/refresh': {
                description: 'Renueva el token de acceso',
                body: {
                    refreshToken: 'string (requerido)'
                },
                response: {
                    token: 'JWT token nuevo'
                }
            },
            'GET /api/auth/me': {
                description: 'Información del usuario autenticado',
                headers: {
                    Authorization: 'Bearer <token>'
                },
                response: {
                    usuario: 'objeto',
                    rol: 'string'
                }
            },
            'POST /api/auth/change-password': {
                description: 'Cambia la contraseña del usuario',
                headers: {
                    Authorization: 'Bearer <token>'
                },
                body: {
                    currentPassword: 'string (requerido)',
                    newPassword: 'string (requerido, mín 8 chars)'
                },
                response: {
                    success: 'boolean',
                    message: 'string'
                }
            }
        },
        rateLimits: {
            'register/*': '5 requests por 15 minutos',
            'login': '5 requests por 15 minutos',
            'change-password': '5 requests por 15 minutos',
            'otros endpoints': 'sin límite'
        },
        security: {
            passwordRequirements: 'Mínimo 8 caracteres',
            tokenExpiration: '24 horas',
            refreshTokenExpiration: '7 días',
            hashAlgorithm: 'bcrypt (10 rounds)'
        }
    });
});

module.exports = router;
