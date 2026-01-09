/**
 * YAVOY v3.1 - Middleware de Autenticación y Autorización por Roles
 * Protege rutas del backend validando JWT y roles de usuario
 * @author YAvoy Team
 * @version 3.1
 */

const jwt = require('jsonwebtoken');

// Cargar secret desde variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'yavoy_secret_2025_ultra_secure_key';

/**
 * Middleware para verificar token JWT
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token de autenticación requerido',
            code: 'NO_TOKEN'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Error al verificar token:', err.message);
            
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado',
                    code: 'TOKEN_EXPIRED'
                });
            }
            
            return res.status(403).json({
                success: false,
                error: 'Token inválido',
                code: 'INVALID_TOKEN'
            });
        }

        // Agregar información del usuario al request
        req.user = user;
        next();
    });
}

/**
 * Middleware para autorizar roles específicos
 * @param {Array} allowedRoles - Lista de roles permitidos
 */
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado',
                code: 'NOT_AUTHENTICATED'
            });
        }

        const userRole = req.user.role || req.user.tipo;

        if (!allowedRoles.includes(userRole)) {
            console.warn(`Acceso denegado: Usuario ${req.user.id} (${userRole}) intentó acceder a recurso restringido`);
            
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para acceder a este recurso',
                code: 'FORBIDDEN',
                required_roles: allowedRoles,
                user_role: userRole
            });
        }

        next();
    };
}

/**
 * Middleware específico para rutas de administrador
 */
function requireAdmin(req, res, next) {
    return authorizeRoles('ceo', 'admin')(req, res, next);
}

/**
 * Middleware específico para comercios
 */
function requireComercio(req, res, next) {
    return authorizeRoles('comercio', 'ceo', 'admin')(req, res, next);
}

/**
 * Middleware específico para repartidores
 */
function requireRepartidor(req, res, next) {
    return authorizeRoles('repartidor', 'ceo', 'admin')(req, res, next);
}

/**
 * Middleware para verificar que el usuario accede a sus propios datos
 */
function requireOwnership(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Usuario no autenticado',
            code: 'NOT_AUTHENTICATED'
        });
    }

    const userId = parseInt(req.params.id || req.params.userId || req.body.userId);
    const requestingUserId = req.user.id;

    // Admin puede acceder a cualquier recurso
    if (req.user.role === 'ceo' || req.user.role === 'admin') {
        return next();
    }

    // El usuario solo puede acceder a sus propios recursos
    if (userId !== requestingUserId) {
        console.warn(`Usuario ${requestingUserId} intentó acceder a recursos del usuario ${userId}`);
        
        return res.status(403).json({
            success: false,
            error: 'No puedes acceder a recursos de otros usuarios',
            code: 'OWNERSHIP_VIOLATION'
        });
    }

    next();
}

/**
 * Middleware para validar token (sin bloquear, solo agregar info)
 */
function validateTokenOptional(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
}

/**
 * Middleware para registrar acceso a recursos (auditoría)
 */
function auditAccess(req, res, next) {
    const timestamp = new Date().toISOString();
    const userId = req.user ? req.user.id : 'anonymous';
    const userRole = req.user ? req.user.role : 'none';
    const method = req.method;
    const path = req.path;
    const ip = req.ip || req.connection.remoteAddress;

    console.log(`[AUDIT ${timestamp}] User: ${userId} (${userRole}) | IP: ${ip} | ${method} ${path}`);

    // Puedes guardar esto en base de datos para auditoría completa
    // db.query('INSERT INTO audit_log (user_id, role, method, path, ip, timestamp) VALUES (?, ?, ?, ?, ?, ?)', 
    //          [userId, userRole, method, path, ip, timestamp]);

    next();
}

/**
 * Middleware para limitar tasa de peticiones por usuario
 */
const rateLimitMap = new Map();

function rateLimit(maxRequests = 100, windowMs = 60000) {
    return (req, res, next) => {
        if (!req.user) {
            return next();
        }

        const userId = req.user.id;
        const now = Date.now();
        
        if (!rateLimitMap.has(userId)) {
            rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
            return next();
        }

        const userLimit = rateLimitMap.get(userId);

        if (now > userLimit.resetTime) {
            rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
            return next();
        }

        if (userLimit.count >= maxRequests) {
            return res.status(429).json({
                success: false,
                error: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
                code: 'RATE_LIMIT_EXCEEDED',
                retry_after: Math.ceil((userLimit.resetTime - now) / 1000)
            });
        }

        userLimit.count++;
        next();
    };
}

/**
 * Generar token JWT
 */
function generateToken(user, expiresIn = '24h') {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.nombre || user.name,
        role: user.role || user.tipo,
        created_at: user.created_at
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verificar token JWT (para uso manual)
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Middleware para proteger rutas de administrador con auditoría
 */
function protectAdminRoutes(req, res, next) {
    // Primero autenticar
    authenticateToken(req, res, (err) => {
        if (err) return;
        
        // Luego verificar rol de admin
        requireAdmin(req, res, (err) => {
            if (err) return;
            
            // Auditar acceso
            auditAccess(req, res, next);
        });
    });
}

// Exportar middleware
module.exports = {
    authenticateToken,
    authorizeRoles,
    requireAdmin,
    requireComercio,
    requireRepartidor,
    requireOwnership,
    validateTokenOptional,
    auditAccess,
    rateLimit,
    generateToken,
    verifyToken,
    protectAdminRoutes
};
