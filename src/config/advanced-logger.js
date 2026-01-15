/**
 * YAvoy v3.1 Enterprise - Advanced Logging System
 * Sistema de logging enterprise con Winston y monitoreo avanzado
 * CTO: Logs estructurados, alertas automáticas, métricas en tiempo real
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs').promises;

class AdvancedLogger {
    constructor() {
        this.logDir = './logs';
        this.alertThresholds = {
            error: 10,      // Máximo 10 errores por minuto
            warn: 50,       // Máximo 50 warnings por minuto
            critical: 1     // Cualquier log crítico genera alerta
        };
        this.metrics = {
            logs: { total: 0, error: 0, warn: 0, info: 0, debug: 0 },
            lastMinute: new Map(),
            alerts: []
        };
        this.alertCallbacks = new Set();
        
        this.init();
    }

    async init() {
        await this.ensureLogDirectory();
        this.createLogger();
        this.setupMetricsCollection();
        this.setupHealthMonitoring();
        
        console.log('📊 Advanced Logger Enterprise inicializado');
    }

    async ensureLogDirectory() {
        try {
            await fs.access(this.logDir);
        } catch {
            await fs.mkdir(this.logDir, { recursive: true });
            console.log(`✓ Directorio de logs creado: ${this.logDir}`);
        }
    }

    createLogger() {
        // Formato personalizado para logs
        const customFormat = winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
            winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                let log = `${timestamp} [${level.toUpperCase()}]`;
                
                if (meta.module) log += ` [${meta.module}]`;
                if (meta.userId) log += ` [User:${meta.userId}]`;
                if (meta.ip) log += ` [IP:${meta.ip}]`;
                if (meta.requestId) log += ` [Req:${meta.requestId}]`;
                
                log += `: ${message}`;
                
                if (stack) log += `\n${stack}`;
                if (meta.duration) log += ` (${meta.duration}ms)`;
                if (meta.extra) log += `\nExtra: ${JSON.stringify(meta.extra)}`;
                
                return log;
            })
        );

        // Transports para diferentes niveles
        const transports = [
            // Console para desarrollo
            new winston.transports.Console({
                level: process.env.LOG_LEVEL || 'info',
                format: winston.format.combine(
                    winston.format.colorize(),
                    customFormat
                )
            }),

            // Archivo general rotativo
            new DailyRotateFile({
                filename: path.join(this.logDir, 'yavoy-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxSize: '50m',
                maxFiles: '30d',
                level: 'info',
                format: customFormat
            }),

            // Archivo de errores separado
            new DailyRotateFile({
                filename: path.join(this.logDir, 'errors-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '60d',
                level: 'error',
                format: customFormat
            }),

            // Archivo de seguridad
            new DailyRotateFile({
                filename: path.join(this.logDir, 'security-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxSize: '10m',
                maxFiles: '90d',
                level: 'warn',
                format: customFormat,
                handleExceptions: false
            }),

            // Archivo de performance
            new DailyRotateFile({
                filename: path.join(this.logDir, 'performance-%DATE%.log'),
                datePattern: 'YYYY-MM-DD-HH',
                maxSize: '100m',
                maxFiles: '7d',
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                )
            })
        ];

        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: customFormat,
            transports,
            exceptionHandlers: [
                new winston.transports.File({ 
                    filename: path.join(this.logDir, 'exceptions.log'),
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 5
                })
            ],
            rejectionHandlers: [
                new winston.transports.File({ 
                    filename: path.join(this.logDir, 'rejections.log'),
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 5
                })
            ],
            exitOnError: false
        });

        // Hook para capturar logs y generar métricas
        this.logger.on('logged', (info) => {
            this.collectLogMetrics(info);
        });
    }

    // ========================================
    // 📊 MÉTODOS DE LOGGING MEJORADOS
    // ========================================

    logSecurity(level, message, meta = {}) {
        this.logger.log(level, `[SECURITY] ${message}`, {
            ...meta,
            module: 'SECURITY',
            timestamp: new Date().toISOString()
        });
        
        if (level === 'error') {
            this.triggerAlert('security', message, meta);
        }
    }

    logPerformance(operation, duration, meta = {}) {
        const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
        
        this.logger.log(level, `Performance: ${operation}`, {
            ...meta,
            module: 'PERFORMANCE',
            operation,
            duration,
            slow: duration > 1000
        });

        if (duration > 10000) {
            this.triggerAlert('performance', `Slow operation: ${operation} (${duration}ms)`, meta);
        }
    }

    logDatabase(level, operation, meta = {}) {
        this.logger.log(level, `DB: ${operation}`, {
            ...meta,
            module: 'DATABASE',
            operation
        });
    }

    logAPI(req, res, responseTime) {
        const meta = {
            module: 'API',
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            duration: responseTime,
            requestId: req.id || 'unknown'
        };

        const level = res.statusCode >= 500 ? 'error' : 
                     res.statusCode >= 400 ? 'warn' : 'info';
        
        this.logger.log(level, `${req.method} ${req.url} ${res.statusCode}`, meta);
    }

    logWebSocket(event, socketId, meta = {}) {
        this.logger.info(`WebSocket: ${event}`, {
            ...meta,
            module: 'WEBSOCKET',
            socketId,
            event
        });
    }

    logBusinessEvent(event, userId, meta = {}) {
        this.logger.info(`Business: ${event}`, {
            ...meta,
            module: 'BUSINESS',
            userId,
            event,
            timestamp: new Date().toISOString()
        });
    }

    // ========================================
    // 🚨 SISTEMA DE ALERTAS
    // ========================================

    collectLogMetrics(logInfo) {
        this.metrics.logs.total++;
        this.metrics.logs[logInfo.level] = (this.metrics.logs[logInfo.level] || 0) + 1;

        // Tracking por minuto para alertas
        const minute = Math.floor(Date.now() / 60000);
        if (!this.metrics.lastMinute.has(minute)) {
            this.metrics.lastMinute.set(minute, { error: 0, warn: 0, total: 0 });
        }
        
        const minuteStats = this.metrics.lastMinute.get(minute);
        minuteStats.total++;
        if (logInfo.level === 'error') minuteStats.error++;
        if (logInfo.level === 'warn') minuteStats.warn++;

        // Limpiar métricas antiguas
        this.cleanOldMetrics();
        
        // Verificar thresholds para alertas
        this.checkAlertThresholds(minute, minuteStats, logInfo);
    }

    checkAlertThresholds(minute, minuteStats, logInfo) {
        const alerts = [];

        if (minuteStats.error >= this.alertThresholds.error) {
            alerts.push({
                type: 'HIGH_ERROR_RATE',
                message: `${minuteStats.error} errores en el último minuto`,
                severity: 'high',
                minute
            });
        }

        if (minuteStats.warn >= this.alertThresholds.warn) {
            alerts.push({
                type: 'HIGH_WARNING_RATE',
                message: `${minuteStats.warn} warnings en el último minuto`,
                severity: 'medium',
                minute
            });
        }

        if (logInfo.level === 'error' && logInfo.module === 'SECURITY') {
            alerts.push({
                type: 'SECURITY_INCIDENT',
                message: logInfo.message,
                severity: 'critical',
                minute
            });
        }

        alerts.forEach(alert => this.triggerAlert(alert.type, alert.message, { severity: alert.severity }));
    }

    triggerAlert(type, message, meta = {}) {
        const alert = {
            type,
            message,
            severity: meta.severity || 'medium',
            timestamp: new Date().toISOString(),
            meta
        };

        this.metrics.alerts.push(alert);
        
        // Mantener solo las últimas 100 alertas
        if (this.metrics.alerts.length > 100) {
            this.metrics.alerts = this.metrics.alerts.slice(-100);
        }

        // Notificar a callbacks registrados
        this.alertCallbacks.forEach(callback => {
            try {
                callback(alert);
            } catch (error) {
                console.error('Error ejecutando callback de alerta:', error);
            }
        });

        // Log de la alerta
        this.logger.error(`ALERT [${type}]: ${message}`, {
            module: 'ALERTING',
            alertType: type,
            severity: alert.severity,
            ...meta
        });
    }

    onAlert(callback) {
        this.alertCallbacks.add(callback);
        return () => this.alertCallbacks.delete(callback);
    }

    cleanOldMetrics() {
        const cutoff = Math.floor(Date.now() / 60000) - 5; // 5 minutos atrás
        
        for (const [minute, stats] of this.metrics.lastMinute) {
            if (minute < cutoff) {
                this.metrics.lastMinute.delete(minute);
            }
        }
    }

    // ========================================
    // 📈 MONITOREO DE SALUD
    // ========================================

    setupHealthMonitoring() {
        // Health check cada 30 segundos
        setInterval(() => {
            this.performHealthCheck();
        }, 30000);
    }

    setupMetricsCollection() {
        // Recolectar métricas del sistema cada minuto
        setInterval(() => {
            this.collectSystemMetrics();
        }, 60000);
    }

    async performHealthCheck() {
        const health = {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            logs: {
                totalLogs: this.metrics.logs.total,
                recentErrors: Array.from(this.metrics.lastMinute.values())
                    .reduce((sum, stats) => sum + stats.error, 0),
                activeAlerts: this.metrics.alerts.filter(a => 
                    new Date(a.timestamp) > new Date(Date.now() - 5 * 60 * 1000)
                ).length
            }
        };

        this.logPerformance('health_check', 0, { health });
        
        // Alertas de salud del sistema
        if (health.memory.heapUsed > 500 * 1024 * 1024) { // 500MB
            this.triggerAlert('HIGH_MEMORY_USAGE', 
                `Uso de memoria: ${Math.round(health.memory.heapUsed / 1024 / 1024)}MB`,
                { severity: 'medium', memory: health.memory }
            );
        }

        return health;
    }

    collectSystemMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            process: {
                pid: process.pid,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            },
            logs: { ...this.metrics.logs },
            activeConnections: global.socketConnections || 0
        };

        this.logger.info('System metrics collected', {
            module: 'METRICS',
            metrics
        });
    }

    // ========================================
    // 📊 GETTERS Y ESTADÍSTICAS
    // ========================================

    getMetrics() {
        return {
            logs: { ...this.metrics.logs },
            recentAlerts: this.metrics.alerts.slice(-10),
            lastMinuteStats: Object.fromEntries(this.metrics.lastMinute),
            alertCallbacksCount: this.alertCallbacks.size
        };
    }

    async getLogFiles() {
        try {
            const files = await fs.readdir(this.logDir);
            const logFiles = await Promise.all(
                files.filter(file => file.endsWith('.log')).map(async file => {
                    const stats = await fs.stat(path.join(this.logDir, file));
                    return {
                        name: file,
                        size: stats.size,
                        modified: stats.mtime
                    };
                })
            );
            return logFiles;
        } catch (error) {
            this.logger.error('Error obteniendo archivos de log', { error: error.message });
            return [];
        }
    }

    // Proxy para métodos estándar de winston
    info(message, meta = {}) { this.logger.info(message, meta); }
    warn(message, meta = {}) { this.logger.warn(message, meta); }
    error(message, meta = {}) { this.logger.error(message, meta); }
    debug(message, meta = {}) { this.logger.debug(message, meta); }
}

module.exports = AdvancedLogger;