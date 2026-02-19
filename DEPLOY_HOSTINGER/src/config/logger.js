/**
 * ========================================
 * WINSTON LOGGER - CONFIGURACIÓN PROFESIONAL
 * ========================================
 * 
 * Sistema de logs de nivel empresarial para producción en Hostinger VPS
 * 
 * CARACTERÍSTICAS:
 * ✅ Rotación diaria automática (logs/error-YYYY-MM-DD.log)
 * ✅ Logs HTTP en archivos separados
 * ✅ Logs de errores en MySQL (tabla system_logs)
 * ✅ Niveles: error, warn, info, http, debug
 * ✅ Compresión automática de logs antiguos
 * ✅ Retención de 14 días en disco
 * ✅ Console output con colores en desarrollo
 * 
 * @version 1.0.0
 * @date 21 de diciembre de 2025
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const mysql = require('mysql2/promise');

// Pool de MySQL para logs en DB
let pool;

function setDatabasePool(dbPool) {
    pool = dbPool;
}

// ============================================
// FORMATOS PERSONALIZADOS
// ============================================

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// ============================================
// TRANSPORTS
// ============================================

const transports = [];

// 1. Console (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.Console({
            format: consoleFormat,
            level: 'debug'
        })
    );
}

// 2. Archivo de errores con rotación diaria
transports.push(
    new DailyRotateFile({
        filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '14d', // Retener 14 días
        zippedArchive: true,
        auditFile: path.join(__dirname, '../../logs/.error-audit.json')
    })
);

// 3. Archivo combinado con rotación diaria
transports.push(
    new DailyRotateFile({
        filename: path.join(__dirname, '../../logs/combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
        auditFile: path.join(__dirname, '../../logs/.combined-audit.json')
    })
);

// 4. Archivo de HTTP requests
transports.push(
    new DailyRotateFile({
        filename: path.join(__dirname, '../../logs/http-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'http',
        format: logFormat,
        maxSize: '50m',
        maxFiles: '7d', // HTTP logs solo 7 días
        zippedArchive: true,
        auditFile: path.join(__dirname, '../../logs/.http-audit.json')
    })
);

// ============================================
// LOGGER PRINCIPAL
// ============================================

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: logFormat,
    transports,
    exitOnError: false
});

// ============================================
// TRANSPORT PERSONALIZADO: MySQL
// ============================================

/**
 * Guarda logs críticos (error, warn) en la base de datos
 * Tabla: system_logs (id, evento, descripcion, nivel, endpoint, metodo, datos, created_at)
 */
async function logToDatabase(level, message, metadata = {}) {
    if (!pool) {
        // Si aún no hay pool configurado, solo logueamos en archivos
        return;
    }

    try {
        // Solo guardar error y warn en DB para no saturar
        if (level !== 'error' && level !== 'warn') {
            return;
        }

        await pool.query(
            `INSERT INTO system_logs (evento, descripcion, nivel, endpoint, metodo, datos, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
                metadata.evento || 'log_general',
                message,
                level,
                metadata.endpoint || null,
                metadata.metodo || null,
                JSON.stringify({
                    ...metadata,
                    timestamp: new Date().toISOString()
                })
            ]
        );
    } catch (err) {
        // Si falla el log en DB, no queremos romper la aplicación
        console.error('❌ Error al guardar log en MySQL:', err.message);
    }
}

// Extender logger para incluir DB logging
const originalError = logger.error.bind(logger);
const originalWarn = logger.warn.bind(logger);

logger.error = (message, metadata = {}) => {
    originalError(message, metadata);
    logToDatabase('error', message, metadata);
};

logger.warn = (message, metadata = {}) => {
    originalWarn(message, metadata);
    logToDatabase('warn', message, metadata);
};

// ============================================
// MIDDLEWARE DE MORGAN PERSONALIZADO
// ============================================

/**
 * Stream personalizado para que Morgan escriba en Winston
 */
const morganStream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

// ============================================
// HELPER: LOGS DE NEGOCIO
// ============================================

/**
 * Log específico para eventos de negocio importantes
 * Ejemplo: Nuevo pedido, pago exitoso, repartidor asignado, etc.
 */
logger.business = (evento, descripcion, datos = {}) => {
    logger.info(`[BUSINESS] ${evento}`, {
        evento,
        descripcion,
        ...datos
    });

    // Guardar eventos de negocio críticos en DB
    if (pool) {
        pool.query(
            `INSERT INTO system_logs (evento, descripcion, nivel, datos, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [evento, descripcion, 'info', JSON.stringify(datos)]
        ).catch(err => {
            console.error('❌ Error al guardar log de negocio:', err.message);
        });
    }
};

/**
 * Log de performance para medir tiempos de ejecución
 */
logger.performance = (operacion, duracionMs, metadata = {}) => {
    const nivel = duracionMs > 1000 ? 'warn' : 'info'; // Warn si > 1 segundo
    logger[nivel](`[PERFORMANCE] ${operacion} completado en ${duracionMs}ms`, {
        operacion,
        duracionMs,
        ...metadata
    });
};

// ============================================
// LIMPIEZA DE LOGS ANTIGUOS (MANTENIMIENTO)
// ============================================

/**
 * Elimina logs de MySQL mayores a 30 días
 * Ejecutar periódicamente con cron o PM2
 */
async function cleanupOldLogs() {
    if (!pool) return;

    try {
        const result = await pool.query(
            `DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '30 days'`
        );
        logger.info(`[CLEANUP] Logs antiguos eliminados: ${result.rowCount} registros`);
    } catch (err) {
        logger.error('Error al limpiar logs antiguos en DB', { error: err.message });
    }
}

// ============================================
// EXPORTACIONES
// ============================================

module.exports = {
    logger,
    morganStream,
    setDatabasePool,
    cleanupOldLogs
};
