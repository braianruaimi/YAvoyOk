/**
 * YAvoy v3.1 Enterprise - CEO Security Middleware Elite
 * Protección de grado militar para el panel de CEO
 * CTO: Implementación de seguridad multicapa y blindaje anti-intrusión
 */

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

class CEOSecurityMiddleware {
    constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET || 'YAvoy_Enterprise_v3.1_CEO_Secret_Key_Ultra_Secure_2026';
        this.ADMIN_IPS = process.env.ADMIN_IPS ? process.env.ADMIN_IPS.split(',') : [];
        this.securityLogs = [];
        this.suspiciousActivities = new Map();
        this.blockedIPs = new Set();
        
        this.init();
    }

    /**
     * Inicializar sistema de seguridad
     */
    init() {
        console.log('🛡️ CEO Security Middleware v3.1 Enterprise iniciado');
        console.log('🔐 Configurando protección multicapa para panel CEO');
    }

    /**
     * Rate Limiting específico para CEO
     */
    getCEORateLimiter() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 50, // Máximo 50 requests por IP en 15 minutos
            message: {
                error: 'Demasiados intentos de acceso al panel CEO',
                code: 'CEO_RATE_LIMIT_EXCEEDED',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false,
            skip: (req) => {
                // Skip para IPs de admin autorizadas
                return this.ADMIN_IPS.includes(req.ip);
            },
            handler: (req, res, next, options) => {
                this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    path: req.path,
                    timestamp: new Date().toISOString()
                });
                res.status(options.statusCode).json(options.message);
            }
        });
    }

    /**
     * Rate Limiting ultra-estricto para login CEO
     */
    getCEOLoginLimiter() {
        return rateLimit({
            windowMs: 30 * 60 * 1000, // 30 minutos
            max: 5, // Máximo 5 intentos de login en 30 minutos
            message: {
                error: 'Demasiados intentos de login al panel CEO. Cuenta bloqueada temporalmente.',
                code: 'CEO_LOGIN_RATE_LIMIT',
                retryAfter: '30 minutes'
            },
            skipSuccessfulRequests: true,
            handler: (req, res, next, options) => {
                this.addSuspiciousActivity(req.ip, 'EXCESSIVE_LOGIN_ATTEMPTS');
                this.logSecurityEvent('CEO_LOGIN_BLOCKED', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    attempts: req.rateLimit?.current || 'unknown',
                    timestamp: new Date().toISOString()
                });
                
                // Notificar al sistema de alertas
                this.triggerSecurityAlert('CEO_LOGIN_BLOCKED', req);
                res.status(options.statusCode).json(options.message);
            }
        });
    }

    /**
     * Middleware de autenticación CEO
     */
    authenticateCEO() {
        return async (req, res, next) => {
            try {
                // Verificar IP bloqueada
                if (this.blockedIPs.has(req.ip)) {
                    this.logSecurityEvent('BLOCKED_IP_ACCESS_ATTEMPT', {
                        ip: req.ip,
                        path: req.path
                    });
                    return res.status(403).json({
                        error: 'Acceso denegado. IP bloqueada por actividad sospechosa.',
                        code: 'IP_BLOCKED'
                    });
                }

                // Verificar token
                const token = this.extractToken(req);
                if (!token) {
                    this.logSecurityEvent('CEO_ACCESS_NO_TOKEN', {
                        ip: req.ip,
                        path: req.path,
                        userAgent: req.get('User-Agent')
                    });
                    return res.status(401).json({
                        error: 'Token de acceso requerido para panel CEO',
                        code: 'NO_TOKEN'
                    });
                }

                // Validar token
                const decoded = jwt.verify(token, this.JWT_SECRET);
                
                // Verificar rol CEO/Admin
                if (!this.isCEORole(decoded.role)) {
                    this.logSecurityEvent('CEO_ACCESS_UNAUTHORIZED_ROLE', {
                        ip: req.ip,
                        userId: decoded.userId,
                        role: decoded.role,
                        path: req.path
                    });
                    return res.status(403).json({
                        error: 'Acceso denegado. Privilegios de CEO/Admin requeridos.',
                        code: 'INSUFFICIENT_PRIVILEGES'
                    });
                }

                // Verificar expiración del token
                if (decoded.exp < Date.now() / 1000) {
                    this.logSecurityEvent('CEO_ACCESS_EXPIRED_TOKEN', {
                        ip: req.ip,
                        userId: decoded.userId
                    });
                    return res.status(401).json({
                        error: 'Token expirado. Vuelve a autenticarte.',
                        code: 'TOKEN_EXPIRED'
                    });
                }

                // Verificar sesión activa
                if (!await this.isValidSession(decoded.userId, token)) {
                    this.logSecurityEvent('CEO_ACCESS_INVALID_SESSION', {
                        ip: req.ip,
                        userId: decoded.userId
                    });
                    return res.status(401).json({
                        error: 'Sesión inválida. Vuelve a iniciar sesión.',
                        code: 'INVALID_SESSION'
                    });
                }

                // Verificar geolocalización (si está habilitada)
                if (process.env.CEO_GEO_RESTRICTION === 'true') {
                    const geoCheck = await this.verifyGeolocation(req.ip, decoded.userId);
                    if (!geoCheck.allowed) {
                        this.logSecurityEvent('CEO_ACCESS_GEO_BLOCKED', {
                            ip: req.ip,
                            userId: decoded.userId,
                            location: geoCheck.location
                        });
                        return res.status(403).json({
                            error: 'Acceso denegado desde esta ubicación geográfica.',
                            code: 'GEO_RESTRICTED'
                        });
                    }
                }

                // Log acceso exitoso
                this.logSecurityEvent('CEO_ACCESS_GRANTED', {
                    ip: req.ip,
                    userId: decoded.userId,
                    path: req.path,
                    userAgent: req.get('User-Agent')
                });

                // Agregar info del usuario a la request
                req.user = decoded;
                req.user.isAdmin = true;
                req.user.isCEO = true;

                next();

            } catch (error) {
                console.error('❌ Error en autenticación CEO:', error);
                
                this.logSecurityEvent('CEO_AUTH_ERROR', {
                    ip: req.ip,
                    error: error.message,
                    path: req.path
                });

                return res.status(401).json({
                    error: 'Error de autenticación. Token inválido.',
                    code: 'AUTH_ERROR'
                });
            }
        };
    }

    /**
     * Middleware de autorización para funciones específicas CEO
     */
    authorizeCEOAction(action) {
        return async (req, res, next) => {
            try {
                const user = req.user;
                
                if (!user || !user.isCEO) {
                    return res.status(403).json({
                        error: 'Acción reservada para CEO/Admin',
                        code: 'CEO_ACTION_DENIED'
                    });
                }

                // Verificar permisos específicos por acción
                const hasPermission = await this.checkCEOPermission(user.userId, action);
                if (!hasPermission) {
                    this.logSecurityEvent('CEO_ACTION_UNAUTHORIZED', {
                        userId: user.userId,
                        action: action,
                        ip: req.ip
                    });
                    
                    return res.status(403).json({
                        error: `No tienes permisos para: ${action}`,
                        code: 'ACTION_UNAUTHORIZED'
                    });
                }

                // Log acción autorizada
                this.logSecurityEvent('CEO_ACTION_AUTHORIZED', {
                    userId: user.userId,
                    action: action,
                    ip: req.ip
                });

                next();

            } catch (error) {
                console.error('❌ Error en autorización CEO:', error);
                return res.status(500).json({
                    error: 'Error interno de autorización',
                    code: 'AUTH_INTERNAL_ERROR'
                });
            }
        };
    }

    /**
     * Middleware de detección de intrusiones
     */
    intrusionDetection() {
        return (req, res, next) => {
            const suspiciousPatterns = [
                /admin|administrator|root|sudo/i,
                /\.\.|\/etc\/|\/var\/|\/tmp\//,
                /<script|javascript:|onclick=/i,
                /union.*select|drop.*table|insert.*into/i
            ];

            const requestData = JSON.stringify({
                url: req.url,
                query: req.query,
                body: req.body,
                headers: req.headers
            });

            // Verificar patrones sospechosos
            for (const pattern of suspiciousPatterns) {
                if (pattern.test(requestData)) {
                    this.addSuspiciousActivity(req.ip, 'SUSPICIOUS_PATTERN');
                    this.logSecurityEvent('INTRUSION_ATTEMPT', {
                        ip: req.ip,
                        pattern: pattern.toString(),
                        data: requestData,
                        userAgent: req.get('User-Agent')
                    });
                    
                    // Bloquear IP después de múltiples intentos
                    if (this.getSuspiciousActivityCount(req.ip) >= 3) {
                        this.blockedIPs.add(req.ip);
                        this.triggerSecurityAlert('IP_BLOCKED_INTRUSION', req);
                    }
                    
                    return res.status(403).json({
                        error: 'Actividad sospechosa detectada',
                        code: 'INTRUSION_DETECTED'
                    });
                }
            }

            next();
        };
    }

    /**
     * Middleware de protección CSRF para CEO
     */
    csrfProtection() {
        return (req, res, next) => {
            // Solo aplicar a métodos que modifican datos
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
                const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
                const sessionToken = req.user ? req.user.csrfToken : null;

                if (!csrfToken || csrfToken !== sessionToken) {
                    this.logSecurityEvent('CEO_CSRF_ATTACK', {
                        ip: req.ip,
                        userId: req.user ? req.user.userId : 'unknown',
                        method: req.method,
                        path: req.path
                    });

                    return res.status(403).json({
                        error: 'Token CSRF inválido o faltante',
                        code: 'CSRF_TOKEN_INVALID'
                    });
                }
            }

            next();
        };
    }

    /**
     * Extraer token JWT de la request
     */
    extractToken(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        
        // También verificar en cookies
        return req.cookies ? req.cookies.yavoy_token : null;
    }

    /**
     * Verificar si el rol es CEO/Admin
     */
    isCEORole(role) {
        const ceoRoles = ['ceo', 'admin', 'administrator', 'super_admin'];
        return ceoRoles.includes(role.toLowerCase());
    }

    /**
     * Verificar sesión válida
     */
    async isValidSession(userId, token) {
        // Aquí implementarías la verificación con tu base de datos de sesiones
        // Por ahora, simulamos una verificación básica
        return true;
    }

    /**
     * Verificar geolocalización
     */
    async verifyGeolocation(ip, userId) {
        // Implementar verificación de geolocalización si es necesario
        return { allowed: true, location: 'local' };
    }

    /**
     * Verificar permisos específicos de CEO
     */
    async checkCEOPermission(userId, action) {
        // Implementar sistema de permisos granulares
        const adminActions = [
            'view_analytics',
            'manage_users',
            'system_config',
            'financial_reports',
            'security_logs',
            'backup_system'
        ];
        
        return adminActions.includes(action);
    }

    /**
     * Agregar actividad sospechosa
     */
    addSuspiciousActivity(ip, type) {
        if (!this.suspiciousActivities.has(ip)) {
            this.suspiciousActivities.set(ip, []);
        }
        
        this.suspiciousActivities.get(ip).push({
            type,
            timestamp: new Date(),
            count: 1
        });

        // Limpiar actividades antiguas (más de 1 hora)
        this.cleanupOldActivities(ip);
    }

    /**
     * Obtener contador de actividades sospechosas
     */
    getSuspiciousActivityCount(ip) {
        const activities = this.suspiciousActivities.get(ip) || [];
        return activities.length;
    }

    /**
     * Limpiar actividades antiguas
     */
    cleanupOldActivities(ip) {
        const activities = this.suspiciousActivities.get(ip) || [];
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        const recentActivities = activities.filter(activity => 
            activity.timestamp > oneHourAgo
        );
        
        this.suspiciousActivities.set(ip, recentActivities);
    }

    /**
     * Registrar evento de seguridad
     */
    logSecurityEvent(event, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            data,
            severity: this.getEventSeverity(event)
        };

        this.securityLogs.push(logEntry);
        
        // Mantener solo los últimos 1000 logs en memoria
        if (this.securityLogs.length > 1000) {
            this.securityLogs = this.securityLogs.slice(-1000);
        }

        // Log en consola para eventos críticos
        if (logEntry.severity === 'HIGH' || logEntry.severity === 'CRITICAL') {
            console.warn(`🚨 SECURITY EVENT [${event}]:`, data);
        }

        // Aquí podrías enviar a un sistema de logging externo
        this.sendToSecurityLogger(logEntry);
    }

    /**
     * Determinar severidad del evento
     */
    getEventSeverity(event) {
        const severityMap = {
            'CEO_ACCESS_GRANTED': 'LOW',
            'CEO_ACCESS_NO_TOKEN': 'MEDIUM',
            'CEO_ACCESS_UNAUTHORIZED_ROLE': 'HIGH',
            'CEO_ACCESS_EXPIRED_TOKEN': 'MEDIUM',
            'CEO_ACCESS_INVALID_SESSION': 'HIGH',
            'CEO_ACCESS_GEO_BLOCKED': 'HIGH',
            'INTRUSION_ATTEMPT': 'CRITICAL',
            'CEO_CSRF_ATTACK': 'HIGH',
            'RATE_LIMIT_EXCEEDED': 'MEDIUM',
            'IP_BLOCKED_INTRUSION': 'CRITICAL'
        };

        return severityMap[event] || 'LOW';
    }

    /**
     * Enviar a sistema de logging externo
     */
    sendToSecurityLogger(logEntry) {
        // Implementar integración con sistema de logging
        // (Elasticsearch, Splunk, etc.)
    }

    /**
     * Disparar alerta de seguridad
     */
    triggerSecurityAlert(type, req) {
        // Implementar sistema de alertas
        // (Email, Slack, SMS, etc.)
        console.log(`🚨 SECURITY ALERT [${type}]:`, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Obtener logs de seguridad (para dashboard CEO)
     */
    getSecurityLogs(limit = 100) {
        return this.securityLogs
            .slice(-limit)
            .reverse(); // Más recientes primero
    }

    /**
     * Obtener estadísticas de seguridad
     */
    getSecurityStats() {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recentLogs = this.securityLogs.filter(log => 
            new Date(log.timestamp) > last24h
        );

        return {
            totalEvents: this.securityLogs.length,
            last24h: recentLogs.length,
            blockedIPs: this.blockedIPs.size,
            suspiciousActivities: this.suspiciousActivities.size,
            severityBreakdown: this.getSeverityBreakdown(recentLogs)
        };
    }

    /**
     * Obtener breakdown por severidad
     */
    getSeverityBreakdown(logs) {
        return logs.reduce((acc, log) => {
            acc[log.severity] = (acc[log.severity] || 0) + 1;
            return acc;
        }, {});
    }
}

module.exports = CEOSecurityMiddleware;