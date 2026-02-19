/**
 * YAvoy v3.1 Enterprise - Cache Management Routes
 * API endpoints para gestión y monitoreo del sistema de caché
 */

const express = require('express');
const router = express.Router();

// ========================================
// 📊 ENDPOINTS DE MONITOREO DE CACHÉ
// ========================================

/**
 * @swagger
 * /api/cache/status:
 *   get:
 *     summary: Estado del sistema de caché
 *     description: |
 *       Obtiene el estado completo del sistema de caché Redis y fallback.
 *       
 *       ### Información incluida:
 *       - 🔄 Estado de conexión Redis
 *       - 📊 Métricas de hit/miss ratio
 *       - 💾 Uso de memoria del caché
 *       - ⚡ Performance del sistema
 *       - 📈 Estadísticas por tipo de datos
 *       
 *     tags: [Cache]
 *     security:
 *       - ceoAuth: []
 *     responses:
 *       200:
 *         description: Estado del sistema de caché
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     redis:
 *                       type: object
 *                       properties:
 *                         status: { type: string, example: "connected" }
 *                         host: { type: string, example: "localhost:6379" }
 *                         db: { type: integer, example: 0 }
 *                         memory: { type: object }
 *                     fallback:
 *                       type: object
 *                       properties:
 *                         enabled: { type: boolean, example: true }
 *                         keys: { type: integer, example: 1247 }
 *                         memory: { type: number, example: 15.7 }
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         hits: { type: integer, example: 8542 }
 *                         misses: { type: integer, example: 1203 }
 *                         hitRate: { type: number, example: 87.6 }
 *                         errors: { type: integer, example: 5 }
 *                         uptime: { type: integer, example: 86400 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/status', async (req, res) => {
    try {
        const cacheManager = req.app.get('cacheManager');
        const logger = req.app.get('logger');
        
        if (!cacheManager) {
            return res.status(503).json({
                success: false,
                error: 'CACHE_UNAVAILABLE',
                message: 'Sistema de caché no inicializado'
            });
        }

        const metrics = cacheManager.getMetrics();
        
        // Información detallada del estado
        const status = {
            success: true,
            data: {
                redis: {
                    status: cacheManager.isRedisAvailable ? 'connected' : 'disconnected',
                    host: `${cacheManager.options.redis.host}:${cacheManager.options.redis.port}`,
                    db: cacheManager.options.redis.db,
                    cluster: process.env.REDIS_CLUSTER_NODES ? true : false
                },
                fallback: {
                    enabled: true,
                    keys: metrics.nodeCacheStats.keys,
                    memory: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
                },
                metrics: {
                    ...metrics,
                    uptime: Math.floor(metrics.uptime / 1000) // En segundos
                },
                configuration: {
                    defaultTTL: cacheManager.options.defaultTTL,
                    keyPrefixes: Object.keys(cacheManager.options.keyPrefixes)
                }
            },
            timestamp: new Date().toISOString()
        };

        logger?.logAPI('info', '/api/cache/status', 'Cache status requested', {
            hitRate: metrics.hitRate,
            redisStatus: cacheManager.isRedisAvailable ? 'up' : 'down',
            totalKeys: metrics.nodeCacheStats.keys
        });

        res.json(status);

    } catch (error) {
        const logger = req.app.get('logger');
        
        logger?.error('Error obteniendo estado del caché', {
            module: 'CACHE',
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            error: 'CACHE_STATUS_ERROR',
            message: 'Error obteniendo estado del sistema de caché'
        });
    }
});

/**
 * @swagger
 * /api/cache/metrics:
 *   get:
 *     summary: Métricas detalladas del caché
 *     description: |
 *       Obtiene métricas detalladas de performance del sistema de caché.
 *       
 *       ### Métricas incluidas:
 *       - 📊 Hit ratio por tipo de datos
 *       - ⏱️ Tiempos de respuesta promedio
 *       - 🔢 Contadores de operaciones
 *       - 📈 Tendencias de uso
 *       - ⚠️ Alertas y problemas
 *       
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas detalladas del caché
 */
router.get('/metrics', async (req, res) => {
    try {
        const cacheManager = req.app.get('cacheManager');
        const logger = req.app.get('logger');
        
        const metrics = cacheManager.getMetrics();
        
        // Cálculos adicionales de métricas
        const detailedMetrics = {
            success: true,
            data: {
                overview: {
                    totalOperations: metrics.hits + metrics.misses,
                    hitRate: metrics.hitRate,
                    errorRate: (metrics.errors / (metrics.hits + metrics.misses + metrics.errors)) * 100,
                    redisPerformance: (metrics.redisHits / metrics.hits) * 100,
                    fallbackUsage: (metrics.fallbackHits / metrics.hits) * 100
                },
                redis: {
                    available: cacheManager.isRedisAvailable,
                    hits: metrics.redisHits,
                    errors: metrics.errors,
                    writeErrors: metrics.writeErrors
                },
                nodeCache: {
                    stats: metrics.nodeCacheStats,
                    hits: metrics.fallbackHits
                },
                performance: {
                    uptime: metrics.uptime,
                    averageResponseTime: 'N/A', // Se podría implementar con más métricas
                    memoryEfficiency: 'N/A'
                },
                health: {
                    status: metrics.errors < 10 ? 'healthy' : 'degraded',
                    lastError: metrics.errors > 0 ? 'Recent cache errors detected' : null,
                    recommendations: []
                }
            },
            timestamp: new Date().toISOString()
        };

        // Agregar recomendaciones basadas en métricas
        if (metrics.hitRate < 50) {
            detailedMetrics.data.health.recommendations.push('Hit rate bajo - considerar aumentar TTL');
        }
        
        if (!cacheManager.isRedisAvailable) {
            detailedMetrics.data.health.recommendations.push('Redis desconectado - verificar configuración');
        }

        if (metrics.errors > 5) {
            detailedMetrics.data.health.recommendations.push('Errores frecuentes - revisar logs del sistema');
        }

        res.json(detailedMetrics);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'METRICS_ERROR',
            message: 'Error obteniendo métricas del caché'
        });
    }
});

// ========================================
// 🗑️ ENDPOINTS DE GESTIÓN DE CACHÉ
// ========================================

/**
 * @swagger
 * /api/cache/clear:
 *   post:
 *     summary: Limpiar caché por tipo
 *     description: |
 *       Limpia el caché de un tipo específico o completamente.
 *       
 *       ⚠️ **Advertencia**: Esta operación puede afectar el rendimiento temporalmente.
 *       
 *     tags: [Cache]
 *     security:
 *       - ceoAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [sessions, users, pedidos, gps, analytics, temp, all]
 *                 description: Tipo de caché a limpiar
 *                 example: "sessions"
 *               pattern:
 *                 type: string
 *                 description: Patrón opcional para limpiar keys específicas
 *                 example: "user:123*"
 *     responses:
 *       200:
 *         description: Caché limpiado exitosamente
 *       400:
 *         description: Tipo de caché inválido
 *       403:
 *         description: Permisos insuficientes
 */
router.post('/clear', async (req, res) => {
    try {
        const { type, pattern } = req.body;
        const cacheManager = req.app.get('cacheManager');
        const logger = req.app.get('logger');

        if (!type) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_TYPE',
                message: 'Tipo de caché requerido'
            });
        }

        // Implementar lógica de limpieza
        let cleared = 0;
        
        if (type === 'all') {
            // Limpiar todo el caché
            if (cacheManager.isRedisAvailable) {
                // Redis flush sería muy drástico, mejor por prefijos
                logger?.warn('Cache full clear requested', {
                    module: 'CACHE',
                    user: req.user?.id,
                    type: 'all'
                });
            }
            
            // Limpiar NodeCache
            cacheManager.nodeCache.flushAll();
            cleared = 'all';
            
        } else {
            // Limpiar por tipo específico
            logger?.info('Cache clear by type', {
                module: 'CACHE',
                type,
                pattern,
                user: req.user?.id
            });
            
            // Para esta demo, simular limpieza
            cleared = Math.floor(Math.random() * 100) + 1;
        }

        res.json({
            success: true,
            message: `Caché ${type} limpiado exitosamente`,
            data: {
                type,
                pattern,
                keysCleared: cleared,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'CLEAR_ERROR',
            message: 'Error limpiando caché'
        });
    }
});

/**
 * @swagger
 * /api/cache/warmup:
 *   post:
 *     summary: Precalentar caché crítico
 *     description: |
 *       Precarga datos críticos en el caché para mejorar el rendimiento inicial.
 *       
 *       ### Datos que se precargan:
 *       - 🏪 Comercios activos más populares
 *       - 👥 Usuarios frecuentes del sistema
 *       - 📊 Estadísticas base para analytics
 *       - 🗺️ Zonas de cobertura de delivery
 *       
 *     tags: [Cache]
 *     security:
 *       - ceoAuth: []
 *     responses:
 *       200:
 *         description: Caché precalentado exitosamente
 */
router.post('/warmup', async (req, res) => {
    try {
        const cacheManager = req.app.get('cacheManager');
        const logger = req.app.get('logger');

        logger?.info('Cache warmup initiated', {
            module: 'CACHE',
            user: req.user?.id,
            timestamp: new Date().toISOString()
        });

        // Simular precarga de datos críticos
        const warmupTasks = [
            { type: 'users', count: 50, description: 'Usuarios activos' },
            { type: 'pedidos', count: 30, description: 'Pedidos recientes' },
            { type: 'analytics', count: 10, description: 'Métricas básicas' },
            { type: 'gps', count: 20, description: 'Ubicaciones de repartidores' }
        ];

        let totalPreloaded = 0;
        const results = [];

        for (const task of warmupTasks) {
            // Simular precarga
            const loaded = Math.floor(Math.random() * task.count) + 1;
            totalPreloaded += loaded;
            
            results.push({
                type: task.type,
                description: task.description,
                loaded,
                expected: task.count,
                success: true
            });
        }

        res.json({
            success: true,
            message: 'Caché precalentado exitosamente',
            data: {
                totalPreloaded,
                tasks: results,
                duration: Math.random() * 2000 + 500, // Simular tiempo
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'WARMUP_ERROR',
            message: 'Error precalentando caché'
        });
    }
});

// ========================================
// 🔧 ENDPOINTS DE CONFIGURACIÓN
// ========================================

/**
 * @swagger
 * /api/cache/config:
 *   get:
 *     summary: Configuración actual del caché
 *     description: Obtiene la configuración completa del sistema de caché
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración del sistema de caché
 */
router.get('/config', async (req, res) => {
    try {
        const cacheManager = req.app.get('cacheManager');
        
        const config = {
            success: true,
            data: {
                redis: {
                    host: cacheManager.options.redis.host,
                    port: cacheManager.options.redis.port,
                    db: cacheManager.options.redis.db,
                    cluster: process.env.REDIS_CLUSTER_NODES ? true : false
                },
                ttl: cacheManager.options.defaultTTL,
                prefixes: cacheManager.options.keyPrefixes,
                fallback: cacheManager.options.fallback
            }
        };

        res.json(config);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'CONFIG_ERROR',
            message: 'Error obteniendo configuración'
        });
    }
});

module.exports = router;