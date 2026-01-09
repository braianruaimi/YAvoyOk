// ====================================
// 🛡️ YAvoy v3.1 - SECURITY MIDDLEWARE
// ====================================
// Implementación Elite de Seguridad

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// ========================================
// 🔒 HELMET - SECURITY HEADERS
// ========================================
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Necesario para scripts inline en panel CEO
        "https://cdn.socket.io",
        "https://cdn.jsdelivr.net",
        "https://maps.googleapis.com",
        "https://www.google-analytics.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",
        "http:"
      ],
      connectSrc: [
        "'self'",
        "https://api.mercadopago.com",
        "wss:",
        "ws:"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: [
        "'self'",
        "https://www.mercadopago.com",
        "https://maps.google.com"
      ]
    }
  },
  crossOriginEmbedderPolicy: false, // Permitir embeddings de terceros
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'sameorigin' }
});

// ========================================
// 🚦 RATE LIMITING - PREVENCIÓN DE ATAQUES
// ========================================

// Limiter General (100 req/15min)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: {
    success: false,
    error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Excluir endpoints de monitoreo
    return req.path === '/health' || req.path === '/api/ping';
  },
  keyGenerator: (req) => {
    // Usar IP real detrás de proxy
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
});

// Limiter ESTRICTO para Autenticación (5 intentos/15min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Demasiados intentos de inicio de sesión. Cuenta bloqueada por 15 minutos por seguridad.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true, // No contar intentos exitosos
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Combinar IP + email para prevenir ataques distribuidos
    const email = req.body?.email || req.body?.telefono || 'unknown';
    return `${req.ip}-${email}`;
  },
  handler: (req, res) => {
    console.error('🚨 ALERTA: Rate limit excedido en /api/auth', {
      ip: req.ip,
      email: req.body?.email,
      timestamp: new Date().toISOString()
    });
    res.status(429).json({
      success: false,
      error: 'Demasiados intentos de inicio de sesión. Bloqueado por 15 minutos.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Limiter para Webhooks (300 req/min)
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 300,
  message: {
    success: false,
    error: 'Webhook rate limit exceeded',
    code: 'WEBHOOK_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limiter para API Pública (30 req/min)
const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: 'Límite de API alcanzado. Intenta de nuevo en un minuto.',
    code: 'PUBLIC_API_LIMIT'
  },
  standardHeaders: true
});

// ========================================
// 🧹 INPUT SANITIZATION
// ========================================
const sanitizeInputs = (req, res, next) => {
  // Sanitizar todos los inputs
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remover caracteres peligrosos
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // XSS
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// ========================================
// 🔍 VALIDACIONES ESPECÍFICAS
// ========================================

// Validación de Email
const validateEmail = body('email')
  .trim()
  .isEmail()
  .normalizeEmail()
  .withMessage('Email inválido');

// Validación de Teléfono
const validatePhone = body('telefono')
  .trim()
  .matches(/^[0-9]{10,15}$/)
  .withMessage('Teléfono debe tener entre 10-15 dígitos');

// Validación de Password (mínimo 8 caracteres, 1 mayúscula, 1 número)
const validatePassword = body('password')
  .isLength({ min: 8 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Password debe tener mínimo 8 caracteres, 1 mayúscula y 1 número');

// Handler de errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }
  next();
};

// ========================================
// 📊 SECURITY LOGGER
// ========================================
const securityLogger = (req, res, next) => {
  // Log de eventos de seguridad críticos
  const criticalPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/admin',
    '/api/ceo',
    '/api/payments'
  ];

  const isCritical = criticalPaths.some(path => req.path.startsWith(path));
  
  if (isCritical) {
    console.log('🔐 [SECURITY]', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// ========================================
// 🛡️ CORS DINÁMICO
// ========================================
const corsConfig = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5502',
      'http://localhost:3000',
      'https://yavoy.com',
      'https://www.yavoy.com'
    ];

    // Permitir requests sin origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS bloqueado para origen:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
  maxAge: 86400 // 24 horas
};

// ========================================
// 🔐 VERIFICACIÓN DE WEBHOOK SIGNATURE
// ========================================
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!signature || !secret) {
    return res.status(401).json({
      success: false,
      error: 'Webhook no autorizado'
    });
  }
  
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature !== expectedSignature) {
    console.error('🚨 Webhook signature inválida');
    return res.status(403).json({
      success: false,
      error: 'Signature inválida'
    });
  }
  
  next();
};

// ========================================
// 🚫 PREVENCIÓN DE INYECCIÓN SQL
// ========================================
const preventSqlInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi
  ];

  const checkInjection = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        for (const pattern of sqlPatterns) {
          if (pattern.test(obj[key])) {
            console.error('🚨 ALERTA: Posible SQL Injection detectada', {
              key,
              value: obj[key],
              ip: req.ip
            });
            return true;
          }
        }
      } else if (typeof obj[key] === 'object') {
        if (checkInjection(obj[key])) return true;
      }
    }
    return false;
  };

  if (checkInjection(req.body) || checkInjection(req.query) || checkInjection(req.params)) {
    return res.status(400).json({
      success: false,
      error: 'Entrada sospechosa detectada',
      code: 'SUSPICIOUS_INPUT'
    });
  }

  next();
};

// ========================================
// EXPORTS
// ========================================
module.exports = {
  helmetConfig,
  generalLimiter,
  authLimiter,
  webhookLimiter,
  publicApiLimiter,
  corsConfig,
  sanitizeInputs,
  validateEmail,
  validatePhone,
  validatePassword,
  handleValidationErrors,
  securityLogger,
  verifyWebhookSignature,
  preventSqlInjection
};
