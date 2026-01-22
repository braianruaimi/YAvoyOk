/**
 * ====================================
 * YAVOY v3.1 - MIDDLEWARE DE SEGURIDAD
 * ====================================
 * 
 * Implementa todas las capas de seguridad:
 * - Helmet: Headers HTTP seguros
 * - Rate Limiting: Protección contra ataques DDoS
 * - CORS: Control de acceso entre dominios
 * - Validación de inputs
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');

// ========================================
// 🛡️ HELMET: HEADERS DE SEGURIDAD HTTP
// ========================================
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "https://sdk.mercadopago.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:", "*"],
            connectSrc: ["'self'", "https://api.mercadopago.com", "https://cdn.jsdelivr.net", "ws:", "wss:", "http://localhost:*", "http://127.0.0.1:*", "*"],
            frameSrc: ["'self'", "https://www.mercadopago.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: null
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
});

// ========================================
// 🚦 RATE LIMITING: LÍMITES DE REQUESTS
// ========================================

// Límite general para toda la API
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 requests por IP
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intenta nuevamente en 15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Límite estricto para autenticación (previene brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Solo 5 intentos de login
    skipSuccessfulRequests: true,
    message: {
        error: 'Demasiados intentos de inicio de sesión. Intenta en 15 minutos'
    }
});

// Límite para creación de pedidos (previene spam)
const pedidosLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 10, // Máximo 10 pedidos por IP
    message: {
        error: 'Demasiados pedidos creados. Intenta en 5 minutos'
    }
});

// Límite para webhooks de MercadoPago
const webhookLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 50, // MercadoPago puede enviar múltiples webhooks
    skipFailedRequests: true
});

// ========================================
// 🌐 CORS: CONTROL DE ACCESO
// ========================================
const corsConfig = cors({
    origin: function (origin, callback) {
        // Lista de orígenes permitidos
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:5502', 'http://127.0.0.1:5502'];
        
        // Permitir requests sin origin (Postman, apps móviles)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Acceso CORS no permitido desde este origen'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

// ========================================
// 🔐 SANITIZACIÓN DE INPUTS
// ========================================

/**
 * Sanitiza strings para prevenir inyección de código
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    return str
        .replace(/[<>]/g, '') // Elimina < y >
        .replace(/javascript:/gi, '') // Elimina javascript:
        .replace(/on\w+\s*=/gi, '') // Elimina eventos inline
        .trim();
}

/**
 * Middleware de sanitización general
 */
function sanitizeInputs(req, res, next) {
    // Sanitizar query params
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeString(req.query[key]);
            }
        });
    }
    
    // Sanitizar body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeString(req.body[key]);
            }
        });
    }
    
    next();
}

// ========================================
// 🔍 LOGGING DE SEGURIDAD
// ========================================
function securityLogger(req, res, next) {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const method = req.method;
    const url = req.originalUrl;
    
    console.log(`[SECURITY] ${timestamp} | ${ip} | ${method} ${url}`);
    
    // Log de headers sospechosos
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];
    suspiciousHeaders.forEach(header => {
        if (req.headers[header]) {
            console.log(`[SECURITY] Proxy detectado: ${header}=${req.headers[header]}`);
        }
    });
    
    next();
}

// ========================================
// �️ MIDDLEWARE DE COMPRESIÓN
// ========================================
const compressionMiddleware = compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
});

// ========================================
// 📊 MIDDLEWARE DE LOGGING HTTP
// ========================================
const morganLogger = morgan('combined', {
    skip: (req, res) => {
        return req.url === '/health' || req.url === '/api/health';
    }
});

// ========================================
// 🛡️ HEADERS DE SEGURIDAD ADICIONALES
// ========================================
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
};

// ========================================
// 🚫 MIDDLEWARE ANTI-DDOS BÁSICO
// ========================================
const antiDDoS = (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length')) || 0;
    if (contentLength > 50 * 1024 * 1024) { // 50MB
        return res.status(413).json({
            success: false,
            error: 'Request demasiado grande'
        });
    }
    next();
};

// ========================================
// �📤 EXPORTACIONES
// ========================================
module.exports = {
    helmetConfig,
    generalLimiter,
    authLimiter,
    pedidosLimiter,
    webhookLimiter,
    rateLimiters: {
        general: generalLimiter,
        auth: authLimiter,
        pedidos: pedidosLimiter,
        webhook: webhookLimiter,
        critical: authLimiter // Re-usar auth limiter para endpoints críticos
    },
    corsConfig,
    compression: compressionMiddleware,
    morganLogger,
    securityHeaders,
    antiDDoS,
    securityLogger,
    sanitizeInputs,
    sanitizeString
};
