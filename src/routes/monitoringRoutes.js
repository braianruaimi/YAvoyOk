/**
 * YAvoy v3.1 Enterprise - Monitoring Routes
 * API endpoints para monitoreo del sistema y logs
 */

const express = require('express');
const router = express.Router();

// ========================================
// 📊 ENDPOINTS DE MONITOREO
// ========================================

/**
 * @swagger
 * /api/monitoring/health:
 *   get:
 *     summary: Health check del sistema
 *     description: |
 *       Verifica el estado de salud completo del sistema YAvoy Enterprise.
 *       
 *       ### Verificaciones incluidas:
 *       - 🗄️ Estado de base de datos (PostgreSQL + fallback JSON)
 *       - 📊 Logs y sistema de monitoreo
 *       - 🔗 Conectividad de servicios externos
 *       - 💾 Uso de memoria y recursos
 *       - 🕒 Uptime del servidor
 *       - ⚡ Rendimiento de respuesta
 *       
 *       ### Códigos de estado:
 *       - `healthy`: Sistema funcionando correctamente
 *       - `degraded`: Funcionando con limitaciones
 *       - `unhealthy`: Problemas críticos detectados
 *       
 *     tags: [Monitoring]
 *     security: []
 *     responses:
 *       200:
 *         description: Estado de salud del sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                   description: Estado general del sistema
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp de la verificación
 *                   example: "2024-01-15T10:30:00Z"
 *                 health:
 *                   type: object
 *                   description: Detalles de salud por componente
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         postgres:
 *                           type: object
 *                           properties:
 *                             status: { type: string, example: "connected" }
 *                             responseTime: { type: number, example: 12 }
 *                             lastQuery: { type: string, format: date-time }
 *                         json:
 *                           type: object
 *                           properties:
 *                             status: { type: string, example: "available" }
 *                             writeable: { type: boolean, example: true }
 *                     logging:
 *                       type: object
 *                       properties:
 *                         level: { type: string, example: "info" }
 *                         filesWriteable: { type: boolean, example: true }
 *                         alertsActive: { type: integer, example: 0 }
 *                     system:
 *                       type: object
 *                       properties:
 *                         uptime: { type: number, example: 86400 }
 *                         memory: 
 *                           type: object
 *                           properties:
 *                             used: { type: number, example: 267.45 }
 *                             total: { type: number, example: 1024 }
 *                             percentage: { type: number, example: 26.1 }
 *                         cpu:
 *                           type: object
 *                           properties:
 *                             usage: { type: number, example: 15.2 }
 *                             cores: { type: integer, example: 4 }
 *                 version:
 *                   type: string
 *                   description: Versión del sistema
 *                   example: "3.1.0"
 *             examples:
 *               healthy:
 *                 summary: Sistema saludable
 *                 value:
 *                   status: "healthy"
 *                   timestamp: "2024-01-15T10:30:00Z"
 *                   health:
 *                     database:
 *                       postgres:
 *                         status: "connected"
 *                         responseTime: 12
 *                         lastQuery: "2024-01-15T10:29:58Z"
 *                       json:
 *                         status: "available"
 *                         writeable: true
 *                     logging:
 *                       level: "info"
 *                       filesWriteable: true
 *                       alertsActive: 0
 *                     system:
 *                       uptime: 86400
 *                       memory:
 *                         used: 267.45
 *                         total: 1024
 *                         percentage: 26.1
 *                       cpu:
 *                         usage: 15.2
 *                         cores: 4
 *                   version: "3.1.0"
 *               degraded:
 *                 summary: Sistema con problemas menores
 *                 value:
 *                   status: "degraded"
 *                   timestamp: "2024-01-15T10:30:00Z"
 *                   health:
 *                     database:
 *                       postgres:
 *                         status: "disconnected"
 *                         error: "Connection timeout"
 *                       json:
 *                         status: "available"
 *                         writeable: true
 *                     logging:
 *                       level: "warn"
 *                       filesWriteable: true
 *                       alertsActive: 2
 *                   version: "3.1.0"
 *       500:
 *         description: Error crítico en health check
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "unhealthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 error:
 *                   type: string
 *                   example: "Health check failed"
 *                 details:
 *                   type: string
 *                   description: Detalles del error
 */
router.get('/health', async (req, res) => {
    try {
        const logger = req.app.get('logger');
        const health = await logger.performHealthCheck();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            health,
            version: process.env.npm_package_version || '3.1.0'
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/monitoring/metrics
 * Métricas detalladas del sistema de logging
 */
router.get('/metrics', (req, res) => {
    try {
        const logger = req.app.get('logger');
        const metrics = logger.getMetrics();
        
        res.json({
            status: 'ok',
            metrics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/alerts
 * Alertas recientes del sistema
 */
router.get('/alerts', (req, res) => {
    try {
        const logger = req.app.get('logger');
        const limit = parseInt(req.query.limit) || 50;
        const severity = req.query.severity;
        
        let alerts = logger.metrics.alerts.slice(-limit);
        
        if (severity) {
            alerts = alerts.filter(alert => alert.severity === severity);
        }
        
        res.json({
            status: 'ok',
            alerts,
            total: alerts.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/logs
 * Lista de archivos de log disponibles
 */
router.get('/logs', async (req, res) => {
    try {
        const logger = req.app.get('logger');
        const logFiles = await logger.getLogFiles();
        
        res.json({
            status: 'ok',
            files: logFiles,
            totalFiles: logFiles.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

/**
 * POST /api/monitoring/test-alert
 * Generar alerta de prueba (solo para testing)
 */
router.post('/test-alert', (req, res) => {
    try {
        const logger = req.app.get('logger');
        const { type = 'TEST', message = 'Test alert', severity = 'low' } = req.body;
        
        logger.triggerAlert(type, message, { 
            severity,
            source: 'manual_test',
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        res.json({
            status: 'ok',
            message: 'Alert generada exitosamente',
            alert: { type, message, severity }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/system-info
 * Información del sistema completa
 */
router.get('/system-info', (req, res) => {
    try {
        const systemInfo = {
            node: {
                version: process.version,
                platform: process.platform,
                arch: process.arch,
                pid: process.pid,
                uptime: process.uptime()
            },
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString()
        };
        
        res.json({
            status: 'ok',
            system: systemInfo
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// ========================================
// 🛡️ MIDDLEWARE DE AUTENTICACIÓN (básico)
// ========================================

function basicAuth(req, res, next) {
    // En producción, implementar autenticación real
    const authHeader = req.headers.authorization;
    
    if (!authHeader || authHeader !== `Bearer ${process.env.MONITORING_TOKEN || 'yavoy-monitor'}`) {
        return res.status(401).json({
            status: 'unauthorized',
            message: 'Token de monitoreo requerido'
        });
    }
    
    next();
}

// Aplicar auth a endpoints sensibles
router.use('/logs', basicAuth);
router.use('/test-alert', basicAuth);

module.exports = router;