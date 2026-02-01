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
const googleAuthController = require('../controllers/googleAuthController');
const { requireAuth } = require('../middleware/auth');
const securityMiddleware = require('../middleware/security');
const { schemas, validate, validateAll } = require('../validation/schemas');

console.log('Esquemas importados:', Object.keys(schemas)); // Debug temporal

// Obtener middleware de caché de la app
const getCacheMiddleware = (req) => req.app.get('cacheMiddleware');

// ========================================
// 📝 REGISTRO DE USUARIOS
// ========================================

/**
 * @swagger
 * /api/auth/register/comercio:
 *   post:
 *     summary: Registrar nuevo comercio
 *     description: |
 *       Registra un nuevo comercio en la plataforma YAvoy.
 *       
 *       ### Validaciones:
 *       - Email único en el sistema
 *       - Contraseña mínimo 8 caracteres
 *       - Teléfono con formato válido
 *       - Dirección con coordenadas GPS
 *       
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nombre del comercio
 *                 example: "Pizzería Don Carlos"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email para login (debe ser único)
 *                 example: "doncarlos@email.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Contraseña (mínimo 8 caracteres)
 *                 example: "miPassword123"
 *               telefono:
 *                 type: string
 *                 pattern: "^[+]?[0-9]{10,15}$"
 *                 description: Teléfono con código de país
 *                 example: "+541234567890"
 *               direccion:
 *                 $ref: '#/components/schemas/Direccion'
 *               rubro:
 *                 type: string
 *                 enum: [restaurant, pizza, burger, sushi, cafe, dessert, market, pharmacy]
 *                 description: Categoría del comercio
 *                 example: "pizza"
 *               horarios:
 *                 type: object
 *                 description: Horarios de atención
 *                 properties:
 *                   lunes:
 *                     type: object
 *                     properties:
 *                       apertura: { type: string, example: "08:00" }
 *                       cierre: { type: string, example: "22:00" }
 *     responses:
 *       201:
 *         description: Comercio registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         comercio:
 *                           $ref: '#/components/schemas/Usuario'
 *                         token:
 *                           type: string
 *                           description: JWT token de acceso
 *                         expiresIn:
 *                           type: integer
 *                           example: 3600
 *             example:
 *               success: true
 *               message: "Comercio registrado exitosamente"
 *               data:
 *                 comercio:
 *                   id: "comercio_123"
 *                   email: "doncarlos@email.com"
 *                   nombre: "Pizzería Don Carlos"
 *                   tipo: "comercio"
 *                   estado: "verificacion"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 expiresIn: 3600
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "CONFLICT_ERROR"
 *               message: "El email ya está registrado en el sistema"
 *       429:
 *         description: Demasiados intentos de registro
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/register/comercio', 
    securityMiddleware.rateLimiters.auth,
    // validate(schemas.registroComercio), // Temporal: desactivar validación
    (req, res) => authController.registerComercio(req, res)
);

/**
 * @swagger
 * /api/auth/register/repartidor:
 *   post:
 *     summary: Registrar nuevo repartidor
 *     description: |
 *       Registra un nuevo repartidor en la plataforma YAvoy.
 *       
 *       ### Proceso de verificación:
 *       - Validación de datos personales
 *       - Verificación de zona de cobertura
 *       - Validación de vehículo (opcional)
 *       - Estado inicial: "verificacion"
 *       
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nombre completo del repartidor
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email para login
 *                 example: "juan.repartidor@email.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Contraseña segura
 *                 example: "miPassword123"
 *               telefono:
 *                 type: string
 *                 pattern: "^[+]?[0-9]{10,15}$"
 *                 description: Teléfono móvil para contacto
 *                 example: "+541234567890"
 *               vehiculo:
 *                 type: object
 *                 description: Información del vehículo
 *                 properties:
 *                   tipo:
 *                     type: string
 *                     enum: [moto, bicicleta, auto, peatón]
 *                     example: "moto"
 *                   patente:
 *                     type: string
 *                     pattern: "^[A-Z]{2}[0-9]{3}[A-Z]{2}$"
 *                     description: Patente del vehículo (opcional)
 *                     example: "ABC123DE"
 *                   marca:
 *                     type: string
 *                     example: "Honda"
 *                   modelo:
 *                     type: string
 *                     example: "Wave 110"
 *               zonaCobertura:
 *                 type: array
 *                 description: Zonas donde puede hacer delivery
 *                 items:
 *                   type: string
 *                 example: ["Palermo", "Villa Crespo", "Recoleta"]
 *     responses:
 *       201:
 *         description: Repartidor registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         repartidor:
 *                           $ref: '#/components/schemas/Usuario'
 *                         token:
 *                           type: string
 *                         expiresIn:
 *                           type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email ya registrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/register/repartidor',
    securityMiddleware.rateLimiters.auth,
    // validate(schemas.registroRepartidor), // Temporal: desactivar validación
    (req, res) => authController.registerRepartidor(req, res)
);

// ========================================
// 🔓 LOGIN Y SESIONES
// ========================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autenticación universal
 *     description: |
 *       Endpoint de login unificado para comercios y repartidores.
 *       
 *       ### Características:
 *       - Detección automática del tipo de usuario
 *       - Generación de JWT con permisos específicos
 *       - Rate limiting para prevenir ataques de fuerza bruta
 *       - Logging de intentos de acceso
 *       - Soporte para "recordar sesión"
 *       
 *       ### Flujo de autenticación:
 *       1. Validar formato de email y contraseña
 *       2. Verificar credenciales en base de datos
 *       3. Generar JWT con claims específicos
 *       4. Retornar token + información de usuario
 *       
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             comercio:
 *               summary: Login de comercio
 *               value:
 *                 email: "doncarlos@email.com"
 *                 password: "miPassword123"
 *                 rememberMe: false
 *             repartidor:
 *               summary: Login de repartidor
 *               value:
 *                 email: "juan.repartidor@email.com"
 *                 password: "miPassword456"
 *                 rememberMe: true
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/LoginResponse'
 *                 - type: object
 *                   properties:
 *                     permissions:
 *                       type: array
 *                       description: Lista de permisos del usuario
 *                       items:
 *                         type: string
 *                       example: ["pedidos.gestionar", "productos.editar"]
 *                     lastLogin:
 *                       type: string
 *                       format: date-time
 *                       description: Último acceso exitoso
 *             examples:
 *               comercio:
 *                 summary: Respuesta para comercio
 *                 value:
 *                   success: true
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjb21lcmNpb18xMjMi..."
 *                   usuario:
 *                     id: "comercio_123"
 *                     email: "doncarlos@email.com"
 *                     nombre: "Pizzería Don Carlos"
 *                     tipo: "comercio"
 *                     estado: "activo"
 *                   expiresIn: 3600
 *                   permissions: ["pedidos.gestionar", "productos.editar"]
 *                   lastLogin: "2024-01-15T10:30:00Z"
 *               repartidor:
 *                 summary: Respuesta para repartidor
 *                 value:
 *                   success: true
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyZXBhcnRpZG9yXzQ1Ni4u."
 *                   usuario:
 *                     id: "repartidor_456"
 *                     email: "juan.repartidor@email.com"
 *                     nombre: "Juan Pérez"
 *                     tipo: "repartidor"
 *                     estado: "activo"
 *                   expiresIn: 7200
 *                   permissions: ["pedidos.tomar", "gps.actualizar"]
 *                   lastLogin: "2024-01-15T09:15:00Z"
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidCredentials:
 *                 summary: Email o contraseña incorrectos
 *                 value:
 *                   success: false
 *                   error: "INVALID_CREDENTIALS"
 *                   message: "Email o contraseña incorrectos"
 *                   timestamp: "2024-01-15T10:30:00Z"
 *               userSuspended:
 *                 summary: Usuario suspendido
 *                 value:
 *                   success: false
 *                   error: "USER_SUSPENDED"
 *                   message: "Tu cuenta está suspendida. Contacta a soporte."
 *                   timestamp: "2024-01-15T10:30:00Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         description: Demasiados intentos de login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "RATE_LIMIT_EXCEEDED"
 *               message: "Demasiados intentos de login. Intenta en 15 minutos."
 *               details:
 *                 retryAfter: 900
 *                 attemptsLeft: 0
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/login',
    securityMiddleware.rateLimiters.auth,
    // validate(schemas.login), // Temporal: desactivar validación
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
    securityMiddleware.rateLimiters.auth,
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

// ========================================
// 👤 PERFIL DE USUARIO CON CACHÉ
// ========================================

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     description: |
 *       Obtiene la información del perfil del usuario actual.
 *       
 *       ### Caché implementado:
 *       - TTL: 30 minutos
 *       - Invalidación automática al actualizar perfil
 *       - Caché por usuario individual
 *       
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         headers:
 *           X-Cache:
 *             schema:
 *               type: string
 *               enum: [HIT, MISS]
 *             description: Estado del caché
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Usuario'
 */
router.get('/profile',
    requireAuth,
    (req, res, next) => {
        const cacheMiddleware = req.app.get('cacheMiddleware');
        if (cacheMiddleware) {
            return cacheMiddleware.userCache(1800)(req, res, next); // 30 minutos
        }
        next();
    },
    (req, res) => authController.getUserProfile(req, res)
);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Actualizar perfil del usuario
 *     description: |
 *       Actualiza la información del perfil del usuario.
 *       Invalida automáticamente el caché del usuario.
 *       
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               telefono:
 *                 type: string
 *               direccion:
 *                 $ref: '#/components/schemas/Direccion'
 */
router.put('/profile',
    requireAuth,
    (req, res, next) => {
        const cacheMiddleware = req.app.get('cacheMiddleware');
        if (cacheMiddleware) {
            return cacheMiddleware.invalidateCache([
                `users:${req.user.id}`,
                (req) => `sessions:${req.user.id}*`
            ])(req, res, next);
        }
        next();
    },
    (req, res) => authController.updateUserProfile(req, res)
);

// ========================================
// ✅ VERIFICACIÓN DE EMAIL
// ========================================

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verifica el código de confirmación de registro
 *     description: |
 *       Verifica que el usuario ingrese el código correcto que fue enviado por email.
 *       Una vez verificado, la cuenta se activa completamente.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, confirmationCode]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario (ej: COM1234567890)
 *                 example: "COM1704067200000"
 *               confirmationCode:
 *                 type: string
 *                 pattern: "^[0-9]{6}$"
 *                 description: Código de 6 dígitos enviado por email
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verificado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 usuario:
 *                   type: object
 *       400:
 *         description: Código inválido o expirado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/verify-email', (req, res) => authController.verifyEmail(req, res));

/**
 * @swagger
 * /api/auth/resend-confirmation:
 *   post:
 *     summary: Reenvía el código de confirmación
 *     description: |
 *       Si el código de confirmación expiró o el usuario no lo recibió,
 *       puede solicitar que se reenvíe a su email.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *                 example: "COM1704067200000"
 *     responses:
 *       200:
 *         description: Nuevo código enviado
 *       400:
 *         description: Usuario ya verificado o datos inválidos
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/resend-confirmation', (req, res) => authController.resendConfirmation(req, res));

// ========================================
// 🔐 GOOGLE OAUTH
// ========================================

/**
 * POST /api/auth/google/init
 * Inicia el flujo de autenticación con Google
 */
router.post('/google/init', (req, res) => googleAuthController.initGoogleAuth(req, res));

/**
 * GET /api/auth/google/callback
 * Callback de Google OAuth
 */
router.get('/google/callback', (req, res) => googleAuthController.googleCallback(req, res));

module.exports = router;
