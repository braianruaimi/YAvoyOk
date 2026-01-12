/**
 * YAvoy v3.1 Enterprise - Health Check & System Monitoring
 * Sistema completo de monitoreo y diagnóstico del servidor
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const process = require('process');
const fs = require('fs').promises;
const path = require('path');

// ========================================
// 🏥 HEALTH CHECK BÁSICO
// ========================================

router.get('/health', async (req, res) => {
    try {
        const healthData = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '3.1.0',
            environment: process.env.NODE_ENV || 'development',
            
            // Información del sistema
            system: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                cpuCount: os.cpus().length,
                totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
                freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
                loadAverage: os.loadavg()
            },
            
            // Información del proceso
            process: {
                pid: process.pid,
                memoryUsage: {
                    rss: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
                    heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
                    heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
                    external: Math.round(process.memoryUsage().external / 1024 / 1024) // MB
                }
            }
        };
        
        res.json(healthData);
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ========================================
// 📊 MÉTRICAS DETALLADAS DEL SISTEMA
// ========================================

router.get('/metrics', async (req, res) => {
    try {
        const memUsage = process.memoryUsage();
        const cpus = os.cpus();
        
        // Calcular uso promedio de CPU (simplificado)
        const cpuUsage = cpus.map(cpu => {
            const total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
            const usage = 100 - (100 * cpu.times.idle / total);
            return Math.round(usage * 100) / 100;
        });

        const metrics = {
            timestamp: new Date().toISOString(),
            server: {
                uptime: process.uptime(),
                uptimeHuman: formatUptime(process.uptime()),
                version: process.env.npm_package_version || '3.1.0',
                nodeVersion: process.version,
                environment: process.env.NODE_ENV || 'development'
            },
            
            system: {
                platform: `${os.type()} ${os.release()}`,
                arch: os.arch(),
                hostname: os.hostname(),
                cpus: cpus.length,
                cpuModel: cpus[0]?.model || 'Unknown',
                cpuUsage: cpuUsage,
                cpuAverage: Math.round(cpuUsage.reduce((a, b) => a + b, 0) / cpuUsage.length * 100) / 100,
                loadAverage: {
                    '1min': os.loadavg()[0],
                    '5min': os.loadavg()[1],
                    '15min': os.loadavg()[2]
                }
            },
            
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                usedPercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
                process: {
                    rss: memUsage.rss,
                    heapTotal: memUsage.heapTotal,
                    heapUsed: memUsage.heapUsed,
                    heapFree: memUsage.heapTotal - memUsage.heapUsed,
                    heapUsedPercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
                    external: memUsage.external
                }
            },
            
            network: {
                interfaces: getNetworkInterfaces()
            }
        };
        
        res.json(metrics);
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ========================================
// 🔌 ESTADO DE CONEXIONES Y SERVICIOS
// ========================================

router.get('/status', async (req, res) => {
    try {
        const services = {
            timestamp: new Date().toISOString(),
            services: {
                database: await checkDatabaseConnection(req),
                cache: await checkCacheConnection(req),
                filesystem: await checkFilesystemAccess(),
                socketio: checkSocketIOStatus(req),
                memory: checkMemoryStatus(),
                cpu: checkCPUStatus()
            },
            
            // Información agregada
            overall: 'calculating...'
        };
        
        // Calcular estado general
        const healthyServices = Object.values(services.services).filter(service => service.status === 'healthy').length;
        const totalServices = Object.keys(services.services).length;
        const healthPercent = Math.round((healthyServices / totalServices) * 100);
        
        services.overall = healthPercent >= 80 ? 'healthy' : healthPercent >= 50 ? 'degraded' : 'unhealthy';
        services.healthScore = `${healthyServices}/${totalServices} (${healthPercent}%)`;
        
        const statusCode = healthPercent >= 80 ? 200 : healthPercent >= 50 ? 206 : 503;
        res.status(statusCode).json(services);
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ========================================
// 🛠️ DIAGNÓSTICO AVANZADO
// ========================================

router.get('/diagnostics', async (req, res) => {
    try {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            server: {
                pid: process.pid,
                ppid: process.ppid,
                uid: process.getuid ? process.getuid() : null,
                gid: process.getgid ? process.getgid() : null,
                cwd: process.cwd(),
                execPath: process.execPath,
                argv: process.argv,
                execArgv: process.execArgv
            },
            
            environment: {
                nodeEnv: process.env.NODE_ENV,
                port: process.env.PORT,
                variables: Object.keys(process.env).filter(key => 
                    !key.includes('PASSWORD') && 
                    !key.includes('SECRET') && 
                    !key.includes('KEY') &&
                    !key.includes('TOKEN')
                ).sort()
            },
            
            performance: {
                eventLoopUtilization: await getEventLoopUtilization(),
                gcStats: getGCStats(),
                hrtime: process.hrtime()
            },
            
            filesystem: {
                diskUsage: await getDiskUsage(),
                tempDir: os.tmpdir(),
                homeDir: os.homedir()
            },
            
            features: {
                asyncHooks: !!process.binding,
                worker_threads: !!require.resolve('worker_threads'),
                cluster: !!require.resolve('cluster'),
                crypto: !!require.resolve('crypto'),
                https: !!require.resolve('https'),
                websockets: !!require.resolve('ws')
            }
        };
        
        res.json(diagnostics);
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ========================================
// 🔧 FUNCIONES AUXILIARES
// ========================================

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

function getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const result = {};
    
    for (const [name, addrs] of Object.entries(interfaces)) {
        result[name] = addrs.filter(addr => !addr.internal).map(addr => ({
            family: addr.family,
            address: addr.address,
            netmask: addr.netmask,
            mac: addr.mac
        }));
    }
    
    return result;
}

async function checkDatabaseConnection(req) {
    try {
        const db = req.app.get('dbPool');
        const dbManager = req.app.get('dbManager');
        
        if (!db && !dbManager) {
            return { 
                status: 'warning', 
                message: 'Database not initialized yet, using JSON fallback',
                mode: 'json-fallback'
            };
        }
        
        if (!db || (dbManager && !dbManager.isPostgresAvailable)) {
            return { 
                status: 'warning', 
                message: 'PostgreSQL not available, using JSON fallback',
                mode: 'json-fallback',
                fallback: 'active'
            };
        }
        
        const start = Date.now();
        const result = await db.query('SELECT NOW() as current_time');
        const responseTime = Date.now() - start;
        
        return { 
            status: 'healthy', 
            message: 'Database connected',
            responseTime: responseTime,
            version: result.rows[0]?.current_time
        };
    } catch (error) {
        return { 
            status: 'warning', 
            message: 'Database error, using JSON fallback: ' + error.message,
            error: error.code || 'DATABASE_ERROR',
            fallback: 'json-active'
        };
    }
}

async function checkCacheConnection(req) {
    try {
        const cacheManager = req.app.get('cacheManager');
        if (!cacheManager) {
            return { 
                status: 'warning', 
                message: 'Cache manager not initialized yet',
                fallback: 'memory-cache-pending'
            };
        }
        
        // Intentar un test de conexión
        const testKey = `health_check_${Date.now()}`;
        const testValue = 'test_value';
        
        try {
            await cacheManager.set(testKey, testValue, 5);
            const value = await cacheManager.get(testKey);
            
            if (value === testValue) {
                return { 
                    status: 'healthy', 
                    message: 'Cache connected and working',
                    type: 'redis'
                };
            } else {
                return { 
                    status: 'degraded', 
                    message: 'Cache responding but data inconsistent',
                    type: 'redis-inconsistent'
                };
            }
        } catch (cacheError) {
            return { 
                status: 'warning', 
                message: 'Redis error, using NodeCache fallback',
                fallback: 'NodeCache',
                type: 'memory'
            };
        }
    } catch (error) {
        return { 
            status: 'warning', 
            message: 'Cache system error, basic memory fallback active',
            error: error.message,
            fallback: 'basic-memory'
        };
    }
}

async function checkFilesystemAccess() {
    try {
        const testFile = path.join(os.tmpdir(), `health_check_${Date.now()}.tmp`);
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
        
        return { status: 'healthy', message: 'Filesystem read/write OK' };
    } catch (error) {
        return { 
            status: 'unhealthy', 
            message: `Filesystem error: ${error.message}` 
        };
    }
}

function checkSocketIOStatus(req) {
    try {
        const io = req.app.get('io');
        if (!io) {
            return { status: 'warning', message: 'Socket.IO not initialized' };
        }
        
        const sockets = io.sockets.sockets.size;
        return { 
            status: 'healthy', 
            message: `Socket.IO running`,
            connectedClients: sockets
        };
    } catch (error) {
        return { 
            status: 'error', 
            message: `Socket.IO error: ${error.message}` 
        };
    }
}

function checkMemoryStatus() {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (heapUsedPercent > 90) {
        return { status: 'critical', message: `Memory usage critical: ${heapUsedPercent.toFixed(1)}%` };
    } else if (heapUsedPercent > 75) {
        return { status: 'warning', message: `Memory usage high: ${heapUsedPercent.toFixed(1)}%` };
    } else {
        return { status: 'healthy', message: `Memory usage normal: ${heapUsedPercent.toFixed(1)}%` };
    }
}

function checkCPUStatus() {
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length;
    const loadPercent = (loadAvg / cpuCount) * 100;
    
    if (loadPercent > 90) {
        return { status: 'critical', message: `CPU load critical: ${loadPercent.toFixed(1)}%` };
    } else if (loadPercent > 70) {
        return { status: 'warning', message: `CPU load high: ${loadPercent.toFixed(1)}%` };
    } else {
        return { status: 'healthy', message: `CPU load normal: ${loadPercent.toFixed(1)}%` };
    }
}

async function getEventLoopUtilization() {
    return new Promise((resolve) => {
        const start = process.hrtime.bigint();
        setImmediate(() => {
            const end = process.hrtime.bigint();
            const utilization = Number(end - start) / 1000000; // Convert to ms
            resolve({ utilization: utilization, unit: 'ms' });
        });
    });
}

function getGCStats() {
    try {
        return {
            available: false,
            message: 'GC stats require --expose-gc flag'
        };
    } catch (error) {
        return {
            available: false,
            error: error.message
        };
    }
}

async function getDiskUsage() {
    try {
        const stats = await fs.stat(process.cwd());
        return {
            available: true,
            currentDirectory: process.cwd(),
            accessible: true,
            lastModified: stats.mtime
        };
    } catch (error) {
        return {
            available: false,
            error: error.message
        };
    }
}

module.exports = router;