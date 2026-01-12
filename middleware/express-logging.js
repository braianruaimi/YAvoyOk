/**
 * YAvoy v3.1 Enterprise - Express Logging Middleware
 * Middleware para integrar el sistema de logging con Express
 */

const { v4: uuidv4 } = require('uuid');

class ExpressLoggingMiddleware {
    constructor(logger) {
        this.logger = logger;
        this.startTime = new Map();
    }

    // Middleware para logging de requests
    requestLogger() {
        return (req, res, next) => {
            // Generar ID único para el request
            req.id = uuidv4();
            
            // Registrar inicio del request
            const startTime = Date.now();
            this.startTime.set(req.id, startTime);

            // Log del request entrante
            this.logger.logAPI(req, { statusCode: 'pending' }, 0);

            // Hook para capturar la respuesta
            const originalSend = res.send;
            const logger = this.logger;
            const startTimeMap = this.startTime;
            
            res.send = (data) => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                
                // Log del response
                logger.logAPI(req, res, responseTime);
                
                // Limpiar memoria
                startTimeMap.delete(req.id);
                
                return originalSend.call(res, data);
            };

            next();
        };
    }

    // Middleware para capturar errores
    errorLogger() {
        return (error, req, res, next) => {
            this.logger.error('Request error', {
                module: 'EXPRESS',
                requestId: req.id,
                method: req.method,
                url: req.url,
                ip: req.ip,
                error: error.message,
                stack: error.stack,
                userAgent: req.get('User-Agent')
            });

            next(error);
        };
    }

    // Middleware para logging de seguridad
    securityLogger() {
        return (req, res, next) => {
            // Detectar patrones sospechosos
            const suspiciousPatterns = [
                /\b(union|select|insert|delete|drop|create|alter)\b/i, // SQL injection
                /<script|javascript:|vbscript:|onload|onerror/i,        // XSS
                /\.\.\//,                                               // Path traversal
                /\.(config|env|log|bak|backup)$/i                     // Config files
            ];

            const isSuspicious = suspiciousPatterns.some(pattern => 
                pattern.test(req.url) || 
                pattern.test(JSON.stringify(req.query)) ||
                pattern.test(JSON.stringify(req.body))
            );

            if (isSuspicious) {
                this.logger.logSecurity('warn', 'Suspicious request detected', {
                    requestId: req.id,
                    method: req.method,
                    url: req.url,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    query: req.query,
                    body: req.body ? JSON.stringify(req.body).substring(0, 200) : null
                });
            }

            // Log de intentos de acceso a endpoints sensibles
            const sensitiveEndpoints = ['/api/ceo', '/api/admin', '/api/monitoring'];
            if (sensitiveEndpoints.some(endpoint => req.url.startsWith(endpoint))) {
                this.logger.logSecurity('info', 'Access to sensitive endpoint', {
                    requestId: req.id,
                    method: req.method,
                    url: req.url,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    authorization: req.headers.authorization ? 'Present' : 'Missing'
                });
            }

            next();
        };
    }

    // Middleware para tracking de performance
    performanceLogger() {
        return (req, res, next) => {
            const start = process.hrtime.bigint();

            res.on('finish', () => {
                const end = process.hrtime.bigint();
                const duration = Number(end - start) / 1000000; // Convert to milliseconds

                if (duration > 1000) { // Log slow requests (>1s)
                    this.logger.logPerformance('slow_request', duration, {
                        requestId: req.id,
                        method: req.method,
                        url: req.url,
                        statusCode: res.statusCode
                    });
                }
            });

            next();
        };
    }

    // Configurar todos los middlewares
    setupMiddlewares(app) {
        // Request ID y logging básico
        app.use(this.requestLogger());
        
        // Security logging
        app.use(this.securityLogger());
        
        // Performance tracking
        app.use(this.performanceLogger());
        
        // Error logging (debe ir al final)
        app.use(this.errorLogger());
        
        console.log('📊 Express logging middlewares configurados');
    }
}

module.exports = ExpressLoggingMiddleware;