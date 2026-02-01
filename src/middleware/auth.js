/**
 * ====================================
 * YAVOY v3.1 - MIDDLEWARE DE AUTENTICACIÓN JWT
 * ====================================
 * 
 * Sistema de autenticación basado en JSON Web Tokens
 * Protege rutas y valida permisos por rol
 */

const jwt = require('jsonwebtoken');

// Obtener clave secreta del .env
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-CHANGE-THIS-IN-PRODUCTION';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ========================================
// 🔐 GENERACIÓN DE TOKENS
// ========================================

/**
 * Genera un nuevo token JWT
 * @param {Object} payload - Datos del usuario (id, email, rol)
 * @returns {string} Token JWT firmado
 */
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'YAvoy-v3.1'
    });
}

/**
 * Genera un refresh token (dura más tiempo)
 * @param {Object} payload - Datos del usuario
 * @returns {string} Refresh token
 */
function generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '7d', // 7 días
        issuer: 'YAvoy-v3.1'
    });
}

// ========================================
// 🔍 VERIFICACIÓN DE TOKENS
// ========================================

/**
 * Verifica y decodifica un token JWT
 * @param {string} token - Token a verificar
 * @returns {Object|null} Payload del token o null si es inválido
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('[JWT] Error al verificar token:', error.message);
        return null;
    }
}

// ========================================
// 🛡️ MIDDLEWARE DE AUTENTICACIÓN
// ========================================

/**
 * Middleware: Requiere autenticación válida
 * Verifica que el request tenga un token JWT válido en headers
 */
const UsuarioModel = require('../models/Usuario');
const sequelize = require('../../config/database');
const Usuario = UsuarioModel(sequelize);

async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'No autorizado',
            message: 'Token de autenticación requerido'
        });
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({
            error: 'Token inválido',
            message: 'El token proporcionado es inválido o ha expirado'
        });
    }
    try {
        const usuario = await Usuario.findByPk(decoded.id);
        if (!usuario) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Usuario no encontrado en la base de datos'
            });
        }
        req.user = usuario.toJSON();
        next();
    } catch (error) {
        console.error('[AUTH] Error buscando usuario en DB:', error);
        return res.status(500).json({
            error: 'Error del servidor',
            message: 'No se pudo validar el usuario'
        });
    }
}

/**
 * Middleware: Requiere rol específico
 * @param {...string} roles - Roles permitidos (admin, comercio, repartidor, cliente)
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Autenticación requerida'
            });
        }
        
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: `Esta acción requiere rol: ${roles.join(' o ')}`
            });
        }
        
        next();
    };
}

/**
 * Middleware: Autenticación opcional
 * Si hay token válido, agrega usuario al request
 * Si no hay token o es inválido, continúa sin usuario
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (decoded) {
            req.user = decoded;
        }
    }
    
    next();
}

// ========================================
// 🔒 VALIDACIÓN DE PERMISOS
// ========================================

/**
 * Verifica si el usuario tiene permiso sobre un recurso
 * @param {Object} req - Request object
 * @param {string} resourceUserId - ID del propietario del recurso
 * @returns {boolean}
 */
function canAccessResource(req, resourceUserId) {
    if (!req.user) return false;
    
    // Admins pueden acceder a todo
    if (req.user.rol === 'admin') return true;
    
    // El usuario solo puede acceder a sus propios recursos
    return req.user.id === resourceUserId;
}

/**
 * Middleware: Verifica propiedad del recurso
 * Uso: requireOwnership((req) => req.params.userId)
 */
function requireOwnership(getUserIdFn) {
    return (req, res, next) => {
        const resourceUserId = getUserIdFn(req);
        
        if (!canAccessResource(req, resourceUserId)) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'No tienes permiso para acceder a este recurso'
            });
        }
        
        next();
    };
}

// ========================================
// 📋 ROLES Y PERMISOS
// ========================================

const ROLES = {
    ADMIN: 'admin',
    CEO: 'ceo',
    COMERCIO: 'comercio',
    REPARTIDOR: 'repartidor',
    CLIENTE: 'cliente'
};

const PERMISSIONS = {
    // Permisos de administración
    MANAGE_USERS: ['admin', 'ceo'],
    MANAGE_COMMERCES: ['admin', 'ceo'],
    MANAGE_DELIVERY: ['admin', 'ceo'],
    VIEW_ANALYTICS: ['admin', 'ceo'],
    
    // Permisos de comercios
    CREATE_ORDERS: ['comercio', 'admin'],
    MANAGE_OWN_ORDERS: ['comercio'],
    VIEW_OWN_STATS: ['comercio'],
    
    // Permisos de repartidores
    VIEW_AVAILABLE_ORDERS: ['repartidor', 'admin'],
    ACCEPT_ORDERS: ['repartidor'],
    UPDATE_DELIVERY_STATUS: ['repartidor'],
    
    // Permisos de clientes
    PLACE_ORDER: ['cliente', 'admin'],
    VIEW_OWN_HISTORY: ['cliente']
};

/**
 * Verifica si el usuario tiene un permiso específico
 * @param {Object} user - Usuario del request
 * @param {string} permission - Permiso a verificar (clave de PERMISSIONS)
 * @returns {boolean}
 */
function hasPermission(user, permission) {
    if (!user || !user.rol) return false;
    
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;
    
    return allowedRoles.includes(user.rol);
}

/**
 * Middleware: Requiere permiso específico
 */
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Autenticación requerida'
            });
        }
        
        if (!hasPermission(req.user, permission)) {
            return res.status(403).json({
                error: 'Permiso denegado',
                message: `No tienes permiso para: ${permission}`
            });
        }
        
        next();
    };
}

// ========================================
// 📤 EXPORTACIONES
// ========================================

// ========================================
// 👔 MIDDLEWARE CEO EXCLUSIVO
// ========================================

/**
 * Usuarios CEO autorizados
 * SOLO estos usuarios pueden acceder al Centro de Mando
 */
const CEO_USERS = {
    'braian': {
        id: 'CEO-001',
        nombre: 'Braian.R',
        password: 'Braian2026!',
        email: 'braian@yavoy.com'
    },
    'cesar': {
        id: 'CEO-002',
        nombre: 'Cesar.C',
        password: 'Cesar2026!',
        email: 'cesar@yavoy.com'
    }
};

/**
 * Valida credenciales CEO
 * @param {string} usuario - Nombre de usuario (braian o cesar)
 * @param {string} password - Contraseña
 * @returns {Object|null} Datos del CEO o null si inválido
 */
function validarCEO(usuario, password) {
    const userKey = usuario.toLowerCase().replace('.r', '').replace('.c', '');
    const ceo = CEO_USERS[userKey];
    
    if (!ceo) return null;
    if (ceo.password !== password) return null;
    
    return {
        id: ceo.id,
        nombre: ceo.nombre,
        email: ceo.email,
        rol: 'ceo'
    };
}

/**
 * Middleware: Requiere autenticación CEO
 * Verifica que el usuario sea Braian.R o Cesar.C
 * Puede usarse con JWT o con sesión en localStorage
 */
function requireCEO(req, res, next) {
    // Opción 1: Verificar header de autorización CEO
    const ceoAuth = req.headers['x-ceo-auth'];
    
    if (ceoAuth) {
        try {
            const decoded = Buffer.from(ceoAuth, 'base64').toString('utf-8');
            const [usuario, password] = decoded.split(':');
            const ceo = validarCEO(usuario, password);
            
            if (ceo) {
                req.ceo = ceo;
                req.user = { ...ceo, rol: 'ceo' };
                return next();
            }
        } catch (error) {
            console.error('[CEO Auth] Error al decodificar:', error.message);
        }
    }
    
    // Opción 2: Verificar token JWT con rol CEO
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (decoded && decoded.rol === 'ceo') {
            req.user = decoded;
            req.ceo = decoded;
            return next();
        }
    }
    
    // Si ninguna opción funciona, denegar acceso
    return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Esta área es exclusiva para CEOs autorizados (Braian.R o Cesar.C)',
        code: 'CEO_REQUIRED'
    });
}

/**
 * Genera token de sesión CEO
 * @param {string} usuario - braian o cesar
 * @param {string} password - contraseña
 * @returns {Object} Token y datos del CEO o error
 */
function loginCEO(usuario, password) {
    const ceo = validarCEO(usuario, password);
    
    if (!ceo) {
        return { success: false, error: 'Credenciales inválidas' };
    }
    
    const token = generateToken({
        id: ceo.id,
        nombre: ceo.nombre,
        email: ceo.email,
        rol: 'ceo'
    });
    
    return {
        success: true,
        token,
        ceo: {
            id: ceo.id,
            nombre: ceo.nombre,
            email: ceo.email
        }
    };
}

module.exports = {
    // Funciones de tokens
    generateToken,
    generateRefreshToken,
    verifyToken,
    
    // Middlewares de autenticación
    requireAuth,
    requireRole,
    optionalAuth,
    requireOwnership,
    requirePermission,
    
    // Middleware CEO
    requireCEO,
    validarCEO,
    loginCEO,
    CEO_USERS,
    
    // Utilidades
    canAccessResource,
    hasPermission,
    
    // Constantes
    ROLES,
    PERMISSIONS
};
