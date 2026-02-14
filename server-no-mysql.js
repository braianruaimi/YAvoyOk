// =============================
// SEQUELIZE: Sincronización de modelos con MySQL (COMENTADO PARA TESTING)
// =============================

const sequelize = require('./config/database');
const Usuario = require('./models/Usuario');
const Pedido = require('./models/Pedido');

// =============================
// Features Premium - Modelos MySQL
// =============================
const Calificacion = require('./models/Calificacion');
const PuntosRecompensas = require('./models/PuntosRecompensas');
const Propina = require('./models/Propina');

// COMENTADO: Conexión MySQL para testing sin base de datos
/*
(async () => {
  try {
    console.log('🔄 Conectando a MySQL...');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
    
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos Sequelize sincronizados con la base de datos.');
  } catch (error) {
    console.error('❌ ERROR CRÍTICO: No se pudo conectar a MySQL');
    console.error('   Razón:', error.message);
    console.error('\n🔧 SOLUCIONES:');
    console.error('   1. Verifica las credenciales en .env');
    console.error('   2. Habilita acceso remoto en Hostinger Panel:');
    console.error('      → https://hpanel.hostinger.com');
    console.error('      → Databases → Remote MySQL');
    console.error('      → Agrega tu IP o usa % (todas las IPs)');
    console.error('\n💡 Tu IP actual puede ser diferente. Ejecuta: curl ifconfig.me');
    console.error('   IP detectada en el error:', error.message.match(/'([0-9.]+)'/)?.[1] || 'desconocida');
    
    process.exit(1); // Detener el servidor si MySQL falla
  }
})();
*/

// TESTING MODE: Continuar sin MySQL
console.log('⚠️  MODO TESTING: Iniciando servidor SIN conexión MySQL');
console.log('🧪 Para testing de endpoints que no requieren base de datos');

// ====================================
// YAVOY v3.1 - SERVIDOR SEGURO CON CIBERSEGURIDAD AVANZADA
// ====================================
// Sistema de entregas con autenticación JWT y seguridad robusta
// + WebAuthn Biometrics + 2FA/TOTP + IP Validation

require('dotenv').config(); // Cargar variables de entorno desde .env
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const webpush = require('web-push');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const http = require('http');
const { Server } = require('socket.io');

// =======================================
// YAVOY - MÓDULO DE SEGURIDAD AVANZADA v3.1 ENTERPRISE
// =======================================
// Configuración de seguridad de grado empresarial con:
// - Headers HTTP seguros (Helmet)
// - Autenticación multifactor (JWT + Refresh Tokens)
// - Rate limiting avanzado
// - Sanitización de inputs
// - Prevención de ataques comunes

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss');
const validator = require('validator');

console.log('🔐 Módulo de Seguridad Avanzada YAvoy v3.1 Enterprise inicializado');

const app = express();
const server = http.createServer(app);

// =======================================
// CONFIGURACIÓN DE SOCKET.IO v3.1
// =======================================

const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:5502"],
    methods: ["GET", "POST"]
  }
});

// =======================================
// CONFIGURACIÓN NODEMAILER - HOSTINGER SMTP
// =======================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'yavoyen5@yavoy.space',
    pass: process.env.SMTP_PASS || 'BrainCesar26!'
  },
  tls: {
    rejectUnauthorized: process.env.SMTP_TLS === 'false' ? false : true
  }
});

console.log('📧 Inicializando transporter SMTP:');
console.log(`   Host: ${process.env.SMTP_HOST || 'smtp.hostinger.com'}`);
console.log(`   Puerto: ${process.env.SMTP_PORT || 465}`);
console.log(`   Usuario: ${process.env.SMTP_USER || 'yavoyen5@yavoy.space'}`);
console.log(`   Secure (SSL): ${process.env.SMTP_SECURE || 'true'}`);

// =======================================
// IMPORTAR ESQUEMAS DE VALIDACIÓN
// =======================================

const esquemas = require('./src/schemas');
console.log('Esquemas importados:', Object.keys(esquemas));

// =======================================
// CONFIGURACIÓN DE SEGURIDAD HELMET
// =======================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

console.log('✅ Helmet configurado - Headers de seguridad activados');

// =======================================
// CONFIGURACIÓN AVANZADA DE CORS
// =======================================

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5502',
  'https://yavoy.com.ar',
  'https://www.yavoy.com.ar'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('⚠️ CORS: Origen no permitido'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

console.log('✅ CORS configurado - Orígenes:', allowedOrigins.join(','));

// =======================================
// RATE LIMITING AVANZADO
// =======================================

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP cada 15 min
  message: '⚠️ Demasiadas solicitudes desde esta IP, prueba de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por IP cada 15 min
  message: '❌ Demasiados intentos de login. Espera 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting
app.use(generalLimiter);

// =======================================
// MIDDLEWARE DE PARSING Y SANITIZACIÓN
// =======================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Función de sanitización
function sanitizeInput(req, res, next) {
  for (let key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = validator.escape(req.body[key]);
      req.body[key] = xss(req.body[key]);
    }
  }
  next();
}

app.use(sanitizeInput);
console.log('✅ Sanitización de inputs activada');

// =======================================
// REGISTRO DE RUTAS
// =======================================

// 1. Rutas de autenticación
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authLimiter, authRoutes);
console.log('✅ Rutas de autenticación registradas: /api/auth/*');

// 2. Rutas de seguridad avanzada
const securityRoutes = require('./src/routes/securityRoutes');
app.use('/api/security', generalLimiter, securityRoutes);
console.log('✅ Rutas de seguridad avanzada registradas: /api/security/*');

// 3. Rutas de MercadoPago
const mercadoPagoRoutes = require('./src/routes/mercadopagoRoutes');
app.use('/api/mercadopago', generalLimiter, mercadoPagoRoutes);
console.log('✅ Rutas de MercadoPago registradas: /api/mercadopago/*');

// 4. Rutas CEO
const ceoRoutes = require('./src/routes/ceoRoutes');
app.use('/api/ceo', generalLimiter, ceoRoutes);
console.log('✅ Rutas CEO registradas: /api/ceo/*');

// 5. Rutas de pedidos
const pedidosRoutes = require('./src/routes/pedidosRoutes');
app.use('/api/pedidos', generalLimiter, pedidosRoutes);
console.log('✅ Rutas de pedidos registradas: /api/pedidos/*');

// 6. Rutas Features Premium
const premiumFeaturesRoutes = require('./src/routes/premiumFeaturesRoutes');
app.use('/api/premium', generalLimiter, premiumFeaturesRoutes);
console.log('✅ Rutas Features Premium registradas: /api/premium/* (Calificaciones, Puntos, Propinas)');

// 7. Rutas de debug
const debugRoutes = require('./src/routes/debugRoutes');
app.use('/api/debug', generalLimiter, debugRoutes);
console.log('🧪 Rutas de debug disponibles: /api/debug/*');

// =======================================
// CONFIGURACIÓN ARCHIVOS ESTÁTICOS (DESPUÉS DE RUTAS API)
// =======================================

console.log('🔧 Configurando middleware de archivos estáticos...');
app.use(express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));
console.log('✅ Middleware de archivos estáticos configurado DESPUÉS de las rutas API');

// =======================================
// VARIABLES GLOBALES Y CONFIGURACIÓN
// =======================================

// Variables para el sistema
let usuarios = [];
let repartidores = [];
let comercios = [];
let pedidos = [];  
let productos = [];
let calificaciones = [];
let mensajes = [];

// Configurar variables en app para acceso global
app.set('usuarios', usuarios);
app.set('repartidores', repartidores);
app.set('comercios', comercios);
app.set('pedidos', pedidos);
app.set('productos', productos);
app.set('calificaciones', calificaciones);
app.set('mensajes', mensajes);

// =======================================
// SISTEMA DE SOPORTE Y TICKETS
// =======================================
const soporteRoutes = require('./src/routes/soporteRoutes');
app.use('/api/soporte', generalLimiter, soporteRoutes);
console.log('✅ Sistema de soporte inicializado');

// =======================================
// INICIALIZACIÓN DEL SISTEMA
// =======================================

const PORT = process.env.PORT || 5502;
const HOST = process.env.HOST || '0.0.0.0';

// Inicializar directorios y cargar datos únicamente
async function inicializarSistema() {
  try {
    await crearDirectorios();
    console.log('✓ Directorios inicializados correctamente.');
    
    await crearCarpetasTerminos();
    console.log('✓ Carpetas de términos creadas para: 2026-02');
    
    await cargarRepartidores();
    const numRepartidores = app.get('repartidores').length;
    console.log(`✓ ${numRepartidores} repartidor(es) cargado(s) desde archivos.`);
    
    await cargarPedidos();
    const numPedidos = app.get('pedidos').length;
    console.log(`✓ ${numPedidos} pedido(s) cargado(s) desde archivos.`);
    
    await cargarCalificaciones();
    console.log('📊 No hay calificaciones previas, iniciando array vacío');
    
  } catch (error) {
    console.error('❌ Error durante inicialización:', error);
    console.log('⚠️  Continuando con sistema básico...');
  }
}

// Función para crear directorios necesarios
async function crearDirectorios() {
  const directorios = [
    './registros',
    './registros/usuarios',
    './registros/repartidores', 
    './registros/comercios',
    './registros/pedidos',
    './registros/mensajes',
    './registros/productos',
    './registros/calificaciones',
    './logs'
  ];

  for (const directorio of directorios) {
    try {
      await fs.mkdir(directorio, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`Error creando directorio ${directorio}:`, error);
      }
    }
  }
}

// Función para crear carpetas de términos por mes
async function crearCarpetasTerminos() {
  const fechaActual = new Date();
  const anio = fechaActual.getFullYear();
  const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
  
  const carpetaTerminos = `./terminos/${anio}-${mes}`;
  
  try {
    await fs.mkdir(carpetaTerminos, { recursive: true });
    await fs.mkdir(`${carpetaTerminos}/cookies`, { recursive: true });
    await fs.mkdir(`${carpetaTerminos}/privacidad`, { recursive: true });
    await fs.mkdir(`${carpetaTerminos}/terminos-uso`, { recursive: true });
  } catch (error) {
    console.error('Error creando carpetas de términos:', error);
  }
}

// Función para cargar repartidores desde archivos
async function cargarRepartidores() {
  try {
    const archivos = await fs.readdir('./registros/repartidores');
    const repartidores = app.get('repartidores');
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const contenido = await fs.readFile(`./registros/repartidores/${archivo}`, 'utf8');
        const repartidor = JSON.parse(contenido);
        repartidores.push(repartidor);
      }
    }
    
    app.set('repartidores', repartidores);
  } catch (error) {
    console.error('No se pudieron cargar repartidores:', error.message);
  }
}

// Función para cargar pedidos desde archivos
async function cargarPedidos() {
  try {
    const archivos = await fs.readdir('./registros/pedidos');
    const pedidos = app.get('pedidos');
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const contenido = await fs.readFile(`./registros/pedidos/${archivo}`, 'utf8');
        const pedido = JSON.parse(contenido);
        pedidos.push(pedido);
      }
    }
    
    app.set('pedidos', pedidos);
  } catch (error) {
    console.error('No se pudieron cargar pedidos:', error.message);
  }
}

// Función para cargar calificaciones desde archivos
async function cargarCalificaciones() {
  try {
    const archivos = await fs.readdir('./registros/calificaciones');
    const calificaciones = app.get('calificaciones');
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const contenido = await fs.readFile(`./registros/calificaciones/${archivo}`, 'utf8');
        const calificacion = JSON.parse(contenido);
        calificaciones.push(calificacion);
      }
    }
    
    app.set('calificaciones', calificaciones);
  } catch (error) {
    // Es natural que no existan archivos aún
    console.log('No hay archivos de calificaciones previos, iniciando sistema limpio');
  }
}

// =======================================
// ARRANQUE DEL SERVIDOR
// =======================================

server.listen(PORT, HOST, async () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       🚀 YAVOY v3.1 - SERVIDOR SEGURO INICIADO              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🌐 Servidor: http://localhost:${PORT}`);
  console.log(`📁 Registros: ${__dirname}/registros`);
  console.log(`🔌 Socket.IO: ✅ Activo (notificaciones en tiempo real)`);
  console.log(`🔐 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('🛡️  SEGURIDAD ACTIVADA:');
  console.log('   ✅ Helmet - Headers HTTP seguros');
  console.log('   ✅ CORS - Control de acceso restrictivo');
  console.log('   ✅ Rate Limiting - Protección contra ataques DDoS');
  console.log('   ✅ JWT Authentication - Autenticación por tokens');
  console.log('   ✅ bcrypt - Hash seguro de contraseñas (10 rounds)');
  console.log('   ✅ Input Sanitization - Prevención de inyección');
  console.log('');
  console.log('📡 ENDPOINTS DISPONIBLES:');
  console.log('');
  console.log('   🔐 AUTENTICACIÓN:');
  console.log('      POST /api/auth/register/comercio   - Registrar comercio');
  console.log('      POST /api/auth/register/repartidor - Registrar repartidor');
  console.log('      POST /api/auth/login               - Login universal');
  console.log('      POST /api/auth/refresh             - Renovar token');
  console.log('      GET  /api/auth/me                  - Info usuario [AUTH]');
  console.log('      POST /api/auth/change-password     - Cambiar contraseña [AUTH]');
  console.log('      GET  /api/auth/docs                - Documentación API');
  console.log('');
  console.log('   📦 PEDIDOS (MVC):');
  console.log('      POST /api/pedidos                  - Crear pedido'); 
  console.log('      GET  /api/pedidos                  - Listar pedidos');
  console.log('      GET  /api/pedidos/:id              - Ver pedido específico');
  console.log('      PATCH /api/pedidos/:id/estado      - Actualizar estado');
  console.log('      PUT  /api/pedidos/:id/estado       - Actualizar estado (alt)');
  console.log('');
  console.log('   🧪 DEBUG:');  
  console.log('      GET  /api/debug/test-router        - Test conexión');
  console.log('      GET  /api/debug/security-status    - Estado seguridad');
  console.log('');
  
  await inicializarSistema();
  
  console.log('');
  console.log('⚠️  MODO TESTING ACTIVO - Sin conexión MySQL');
  console.log('🧪 Endpoints disponibles para testing sin base de datos');
  console.log('');
});

module.exports = { app, server, io };