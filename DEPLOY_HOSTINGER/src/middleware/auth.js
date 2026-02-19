/**
 * ====================================
 * YAVOY v3.1 - MIDDLEWARE DE AUTENTICACIÓN
 * ====================================
 * Gestiona verificación de JWT y control de acceso por roles
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'yavoy-secret-key-ultra-secure-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

/**
 * Genera un token JWT
 * @param {Object} payload - Datos del usuario (id, email, rol)
 * @returns {string} Token JWT
 */
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Genera un refresh token
 * @param {Object} payload - Datos del usuario (id, rol)
 * @returns {string} Refresh token
 */
function generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * Verifica un token JWT
 * @param {string} token - Token a verificar
 * @returns {Object} Payload decodificado
 * @throws {Error} Si el token es inválido o expiró
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expirado');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Token inválido');
        }
        throw error;
    }
}

/**
 * Middleware: Requiere autenticación válida
 * Verifica el token JWT en headers Authorization
 */
function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Token de autenticación requerido'
            });
        }
        
        const token = authHeader.substring(7); // Quitar 'Bearer '
        const decoded = verifyToken(token);
        
        // Adjuntar información del usuario a la request
        req.user = decoded;
        req.userId = decoded.id;
        req.userRole = decoded.rol;
        
        next();
    } catch (error) {
        if (error.message === 'Token expirado') {
            return res.status(401).json({
                error: 'Token expirado',
                message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente'
            });
        }
        
        return res.status(401).json({
            error: 'No autorizado',
            message: 'Token inválido'
        });
    }
}

/**
 * Middleware: Requiere un rol específico
 * @param {string|string[]} roles - Rol o roles permitidos
 */
function requireRole(roles) {
    // Normalizar a array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    return (req, res, next) => {
        if (!req.user || !req.userRole) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Autenticación requerida'
            });
        }
        
        const userRole = req.userRole.toUpperCase();
        const hasPermission = allowedRoles.some(role => 
            role.toUpperCase() === userRole
        );
        
        if (!hasPermission) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: `Requiere rol: ${allowedRoles.join(' o ')}`
            });
        }
        
        next();
    };
}

/**
 * Middleware opcional: Verifica token si existe, pero no lo requiere
 */
function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            req.user = decoded;
            req.userId = decoded.id;
            req.userRole = decoded.rol;
        }
    } catch (error) {
        // Ignorar errores en auth opcional
    }
    
    next();
}

/**
 * Middleware: Requiere acceso CEO
 * Solo permite acceso a usuarios con rol CEO
 */
function requireCEO(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Token de autenticación CEO requerido'
            });
        }
        
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (decoded.rol !== 'CEO' && decoded.rol !== 'ceo') {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'Requiere privilegios de CEO'
            });
        }
        
        req.user = decoded;
        req.ceo = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            error: 'No autorizado',
            message: 'Token CEO inválido'
        });
    }
}

/**
 * Login CEO - Validación de credenciales hardcoded
 * @param {string} username - Usuario CEO
 * @param {string} password - Contraseña CEO
 * @returns {Object} Resultado del login
 */
function loginCEO(username, password) {
    const CEO_USERNAME = process.env.CEO_USERNAME || 'admin';
    const CEO_PASSWORD = process.env.CEO_PASSWORD || 'admin123';
    
    if (username === CEO_USERNAME && password === CEO_PASSWORD) {
        const ceo = {
            id: 'CEO001',
            username: CEO_USERNAME,
            nombre: 'CEO Admin',
            rol: 'CEO'
        };
        
        const token = generateToken(ceo);
        
        return {
            success: true,
            ceo,
            token,
            message: 'Login CEO exitoso'
        };
    }
    
    return {
        success: false,
        error: 'Credenciales CEO inválidas'
    };
}

/**
 * Validar CEO - Verifica si un token es de CEO
 * @param {string} token - Token a validar
 * @returns {boolean}
 */
function validarCEO(token) {
    try {
        const decoded = verifyToken(token);
        return decoded.rol === 'CEO' || decoded.rol === 'ceo';
    } catch (error) {
        return false;
    }
}

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    requireAuth,
    requireRole,
    optionalAuth,
    requireCEO,
    loginCEO,
    validarCEO
};


