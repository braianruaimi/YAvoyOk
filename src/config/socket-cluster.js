/**
 * YAvoy v3.1 Enterprise - Socket.IO Clustering Manager
 * Sistema de clustering y balanceo de carga para WebSockets
 * CTO: Optimización para alta concurrencia y escalabilidad
 */

const cluster = require('cluster');
const os = require('os');
const { createAdapter } = require('@socket.io/redis-adapter');
const { Server } = require('socket.io');

class SocketClusterManager {
    constructor() {
        this.workers = new Map();
        this.maxWorkers = process.env.MAX_WORKERS || os.cpus().length;
        this.redisEnabled = process.env.REDIS_URL ? true : false;
        this.loadBalancingStrategy = process.env.LOAD_STRATEGY || 'round_robin';
        this.currentWorkerIndex = 0;
        
        this.performanceMetrics = {
            totalConnections: 0,
            messagesPerSecond: 0,
            avgResponseTime: 0,
            errorRate: 0
        };

        this.init();
    }

    init() {
        if (process.env.NODE_ENV === 'production' && process.env.ENABLE_CLUSTERING === 'true') {
            console.log('🔄 Iniciando Socket.IO con clustering...');
            this.setupClustering();
        } else {
            console.log('📡 Socket.IO modo single-process (desarrollo)');
            this.setupSingleProcess();
        }
    }

    setupClustering() {
        if (cluster.isMaster) {
            console.log(`🚀 Master process ${process.pid} iniciado`);
            console.log(`🔧 Creando ${this.maxWorkers} workers...`);

            // Crear workers
            for (let i = 0; i < this.maxWorkers; i++) {
                this.createWorker(i);
            }

            // Manejar workers que se caen
            cluster.on('exit', (worker, code, signal) => {
                console.log(`❌ Worker ${worker.process.pid} murió con código ${code}`);
                
                // Remover de tracking
                for (const [id, workerData] of this.workers) {
                    if (workerData.worker.process.pid === worker.process.pid) {
                        this.workers.delete(id);
                        break;
                    }
                }

                // Crear replacement worker si no fue un shutdown intencional
                if (signal !== 'SIGTERM') {
                    console.log('🔄 Creando worker de reemplazo...');
                    this.createWorker(this.workers.size);
                }
            });

            // Graceful shutdown
            process.on('SIGTERM', () => {
                console.log('🛑 Cerrando cluster graciosamente...');
                for (const [id, workerData] of this.workers) {
                    workerData.worker.kill('SIGTERM');
                }
            });

            // Monitoreo de performance
            setInterval(() => {
                this.collectMetrics();
            }, 30000); // Cada 30 segundos

        } else {
            // Worker process
            console.log(`👷 Worker ${process.pid} iniciado`);
            this.setupWorkerProcess();
        }
    }

    createWorker(id) {
        const worker = cluster.fork({
            WORKER_ID: id,
            WORKER_PORT: 5502 + id
        });

        const workerData = {
            worker,
            id,
            pid: worker.process.pid,
            connections: 0,
            created: new Date(),
            lastHealthCheck: new Date()
        };

        this.workers.set(id, workerData);

        // Health check del worker
        worker.on('message', (msg) => {
            if (msg.type === 'health') {
                workerData.lastHealthCheck = new Date();
                workerData.connections = msg.connections || 0;
            }
        });

        console.log(`✅ Worker ${worker.process.pid} creado con ID ${id}`);
    }

    setupWorkerProcess() {
        // Configuración específica del worker
        const workerId = process.env.WORKER_ID;
        const workerPort = process.env.WORKER_PORT;

        console.log(`🔧 Configurando Worker ${workerId} en puerto ${workerPort}`);

        // Enviar health check al master cada 15 segundos
        setInterval(() => {
            process.send({
                type: 'health',
                workerId: workerId,
                connections: this.getConnectionCount(),
                timestamp: new Date().toISOString()
            });
        }, 15000);
    }

    setupSingleProcess() {
        // Configuración para proceso único (desarrollo)
        this.optimizeSocketIO();
    }

    optimizeSocketIO() {
        return {
            // Configuraciones optimizadas para Socket.IO
            pingTimeout: 60000,
            pingInterval: 25000,
            upgradeTimeout: 30000,
            maxHttpBufferSize: 1e6,
            allowEIO3: true,
            transports: ['websocket', 'polling'],
            
            // Configuraciones de clustering
            adapter: this.redisEnabled ? this.createRedisAdapter() : undefined,
            
            // Configuraciones de performance
            serveClient: false,
            allowRequest: this.allowRequestHandler.bind(this),
            
            // Configuraciones específicas por ciudad
            connectionStateRecovery: {
                maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutos
                skipMiddlewares: true,
            }
        };
    }

    createRedisAdapter() {
        if (!this.redisEnabled) return undefined;

        try {
            const redis = require('redis');
            const pubClient = redis.createClient({ url: process.env.REDIS_URL });
            const subClient = pubClient.duplicate();

            console.log('🔴 Conectando Redis para clustering Socket.IO...');
            
            return createAdapter(pubClient, subClient, {
                key: 'yavoy-socketio',
                requestsTimeout: 5000
            });
        } catch (error) {
            console.warn('⚠️ Error configurando Redis adapter:', error.message);
            return undefined;
        }
    }

    allowRequestHandler(req, fn) {
        // Rate limiting por IP
        const clientIP = req.socket.remoteAddress;
        const now = Date.now();
        
        if (!this.ipTracker) {
            this.ipTracker = new Map();
        }

        const ipData = this.ipTracker.get(clientIP) || { count: 0, resetTime: now + 60000 };
        
        if (now > ipData.resetTime) {
            ipData.count = 0;
            ipData.resetTime = now + 60000;
        }

        ipData.count++;
        this.ipTracker.set(clientIP, ipData);

        // Límite: 100 conexiones por minuto por IP
        if (ipData.count > 100) {
            console.warn(`🚨 Rate limit excedido para IP: ${clientIP}`);
            fn('Rate limit exceeded', false);
            return;
        }

        fn(null, true);
    }

    // ========================================
    // 🏙️ OPTIMIZACIÓN POR CIUDADES
    // ========================================
    
    createCityRooms(io) {
        const cityRooms = {
            'capital-federal': new Set(),
            'zona-norte': new Set(),
            'zona-oeste': new Set(),
            'zona-sur': new Set(),
            'default': new Set()
        };

        // Middleware para asignación automática de salas por ciudad
        io.use((socket, next) => {
            const city = socket.handshake.query.city || 'default';
            const normalizedCity = this.normalizeCity(city);
            
            socket.yavoyCity = normalizedCity;
            socket.join(`city-${normalizedCity}`);
            
            cityRooms[normalizedCity].add(socket.id);
            
            socket.on('disconnect', () => {
                cityRooms[normalizedCity].delete(socket.id);
            });

            next();
        });

        return cityRooms;
    }

    normalizeCity(city) {
        const cityMap = {
            'caba': 'capital-federal',
            'capital': 'capital-federal',
            'vicente-lopez': 'zona-norte',
            'san-isidro': 'zona-norte',
            'tigre': 'zona-norte',
            'moron': 'zona-oeste',
            'merlo': 'zona-oeste',
            'lanus': 'zona-sur',
            'avellaneda': 'zona-sur'
        };

        return cityMap[city.toLowerCase()] || 'default';
    }

    // ========================================
    // 📊 MÉTRICAS Y MONITOREO
    // ========================================
    
    collectMetrics() {
        if (!cluster.isMaster) return;

        let totalConnections = 0;
        let activeWorkers = 0;

        for (const [id, workerData] of this.workers) {
            totalConnections += workerData.connections;
            activeWorkers++;
            
            // Health check
            const timeSinceLastCheck = Date.now() - workerData.lastHealthCheck.getTime();
            if (timeSinceLastCheck > 60000) { // 1 minuto sin respuesta
                console.warn(`⚠️ Worker ${workerData.pid} no responde hace ${timeSinceLastCheck}ms`);
            }
        }

        this.performanceMetrics = {
            ...this.performanceMetrics,
            totalConnections,
            activeWorkers,
            timestamp: new Date().toISOString()
        };

        console.log(`📊 Métricas: ${totalConnections} conexiones en ${activeWorkers} workers`);
    }

    getConnectionCount() {
        // Implementación específica del worker para contar conexiones
        return global.socketConnections || 0;
    }

    getClusterStatus() {
        if (cluster.isMaster) {
            return {
                mode: 'cluster',
                master: process.pid,
                workers: Array.from(this.workers.values()).map(w => ({
                    id: w.id,
                    pid: w.pid,
                    connections: w.connections,
                    uptime: Date.now() - w.created.getTime()
                })),
                metrics: this.performanceMetrics
            };
        } else {
            return {
                mode: 'worker',
                workerId: process.env.WORKER_ID,
                pid: process.pid,
                connections: this.getConnectionCount()
            };
        }
    }

    // ========================================
    // 🔧 CONFIGURACIÓN PARA SERVIDOR
    // ========================================
    
    setupSocketServer(server) {
        const config = this.optimizeSocketIO();
        const io = new Server(server, config);

        // Configurar salas por ciudad
        const cityRooms = this.createCityRooms(io);

        // Middleware de autenticación optimizado
        io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Token requerido'));
            }
            
            // TODO: Validar JWT token
            next();
        });

        // Tracking de conexiones globales
        io.on('connection', (socket) => {
            if (!global.socketConnections) global.socketConnections = 0;
            global.socketConnections++;

            socket.on('disconnect', () => {
                global.socketConnections--;
            });
        });

        return io;
    }
}

module.exports = SocketClusterManager;