const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

// Configuración para testing inclusivo
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5502'],
    credentials: true
}));

// Servir archivos estáticos
app.use(express.static(__dirname));

// Headers de seguridad y PWA
app.use((req, res, next) => {
    // PWA headers
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'max-age=31536000');
    
    // Accesibilidad headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // CORS para service worker
    if (req.url.includes('sw-') || req.url.includes('.js')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    next();
});

// Rutas principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/accesibilidad', (req, res) => {
    res.sendFile(path.join(__dirname, 'accesibilidad.html'));
});

app.get('/demo', (req, res) => {
    // Redirigir demo a accesibilidad
    res.redirect('/accesibilidad');
});

// Manifest dinámico con detección de dispositivo
app.get('/manifest.json', (req, res) => {
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    const manifest = {
        name: "YAvoy - Plataforma Inclusiva",
        short_name: "YAvoy",
        description: "Delivery inclusivo y accesible para todos",
        start_url: "/",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#06b6d4",
        orientation: isMobile ? "portrait-primary" : "any",
        categories: ["food", "accessibility", "lifestyle"],
        icons: [
            {
                src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2306b6d4'/%3E%3Ctext x='50' y='65' font-size='50' text-anchor='middle' fill='white'%3E♿%3C/text%3E%3C/svg%3E",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any maskable"
            }
        ]
    };
    
    res.json(manifest);
});

// API para testing de accesibilidad
app.get('/api/accessibility/test', (req, res) => {
    res.json({
        status: 'active',
        features: {
            highContrast: true,
            voiceReader: true,
            keyboardNav: true,
            deviceDetection: true,
            aiChatbot: true,
            pwaEnabled: true
        },
        wcagCompliance: '2.1',
        supportedDevices: ['mobile', 'tablet', 'desktop'],
        version: '1.0.0'
    });
});

// Middleware para logs de accesibilidad
app.use('/accesibilidad', (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = /Android|iPhone|iPad|iPod/i.test(userAgent) ? 'mobile' : 
                      /iPad|tablet/i.test(userAgent) ? 'tablet' : 'desktop';
    
    console.log(`🌟 Acceso Inclusivo - Dispositivo: ${deviceType}, IP: ${req.ip}`);
    next();
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('\n🌟 ====================================');
    console.log('  🚀 SERVIDOR YAVOY INCLUSIVO ACTIVO');
    console.log('🌟 ====================================\n');
    
    console.log(`📱 URLs de prueba:`);
    console.log(`   🏠 Principal: http://localhost:${PORT}`);
    console.log(`   ♿ Accesibilidad: http://localhost:${PORT}/accesibilidad`);
    console.log(`   🤖 API Test: http://localhost:${PORT}/api/accessibility/test`);
    
    console.log(`\n🔧 Funciones de testing:`);
    console.log(`   ✅ PWA instalable`);
    console.log(`   ✅ Service Worker activo`);
    console.log(`   ✅ Detección de dispositivos`);
    console.log(`   ✅ Sistema IA integrado`);
    console.log(`   ✅ Accesibilidad WCAG 2.1`);
    
    console.log(`\n📱 Para probar en móvil:`);
    console.log(`   📲 Conecta a la misma WiFi`);
    console.log(`   🔍 Usa http://[tu-ip-local]:${PORT}`);
    console.log(`   ⬇️ Instala como PWA desde Chrome`);
    
    console.log(`\n✨ Sistema listo para pruebas inclusivas ✨\n`);
});