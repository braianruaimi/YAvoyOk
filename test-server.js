/**
 * Test Server - YAvoy v3.1 Enterprise
 * Servidor de prueba para verificar que todo funciona
 */

require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// Endpoint simple de prueba
app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Test Server funcionando',
        timestamp: new Date().toISOString(),
        nodejs: process.version,
        uptime: process.uptime()
    });
});

// Health check básico
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        server: 'YAvoy Test',
        timestamp: new Date().toISOString()
    });
});

const PORT = 5502;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(40));
    console.log('🧪 TEST SERVER INICIADO');
    console.log('='.repeat(40));
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📊 Endpoints:`);
    console.log(`   GET /test     - Prueba básica`);
    console.log(`   GET /health   - Health check`);
    console.log('='.repeat(40));
    console.log('Presiona Ctrl+C para detener...');
});

// Mantener el servidor vivo
process.on('SIGINT', () => {
    console.log('\\n🛑 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

module.exports = app;