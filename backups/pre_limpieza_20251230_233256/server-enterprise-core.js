/**
 * ========================================
 * YAVOY v3.1 ENTERPRISE - SERVER UNIFICADO
 * ========================================
 * Principal Software Engineer: Arquitectura de Nivel Empresarial
 * 
 * CARACTERÍSTICAS:
 * ✅ PostgreSQL como persistencia principal
 * ✅ Validación Joi en TODOS los endpoints
 * ✅ Error handling global
 * ✅ WebSockets con Rooms por ciudad
 * ✅ Rate limiting avanzado
 * ✅ Integración completa v3.0_socio
 * ✅ Security headers (Helmet)
 * ✅ Logging centralizado
 * ✅ Connection pooling
 * ✅ Transacciones ACID
 * 
 * @version 3.1.0-enterprise
 * @date 21 de diciembre de 2025
 */

// ============================================
// DEPENDENCIAS
// ============================================
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Validación
const { schemas, validate, validateAll } = require('./src/validation/schemas');

// ============================================
// CONFIGURACIÓN
// ============================================
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// CONEXIÓN A POSTGRESQL
// ============================================
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'yavoy_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Eventos del pool
pool.on('connect', () => {
    console.log('✅ PostgreSQL: Nueva conexión establecida');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL: Error inesperado', err);
    process.exit(-1);
});

// ============================================
// MIDDLEWARE GLOBAL
// ============================================

// Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://sdk.mercadopago.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "ws:", "wss:", "https://api.mercadopago.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'", "https://www.mercadopago.com.ar"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true
}));

// Compression
app.use(compression());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/registros', express.static(path.join(__dirname, 'registros')));

// ============================================
// RATE LIMITING
// ============================================

// Limiter general
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: { success: false, error: 'Demasiadas peticiones, intenta más tarde' },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiter para autenticación
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Solo 5 intentos
    skipSuccessfulRequests: true,
    message: { success: false, error: 'Demasiados intentos de login' }
});

// Limiter para creación de recursos
const createLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 10,
    message: { success: false, error: 'Límite de creación excedido, espera un minuto' }
});

// ============================================
// MIDDLEWARE DE ERROR HANDLING GLOBAL
// ============================================

/**
 * Wrapper async para capturar errores automáticamente
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Logger de errores
 */
const errorLogger = async (err, req, res, next) => {
    console.error('❌ ERROR:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
    });

    // Guardar en base de datos
    try {
        await pool.query(`
            INSERT INTO system_logs (evento, descripcion, nivel, endpoint, metodo, datos)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            'error_global',
            err.message,
            'error',
            req.path,
            req.method,
            JSON.stringify({ stack: err.stack, body: req.body })
        ]);
    } catch (logError) {
        console.error('Error guardando log:', logError);
    }

    next(err);
};

/**
 * Handler de errores final
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = NODE_ENV === 'production' 
        ? 'Error interno del servidor' 
        : err.message;

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(NODE_ENV === 'development' && { stack: err.stack })
    });
};

// ============================================
// WEBSOCKETS CON ROOMS POR CIUDAD
// ============================================

const usuariosConectados = new Map(); // userId -> { socketId, tipo, ciudad, ubicacion }
const roomsPorCiudad = new Map(); // ciudad -> Set<socketId>

io.on('connection', (socket) => {
    console.log(`🔌 Socket conectado: ${socket.id}`);

    /**
     * Registro de usuario
     */
    socket.on('registrar', async (data) => {
        try {
            const { userId, tipo, ciudad, ubicacion } = data;

            // Guardar usuario conectado
            usuariosConectados.set(userId, {
                socketId: socket.id,
                tipo,
                ciudad: ciudad || 'general',
                ubicacion,
                conectadoEn: new Date()
            });

            // Unir a rooms
            socket.join(`user-${userId}`);
            socket.join(`tipo-${tipo}`);
            
            const ciudadRoom = `ciudad-${ciudad || 'general'}`;
            socket.join(ciudadRoom);

            // Registrar en Map de ciudades
            if (!roomsPorCiudad.has(ciudadRoom)) {
                roomsPorCiudad.set(ciudadRoom, new Set());
            }
            roomsPorCiudad.get(ciudadRoom).add(socket.id);

            // Si es repartidor, actualizar ubicación en DB
            if (tipo === 'repartidor' && ubicacion) {
                await pool.query(`
                    UPDATE delivery_persons 
                    SET ubicacion_actual_lat = $1, 
                        ubicacion_actual_lng = $2,
                        ultima_actualizacion_gps = NOW()
                    WHERE id = $3
                `, [ubicacion.lat, ubicacion.lng, userId]);
            }

            console.log(`✅ Usuario registrado: ${userId} (${tipo}) en ${ciudadRoom}`);
            socket.emit('registrado', { success: true, ciudad: ciudadRoom });

        } catch (error) {
            console.error('Error en registro socket:', error);
            socket.emit('error', { message: 'Error en registro' });
        }
    });

    /**
     * Actualización de ubicación (repartidores)
     */
    socket.on('actualizarUbicacion', async (data) => {
        try {
            const { userId, lat, lng } = data;

            await pool.query(`
                UPDATE delivery_persons 
                SET ubicacion_actual_lat = $1, 
                    ubicacion_actual_lng = $2,
                    ultima_actualizacion_gps = NOW()
                WHERE id = $3
            `, [lat, lng, userId]);

            // Notificar a pedidos activos
            const pedidosActivos = await pool.query(`
                SELECT id, cliente_id FROM orders 
                WHERE repartidor_id = $1 AND estado IN ('aceptado', 'en_camino')
            `, [userId]);

            pedidosActivos.rows.forEach(pedido => {
                io.to(`user-${pedido.cliente_id}`).emit('ubicacionRepartidor', {
                    pedidoId: pedido.id,
                    lat,
                    lng
                });
            });

        } catch (error) {
            console.error('Error actualizando ubicación:', error);
        }
    });

    /**
     * Enviar mensaje de chat
     */
    socket.on('enviarMensaje', async (data) => {
        try {
            const { pedidoId, userId, mensaje, tipoUsuario, nombreUsuario } = data;

            // Guardar mensaje en DB
            const result = await pool.query(`
                INSERT INTO chat_messages (order_id, user_id, mensaje, tipo_usuario, nombre_usuario)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [pedidoId, userId, mensaje, tipoUsuario, nombreUsuario]);

            const nuevoMensaje = result.rows[0];

            // Emitir a room del pedido
            io.to(`pedido-${pedidoId}`).emit('nuevoMensaje', nuevoMensaje);

        } catch (error) {
            console.error('Error enviando mensaje:', error);
            socket.emit('error', { message: 'Error enviando mensaje' });
        }
    });

    /**
     * Notificar nuevo pedido (optimizado por ciudad)
     */
    socket.on('nuevoPedido', async (pedido) => {
        try {
            // Extraer ciudad de la dirección
            const ciudad = pedido.ciudad || 'general';
            const ciudadRoom = `ciudad-${ciudad}`;

            // Emitir solo a repartidores de esa ciudad
            io.to(ciudadRoom).to('tipo-repartidor').emit('nuevoPedido', pedido);
            
            // Emitir a comercio
            if (pedido.comercioId) {
                io.to(`user-${pedido.comercioId}`).emit('nuevoPedido', pedido);
            }

            console.log(`📦 Nuevo pedido notificado a ${ciudadRoom}`);

        } catch (error) {
            console.error('Error notificando pedido:', error);
        }
    });

    /**
     * Actualización de estado de pedido
     */
    socket.on('actualizarEstadoPedido', async (data) => {
        try {
            const { pedidoId, estado, clienteId, repartidorId, comercioId } = data;

            // Notificar a todos los involucrados
            if (clienteId) io.to(`user-${clienteId}`).emit('pedidoActualizado', data);
            if (repartidorId) io.to(`user-${repartidorId}`).emit('pedidoActualizado', data);
            if (comercioId) io.to(`user-${comercioId}`).emit('pedidoActualizado', data);

            // Notificar a room del pedido
            io.to(`pedido-${pedidoId}`).emit('pedidoActualizado', data);

        } catch (error) {
            console.error('Error actualizando estado:', error);
        }
    });

    /**
     * Desconexión
     */
    socket.on('disconnect', () => {
        // Buscar usuario por socketId
        let userIdDesconectado = null;
        for (const [userId, userData] of usuariosConectados.entries()) {
            if (userData.socketId === socket.id) {
                userIdDesconectado = userId;
                const ciudadRoom = `ciudad-${userData.ciudad}`;
                
                // Remover de Map de ciudades
                if (roomsPorCiudad.has(ciudadRoom)) {
                    roomsPorCiudad.get(ciudadRoom).delete(socket.id);
                }
                
                usuariosConectados.delete(userId);
                break;
            }
        }

        console.log(`❌ Socket desconectado: ${socket.id}${userIdDesconectado ? ` (${userIdDesconectado})` : ''}`);
    });
});

// Exponer io para uso en rutas
app.set('io', io);
app.set('pool', pool);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Ejecutar query con manejo de errores
 */
async function ejecutarQuery(query, params = []) {
    const client = await pool.connect();
    try {
        const resultado = await client.query(query, params);
        return { success: true, data: resultado.rows, rowCount: resultado.rowCount };
    } catch (error) {
        console.error('Error en query:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Ejecutar transacción
 */
async function ejecutarTransaccion(queries) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const resultados = [];
        for (const { query, params } of queries) {
            const resultado = await client.query(query, params);
            resultados.push(resultado.rows);
        }
        
        await client.query('COMMIT');
        return { success: true, data: resultados };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en transacción:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Exponer helpers
app.set('ejecutarQuery', ejecutarQuery);
app.set('ejecutarTransaccion', ejecutarTransaccion);

// ============================================
// CONTINÚA EN server-enterprise-routes.js
// ============================================

module.exports = { app, server, io, pool, ejecutarQuery, ejecutarTransaccion };
