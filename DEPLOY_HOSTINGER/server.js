// ====================================
// YAVOY v4.0 - SERVIDOR MODULAR
// ====================================
// Sistema de entregas completamente modularizado
// Arquitectura MVC con separación de responsabilidades

require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs').promises;
const { Server } = require('socket.io');
const webpush = require('web-push');
const nodemailer = require('nodemailer');

// ========================================
// 🔗 SEQUELIZE - CONEXIÓN MySQL
// ========================================
const sequelize = require('./config/database');
const Usuario = require('./models/usuario');
const Pedido = require('./models/pedido');
const Calificacion = require('./models/calificacion');
const PuntosRecompensas = require('./models/puntos-recompensas');
const Propina = require('./models/propina');

// ========================================
// 🔐 MIDDLEWARE DE SEGURIDAD
// ========================================
const {
    helmetConfig,
    generalLimiter,
    webhookLimiter,
    corsConfig,
    sanitizeInputs,
    securityLogger
} = require('./src/middleware/security');

const { requireAuth, requireRole } = require('./src/middleware/auth');
const { handleMulterError } = require('./src/middleware/upload');

// ========================================
// 🛡️ SEGURIDAD AVANZADA
// ========================================
const securityRoutes = require('./src/security/security-routes');
const { SecurityUtils } = require('./src/security/advanced-security');

// ========================================
// 📦 RUTAS MODULARES
// ========================================
const authRoutes = require('./src/routes/authRoutes');
const pedidosRoutes = require('./src/routes/pedidosRoutes');
const comerciosRoutes = require('./src/routes/comerciosRoutes');
const repartidoresRoutes = require('./src/routes/repartidoresRoutes');
const mercadopagoRoutes = require('./src/routes/mercadopagoRoutes');
const astropayRoutes = require('./src/routes/astropayRoutes');
const ceoRoutes = require('./src/routes/ceoRoutes');
const premiumFeaturesRoutes = require('./src/routes/premiumFeaturesRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const soporteRoutes = require('./src/routes/soporteRoutes');
const mapRoutes = require('./src/routes/mapRoutes');

// ========================================
// 🛠️ CONTROLADORES
// ========================================
const pedidosController = require('./src/controllers/pedidosController');
const repartidoresController = require('./src/controllers/repartidoresController');

// ========================================
// 🛠️ SERVICIOS
// ========================================
const socketService = require('./src/services/socketService');

// ========================================
// 🛠️ UTILIDADES DEL SISTEMA
// ========================================
const { 
  ensureDirectoriesExist, 
  hasWritePermission, 
  cleanOldFiles, 
  getDirectorySize, 
  formatBytes 
} = require('./src/utils/fileSystem');

// ========================================
// ⚙️ CONFIGURACIÓN DE LA APLICACIÓN
// ========================================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:5502"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;
const BASE_DIR = path.join(__dirname, 'registros');

// ========================================
// 📧 CONFIGURACIÓN DE EMAIL (OPCIONAL)
// ========================================
let emailTransporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS !== 'false'
      }
    });
    
    emailTransporter.verify((error, success) => {
      if (error) {
        console.log('⚠️  Email no disponible (verificar credenciales SMTP)');
        emailTransporter = null;
      } else {
        console.log('✅ Sistema de email configurado (Hostinger SMTP)');
      }
    });
  } catch (error) {
    console.log('ℹ️  Email no configurado - funcionando sin notificaciones por email');
    emailTransporter = null;
  }
} else {
  console.log('ℹ️  Email no configurado (servidor funcionará sin notificaciones por email)');
}

// ========================================
// 🔔 CONFIGURACIÓN DE WEB PUSH (VAPID)
// ========================================
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BL4P9zTOxEkQBAmTV3XiyK9305PJDZKoPr52a0NNedpV5OVfuZGlf9SL21zVE9D4AwNfgWzKw8bHA-peL_g-qZs',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'SmZvfO1ZhLtbCrewuGFDnG0gfuTeV5DT9vRBjmWlBL4',
};

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:yavoyen5@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// ========================================
// 💾 ALMACENAMIENTO EN MEMORIA (CACHÉ)
// ========================================
let subscriptions = [];
let pedidos = [];
let chats = {};
let repartidores = [];
let calificaciones = [];
let usuariosConectados = new Map();

// Compartir referencias con la app
app.set('socketio', io);
app.set('pedidos', pedidos);
app.set('repartidores', repartidores);
app.set('calificaciones', calificaciones);
app.set('emailTransporter', emailTransporter);

// ========================================
// 🔌 MIDDLEWARE DE EXPRESS
// ========================================

// 1. Seguridad con Helmet
app.use(helmetConfig);
console.log('✅ Helmet configurado (CSP, XSS, clickjacking)');

// 2. Parseo de JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('✅ Parseo de JSON y formularios activado');

// 3. CORS
app.use(corsConfig);
console.log('✅ CORS configurado');

// 4. Sanitización de inputs
app.use(sanitizeInputs);
console.log('✅ Sanitización de inputs activada');

// 5. Logging de seguridad
app.use(securityLogger);

// ========================================
// 📂 ARCHIVOS ESTÁTICOS Y UPLOADS
// ========================================
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('✅ Archivos estáticos y /uploads servidos');

// ========================================
// 🔍 DEBUG MIDDLEWARE
// ========================================
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`\n🔍 [${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.user) {
      console.log(`   👤 Usuario: ${req.user.id} (${req.user.rol})`);
    }
  }
  next();
});

// ========================================
// 📡 REGISTRO DE RUTAS MODULARES
// ========================================

// Autenticación y seguridad
app.use('/api/auth', authRoutes);
console.log('✅ /api/auth/* - Autenticación JWT');

app.use('/api/security', generalLimiter, securityRoutes);
console.log('✅ /api/security/* - Seguridad avanzada (WebAuthn, 2FA, TOTP)');

// Pedidos
app.use('/api/pedidos', generalLimiter, pedidosRoutes);
console.log('✅ /api/pedidos/* - Gestión de pedidos (crear, listar, actualizar)');

// Comercios
app.use('/api', generalLimiter, comerciosRoutes);
console.log('✅ /api/comercio/*, /api/guardar-comercio, /api/listar-comercios');

// Repartidores
app.use('/api', generalLimiter, repartidoresRoutes);
console.log('✅ /api/repartidores/*, /api/repartidores/:id/ubicacion');

// Pagos
app.use('/api/mercadopago', generalLimiter, mercadopagoRoutes);
console.log('✅ /api/mercadopago/* - Integración MercadoPago');

app.use('/api/astropay', generalLimiter, astropayRoutes);
console.log('✅ /api/astropay/* - Billetera AstroPay');

// CEO Dashboard
app.use('/api/ceo', generalLimiter, ceoRoutes);
console.log('✅ /api/ceo/* - Panel CEO (login, dashboard, informes)');

// Features Premium
app.use('/api/premium', generalLimiter, premiumFeaturesRoutes);
console.log('✅ /api/premium/* - Calificaciones, Puntos, Propinas');

// Chat (NUEVO - Fase 5)
app.use('/api/chat', generalLimiter, chatRoutes);
console.log('✅ /api/chat/* - Sistema de mensajería en tiempo real');

// Analytics (NUEVO - Fase 5)
app.use('/api/analytics', generalLimiter, analyticsRoutes);
console.log('✅ /api/analytics/* - Métricas y estadísticas del CEO');

// Soporte (NUEVO - Fase 5)
app.use('/api/soporte', generalLimiter, soporteRoutes);
console.log('✅ /api/soporte/* - Tickets de ayuda y soporte técnico');

// Mapas y Geolocalización (NUEVO - Fase 6)
app.use('/api/map', generalLimiter, mapRoutes);
console.log('✅ /api/map/* - Sistema de mapas y geolocalización en tiempo real');

// ========================================
// 🧪 RUTAS DE DEBUG
// ========================================
app.get('/api/debug/test-router', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Router funcionando correctamente',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'development',
    version: '4.0-modular'
  });
});

app.get('/api/debug/security-status', (req, res) => {
  res.json({
    success: true,
    security: {
      helmet: 'activo',
      cors: 'activo',
      rateLimiting: 'activo',
      sanitization: 'activo',
      jwtAuth: 'disponible'
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/debug/registros', async (req, res) => {
  const { tipo } = req.query;
  
  try {
    let registros = [];
    
    switch(tipo) {
      case 'terminos':
        const rutaTerminos = path.join(__dirname, 'terminos-aceptados');
        try {
          const archivos = await fs.readdir(rutaTerminos);
          for (const archivo of archivos) {
            if (archivo.endsWith('.json')) {
              const contenido = await fs.readFile(path.join(rutaTerminos, archivo), 'utf-8');
              registros.push(JSON.parse(contenido));
            }
          }
        } catch {}
        break;
        
      case 'emails':
        const rutaEmails = path.join(__dirname, 'emails-registrados');
        try {
          const archivos = await fs.readdir(rutaEmails);
          for (const archivo of archivos) {
            if (archivo.endsWith('.json')) {
              const contenido = await fs.readFile(path.join(rutaEmails, archivo), 'utf-8');
              registros.push(JSON.parse(contenido));
            }
          }
        } catch {}
        break;
        
      case 'telefonos':
        const rutaTelefonos = path.join(__dirname, 'telefonos-registrados');
        try {
          const archivos = await fs.readdir(rutaTelefonos);
          for (const archivo of archivos) {
            if (archivo.endsWith('.json')) {
              const contenido = await fs.readFile(path.join(rutaTelefonos, archivo), 'utf-8');
              registros.push(JSON.parse(contenido));
            }
          }
        } catch {}
        break;
        
      case 'comercios':
        const carpetas = [
          'servicios-prioridad', 'servicios-alimentacion', 'servicios-salud',
          'servicios-bazar', 'servicios-indumentaria', 'servicios-kiosco', 'servicios-otros'
        ];
        for (const carpeta of carpetas) {
          try {
            const archivos = await fs.readdir(path.join(__dirname, carpeta));
            for (const archivo of archivos) {
              if (archivo.endsWith('.json')) {
                const contenido = await fs.readFile(path.join(__dirname, carpeta, archivo), 'utf-8');
                const comercio = JSON.parse(contenido);
                registros.push({
                  id: comercio.id,
                  nombre: comercio.nombre || comercio.nombreComercio,
                  fecha: comercio.fechaRegistro,
                  tipo: 'comercio',
                  activo: comercio.activo
                });
              }
            }
          } catch {}
        }
        break;
        
      case 'repartidores':
        try {
          const archivos = await fs.readdir(path.join(__dirname, 'registros'));
          for (const archivo of archivos) {
            if (archivo.startsWith('repartidor_') && archivo.endsWith('.json')) {
              const contenido = await fs.readFile(path.join(__dirname, 'registros', archivo), 'utf-8');
              const repartidor = JSON.parse(contenido);
              registros.push({
                id: repartidor.id,
                nombre: repartidor.nombre,
                fecha: repartidor.fechaRegistro,
                tipo: 'repartidor',
                activo: repartidor.activo
              });
            }
          }
        } catch {}
        break;
        
      case 'clientes':
        try {
          const archivos = await fs.readdir(path.join(__dirname, 'registros'));
          for (const archivo of archivos) {
            if (archivo.startsWith('cliente_') && archivo.endsWith('.json')) {
              const contenido = await fs.readFile(path.join(__dirname, 'registros', archivo), 'utf-8');
              const cliente = JSON.parse(contenido);
              registros.push({
                id: cliente.id,
                nombre: cliente.nombre,
                fecha: cliente.fechaRegistro,
                tipo: 'cliente',
                activo: cliente.activo !== false
              });
            }
          }
        } catch {}
        break;
    }
    
    res.json({ success: true, registros });
  } catch (error) {
    console.error('Error al cargar registros:', error);
    res.json({ success: false, registros: [] });
  }
});

app.post('/api/comercios', async (req, res) => {
  const comercio = req.body;
  
  try {
    const carpeta = `servicios-${comercio.categoria}`;
    const rutaCarpeta = path.join(__dirname, carpeta);
    
    await fs.mkdir(rutaCarpeta, { recursive: true });
    
    const rutaArchivo = path.join(rutaCarpeta, `${comercio.id}.json`);
    await fs.writeFile(rutaArchivo, JSON.stringify(comercio, null, 2), 'utf-8');
    
    res.json({ success: true, comercio });
  } catch (error) {
    console.error('Error al crear comercio:', error);
    res.status(500).json({ success: false });
  }
});

console.log('🧪 Rutas de debug disponibles: /api/debug/*');

// ========================================
// ⚠️ MANEJADORES DE ERRORES
// ========================================

// Error de Multer
app.use(handleMulterError);

// 404 - Ruta no encontrada
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ 
      success: false, 
      error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` 
    });
  } else {
    next();
  }
});

// ========================================
// 🔌 INICIALIZACIÓN DE SOCKET.IO
// ========================================
socketService.initSocket(server, io);
console.log('✅ Socket.IO inicializado');

// ========================================
// 🗄️ INICIALIZACIÓN DE DATOS
// ========================================

async function cargarRepartidores() {
  try {
    const repartidoresDir = path.join(BASE_DIR, 'repartidores');
    const archivos = await fs.readdir(repartidoresDir);
    const archivosJSON = archivos.filter(f => f.endsWith('.json'));
    
    for (const archivo of archivosJSON) {
      try {
        const contenido = await fs.readFile(path.join(repartidoresDir, archivo), 'utf-8');
        const repartidor = JSON.parse(contenido);
        repartidores.push(repartidor);
      } catch (error) {
        console.warn(`⚠️ Error al cargar ${archivo}:`, error.message);
      }
    }
    
    console.log(`✅ ${repartidores.length} repartidores cargados`);
  } catch (error) {
    console.log('ℹ️  No hay repartidores registrados aún');
  }
}

async function cargarPedidos() {
  try {
    const pedidosDir = path.join(BASE_DIR, 'pedidos');
    const archivos = await fs.readdir(pedidosDir);
    const archivosJSON = archivos.filter(f => f.endsWith('.json'));
    
    for (const archivo of archivosJSON) {
      try {
        const contenido = await fs.readFile(path.join(pedidosDir, archivo), 'utf-8');
        const pedido = JSON.parse(contenido);
        pedidos.push(pedido);
      } catch (error) {
        console.warn(`⚠️ Error al cargar ${archivo}:`, error.message);
      }
    }
    
    console.log(`✅ ${pedidos.length} pedidos cargados`);
  } catch (error) {
    console.log('ℹ️  No hay pedidos registrados aún');
  }
}

async function cargarCalificaciones() {
  try {
    const calificacionesDir = path.join(BASE_DIR, 'calificaciones');
    const archivos = await fs.readdir(calificacionesDir);
    const archivosJSON = archivos.filter(f => f.endsWith('.json'));
    
    for (const archivo of archivosJSON) {
      try {
        const contenido = await fs.readFile(path.join(calificacionesDir, archivo), 'utf-8');
        const calificacion = JSON.parse(contenido);
        calificaciones.push(calificacion);
      } catch (error) {
        console.warn(`⚠️ Error al cargar ${archivo}:`, error.message);
      }
    }
    
    console.log(`✅ ${calificaciones.length} calificaciones cargadas`);
  } catch (error) {
    console.log('ℹ️  No hay calificaciones registradas aún');
  }
}

async function inicializarDirectorios() {
  const ahora = new Date();
  const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
  
  const carpetas = [
    'servicios-prioridad',
    'servicios-alimentacion',
    'servicios-salud',
    'servicios-bazar',
    'servicios-indumentaria',
    'servicios-kiosco',
    'servicios-otros',
    'pedidos',
    'chats',
    'repartidores',
    'clientes',
    'verificaciones',
    'informes-ceo/repartidores',
    'informes-ceo/comercios',
    'informes-ceo/clientes',
    'informes-ceo/documentos-verificacion',
    'informes-ceo/configuraciones-comercios',
    `aceptaciones-terminos/repartidor/${mesActual}`,
    `aceptaciones-terminos/comercio/${mesActual}`,
    `aceptaciones-terminos/cliente/${mesActual}`,
    'emails/repartidores',
    'emails/comercios',
    'emails/clientes',
    'telefonos/repartidores',
    'telefonos/comercios',
    'telefonos/clientes',
    'aceptaciones-envios',
    'aceptaciones-comercio',
    'actualizaciones-perfil/comercios',
    'actualizaciones-perfil/repartidores',
    'calificaciones',
    'fotos-perfil/comercios',
    'fotos-perfil/repartidores',
    'solicitudes-tienda',
    'solicitudes-publicidad'
  ];

  try {
    await fs.mkdir(BASE_DIR, { recursive: true });
    for (const carpeta of carpetas) {
      await fs.mkdir(path.join(BASE_DIR, carpeta), { recursive: true });
    }
    console.log('✅ Directorios inicializados correctamente');
    console.log(`✅ Carpetas de términos creadas para: ${mesActual}`);
    
    // Cargar datos existentes
    await cargarRepartidores();
    await cargarPedidos();
    await cargarCalificaciones();
    
    // Inicializar controllers con referencias
    repartidoresController.init(repartidores, emailTransporter, io);
    console.log('✅ Controllers modulares inicializados');
  } catch (e) {
    console.error('❌ Error al crear directorios:', e);
    process.exit(1);
  }
}

// Crear directorios esenciales
ensureDirectoriesExist();

// ========================================
// 🔗 CONEXIÓN A MySQL CON REINTENTOS
// ========================================
async function conectarDB() {
  console.log('🔄 Conectando a MySQL...');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   User: ${process.env.DB_USER}`);
  
  let intentos = 0;
  const MAX_INTENTOS = 5;

  while (intentos < MAX_INTENTOS) {
    try {
      await sequelize.authenticate();
      console.log('✅ Conexión a MySQL establecida con éxito');
      
      // NO SINCRONIZAR - Usar schema SQL manual
      console.log('✅ Modelos Sequelize listos (sin sync automático)');
      console.log('💡 IMPORTANTE: Importa database-schema-mysql-final.sql en phpMyAdmin');
      
      break;
    } catch (error) {
      intentos++;
      console.error(`❌ Error de conexión (Intento ${intentos}/${MAX_INTENTOS}):`, error.message);
      
      if (intentos === MAX_INTENTOS) {
        console.error('⚠️ El servidor iniciará con funcionalidad limitada. Verifica MySQL en el hosting.');
        console.error('\n🔧 SOLUCIONES:');
        console.error('   1. Verifica las credenciales en .env');
        console.error('   2. Habilita acceso remoto en Hostinger Panel');
        console.error('   3. Agrega tu IP o usa % (todas las IPs)');
      } else {
        await new Promise(res => setTimeout(res, 5000));
      }
    }
  }
}

// ========================================
// 🚀 INICIAR SERVIDOR
// ========================================
async function iniciarServidor() {
  try {
    await conectarDB();
    await inicializarDirectorios();
    
    server.listen(PORT, () => {
      console.log('\n================================================');
      console.log('🚀 YAVOY v4.0 - Servidor Modular Iniciado');
      console.log('================================================');
      console.log(`📍 Puerto: ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Fecha: ${new Date().toLocaleString('es-AR')}`);
      console.log('================================================\n');
      console.log('📦 Módulos activos:');
      console.log('   ✅ Autenticación JWT');
      console.log('   ✅ Pedidos (crear, listar, actualizar)');
      console.log('   ✅ Comercios (CRUD completo)');
      console.log('   ✅ Repartidores (gestión y tracking)');
      console.log('   ✅ Pagos (MercadoPago + AstroPay)');
      console.log('   ✅ CEO Dashboard (analytics + informes)');
      console.log('   ✅ Features Premium (calificaciones, puntos, propinas)');
      console.log('   ✅ Chat en tiempo real (Socket.IO)');
      console.log('   ✅ Analytics (métricas y estadísticas)');
      console.log('   ✅ Soporte (sistema de tickets)');
      console.log('   ✅ Seguridad Avanzada (WebAuthn, 2FA, TOTP)');
      console.log('================================================\n');
    });
  } catch (error) {
    console.error('❌ Error fatal al iniciar servidor:', error);
    process.exit(1);
  }
}

iniciarServidor();

module.exports = { app, server, io };
