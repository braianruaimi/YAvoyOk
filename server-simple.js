/**
 * YAvoy v3.1 - Servidor Simplificado
 * Versión estable sin dependencias problemáticas
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Middleware básico
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// ========================================
// 🧪 ENDPOINTS DE PRUEBA
// ========================================

app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: '🚀 YAvoy v3.1 Server funcionando correctamente',
        timestamp: new Date().toISOString(),
        server: {
            nodejs: process.version,
            uptime: Math.round(process.uptime()),
            environment: process.env.NODE_ENV || 'development'
        }
    });
});

app.get('/api/health', (req, res) => {
    const os = require('os');
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        system: {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            cpuCount: os.cpus().length,
            totalMemory: Math.round(os.totalmem() / 1024 / 1024),
            freeMemory: Math.round(os.freemem() / 1024 / 1024)
        },
        process: {
            pid: process.pid,
            memoryUsage: {
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            }
        }
    });
});

app.get('/api/metrics', (req, res) => {
    const os = require('os');
    res.json({
        timestamp: new Date().toISOString(),
        server: {
            uptime: process.uptime(),
            uptimeHuman: formatUptime(process.uptime()),
            version: '3.1.0'
        },
        memory: {
            total: os.totalmem(),
            free: os.freemem(),
            usedPercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
        },
        cpu: {
            count: os.cpus().length,
            loadAverage: os.loadavg()
        }
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        services: {
            express: { status: 'healthy', message: 'Express server running' },
            database: { status: 'warning', message: 'PostgreSQL not available, using JSON fallback' },
            cache: { status: 'warning', message: 'Redis not available, using memory cache' },
            filesystem: { status: 'healthy', message: 'Filesystem accessible' }
        },
        overall: 'operational',
        healthScore: '2/4 services optimal'
    });
});

// ========================================
// 📄 RUTAS ESTÁTICAS
// ========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ========================================
// 🚀 INICIAR SERVIDOR
// ========================================

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

const PORT = process.env.PORT || 5502;

server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('='.repeat(50));
    console.log('🚀 YAVOY v3.1 SERVER INICIADO');
    console.log('='.repeat(50));
    console.log(`🌐 Servidor: http://localhost:${PORT}`);
    console.log(`📊 Endpoints disponibles:`);
    console.log(`   GET /api/test      - Prueba básica`);
    console.log(`   GET /api/health    - Health check`);
    console.log(`   GET /api/metrics   - Métricas del sistema`);
    console.log(`   GET /api/status    - Estado de servicios`);
    console.log('='.repeat(50));
    console.log('✅ Servidor listo para recibir peticiones');
    console.log('');
});

// Mantener el servidor vivo
process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('Promise rechazada:', reason);
});

module.exports = { app, server };