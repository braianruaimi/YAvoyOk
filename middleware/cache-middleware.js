/**
 * YAvoy v3.1 Enterprise - Cache Middleware
 * Middleware de caché automático para rutas Express
 */

class CacheMiddleware {
    constructor(cacheManager, logger = null) {
        this.cache = cacheManager;
        this.logger = logger;
        this.defaultOptions = {
            ttl: 300,           // 5 minutos por defecto
            type: 'temp',       // Tipo de caché por defecto
            vary: ['user-agent'], // Headers que afectan el cache
            skipQuery: false,   // Incluir query parameters en la key
            skipBody: true,     // No incluir body en la key (para GET/HEAD)
            condition: null,    // Función para determinar si cachear
            invalidateOn: []    // Eventos que invalidan este cache
        };
    }

    // ========================================
    // 🎯 MIDDLEWARE PRINCIPAL DE CACHÉ
    // ========================================

    /**
     * Middleware principal para cachear responses
     */
    cache(options = {}) {
        const opts = { ...this.defaultOptions, ...options };

        return async (req, res, next) => {
            // Solo cachear métodos seguros
            if (!['GET', 'HEAD'].includes(req.method)) {
                return next();
            }

            // Verificar condición personalizada
            if (opts.condition && !opts.condition(req)) {
                return next();
            }

            try {
                const cacheKey = this.buildCacheKey(req, opts);
                
                // Intentar obtener del caché
                const cached = await this.cache.get(cacheKey, opts.type);
                
                if (cached && !this.isStale(cached, opts)) {
                    this.logger?.info('Cache hit', {
                        module: 'CACHE',
                        key: cacheKey,
                        ttl: cached.ttl,
                        age: Date.now() - cached.timestamp
                    });

                    // Establecer headers de caché
                    this.setCacheHeaders(res, cached, true);
                    
                    return res.status(cached.statusCode)
                        .set(cached.headers)
                        .send(cached.data);
                }

                // Cache miss - continuar y cachear respuesta
                this.logger?.info('Cache miss', {
                    module: 'CACHE',
                    key: cacheKey,
                    reason: cached ? 'stale' : 'not_found'
                });

                // Interceptar la respuesta
                const originalSend = res.send;
                const originalJson = res.json;
                const originalStatus = res.status;
                const originalSet = res.set;
                
                let responseStatus = 200;
                let responseHeaders = {};
                
                // Override status
                res.status = function(code) {
                    responseStatus = code;
                    return originalStatus.call(this, code);
                };

                // Override headers
                res.set = function(field, value) {
                    if (typeof field === 'object') {
                        Object.assign(responseHeaders, field);
                    } else {
                        responseHeaders[field] = value;
                    }
                    return originalSet.call(this, field, value);
                };

                // Override send/json
                const interceptResponse = (data) => {
                    // Solo cachear respuestas exitosas
                    if (responseStatus >= 200 && responseStatus < 300) {
                        const cacheData = {
                            data,
                            statusCode: responseStatus,
                            headers: { ...responseHeaders },
                            timestamp: Date.now(),
                            ttl: opts.ttl,
                            type: opts.type,
                            requestInfo: {
                                url: req.originalUrl,
                                method: req.method,
                                userAgent: req.get('User-Agent'),
                                contentType: res.get('Content-Type')
                            }
                        };

                        // Guardar en caché de forma asíncrona
                        this.cache.set(cacheKey, cacheData, opts.type, opts.ttl)
                            .then(() => {
                                this.logger?.info('Response cached', {
                                    module: 'CACHE',
                                    key: cacheKey,
                                    size: JSON.stringify(data).length,
                                    ttl: opts.ttl
                                });
                            })
                            .catch(err => {
                                this.logger?.error('Cache save error', {
                                    module: 'CACHE',
                                    key: cacheKey,
                                    error: err.message
                                });
                            });
                    }

                    return data;
                };

                res.send = function(data) {
                    interceptResponse(data);
                    return originalSend.call(this, data);
                };

                res.json = function(data) {
                    interceptResponse(data);
                    return originalJson.call(this, data);
                };

                this.setCacheHeaders(res, null, false);
                next();

            } catch (error) {
                this.logger?.error('Cache middleware error', {
                    module: 'CACHE',
                    error: error.message,
                    stack: error.stack,
                    url: req.originalUrl
                });
                
                next(); // Continuar sin cache en caso de error
            }
        };
    }

    // ========================================
    // 📊 MIDDLEWARE ESPECIALIZADO
    // ========================================

    /**
     * Cache para APIs con rate limiting
     */
    apiCache(ttl = 300, rateLimit = null) {
        return this.cache({
            ttl,
            type: 'api',
            vary: ['authorization', 'user-agent'],
            condition: (req) => {
                // No cachear si hay errores de autenticación
                return !req.headers['x-cache-bypass'];
            },
            invalidateOn: ['user.update', 'data.change']
        });
    }

    /**
     * Cache para datos de usuario
     */
    userCache(ttl = 1800) {
        return this.cache({
            ttl,
            type: 'users',
            vary: ['authorization'],
            condition: (req) => {
                // Solo cachear si el usuario está autenticado
                return req.user && req.user.id;
            }
        });
    }

    /**
     * Cache para GPS/ubicaciones
     */
    gpsCache(ttl = 60) {
        return this.cache({
            ttl,
            type: 'gps',
            vary: ['authorization'],
            condition: (req) => {
                // Solo cachear ubicaciones recientes
                const coords = req.query.lat && req.query.lng;
                return coords;
            }
        });
    }

    /**
     * Cache para analytics/estadísticas
     */
    analyticsCache(ttl = 3600) {
        return this.cache({
            ttl,
            type: 'analytics',
            vary: ['authorization', 'x-time-zone'],
            condition: (req) => {
                // Cachear solo queries de análisis complejos
                return req.query.aggregate || req.query.period;
            }
        });
    }

    // ========================================
    // 🗑️ MIDDLEWARE DE INVALIDACIÓN
    // ========================================

    /**
     * Invalidar caché después de operaciones de escritura
     */
    invalidateCache(patterns = []) {
        return async (req, res, next) => {
            // Continuar con la request original
            next();

            // Invalidar después de que la respuesta se envíe
            res.on('finish', async () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        for (const pattern of patterns) {
                            await this.invalidatePattern(pattern, req);
                        }
                    } catch (error) {
                        this.logger?.error('Cache invalidation error', {
                            module: 'CACHE',
                            patterns,
                            error: error.message
                        });
                    }
                }
            });
        };
    }

    /**
     * Invalidar por patrón
     */
    async invalidatePattern(pattern, req) {
        try {
            if (typeof pattern === 'function') {
                pattern = pattern(req);
            }

            if (typeof pattern === 'string') {
                if (pattern.includes('*')) {
                    // Para patterns con wildcards, necesitamos enumerar keys
                    // Por simplicidad, invalidamos por tipo
                    const type = pattern.split(':')[0];
                    this.logger?.info('Pattern cache invalidation', {
                        module: 'CACHE',
                        pattern,
                        type
                    });
                } else {
                    // Invalidación directa
                    const parts = pattern.split(':');
                    const type = parts[0];
                    const key = parts.slice(1).join(':');
                    
                    await this.cache.del(key, type);
                    
                    this.logger?.info('Direct cache invalidation', {
                        module: 'CACHE',
                        key,
                        type
                    });
                }
            }
        } catch (error) {
            this.logger?.error('Invalidation error', {
                module: 'CACHE',
                pattern,
                error: error.message
            });
        }
    }

    // ========================================
    // 🛠️ MÉTODOS DE UTILIDAD
    // ========================================

    buildCacheKey(req, options) {
        const parts = [
            req.route?.path || req.path,
            req.method
        ];

        // Incluir query parameters si es necesario
        if (!options.skipQuery && Object.keys(req.query).length > 0) {
            const sortedQuery = Object.keys(req.query)
                .sort()
                .map(key => `${key}=${req.query[key]}`)
                .join('&');
            parts.push(sortedQuery);
        }

        // Incluir headers que afectan el cache
        for (const header of options.vary) {
            const value = req.get(header);
            if (value) {
                parts.push(`${header}:${value}`);
            }
        }

        // Incluir ID de usuario si está disponible
        if (req.user && req.user.id) {
            parts.push(`user:${req.user.id}`);
        }

        return parts.join('|');
    }

    isStale(cached, options) {
        if (!cached.timestamp) return true;
        
        const age = Date.now() - cached.timestamp;
        const maxAge = (cached.ttl || options.ttl) * 1000;
        
        return age > maxAge;
    }

    setCacheHeaders(res, cached, isHit) {
        if (isHit && cached) {
            const age = Math.floor((Date.now() - cached.timestamp) / 1000);
            res.set({
                'X-Cache': 'HIT',
                'X-Cache-Age': age.toString(),
                'X-Cache-TTL': cached.ttl.toString(),
                'Cache-Control': `max-age=${cached.ttl}, public`
            });
        } else {
            res.set({
                'X-Cache': 'MISS',
                'Cache-Control': 'no-cache'
            });
        }
    }

    /**
     * Middleware para debugging de caché
     */
    debugCache() {
        return (req, res, next) => {
            const start = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                const cacheStatus = res.get('X-Cache') || 'BYPASS';
                
                this.logger?.debug('Cache debug info', {
                    module: 'CACHE',
                    url: req.originalUrl,
                    method: req.method,
                    status: res.statusCode,
                    cacheStatus,
                    duration,
                    size: res.get('Content-Length') || 0
                });
            });
            
            next();
        };
    }

    /**
     * Obtener estadísticas del middleware
     */
    getStats() {
        return this.cache.getMetrics();
    }
}

module.exports = CacheMiddleware;