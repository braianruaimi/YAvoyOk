/**
 * YAvoy v3.1 Enterprise - Redis Cache Manager
 * Sistema de caché distribuido con failover automático
 */

const Redis = require('ioredis');
const NodeCache = require('node-cache');

class RedisCacheManager {
    constructor(options = {}) {
        this.options = {
            // Configuración Redis
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || '',
                db: process.env.REDIS_DB || 0,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                connectTimeout: 10000,
                lazyConnect: true,
                ...options.redis
            },
            // Configuración fallback (in-memory)
            fallback: {
                stdTTL: 600,        // 10 minutos por defecto
                checkperiod: 120,   // Verificar cada 2 minutos
                useClones: false,   // Mayor performance
                deleteOnExpire: true,
                maxKeys: 10000,     // Límite de keys en memoria
                ...options.fallback
            },
            // Configuración de prefijos para organización
            keyPrefixes: {
                sessions: 'sess:',
                users: 'user:',
                pedidos: 'pedido:',
                gps: 'gps:',
                analytics: 'analytics:',
                temp: 'temp:',
                rate_limit: 'rl:',
                webauthn: 'auth:',
                ...options.keyPrefixes
            },
            // TTL por tipo de dato (segundos)
            defaultTTL: {
                sessions: 3600,     // 1 hora
                users: 1800,        // 30 minutos  
                pedidos: 300,       // 5 minutos
                gps: 60,            // 1 minuto
                analytics: 7200,    // 2 horas
                temp: 300,          // 5 minutos
                rate_limit: 900,    // 15 minutos
                webauthn: 600,      // 10 minutos
                ...options.defaultTTL
            }
        };

        this.isRedisAvailable = false;
        this.redis = null;
        this.nodeCache = new NodeCache(this.options.fallback);
        this.metrics = {
            hits: 0,
            misses: 0,
            errors: 0,
            redisHits: 0,
            fallbackHits: 0,
            writeErrors: 0,
            startTime: Date.now()
        };

        this.init();
    }

    async init() {
        try {
            console.log('🔄 Iniciando Redis Cache Manager...');
            
            // Configurar Redis con cluster si está disponible
            if (process.env.REDIS_CLUSTER_NODES) {
                const nodes = process.env.REDIS_CLUSTER_NODES.split(',');
                this.redis = new Redis.Cluster(nodes, {
                    redisOptions: this.options.redis,
                    enableOfflineQueue: false
                });
                console.log('📡 Redis Cluster configurado');
            } else {
                // Configuración optimizada para desarrollo sin Redis
                this.redis = new Redis({
                    ...this.options.redis,
                    retryDelayOnFailover: 5000,
                    maxRetriesPerRequest: 1,
                    lazyConnect: true,
                    enableOfflineQueue: false,
                    reconnectOnError: null
                });
                console.log('🔄 Redis single-node configurado');
            }

            // Configurar event listeners
            this.redis.on('connect', () => {
                console.log('✅ Redis conectado exitosamente');
                this.isRedisAvailable = true;
            });

            this.redis.on('error', (error) => {
                if (this.isRedisAvailable) {
                    console.error('❌ Error Redis:', error.message);
                }
                this.isRedisAvailable = false;
                this.metrics.errors++;
            });

            this.redis.on('close', () => {
                if (this.isRedisAvailable) {
                    console.log('🔌 Conexión Redis cerrada');
                }
                this.isRedisAvailable = false;
            });

            this.redis.on('reconnecting', () => {
                // Solo log la primera vez
                if (this.metrics.errors <= 1) {
                    console.log('🔄 Reintentando conexión Redis...');
                }
            });

            // Configurar compresión para valores grandes
            this.redis.defineCommand('setCompressed', {
                numberOfKeys: 1,
                lua: `
                    local key = KEYS[1]
                    local value = ARGV[1]
                    local ttl = ARGV[2]
                    
                    if #value > 1024 then
                        value = redis.call('COMPRESS', value)
                    end
                    
                    if ttl then
                        return redis.call('SETEX', key, ttl, value)
                    else
                        return redis.call('SET', key, value)
                    end
                `
            });

            // Intentar conexión inicial
            await this.redis.ping();
            console.log('🏓 Redis ping exitoso');

        } catch (error) {
            console.error('⚠️  Redis no disponible, usando fallback en memoria:', error.message);
            this.isRedisAvailable = false;
        }
    }

    // ========================================
    // 🔧 MÉTODOS PRINCIPALES DE CACHÉ
    // ========================================

    /**
     * Obtener valor del caché
     */
    async get(key, type = 'temp') {
        const fullKey = this.buildKey(key, type);
        
        try {
            let value = null;
            
            if (this.isRedisAvailable) {
                value = await this.redis.get(fullKey);
                if (value !== null) {
                    this.metrics.hits++;
                    this.metrics.redisHits++;
                    return this.deserializeValue(value);
                }
            }

            // Fallback a NodeCache
            value = this.nodeCache.get(fullKey);
            if (value !== undefined) {
                this.metrics.hits++;
                this.metrics.fallbackHits++;
                return value;
            }

            this.metrics.misses++;
            return null;

        } catch (error) {
            console.error(`Cache get error for ${fullKey}:`, error);
            this.metrics.errors++;
            
            // Intentar fallback en caso de error
            try {
                const value = this.nodeCache.get(fullKey);
                return value !== undefined ? value : null;
            } catch {
                return null;
            }
        }
    }

    /**
     * Guardar valor en caché
     */
    async set(key, value, type = 'temp', customTTL = null) {
        const fullKey = this.buildKey(key, type);
        const ttl = customTTL || this.options.defaultTTL[type] || 300;
        
        try {
            const serializedValue = this.serializeValue(value);
            
            if (this.isRedisAvailable) {
                try {
                    await this.redis.setex(fullKey, ttl, serializedValue);
                } catch (redisError) {
                    console.warn('Redis write failed, using fallback:', redisError.message);
                    this.metrics.writeErrors++;
                }
            }

            // Siempre guardar en fallback también
            this.nodeCache.set(fullKey, value, ttl);
            
            return true;

        } catch (error) {
            console.error(`Cache set error for ${fullKey}:`, error);
            this.metrics.errors++;
            return false;
        }
    }

    /**
     * Eliminar del caché
     */
    async del(key, type = 'temp') {
        const fullKey = this.buildKey(key, type);
        
        try {
            if (this.isRedisAvailable) {
                await this.redis.del(fullKey);
            }
            
            this.nodeCache.del(fullKey);
            return true;

        } catch (error) {
            console.error(`Cache delete error for ${fullKey}:`, error);
            this.metrics.errors++;
            return false;
        }
    }

    /**
     * Verificar si existe una key
     */
    async exists(key, type = 'temp') {
        const fullKey = this.buildKey(key, type);
        
        try {
            if (this.isRedisAvailable) {
                const exists = await this.redis.exists(fullKey);
                if (exists) return true;
            }
            
            return this.nodeCache.has(fullKey);

        } catch (error) {
            console.error(`Cache exists error for ${fullKey}:`, error);
            return false;
        }
    }

    // ========================================
    // 🎯 MÉTODOS ESPECIALIZADOS
    // ========================================

    /**
     * Caché de sesiones con renovación automática
     */
    async setSession(sessionId, sessionData, extendTTL = true) {
        const ttl = extendTTL ? this.options.defaultTTL.sessions : 3600;
        return await this.set(sessionId, {
            ...sessionData,
            lastActivity: new Date().toISOString(),
            createdAt: sessionData.createdAt || new Date().toISOString()
        }, 'sessions', ttl);
    }

    async getSession(sessionId) {
        const session = await this.get(sessionId, 'sessions');
        
        // Auto-renovar sesiones activas
        if (session) {
            const lastActivity = new Date(session.lastActivity);
            const now = new Date();
            const minutesSinceActivity = (now - lastActivity) / (1000 * 60);
            
            if (minutesSinceActivity < 30) { // Renovar si hay actividad reciente
                await this.setSession(sessionId, session, true);
            }
        }
        
        return session;
    }

    /**
     * Rate limiting distribuido
     */
    async checkRateLimit(identifier, maxRequests = 100, windowSeconds = 900) {
        const key = `${identifier}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
        
        try {
            const current = await this.get(key, 'rate_limit') || 0;
            
            if (current >= maxRequests) {
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime: (Math.floor(Date.now() / (windowSeconds * 1000)) + 1) * windowSeconds * 1000
                };
            }

            await this.set(key, current + 1, 'rate_limit', windowSeconds);
            
            return {
                allowed: true,
                remaining: maxRequests - (current + 1),
                resetTime: (Math.floor(Date.now() / (windowSeconds * 1000)) + 1) * windowSeconds * 1000
            };

        } catch (error) {
            console.error('Rate limit check error:', error);
            // En caso de error, permitir la request
            return { allowed: true, remaining: maxRequests - 1, resetTime: Date.now() + (windowSeconds * 1000) };
        }
    }

    /**
     * Caché de datos GPS con geolocalización
     */
    async setGPSLocation(repartidorId, locationData) {
        const data = {
            ...locationData,
            timestamp: new Date().toISOString(),
            accuracy: locationData.accuracy || 0
        };
        
        return await this.set(repartidorId, data, 'gps', 60);
    }

    async getGPSLocation(repartidorId) {
        return await this.get(repartidorId, 'gps');
    }

    /**
     * Caché de analytics con agregación
     */
    async setAnalytics(metricName, value, period = 'hour') {
        const timestamp = new Date();
        const timeKey = this.getTimeKey(timestamp, period);
        const key = `${metricName}:${timeKey}`;
        
        const current = await this.get(key, 'analytics') || { count: 0, sum: 0, avg: 0, min: null, max: null };
        
        const updated = {
            count: current.count + 1,
            sum: current.sum + value,
            avg: (current.sum + value) / (current.count + 1),
            min: current.min === null ? value : Math.min(current.min, value),
            max: current.max === null ? value : Math.max(current.max, value),
            lastUpdate: timestamp.toISOString()
        };
        
        return await this.set(key, updated, 'analytics', this.options.defaultTTL.analytics);
    }

    // ========================================
    // 🛠️ MÉTODOS DE UTILIDAD
    // ========================================

    buildKey(key, type) {
        const prefix = this.options.keyPrefixes[type] || 'temp:';
        return `${prefix}${key}`;
    }

    serializeValue(value) {
        if (typeof value === 'string') return value;
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }

    deserializeValue(value) {
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    getTimeKey(date, period) {
        const d = new Date(date);
        switch (period) {
            case 'minute':
                return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
            case 'hour':
                return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
            case 'day':
                return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            default:
                return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
        }
    }

    /**
     * Limpiar caché expirado
     */
    async cleanup() {
        try {
            if (this.isRedisAvailable) {
                // Redis maneja TTL automáticamente
                console.log('🧹 Redis TTL automático activo');
            }
            
            // Limpiar NodeCache manualmente
            const keys = this.nodeCache.keys();
            let cleaned = 0;
            
            for (const key of keys) {
                const ttl = this.nodeCache.getTtl(key);
                if (ttl && ttl < Date.now()) {
                    this.nodeCache.del(key);
                    cleaned++;
                }
            }
            
            console.log(`🧹 Cache cleanup: ${cleaned} keys eliminadas`);
            
        } catch (error) {
            console.error('Cache cleanup error:', error);
        }
    }

    /**
     * Obtener métricas del caché
     */
    getMetrics() {
        const uptime = Date.now() - this.metrics.startTime;
        const hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses) * 100;
        
        return {
            ...this.metrics,
            uptime,
            hitRate: hitRate || 0,
            nodeCacheStats: this.nodeCache.getStats(),
            redisStatus: this.isRedisAvailable ? 'connected' : 'disconnected'
        };
    }

    /**
     * Cerrar conexiones
     */
    async close() {
        try {
            if (this.redis) {
                await this.redis.quit();
                console.log('✅ Redis conexión cerrada correctamente');
            }
            
            this.nodeCache.flushAll();
            console.log('✅ NodeCache limpiado');
            
        } catch (error) {
            console.error('Error cerrando cache:', error);
        }
    }
}

module.exports = RedisCacheManager;