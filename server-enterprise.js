// ====================================
// YAVOY v3.1 ENTERPRISE - NÚCLEO SERVIDOR
// ====================================
// CTO: Servidor Express consolidado con seguridad militar
// PostgreSQL nativo | Sin SMTP | Socket.IO GPS optimizado

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs').promises;
const CEOSecurityMiddleware = require('./middleware/ceo-security');
const ceoSecurity = new CEOSecurityMiddleware();

// ========================================
// 🛡️ CONFIGURACIÓN SEGURIDAD
// ========================================
const app = express();
const server = http.createServer(app);

// Helmet Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const corsOptions = {
    origin: [
        'http://localhost:5502',
        'http://localhost:3000',
        'https://tudominio.com',
        'https://www.tudominio.com'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuración del servidor
const PORT = process.env.PORT || 5502;
const HOST = process.env.HOST || '0.0.0.0';

// ========================================
// 📊 MYSQL HOSTINGER POOL
// ========================================
const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'srv1722.hstgr.io',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'u695828542_yavoyspace',
    password: process.env.DB_PASSWORD || 'Yavoy25!',
    database: process.env.DB_NAME || 'u695828542_yavoysql',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4'
});

// Test de conexión DB
(async () => {
    try {
        const connection = await dbPool.getConnection();
        console.log('🗄️  MySQL Hostinger conectado correctamente');
        console.log('📍 Host:', process.env.DB_HOST);
        console.log('🗂️  Base de datos:', process.env.DB_NAME);
        connection.release();
    } catch (err) {
        console.error('❌ Error MySQL:', err.message);
    }
})();

// ========================================
// 🚀 SOCKET.IO GPS OPTIMIZADO
// ========================================
const io = new Server(server, {
    cors: corsOptions,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutos
        skipMiddlewares: true,
    }
});

// Storage en memoria para GPS
const activeRepartidores = new Map();
const activePedidos = new Map();

// ========================================
// 🛠️ FUNCIONES AUXILIARES
// ========================================
async function verificarCarpetas() {
    const carpetas = [
        'data',
        'data/pedidos',
        'data/usuarios',
        'data/chats',
        'logs',
        'registros'
    ];
    
    for (const carpeta of carpetas) {
        try {
            await fs.mkdir(carpeta, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                console.error(`Error creando carpeta ${carpeta}:`, error);
            }
        }
    }
    console.log('✅ Estructura de carpetas verificada');
}

io.on('connection', (socket) => {
    console.log(`📡 Cliente conectado: ${socket.id}`);

    // ========================================
    // 🚚 REPARTIDOR GPS TRACKING
    // ========================================
    socket.on('repartidor-connect', async (data) => {
        const { repartidorId, token } = data;

        try {
            // Verificar JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role !== 'repartidor') {
                socket.emit('auth-error', { message: 'Token inválido para repartidor' });
                return;
            }

            // Registrar repartidor activo
            activeRepartidores.set(repartidorId, {
                socketId: socket.id,
                lastUpdate: new Date(),
                ubicacion: null,
                pedidosActivos: []
            });

            socket.emit('repartidor-connected', { repartidorId });
            console.log(`🚚 Repartidor ${repartidorId} conectado`);

        } catch (error) {
            socket.emit('auth-error', { message: 'Token inválido' });
        }
    });

    // Actualización GPS en tiempo real
    socket.on('gps-update', async (data) => {
        const { repartidorId, lat, lng, accuracy, timestamp } = data;

        const repartidor = activeRepartidores.get(repartidorId);
        if (!repartidor) {
            socket.emit('error', { message: 'Repartidor no registrado' });
            return;
        }

        const ubicacionData = {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            accuracy: accuracy || 0,
            timestamp: timestamp || new Date().toISOString()
        };

        // Actualizar ubicación en memoria
        repartidor.ubicacion = ubicacionData;
        repartidor.lastUpdate = new Date();

        // Guardar en PostgreSQL (async)
        try {
            await dbPool.query(
                'INSERT INTO ubicaciones_gps (repartidor_id, lat, lng, accuracy, timestamp) VALUES ($1, $2, $3, $4, $5)',
                [repartidorId, lat, lng, accuracy, ubicacionData.timestamp]
            );
        } catch (error) {
            console.error('Error guardando GPS:', error.message);
        }

        // Emitir a clientes siguiendo pedidos de este repartidor
        for (const pedidoId of repartidor.pedidosActivos) {
            io.to(`pedido-${pedidoId}`).emit('repartidor-ubicacion', {
                repartidorId,
                pedidoId,
                ubicacion: ubicacionData
            });
        }

        socket.emit('gps-confirmado', { timestamp: ubicacionData.timestamp });
    });

    // ========================================
    // 📱 CLIENTE TRACKING
    // ========================================
    socket.on('seguir-pedido', (data) => {
        const { pedidoId, clienteId } = data;
        socket.join(`pedido-${pedidoId}`);

        // Enviar ubicación actual del repartidor si existe
        const repartidor = Array.from(activeRepartidores.values())
            .find(r => r.pedidosActivos.includes(pedidoId));

        if (repartidor && repartidor.ubicacion) {
            socket.emit('repartidor-ubicacion', {
                pedidoId,
                ubicacion: repartidor.ubicacion
            });
        }
    });

    // ========================================
    // 🔌 DESCONEXIÓN
    // ========================================
    socket.on('disconnect', () => {
        // Limpiar repartidor desconectado
        for (const [repartidorId, data] of activeRepartidores) {
            if (data.socketId === socket.id) {
                activeRepartidores.delete(repartidorId);
                console.log(`🚚 Repartidor ${repartidorId} desconectado`);
                break;
            }
        }
    });
});

// ========================================
// 🛡️ RUTAS PROTEGIDAS CEO
// ========================================
// Rate limiting específico para CEO
app.use('/api/ceo', ceoSecurity.getCEORateLimiter());
app.use('/dashboard-ceo.html', ceoSecurity.getCEOLoginLimiter());

// Middleware de seguridad CEO
app.use('/api/ceo', ceoSecurity.intrusionDetection());
app.use('/api/ceo', ceoSecurity.authenticateCEO());

// Protección CSRF para acciones CEO
app.use('/api/ceo', ceoSecurity.csrfProtection());

// ========================================
// 📊 RUTAS CEO ESPECIALIZADAS
// ========================================
// Dashboard analytics para CEO
app.get('/api/ceo/analytics', ceoSecurity.authorizeCEOAction('view_analytics'), async (req, res) => {
    try {
        const analytics = await obtenerAnalyticsCEO();
        res.json({ success: true, data: analytics });
    } catch (error) {
        console.error('Error obteniendo analytics CEO:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Logs de seguridad para CEO
app.get('/api/ceo/security-logs', ceoSecurity.authorizeCEOAction('security_logs'), async (req, res) => {
    try {
        const logs = ceoSecurity.getSecurityLogs(parseInt(req.query.limit) || 100);
        const stats = ceoSecurity.getSecurityStats();

        res.json({
            success: true,
            data: { logs, stats }
        });
    } catch (error) {
        console.error('Error obteniendo logs de seguridad:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Gestión de usuarios para CEO
app.get('/api/ceo/users', ceoSecurity.authorizeCEOAction('manage_users'), async (req, res) => {
    try {
        const users = await obtenerUsuariosCEO();
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ========================================
// 🌐 SERVIR ARCHIVOS ESTÁTICOS
// ========================================
app.use(express.static('.', {
    index: 'index.html',
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// ========================================
// 📡 RUTAS DE API
// ========================================
// app.use('/api/auth', authRoutes); // TODO: Implementar authRoutes
// app.use('/api/pedidos', pedidosRoutes); // TODO: Implementar pedidosRoutes

// ========================================
// 🔄 WEBSOCKETS OPTIMIZADOS PARA GPS
// ========================================
const activeConnections = new Map();
const repartidorLocations = new Map();
const pedidoTrackingRooms = new Map();

// Configuración de heartbeat para conexiones estables
const heartbeatInterval = setInterval(() => {
    io.emit('ping');
}, 30000); // Cada 30 segundos

io.on('connection', (socket) => {
    console.log(`🔗 Cliente conectado: ${socket.id}`);

    // Registrar conexión activa
    activeConnections.set(socket.id, {
        connectedAt: new Date(),
        userId: null,
        userType: null,
        lastActivity: new Date()
    });

    // ========================================
    // 🚚 SEGUIMIENTO GPS OPTIMIZADO
    // ========================================

    // Registrar repartidor para tracking
    socket.on('registrar-repartidor', (data) => {
        const { repartidorId, pedidoIds } = data;

        if (!repartidorId) {
            socket.emit('error', { message: 'ID de repartidor requerido' });
            return;
        }

        // Actualizar info de conexión
        const connection = activeConnections.get(socket.id);
        if (connection) {
            connection.userId = repartidorId;
            connection.userType = 'repartidor';
            connection.lastActivity = new Date();
        }

        // Registrar en mapa de ubicaciones
        if (!repartidorLocations.has(repartidorId)) {
            repartidorLocations.set(repartidorId, {
                socketId: socket.id,
                ubicacion: null,
                lastUpdate: null,
                pedidosActivos: new Set(pedidoIds || [])
            });
        } else {
            // Actualizar socket ID existente
            const existing = repartidorLocations.get(repartidorId);
            existing.socketId = socket.id;
            existing.pedidosActivos = new Set([...existing.pedidosActivos, ...(pedidoIds || [])]);
        }

        // Unirse a salas de pedidos
        if (pedidoIds && Array.isArray(pedidoIds)) {
            pedidoIds.forEach(pedidoId => {
                socket.join(`tracking-${pedidoId}`);

                // Registrar room para tracking
                if (!pedidoTrackingRooms.has(pedidoId)) {
                    pedidoTrackingRooms.set(pedidoId, new Set());
                }
                pedidoTrackingRooms.get(pedidoId).add(socket.id);
            });
        }

        socket.emit('registro-exitoso', {
            repartidorId,
            pedidosRegistrados: pedidoIds || []
        });

        console.log(`📍 Repartidor ${repartidorId} registrado para tracking`);
    });

    // Actualización de ubicación GPS (optimizada)
    socket.on('actualizar-ubicacion', async (data) => {
        const { repartidorId, lat, lng, accuracy, timestamp, speed, heading } = data;

        if (!repartidorId || !lat || !lng) {
            socket.emit('error', { message: 'Datos de ubicación incompletos' });
            return;
        }

        const repartidor = repartidorLocations.get(repartidorId);
        if (!repartidor) {
            socket.emit('error', { message: 'Repartidor no registrado' });
            return;
        }

        // Actualizar ubicación
        const ubicacionData = {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            accuracy: accuracy || 0,
            timestamp: timestamp || new Date().toISOString(),
            speed: speed || 0,
            heading: heading || 0
        };

        repartidor.ubicacion = ubicacionData;
        repartidor.lastUpdate = new Date();

        // Actualizar actividad de conexión
        const connection = activeConnections.get(socket.id);
        if (connection) {
            connection.lastActivity = new Date();
        }

        // Emitir a todos los pedidos activos de este repartidor
        for (const pedidoId of repartidor.pedidosActivos) {
            socket.to(`tracking-${pedidoId}`).emit('ubicacion-repartidor', {
                repartidorId,
                pedidoId,
                ubicacion: ubicacionData
            });
        }

        // Guardar ubicación (async, no bloquear)
        guardarUbicacionAsync(repartidorId, ubicacionData).catch(err =>
            console.error('Error guardando ubicación:', err)
        );

        // Confirmar recepción
        socket.emit('ubicacion-confirmada', {
            timestamp: ubicacionData.timestamp
        });
    });

    // Cliente se une al tracking de un pedido
    socket.on('seguir-pedido', (data) => {
        const { pedidoId, clienteId } = data;

        if (!pedidoId) {
            socket.emit('error', { message: 'ID de pedido requerido' });
            return;
        }

        socket.join(`tracking-${pedidoId}`);

        // Actualizar info de conexión
        const connection = activeConnections.get(socket.id);
        if (connection) {
            connection.userId = clienteId;
            connection.userType = 'cliente';
            connection.lastActivity = new Date();
        }

        // Enviar ubicación actual del repartidor si está disponible
        const repartidorActual = Array.from(repartidorLocations.values())
            .find(r => r.pedidosActivos.has(pedidoId));

        if (repartidorActual && repartidorActual.ubicacion) {
            socket.emit('ubicacion-repartidor', {
                pedidoId,
                ubicacion: repartidorActual.ubicacion
            });
        }

        console.log(`👀 Cliente siguiendo pedido: ${pedidoId}`);
    });

    // ========================================
    // 💬 CHAT EN TIEMPO REAL
    // ========================================
    socket.on('unirse-chat', (data) => {
        const { pedidoId, userId, userType } = data;
        socket.join(`chat-${pedidoId}`);

        // Actualizar info de conexión
        const connection = activeConnections.get(socket.id);
        if (connection) {
            connection.userId = userId;
            connection.userType = userType;
            connection.lastActivity = new Date();
        }

        console.log(`💬 Usuario ${userId} (${userType}) unido al chat del pedido ${pedidoId}`);
    });

    socket.on('enviar-mensaje', async (data) => {
        const { pedidoId, mensaje, remitente, remitenteId } = data;

        const nuevoMensaje = {
            id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            pedidoId,
            mensaje: mensaje.trim(),
            remitente,
            remitenteId,
            timestamp: new Date().toISOString(),
            leido: false
        };

        // Emitir a todos en el chat
        io.to(`chat-${pedidoId}`).emit('nuevo-mensaje', nuevoMensaje);

        // Guardar mensaje (async)
        guardarMensajeAsync(pedidoId, nuevoMensaje).catch(err =>
            console.error('Error guardando mensaje:', err)
        );

        console.log(`💬 Mensaje en pedido ${pedidoId}: ${mensaje.substring(0, 50)}...`);
    });

    // ========================================
    // 📊 EVENTOS CEO/ADMIN
    // ========================================
    socket.on('ceo-dashboard', (data) => {
        const { userId, action } = data;

        // Verificar permisos CEO (simplificado para demo)
        if (!userId || !userId.includes('ceo') && !userId.includes('admin')) {
            socket.emit('error', { message: 'Acceso denegado' });
            return;
        }

        socket.join('ceo-dashboard');

        // Enviar estadísticas en tiempo real
        if (action === 'get-stats') {
            const stats = obtenerEstadisticasEnVivo();
            socket.emit('ceo-stats', stats);
        }
    });

    // ========================================
    // 🔌 GESTIÓN DE DESCONEXIONES
    // ========================================
    socket.on('disconnect', (reason) => {
        console.log(`🔌 Cliente desconectado: ${socket.id} (${reason})`);

        const connection = activeConnections.get(socket.id);
        if (connection && connection.userType === 'repartidor') {
            // Limpiar tracking de repartidor
            const repartidorId = connection.userId;
            const repartidor = repartidorLocations.get(repartidorId);

            if (repartidor) {
                // Notificar desconexión a pedidos activos
                for (const pedidoId of repartidor.pedidosActivos) {
                    socket.to(`tracking-${pedidoId}`).emit('repartidor-desconectado', {
                        repartidorId,
                        pedidoId
                    });
                }

                // Remover de ubicaciones activas después de 2 minutos
                setTimeout(() => {
                    repartidorLocations.delete(repartidorId);
                }, 120000);
            }
        }

        // Limpiar conexión activa
        activeConnections.delete(socket.id);

        // Limpiar rooms de tracking
        pedidoTrackingRooms.forEach((sockets, pedidoId) => {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
                pedidoTrackingRooms.delete(pedidoId);
            }
        });
    });

    // Responder a ping para mantener conexión
    socket.on('pong', () => {
        const connection = activeConnections.get(socket.id);
        if (connection) {
            connection.lastActivity = new Date();
        }
    });
});

// ========================================
// 💾 FUNCIONES AUXILIARES OPTIMIZADAS
// ========================================
async function guardarUbicacionAsync(repartidorId, ubicacion) {
    try {
        const fecha = new Date().toISOString().split('T')[0];
        const archivo = path.join(BASE_DIR, 'ubicaciones', `${repartidorId}-${fecha}.json`);

        let ubicaciones = [];
        try {
            const contenido = await fs.readFile(archivo, 'utf8');
            ubicaciones = JSON.parse(contenido);
        } catch (error) {
            // Archivo no existe, crear nuevo
        }

        ubicaciones.push(ubicacion);

        // Mantener solo las últimas 1000 ubicaciones
        if (ubicaciones.length > 1000) {
            ubicaciones = ubicaciones.slice(-1000);
        }

        await fs.writeFile(archivo, JSON.stringify(ubicaciones, null, 2));
    } catch (error) {
        console.error('Error guardando ubicación:', error);
    }
}

async function guardarMensajeAsync(pedidoId, mensaje) {
    try {
        const archivo = path.join(BASE_DIR, 'chats', `${pedidoId}.json`);

        let mensajes = [];
        try {
            const contenido = await fs.readFile(archivo, 'utf8');
            mensajes = JSON.parse(contenido);
        } catch (error) {
            // Archivo no existe, crear nuevo
        }

        mensajes.push(mensaje);
        await fs.writeFile(archivo, JSON.stringify(mensajes, null, 2));
    } catch (error) {
        console.error('Error guardando mensaje:', error);
    }
}

function obtenerEstadisticasEnVivo() {
    return {
        conexionesActivas: activeConnections.size,
        repartidoresEnLinea: repartidorLocations.size,
        pedidosSeguimiento: pedidoTrackingRooms.size,
        timestamp: new Date().toISOString()
    };
}

async function obtenerAnalyticsCEO() {
    // Implementar lógica de analytics para CEO
    return {
        pedidosHoy: 0,
        ingresos: 0,
        repartidoresActivos: repartidorLocations.size,
        conexiones: activeConnections.size
    };
}

async function obtenerUsuariosCEO() {
    // Implementar lógica de gestión de usuarios
    return {
        total: 0,
        activos: 0,
        nuevos: 0
    };
}

// ========================================
// 🧹 LIMPIEZA PERIÓDICA DE MEMORIA
// ========================================
setInterval(() => {
    const ahora = new Date();
    const cincoMinutosAtras = new Date(ahora.getTime() - 5 * 60 * 1000);

    // Limpiar conexiones inactivas
    for (const [socketId, connection] of activeConnections) {
        if (connection.lastActivity < cincoMinutosAtras) {
            activeConnections.delete(socketId);
        }
    }

    // Limpiar ubicaciones de repartidores inactivos
    for (const [repartidorId, repartidor] of repartidorLocations) {
        if (repartidor.lastUpdate && repartidor.lastUpdate < cincoMinutosAtras) {
            repartidorLocations.delete(repartidorId);
        }
    }

    console.log(`🧹 Limpieza: ${activeConnections.size} conexiones, ${repartidorLocations.size} repartidores`);
}, 300000); // Cada 5 minutos

// ========================================
// 🚀 INICIAR SERVIDOR
// ========================================
async function iniciarServidor() {
    try {
        await verificarCarpetas();

        server.listen(PORT, HOST, () => {
            console.log('='.repeat(50));
            console.log('🚀 YAVOY v3.1 ENTERPRISE SERVER INICIADO');
            console.log('='.repeat(50));
            console.log(`🌐 Servidor: http://${HOST}:${PORT}`);
            console.log(`📊 WebSockets optimizados para GPS activados`);
            console.log(`🛡️  Seguridad CEO Enterprise activada`);
            console.log(`⚡ Modo Producción Hostinger optimizado`);
            console.log(`🔗 Conexiones activas: ${activeConnections.size}`);
            console.log('='.repeat(50));
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('🛑 Cerrando servidor graciosamente...');
            clearInterval(heartbeatInterval);
            server.close(() => {
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

iniciarServidor();