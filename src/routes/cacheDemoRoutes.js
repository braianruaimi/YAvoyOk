/**
 * YAvoy v3.1 Enterprise - Cache Demo Routes
 * Rutas de demostración del sistema de caché
 */

const express = require('express');
const router = express.Router();

// ========================================
// 🧪 DEMOS Y PRUEBAS DE CACHÉ
// ========================================

/**
 * @swagger
 * /api/cache/demo/slow-endpoint:
 *   get:
 *     summary: Endpoint lento para demo de caché
 *     description: |
 *       Endpoint que simula una operación lenta para demostrar el beneficio del caché.
 *       
 *       ### Primera llamada:
 *       - ⏱️ Tarda ~2 segundos (simulación)
 *       - 📊 X-Cache: MISS
 *       
 *       ### Llamadas siguientes (5 min):
 *       - ⚡ Respuesta inmediata
 *       - 📊 X-Cache: HIT
 *       
 *     tags: [Cache]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: ID para variar la cache key
 *         example: "test123"
 *     responses:
 *       200:
 *         description: Datos simulados con información de caché
 *         headers:
 *           X-Cache:
 *             schema:
 *               type: string
 *               enum: [HIT, MISS]
 *           X-Cache-Age:
 *             schema:
 *               type: integer
 *             description: Edad del caché en segundos
 */
router.get('/demo/slow-endpoint', async (req, res) => {
    try {
        const cacheManager = req.app.get('cacheManager');
        const logger = req.app.get('logger');
        const id = req.query.id || 'default';
        
        // Verificar caché primero
        const cached = await cacheManager.get(`slow-demo-${id}`, 'temp');
        
        if (cached) {
            logger?.info('Cache demo hit', {
                module: 'CACHE_DEMO',
                id,
                age: Date.now() - cached.timestamp
            });
            
            res.set({
                'X-Cache': 'HIT',
                'X-Cache-Age': Math.floor((Date.now() - cached.timestamp) / 1000).toString()
            });
            
            return res.json({
                success: true,
                data: cached.data,
                cached: true,
                cacheAge: Date.now() - cached.timestamp,
                timestamp: cached.timestamp
            });
        }
        
        // Cache miss - simular operación lenta
        logger?.info('Cache demo miss - generating data', {
            module: 'CACHE_DEMO',
            id
        });
        
        res.set('X-Cache', 'MISS');
        
        // Simular delay de 2 segundos
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const data = {
            id,
            message: 'Datos generados con operación lenta',
            timestamp: new Date().toISOString(),
            processingTime: '2000ms',
            randomData: {
                value1: Math.floor(Math.random() * 1000),
                value2: Math.random().toFixed(4),
                array: Array.from({length: 5}, () => Math.random().toFixed(2))
            }
        };
        
        // Guardar en caché por 5 minutos
        await cacheManager.set(`slow-demo-${id}`, {
            data,
            timestamp: Date.now()
        }, 'temp', 300);
        
        res.json({
            success: true,
            data,
            cached: false,
            generated: true,
            timestamp: Date.now()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'DEMO_ERROR',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cache/demo/analytics:
 *   get:
 *     summary: Demo de analytics con caché
 *     description: |
 *       Simula una consulta de analytics compleja que se beneficia del caché.
 *       TTL: 1 hora para datos analíticos.
 *       
 *     tags: [Cache]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: Período de análisis
 *         example: "day"
 */
router.get('/demo/analytics', async (req, res) => {
    try {
        const cacheManager = req.app.get('cacheManager');
        const period = req.query.period || 'day';
        
        // Usar caché especializado para analytics
        const cacheMiddleware = req.app.get('cacheMiddleware');
        if (cacheMiddleware) {
            // Aplicar middleware de caché analytics
            return cacheMiddleware.analyticsCache(3600)(req, res, () => {
                // Simular generación de datos analíticos
                setTimeout(() => {
                    const analytics = {
                        period,
                        metrics: {
                            totalPedidos: Math.floor(Math.random() * 1000) + 100,
                            ventasTotal: Math.floor(Math.random() * 50000) + 10000,
                            repartidoresActivos: Math.floor(Math.random() * 50) + 10,
                            comerciosActivos: Math.floor(Math.random() * 200) + 50,
                            tiempoPromedioEntrega: Math.floor(Math.random() * 30) + 20
                        },
                        trends: {
                            pedidosVsAyer: (Math.random() - 0.5) * 20,
                            ventasVsAyer: (Math.random() - 0.5) * 30,
                            satisfaccionCliente: 4.2 + Math.random() * 0.6
                        },
                        generatedAt: new Date().toISOString(),
                        processingTime: '1.5s'
                    };
                    
                    res.json({
                        success: true,
                        data: analytics
                    });
                }, 1500);
            });
        }
        
        // Fallback sin caché
        res.json({
            success: false,
            message: 'Cache middleware no disponible'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'ANALYTICS_ERROR',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cache/demo/rate-limit:
 *   get:
 *     summary: Demo de rate limiting distribuido
 *     description: |
 *       Demuestra el sistema de rate limiting usando caché distribuido.
 *       Límite: 5 requests por minuto por IP.
 *       
 *     tags: [Cache]
 *     responses:
 *       200:
 *         description: Request permitida
 *         headers:
 *           X-RateLimit-Remaining:
 *             schema:
 *               type: integer
 *             description: Requests restantes
 *           X-RateLimit-Reset:
 *             schema:
 *               type: integer
 *             description: Timestamp de reset
 *       429:
 *         description: Rate limit excedido
 */
router.get('/demo/rate-limit', async (req, res) => {
    try {
        const cacheManager = req.app.get('cacheManager');
        const clientIP = req.ip || req.connection.remoteAddress;
        
        // Verificar rate limit (5 requests por minuto)
        const rateLimit = await cacheManager.checkRateLimit(clientIP, 5, 60);
        
        // Establecer headers de rate limit
        res.set({
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
        });
        
        if (!rateLimit.allowed) {
            return res.status(429).json({
                success: false,
                error: 'RATE_LIMIT_EXCEEDED',
                message: 'Demasiadas requests. Intenta más tarde.',
                retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
            });
        }
        
        res.json({
            success: true,
            message: 'Request permitida',
            rateLimit: {
                remaining: rateLimit.remaining,
                resetTime: new Date(rateLimit.resetTime).toISOString()
            },
            clientIP,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'RATE_LIMIT_ERROR',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cache/demo/invalidate:
 *   post:
 *     summary: Demo de invalidación de caché
 *     description: |
 *       Demuestra cómo invalidar entradas específicas del caché.
 *       
 *     tags: [Cache]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 description: Key a invalidar
 *                 example: "slow-demo-test123"
 *               type:
 *                 type: string
 *                 description: Tipo de caché
 *                 example: "temp"
 */
router.post('/demo/invalidate', async (req, res) => {
    try {
        const { key, type = 'temp' } = req.body;
        const cacheManager = req.app.get('cacheManager');
        
        if (!key) {
            return res.status(400).json({
                success: false,
                error: 'KEY_REQUIRED',
                message: 'Key es requerida para invalidación'
            });
        }
        
        const deleted = await cacheManager.del(key, type);
        
        res.json({
            success: true,
            message: `Cache invalidado: ${key}`,
            deleted,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'INVALIDATE_ERROR',
            message: error.message
        });
    }
});

module.exports = router;