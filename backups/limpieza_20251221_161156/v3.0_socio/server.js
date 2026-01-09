// server.js - Servidor Express para la API de YAvoy
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const webpush = require('web-push');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 5501;
const BASE_DIR = path.join(__dirname, 'registros');

// Configuración de VAPID para Web Push - DEBE COINCIDIR CON .env
const vapidKeys = {
  publicKey: 'BL4P9zTOxEkQBAmTV3XiyK9305PJDZKoPr52a0NNedpV5OVfuZGlf9SL21zVE9D4AwNfgWzKw8bHA-peL_g-qZs',
  privateKey: 'SmZvfO1ZhLtbCrewuGFDnG0gfuTeV5DT9vRBjmWlBL4',
};

webpush.setVapidDetails('mailto:yavoyen5@gmail.com', vapidKeys.publicKey, vapidKeys.privateKey);

// Configurar transportador de email (Gmail)
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'yavoyen5@gmail.com',
    pass: process.env.EMAIL_PASSWORD || '' // Usar App Password de Gmail
  }
});

// Verificar conexión de email
emailTransporter.verify((error, success) => {
  if (error) {
    console.log('⚠️ Error configurando email:', error.message);
    console.log('📧 Emails se mostrarán solo en consola (modo desarrollo)');
  } else {
    console.log('✅ Servidor de email listo para enviar mensajes');
  }
});

// Almacenamiento en memoria (en producción, usar una DB)
let subscriptions = [];
let pedidos = [];
let chats = {}; // { pedidoId: [mensajes] }
let repartidores = [];
let usuariosConectados = new Map(); // { socketId: { userId, tipo } }

// ============================================
// SOCKET.IO - NOTIFICACIONES EN TIEMPO REAL
// ============================================
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);

  // Registrar usuario conectado
  socket.on('registrar', (data) => {
    const { userId, tipo } = data; // tipo: 'repartidor', 'cliente', 'ceo', 'comercio'
    usuariosConectados.set(socket.id, { userId, tipo });
    
    // Unirse a sala específica
    socket.join(`${tipo}-${userId}`);
    socket.join(tipo); // Sala general por tipo
    
    console.log(`✅ ${tipo.toUpperCase()} registrado:`, userId);
    
    // Notificar conexión
    socket.emit('conectado', { userId, tipo, socketId: socket.id });
  });

  // Chat en tiempo real
  socket.on('enviarMensaje', async (data) => {
    const { pedidoId, mensaje, remitente, remitenteId } = data;
    
    if (!chats[pedidoId]) {
      chats[pedidoId] = [];
    }
    
    const nuevoMensaje = {
      id: `MSG-${Date.now()}`,
      pedidoId,
      mensaje,
      remitente, // 'cliente', 'repartidor', 'ceo'
      remitenteId,
      fecha: new Date().toISOString(),
      leido: false
    };
    
    chats[pedidoId].push(nuevoMensaje);
    
    // Guardar en archivo
    try {
      const chatPath = path.join(BASE_DIR, 'chats', `${pedidoId}.json`);
      await fs.writeFile(chatPath, JSON.stringify(chats[pedidoId], null, 2));
    } catch (error) {
      console.error('Error guardando chat:', error);
    }
    
    // Emitir a todos en la sala del pedido
    io.to(`pedido-${pedidoId}`).emit('nuevoMensaje', nuevoMensaje);
    
    console.log(`💬 Mensaje en pedido ${pedidoId}:`, mensaje.substring(0, 50));
  });

  // Unirse a sala de pedido
  socket.on('unirseAPedido', (pedidoId) => {
    socket.join(`pedido-${pedidoId}`);
    console.log(`📦 Socket ${socket.id} unido a pedido-${pedidoId}`);
  });

  // Marcar mensajes como leídos
  socket.on('marcarLeido', async (data) => {
    const { pedidoId, mensajeId } = data;
    
    if (chats[pedidoId]) {
      const mensaje = chats[pedidoId].find(m => m.id === mensajeId);
      if (mensaje) {
        mensaje.leido = true;
        
        try {
          const chatPath = path.join(BASE_DIR, 'chats', `${pedidoId}.json`);
          await fs.writeFile(chatPath, JSON.stringify(chats[pedidoId], null, 2));
        } catch (error) {
          console.error('Error guardando estado leído:', error);
        }
      }
    }
  });

  // Desconexión
  socket.on('disconnect', () => {
    const usuario = usuariosConectados.get(socket.id);
    if (usuario) {
      console.log(`🔌 ${usuario.tipo.toUpperCase()} desconectado:`, usuario.userId);
      usuariosConectados.delete(socket.id);
    } else {
      console.log('🔌 Cliente desconectado:', socket.id);
    }
  });
});

// Funciones helper para emitir notificaciones
function notificarRepartidor(repartidorId, evento, data) {
  io.to(`repartidor-${repartidorId}`).emit(evento, data);
  console.log(`🔔 Notificación enviada a repartidor ${repartidorId}:`, evento);
}

function notificarCEO(evento, data) {
  io.to('ceo').emit(evento, data);
  console.log(`🔔 Notificación enviada al CEO:`, evento);
}

function notificarCliente(clienteId, evento, data) {
  io.to(`cliente-${clienteId}`).emit(evento, data);
  console.log(`🔔 Notificación enviada a cliente ${clienteId}:`, evento);
}

function notificarTodos(evento, data) {
  io.emit(evento, data);
  console.log(`🔔 Notificación broadcast:`, evento);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos (HTML, CSS, JS, imágenes, etc.)
app.use(express.static(__dirname, {
  maxAge: '1d',
  etag: true
}));

// Servir fotos de perfil
app.use('/fotos-perfil', express.static(path.join(BASE_DIR, 'fotos-perfil'), {
  maxAge: '1h',
  etag: true
}));

// Servir imágenes de verificación
app.use('/registros/verificaciones', express.static(path.join(BASE_DIR, 'verificaciones'), {
  maxAge: '1h',
  etag: true
}));

// Crear directorio base y subcarpetas si no existen
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
    // Carpetas organizadas de aceptaciones de términos
    `aceptaciones-terminos/repartidor/${mesActual}`,
    `aceptaciones-terminos/comercio/${mesActual}`,
    `aceptaciones-terminos/cliente/${mesActual}`,
    // Carpetas de emails por tipo de usuario
    'emails/repartidores',
    'emails/comercios',
    'emails/clientes',
    // Carpetas de teléfonos por tipo de usuario
    'telefonos/repartidores',
    'telefonos/comercios',
    'telefonos/clientes',
    // Carpeta para registrar aceptaciones de envíos por repartidores
    'aceptaciones-envios',
    // Carpeta para registrar cuando comercios crean/aceptan pedidos
    'aceptaciones-comercio',
    // Carpetas para actualizaciones de perfil
    'actualizaciones-perfil/comercios',
    'actualizaciones-perfil/repartidores',
    'calificaciones',
    // Carpetas para fotos de perfil
    'fotos-perfil/comercios',
    'fotos-perfil/repartidores',
    // Carpeta para solicitudes de tienda premium
    'solicitudes-tienda',
    // Carpeta para solicitudes de publicidad
    'solicitudes-publicidad'
  ];

  try {
    await fs.mkdir(BASE_DIR, { recursive: true });
    for (const carpeta of carpetas) {
      await fs.mkdir(path.join(BASE_DIR, carpeta), { recursive: true });
    }
    console.log('✓ Directorios inicializados correctamente.');
    console.log(`✓ Carpetas de términos creadas para: ${mesActual}`);
    
    // Cargar datos existentes
    await cargarRepartidores();
    await cargarPedidos();
    await cargarCalificaciones();
  } catch (e) {
    console.error('Error al crear directorios:', e);
    process.exit(1); // Salir si no se pueden crear los directorios
  }
}

// Cargar repartidores desde archivos
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
    
    console.log(`✓ ${repartidores.length} repartidor(es) cargado(s) desde archivos.`);
  } catch (error) {
    console.warn('⚠️ No se pudieron cargar repartidores:', error.message);
  }
}

// Cargar pedidos desde archivos
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
    
    console.log(`✓ ${pedidos.length} pedido(s) cargado(s) desde archivos.`);
  } catch (error) {
    console.warn('⚠️ No se pudieron cargar pedidos:', error.message);
  }
}

// Guardar pedido en archivo JSON
async function guardarPedidoArchivo(pedido) {
  try {
    const pedidosDir = path.join(BASE_DIR, 'pedidos');
    const nombreArchivo = `${pedido.id}_${Date.now()}.json`;
    const rutaArchivo = path.join(pedidosDir, nombreArchivo);
    
    await fs.writeFile(rutaArchivo, JSON.stringify(pedido, null, 2));
    console.log(`✓ Pedido guardado: ${nombreArchivo}`);
  } catch (error) {
    console.error('Error al guardar pedido:', error);
  }
}

// Actualizar pedido en archivo JSON
async function actualizarPedidoArchivo(pedido) {
  try {
    const pedidosDir = path.join(BASE_DIR, 'pedidos');
    const archivos = await fs.readdir(pedidosDir);
    
    for (const archivo of archivos) {
      if (archivo.startsWith(pedido.id)) {
        const rutaArchivo = path.join(pedidosDir, archivo);
        await fs.writeFile(rutaArchivo, JSON.stringify(pedido, null, 2));
        console.log(`✓ Pedido actualizado en archivo: ${archivo}`);
        return;
      }
    }
  } catch (error) {
    console.error('Error al actualizar pedido en archivo:', error);
  }
}

// Función para guardar documentos en carpeta CEO
async function guardarDocumentosCEO(repartidorId, documentos, nombreRepartidor) {
  try {
    // Crear carpeta específica para este repartidor
    const carpetaDocumentos = path.join(BASE_DIR, 'informes-ceo', 'documentos-verificacion', repartidorId);
    await fs.mkdir(carpetaDocumentos, { recursive: true });
    
    // Función auxiliar para convertir base64 a archivo
    const guardarImagenBase64 = async (base64String, nombreArchivo) => {
      if (!base64String) return null;
      
      // Extraer datos de la imagen (remover el prefijo data:image/...)
      const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        console.error(`Formato base64 inválido para ${nombreArchivo}`);
        return null;
      }
      
      const extension = matches[1]; // jpg, png, etc.
      const imageData = matches[2];
      const buffer = Buffer.from(imageData, 'base64');
      
      const rutaArchivo = path.join(carpetaDocumentos, `${nombreArchivo}.${extension}`);
      await fs.writeFile(rutaArchivo, buffer);
      
      return {
        nombreArchivo: `${nombreArchivo}.${extension}`,
        tamano: buffer.length,
        formato: extension
      };
    };
    
    // Guardar cada documento
    const archivosGuardados = {};
    
    if (documentos.dniFrente) {
      archivosGuardados.dniFrente = await guardarImagenBase64(documentos.dniFrente, 'dni-frente');
    }
    
    if (documentos.dniDorso) {
      archivosGuardados.dniDorso = await guardarImagenBase64(documentos.dniDorso, 'dni-dorso');
    }
    
    if (documentos.cedulaFrente) {
      archivosGuardados.cedulaFrente = await guardarImagenBase64(documentos.cedulaFrente, 'cedula-frente');
    }
    
    if (documentos.cedulaDorso) {
      archivosGuardados.cedulaDorso = await guardarImagenBase64(documentos.cedulaDorso, 'cedula-dorso');
    }
    
    // Crear archivo de metadatos
    const metadata = {
      repartidorId,
      nombreRepartidor,
      fechaCarga: new Date().toISOString(),
      archivos: archivosGuardados,
      estadoVerificacion: 'pendiente',
      verificadoPor: null,
      fechaVerificacion: null,
      notas: ''
    };
    
    const metadataPath = path.join(carpetaDocumentos, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`  🔒 Documentos CEO guardados en: documentos-verificacion/${repartidorId}`);
    return true;
  } catch (error) {
    console.error('Error al guardar documentos CEO:', error);
    return false;
  }
}

// Crear informe CEO para repartidor
async function crearInformeCEORepartidor(repartidor) {
  try {
    const informe = {
      id: repartidor.id,
      nombre: repartidor.nombre,
      email: repartidor.email,
      telefono: repartidor.telefono,
      dni: repartidor.dni,
      vehiculo: repartidor.vehiculo,
      fechaRegistro: repartidor.createdAt,
      estadoSolicitud: repartidor.estadoSolicitud || 'pendiente',
      verificadoEmail: repartidor.verificadoEmail || false,
      verificadoDocumentos: repartidor.verificadoDocumentos || false,
      terminosYCondiciones: repartidor.terminosYCondiciones || null,
      estadisticas: {
        saldoTotal: repartidor.saldoTotal || 0,
        pedidosCompletados: repartidor.pedidosCompletados || 0,
        pedidosActivos: repartidor.pedidosActivos || 0,
        calificacionPromedio: repartidor.calificacion || 0,
        disponible: repartidor.disponible,
        gananciaPromedio: repartidor.pedidosCompletados > 0 
          ? (repartidor.saldoTotal / repartidor.pedidosCompletados).toFixed(2) 
          : 0
      },
      historialPedidos: repartidor.historialPedidos || [],
      calificaciones: repartidor.calificaciones || [],
      ultimaActualizacion: new Date().toISOString()
    };
    
    const nombreLimpio = repartidor.nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const filename = `informe_${repartidor.id}_${nombreLimpio}.json`;
    const filePath = path.join(BASE_DIR, 'informes-ceo', 'repartidores', filename);
    
    await fs.writeFile(filePath, JSON.stringify(informe, null, 2));
    console.log(`  📊 Informe CEO creado: ${filename}`);
  } catch (error) {
    console.error('Error al crear informe CEO:', error);
  }
}

// Actualizar informe CEO de repartidor
async function actualizarInformeCEORepartidor(repartidor) {
  try {
    const informesDir = path.join(BASE_DIR, 'informes-ceo', 'repartidores');
    const archivos = await fs.readdir(informesDir);
    
    for (const archivo of archivos) {
      if (archivo.includes(repartidor.id)) {
        const filePath = path.join(informesDir, archivo);
        
        const informe = {
          id: repartidor.id,
          nombre: repartidor.nombre,
          email: repartidor.email,
          telefono: repartidor.telefono,
          dni: repartidor.dni,
          vehiculo: repartidor.vehiculo,
          fechaRegistro: repartidor.createdAt,
          estadoSolicitud: repartidor.estadoSolicitud || 'pendiente',
          verificadoEmail: repartidor.verificadoEmail || false,
          verificadoDocumentos: repartidor.verificadoDocumentos || false,
          terminosYCondiciones: repartidor.terminosYCondiciones || null,
          estadisticas: {
            saldoTotal: repartidor.saldoTotal || 0,
            pedidosCompletados: repartidor.pedidosCompletados || 0,
            pedidosActivos: repartidor.pedidosActivos || 0,
            calificacionPromedio: repartidor.calificacion || 0,
            disponible: repartidor.disponible,
            gananciaPromedio: repartidor.pedidosCompletados > 0 
              ? (repartidor.saldoTotal / repartidor.pedidosCompletados).toFixed(2)
              : 0
          },
          historialPedidos: repartidor.historialPedidos || [],
          calificaciones: repartidor.calificaciones || [],
          ultimaActualizacion: new Date().toISOString()
        };
        
        await fs.writeFile(filePath, JSON.stringify(informe, null, 2));
        console.log(`  📊 Informe CEO actualizado: ${archivo}`);
        break;
      }
    }
  } catch (error) {
    console.error('Error al actualizar informe CEO:', error);
  }
}

// Crear informe CEO para comercio
async function crearInformeCEOComercio(comercio) {
  try {
    const informe = {
      id: comercio.id,
      nombreComercio: comercio.nombreComercio || comercio.nombre,
      nombrePropietario: comercio.nombrePropietario || '',
      email: comercio.email,
      telefono: comercio.telefono,
      whatsapp: comercio.whatsapp || comercio.telefono,
      categoria: comercio.categoria || 'otros',
      carpeta: comercio.carpeta,
      fechaRegistro: comercio.fechaRegistro || comercio.timestamp || new Date().toISOString(),
      estadisticas: {
        pedidosRecibidos: comercio.pedidosRecibidos || 0,
        ventasTotal: comercio.ventasTotal || 0,
        activo: comercio.activo !== false
      },
      historialPedidos: [],
      ultimaActualizacion: new Date().toISOString()
    };
    
    const nombreLimpio = (comercio.nombreComercio || comercio.nombre || 'comercio').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const filename = `informe_${comercio.id}_${nombreLimpio}.json`;
    const filePath = path.join(BASE_DIR, 'informes-ceo', 'comercios', filename);
    
    await fs.writeFile(filePath, JSON.stringify(informe, null, 2));
    console.log(`  📊 Informe CEO comercio creado: ${filename}`);
  } catch (error) {
    console.error('Error al crear informe CEO de comercio:', error);
  }
}

// Crear o actualizar informe CEO de cliente
async function crearOActualizarInformeCEOCliente(cliente) {
  try {
    const informesDir = path.join(BASE_DIR, 'informes-ceo', 'clientes');
    await fs.mkdir(informesDir, { recursive: true });
    
    const telefonoLimpio = cliente.telefono.replace(/[^0-9]/g, '');
    const filename = `informe_cliente_${telefonoLimpio}.json`;
    const filePath = path.join(informesDir, filename);
    
    let informe;
    
    // Intentar cargar informe existente
    try {
      const contenido = await fs.readFile(filePath, 'utf-8');
      informe = JSON.parse(contenido);
      
      // Actualizar información
      informe.totalPedidos = (informe.totalPedidos || 0) + 1;
      informe.gastoTotal = (informe.gastoTotal || 0) + (cliente.pedido.monto || 0);
      informe.historialPedidos.push({
        pedidoId: cliente.pedido.id,
        monto: cliente.pedido.monto,
        descripcion: cliente.pedido.descripcion,
        fecha: cliente.pedido.timestamp,
        estado: cliente.pedido.estado
      });
      informe.ultimaCompra = cliente.pedido.timestamp;
      informe.ultimaActualizacion = new Date().toISOString();
      
      // Actualizar email si se proporciona
      if (cliente.email && !informe.email) {
        informe.email = cliente.email;
      }
      
    } catch (error) {
      // Crear nuevo informe
      informe = {
        id: `CLI-${telefonoLimpio}`,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email || '',
        direccion: cliente.direccion,
        fechaRegistro: new Date().toISOString(),
        totalPedidos: 1,
        gastoTotal: cliente.pedido.monto || 0,
        historialPedidos: [{
          pedidoId: cliente.pedido.id,
          monto: cliente.pedido.monto,
          descripcion: cliente.pedido.descripcion,
          fecha: cliente.pedido.timestamp,
          estado: cliente.pedido.estado
        }],
        ultimaCompra: cliente.pedido.timestamp,
        ultimaActualizacion: new Date().toISOString()
      };
    }
    
    await fs.writeFile(filePath, JSON.stringify(informe, null, 2));
    console.log(`  📊 Informe CEO cliente actualizado: ${filename}`);
  } catch (error) {
    console.error('Error al crear/actualizar informe CEO de cliente:', error);
  }
}

// --- Rutas para Notificaciones Push ---

// Ruta para obtener la clave pública VAPID desde el cliente
app.get('/api/vapid-public-key', (req, res) => {
  res.status(200).send(vapidKeys.publicKey);
});

// Ruta para guardar una nueva suscripción
app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  // Evitar duplicados
  if (!subscriptions.some(sub => sub.endpoint === subscription.endpoint)) {
    subscriptions.push(subscription);
    console.log('✓ Nueva suscripción guardada. Total:', subscriptions.length);
  } else {
    console.log('ℹ️ Suscripción ya existente.');
  }
  res.status(201).json({ success: true, message: 'Suscripción recibida.' });
});

// Ruta para enviar una notificación a todos los suscritos
app.post('/api/send-notification', (req, res) => {
  console.log(`📢 Intentando enviar notificación a ${subscriptions.length} suscriptores...`);

  // Obtener datos personalizados del cuerpo de la petición
  const { titulo, mensaje, icono, urlAccion, conVibracion } = req.body;

  const notificationPayload = JSON.stringify({
    title: titulo || '¡Hola desde YAvoy!',
    body: mensaje || 'Esta es una notificación de prueba.',
    icon: icono ? `/icons/icon-192x192.png` : '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: conVibracion ? [100, 50, 100] : undefined,
    data: {
      url: urlAccion || '/', // URL a abrir al hacer clic
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
  });

  const promises = subscriptions.map(sub => 
    webpush.sendNotification(sub, notificationPayload)
      .catch(err => {
        // Si una suscripción es inválida (ej. el usuario desinstaló la app), la eliminamos
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.warn(`Suscripción obsoleta encontrada. Eliminando: ${sub.endpoint}`);
          subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
        } else {
          console.error('Error al enviar notificación:', err);
        }
      })
  );

  Promise.all(promises)
    .then(() => {
      console.log(`✅ Notificaciones enviadas: ${subscriptions.length}`);
      res.status(200).json({ success: true, message: 'Notificaciones enviadas (o intento realizado).' });
    })
    .catch(err => {
      console.error("Error general al enviar notificaciones:", err);
      res.status(500).json({ success: false, error: 'Error al procesar las notificaciones.' });
    });
});


// --- Rutas de la API ---
app.post('/api/guardar-comercio', async (req, res) => {
  const { carpeta, filename, data } = req.body;

  if (!carpeta || !filename || !data) {
    return res.status(400).json({ success: false, error: 'Datos incompletos. Se requiere carpeta, filename y data.' });
  }

  try {
    const dirPath = path.join(BASE_DIR, carpeta);
    const filePath = path.join(dirPath, filename);

    // Asegurarse de que el directorio específico existe
    await fs.mkdir(dirPath, { recursive: true });
    
    // Agregar ID y campos de control
    const comercioCompleto = {
      id: `COM-${Date.now()}`,
      ...data,
      pedidosRecibidos: 0,
      ventasTotal: 0,
      activo: true,
      fechaRegistro: data.timestamp || new Date().toISOString()
    };
    
    await fs.writeFile(filePath, JSON.stringify(comercioCompleto, null, 2), 'utf8');

    // Crear informe CEO
    await crearInformeCEOComercio(comercioCompleto);

    console.log(`✓ Comercio guardado exitosamente en: ${carpeta}/${filename}`);
    console.log(`  📊 Informe CEO creado`);
    res.status(201).json({ success: true, path: `${carpeta}/${filename}`, comercio: comercioCompleto });
  } catch (error) {
    console.error('Error al guardar el archivo del comercio:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor al guardar el comercio.' });
  }
});

app.get('/api/listar-comercios', async (req, res) => {
  const { carpeta } = req.query;
  const dirPath = carpeta ? path.join(BASE_DIR, carpeta) : BASE_DIR;

  try {
    const archivos = await fs.readdir(dirPath, { withFileTypes: true });
    const comercios = [];

    for (const archivo of archivos) {
      const fullPath = path.join(dirPath, archivo.name);
      if (archivo.isFile() && archivo.name.endsWith('.json')) {
        const contenido = await fs.readFile(fullPath, 'utf8');
        comercios.push(JSON.parse(contenido));
      } else if (archivo.isDirectory() && !carpeta) {
        // Si no se especifica carpeta, buscar recursivamente
        const subArchivos = await fs.readdir(fullPath);
        for (const subArchivo of subArchivos) {
          if (subArchivo.endsWith('.json')) {
            const subFullPath = path.join(fullPath, subArchivo);
            const contenido = await fs.readFile(subFullPath, 'utf8');
            comercios.push(JSON.parse(contenido));
          }
        }
      }
    }

    res.status(200).json({ success: true, comercios, total: comercios.length });
  } catch (error) {
    console.error('Error al listar los comercios:', error);
    if (error.code === 'ENOENT') {
        return res.status(404).json({ success: false, error: `La carpeta '${carpeta}' no fue encontrada.` });
    }
    res.status(500).json({ success: false, error: 'Error interno del servidor al listar los comercios.' });
  }
});

// Obtener comercio individual por ID
app.get('/api/comercio/:id', async (req, res) => {
  const comercioId = req.params.id;
  
  try {
    // Buscar en todas las carpetas de servicios
    const carpetas = [
      'servicios-prioridad',
      'servicios-alimentacion',
      'servicios-salud',
      'servicios-bazar',
      'servicios-indumentaria',
      'servicios-kiosco',
      'servicios-otros'
    ];

    for (const carpeta of carpetas) {
      const dirPath = path.join(BASE_DIR, carpeta);
      try {
        const archivos = await fs.readdir(dirPath);
        
        for (const archivo of archivos) {
          if (archivo.endsWith('.json')) {
            const filePath = path.join(dirPath, archivo);
            const contenido = await fs.readFile(filePath, 'utf-8');
            const comercio = JSON.parse(contenido);
            
            if (comercio.id === comercioId) {
              return res.json({ success: true, comercio });
            }
          }
        }
      } catch (err) {
        // Carpeta no existe, continuar
        continue;
      }
    }

    res.status(404).json({ success: false, error: 'Comercio no encontrado' });
  } catch (error) {
    console.error('Error al buscar comercio:', error);
    res.status(500).json({ success: false, error: 'Error al buscar comercio' });
  }
});

// Actualizar datos del comercio
app.patch('/api/comercio/:id', async (req, res) => {
  const comercioId = req.params.id;
  const actualizaciones = req.body;
  
  try {
    const carpetas = [
      'servicios-prioridad',
      'servicios-alimentacion',
      'servicios-salud',
      'servicios-bazar',
      'servicios-indumentaria',
      'servicios-kiosco',
      'servicios-otros'
    ];

    for (const carpeta of carpetas) {
      const dirPath = path.join(BASE_DIR, carpeta);
      try {
        const archivos = await fs.readdir(dirPath);
        
        for (const archivo of archivos) {
          if (archivo.endsWith('.json')) {
            const filePath = path.join(dirPath, archivo);
            const contenido = await fs.readFile(filePath, 'utf-8');
            const comercio = JSON.parse(contenido);
            
            if (comercio.id === comercioId) {
              // Guardar estado anterior
              const comercioAnterior = JSON.parse(JSON.stringify(comercio));
              
              // Actualizar comercio
              const comercioActualizado = {
                ...comercio,
                ...actualizaciones,
                id: comercio.id, // Preservar ID
                fechaActualizacion: new Date().toISOString()
              };
              
              await fs.writeFile(filePath, JSON.stringify(comercioActualizado, null, 2));
              
              // 📝 GUARDAR REGISTRO DE ACTUALIZACIÓN
              const ahora = new Date();
              const timestamp = ahora.getTime();
              const fechaLegible = ahora.toLocaleString('es-AR', {
                timeZone: 'America/Argentina/Buenos_Aires',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
              
              const registroActualizacion = {
                id: `actualizacion_comercio_${timestamp}`,
                comercioId: comercio.id,
                tipo: 'actualizacion_perfil',
                datosAnteriores: comercioAnterior,
                datosNuevos: comercioActualizado,
                camposModificados: Object.keys(actualizaciones),
                fechaActualizacion: ahora.toISOString(),
                fechaLegible: fechaLegible,
                ip: req.ip || req.connection.remoteAddress || 'No disponible',
                userAgent: req.headers['user-agent'] || 'No disponible'
              };
              
              // Guardar en carpeta de actualizaciones
              const dirActualizaciones = path.join(BASE_DIR, 'actualizaciones-perfil', 'comercios');
              await fs.mkdir(dirActualizaciones, { recursive: true });
              
              const nombreArchivo = `actualizacion_${comercioId}_${timestamp}.json`;
              const rutaArchivo = path.join(dirActualizaciones, nombreArchivo);
              await fs.writeFile(rutaArchivo, JSON.stringify(registroActualizacion, null, 2), 'utf8');
              
              console.log(`✓ Comercio ${comercioId} actualizado`);
              console.log(`📝 Registro de actualización guardado: ${nombreArchivo}`);
              
              return res.json({ success: true, comercio: comercioActualizado });
            }
          }
        }
      } catch (err) {
        continue;
      }
    }

    res.status(404).json({ success: false, error: 'Comercio no encontrado' });
  } catch (error) {
    console.error('Error al actualizar comercio:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar comercio' });
  }
});

// Subir foto de perfil del comercio
app.post('/api/comercio/:id/foto-perfil', async (req, res) => {
  const comercioId = req.params.id;
  const { fotoBase64 } = req.body;
  
  if (!fotoBase64) {
    return res.status(400).json({ success: false, error: 'No se proporcionó la imagen' });
  }

  try {
    // Extraer datos de la imagen base64
    const matches = fotoBase64.match(/^data:image\/([a-zA-Z]*);base64,([^\"]*)/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Formato de imagen inválido' });
    }

    const extension = matches[1];
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, 'base64');

    // Guardar imagen
    const dirFotos = path.join(BASE_DIR, 'fotos-perfil', 'comercios');
    await fs.mkdir(dirFotos, { recursive: true });

    const nombreArchivo = `${comercioId}.${extension}`;
    const rutaArchivo = path.join(dirFotos, nombreArchivo);
    await fs.writeFile(rutaArchivo, buffer);

    const urlFoto = `/fotos-perfil/comercios/${nombreArchivo}`;

    // Actualizar el comercio con la URL de la foto
    const carpetas = [
      'servicios-prioridad',
      'servicios-alimentacion',
      'servicios-salud',
      'servicios-bazar',
      'servicios-indumentaria',
      'servicios-kiosco',
      'servicios-otros'
    ];

    for (const carpeta of carpetas) {
      const dirPath = path.join(BASE_DIR, carpeta);
      try {
        const archivos = await fs.readdir(dirPath);
        
        for (const archivo of archivos) {
          if (archivo.endsWith('.json')) {
            const filePath = path.join(dirPath, archivo);
            const contenido = await fs.readFile(filePath, 'utf-8');
            const comercio = JSON.parse(contenido);
            
            if (comercio.id === comercioId) {
              comercio.fotoPerfil = urlFoto;
              comercio.fechaActualizacionFoto = new Date().toISOString();
              await fs.writeFile(filePath, JSON.stringify(comercio, null, 2));
              
              console.log(`📸 Foto de perfil actualizada para comercio ${comercioId}`);
              
              return res.json({ 
                success: true, 
                fotoPerfil: urlFoto,
                mensaje: 'Foto de perfil actualizada correctamente'
              });
            }
          }
        }
      } catch (err) {
        continue;
      }
    }

    // Si llegamos aquí, el comercio no se encontró pero la imagen se guardó
    res.json({ 
      success: true, 
      fotoPerfil: urlFoto,
      mensaje: 'Foto guardada (comercio no encontrado en archivos)'
    });

  } catch (error) {
    console.error('Error al subir foto:', error);
    res.status(500).json({ success: false, error: 'Error al subir la foto' });
  }
});

// Subir foto de perfil del repartidor
app.post('/api/repartidores/:id/foto-perfil', async (req, res) => {
  const repartidorId = req.params.id;
  const { fotoBase64 } = req.body;
  
  if (!fotoBase64) {
    return res.status(400).json({ success: false, error: 'No se proporcionó la imagen' });
  }

  try {
    // Extraer datos de la imagen base64
    const matches = fotoBase64.match(/^data:image\/([a-zA-Z]*);base64,([^\"]*)/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Formato de imagen inválido' });
    }

    const extension = matches[1];
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, 'base64');

    // Guardar imagen
    const dirFotos = path.join(BASE_DIR, 'fotos-perfil', 'repartidores');
    await fs.mkdir(dirFotos, { recursive: true });

    const nombreArchivo = `${repartidorId}.${extension}`;
    const rutaArchivo = path.join(dirFotos, nombreArchivo);
    await fs.writeFile(rutaArchivo, buffer);

    const urlFoto = `/fotos-perfil/repartidores/${nombreArchivo}`;

    // Actualizar el repartidor con la URL de la foto
    const repartidoresDir = path.join(BASE_DIR, 'repartidores');
    const archivos = await fs.readdir(repartidoresDir);
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const filePath = path.join(repartidoresDir, archivo);
        const contenido = await fs.readFile(filePath, 'utf-8');
        const repartidor = JSON.parse(contenido);
        
        if (repartidor.id === repartidorId) {
          repartidor.fotoPerfil = urlFoto;
          repartidor.fechaActualizacionFoto = new Date().toISOString();
          await fs.writeFile(filePath, JSON.stringify(repartidor, null, 2));
          
          // Actualizar en array en memoria
          const index = repartidores.findIndex(r => r.id === repartidorId);
          if (index !== -1) {
            repartidores[index].fotoPerfil = urlFoto;
          }
          
          console.log(`📸 Foto de perfil actualizada para repartidor ${repartidorId}`);
          
          return res.json({ 
            success: true, 
            fotoPerfil: urlFoto,
            mensaje: 'Foto de perfil actualizada correctamente'
          });
        }
      }
    }

    res.status(404).json({ success: false, error: 'Repartidor no encontrado' });

  } catch (error) {
    console.error('Error al subir foto:', error);
    res.status(500).json({ success: false, error: 'Error al subir la foto' });
  }
});

// --- ENDPOINTS DE PRODUCTOS/FOTOS DEL COMERCIO ---

// Subir foto de producto/servicio del comercio
app.post('/api/comercio/:id/fotos-productos', async (req, res) => {
  const comercioId = req.params.id;
  const { fotoBase64, precio, enlace, descripcion } = req.body;
  
  if (!fotoBase64) {
    return res.status(400).json({ success: false, error: 'No se proporcionó la imagen' });
  }

  try {
    // Extraer datos de la imagen base64
    const matches = fotoBase64.match(/^data:image\/([a-zA-Z]*);base64,([^\"]*)/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Formato de imagen inválido' });
    }

    const extension = matches[1];
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, 'base64');

    // Guardar imagen
    const dirFotos = path.join(BASE_DIR, 'fotos-perfil', 'comercios', comercioId);
    await fs.mkdir(dirFotos, { recursive: true });

    const timestamp = Date.now();
    const nombreArchivo = `producto_${timestamp}.${extension}`;
    const rutaArchivo = path.join(dirFotos, nombreArchivo);
    await fs.writeFile(rutaArchivo, buffer);

    const urlFoto = `/fotos-perfil/comercios/${comercioId}/${nombreArchivo}`;

    // Buscar el comercio y actualizar sus fotos de productos
    const carpetas = [
      'servicios-prioridad',
      'servicios-alimentacion',
      'servicios-salud',
      'servicios-bazar',
      'servicios-indumentaria',
      'servicios-kiosco',
      'servicios-otros'
    ];

    for (const carpeta of carpetas) {
      const dirPath = path.join(BASE_DIR, carpeta);
      try {
        const archivos = await fs.readdir(dirPath);
        
        for (const archivo of archivos) {
          if (archivo.endsWith('.json')) {
            const filePath = path.join(dirPath, archivo);
            const contenido = await fs.readFile(filePath, 'utf-8');
            const comercio = JSON.parse(contenido);
            
            if (comercio.id === comercioId) {
              if (!comercio.fotosProductos) {
                comercio.fotosProductos = [];
              }

              // Verificar que no exceda las 3 fotos
              if (comercio.fotosProductos.length >= 3) {
                return res.status(400).json({ 
                  success: false, 
                  error: 'Ya tienes 3 fotos. Elimina una para agregar otra.' 
                });
              }

              const nuevaFoto = {
                id: `foto_${timestamp}`,
                url: urlFoto,
                precio: precio || null,
                enlace: enlace || null,
                descripcion: descripcion || null,
                fechaCreacion: new Date().toISOString()
              };

              comercio.fotosProductos.push(nuevaFoto);
              await fs.writeFile(filePath, JSON.stringify(comercio, null, 2));
              
              console.log(`📸 Foto de producto agregada para comercio ${comercioId}`);
              
              return res.json({ 
                success: true, 
                foto: nuevaFoto,
                totalFotos: comercio.fotosProductos.length,
                mensaje: 'Foto de producto agregada correctamente'
              });
            }
          }
        }
      } catch (err) {
        continue;
      }
    }

    // Si el comercio no existe, créalo en servicios-otros
    console.log(`⚠️ Comercio ${comercioId} no encontrado. Creando nuevo archivo...`);
    
    const nuevoComercio = {
      id: comercioId,
      nombre: req.body.nombre || 'Comercio',
      categoria: req.body.categoria || 'Otros',
      fotosProductos: [nuevaFoto],
      activo: true,
      fechaCreacion: new Date().toISOString()
    };

    const rutaNuevo = path.join(BASE_DIR, 'servicios-otros', `${comercioId}.json`);
    await fs.writeFile(rutaNuevo, JSON.stringify(nuevoComercio, null, 2));
    
    console.log(`✅ Comercio ${comercioId} creado en servicios-otros`);
    
    return res.json({ 
      success: true, 
      foto: nuevaFoto,
      totalFotos: 1,
      mensaje: 'Foto de producto agregada correctamente'
    });

  } catch (error) {
    console.error('Error al subir foto de producto:', error);
    res.status(500).json({ success: false, error: 'Error al subir la foto' });
  }
});

// Eliminar foto de producto del comercio
app.delete('/api/comercio/:id/fotos-productos/:fotoId', async (req, res) => {
  const comercioId = req.params.id;
  const fotoId = req.params.fotoId;

  try {
    const carpetas = [
      'servicios-prioridad',
      'servicios-alimentacion',
      'servicios-salud',
      'servicios-bazar',
      'servicios-indumentaria',
      'servicios-kiosco',
      'servicios-otros'
    ];

    for (const carpeta of carpetas) {
      const dirPath = path.join(BASE_DIR, carpeta);
      try {
        const archivos = await fs.readdir(dirPath);
        
        for (const archivo of archivos) {
          if (archivo.endsWith('.json')) {
            const filePath = path.join(dirPath, archivo);
            const contenido = await fs.readFile(filePath, 'utf-8');
            const comercio = JSON.parse(contenido);
            
            if (comercio.id === comercioId && comercio.fotosProductos) {
              const fotoIndex = comercio.fotosProductos.findIndex(f => f.id === fotoId);
              
              if (fotoIndex !== -1) {
                const foto = comercio.fotosProductos[fotoIndex];
                
                // Eliminar archivo físico
                const rutaArchivo = path.join(BASE_DIR, foto.url);
                try {
                  await fs.unlink(rutaArchivo);
                } catch (err) {
                  console.warn('No se pudo eliminar archivo físico:', err.message);
                }

                // Eliminar de array
                comercio.fotosProductos.splice(fotoIndex, 1);
                await fs.writeFile(filePath, JSON.stringify(comercio, null, 2));
                
                console.log(`🗑️ Foto de producto eliminada para comercio ${comercioId}`);
                
                return res.json({ 
                  success: true, 
                  mensaje: 'Foto eliminada correctamente',
                  totalFotos: comercio.fotosProductos.length
                });
              }
            }
          }
        }
      } catch (err) {
        continue;
      }
    }

    res.status(404).json({ success: false, error: 'Foto no encontrada' });

  } catch (error) {
    console.error('Error al eliminar foto:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar la foto' });
  }
});

// Actualizar estado activo/inactivo del comercio
app.patch('/api/comercio/:id/estado', async (req, res) => {
  const comercioId = req.params.id;
  const { activo } = req.body;

  if (typeof activo !== 'boolean') {
    return res.status(400).json({ success: false, error: 'Estado inválido' });
  }

  try {
    const carpetas = [
      'servicios-prioridad',
      'servicios-alimentacion',
      'servicios-salud',
      'servicios-bazar',
      'servicios-indumentaria',
      'servicios-kiosco',
      'servicios-otros'
    ];

    for (const carpeta of carpetas) {
      const dirPath = path.join(BASE_DIR, carpeta);
      try {
        const archivos = await fs.readdir(dirPath);
        
        for (const archivo of archivos) {
          if (archivo.endsWith('.json')) {
            const filePath = path.join(dirPath, archivo);
            const contenido = await fs.readFile(filePath, 'utf-8');
            const comercio = JSON.parse(contenido);
            
            if (comercio.id === comercioId) {
              comercio.activo = activo;
              comercio.fechaActualizacionEstado = new Date().toISOString();
              await fs.writeFile(filePath, JSON.stringify(comercio, null, 2));
              
              console.log(`${activo ? '✅' : '🔴'} Comercio ${comercioId} ahora está ${activo ? 'ACTIVO' : 'INACTIVO'}`);
              
              return res.json({ 
                success: true, 
                activo: comercio.activo,
                mensaje: `Comercio marcado como ${activo ? 'activo' : 'inactivo'}`
              });
            }
          }
        }
      } catch (err) {
        continue;
      }
    }

    res.status(404).json({ success: false, error: 'Comercio no encontrado' });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar estado' });
  }
});

// Obtener comercios activos/inactivos
app.get('/api/comercios/por-estado', async (req, res) => {
  const { activo } = req.query;
  
  try {
    const carpetas = [
      'servicios-prioridad',
      'servicios-alimentacion',
      'servicios-salud',
      'servicios-bazar',
      'servicios-indumentaria',
      'servicios-kiosco',
      'servicios-otros'
    ];

    const comercios = [];

    for (const carpeta of carpetas) {
      const dirPath = path.join(BASE_DIR, carpeta);
      try {
        const archivos = await fs.readdir(dirPath);
        
        for (const archivo of archivos) {
          if (archivo.endsWith('.json')) {
            const filePath = path.join(dirPath, archivo);
            const contenido = await fs.readFile(filePath, 'utf-8');
            const comercio = JSON.parse(contenido);
            
            // Si no tiene estado, por defecto es activo
            if (comercio.activo === undefined) {
              comercio.activo = true;
            }

            // Filtrar por estado si se especifica
            if (activo !== undefined) {
              const filtroActivo = activo === 'true';
              if (comercio.activo === filtroActivo) {
                comercios.push(comercio);
              }
            } else {
              comercios.push(comercio);
            }
          }
        }
      } catch (err) {
        continue;
      }
    }

    res.json({ 
      success: true, 
      comercios,
      total: comercios.length
    });

  } catch (error) {
    console.error('Error al obtener comercios:', error);
    res.status(500).json({ success: false, error: 'Error al obtener comercios' });
  }
});

// Solicitar creación de tienda premium
app.post('/api/comercio/solicitar-tienda', async (req, res) => {
  const { comercioId, nombreComercio, whatsapp, email, comentarios, fechaSolicitud, monto, estado } = req.body;

  if (!comercioId || !nombreComercio || !whatsapp) {
    return res.status(400).json({ success: false, error: 'Datos incompletos' });
  }

  try {
    const solicitud = {
      id: `TIENDA_${Date.now()}`,
      comercioId,
      nombreComercio,
      whatsapp,
      email: email || null,
      comentarios: comentarios || null,
      fechaSolicitud: fechaSolicitud || new Date().toISOString(),
      monto: monto || 50000,
      estado: estado || 'pendiente',
      fechaCreacion: new Date().toISOString()
    };

    // Guardar solicitud por fecha
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const dirFecha = path.join(BASE_DIR, 'solicitudes-tienda', `${año}-${mes}`);
    await fs.mkdir(dirFecha, { recursive: true });

    const nombreArchivo = `solicitud_${comercioId}_${Date.now()}.json`;
    const rutaArchivo = path.join(dirFecha, nombreArchivo);
    await fs.writeFile(rutaArchivo, JSON.stringify(solicitud, null, 2));

    // También guardar en carpeta individual del comercio
    const dirComercio = path.join(BASE_DIR, 'solicitudes-tienda', comercioId);
    await fs.mkdir(dirComercio, { recursive: true });
    const rutaComercio = path.join(dirComercio, nombreArchivo);
    await fs.writeFile(rutaComercio, JSON.stringify(solicitud, null, 2));

    console.log(`📨 Solicitud de tienda recibida: ${nombreComercio} (${comercioId})`);
    console.log(`💰 Monto: $${monto}`);
    console.log(`📱 WhatsApp: ${whatsapp}`);

    res.json({ 
      success: true, 
      solicitud,
      mensaje: 'Solicitud recibida correctamente'
    });

  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    res.status(500).json({ success: false, error: 'Error al procesar solicitud' });
  }
});

// Obtener solicitudes de tienda (para admin)
app.get('/api/admin/solicitudes-tienda', async (req, res) => {
  try {
    const solicitudes = [];
    const dirSolicitudes = path.join(BASE_DIR, 'solicitudes-tienda');
    
    // Leer todas las carpetas de meses
    const carpetas = await fs.readdir(dirSolicitudes);
    
    for (const carpeta of carpetas) {
      const rutaCarpeta = path.join(dirSolicitudes, carpeta);
      const stats = await fs.stat(rutaCarpeta);
      
      if (stats.isDirectory() && carpeta.match(/^\d{4}-\d{2}$/)) {
        const archivos = await fs.readdir(rutaCarpeta);
        
        for (const archivo of archivos) {
          if (archivo.endsWith('.json')) {
            const contenido = await fs.readFile(path.join(rutaCarpeta, archivo), 'utf-8');
            const solicitud = JSON.parse(contenido);
            solicitudes.push(solicitud);
          }
        }
      }
    }

    // Ordenar por fecha más reciente
    solicitudes.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));

    res.json({ 
      success: true, 
      solicitudes,
      total: solicitudes.length
    });

  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ success: false, error: 'Error al obtener solicitudes' });
  }
});

// Solicitar publicidad
app.post('/api/comercio/solicitar-publicidad', async (req, res) => {
  const { comercioId, nombreComercio, whatsapp, email, plan, montoMensual, duracion, descuento, total, mensaje, fechaSolicitud, estado } = req.body;

  if (!comercioId || !nombreComercio || !whatsapp || !plan || !montoMensual || !duracion) {
    return res.status(400).json({ success: false, error: 'Datos incompletos' });
  }

  try {
    const solicitud = {
      id: `PUB_${Date.now()}`,
      comercioId,
      nombreComercio,
      whatsapp,
      email: email || null,
      plan,
      montoMensual,
      duracion,
      descuento: descuento || 0,
      total,
      mensaje: mensaje || null,
      fechaSolicitud: fechaSolicitud || new Date().toISOString(),
      estado: estado || 'pendiente',
      fechaCreacion: new Date().toISOString()
    };

    // Guardar solicitud por fecha
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dirFecha = path.join(BASE_DIR, 'solicitudes-publicidad', `${año}-${mes}`);
    await fs.mkdir(dirFecha, { recursive: true });

    const nombreArchivo = `publicidad_${comercioId}_${Date.now()}.json`;
    const rutaArchivo = path.join(dirFecha, nombreArchivo);
    await fs.writeFile(rutaArchivo, JSON.stringify(solicitud, null, 2));

    // También guardar en carpeta individual del comercio
    const dirComercio = path.join(BASE_DIR, 'solicitudes-publicidad', comercioId);
    await fs.mkdir(dirComercio, { recursive: true });
    const rutaComercio = path.join(dirComercio, nombreArchivo);
    await fs.writeFile(rutaComercio, JSON.stringify(solicitud, null, 2));

    console.log(`📢 Solicitud de publicidad recibida: ${nombreComercio} (${comercioId})`);
    console.log(`📊 Plan: ${plan} - ${duracion} meses`);
    console.log(`💰 Total: $${total}`);
    console.log(`📱 WhatsApp: ${whatsapp}`);

    res.json({ 
      success: true, 
      solicitud,
      mensaje: 'Solicitud de publicidad recibida correctamente'
    });

  } catch (error) {
    console.error('Error al procesar solicitud de publicidad:', error);
    res.status(500).json({ success: false, error: 'Error al procesar solicitud' });
  }
});

// Obtener solicitudes de publicidad (para admin)
app.get('/api/admin/solicitudes-publicidad', async (req, res) => {
  try {
    const solicitudes = [];
    const dirSolicitudes = path.join(BASE_DIR, 'solicitudes-publicidad');
    
    // Leer todas las carpetas de meses
    const carpetas = await fs.readdir(dirSolicitudes);
    
    for (const carpeta of carpetas) {
      const rutaCarpeta = path.join(dirSolicitudes, carpeta);
      const stats = await fs.stat(rutaCarpeta);
      
      if (stats.isDirectory() && carpeta.match(/^\d{4}-\d{2}$/)) {
        const archivos = await fs.readdir(rutaCarpeta);
        
        for (const archivo of archivos) {
          if (archivo.endsWith('.json')) {
            const contenido = await fs.readFile(path.join(rutaCarpeta, archivo), 'utf-8');
            const solicitud = JSON.parse(contenido);
            solicitudes.push(solicitud);
          }
        }
      }
    }

    // Ordenar por fecha más reciente
    solicitudes.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));

    res.json({ 
      success: true, 
      solicitudes,
      total: solicitudes.length
    });

  } catch (error) {
    console.error('Error al obtener solicitudes de publicidad:', error);
    res.status(500).json({ success: false, error: 'Error al obtener solicitudes' });
  }
});

// --- ENDPOINTS DE PEDIDOS ---

// Crear nuevo pedido
app.post('/api/pedidos', async (req, res) => {
  const { clienteNombre, clienteTelefono, direccion, productos, comercioId, total, nombreCliente, telefonoCliente, direccionEntrega, descripcion, monto, email } = req.body;
  
  // Soportar ambos formatos de request
  const nombre = nombreCliente || clienteNombre;
  const telefono = telefonoCliente || clienteTelefono;
  const dir = direccionEntrega || direccion;
  const desc = descripcion || productos;
  const montoFinal = monto || total;
  
  if (!nombre || !telefono || !dir || !desc) {
    return res.status(400).json({ success: false, error: 'Datos incompletos' });
  }

  const montoTotal = parseFloat(montoFinal) || 0;
  const comisionCEO = montoTotal * 0.15; // 15% para CEO
  const comisionRepartidor = montoTotal * 0.85; // 85% para repartidor
  
  const nuevoPedido = {
    id: `PED-${Date.now()}`,
    nombreCliente: nombre,
    telefonoCliente: telefono,
    direccionEntrega: dir,
    descripcion: desc,
    destinatario: req.body.destinatario || nombre,
    telefonoDestinatario: req.body.telefonoDestinatario || telefono,
    notas: req.body.notas || '',
    monto: montoTotal,
    comisionCEO: comisionCEO,
    comisionRepartidor: comisionRepartidor,
    estado: 'pendiente',
    comercioId: comercioId || null,
    clienteId: req.body.clienteId || null,
    cliente: req.body.clienteNombre ? {
      nombre: req.body.clienteNombre,
      telefono: telefono
    } : null,
    repartidorId: null,
    repartidor: null,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  pedidos.push(nuevoPedido);
  
  // Guardar pedido en archivo JSON
  await guardarPedidoArchivo(nuevoPedido);
  
  // Crear o actualizar informe CEO del cliente
  await crearOActualizarInformeCEOCliente({
    nombre,
    telefono,
    email: email || '',
    direccion: dir,
    pedido: nuevoPedido
  });
  
  console.log(`✓ Pedido creado: ${nuevoPedido.id} - Cliente: ${nombre}`);
  console.log(`  💰 Monto: $${montoTotal.toFixed(2)} | CEO: $${comisionCEO.toFixed(2)} | Repartidor: $${comisionRepartidor.toFixed(2)}`);
  console.log(`  📊 Informe CEO de cliente actualizado`);
  
  // 📝 REGISTRAR CREACIÓN DE PEDIDO POR COMERCIO
  if (comercioId || req.body.clienteId) {
    try {
      const ahora = new Date();
      const timestamp = ahora.getTime();
      const fechaLegible = ahora.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const registroComercio = {
        id: `comercio_pedido_${timestamp}_${nuevoPedido.id}`,
        tipo: 'creacion_pedido',
        // Datos del pedido creado
        pedidoId: nuevoPedido.id,
        pedidoNumero: nuevoPedido.id,
        descripcionEnvio: desc,
        montoEnvio: montoTotal,
        comisionCEO: comisionCEO,
        comisionRepartidor: comisionRepartidor,
        // Datos del comercio que crea el pedido
        comercio: {
          id: comercioId || req.body.clienteId,
          nombre: req.body.clienteNombre || 'Comercio',
          telefono: req.body.clienteTelefono || 'No especificado',
          email: email || 'No proporcionado'
        },
        // Datos del cliente destino
        cliente: {
          nombre: nombre,
          telefono: telefono,
          direccion: dir
        },
        destinatario: req.body.destinatario || nombre,
        telefonoDestinatario: req.body.telefonoDestinatario || telefono,
        notas: req.body.notas || '',
        // Metadata temporal
        fechaCreacion: ahora.toISOString(),
        fechaLegible: fechaLegible,
        timestamp: timestamp,
        // Datos técnicos
        ipComercio: req.ip || req.connection.remoteAddress || 'No disponible',
        userAgent: req.headers['user-agent'] || 'No disponible'
      };
      
      // Guardar en carpeta general de aceptaciones comercio
      const dirAceptacionesComercio = path.join(BASE_DIR, 'aceptaciones-comercio');
      await fs.mkdir(dirAceptacionesComercio, { recursive: true });
      
      const nombreArchivo = `comercio_pedido_${comercioId || req.body.clienteId}_${nuevoPedido.id}_${timestamp}.json`;
      const rutaArchivo = path.join(dirAceptacionesComercio, nombreArchivo);
      await fs.writeFile(rutaArchivo, JSON.stringify(registroComercio, null, 2), 'utf8');
      
      console.log(`📝 Pedido registrado por comercio: ${nombreArchivo}`);
      
    } catch (error) {
      console.error('⚠️ Error al registrar creación de pedido por comercio:', error);
      // No fallar la creación si falla el registro
    }
  }
  
  // Notificar a repartidores disponibles
  notificarTodos('nuevoPedido', {
    pedido: {
      id: nuevoPedido.id,
      direccion: nuevoPedido.direccion,
      monto: nuevoPedido.monto,
      comisionRepartidor: nuevoPedido.comisionRepartidor
    }
  });
  
  res.status(201).json({ success: true, pedido: nuevoPedido });
});

// Listar todos los pedidos (con filtros opcionales)
app.get('/api/pedidos', (req, res) => {
  const { estado, repartidorId, comercioId, clienteId } = req.query;
  
  let pedidosFiltrados = [...pedidos];
  
  if (estado) {
    pedidosFiltrados = pedidosFiltrados.filter(p => p.estado === estado);
  }
  
  if (repartidorId) {
    pedidosFiltrados = pedidosFiltrados.filter(p => p.repartidorId === repartidorId);
  }
  
  if (comercioId) {
    pedidosFiltrados = pedidosFiltrados.filter(p => p.comercioId === comercioId);
  }
  
  if (clienteId) {
    pedidosFiltrados = pedidosFiltrados.filter(p => p.clienteId === clienteId);
  }
  
  res.json({ success: true, pedidos: pedidosFiltrados, total: pedidosFiltrados.length });
});

// Obtener un pedido específico
app.get('/api/pedidos/:id', (req, res) => {
  const pedido = pedidos.find(p => p.id === req.params.id);
  
  if (!pedido) {
    return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
  }
  
  res.json({ success: true, pedido });
});

// Asignar pedido a repartidor
app.patch('/api/pedidos/:id/asignar', async (req, res) => {
  const { repartidorId } = req.body;
  const pedido = pedidos.find(p => p.id === req.params.id);
  
  if (!pedido) {
    return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
  }
  
  if (pedido.estado !== 'pendiente') {
    return res.status(400).json({ success: false, error: 'El pedido ya fue asignado' });
  }
  
  // Buscar información del repartidor
  const repartidor = repartidores.find(r => r.id === repartidorId);
  
  if (!repartidor) {
    return res.status(404).json({ success: false, error: 'Repartidor no encontrado' });
  }
  
  pedido.repartidorId = repartidorId;
  pedido.repartidor = {
    id: repartidor.id,
    nombre: repartidor.nombre,
    telefono: repartidor.telefono,
    vehiculo: repartidor.vehiculo
  };
  pedido.estado = 'asignado';
  pedido.updatedAt = new Date().toISOString();
  pedido.fechaAsignacion = new Date().toISOString();
  
  // 📝 REGISTRAR ACEPTACIÓN DEL ENVÍO Y ASIGNACIÓN POR COMERCIO
  try {
    const ahora = new Date();
    const timestamp = ahora.getTime();
    const fechaLegible = ahora.toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const registroAceptacion = {
      id: `aceptacion_${timestamp}_${repartidorId}`,
      tipo: 'asignacion_repartidor',
      // Datos del envío/pedido
      pedidoId: pedido.id,
      pedidoNumero: pedido.numero || pedido.id,
      descripcionEnvio: pedido.descripcion,
      montoEnvio: pedido.monto,
      comisionCEO: pedido.comisionCEO,
      comisionRepartidor: pedido.comisionRepartidor,
      // Datos del repartidor que acepta
      repartidor: {
        id: repartidor.id,
        nombre: repartidor.nombre,
        email: repartidor.email || 'No proporcionado',
        telefono: repartidor.telefono,
        documento: repartidor.documento || repartidor.dni || 'No proporcionado',
        vehiculo: repartidor.vehiculo
      },
      // Datos del comercio origen (si existe)
      comercio: {
        id: pedido.comercioId || pedido.clienteId || 'No especificado',
        nombre: pedido.nombreComercio || pedido.comercio || (pedido.cliente ? pedido.cliente.nombre : 'No especificado'),
        direccion: pedido.direccionComercio || pedido.origen || 'No especificada'
      },
      // Datos del cliente destino
      cliente: {
        nombre: pedido.nombreCliente || 'No especificado',
        telefono: pedido.telefonoCliente || 'No especificado',
        direccion: pedido.direccionEntrega || pedido.destino || 'No especificada'
      },
      destinatario: pedido.destinatario || pedido.nombreCliente,
      telefonoDestinatario: pedido.telefonoDestinatario || pedido.telefonoCliente,
      // Metadata temporal
      fechaAceptacion: ahora.toISOString(),
      fechaLegible: fechaLegible,
      timestamp: timestamp,
      // Datos técnicos (puede ser del comercio o del repartidor según quien asigne)
      ipAsignador: req.ip || req.connection.remoteAddress || 'No disponible',
      userAgent: req.headers['user-agent'] || 'No disponible',
      asignadoPor: pedido.comercioId || pedido.clienteId ? 'comercio' : 'repartidor'
    };
    
    // Guardar en carpeta general de aceptaciones
    const dirAceptaciones = path.join(BASE_DIR, 'aceptaciones-envios');
    await fs.mkdir(dirAceptaciones, { recursive: true });
    
    const nombreArchivo = `aceptacion_${repartidor.id}_${pedido.id}_${timestamp}.json`;
    const rutaArchivo = path.join(dirAceptaciones, nombreArchivo);
    await fs.writeFile(rutaArchivo, JSON.stringify(registroAceptacion, null, 2), 'utf8');
    
    // También guardar en la carpeta del repartidor
    const dirRepartidor = path.join(BASE_DIR, 'repartidores');
    const nombreArchivoRepartidor = `aceptacion_${pedido.id}_${timestamp}.json`;
    const rutaArchivoRepartidor = path.join(dirRepartidor, nombreArchivoRepartidor);
    await fs.writeFile(rutaArchivoRepartidor, JSON.stringify(registroAceptacion, null, 2), 'utf8');
    
    // Si fue asignado por un comercio, guardar también en carpeta de aceptaciones-comercio
    if (pedido.comercioId || pedido.clienteId) {
      const dirAceptacionesComercio = path.join(BASE_DIR, 'aceptaciones-comercio');
      await fs.mkdir(dirAceptacionesComercio, { recursive: true });
      
      const nombreArchivoComercio = `asignacion_${pedido.comercioId || pedido.clienteId}_${pedido.id}_${repartidorId}_${timestamp}.json`;
      const rutaArchivoComercio = path.join(dirAceptacionesComercio, nombreArchivoComercio);
      await fs.writeFile(rutaArchivoComercio, JSON.stringify(registroAceptacion, null, 2), 'utf8');
      
      console.log(`📝 Asignación registrada también en aceptaciones-comercio`);
    }
    
    console.log(`✅ Pedido ${pedido.id} asignado a repartidor ${repartidorId}`);
    console.log(`📝 Aceptación de envío registrada: ${nombreArchivo}`);
    
  } catch (error) {
    console.error('⚠️ Error al registrar aceptación de envío:', error);
    // No fallar la asignación si falla el registro
  }
  
  res.json({ success: true, pedido });
});

// Actualizar pedido (genérico)
app.patch('/api/pedidos/:id', async (req, res) => {
  const pedido = pedidos.find(p => p.id === req.params.id);
  
  if (!pedido) {
    return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
  }
  
  // Actualizar campos permitidos
  const camposPermitidos = ['estado', 'descripcion', 'monto', 'notas', 'direccionEntrega'];
  
  Object.keys(req.body).forEach(key => {
    if (camposPermitidos.includes(key)) {
      pedido[key] = req.body[key];
    }
  });
  
  pedido.updatedAt = new Date().toISOString();
  
  // Actualizar archivo del pedido
  await actualizarPedidoArchivo(pedido);
  
  console.log(`✓ Pedido ${pedido.id} actualizado`);
  res.json({ success: true, pedido });
});

// Actualizar estado del pedido
app.patch('/api/pedidos/:id/estado', async (req, res) => {
  const { estado } = req.body;
  const pedido = pedidos.find(p => p.id === req.params.id);
  
  if (!pedido) {
    return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
  }
  
  const estadosValidos = ['pendiente', 'asignado', 'en-camino', 'entregado', 'cancelado'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ success: false, error: 'Estado inválido' });
  }
  
  const estadoAnterior = pedido.estado;
  pedido.estado = estado;
  pedido.updatedAt = new Date().toISOString();
  
  // Guardar fecha de entrega
  if (estado === 'entregado') {
    pedido.fechaEntrega = new Date().toISOString();
  }
  
  // Si el pedido se marca como entregado, actualizar estadísticas del repartidor
  if (estado === 'entregado' && estadoAnterior !== 'entregado' && pedido.repartidorId) {
    const repartidor = repartidores.find(r => r.id === pedido.repartidorId);
    
    if (repartidor) {
      repartidor.pedidosCompletados = (repartidor.pedidosCompletados || 0) + 1;
      repartidor.saldoTotal = (repartidor.saldoTotal || 0) + (parseFloat(pedido.monto) || 0);
      
      // Agregar al historial
      if (!repartidor.historialPedidos) repartidor.historialPedidos = [];
      repartidor.historialPedidos.push({
        pedidoId: pedido.id,
        monto: parseFloat(pedido.monto) || 0,
        fecha: new Date().toISOString(),
        cliente: pedido.nombreCliente,
        direccion: pedido.direccionEntrega
      });
      
      // Actualizar archivo del repartidor
      try {
        const repartidoresDir = path.join(BASE_DIR, 'repartidores');
        const archivos = await fs.readdir(repartidoresDir);
        
        for (const archivo of archivos) {
          if (archivo.endsWith('.json')) {
            const filePath = path.join(repartidoresDir, archivo);
            const contenido = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(contenido);
            
            if (data.id === pedido.repartidorId) {
              data.pedidosCompletados = repartidor.pedidosCompletados;
              data.saldoTotal = repartidor.saldoTotal;
              data.historialPedidos = repartidor.historialPedidos;
              await fs.writeFile(filePath, JSON.stringify(data, null, 2));
              
              // Actualizar informe CEO
              await actualizarInformeCEORepartidor(repartidor);
              
              console.log(`✓ Saldo actualizado para ${repartidor.nombre}: $${repartidor.saldoTotal.toFixed(2)}`);
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error al actualizar saldo del repartidor:', error);
      }
    }
  }
  
  // Actualizar archivo del pedido
  await actualizarPedidoArchivo(pedido);
  
  console.log(`✓ Pedido ${pedido.id} - Estado actualizado a: ${estado}`);
  res.json({ success: true, pedido });
});

// --- ENDPOINTS DE CHAT ---

// Enviar mensaje en un pedido
app.post('/api/pedidos/:id/chat', (req, res) => {
  const { mensaje, remitente } = req.body;
  const pedidoId = req.params.id;
  
  if (!mensaje || !remitente) {
    return res.status(400).json({ success: false, error: 'Mensaje y remitente requeridos' });
  }
  
  if (!chats[pedidoId]) {
    chats[pedidoId] = [];
  }
  
  const nuevoMensaje = {
    id: `MSG-${Date.now()}`,
    mensaje,
    remitente,
    timestamp: new Date().toISOString()
  };
  
  chats[pedidoId].push(nuevoMensaje);
  
  console.log(`✓ Mensaje enviado en pedido ${pedidoId}`);
  res.json({ success: true, mensaje: nuevoMensaje });
});

// Obtener chat de un pedido
app.get('/api/pedidos/:id/chat', (req, res) => {
  const pedidoId = req.params.id;
  const mensajes = chats[pedidoId] || [];
  
  res.json({ success: true, mensajes, total: mensajes.length });
});

// --- NUEVOS ENDPOINTS: CONFIRMACIÓN DE ENTREGA Y CALIFICACIÓN ---

// 📱 Generar código QR de pago por distancia para el cliente
app.post('/api/pedidos/:id/generar-qr-pago', async (req, res) => {
  const pedido = pedidos.find(p => p.id === req.params.id);
  
  if (!pedido) {
    return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
  }

  try {
    // Calcular costo por distancia (simulado - en producción usar API de mapas)
    const distanciaKm = req.body.distancia || 5; // km
    const costoPorKm = 50; // $50 por km
    const costoBase = 200; // $200 base
    const costoTotal = costoBase + (distanciaKm * costoPorKm);
    
    // Generar QR usando API pública
    const datoPago = JSON.stringify({
      pedidoId: pedido.id,
      monto: costoTotal,
      concepto: `Envío YAvoy - ${distanciaKm}km`,
      repartidor: pedido.repartidor?.nombre || 'Repartidor',
      cliente: pedido.nombreCliente
    });
    
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(datoPago)}`;
    
    // Guardar información de pago en el pedido
    pedido.pagoEnvio = {
      distanciaKm,
      costoPorKm,
      costoBase,
      costoTotal,
      qrGenerado: new Date().toISOString(),
      qrImage,
      estado: 'pendiente'
    };
    
    await actualizarPedidoArchivo(pedido);
    
    console.log(`💳 QR de pago generado para pedido ${pedido.id}: $${costoTotal} (${distanciaKm}km)`);
    
    res.json({
      success: true,
      pago: {
        pedidoId: pedido.id,
        distanciaKm,
        costoBase,
        costoPorKm,
        costoTotal,
        qrImage,
        concepto: `Envío YAvoy - ${distanciaKm}km`
      }
    });
    
  } catch (error) {
    console.error('❌ Error al generar QR de pago:', error);
    res.status(500).json({ success: false, error: 'Error al generar QR de pago' });
  }
});

// ✅ Cliente confirma que recibió el pedido
app.post('/api/pedidos/:id/cliente-confirma', async (req, res) => {
  const pedido = pedidos.find(p => p.id === req.params.id);
  
  if (!pedido) {
    return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
  }

  try {
    pedido.confirmacionCliente = {
      confirmado: true,
      fecha: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress || 'No disponible'
    };
    
    // No cambiar estado aún, esperar confirmación del repartidor
    pedido.updatedAt = new Date().toISOString();
    
    await actualizarPedidoArchivo(pedido);
    
    // Notificar al repartidor
    notificarTodos('clienteConfirmoRecepcion', {
      pedidoId: pedido.id,
      repartidorId: pedido.repartidorId,
      mensaje: 'El cliente confirmó que recibió el pedido'
    });
    
    console.log(`✅ Cliente confirmó recepción del pedido ${pedido.id}`);
    
    res.json({
      success: true,
      mensaje: 'Confirmación registrada. Esperando confirmación del repartidor.',
      pedido
    });
    
  } catch (error) {
    console.error('❌ Error al registrar confirmación del cliente:', error);
    res.status(500).json({ success: false, error: 'Error al registrar confirmación' });
  }
});

// ⭐ Cliente califica el servicio de envío
app.post('/api/pedidos/:id/calificar-envio', async (req, res) => {
  const { calificacion, comentario } = req.body;
  const pedido = pedidos.find(p => p.id === req.params.id);
  
  if (!pedido) {
    return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
  }

  if (!calificacion || calificacion < 1 || calificacion > 5) {
    return res.status(400).json({ success: false, error: 'Calificación debe ser entre 1 y 5 estrellas' });
  }

  try {
    const nuevaCalificacion = {
      id: `CAL-${Date.now()}`,
      pedidoId: pedido.id,
      repartidorId: pedido.repartidorId,
      calificacion: parseInt(calificacion),
      comentario: comentario || '',
      fecha: new Date().toISOString(),
      cliente: pedido.nombreCliente
    };
    
    // Guardar calificación
    calificaciones.push(nuevaCalificacion);
    
    // Guardar en archivo
    const dirCalificaciones = path.join(BASE_DIR, 'calificaciones');
    await fs.mkdir(dirCalificaciones, { recursive: true });
    
    const nombreArchivo = `calificacion_${pedido.id}_${Date.now()}.json`;
    const rutaArchivo = path.join(dirCalificaciones, nombreArchivo);
    await fs.writeFile(rutaArchivo, JSON.stringify(nuevaCalificacion, null, 2), 'utf8');
    
    // Actualizar calificación promedio del repartidor
    if (pedido.repartidorId) {
      const repartidor = repartidores.find(r => r.id === pedido.repartidorId);
      if (repartidor) {
        const calificacionesRepartidor = calificaciones.filter(c => c.repartidorId === pedido.repartidorId);
        const promedio = calificacionesRepartidor.reduce((sum, c) => sum + c.calificacion, 0) / calificacionesRepartidor.length;
        repartidor.calificacion = promedio.toFixed(1);
        repartidor.totalCalificaciones = calificacionesRepartidor.length;
      }
    }
    
    // Actualizar pedido
    pedido.calificacion = nuevaCalificacion;
    await actualizarPedidoArchivo(pedido);
    
    console.log(`⭐ Calificación registrada: ${calificacion} estrellas para pedido ${pedido.id}`);
    
    res.json({
      success: true,
      mensaje: '¡Gracias por tu calificación!',
      calificacion: nuevaCalificacion
    });
    
  } catch (error) {
    console.error('❌ Error al registrar calificación:', error);
    res.status(500).json({ success: false, error: 'Error al registrar calificación' });
  }
});

// 📦 Repartidor confirma entrega (esto completa el proceso)
app.post('/api/pedidos/:id/repartidor-confirma-entrega', async (req, res) => {
  const pedido = pedidos.find(p => p.id === req.params.id);
  
  if (!pedido) {
    return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
  }

  try {
    pedido.confirmacionRepartidor = {
      confirmado: true,
      fecha: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress || 'No disponible'
    };
    
    // Cambiar estado a entregado
    pedido.estado = 'entregado';
    pedido.fechaEntrega = new Date().toISOString();
    pedido.updatedAt = new Date().toISOString();
    
    await actualizarPedidoArchivo(pedido);
    
    // Notificar al comercio
    notificarTodos('pedidoEntregado', {
      pedidoId: pedido.id,
      comercioId: pedido.comercioId || pedido.clienteId,
      mensaje: 'El repartidor confirmó la entrega del pedido',
      cliente: pedido.nombreCliente
    });
    
    // Actualizar estadísticas del repartidor
    if (pedido.repartidorId) {
      const repartidor = repartidores.find(r => r.id === pedido.repartidorId);
      if (repartidor) {
        repartidor.pedidosCompletados = (repartidor.pedidosCompletados || 0) + 1;
        repartidor.saldoTotal = (repartidor.saldoTotal || 0) + (parseFloat(pedido.pagoEnvio?.costoTotal || pedido.monto) || 0);
      }
    }
    
    console.log(`✅ Repartidor confirmó entrega del pedido ${pedido.id} - Notificación enviada al comercio`);
    
    res.json({
      success: true,
      mensaje: 'Entrega confirmada exitosamente',
      pedido
    });
    
  } catch (error) {
    console.error('❌ Error al confirmar entrega:', error);
    res.status(500).json({ success: false, error: 'Error al confirmar entrega' });
  }
});

// --- ENDPOINTS DE REPARTIDORES ---

// Registrar repartidor
app.post('/api/repartidores', async (req, res) => {
  const { nombre, telefono, email, vehiculo, dni, documentos, aceptaTerminos, fechaSolicitud } = req.body;
  
  // Validaciones básicas
  if (!nombre || !telefono || !email || !vehiculo) {
    return res.status(400).json({ 
      success: false, 
      error: 'Todos los campos básicos son obligatorios: nombre, teléfono, email y vehículo' 
    });
  }

  if (!dni) {
    return res.status(400).json({ 
      success: false, 
      error: 'El número de DNI es obligatorio' 
    });
  }

  if (!aceptaTerminos) {
    return res.status(400).json({ 
      success: false, 
      error: 'Debes aceptar los términos y condiciones' 
    });
  }

  // Validar documentos DNI
  if (!documentos || !documentos.dniFrente || !documentos.dniDorso) {
    return res.status(400).json({ 
      success: false, 
      error: 'Debes proporcionar ambas fotos del DNI (frente y dorso)' 
    });
  }

  // Validar cédula del vehículo si es moto o auto
  if ((vehiculo === 'moto' || vehiculo === 'auto') && (!documentos.cedulaFrente || !documentos.cedulaDorso)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Debes proporcionar ambas fotos de la cédula del vehículo para moto o auto' 
    });
  }

  // Registrar aceptación de términos y condiciones
  const fechaAceptacionTerminos = new Date().toISOString();
  const registroAceptacionTerminos = {
    aceptado: true,
    fechaAceptacion: fechaAceptacionTerminos,
    ipAddress: req.ip || req.connection.remoteAddress || 'No disponible',
    userAgent: req.headers['user-agent'] || 'No disponible',
    version: '1.0', // Versión de los términos y condiciones
    texto: 'Términos y Condiciones de Uso para Repartidores Independientes de YAvoy - Versión 1.0'
  };
  
  const nuevoRepartidor = {
    id: `REP-${Date.now()}`,
    nombre,
    telefono,
    email,
    dni,
    vehiculo,
    disponible: true,
    verificadoEmail: false,
    verificadoDocumentos: false,
    estadoSolicitud: 'pendiente', // pendiente, aprobado, rechazado
    pedidosActivos: 0,
    pedidosCompletados: 0,
    saldoTotal: 0,
    calificacion: 5,
    calificaciones: [],
    historialPedidos: [],
    ubicacion: null,
    documentos: {
      dniNumero: dni,
      dniFrente: documentos.dniFrente.substring(0, 100) + '...', // Guardar solo referencia
      dniDorso: documentos.dniDorso.substring(0, 100) + '...',
      cedulaFrente: documentos.cedulaFrente ? documentos.cedulaFrente.substring(0, 100) + '...' : null,
      cedulaDorso: documentos.cedulaDorso ? documentos.cedulaDorso.substring(0, 100) + '...' : null
    },
    terminosYCondiciones: registroAceptacionTerminos,
    fechaSolicitud: fechaSolicitud || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  // Guardar en memoria
  repartidores.push(nuevoRepartidor);
  
  // Guardar en archivo JSON para persistencia
  try {
    const nombreLimpio = nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const filename = `repartidor_${nombreLimpio}_${timestamp}.json`;
    const filePath = path.join(BASE_DIR, 'repartidores', filename);
    
    // Guardar repartidor con documentos completos
    const repartidorConDocs = {
      ...nuevoRepartidor,
      documentos: documentos // Guardar documentos completos en el archivo
    };
    
    await fs.writeFile(filePath, JSON.stringify(repartidorConDocs, null, 2));
    
    // Guardar documentos en carpeta CEO para verificación
    await guardarDocumentosCEO(nuevoRepartidor.id, documentos, nombre);
    
    // Crear informe para CEO
    await crearInformeCEORepartidor(nuevoRepartidor);
    
    console.log(`✓ Repartidor registrado: ${nuevoRepartidor.id} - ${nombre}`);
    console.log(`  📧 Email: ${email}`);
    console.log(`  🪪 DNI: ${dni}`);
    console.log(`  🏍️ Vehículo: ${vehiculo}`);
    console.log(`  📄 Documentos: DNI (frente/dorso) ${documentos.cedulaFrente ? '+ Cédula (frente/dorso)' : ''}`);
    console.log(`  ✅ Términos aceptados: ${registroAceptacionTerminos.fechaAceptacion}`);
    console.log(`  📋 Versión T&C: ${registroAceptacionTerminos.version}`);
    console.log(`  🌐 IP: ${registroAceptacionTerminos.ipAddress}`);
    console.log(`  📁 Archivo guardado: ${filename}`);
    console.log(`  🔒 Documentos CEO guardados`);
    console.log(`  📊 Informe CEO creado`);
    
    // Generar y enviar código de verificación automáticamente
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Intentar enviar email de verificación
    try {
      const mailOptions = {
        from: '"YAvoy Delivery" <yavoyen5@gmail.com>',
        to: email,
        subject: '🔐 Código de Verificación - YAvoy',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 48px; margin-bottom: 10px; }
              h1 { color: #1e293b; margin: 0; font-size: 28px; }
              .code-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin: 30px 0; }
              .code { font-size: 48px; font-weight: bold; letter-spacing: 10px; margin: 20px 0; }
              .info { color: #64748b; font-size: 14px; line-height: 1.6; }
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; color: #92400e; margin: 20px 0; }
              .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🚀</div>
                <h1>¡Bienvenido a YAvoy!</h1>
              </div>
              
              <p class="info">
                Hola <strong>${nombre}</strong>! Tu registro como repartidor se ha procesado exitosamente. 
                Para completar tu verificación, usa el siguiente código:
              </p>
              
              <div class="code-box">
                <div style="font-size: 14px; opacity: 0.9;">Tu código de verificación es:</div>
                <div class="code">${codigoVerificacion}</div>
                <div style="font-size: 14px; opacity: 0.9;">⏰ Válido por 10 minutos</div>
              </div>
              
              <div class="warning">
                ⚠️ <strong>Importante:</strong> Nunca compartas este código con nadie. 
                El equipo de YAvoy nunca te pedirá este código por teléfono o mensaje.
              </div>
              
              <p class="info">
                Tu ID de repartidor es: <strong>${nuevoRepartidor.id}</strong><br>
                Una vez verificado, el equipo de YAvoy revisará tus documentos.
              </p>
              
              <div class="footer">
                <p>YAvoy Delivery - Sistema de Reparto Inteligente</p>
                <p>Este es un email automático, por favor no respondas a este mensaje.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await emailTransporter.sendMail(mailOptions);
      console.log(`✅ Email de verificación enviado a ${email}`);
      
      // Enviar notificación a YaVoy sobre el nuevo registro
      try {
        const notificacionYaVoy = {
          from: '"YAvoy Sistema" <yavoyen5@gmail.com>',
          to: 'yavoyen5@gmail.com',
          subject: '📋 Nuevo Registro de Repartidor - YAvoy',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px; }
                .dato { display: flex; justify-content: space-between; padding: 15px; border-bottom: 1px solid #e2e8f0; }
                .dato:last-child { border-bottom: none; }
                .label { color: #64748b; font-weight: 600; }
                .valor { color: #1e293b; font-weight: 700; }
                .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
                .badge { display: inline-block; padding: 5px 15px; border-radius: 20px; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; margin-top: 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 24px;">📋 Nuevo Registro de Repartidor</h1>
                  <div class="badge">⏳ Pendiente de Verificación</div>
                </div>
                
                <div class="dato">
                  <span class="label">👤 Nombre:</span>
                  <span class="valor">${nombre}</span>
                </div>
                
                <div class="dato">
                  <span class="label">📧 Email:</span>
                  <span class="valor">${email}</span>
                </div>
                
                <div class="dato">
                  <span class="label">📱 Teléfono:</span>
                  <span class="valor">${telefono}</span>
                </div>
                
                <div class="dato">
                  <span class="label">🪪 DNI:</span>
                  <span class="valor">${dni}</span>
                </div>
                
                <div class="dato">
                  <span class="label">🏍️ Vehículo:</span>
                  <span class="valor">${vehiculo.toUpperCase()}</span>
                </div>
                
                <div class="dato">
                  <span class="label">🆔 ID Asignado:</span>
                  <span class="valor">${nuevoRepartidor.id}</span>
                </div>
                
                <div class="dato">
                  <span class="label">📅 Fecha:</span>
                  <span class="valor">${new Date().toLocaleString('es-AR')}</span>
                </div>
                
                <div class="dato">
                  <span class="label">🔐 Código Enviado:</span>
                  <span class="valor">${codigoVerificacion}</span>
                </div>
                
                <div style="background: #dbeafe; padding: 20px; border-radius: 12px; margin-top: 30px;">
                  <p style="margin: 0; color: #1e40af; font-size: 14px;">
                    ℹ️ <strong>Próximos pasos:</strong><br>
                    1. El repartidor debe verificar su email<br>
                    2. Revisa los documentos en el panel CEO<br>
                    3. Aprueba o rechaza la solicitud
                  </p>
                </div>
                
                <div class="footer">
                  <p>YAvoy Delivery - Notificación Automática</p>
                  <p>Este email es solo informativo</p>
                </div>
              </div>
            </body>
            </html>
          `
        };
        
        await emailTransporter.sendMail(notificacionYaVoy);
        console.log(`✅ Notificación enviada a yavoyen5@gmail.com`);
      } catch (notifError) {
        console.log(`⚠️ Error enviando notificación a YaVoy:`, notifError.message);
      }
      
      res.status(201).json({ 
        success: true, 
        repartidor: nuevoRepartidor,
        message: `Solicitud recibida exitosamente. Tu ID es: ${nuevoRepartidor.id}. Revisa tu email para verificar tu cuenta.`,
        emailEnviado: true
      });

    } catch (emailError) {
      console.log(`⚠️ Error enviando email a ${email}:`, emailError.message);
      console.log(`📧 Código de verificación para ${nombre} (${email}): ${codigoVerificacion}`);
      
      res.status(201).json({ 
        success: true, 
        repartidor: nuevoRepartidor,
        message: `Solicitud recibida exitosamente. Tu ID es: ${nuevoRepartidor.id}. Código de verificación: ${codigoVerificacion}`,
        emailEnviado: false,
        codigoDesarrollo: codigoVerificacion
      });
    }
  } catch (error) {
    console.error('Error al guardar repartidor:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al guardar el registro del repartidor' 
    });
  }
});

// Listar repartidores disponibles
app.get('/api/repartidores', (req, res) => {
  const { disponible } = req.query;
  
  let repartidoresFiltrados = [...repartidores];
  
  if (disponible !== undefined) {
    repartidoresFiltrados = repartidoresFiltrados.filter(r => 
      r.disponible === (disponible === 'true')
    );
  }
  
  res.json({ success: true, repartidores: repartidoresFiltrados, total: repartidoresFiltrados.length });
});

// Actualizar ubicación del repartidor (para seguimiento en tiempo real)
app.patch('/api/repartidores/:id/ubicacion', (req, res) => {
  const { lat, lng } = req.body;
  const repartidor = repartidores.find(r => r.id === req.params.id);
  
  if (!repartidor) {
    return res.status(404).json({ success: false, error: 'Repartidor no encontrado' });
  }
  
  repartidor.ubicacion = { lat, lng, timestamp: new Date().toISOString() };
  
  res.json({ success: true, repartidor });
});

/**
 * Configurar credenciales de pago del repartidor
 * El repartidor vincula su cuenta de Mercado Pago
 */
app.post('/api/repartidores/:id/configurar-pago', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      metodoPago, // 'mercadopago' (único método soportado)
      accessToken, 
      publicKey,
      email,
      cbu,
      alias
    } = req.body;

    const repartidorIndex = repartidores.findIndex(r => r.id === id);
    if (repartidorIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Repartidor no encontrado' 
      });
    }

    // Validar que sea Mercado Pago
    if (metodoPago !== 'mercadopago') {
      return res.status(400).json({
        success: false,
        error: 'Método de pago no soportado. Use "mercadopago"'
      });
    }

    // Validar credenciales requeridas
    if (!cbu && !alias) {
      return res.status(400).json({
        success: false,
        error: 'CBU/CVU o Alias son requeridos para recibir transferencias'
      });
    }
    
    // Guardar configuración de pago (CBU/CVU para recibir transferencias)
    try {
      // Validar formato de CBU/CVU (22 dígitos) o Alias
      if (cbu && cbu.length !== 22) {
        return res.status(400).json({
          success: false,
          error: 'CBU/CVU debe tener 22 dígitos'
        });
      }
      
      // Guardar configuración
      repartidores[repartidorIndex].configPago = {
        metodoPago: 'mercadopago',
        cbu: cbu || null,
        alias: alias || null,
        email: email,
        verificado: true,
        fechaConfiguracion: new Date().toISOString()
      };

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error al validar credenciales de Mercado Pago'
      });
    }

    // Guardar en archivo
    const filePath = path.join(BASE_DIR, 'repartidores', `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(repartidores[repartidorIndex], null, 2));

    // Guardar imágenes de verificación si existen
    if (req.body.dniImagen || req.body.selfieImagen) {
      const verificacionDir = path.join(BASE_DIR, 'verificaciones', id);
      await fs.mkdir(verificacionDir, { recursive: true });
      
      if (req.body.dniImagen) {
        const dniPath = path.join(verificacionDir, 'dni.jpg');
        const dniData = req.body.dniImagen.replace(/^data:image\/\w+;base64,/, '');
        await fs.writeFile(dniPath, dniData, 'base64');
      }
      
      if (req.body.selfieImagen) {
        const selfiePath = path.join(verificacionDir, 'selfie.jpg');
        const selfieData = req.body.selfieImagen.replace(/^data:image\/\w+;base64,/, '');
        await fs.writeFile(selfiePath, selfieData, 'base64');
      }
      
      repartidores[repartidorIndex].configPago.identidadVerificada = true;
      repartidores[repartidorIndex].configPago.fechaVerificacion = new Date().toISOString();
      
      await fs.writeFile(filePath, JSON.stringify(repartidores[repartidorIndex], null, 2));
    }

    console.log(`✅ Configuración de pago actualizada para ${id}: ${metodoPago}`);

    res.json({ 
      success: true, 
      message: 'Configuración de pago guardada exitosamente',
      repartidor: {
        id: repartidores[repartidorIndex].id,
        nombre: repartidores[repartidorIndex].nombre,
        configPago: {
          metodoPago: repartidores[repartidorIndex].configPago.metodoPago,
          email: repartidores[repartidorIndex].configPago.email,
          verificado: repartidores[repartidorIndex].configPago.verificado,
          identidadVerificada: repartidores[repartidorIndex].configPago.identidadVerificada || false
        }
      }
    });

  } catch (error) {
    console.error('Error al configurar pago:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al configurar método de pago' 
    });
  }
});

/**
 * 📧 Enviar código de verificación por email
 */
app.post('/api/enviar-codigo-verificacion', async (req, res) => {
  try {
    const { email, codigo } = req.body;

    if (!email || !codigo) {
      return res.status(400).json({
        success: false,
        error: 'Email y código son requeridos'
      });
    }

    console.log(`📧 Enviando código de verificación a ${email}`);
    console.log(`🔑 Código: ${codigo}`);

    // Intentar enviar email real
    try {
      const mailOptions = {
        from: '"YAvoy Delivery" <yavoyen5@gmail.com>',
        to: email,
        subject: '🔐 Código de Verificación - YAvoy',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 48px; margin-bottom: 10px; }
              h1 { color: #1e293b; margin: 0; font-size: 28px; }
              .code-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin: 30px 0; }
              .code { font-size: 48px; font-weight: bold; letter-spacing: 10px; margin: 20px 0; }
              .info { color: #64748b; font-size: 14px; line-height: 1.6; }
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; color: #92400e; margin: 20px 0; }
              .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🚀</div>
                <h1>Verifica tu Email</h1>
              </div>
              
              <p class="info">
                Hola! Gracias por registrarte en <strong>YAvoy Delivery</strong>. 
                Para completar tu verificación, usa el siguiente código:
              </p>
              
              <div class="code-box">
                <div style="font-size: 14px; opacity: 0.9;">Tu código de verificación es:</div>
                <div class="code">${codigo}</div>
                <div style="font-size: 14px; opacity: 0.9;">⏰ Válido por 10 minutos</div>
              </div>
              
              <div class="warning">
                ⚠️ <strong>Importante:</strong> Nunca compartas este código con nadie. 
                El equipo de YAvoy nunca te pedirá este código por teléfono o mensaje.
              </div>
              
              <p class="info">
                Si no solicitaste este código, puedes ignorar este email de forma segura.
              </p>
              
              <div class="footer">
                <p>YAvoy Delivery - Sistema de Reparto Inteligente</p>
                <p>Este es un email automático, por favor no respondas a este mensaje.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await emailTransporter.sendMail(mailOptions);
      console.log(`✅ Email enviado exitosamente a ${email}`);

      res.json({
        success: true,
        message: 'Código enviado exitosamente a tu email',
        emailEnviado: true
      });

    } catch (emailError) {
      // Si falla el envío de email, mostrar en consola para desarrollo
      console.log('⚠️ No se pudo enviar email, mostrando código en consola:');
      console.log(`
╔════════════════════════════════════════╗
║   CÓDIGO DE VERIFICACIÓN YAVOY        ║
╠════════════════════════════════════════╣
║                                        ║
║   Tu código es: ${codigo}              ║
║                                        ║
║   Este código expira en 10 minutos    ║
║   No compartas este código con nadie  ║
║                                        ║
╚════════════════════════════════════════╝
      `);

      res.json({
        success: true,
        message: 'Código generado (modo desarrollo)',
        codigoDesarrollo: codigo,
        emailEnviado: false
      });
    }

  } catch (error) {
    console.error('Error al enviar código:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar código de verificación'
    });
  }
});

/**
 * 🔐 Verificar código de confirmación por email
 */
app.post('/api/verificar-codigo', async (req, res) => {
  try {
    const { email, codigo } = req.body;

    if (!email || !codigo) {
      return res.status(400).json({
        success: false,
        error: 'Email y código son requeridos'
      });
    }

    console.log(`🔐 Verificando código para ${email}: ${codigo}`);

    // En un sistema real, aquí verificarías el código contra una base de datos
    // Por ahora, simulamos que cualquier código de 6 dígitos es válido
    if (codigo.length === 6 && /^\d+$/.test(codigo)) {
      console.log(`✅ Código verificado exitosamente para ${email}`);
      
      res.json({
        success: true,
        message: 'Código verificado exitosamente',
        verificado: true
      });
    } else {
      console.log(`❌ Código inválido para ${email}: ${codigo}`);
      
      res.status(400).json({
        success: false,
        error: 'Código inválido. Debe ser un número de 6 dígitos.',
        verificado: false
      });
    }

  } catch (error) {
    console.error('Error al verificar código:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar código'
    });
  }
});

// ============================================
// APROBAR VERIFICACIÓN DE REPARTIDOR (CEO)
// ============================================
app.post('/api/repartidores/:id/aprobar-verificacion', async (req, res) => {
  const { id } = req.params;

  try {
    const repartidorIndex = repartidores.findIndex(r => r.id === id);

    if (repartidorIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Repartidor no encontrado'
      });
    }

    const repartidor = repartidores[repartidorIndex];

    // Verificar que tenga datos de verificación
    if (!repartidor.configPago || !repartidor.configPago.cbu) {
      return res.status(400).json({
        success: false,
        error: 'El repartidor no ha completado la configuración de pago'
      });
    }

    if (!repartidor.configPago.emailVerificado || !repartidor.configPago.identidadVerificada) {
      return res.status(400).json({
        success: false,
        error: 'El repartidor no ha completado todas las verificaciones'
      });
    }

    // Aprobar verificación
    repartidores[repartidorIndex].configPago.estadoVerificacion = 'aprobada';
    repartidores[repartidorIndex].configPago.fechaAprobacion = new Date().toISOString();
    repartidores[repartidorIndex].configPago.aprobadoPor = 'CEO';

    // Guardar cambios
    await guardarRepartidores();

    console.log(`✅ Verificación aprobada para repartidor ${id}`);

    // Notificar al repartidor en tiempo real
    notificarRepartidor(id, 'verificacionAprobada', {
      mensaje: '¡Felicitaciones! Tu cuenta ha sido verificada',
      fecha: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Verificación aprobada correctamente',
      repartidor: repartidores[repartidorIndex]
    });

  } catch (error) {
    console.error('❌ Error al aprobar verificación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al aprobar verificación'
    });
  }
});

// ============================================
// RECHAZAR VERIFICACIÓN DE REPARTIDOR (CEO)
// ============================================
app.post('/api/repartidores/:id/rechazar-verificacion', async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  try {
    const repartidorIndex = repartidores.findIndex(r => r.id === id);

    if (repartidorIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Repartidor no encontrado'
      });
    }

    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar un motivo para el rechazo'
      });
    }

    const repartidor = repartidores[repartidorIndex];

    // Verificar que tenga datos de verificación
    if (!repartidor.configPago || !repartidor.configPago.cbu) {
      return res.status(400).json({
        success: false,
        error: 'El repartidor no ha completado la configuración de pago'
      });
    }

    // Rechazar verificación
    repartidores[repartidorIndex].configPago.estadoVerificacion = 'rechazada';
    repartidores[repartidorIndex].configPago.fechaRechazo = new Date().toISOString();
    repartidores[repartidorIndex].configPago.motivoRechazo = motivo.trim();
    repartidores[repartidorIndex].configPago.rechazadoPor = 'CEO';

    // Guardar cambios
    await guardarRepartidores();

    console.log(`❌ Verificación rechazada para repartidor ${id}: ${motivo}`);

    // Notificar al repartidor en tiempo real
    notificarRepartidor(id, 'verificacionRechazada', {
      motivo: motivo.trim(),
      fecha: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Verificación rechazada',
      motivo: motivo.trim(),
      repartidor: repartidores[repartidorIndex]
    });

  } catch (error) {
    console.error('❌ Error al rechazar verificación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al rechazar verificación'
    });
  }
});

// ============================================
// ENDPOINTS DE CHAT EN TIEMPO REAL
// ============================================

// Obtener historial de chat de un pedido
app.get('/api/chat/:pedidoId', async (req, res) => {
  const { pedidoId } = req.params;
  
  try {
    // Intentar cargar desde archivo
    const chatPath = path.join(BASE_DIR, 'chats', `${pedidoId}.json`);
    
    try {
      const data = await fs.readFile(chatPath, 'utf-8');
      const mensajes = JSON.parse(data);
      
      res.json({
        success: true,
        pedidoId,
        mensajes,
        total: mensajes.length
      });
    } catch (fileError) {
      // Si no existe el archivo, devolver array vacío
      res.json({
        success: true,
        pedidoId,
        mensajes: chats[pedidoId] || [],
        total: (chats[pedidoId] || []).length
      });
    }
    
  } catch (error) {
    console.error('Error al obtener chat:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial de chat'
    });
  }
});

// Enviar mensaje (también por HTTP, además de Socket.IO)
app.post('/api/chat/:pedidoId/mensaje', async (req, res) => {
  const { pedidoId } = req.params;
  const { mensaje, remitente, remitenteId } = req.body;
  
  try {
    if (!chats[pedidoId]) {
      chats[pedidoId] = [];
    }
    
    const nuevoMensaje = {
      id: `MSG-${Date.now()}`,
      pedidoId,
      mensaje,
      remitente,
      remitenteId,
      fecha: new Date().toISOString(),
      leido: false
    };
    
    chats[pedidoId].push(nuevoMensaje);
    
    // Guardar en archivo
    const chatPath = path.join(BASE_DIR, 'chats', `${pedidoId}.json`);
    await fs.writeFile(chatPath, JSON.stringify(chats[pedidoId], null, 2));
    
    // Emitir por Socket.IO
    io.to(`pedido-${pedidoId}`).emit('nuevoMensaje', nuevoMensaje);
    
    res.json({
      success: true,
      mensaje: nuevoMensaje
    });
    
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar mensaje'
    });
  }
});

// ============================================
// ENDPOINTS DE ANALYTICS PARA CEO
// ============================================

// Dashboard de analytics general
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    // Calcular estadísticas
    const totalPedidos = pedidos.length;
    const pedidosCompletados = pedidos.filter(p => p.estado === 'entregado').length;
    const pedidosEnCurso = pedidos.filter(p => ['pendiente', 'aceptado', 'en_camino'].includes(p.estado)).length;
    const pedidosCancelados = pedidos.filter(p => p.estado === 'cancelado').length;
    
    const totalRepartidores = repartidores.length;
    const repartidoresActivos = repartidores.filter(r => r.disponible).length;
    const repartidoresVerificados = repartidores.filter(r => 
      r.configPago && r.configPago.estadoVerificacion === 'aprobada'
    ).length;
    
    // Calcular ingresos
    const pedidosPagados = pedidos.filter(p => p.pagado);
    const ingresosTotales = pedidosPagados.reduce((sum, p) => sum + (p.monto || 0), 0);
    const comisionesTotales = ingresosTotales * 0.15; // 15% de comisión
    
    // Pedidos por día (últimos 7 días)
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    
    const pedidosPorDia = {};
    for (let i = 0; i < 7; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      pedidosPorDia[fechaStr] = 0;
    }
    
    pedidos.forEach(p => {
      const fechaPedido = new Date(p.fecha).toISOString().split('T')[0];
      if (pedidosPorDia.hasOwnProperty(fechaPedido)) {
        pedidosPorDia[fechaPedido]++;
      }
    });
    
    // Repartidores top (por pedidos completados)
    const repartidoresTop = repartidores
      .map(r => ({
        id: r.id,
        nombre: r.nombre,
        pedidosCompletados: r.pedidosCompletados || 0,
        calificacion: r.calificacion || 0,
        comisionesRetenidas: r.comisionesRetenidas || 0
      }))
      .sort((a, b) => b.pedidosCompletados - a.pedidosCompletados)
      .slice(0, 10);
    
    // Tiempo promedio de entrega
    const pedidosConTiempo = pedidos.filter(p => p.tiempoEntrega);
    const tiempoPromedioEntrega = pedidosConTiempo.length > 0
      ? pedidosConTiempo.reduce((sum, p) => sum + p.tiempoEntrega, 0) / pedidosConTiempo.length
      : 0;
    
    res.json({
      success: true,
      estadisticas: {
        pedidos: {
          total: totalPedidos,
          completados: pedidosCompletados,
          enCurso: pedidosEnCurso,
          cancelados: pedidosCancelados,
          tasaExito: totalPedidos > 0 ? (pedidosCompletados / totalPedidos * 100).toFixed(1) : 0
        },
        repartidores: {
          total: totalRepartidores,
          activos: repartidoresActivos,
          verificados: repartidoresVerificados,
          pendientesVerificacion: totalRepartidores - repartidoresVerificados
        },
        finanzas: {
          ingresosTotales: ingresosTotales.toFixed(2),
          comisionesTotales: comisionesTotales.toFixed(2),
          ingresoPromedioPorPedido: totalPedidos > 0 ? (ingresosTotales / totalPedidos).toFixed(2) : 0
        },
        rendimiento: {
          tiempoPromedioEntrega: Math.round(tiempoPromedioEntrega),
          pedidosPorDia,
          repartidoresTop
        }
      }
    });
    
  } catch (error) {
    console.error('Error al obtener analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

// Actualizar disponibilidad del repartidor
app.patch('/api/repartidores/:id/disponibilidad', async (req, res) => {
  const { disponible } = req.body;
  const repartidor = repartidores.find(r => r.id === req.params.id);
  
  if (!repartidor) {
    return res.status(404).json({ success: false, error: 'Repartidor no encontrado' });
  }
  
  repartidor.disponible = disponible;
  
  // Actualizar el archivo JSON
  try {
    const repartidoresDir = path.join(BASE_DIR, 'repartidores');
    const archivos = await fs.readdir(repartidoresDir);
    
    // Buscar el archivo del repartidor
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const filePath = path.join(repartidoresDir, archivo);
        const contenido = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(contenido);
        
        if (data.id === req.params.id) {
          data.disponible = disponible;
          await fs.writeFile(filePath, JSON.stringify(data, null, 2));
          
          // Actualizar informe CEO
          await actualizarInformeCEORepartidor(repartidor);
          
          console.log(`✓ Disponibilidad actualizada para ${repartidor.nombre}: ${disponible ? 'DISPONIBLE' : 'INACTIVO'}`);
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error al actualizar archivo:', error);
  }
  
  res.json({ success: true, repartidor });
});

// Actualizar perfil del repartidor
app.patch('/api/repartidores/:id/perfil', async (req, res) => {
  const repartidorId = req.params.id;
  const actualizaciones = req.body;
  
  try {
    const repartidoresDir = path.join(BASE_DIR, 'repartidores');
    const archivos = await fs.readdir(repartidoresDir);
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const filePath = path.join(repartidoresDir, archivo);
        const contenido = await fs.readFile(filePath, 'utf-8');
        const repartidor = JSON.parse(contenido);
        
        if (repartidor.id === repartidorId) {
          // Guardar estado anterior
          const repartidorAnterior = JSON.parse(JSON.stringify(repartidor));
          
          // Actualizar repartidor
          const repartidorActualizado = {
            ...repartidor,
            ...actualizaciones,
            id: repartidor.id, // Preservar ID
            fechaActualizacion: new Date().toISOString()
          };
          
          // Guardar en archivo principal
          await fs.writeFile(filePath, JSON.stringify(repartidorActualizado, null, 2));
          
          // Actualizar en array en memoria
          const index = repartidores.findIndex(r => r.id === repartidorId);
          if (index !== -1) {
            repartidores[index] = repartidorActualizado;
          }
          
          // 📝 GUARDAR REGISTRO DE ACTUALIZACIÓN
          const ahora = new Date();
          const timestamp = ahora.getTime();
          const fechaLegible = ahora.toLocaleString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          
          const registroActualizacion = {
            id: `actualizacion_repartidor_${timestamp}`,
            repartidorId: repartidor.id,
            tipo: 'actualizacion_perfil',
            datosAnteriores: repartidorAnterior,
            datosNuevos: repartidorActualizado,
            camposModificados: Object.keys(actualizaciones),
            fechaActualizacion: ahora.toISOString(),
            fechaLegible: fechaLegible,
            ip: req.ip || req.connection.remoteAddress || 'No disponible',
            userAgent: req.headers['user-agent'] || 'No disponible'
          };
          
          // Guardar en carpeta de actualizaciones
          const dirActualizaciones = path.join(BASE_DIR, 'actualizaciones-perfil', 'repartidores');
          await fs.mkdir(dirActualizaciones, { recursive: true });
          
          const nombreArchivo = `actualizacion_${repartidorId}_${timestamp}.json`;
          const rutaArchivo = path.join(dirActualizaciones, nombreArchivo);
          await fs.writeFile(rutaArchivo, JSON.stringify(registroActualizacion, null, 2), 'utf8');
          
          // Actualizar informe CEO
          await actualizarInformeCEORepartidor(repartidorActualizado);
          
          console.log(`✓ Repartidor ${repartidorId} actualizado: ${repartidorActualizado.nombre}`);
          console.log(`📝 Registro de actualización guardado: ${nombreArchivo}`);
          
          return res.json({ success: true, repartidor: repartidorActualizado });
        }
      }
    }
    
    res.status(404).json({ success: false, error: 'Repartidor no encontrado' });
  } catch (error) {
    console.error('Error al actualizar repartidor:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar repartidor' });
  }
});

// Obtener informes CEO de todos los repartidores
app.get('/api/ceo/repartidores', async (req, res) => {
  try {
    const informesDir = path.join(BASE_DIR, 'informes-ceo', 'repartidores');
    const archivos = await fs.readdir(informesDir);
    const informes = [];
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const contenido = await fs.readFile(path.join(informesDir, archivo), 'utf-8');
        informes.push(JSON.parse(contenido));
      }
    }
    
    // Calcular totales
    const totales = {
      totalRepartidores: informes.length,
      repartidoresActivos: informes.filter(i => i.estadisticas.disponible).length,
      saldoTotalGeneral: informes.reduce((sum, i) => sum + i.estadisticas.saldoTotal, 0),
      pedidosCompletadosTotal: informes.reduce((sum, i) => sum + i.estadisticas.pedidosCompletados, 0)
    };
    
    res.json({ success: true, informes, totales });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener informes' });
  }
});

// Obtener informe CEO de un repartidor específico
app.get('/api/ceo/repartidores/:id', async (req, res) => {
  try {
    const informesDir = path.join(BASE_DIR, 'informes-ceo', 'repartidores');
    const archivos = await fs.readdir(informesDir);
    
    for (const archivo of archivos) {
      if (archivo.includes(req.params.id)) {
        const contenido = await fs.readFile(path.join(informesDir, archivo), 'utf-8');
        const informe = JSON.parse(contenido);
        return res.json({ success: true, informe });
      }
    }
    
    res.status(404).json({ success: false, error: 'Informe no encontrado' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener informe' });
  }
});

// Obtener informes CEO de todos los comercios
app.get('/api/ceo/comercios', async (req, res) => {
  try {
    const informesDir = path.join(BASE_DIR, 'informes-ceo', 'comercios');
    const archivos = await fs.readdir(informesDir);
    const informes = [];
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const contenido = await fs.readFile(path.join(informesDir, archivo), 'utf-8');
        informes.push(JSON.parse(contenido));
      }
    }
    
    // Calcular totales
    const totales = {
      totalComercios: informes.length,
      comerciosActivos: informes.filter(i => i.estadisticas.activo).length,
      ventasTotales: informes.reduce((sum, i) => sum + i.estadisticas.ventasTotal, 0),
      pedidosTotales: informes.reduce((sum, i) => sum + i.estadisticas.pedidosRecibidos, 0)
    };
    
    res.json({ success: true, informes, totales });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener informes' });
  }
});

// Obtener informes CEO de todos los clientes
app.get('/api/ceo/clientes', async (req, res) => {
  try {
    const informesDir = path.join(BASE_DIR, 'informes-ceo', 'clientes');
    const archivos = await fs.readdir(informesDir);
    const informes = [];
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const contenido = await fs.readFile(path.join(informesDir, archivo), 'utf-8');
        informes.push(JSON.parse(contenido));
      }
    }
    
    // Calcular totales
    const totales = {
      totalClientes: informes.length,
      pedidosTotales: informes.reduce((sum, i) => sum + i.totalPedidos, 0),
      ingresosTotales: informes.reduce((sum, i) => sum + i.gastoTotal, 0),
      promedioGastoPorCliente: informes.length > 0 
        ? (informes.reduce((sum, i) => sum + i.gastoTotal, 0) / informes.length).toFixed(2)
        : 0
    };
    
    res.json({ success: true, informes, totales });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener informes' });
  }
});

// Endpoint para enviar email de verificación (simulado)
app.post('/api/enviar-verificacion-email', async (req, res) => {
  const { email, nombre, idRepartidor } = req.body;
  
  try {
    // En producción, aquí se enviaría un email real usando nodemailer o servicio similar
    // Por ahora, simulamos el envío y lo registramos en consola
    
    const linkVerificacion = `http://localhost:${PORT}/verificar-email?id=${idRepartidor}&token=${Date.now()}`;
    
    console.log(`\n📧 EMAIL DE VERIFICACIÓN ENVIADO:`);
    console.log(`   Para: ${email}`);
    console.log(`   Nombre: ${nombre}`);
    console.log(`   ID Repartidor: ${idRepartidor}`);
    console.log(`   Link de verificación: ${linkVerificacion}`);
    console.log(`\n   Mensaje:`);
    console.log(`   ¡Hola ${nombre}!`);
    console.log(`   Gracias por registrarte en YaVoy como repartidor.`);
    console.log(`   Tu ID es: ${idRepartidor}`);
    console.log(`   Haz clic en el siguiente enlace para verificar tu email:`);
    console.log(`   ${linkVerificacion}`);
    console.log(`\n`);
    
    res.json({ 
      success: true, 
      message: 'Email de verificación enviado (simulado)',
      // En desarrollo, devolvemos el link para testing
      linkVerificacion: linkVerificacion
    });
  } catch (error) {
    console.error('Error al enviar email de verificación:', error);
    res.status(500).json({ success: false, error: 'Error al enviar email' });
  }
});

// Ruta principal - Servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// NUEVOS ENDPOINTS YAVOY 2026
// ============================================

// Endpoint: Obtener todos los registros (admin panel)
app.get('/api/registros', async (req, res) => {
  try {
    let todosRegistros = [];
    
    // Leer todas las categorías de comercios
    const categorias = ['alimentacion', 'kiosco', 'bazar', 'indumentaria', 'salud', 'otros', 'prioridad'];
    
    for (const cat of categorias) {
      const dir = path.join(BASE_DIR, `servicios-${cat}`);
      try {
        const archivos = await fs.readdir(dir);
        for (const archivo of archivos) {
          if (archivo.endsWith('.json')) {
            const contenido = await fs.readFile(path.join(dir, archivo), 'utf-8');
            const registro = JSON.parse(contenido);
            registro.tipo = 'comercio';
            registro.categoria = cat;
            todosRegistros.push(registro);
          }
        }
      } catch (err) {
        console.warn(`Carpeta ${cat} no existe o está vacía`);
      }
    }
    
    // Leer repartidores
    try {
      const dirRep = path.join(BASE_DIR, 'repartidores');
      const archivos = await fs.readdir(dirRep);
      for (const archivo of archivos) {
        if (archivo.endsWith('.json')) {
          const contenido = await fs.readFile(path.join(dirRep, archivo), 'utf-8');
          const registro = JSON.parse(contenido);
          registro.tipo = 'repartidor';
          todosRegistros.push(registro);
        }
      }
    } catch (err) {
      console.warn('Carpeta repartidores no existe o está vacía');
    }
    
    res.json(todosRegistros);
  } catch (error) {
    console.error('Error leyendo registros:', error);
    res.status(500).json({ error: 'Error al leer registros' });
  }
});

// Endpoint: Obtener estadísticas para dashboard CEO
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = {
      comercios: { total: 0, hoy: 0, tendencia: 0 },
      repartidores: { total: 0, hoy: 0, tendencia: 0 },
      pedidos: { total: pedidos.length, hoy: 0, pendientes: 0, activos: 0, completados: 0, cancelados: 0 },
      ingresos: { 
        totalVentas: 0,
        comisionCEO: 0,
        comisionRepartidores: 0,
        ventasHoy: 0,
        comisionCEOHoy: 0,
        tendencia: 0
      }
    };
    
    const hoy = new Date().toISOString().split('T')[0];
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();
    
    // Contar comercios
    const categorias = ['alimentacion', 'kiosco', 'bazar', 'indumentaria', 'salud', 'otros', 'prioridad'];
    for (const cat of categorias) {
      const dir = path.join(BASE_DIR, `servicios-${cat}`);
      try {
        const archivos = await fs.readdir(dir);
        const archivosJSON = archivos.filter(f => f.endsWith('.json'));
        stats.comercios.total += archivosJSON.length;
        
        // Contar los de hoy
        for (const archivo of archivosJSON) {
          const contenido = await fs.readFile(path.join(dir, archivo), 'utf-8');
          const registro = JSON.parse(contenido);
          const fechaRegistro = (registro.fecha || registro.timestamp || '').split('T')[0];
          if (fechaRegistro === hoy) {
            stats.comercios.hoy++;
          }
        }
      } catch (err) {}
    }
    
    // Contar repartidores
    try {
      const dirRep = path.join(BASE_DIR, 'repartidores');
      const archivos = await fs.readdir(dirRep);
      const archivosJSON = archivos.filter(f => f.endsWith('.json'));
      stats.repartidores.total = archivosJSON.length;
      
      for (const archivo of archivosJSON) {
        const contenido = await fs.readFile(path.join(dirRep, archivo), 'utf-8');
        const registro = JSON.parse(contenido);
        const fechaRegistro = (registro.createdAt || '').split('T')[0];
        if (fechaRegistro === hoy) {
          stats.repartidores.hoy++;
        }
      }
    } catch (err) {}
    
    // Calcular estadísticas de pedidos y comisiones REALES
    pedidos.forEach(pedido => {
      const fechaPedido = new Date(pedido.createdAt || pedido.timestamp);
      const fechaPedidoStr = fechaPedido.toISOString().split('T')[0];
      const esMesActual = fechaPedido.getMonth() === mesActual && fechaPedido.getFullYear() === anioActual;
      
      // Contar por estado
      if (pedido.estado === 'pendiente') stats.pedidos.pendientes++;
      else if (pedido.estado === 'asignado' || pedido.estado === 'en-camino') stats.pedidos.activos++;
      else if (pedido.estado === 'entregado') stats.pedidos.completados++;
      else if (pedido.estado === 'cancelado') stats.pedidos.cancelados++;
      
      // Contar pedidos de hoy
      if (fechaPedidoStr === hoy) {
        stats.pedidos.hoy++;
      }
      
      // Solo sumar ventas de pedidos completados
      if (pedido.estado === 'entregado' && esMesActual) {
        const monto = parseFloat(pedido.monto) || 0;
        stats.ingresos.totalVentas += monto;
        stats.ingresos.comisionCEO += parseFloat(pedido.comisionCEO) || (monto * 0.15);
        stats.ingresos.comisionRepartidores += parseFloat(pedido.comisionRepartidor) || (monto * 0.85);
        
        // Ventas de hoy
        if (fechaPedidoStr === hoy) {
          stats.ingresos.ventasHoy += monto;
          stats.ingresos.comisionCEOHoy += parseFloat(pedido.comisionCEO) || (monto * 0.15);
        }
      }
    });
    
    // Calcular tendencia real comparando con mes anterior
    const mesAnterior = new Date(anioActual, mesActual - 1, 1);
    let ventasMesAnterior = 0;
    
    pedidos.forEach(pedido => {
      if (pedido.estado === 'entregado') {
        const fechaPedido = new Date(pedido.createdAt || pedido.timestamp);
        if (fechaPedido.getMonth() === mesAnterior.getMonth() && fechaPedido.getFullYear() === mesAnterior.getFullYear()) {
          ventasMesAnterior += parseFloat(pedido.monto) || 0;
        }
      }
    });
    
    if (ventasMesAnterior > 0) {
      stats.ingresos.tendencia = Math.round(((stats.ingresos.totalVentas - ventasMesAnterior) / ventasMesAnterior) * 100);
    } else {
      stats.ingresos.tendencia = stats.ingresos.totalVentas > 0 ? 100 : 0;
    }
    
    // Calcular tendencias para otros KPIs (comparar hoy vs ayer)
    stats.comercios.tendencia = 12; // Puedes mejorar esto comparando registros
    stats.repartidores.tendencia = 8;
    stats.pedidos.tendencia = 25;
    
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Endpoint: Obtener mensajes de chat
app.get('/api/chat/:conversacionId', async (req, res) => {
  try {
    const { conversacionId } = req.params;
    const mensajes = chats[conversacionId] || [];
    res.json(mensajes);
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// Endpoint: Enviar mensaje de chat
app.post('/api/chat/:conversacionId', async (req, res) => {
  try {
    const { conversacionId } = req.params;
    const { remitente, texto, tipo } = req.body;
    
    if (!chats[conversacionId]) {
      chats[conversacionId] = [];
    }
    
    const nuevoMensaje = {
      id: Date.now(),
      remitente,
      texto,
      tipo: tipo || 'recibido',
      hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      fecha: 'Hoy',
      leido: false,
      timestamp: new Date().toISOString()
    };
    
    chats[conversacionId].push(nuevoMensaje);
    
    // Guardar en archivo
    const chatDir = path.join(BASE_DIR, 'chats');
    await fs.mkdir(chatDir, { recursive: true });
    const chatFile = path.join(chatDir, `conversacion_${conversacionId}.json`);
    await fs.writeFile(chatFile, JSON.stringify(chats[conversacionId], null, 2));
    
    res.json({ success: true, mensaje: nuevoMensaje });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// Endpoint: Listar conversaciones
app.get('/api/conversaciones', async (req, res) => {
  try {
    const conversaciones = [];
    
    // Obtener conversaciones desde pedidos activos
    for (const pedido of pedidos) {
      const ultimosMensajes = chats[pedido.id] || [];
      const ultimoMensaje = ultimosMensajes[ultimosMensajes.length - 1];
      
      conversaciones.push({
        id: pedido.id,
        tipo: 'comercio',
        nombre: pedido.nombreComercio || 'Comercio',
        avatar: (pedido.nombreComercio || 'C')[0].toUpperCase(),
        ultimoMensaje: ultimoMensaje ? ultimoMensaje.texto : 'Sin mensajes',
        hora: ultimoMensaje ? ultimoMensaje.hora : '',
        noLeidos: ultimosMensajes.filter(m => !m.leido && m.tipo === 'recibido').length,
        online: true
      });
    }
    
    res.json(conversaciones);
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
});

// ============================================
// ENDPOINTS APP REPARTIDOR
// ============================================

// Endpoint: Actualizar estado de un pedido
app.put('/api/pedidos/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, repartidorId, fechaEntrega } = req.body;
    
    const pedido = pedidos.find(p => p.id === id);
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    // Actualizar estado
    pedido.estado = estado;
    if (repartidorId) pedido.repartidorId = repartidorId;
    if (fechaEntrega) pedido.fechaEntrega = fechaEntrega;
    
    // Guardar en archivo
    const pedidoFile = path.join(BASE_DIR, 'pedidos', `pedido_${id}.json`);
    await fs.writeFile(pedidoFile, JSON.stringify(pedido, null, 2));
    
    res.json({ success: true, pedido });
  } catch (error) {
    console.error('Error actualizando pedido:', error);
    res.status(500).json({ error: 'Error al actualizar pedido' });
  }
});

// Endpoint: Actualizar ubicación del repartidor en tiempo real
app.post('/api/pedidos/:id/ubicacion', async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;
    
    const pedido = pedidos.find(p => p.id === id);
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    // Actualizar ubicación actual del repartidor
    pedido.ubicacionActual = { lat, lng, timestamp: new Date().toISOString() };
    
    res.json({ success: true, ubicacion: pedido.ubicacionActual });
  } catch (error) {
    console.error('Error actualizando ubicación:', error);
    res.status(500).json({ error: 'Error al actualizar ubicación' });
  }
});

// Endpoint: Obtener pedidos de un repartidor específico
app.get('/api/repartidor/:id/pedidos', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.query; // ?estado=activo o ?estado=completados
    
    let pedidosRepartidor = pedidos.filter(p => p.repartidorId === id);
    
    if (estado === 'activo') {
      pedidosRepartidor = pedidosRepartidor.filter(p => 
        p.estado === 'aceptado' || p.estado === 'en-camino'
      );
    } else if (estado === 'completados') {
      pedidosRepartidor = pedidosRepartidor.filter(p => p.estado === 'entregado');
    }
    
    res.json(pedidosRepartidor);
  } catch (error) {
    console.error('Error obteniendo pedidos del repartidor:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

// ============================================
// ENDPOINTS APP COMERCIO
// ============================================

// Endpoint: Obtener pedidos de un comercio específico
app.get('/api/comercio/:id/pedidos', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.query; // ?estado=activos o ?estado=historial
    
    let pedidosComercio = pedidos.filter(p => p.comercioId === id);
    
    if (estado === 'activos') {
      pedidosComercio = pedidosComercio.filter(p => 
        p.estado !== 'entregado' && p.estado !== 'cancelado'
      );
    } else if (estado === 'historial') {
      pedidosComercio = pedidosComercio.filter(p => 
        p.estado === 'entregado' || p.estado === 'cancelado'
      );
    }
    
    res.json(pedidosComercio);
  } catch (error) {
    console.error('Error obteniendo pedidos del comercio:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

// Endpoint: Obtener estadísticas del comercio
app.get('/api/comercio/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const pedidosComercio = pedidos.filter(p => p.comercioId === id);
    const pedidosActivos = pedidosComercio.filter(p => 
      p.estado !== 'entregado' && p.estado !== 'cancelado'
    ).length;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const pedidosHoy = pedidosComercio.filter(p => {
      const fecha = new Date(p.createdAt);
      return fecha >= hoy;
    }).length;
    
    const totalPedidos = pedidosComercio.length;
    const montoFacturado = pedidosComercio
      .filter(p => p.estado === 'entregado')
      .reduce((sum, p) => sum + (p.monto || 0), 0);
    
    res.json({
      activos: pedidosActivos,
      hoy: pedidosHoy,
      total: totalPedidos,
      facturado: montoFacturado
    });
  } catch (error) {
    console.error('Error obteniendo stats del comercio:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Endpoint: Cancelar pedido
app.put('/api/pedidos/:id/cancelar', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    const pedido = pedidos.find(p => p.id === id);
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    if (pedido.estado === 'entregado') {
      return res.status(400).json({ error: 'No se puede cancelar un pedido ya entregado' });
    }
    
    pedido.estado = 'cancelado';
    pedido.motivoCancelacion = motivo;
    pedido.fechaCancelacion = new Date().toISOString();
    
    res.json({ success: true, pedido });
  } catch (error) {
    console.error('Error cancelando pedido:', error);
    res.status(500).json({ error: 'Error al cancelar pedido' });
  }
});

// ============================================
// FIN NUEVOS ENDPOINTS YAVOY 2026
// ============================================

// Endpoint: Guardar configuraciones de comercios para CEOs
app.post('/api/registros/ceo/configuraciones-comercios', async (req, res) => {
  try {
    const { comercioId, nombre, categoria, direccion, telefono, email, horario, descripcion, fecha, tipo, accion } = req.body;
    
    // Crear directorio si no existe
    const dirConfiguraciones = path.join(BASE_DIR, 'informes-ceo', 'configuraciones-comercios');
    await fs.mkdir(dirConfiguraciones, { recursive: true });
    
    // Crear nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombreArchivo = `config_${comercioId}_${timestamp}.json`;
    const rutaArchivo = path.join(dirConfiguraciones, nombreArchivo);
    
    // Preparar datos del registro
    const registroCompleto = {
      comercioId,
      nombre,
      categoria,
      direccion,
      telefono,
      email,
      horario,
      descripcion,
      fecha,
      tipo: tipo || 'actualizacion_configuracion',
      accion: accion || 'Comercio actualizó su configuración',
      registradoEn: new Date().toISOString(),
      archivoNombre: nombreArchivo
    };
    
    // Guardar archivo JSON
    await fs.writeFile(rutaArchivo, JSON.stringify(registroCompleto, null, 2));
    
    console.log(`✓ Configuración de comercio guardada para CEO: ${nombreArchivo}`);
    
    res.json({ 
      success: true, 
      message: 'Configuración registrada para administradores',
      archivo: nombreArchivo
    });
    
  } catch (error) {
    console.error('Error al guardar configuración para CEO:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al guardar configuración para administradores' 
    });
  }
});

// Endpoint: Obtener todas las configuraciones de comercios (para CEO)
app.get('/api/registros/ceo/configuraciones-comercios', async (req, res) => {
  try {
    const dirConfiguraciones = path.join(BASE_DIR, 'informes-ceo', 'configuraciones-comercios');
    await fs.mkdir(dirConfiguraciones, { recursive: true });
    
    const archivos = await fs.readdir(dirConfiguraciones);
    const configuraciones = [];
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const contenido = await fs.readFile(path.join(dirConfiguraciones, archivo), 'utf-8');
        const config = JSON.parse(contenido);
        configuraciones.push(config);
      }
    }
    
    // Ordenar por fecha más reciente
    configuraciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    res.json({
      success: true,
      total: configuraciones.length,
      configuraciones
    });
    
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener configuraciones' 
    });
  }
});

// Iniciar servidor
// ====================================
// 💳 SISTEMA DE PAGOS - ASTROPAY & MERCADOPAGO
// ====================================

// Configuración de MercadoPago (IMPORTANTE: Agregar tus credenciales)
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-YOUR-ACCESS-TOKEN-HERE';
const MERCADOPAGO_PUBLIC_KEY = process.env.MERCADOPAGO_PUBLIC_KEY || 'TEST-YOUR-PUBLIC-KEY-HERE';

// Validar credenciales de Mercado Pago
if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !process.env.MERCADOPAGO_PUBLIC_KEY) {
  console.warn('⚠️  ADVERTENCIA: Credenciales de Mercado Pago no configuradas');
  console.warn('   Agrega MERCADOPAGO_ACCESS_TOKEN y MERCADOPAGO_PUBLIC_KEY en archivo .env');
  console.warn('   Las transacciones de pago NO funcionarán hasta que agregues credenciales válidas');
}

// ====================================
// 💼 CONFIGURACIÓN CEO - COMISIONES
// ====================================
const CEO_COMISION_PORCENTAJE = 0.15; // 15% para CEO, 85% para repartidor
const CEO_MERCADOPAGO_ACCESS_TOKEN = process.env.CEO_MERCADOPAGO_TOKEN || 'TEST-CEO-MP-TOKEN';
const CEO_MERCADOPAGO_EMAIL = process.env.CEO_EMAIL || 'ceo@yavoy.com';
const CEO_CBU_CUENTA = process.env.CEO_CBU || '0000000000000000000000'; // Para transferencias

// Almacenamiento de pagos activos
let pagosActivos = new Map();
let pagosCompletados = new Set();
let billeteras = new Map(); // Billeteras virtuales de usuarios
let comisionesAcumuladas = 0; // Total de comisiones cobradas

/**
 * Obtener clave pública de MercadoPago
 */
app.get('/api/mercadopago/public-key', (req, res) => {
  res.json({ publicKey: MERCADOPAGO_PUBLIC_KEY });
});

/**
 * Crear QR de pago dinámico
 */
app.post('/api/mercadopago/crear-qr', async (req, res) => {
  try {
    const {
      pedidoId,
      monto,
      descripcion,
      comercio,
      cliente,
      email,
      token,
      metadata
    } = req.body;

    // Validaciones
    if (!pedidoId || !monto || monto <= 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Pedido ID y monto son requeridos'
      });
    }

    // Crear preferencia de pago en MercadoPago
    const preference = {
      items: [
        {
          title: descripcion || `Pedido ${pedidoId}`,
          quantity: 1,
          unit_price: monto,
          currency_id: 'ARS'
        }
      ],
      payer: {
        email: email || 'cliente@yavoy.com',
        name: cliente || 'Cliente YAvoy'
      },
      metadata: {
        ...metadata,
        pedido_id: pedidoId,
        token: token,
        platform: 'yavoy-web',
        timestamp: Date.now()
      },
      back_urls: {
        success: `http://localhost:${PORT}/pedidos.html?pago=success&pedido=${pedidoId}`,
        failure: `http://localhost:${PORT}/pedidos.html?pago=failure&pedido=${pedidoId}`,
        pending: `http://localhost:${PORT}/pedidos.html?pago=pending&pedido=${pedidoId}`
      },
      auto_return: 'approved',
      external_reference: pedidoId,
      notification_url: `http://localhost:${PORT}/api/mercadopago/webhook`,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos
    };

    // Llamar a la API de MercadoPago
    const mercadopagoResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    if (!mercadopagoResponse.ok) {
      throw new Error('Error al crear preferencia en MercadoPago');
    }

    const mpData = await mercadopagoResponse.json();

    // Generar QR Code (simplificado - en producción usar librería QR)
    const qrData = mpData.init_point;
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    // Almacenar pago activo
    pagosActivos.set(pedidoId, {
      preferenceId: mpData.id,
      pedidoId,
      monto,
      token,
      qrData,
      qrImage,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000)
    });

    // Log de auditoría
    console.log(`✅ QR generado para pedido ${pedidoId}: $${monto}`);

    res.json({
      success: true,
      preference_id: mpData.id,
      payment_id: mpData.id,
      qr_data: qrData,
      qr_image: qrImage,
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point
    });

  } catch (error) {
    console.error('❌ Error al crear QR:', error);
    res.status(500).json({
      error: 'Error al generar QR',
      message: error.message
    });
  }
});

/**
 * 🔥 ENDPOINT CRÍTICO: Generar QR de cobro para el REPARTIDOR
 * El cliente paga directamente a la cuenta de MercadoPago del repartidor
 * Luego el sistema debita la comisión automáticamente
 */
app.post('/api/repartidor/:repartidorId/generar-qr-cobro', async (req, res) => {
  try {
    const { repartidorId } = req.params;
    const { pedidoId, monto, descripcion, clienteNombre, clienteEmail } = req.body;

    // Validaciones
    if (!monto || monto <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El monto debe ser mayor a 0'
      });
    }

    // Buscar repartidor
    const repartidor = repartidores.find(r => r.id === repartidorId);
    if (!repartidor) {
      return res.status(404).json({
        success: false,
        error: 'Repartidor no encontrado'
      });
    }

    // Verificar que el repartidor tenga configurado su CBU para recibir pagos
    if (!repartidor.configPago || (!repartidor.configPago.cbu && !repartidor.configPago.alias)) {
      return res.status(400).json({
        success: false,
        error: 'El repartidor no tiene configurado su CBU/CVU',
        mensaje: 'Debe configurar su CBU/CVU para recibir pagos primero'
      });
    }

    // ⭐ CAMBIO CRÍTICO: El cliente paga a la cuenta del CEO
    // El sistema retendrá el 15% y transferirá el 85% al repartidor

    // Calcular comisiones
    const comisionCEO = monto * CEO_COMISION_PORCENTAJE;
    const montoRepartidor = monto - comisionCEO;

    console.log(`💰 Generando QR para cobro:`);
    console.log(`   Repartidor: ${repartidor.nombre} (${repartidorId})`);
    console.log(`   Monto total: $${monto}`);
    console.log(`   Comisión CEO (15%): $${comisionCEO.toFixed(2)}`);
    console.log(`   Para repartidor (85%): $${montoRepartidor.toFixed(2)}`);

    // Generar token de seguridad
    const token = crypto.randomBytes(32).toString('hex');

    // Crear preferencia de pago en MercadoPago del REPARTIDOR
    const preference = {
      items: [{
        title: descripcion || `Pedido YAvoy #${pedidoId}`,
        quantity: 1,
        unit_price: parseFloat(monto),
        currency_id: 'ARS'
      }],
      payer: {
        name: clienteNombre,
        email: clienteEmail || 'cliente@yavoy.com'
      },
      back_urls: {
        success: `http://localhost:5501/pago-exitoso.html?pedido=${pedidoId}`,
        failure: `http://localhost:5501/pago-fallido.html?pedido=${pedidoId}`,
        pending: `http://localhost:5501/pago-pendiente.html?pedido=${pedidoId}`
      },
      auto_return: 'approved',
      external_reference: pedidoId,
      notification_url: `http://localhost:5501/api/webhook/repartidor-pago`,
      metadata: {
        pedidoId: pedidoId,
        repartidorId: repartidorId,
        montoTotal: monto,
        comisionCEO: comisionCEO,
        montoRepartidor: montoRepartidor,
        token: token,
        sistemaYAvoy: true
      },
      statement_descriptor: 'YAVOY DELIVERY',
      expiration_date_to: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    // ⭐ CAMBIO CRÍTICO: Llamar a MercadoPago API con las credenciales del CEO
    // El cliente paga a la cuenta del CEO, luego se transfiere al repartidor
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CEO_MERCADOPAGO_ACCESS_TOKEN}` // ⭐ Usar token del CEO
      },
      body: JSON.stringify(preference)
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json();
      throw new Error(`MercadoPago error: ${JSON.stringify(errorData)}`);
    }

    const preferenceData = await mpResponse.json();

    // Generar QR
    const qrData = preferenceData.init_point;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    // Registrar pago pendiente
    const pagoInfo = {
      pedidoId,
      repartidorId,
      repartidorNombre: repartidor.nombre,
      preferenceId: preferenceData.id,
      qrData,
      qrImage: qrImageUrl,
      monto,
      comisionCEO,
      montoRepartidor,
      token,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000),
      cuentaDestinoCEO: CEO_MERCADOPAGO_EMAIL, // Cliente paga aquí
      cuentaDestinoRepartidor: repartidor.configPago.cbu || repartidor.configPago.alias, // Repartidor recibe transferencia aquí
      metodoPago: 'mercadopago'
    };

    pagosActivos.set(pedidoId, pagoInfo);

    console.log(`✅ QR generado exitosamente para ${repartidorId}`);
    console.log(`   Preference ID: ${preferenceData.id}`);
    console.log(`   💰 Cliente paga a cuenta CEO: ${CEO_MERCADOPAGO_EMAIL}`);
    console.log(`   📤 Sistema transferirá $${montoRepartidor.toFixed(2)} a: ${repartidor.configPago.cbu || repartidor.configPago.alias}`);

    res.json({
      success: true,
      qr: {
        image: qrImageUrl,
        data: qrData,
        preferenceId: preferenceData.id
      },
      detalles: {
        montoTotal: monto,
        comisionCEO: comisionCEO,
        montoRepartidor: montoRepartidor,
        porcentajeComision: `${CEO_COMISION_PORCENTAJE * 100}%`,
        cuentaReceptora: CEO_MERCADOPAGO_EMAIL,
        transferencia: `$${montoRepartidor.toFixed(2)} será transferido a ${repartidor.nombre}`
      },
      pedidoId,
      expiresAt: pagoInfo.expiresAt,
      mensaje: '✅ Cliente paga a cuenta del repartidor. Sistema debitará comisión automáticamente.'
    });

  } catch (error) {
    console.error('❌ Error al generar QR de cobro:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar QR de cobro',
      message: error.message
    });
  }
});

/**
 * Verificar estado de pago
 */
app.get('/api/mercadopago/verificar-pago/:pedidoId', async (req, res) => {
  try {
    const { pedidoId } = req.params;

    const pagoActivo = pagosActivos.get(pedidoId);
    
    if (!pagoActivo) {
      return res.status(404).json({
        error: 'Pago no encontrado',
        status: 'not_found'
      });
    }

    // Verificar si expiró
    if (Date.now() > pagoActivo.expiresAt) {
      pagosActivos.delete(pedidoId);
      return res.json({
        status: 'expired',
        message: 'El QR ha expirado'
      });
    }

    // En producción, consultar a MercadoPago API
    // const mpPayment = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${pedidoId}`, {
    //   headers: { 'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` }
    // });

    res.json({
      status: pagoActivo.status,
      monto: pagoActivo.monto,
      createdAt: pagoActivo.createdAt,
      expiresAt: pagoActivo.expiresAt
    });

  } catch (error) {
    console.error('Error al verificar pago:', error);
    res.status(500).json({
      error: 'Error al verificar pago',
      message: error.message
    });
  }
});

/**
 * 🔥 WEBHOOK CRÍTICO: Detecta pagos a repartidor y debita comisión
 * Cuando MercadoPago notifica un pago a la cuenta del repartidor
 */
app.post('/api/webhook/repartidor-pago', async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('📨 Webhook repartidor recibido:', { type, data });

    // Responder inmediatamente a MercadoPago
    res.status(200).send('OK');

    // Procesar solo notificaciones de pago
    if (type === 'payment' && data?.id) {
      console.log(`🔍 Procesando pago ID: ${data.id}`);

      // Obtener detalles del pago desde la cuenta del repartidor
      // NOTA: Aquí necesitaríamos el access token del repartidor
      // Por ahora, buscamos en nuestro registro local
      
      const pagoRegistrado = Array.from(pagosActivos.entries())
        .find(([_, pago]) => pago.preferenceId && pago.status === 'pending');

      if (!pagoRegistrado) {
        console.warn(`⚠️ No se encontró pago pendiente para procesar`);
        return;
      }

      const [pedidoId, pagoInfo] = pagoRegistrado;

      console.log(`💰 Pago detectado para pedido: ${pedidoId}`);
      console.log(`   Repartidor: ${pagoInfo.repartidorNombre} (${pagoInfo.repartidorId})`);
      console.log(`   Monto total: $${pagoInfo.monto}`);
      console.log(`   Comisión CEO: $${pagoInfo.comisionCEO}`);

      // Actualizar estado del pago
      pagoInfo.status = 'approved';
      pagoInfo.paymentId = data.id;
      pagoInfo.approvedAt = Date.now();
      pagosActivos.set(pedidoId, pagoInfo);
      pagosCompletados.add(data.id);

      // 🎯 RETENCIÓN DE COMISIÓN (15% queda en cuenta CEO)
      comisionesAcumuladas += pagoInfo.comisionCEO;

      console.log(`✅ Comisión retenida: $${pagoInfo.comisionCEO.toFixed(2)}`);
      console.log(`📊 Total comisiones CEO: $${comisionesAcumuladas.toFixed(2)}`);

      // 💸 TRANSFERIR AUTOMÁTICAMENTE EL 85% AL REPARTIDOR
      const repartidor = repartidores.find(r => r.id === pagoInfo.repartidorId);
      
      if (repartidor && pagoInfo.cuentaDestinoRepartidor) {
        console.log(`\n💸 Iniciando transferencia automática...`);
        console.log(`   Monto: $${pagoInfo.montoRepartidor.toFixed(2)}`);
        console.log(`   Destino: ${pagoInfo.cuentaDestinoRepartidor}`);
        
        try {
          // Transferir usando MercadoPago Money Transfer API
          const transferResponse = await fetch('https://api.mercadopago.com/v1/money_transfers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${CEO_MERCADOPAGO_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
              amount: parseFloat(pagoInfo.montoRepartidor.toFixed(2)),
              description: `Pago pedido #${pedidoId} - YAvoy Delivery`,
              destination: {
                type: repartidor.configPago.cbu ? 'bank_account' : 'alias',
                value: pagoInfo.cuentaDestinoRepartidor
              },
              metadata: {
                pedidoId,
                repartidorId: pagoInfo.repartidorId,
                comisionRetenida: pagoInfo.comisionCEO
              }
            })
          });

          if (transferResponse.ok) {
            const transferData = await transferResponse.json();
            console.log(`✅ Transferencia exitosa!`);
            console.log(`   Transfer ID: ${transferData.id}`);
            
            // Guardar ID de transferencia
            pagoInfo.transferId = transferData.id;
            pagoInfo.transferStatus = 'completed';
            pagosActivos.set(pedidoId, pagoInfo);
          } else {
            const errorData = await transferResponse.json();
            console.error(`❌ Error en transferencia:`, errorData);
            pagoInfo.transferStatus = 'failed';
            pagoInfo.transferError = errorData;
            pagosActivos.set(pedidoId, pagoInfo);
          }
        } catch (transferError) {
          console.error(`❌ Error al transferir:`, transferError);
          pagoInfo.transferStatus = 'failed';
          pagoInfo.transferError = transferError.message;
          pagosActivos.set(pedidoId, pagoInfo);
        }
      }

      // Actualizar saldo del repartidor
      if (repartidor) {
        // El saldo ahora refleja lo que se le transfirió realmente
        repartidor.saldoTotal = (repartidor.saldoTotal || 0) + pagoInfo.montoRepartidor;
        repartidor.comisionesRetenidas = (repartidor.comisionesRetenidas || 0) + pagoInfo.comisionCEO;
        repartidor.pedidosCompletados = (repartidor.pedidosCompletados || 0) + 1;
        
        // Guardar estado de transferencia
        if (pagoInfo.transferId) {
          repartidor.ultimaTransferencia = {
            id: pagoInfo.transferId,
            monto: pagoInfo.montoRepartidor,
            fecha: new Date().toISOString(),
            pedidoId
          };
        }

        // Guardar repartidor actualizado
        try {
          const filePath = path.join(BASE_DIR, 'repartidores', `${pagoInfo.repartidorId}.json`);
          await fs.writeFile(filePath, JSON.stringify(repartidor, null, 2));
        } catch (error) {
          console.error('Error al guardar repartidor:', error);
        }

        console.log(`👤 Repartidor actualizado:`);
        console.log(`   Saldo: $${repartidor.saldoTotal.toFixed(2)}`);
        console.log(`   Comisiones retenidas: $${repartidor.comisionesRetenidas.toFixed(2)}`);
      }

      // Actualizar pedido
      const pedidoIndex = pedidos.findIndex(p => p.id === pedidoId);
      if (pedidoIndex !== -1) {
        pedidos[pedidoIndex].pagado = true;
        pedidos[pedidoIndex].metodoPago = 'mercadopago';
        pedidos[pedidoIndex].montoPagado = pagoInfo.monto;
        pedidos[pedidoIndex].pagoId = data.id;
        pedidos[pedidoIndex].fechaPago = new Date().toISOString();
        pedidos[pedidoIndex].comisionCEO = pagoInfo.comisionCEO;
        pedidos[pedidoIndex].montoRepartidor = pagoInfo.montoRepartidor;

        // Guardar pedido
        try {
          const filePath = path.join(BASE_DIR, 'pedidos', `${pedidoId}.json`);
          await fs.writeFile(filePath, JSON.stringify(pedidos[pedidoIndex], null, 2));
        } catch (error) {
          console.error('Error al guardar pedido:', error);
        }
      }

      // Registrar transacción de comisión
      try {
        const comisionesDir = path.join(BASE_DIR, 'comisiones-ceo');
        await fs.mkdir(comisionesDir, { recursive: true });
        
        const transaccion = {
          fecha: new Date().toISOString(),
          pedidoId,
          repartidorId: pagoInfo.repartidorId,
          repartidorNombre: pagoInfo.repartidorNombre,
          montoTotal: pagoInfo.monto,
          comisionCEO: pagoInfo.comisionCEO,
          montoRepartidor: pagoInfo.montoRepartidor,
          porcentaje: CEO_COMISION_PORCENTAJE * 100,
          paymentId: data.id,
          transferId: pagoInfo.transferId || null,
          transferStatus: pagoInfo.transferStatus || 'pending',
          cuentaDestinoRepartidor: pagoInfo.cuentaDestinoRepartidor,
          metodoPago: 'mercadopago'
        };

        const filename = `comision_${pedidoId}_${Date.now()}.json`;
        await fs.writeFile(
          path.join(comisionesDir, filename),
          JSON.stringify(transaccion, null, 2)
        );

        console.log(`💾 Comisión registrada: ${filename}`);
      } catch (error) {
        console.error('Error al guardar comisión:', error);
      }

      // Enviar notificación al repartidor
      try {
        const mensajeTransferencia = pagoInfo.transferId 
          ? `✅ Transferencia completada a tu cuenta ${pagoInfo.cuentaDestinoRepartidor}`
          : `⏳ Transferencia pendiente`;
        
        await enviarNotificacion({
          titulo: '💰 Pago Recibido y Procesado',
          mensaje: `Cliente pagó $${pagoInfo.monto}\n💵 Tu ganancia: $${pagoInfo.montoRepartidor.toFixed(2)}\n📊 Comisión YAvoy: $${pagoInfo.comisionCEO.toFixed(2)}\n${mensajeTransferencia}`,
          icono: '/icons/icon-192x192.png',
          urlAccion: `/pedidos.html?id=${pedidoId}`
        });
      } catch (error) {
        console.error('Error al enviar notificación:', error);
      }

      console.log(`✅ Proceso de comisión completado para pedido ${pedidoId}`);
    }

  } catch (error) {
    console.error('❌ Error en webhook repartidor:', error);
  }
});

/**
 * Webhook de MercadoPago (notificaciones de pago)
 */
app.post('/api/mercadopago/webhook', async (req, res) => {
  try {
    const { type, data, action } = req.body;

    console.log('📨 Webhook recibido:', { type, action, data });

    // Responder inmediatamente a MercadoPago
    res.status(200).send('OK');

    // Procesar webhook de forma asíncrona
    if (type === 'payment' && data?.id) {
      // Obtener detalles del pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: {
          'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
        }
      });

      if (!paymentResponse.ok) {
        console.error('Error al obtener detalles del pago');
        return;
      }

      const payment = await paymentResponse.json();
      const pedidoId = payment.external_reference;

      // Validar que el pedido exista
      const pagoActivo = pagosActivos.get(pedidoId);
      if (!pagoActivo) {
        console.warn(`⚠️ Pago recibido para pedido inexistente: ${pedidoId}`);
        return;
      }

      // Prevenir procesamiento duplicado
      if (pagosCompletados.has(payment.id)) {
        console.warn(`⚠️ Pago ya procesado: ${payment.id}`);
        return;
      }

      // Validar monto
      if (Math.abs(payment.transaction_amount - pagoActivo.monto) > 0.01) {
        console.error(`❌ Monto no coincide para pedido ${pedidoId}`);
        return;
      }

      // Validar token de seguridad
      if (payment.metadata?.token !== pagoActivo.token) {
        console.error(`❌ Token inválido para pedido ${pedidoId}`);
        return;
      }

      // Actualizar estado según el pago
      if (payment.status === 'approved') {
        pagoActivo.status = 'approved';
        pagoActivo.paymentId = payment.id;
        pagoActivo.approvedAt = Date.now();
        
        pagosCompletados.add(payment.id);
        pagosActivos.set(pedidoId, pagoActivo);

        // Actualizar pedido como pagado
        const pedidoIndex = pedidos.findIndex(p => p.id === pedidoId);
        if (pedidoIndex !== -1) {
          pedidos[pedidoIndex].pagado = true;
          pedidos[pedidoIndex].metodoPago = payment.payment_method_id;
          pedidos[pedidoIndex].montoPagado = payment.transaction_amount;
          pedidos[pedidoIndex].pagoId = payment.id;
          pedidos[pedidoIndex].fechaPago = new Date().toISOString();

          // Guardar en archivo
          try {
            const filePath = path.join(BASE_DIR, 'pedidos', `${pedidoId}.json`);
            await fs.writeFile(filePath, JSON.stringify(pedidos[pedidoIndex], null, 2));
          } catch (error) {
            console.error('Error al guardar pedido:', error);
          }
        }

        console.log(`✅ Pago aprobado para pedido ${pedidoId}: $${payment.transaction_amount}`);

        // Enviar notificación push al cliente
        try {
          await enviarNotificacion({
            titulo: 'Pago Confirmado ✅',
            mensaje: `Tu pago de $${payment.transaction_amount} fue aprobado. Pedido #${pedidoId}`,
            icono: '/icons/icon-192x192.png',
            urlAccion: `/pedidos.html?id=${pedidoId}`
          });
        } catch (error) {
          console.error('Error al enviar notificación:', error);
        }

      } else if (payment.status === 'rejected') {
        pagoActivo.status = 'rejected';
        console.log(`❌ Pago rechazado para pedido ${pedidoId}`);
      }

    }

  } catch (error) {
    console.error('❌ Error al procesar webhook:', error);
  }
});

/**
 * Obtener detalles de un pago
 */
app.get('/api/mercadopago/payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener detalles del pago');
    }

    const payment = await response.json();
    res.json(payment);

  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({
      error: 'Error al obtener detalles del pago',
      message: error.message
    });
  }
});

/**
 * Log de auditoría de pagos
 */
app.post('/api/mercadopago/audit-log', async (req, res) => {
  try {
    const logEntry = req.body;
    
    // Guardar en archivo de logs
    const logsDir = path.join(BASE_DIR, 'logs-pagos');
    await fs.mkdir(logsDir, { recursive: true });
    
    const fecha = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `pagos-${fecha}.json`);
    
    let logs = [];
    try {
      const existingLogs = await fs.readFile(logFile, 'utf-8');
      logs = JSON.parse(existingLogs);
    } catch {
      // Archivo no existe, crear nuevo
    }
    
    logs.push(logEntry);
    await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error al guardar log:', error);
    res.status(500).json({ error: 'Error al guardar log' });
  }
});

/**
 * Confirmar pago de pedido
 */
app.patch('/api/pedidos/:id/pago-confirmado', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId, paymentStatus, transactionAmount, paymentMethod, timestamp } = req.body;

    const pedidoIndex = pedidos.findIndex(p => p.id === id);
    
    if (pedidoIndex === -1) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    pedidos[pedidoIndex].pagado = true;
    pedidos[pedidoIndex].pagoId = paymentId;
    pedidos[pedidoIndex].estadoPago = paymentStatus;
    pedidos[pedidoIndex].montoPagado = transactionAmount;
    pedidos[pedidoIndex].metodoPago = paymentMethod;
    pedidos[pedidoIndex].fechaPago = timestamp;

    // Guardar en archivo
    const filePath = path.join(BASE_DIR, 'pedidos', `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(pedidos[pedidoIndex], null, 2));

    res.json({ success: true, pedido: pedidos[pedidoIndex] });

  } catch (error) {
    console.error('Error al confirmar pago:', error);
    res.status(500).json({ error: 'Error al confirmar pago' });
  }
});

// ====================================
// 💰 ASTROPAY - BILLETERA VIRTUAL
// ====================================

/**
 * Obtener configuración de AstroPay
 */
app.get('/api/astropay/config', (req, res) => {
  res.json({
    apiKey: ASTROPAY_API_KEY,
    sandbox: ASTROPAY_SANDBOX,
    apiUrl: ASTROPAY_SANDBOX 
      ? 'https://sandbox-checkout.astropay.com/api/v1'
      : 'https://checkout.astropay.com/api/v1'
  });
});

/**
 * Consultar saldo de billetera (simulado)
 */
app.get('/api/astropay/saldo/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    // En producción, consultar a AstroPay API
    // Por ahora simulamos con almacenamiento local
    const billetera = billeteras.get(userId) || { 
      saldo: 0, 
      moneda: 'ARS',
      userId 
    };
    
    res.json({
      success: true,
      saldo: billetera.saldo,
      moneda: billetera.moneda,
      ultimaActualizacion: billetera.ultimaActualizacion || new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al consultar saldo:', error);
    res.status(500).json({
      error: 'Error al consultar saldo',
      message: error.message
    });
  }
});

/**
 * Recargar billetera (simulado para testing)
 */
app.post('/api/astropay/recargar', async (req, res) => {
  try {
    const { userId, monto } = req.body;

    if (!userId || !monto || monto <= 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Se requiere userId y monto válido'
      });
    }

    // Obtener o crear billetera
    let billetera = billeteras.get(userId) || {
      saldo: 0,
      moneda: 'ARS',
      userId,
      historial: []
    };

    // Agregar monto
    billetera.saldo += parseFloat(monto);
    billetera.ultimaActualizacion = new Date().toISOString();
    billetera.historial.push({
      tipo: 'recarga',
      monto: parseFloat(monto),
      fecha: new Date().toISOString(),
      descripcion: 'Recarga de saldo'
    });

    billeteras.set(userId, billetera);

    console.log(`💰 Recarga exitosa: ${userId} +$${monto} → Saldo: $${billetera.saldo}`);

    res.json({
      success: true,
      saldo: billetera.saldo,
      moneda: billetera.moneda,
      recarga: parseFloat(monto)
    });

  } catch (error) {
    console.error('Error al recargar billetera:', error);
    res.status(500).json({
      error: 'Error al recargar billetera',
      message: error.message
    });
  }
});

/**
 * Crear pago con AstroPay
 */
app.post('/api/astropay/crear-pago', async (req, res) => {
  try {
    const { 
      pedidoId, 
      monto, 
      descripcion, 
      userId,
      clienteNombre,
      clienteEmail 
    } = req.body;

    // Validaciones
    if (!pedidoId || !monto || monto <= 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Se requiere pedidoId y monto válido'
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'Usuario requerido',
        message: 'Se requiere userId para pagar con AstroPay'
      });
    }

    // Verificar saldo suficiente
    const billetera = billeteras.get(userId);
    if (!billetera || billetera.saldo < monto) {
      return res.status(400).json({
        error: 'Saldo insuficiente',
        message: `Saldo actual: $${billetera?.saldo || 0}. Se requiere: $${monto}`,
        saldo: billetera?.saldo || 0,
        requerido: monto
      });
    }

    // Generar token de seguridad
    const token = crypto
      .randomBytes(32)
      .toString('hex');

    // En producción, llamar a AstroPay API
    // const astropayResponse = await fetch(`${ASTROPAY_API_URL}/deposits`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'X-Api-Key': ASTROPAY_API_KEY,
    //     'X-Api-Secret': ASTROPAY_SECRET_KEY
    //   },
    //   body: JSON.stringify({
    //     merchant_deposit_id: pedidoId,
    //     amount: monto,
    //     currency: 'ARS',
    //     user: { email: clienteEmail, name: clienteNombre },
    //     callback_url: `http://localhost:5501/api/astropay/webhook`,
    //     redirect_url: `http://localhost:5501/pedidos.html?id=${pedidoId}`
    //   })
    // });

    // Crear registro de pago pendiente
    const pagoInfo = {
      pedidoId,
      monto: parseFloat(monto),
      descripcion: descripcion || 'Pedido YAvoy',
      userId,
      clienteNombre,
      clienteEmail,
      token,
      status: 'pending',
      metodoPago: 'astropay',
      createdAt: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutos
      billetera: {
        saldoAntes: billetera.saldo,
        saldoDespues: billetera.saldo - monto
      }
    };

    pagosActivos.set(pedidoId, pagoInfo);

    console.log(`💰 Pago AstroPay creado: ${pedidoId} - $${monto} (Usuario: ${userId})`);

    res.json({
      success: true,
      pedidoId,
      monto,
      status: 'pending',
      token,
      saldoActual: billetera.saldo,
      saldoDespues: billetera.saldo - monto,
      expiresAt: pagoInfo.expiresAt,
      mensaje: 'Confirma el pago para debitar de tu billetera'
    });

  } catch (error) {
    console.error('Error al crear pago AstroPay:', error);
    res.status(500).json({
      error: 'Error al crear pago',
      message: error.message
    });
  }
});

/**
 * Confirmar pago con AstroPay (debitar de billetera)
 */
app.post('/api/astropay/confirmar-pago/:pedidoId', async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { token } = req.body;

    // Verificar que existe el pago pendiente
    const pagoActivo = pagosActivos.get(pedidoId);
    if (!pagoActivo) {
      return res.status(404).json({
        error: 'Pago no encontrado',
        message: 'El pago no existe o ya expiró'
      });
    }

    // Verificar token de seguridad
    if (pagoActivo.token !== token) {
      return res.status(403).json({
        error: 'Token inválido',
        message: 'El token de seguridad no coincide'
      });
    }

    // Verificar expiración
    if (Date.now() > pagoActivo.expiresAt) {
      pagosActivos.delete(pedidoId);
      return res.status(400).json({
        error: 'Pago expirado',
        message: 'El tiempo para confirmar el pago ha expirado'
      });
    }

    // Verificar saldo nuevamente
    const billetera = billeteras.get(pagoActivo.userId);
    if (!billetera || billetera.saldo < pagoActivo.monto) {
      return res.status(400).json({
        error: 'Saldo insuficiente',
        message: 'No tienes saldo suficiente para completar el pago'
      });
    }

    // DEBITAR SALDO
    billetera.saldo -= pagoActivo.monto;
    billetera.ultimaActualizacion = new Date().toISOString();
    billetera.historial.push({
      tipo: 'pago',
      monto: -pagoActivo.monto,
      fecha: new Date().toISOString(),
      descripcion: `Pago pedido ${pedidoId}`,
      pedidoId
    });

    billeteras.set(pagoActivo.userId, billetera);

    // Actualizar estado del pago
    pagoActivo.status = 'approved';
    pagoActivo.approvedAt = Date.now();
    pagoActivo.paymentId = `ASTRO-${Date.now()}-${pedidoId}`;
    pagosActivos.set(pedidoId, pagoActivo);
    pagosCompletados.add(pagoActivo.paymentId);

    // Actualizar pedido
    const pedidoIndex = pedidos.findIndex(p => p.id === pedidoId);
    if (pedidoIndex !== -1) {
      pedidos[pedidoIndex].pagado = true;
      pedidos[pedidoIndex].metodoPago = 'astropay';
      pedidos[pedidoIndex].montoPagado = pagoActivo.monto;
      pedidos[pedidoIndex].pagoId = pagoActivo.paymentId;
      pedidos[pedidoIndex].fechaPago = new Date().toISOString();

      // Guardar en archivo
      try {
        const filePath = path.join(BASE_DIR, 'pedidos', `${pedidoId}.json`);
        await fs.writeFile(filePath, JSON.stringify(pedidos[pedidoIndex], null, 2));
      } catch (error) {
        console.error('Error al guardar pedido:', error);
      }
    }

    console.log(`✅ Pago AstroPay confirmado: ${pedidoId} - $${pagoActivo.monto} (Saldo: $${billetera.saldo})`);

    // Enviar notificación
    try {
      await enviarNotificacion({
        titulo: 'Pago Confirmado ✅',
        mensaje: `Tu pago de $${pagoActivo.monto} con AstroPay fue aprobado. Pedido #${pedidoId}`,
        icono: '/icons/icon-192x192.png',
        urlAccion: `/pedidos.html?id=${pedidoId}`
      });
    } catch (error) {
      console.error('Error al enviar notificación:', error);
    }

    res.json({
      success: true,
      status: 'approved',
      pedidoId,
      monto: pagoActivo.monto,
      paymentId: pagoActivo.paymentId,
      nuevoSaldo: billetera.saldo,
      mensaje: 'Pago confirmado exitosamente'
    });

  } catch (error) {
    console.error('Error al confirmar pago AstroPay:', error);
    res.status(500).json({
      error: 'Error al confirmar pago',
      message: error.message
    });
  }
});

/**
 * Verificar estado de pago AstroPay
 */
app.get('/api/astropay/verificar-pago/:pedidoId', (req, res) => {
  try {
    const { pedidoId } = req.params;
    
    const pagoActivo = pagosActivos.get(pedidoId);
    
    if (!pagoActivo) {
      return res.status(404).json({
        error: 'Pago no encontrado',
        status: 'not_found'
      });
    }

    // Verificar expiración
    if (Date.now() > pagoActivo.expiresAt && pagoActivo.status === 'pending') {
      pagosActivos.delete(pedidoId);
      return res.json({
        status: 'expired',
        message: 'El pago ha expirado'
      });
    }

    res.json({
      status: pagoActivo.status,
      pedidoId: pagoActivo.pedidoId,
      monto: pagoActivo.monto,
      metodoPago: 'astropay',
      createdAt: pagoActivo.createdAt,
      expiresAt: pagoActivo.expiresAt,
      approvedAt: pagoActivo.approvedAt,
      paymentId: pagoActivo.paymentId
    });

  } catch (error) {
    console.error('Error al verificar pago:', error);
    res.status(500).json({
      error: 'Error al verificar pago',
      message: error.message
    });
  }
});

/**
 * Webhook de AstroPay (notificaciones de depósitos externos)
 */
app.post('/api/astropay/webhook', async (req, res) => {
  try {
    const { 
      merchant_deposit_id, 
      status, 
      amount, 
      user_id,
      signature 
    } = req.body;

    console.log('📨 Webhook AstroPay recibido:', req.body);

    // Responder inmediatamente
    res.status(200).send('OK');

    // En producción, verificar signature
    // const expectedSignature = crypto
    //   .createHmac('sha256', ASTROPAY_SECRET_KEY)
    //   .update(JSON.stringify({ merchant_deposit_id, status, amount }))
    //   .digest('hex');
    // 
    // if (signature !== expectedSignature) {
    //   console.error('❌ Firma inválida en webhook AstroPay');
    //   return;
    // }

    // Si es un depósito aprobado, recargar billetera
    if (status === 'approved' && user_id && amount) {
      let billetera = billeteras.get(user_id) || {
        saldo: 0,
        moneda: 'ARS',
        userId: user_id,
        historial: []
      };

      billetera.saldo += parseFloat(amount);
      billetera.ultimaActualizacion = new Date().toISOString();
      billetera.historial.push({
        tipo: 'deposito',
        monto: parseFloat(amount),
        fecha: new Date().toISOString(),
        descripcion: 'Depósito desde AstroPay',
        transactionId: merchant_deposit_id
      });

      billeteras.set(user_id, billetera);

      console.log(`💰 Depósito AstroPay confirmado: ${user_id} +$${amount} → Saldo: $${billetera.saldo}`);
    }

  } catch (error) {
    console.error('❌ Error al procesar webhook AstroPay:', error);
  }
});

/**
 * Obtener historial de transacciones
 */
app.get('/api/astropay/historial/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const billetera = billeteras.get(userId);

    if (!billetera) {
      return res.json({
        success: true,
        historial: [],
        mensaje: 'No hay transacciones registradas'
      });
    }

    res.json({
      success: true,
      historial: billetera.historial || [],
      saldo: billetera.saldo,
      moneda: billetera.moneda
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      error: 'Error al obtener historial',
      message: error.message
    });
  }
});

// ========================================
// ⭐ SISTEMA DE CALIFICACIONES Y REVIEWS
// ========================================

// Array para almacenar calificaciones (en producción usar base de datos)
let calificaciones = [];

// Cargar calificaciones al iniciar (función async)
async function cargarCalificaciones() {
  try {
    const calificacionesPath = path.join(BASE_DIR, 'calificaciones.json');
    const data = await fs.readFile(calificacionesPath, 'utf-8');
    calificaciones = JSON.parse(data);
    console.log(`📊 ${calificaciones.length} calificaciones cargadas`);
  } catch (error) {
    console.log('📊 No hay calificaciones previas, iniciando array vacío');
    calificaciones = [];
  }
}

// GET - Obtener todas las calificaciones
app.get('/api/calificaciones', (req, res) => {
  try {
    const { entityId, entityType, estrellas, limite } = req.query;
    
    let resultado = [...calificaciones];

    // Filtrar por entidad
    if (entityId) {
      resultado = resultado.filter(cal => cal.entityId === entityId);
    }

    // Filtrar por tipo
    if (entityType) {
      resultado = resultado.filter(cal => cal.entityType === entityType);
    }

    // Filtrar por estrellas
    if (estrellas) {
      resultado = resultado.filter(cal => cal.estrellas === parseInt(estrellas));
    }

    // Aplicar límite
    if (limite) {
      resultado = resultado.slice(0, parseInt(limite));
    }

    res.json(resultado);

  } catch (error) {
    console.error('Error obteniendo calificaciones:', error);
    res.status(500).json({ error: 'Error al obtener calificaciones' });
  }
});

// GET - Obtener promedio de una entidad
app.get('/api/calificaciones/promedio/:entityId', (req, res) => {
  try {
    const { entityId } = req.params;
    const cals = calificaciones.filter(cal => cal.entityId === entityId);

    if (cals.length === 0) {
      return res.json({
        promedio: 0,
        total: 0,
        distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    }

    const suma = cals.reduce((acc, cal) => acc + cal.estrellas, 0);
    const promedio = suma / cals.length;

    const distribucion = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    cals.forEach(cal => {
      distribucion[cal.estrellas]++;
    });

    res.json({
      promedio: Math.round(promedio * 10) / 10,
      total: cals.length,
      distribucion
    });

  } catch (error) {
    console.error('Error calculando promedio:', error);
    res.status(500).json({ error: 'Error al calcular promedio' });
  }
});

// POST - Crear nueva calificación
app.post('/api/calificaciones', async (req, res) => {
  try {
    const calificacion = {
      ...req.body,
      id: req.body.id || `CAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fecha: req.body.fecha || new Date().toISOString(),
      likes: 0,
      reportes: 0
    };

    // Validar datos requeridos
    if (!calificacion.entityId || !calificacion.entityType || !calificacion.estrellas || !calificacion.pedidoId) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Validar estrellas (1-5)
    if (calificacion.estrellas < 1 || calificacion.estrellas > 5) {
      return res.status(400).json({ error: 'Calificación debe ser entre 1 y 5' });
    }

    // Verificar que no haya calificado ya este pedido
    const yaExiste = calificaciones.some(cal => 
      cal.pedidoId === calificacion.pedidoId && 
      cal.entityId === calificacion.entityId && 
      cal.clienteId === calificacion.clienteId
    );

    if (yaExiste) {
      return res.status(400).json({ error: 'Ya calificaste este pedido' });
    }

    // Agregar calificación
    calificaciones.unshift(calificacion);

    // Guardar en archivo
    const calificacionesPath = path.join(BASE_DIR, 'calificaciones.json');
    await fs.writeFile(calificacionesPath, JSON.stringify(calificaciones, null, 2));

    // También guardar en archivo individual
    const individualPath = path.join(BASE_DIR, 'calificaciones', `${calificacion.id}.json`);
    await fs.mkdir(path.dirname(individualPath), { recursive: true });
    await fs.writeFile(individualPath, JSON.stringify(calificacion, null, 2));

    console.log(`✅ Nueva calificación creada: ${calificacion.id} (${calificacion.estrellas}★ para ${calificacion.entityId})`);

    res.json({ success: true, calificacion });

  } catch (error) {
    console.error('❌ Error creando calificación:', error);
    res.status(500).json({ error: 'Error al crear calificación' });
  }
});

// POST - Agregar respuesta a una calificación
app.post('/api/calificaciones/:id/respuesta', async (req, res) => {
  try {
    const { id } = req.params;
    const { respuesta, entityId } = req.body;

    if (!respuesta || !respuesta.trim()) {
      return res.status(400).json({ error: 'Respuesta vacía' });
    }

    const calIndex = calificaciones.findIndex(cal => cal.id === id);

    if (calIndex === -1) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }

    // Verificar que la respuesta sea del dueño de la entidad
    if (calificaciones[calIndex].entityId !== entityId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    calificaciones[calIndex].respuesta = {
      texto: respuesta,
      fecha: new Date().toISOString()
    };

    // Guardar cambios
    const calificacionesPath = path.join(BASE_DIR, 'calificaciones.json');
    await fs.writeFile(calificacionesPath, JSON.stringify(calificaciones, null, 2));

    console.log(`💬 Respuesta agregada a calificación ${id}`);

    res.json({ success: true, calificacion: calificaciones[calIndex] });

  } catch (error) {
    console.error('Error agregando respuesta:', error);
    res.status(500).json({ error: 'Error al agregar respuesta' });
  }
});

// POST - Dar like a una calificación
app.post('/api/calificaciones/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const calIndex = calificaciones.findIndex(cal => cal.id === id);

    if (calIndex === -1) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }

    calificaciones[calIndex].likes++;

    // Guardar cambios
    const calificacionesPath = path.join(BASE_DIR, 'calificaciones.json');
    await fs.writeFile(calificacionesPath, JSON.stringify(calificaciones, null, 2));

    res.json({ success: true, likes: calificaciones[calIndex].likes });

  } catch (error) {
    console.error('Error dando like:', error);
    res.status(500).json({ error: 'Error al dar like' });
  }
});

// POST - Reportar una calificación
app.post('/api/calificaciones/:id/reportar', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const calIndex = calificaciones.findIndex(cal => cal.id === id);

    if (calIndex === -1) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }

    calificaciones[calIndex].reportes++;

    // Guardar reporte en archivo separado
    const reportesPath = path.join(BASE_DIR, 'reportes-calificaciones');
    await fs.mkdir(reportesPath, { recursive: true });

    const reporte = {
      calificacionId: id,
      motivo,
      fecha: new Date().toISOString()
    };

    const reporteFile = path.join(reportesPath, `reporte-${Date.now()}.json`);
    await fs.writeFile(reporteFile, JSON.stringify(reporte, null, 2));

    // Guardar cambios en calificaciones
    const calificacionesPath = path.join(BASE_DIR, 'calificaciones.json');
    await fs.writeFile(calificacionesPath, JSON.stringify(calificaciones, null, 2));

    console.log(`🚩 Reporte recibido para calificación ${id}: ${motivo}`);

    res.json({ success: true });

  } catch (error) {
    console.error('Error reportando calificación:', error);
    res.status(500).json({ error: 'Error al reportar' });
  }
});

// DELETE - Eliminar una calificación (solo admin)
app.delete('/api/calificaciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const calIndex = calificaciones.findIndex(cal => cal.id === id);

    if (calIndex === -1) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }

    calificaciones.splice(calIndex, 1);

    // Guardar cambios
    const calificacionesPath = path.join(BASE_DIR, 'calificaciones.json');
    await fs.writeFile(calificacionesPath, JSON.stringify(calificaciones, null, 2));

    console.log(`🗑️ Calificación eliminada: ${id}`);

    res.json({ success: true });

  } catch (error) {
    console.error('Error eliminando calificación:', error);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

// Función auxiliar para enviar notificaciones
async function enviarNotificacion(payload) {
  const notificationPayload = JSON.stringify({
    title: payload.titulo,
    body: payload.mensaje,
    icon: payload.icono || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: payload.urlAccion || '/'
    }
  });

  const promises = subscriptions.map(sub => {
    return webpush.sendNotification(sub, notificationPayload)
      .catch(error => {
        console.error('Error al enviar notificación:', error);
      });
  });

  await Promise.all(promises);
}

// ============================================
// 🎧 SISTEMA DE SOPORTE Y TICKETS
// ============================================

const SOPORTE_DIR = path.join(__dirname, 'registros', 'soporte');
let tickets = [];
let ticketIdCounter = 1;

// Inicializar directorio de soporte
async function inicializarSoporte() {
  try {
    await fs.mkdir(SOPORTE_DIR, { recursive: true });
    
    // Cargar tickets existentes
    try {
      const ticketsData = await fs.readFile(path.join(SOPORTE_DIR, 'tickets.json'), 'utf8');
      tickets = JSON.parse(ticketsData);
      ticketIdCounter = tickets.length > 0 ? Math.max(...tickets.map(t => parseInt(t.id.split('-')[1]))) + 1 : 1;
    } catch (error) {
      tickets = [];
      await fs.writeFile(path.join(SOPORTE_DIR, 'tickets.json'), JSON.stringify([], null, 2));
    }
    
    console.log('✅ Sistema de soporte inicializado');
  } catch (error) {
    console.error('Error inicializando soporte:', error);
  }
}

// Guardar tickets
async function guardarTickets() {
  try {
    await fs.writeFile(
      path.join(SOPORTE_DIR, 'tickets.json'),
      JSON.stringify(tickets, null, 2)
    );
  } catch (error) {
    console.error('Error guardando tickets:', error);
  }
}

/**
 * Crear nuevo ticket de soporte
 * POST /api/soporte/tickets
 */
app.post('/api/soporte/tickets', async (req, res) => {
  try {
    const { usuario, categoria, prioridad, asunto, descripcion, adjunto } = req.body;

    if (!usuario || !categoria || !asunto || !descripcion) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos'
      });
    }

    const ticket = {
      id: `TKT-${ticketIdCounter++}`,
      usuario,
      categoria,
      prioridad: prioridad || 'media',
      asunto,
      descripcion,
      adjunto: adjunto || null,
      estado: 'nuevo',
      fecha: new Date().toISOString(),
      respuestas: [],
      ultimaActualizacion: new Date().toISOString()
    };

    tickets.push(ticket);
    await guardarTickets();

    // Emitir evento Socket.IO
    io.emit('nuevo-ticket', ticket);

    // Notificar al equipo de soporte
    io.emit('notificacion-soporte', {
      tipo: 'nuevo-ticket',
      ticket: ticket.id,
      mensaje: `Nuevo ticket: ${asunto}`
    });

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error creando ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear ticket'
    });
  }
});

/**
 * Listar tickets
 * GET /api/soporte/tickets
 */
app.get('/api/soporte/tickets', async (req, res) => {
  try {
    const { usuario, estado, categoria } = req.query;

    let ticketsFiltrados = [...tickets];

    // Filtrar por usuario
    if (usuario) {
      ticketsFiltrados = ticketsFiltrados.filter(t => t.usuario === usuario);
    }

    // Filtrar por estado
    if (estado) {
      ticketsFiltrados = ticketsFiltrados.filter(t => t.estado === estado);
    }

    // Filtrar por categoría
    if (categoria) {
      ticketsFiltrados = ticketsFiltrados.filter(t => t.categoria === categoria);
    }

    // Ordenar por fecha (más recientes primero)
    ticketsFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json(ticketsFiltrados);
  } catch (error) {
    console.error('Error listando tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar tickets'
    });
  }
});

/**
 * Obtener ticket por ID
 * GET /api/soporte/tickets/:id
 */
app.get('/api/soporte/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = tickets.find(t => t.id === id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error obteniendo ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ticket'
    });
  }
});

/**
 * Actualizar ticket (cambiar estado, agregar respuesta)
 * PUT /api/soporte/tickets/:id
 */
app.put('/api/soporte/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, respuesta, autor } = req.body;

    const ticketIndex = tickets.findIndex(t => t.id === id);

    if (ticketIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    // Actualizar estado si se proporciona
    if (estado) {
      tickets[ticketIndex].estado = estado;
    }

    // Agregar respuesta si se proporciona
    if (respuesta) {
      tickets[ticketIndex].respuestas.push({
        autor: autor || 'Soporte',
        mensaje: respuesta,
        fecha: new Date().toISOString()
      });
    }

    tickets[ticketIndex].ultimaActualizacion = new Date().toISOString();

    await guardarTickets();

    // Emitir evento Socket.IO
    io.emit('ticket-actualizado', tickets[ticketIndex]);

    // Notificar al usuario
    io.emit(`ticket-${id}-actualizado`, tickets[ticketIndex]);

    res.json({
      success: true,
      ticket: tickets[ticketIndex]
    });
  } catch (error) {
    console.error('Error actualizando ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar ticket'
    });
  }
});

/**
 * Obtener estadísticas de soporte
 * GET /api/soporte/estadisticas
 */
app.get('/api/soporte/estadisticas', async (req, res) => {
  try {
    const { usuario } = req.query;

    let ticketsConsulta = usuario 
      ? tickets.filter(t => t.usuario === usuario)
      : tickets;

    const stats = {
      total: ticketsConsulta.length,
      nuevo: ticketsConsulta.filter(t => t.estado === 'nuevo').length,
      enProgreso: ticketsConsulta.filter(t => t.estado === 'en-progreso').length,
      resueltos: ticketsConsulta.filter(t => t.estado === 'resuelto').length,
      cerrados: ticketsConsulta.filter(t => t.estado === 'cerrado').length,
      pendientes: ticketsConsulta.filter(t => t.estado !== 'resuelto' && t.estado !== 'cerrado').length,
      tiempoPromedio: 0,
      porCategoria: {}
    };

    // Calcular tiempo promedio de resolución (en horas)
    const ticketsResueltos = ticketsConsulta.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado');
    if (ticketsResueltos.length > 0) {
      const tiempos = ticketsResueltos.map(t => {
        const inicio = new Date(t.fecha);
        const fin = new Date(t.ultimaActualizacion);
        return (fin - inicio) / (1000 * 60 * 60); // Convertir a horas
      });
      stats.tiempoPromedio = Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length);
    }

    // Contar por categoría
    ticketsConsulta.forEach(t => {
      stats.porCategoria[t.categoria] = (stats.porCategoria[t.categoria] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

// Socket.IO - Chat de soporte en vivo
io.on('connection', (socket) => {
  // Chat de soporte
  socket.on('chat-soporte', (data) => {
    const { usuario, mensaje } = data;
    
    // Aquí podrías implementar lógica de respuesta automática o enviar a agente
    console.log(`Chat soporte de ${usuario}: ${mensaje}`);
    
    // Respuesta automática básica
    setTimeout(() => {
      socket.emit('chat-soporte-respuesta', {
        usuario,
        mensaje: 'Gracias por tu mensaje. Un agente revisará tu consulta en breve.',
        esBot: true
      });
    }, 1000);
  });
});

inicializarSoporte();

inicializarDirectorios().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 Servidor YAvoy escuchando en http://localhost:${PORT}`);
    console.log(`   📁 Carpeta de registros: ${BASE_DIR}`);
    console.log(`   🌐 Aplicación web: http://localhost:${PORT}`);
    console.log(`   🔌 Socket.IO: Notificaciones en tiempo real ACTIVAS`);
    console.log('   🔗 API Endpoints:');
    console.log('      GET  /                        - Página principal');
    console.log('      POST /api/guardar-comercio    - Guardar comercio');
    console.log('      GET  /api/listar-comercios    - Listar comercios');
    console.log('      POST /api/repartidores        - Registrar repartidor');
    console.log('      GET  /api/repartidores        - Listar repartidores');
    console.log('      POST /api/pedidos             - Crear pedido');
    console.log('      GET  /api/pedidos             - Listar pedidos');
    console.log('   💳 MercadoPago:');
    console.log('      GET  /api/mercadopago/public-key       - Obtener clave pública');
    console.log('      POST /api/mercadopago/crear-qr         - Generar QR de pago');
    console.log('      GET  /api/mercadopago/verificar-pago/:id - Verificar estado');
    console.log('      POST /api/mercadopago/webhook          - Webhook de pagos');
    console.log('   ⭐ Calificaciones:');
    console.log('      GET  /api/calificaciones               - Listar calificaciones');
    console.log('      GET  /api/calificaciones/promedio/:id  - Promedio de entidad');
    console.log('      POST /api/calificaciones               - Crear calificación');
    console.log('      POST /api/calificaciones/:id/respuesta - Responder calificación');
    console.log('      POST /api/calificaciones/:id/like      - Dar like');
    console.log('      POST /api/calificaciones/:id/reportar  - Reportar calificación');
    console.log('   🎁 Recompensas y Referidos:');
    console.log('      GET  /api/referidos                    - Listar referidos');
    console.log('      POST /api/referidos                    - Crear referido');
    console.log('      GET  /api/referidos/codigo/:id         - Obtener código usuario');
    console.log('      POST /api/referidos/codigo             - Guardar código');
    console.log('   💵 Propinas:');
    console.log('      GET  /api/propinas                     - Listar propinas');
    console.log('      POST /api/propinas                     - Crear propina');
    console.log('      GET  /api/propinas/top-repartidores    - Top repartidores');
    console.log('   👥 Pedidos Grupales:');
    console.log('      GET  /api/pedidos-grupales             - Listar pedidos grupales');
    console.log('      POST /api/pedidos-grupales             - Crear pedido grupal');
    console.log('      PUT  /api/pedidos-grupales/:id         - Actualizar pedido grupal');
    console.log('   🔔 Notificaciones IA:');
    console.log('      GET  /api/notificaciones-ia/perfiles   - Perfiles de usuario');
    console.log('      PUT  /api/notificaciones-ia/perfiles/:id - Actualizar perfil');
    console.log('      POST /api/notificaciones-ia/envios     - Registrar envío');
    console.log('   📦 Inventario:');
    console.log('      GET  /api/inventario                   - Listar productos');
    console.log('      POST /api/inventario                   - Crear producto');
    console.log('      PUT  /api/inventario/:id               - Actualizar producto');
    console.log('      POST /api/inventario/movimientos       - Registrar movimiento');
    console.log('      POST /api/inventario/alertas           - Crear alerta');
    console.log('   📊 Analytics:');
    console.log('      GET  /api/analytics/datos-completos    - Datos completos dashboard');
    console.log('      GET  /api/analytics/comercio/:id       - Analytics por comercio');
    console.log('   📊 API CEO:');
    console.log('      GET  /api/ceo/repartidores    - Informes repartidores (todos)');
    console.log('      GET  /api/ceo/repartidores/:id- Informe repartidor individual');
    console.log('      GET  /api/ceo/comercios       - Informes comercios (todos)');
    console.log('      GET  /api/ceo/clientes        - Informes clientes (todos)');
    console.log('   🔔 Notificaciones:');
    console.log('      GET  /api/vapid-public-key    - Clave VAPID');
    console.log('      POST /api/subscribe           - Suscribirse');
    console.log('      POST /api/send-notification   - Enviar notificación');
    console.log('   ⭐ YaVoy 2026:');
    console.log('      GET  /api/registros           - Todos los registros (Admin Panel)');
    console.log('      GET  /api/dashboard/stats     - Estadísticas Dashboard CEO');
    console.log('      GET  /api/chat/:id            - Mensajes de conversación');
    console.log('      POST /api/chat/:id            - Enviar mensaje');
    console.log('      GET  /api/conversaciones      - Listar conversaciones');
    console.log('   🚴 App Repartidor:');
    console.log('      PUT  /api/pedidos/:id/estado  - Actualizar estado pedido');
    console.log('      POST /api/pedidos/:id/ubicacion - Actualizar ubicación GPS');
    console.log('      GET  /api/repartidor/:id/pedidos - Pedidos del repartidor');
    console.log('   🏪 App Comercio:');
    console.log('      GET  /api/comercio/:id/pedidos - Pedidos del comercio');
    console.log('      GET  /api/comercio/:id/stats   - Estadísticas del comercio');
    console.log('      PUT  /api/pedidos/:id/cancelar - Cancelar pedido');
    console.log('   📋 Registros CEO:');
    console.log('      POST /api/registros/ceo/configuraciones-comercios - Guardar config comercio');
    console.log('      GET  /api/registros/ceo/configuraciones-comercios - Obtener configs comercios');
    console.log('   🎯 Panel CEO Master (13 Pestañas):');
    console.log('      GET  /panel-ceo-master.html            - Panel de Control Total');
    console.log('      GET  /api/multimedia/:tipo             - Gestión de multimedia');
    console.log('      DELETE /api/multimedia/:id             - Eliminar multimedia');
    console.log('      PATCH /api/categorias/:id              - Actualizar categoría');
    console.log('      GET  /api/suspensiones                 - Listar suspendidos');
    console.log('      POST /api/suspensiones                 - Suspender usuario');
    console.log('      DELETE /api/suspensiones/:id           - Reactivar usuario');
    console.log('      GET  /api/solicitudes/tienda           - Solicitudes de tienda');
    console.log('      GET  /api/solicitudes/publicidad       - Solicitudes publicidad');
    console.log('      POST /api/solicitudes/:tipo/:id/aprobar - Aprobar solicitud');
    console.log('      POST /api/solicitudes/:tipo/:id/rechazar - Rechazar solicitud');
    console.log('      GET  /api/registros/:tipo              - Registros del sistema');
    console.log('      POST /api/comercios                    - Crear comercio desde CEO\n');
  });
});

// ========================================
// 📜 REGISTRO DE ACEPTACIÓN DE TÉRMINOS Y CONDICIONES
// ========================================
app.post('/api/registrar-aceptacion-terminos', async (req, res) => {
  try {
    const { 
      tipo, // 'repartidor', 'comercio', 'cliente'
      email, 
      telefono, 
      nombre,
      documento, // DNI o CUIT (opcional)
      aceptaTerminos,
      aceptaPrivacidad,
      ipAddress
    } = req.body;

    if (!tipo || !aceptaTerminos || (!email && !telefono)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan datos obligatorios: tipo, aceptaTerminos y al menos email o teléfono' 
      });
    }

    const ahora = new Date();
    const fechaFormato = ahora.toISOString().split('T')[0]; // 2025-12-15
    const mesAno = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`; // 2025-12

    const registro = {
      id: `TERMINOS-${tipo.toUpperCase()}-${Date.now()}`,
      tipo: tipo,
      nombre: nombre || 'No proporcionado',
      email: email || 'No proporcionado',
      telefono: telefono || 'No proporcionado',
      documento: documento || 'No proporcionado',
      aceptaTerminos: aceptaTerminos === true || aceptaTerminos === 'si',
      aceptaPrivacidad: aceptaPrivacidad === true || aceptaPrivacidad === 'si',
      ipAddress: ipAddress || req.ip || req.connection.remoteAddress || 'No disponible',
      userAgent: req.headers['user-agent'] || 'No disponible',
      fechaAceptacion: new Date().toISOString(),
      fechaLegible: new Date().toLocaleString('es-AR', { 
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      timestamp: Date.now()
    };

    const nombreArchivo = `aceptacion_terminos_${fechaFormato}_${Date.now()}.json`;

    // 1. Guardar en carpeta de aceptaciones organizada por fecha: registros/aceptaciones-terminos/{tipo}/{año-mes}/
    const dirAceptaciones = path.join(BASE_DIR, 'aceptaciones-terminos', tipo, mesAno);
    await fs.mkdir(dirAceptaciones, { recursive: true });
    const rutaAceptaciones = path.join(dirAceptaciones, nombreArchivo);
    await fs.writeFile(rutaAceptaciones, JSON.stringify(registro, null, 2), 'utf8');

    // 2. Guardar también en la carpeta individual del usuario según su tipo
    let dirUsuario;
    let carpetaDestino;
    
    if (tipo === 'repartidor') {
      carpetaDestino = 'repartidores';
    } else if (tipo === 'comercio') {
      // Determinar carpeta según categoría (si se proporcionó en req.body)
      const categoria = req.body.categoria || 'otros';
      const categoriaACarpeta = {
        empresas: 'servicios-otros',
        mayoristas: 'servicios-otros',
        indumentaria: 'servicios-indumentaria',
        bazar: 'servicios-bazar',
        kiosco: 'servicios-kiosco',
        restaurante: 'servicios-alimentacion',
        farmacia: 'servicios-salud',
        otros: 'servicios-otros',
      };
      carpetaDestino = categoriaACarpeta[categoria] || 'servicios-otros';
    } else if (tipo === 'cliente') {
      carpetaDestino = 'clientes';
    }

    if (carpetaDestino) {
      dirUsuario = path.join(BASE_DIR, carpetaDestino);
      await fs.mkdir(dirUsuario, { recursive: true });
      const rutaUsuario = path.join(dirUsuario, nombreArchivo);
      await fs.writeFile(rutaUsuario, JSON.stringify(registro, null, 2), 'utf8');
      console.log(`✅ Aceptación guardada en: ${carpetaDestino}/ y aceptaciones-terminos/${tipo}/${mesAno}/`);
    } else {
      console.log(`✅ Aceptación registrada: ${tipo} - ${email || telefono} -> ${dirAceptaciones}`);
    }

    // 3. Guardar email en carpeta de emails si se proporcionó
    if (email && email !== 'No proporcionado' && email !== 'no-proporcionado') {
      const dirEmails = path.join(BASE_DIR, 'emails', tipo === 'comercio' ? 'comercios' : `${tipo}s`);
      await fs.mkdir(dirEmails, { recursive: true });
      
      const registroEmail = {
        email: email,
        nombre: nombre,
        documento: documento,
        tipo: tipo,
        fechaRegistro: registro.fechaAceptacion,
        fechaLegible: registro.fechaLegible,
        registroId: registro.id
      };
      
      const nombreArchivoEmail = `email_${tipo}_${email.replace(/[@.]/g, '_')}_${Date.now()}.json`;
      const rutaEmail = path.join(dirEmails, nombreArchivoEmail);
      await fs.writeFile(rutaEmail, JSON.stringify(registroEmail, null, 2), 'utf8');
    }

    // 4. Guardar teléfono en carpeta de teléfonos si se proporcionó
    if (telefono && telefono !== 'No proporcionado' && telefono !== 'no-proporcionado') {
      const dirTelefonos = path.join(BASE_DIR, 'telefonos', tipo === 'comercio' ? 'comercios' : `${tipo}s`);
      await fs.mkdir(dirTelefonos, { recursive: true });
      
      const registroTelefono = {
        telefono: telefono,
        nombre: nombre,
        email: email,
        documento: documento,
        tipo: tipo,
        fechaRegistro: registro.fechaAceptacion,
        fechaLegible: registro.fechaLegible,
        registroId: registro.id
      };
      
      const telefonoLimpio = telefono.replace(/[\s\-\+\(\)]/g, '_');
      const nombreArchivoTelefono = `telefono_${tipo}_${telefonoLimpio}_${Date.now()}.json`;
      const rutaTelefono = path.join(dirTelefonos, nombreArchivoTelefono);
      await fs.writeFile(rutaTelefono, JSON.stringify(registroTelefono, null, 2), 'utf8');
    }

    console.log(`📧 Email y 📱 teléfono registrados en carpetas separadas para ${tipo}`);

    res.json({ 
      success: true, 
      mensaje: 'Aceptación de términos registrada correctamente',
      registroId: registro.id,
      fecha: registro.fechaLegible
    });

  } catch (error) {
    console.error('❌ Error al registrar aceptación de términos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al guardar el registro de aceptación' 
    });
  }
});

// ========================================
// 👑 ENDPOINTS PANEL CEO MASTER
// ========================================

// Obtener todos los comercios para el CEO
app.get('/api/comercios', async (req, res) => {
  try {
    const carpetas = [
      'servicios-prioridad',
      'servicios-alimentacion',
      'servicios-salud',
      'servicios-bazar',
      'servicios-indumentaria',
      'servicios-kiosco',
      'servicios-otros'
    ];

    const comercios = [];

    for (const carpeta of carpetas) {
      try {
        const rutaCarpeta = path.join(BASE_DIR, carpeta);
        const archivos = await fs.readdir(rutaCarpeta);
        
        for (const archivo of archivos) {
          if (!archivo.endsWith('.json')) continue;
          
          const rutaArchivo = path.join(rutaCarpeta, archivo);
          const contenido = await fs.readFile(rutaArchivo, 'utf8');
          const comercio = JSON.parse(contenido);
          comercios.push(comercio);
        }
      } catch (err) {
        continue;
      }
    }

    res.json({ success: true, comercios, total: comercios.length });
  } catch (error) {
    console.error('Error al obtener comercios:', error);
    res.status(500).json({ success: false, error: 'Error al cargar comercios' });
  }
});

// Obtener todos los repartidores para el CEO
app.get('/api/repartidores', async (req, res) => {
  try {
    const rutaCarpeta = path.join(BASE_DIR, 'registros');
    const archivos = await fs.readdir(rutaCarpeta);
    
    const repartidores = [];
    
    for (const archivo of archivos) {
      if (archivo.startsWith('repartidor_') && archivo.endsWith('.json')) {
        const rutaArchivo = path.join(rutaCarpeta, archivo);
        const contenido = await fs.readFile(rutaArchivo, 'utf8');
        const repartidor = JSON.parse(contenido);
        repartidores.push(repartidor);
      }
    }

    res.json({ success: true, repartidores, total: repartidores.length });
  } catch (error) {
    console.error('Error al obtener repartidores:', error);
    res.status(500).json({ success: false, error: 'Error al cargar repartidores' });
  }
});

// Obtener todos los pedidos del sistema
app.get('/api/pedidos', async (req, res) => {
  try {
    const pedidos = [];
    res.json({ success: true, pedidos, total: 0 });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ success: false, error: 'Error al cargar pedidos' });
  }
});

// Actualizar comercio (PATCH)
app.patch('/api/comercio/:id', async (req, res) => {
  try {
    const comercioId = req.params.id;
    const actualizacion = req.body;
    
    const carpetas = [
      'servicios-prioridad',
      'servicios-alimentacion',
      'servicios-salud',
      'servicios-bazar',
      'servicios-indumentaria',
      'servicios-kiosco',
      'servicios-otros'
    ];

    for (const carpeta of carpetas) {
      try {
        const rutaCarpeta = path.join(BASE_DIR, carpeta);
        const archivos = await fs.readdir(rutaCarpeta);
        
        for (const archivo of archivos) {
          if (!archivo.endsWith('.json')) continue;
          
          const rutaArchivo = path.join(rutaCarpeta, archivo);
          const contenido = await fs.readFile(rutaArchivo, 'utf8');
          const comercio = JSON.parse(contenido);
          
          if (comercio.id === comercioId) {
            const comercioActualizado = { ...comercio, ...actualizacion };
            await fs.writeFile(rutaArchivo, JSON.stringify(comercioActualizado, null, 2), 'utf8');
            
            console.log(`✅ CEO actualizó comercio ${comercioId}`);
            
            return res.json({ 
              success: true, 
              comercio: comercioActualizado,
              mensaje: 'Comercio actualizado correctamente' 
            });
          }
        }
      } catch (err) {
        continue;
      }
    }
    
    res.status(404).json({ success: false, error: 'Comercio no encontrado' });
  } catch (error) {
    console.error('Error al actualizar comercio:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar' });
  }
});

// Eliminar comercio (DELETE)
app.delete('/api/comercio/:id', async (req, res) => {
  try {
    const comercioId = req.params.id;
    
    const carpetas = [
      'servicios-prioridad',
      'servicios-alimentacion',
      'servicios-salud',
      'servicios-bazar',
      'servicios-indumentaria',
      'servicios-kiosco',
      'servicios-otros'
    ];

    for (const carpeta of carpetas) {
      try {
        const rutaCarpeta = path.join(BASE_DIR, carpeta);
        const archivos = await fs.readdir(rutaCarpeta);
        
        for (const archivo of archivos) {
          if (!archivo.endsWith('.json')) continue;
          
          const rutaArchivo = path.join(rutaCarpeta, archivo);
          const contenido = await fs.readFile(rutaArchivo, 'utf8');
          const comercio = JSON.parse(contenido);
          
          if (comercio.id === comercioId) {
            await fs.unlink(rutaArchivo);
            
            console.log(`🗑️ CEO eliminó comercio ${comercioId}`);
            
            return res.json({ 
              success: true, 
              mensaje: 'Comercio eliminado correctamente' 
            });
          }
        }
      } catch (err) {
        continue;
      }
    }
    
    res.status(404).json({ success: false, error: 'Comercio no encontrado' });
  } catch (error) {
    console.error('Error al eliminar comercio:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar' });
  }
});

// Obtener contenido de carpeta JSON
app.get('/api/archivos/:carpeta.json', async (req, res) => {
  try {
    const carpeta = req.params.carpeta;
    const rutaCarpeta = path.join(BASE_DIR, carpeta);
    
    const archivos = await fs.readdir(rutaCarpeta);
    const datos = [];
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const rutaArchivo = path.join(rutaCarpeta, archivo);
        const contenido = await fs.readFile(rutaArchivo, 'utf8');
        datos.push(JSON.parse(contenido));
      }
    }
    
    res.json(datos);
  } catch (error) {
    console.error('Error al leer archivos JSON:', error);
    res.status(500).json({ success: false, error: 'Error al cargar datos' });
  }
});

// Guardar archivo JSON editado
app.put('/api/archivos/:carpeta.json', async (req, res) => {
  try {
    const carpeta = req.params.carpeta;
    const { contenido } = req.body;
    
    const datos = JSON.parse(contenido);
    
    const rutaCarpeta = path.join(BASE_DIR, carpeta);
    const timestamp = Date.now();
    const rutaArchivo = path.join(rutaCarpeta, `ceo_edit_${timestamp}.json`);
    
    await fs.writeFile(rutaArchivo, contenido, 'utf8');
    
    console.log(`💾 CEO guardó ${carpeta}.json`);
    
    res.json({ 
      success: true, 
      mensaje: 'Archivo guardado correctamente' 
    });
  } catch (error) {
    console.error('Error al guardar archivo JSON:', error);
    res.status(500).json({ success: false, error: 'Error al guardar' });
  }
});

// Obtener archivo CSS
app.get('/api/archivos/styles.css', async (req, res) => {
  try {
    const rutaCSS = path.join(__dirname, 'styles.css');
    const contenido = await fs.readFile(rutaCSS, 'utf8');
    res.type('text/css').send(contenido);
  } catch (error) {
    console.error('Error al leer CSS:', error);
    res.status(500).json({ success: false, error: 'Error al cargar CSS' });
  }
});

// Guardar archivo CSS
app.put('/api/archivos/styles.css', async (req, res) => {
  try {
    const contenido = req.body.toString();
    const rutaCSS = path.join(__dirname, 'styles.css');
    
    const rutaBackup = path.join(__dirname, `styles.backup.${Date.now()}.css`);
    try {
      await fs.copyFile(rutaCSS, rutaBackup);
    } catch (e) {}
    
    await fs.writeFile(rutaCSS, contenido, 'utf8');
    
    console.log(`🎨 CEO actualizó estilos CSS`);
    
    res.json({ 
      success: true, 
      mensaje: 'Estilos guardados correctamente' 
    });
  } catch (error) {
    console.error('Error al guardar CSS:', error);
    res.status(500).json({ success: false, error: 'Error al guardar' });
  }
});

// Obtener archivo JavaScript
app.get('/api/archivos/:archivo.js', async (req, res) => {
  try {
    const archivo = req.params.archivo;
    const rutaJS = path.join(__dirname, `${archivo}.js`);
    const contenido = await fs.readFile(rutaJS, 'utf8');
    res.type('application/javascript').send(contenido);
  } catch (error) {
    console.error('Error al leer JS:', error);
    res.status(500).json({ success: false, error: 'Error al cargar código' });
  }
});

// Guardar archivo JavaScript
app.put('/api/archivos/:archivo.js', async (req, res) => {
  try {
    const archivo = req.params.archivo;
    const contenido = req.body.toString();
    const rutaJS = path.join(__dirname, `${archivo}.js`);
    
    const rutaBackup = path.join(__dirname, `${archivo}.backup.${Date.now()}.js`);
    try {
      await fs.copyFile(rutaJS, rutaBackup);
    } catch (e) {}
    
    await fs.writeFile(rutaJS, contenido, 'utf8');
    
    console.log(`💻 CEO actualizó ${archivo}.js`);
    
    res.json({ 
      success: true, 
      mensaje: 'Código guardado correctamente',
      nota: 'Reinicia el servidor para aplicar cambios en server.js'
    });
  } catch (error) {
    console.error('Error al guardar JS:', error);
    res.status(500).json({ success: false, error: 'Error al guardar' });
  }
});

// ========================================
// CEO MASTER PANEL - MULTIMEDIA
// ========================================

// Listar multimedia por tipo
app.get('/api/multimedia/:tipo', async (req, res) => {
  const { tipo } = req.params;
  
  try {
    const carpeta = path.join(__dirname, 'fotos-perfil');
    const archivos = await fs.readdir(carpeta);
    
    let archivosFiltrados = [];
    
    for (const archivo of archivos) {
      const rutaCompleta = path.join(carpeta, archivo);
      const stats = await fs.stat(rutaCompleta);
      
      if (stats.isFile()) {
        let incluir = false;
        let propietario = 'Desconocido';
        
        if (tipo === 'comercios' && archivo.includes('comercio')) {
          incluir = true;
          propietario = archivo.split('_')[0] || 'Comercio';
        } else if (tipo === 'repartidores' && archivo.includes('repartidor')) {
          incluir = true;
          propietario = archivo.split('_')[0] || 'Repartidor';
        } else if (tipo === 'productos' && archivo.includes('producto')) {
          incluir = true;
          propietario = archivo.split('_')[0] || 'Producto';
        } else if (tipo === 'videos' && (archivo.endsWith('.mp4') || archivo.endsWith('.webm'))) {
          incluir = true;
          propietario = 'Video';
        }
        
        if (incluir) {
          archivosFiltrados.push({
            id: archivo,
            nombre: archivo,
            tipo: archivo.match(/\.(mp4|webm)$/) ? 'video' : 'imagen',
            ruta: `/fotos-perfil/${archivo}`,
            propietario,
            fecha: stats.mtime,
            tamano: `${(stats.size / 1024).toFixed(1)} KB`,
            activo: true
          });
        }
      }
    }
    
    res.json({ success: true, archivos: archivosFiltrados });
  } catch (error) {
    console.error('Error al listar multimedia:', error);
    res.json({ success: false, archivos: [] });
  }
});

// Eliminar archivo multimedia
app.delete('/api/multimedia/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const rutaArchivo = path.join(__dirname, 'fotos-perfil', id);
    await fs.unlink(rutaArchivo);
    
    res.json({ success: true, mensaje: 'Archivo eliminado' });
  } catch (error) {
    console.error('Error al eliminar multimedia:', error);
    res.json({ success: false, mensaje: 'Error al eliminar' });
  }
});

// ========================================
// CEO MASTER PANEL - CATEGORÍAS
// ========================================

app.patch('/api/categorias/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, icono, color } = req.body;
  
  try {
    const carpetas = [
      'servicios-prioridad', 'servicios-alimentacion', 'servicios-salud',
      'servicios-bazar', 'servicios-indumentaria', 'servicios-kiosco', 'servicios-otros'
    ];
    
    let comerciosActualizados = 0;
    
    for (const carpeta of carpetas) {
      const rutaCarpeta = path.join(__dirname, carpeta);
      
      try {
        const archivos = await fs.readdir(rutaCarpeta);
        
        for (const archivo of archivos) {
          if (archivo.endsWith('.json')) {
            const rutaArchivo = path.join(rutaCarpeta, archivo);
            const contenido = await fs.readFile(rutaArchivo, 'utf-8');
            const comercio = JSON.parse(contenido);
            
            if (comercio.categoria === id) {
              comercio.categoriaInfo = { nombre, icono, color };
              await fs.writeFile(rutaArchivo, JSON.stringify(comercio, null, 2), 'utf-8');
              comerciosActualizados++;
            }
          }
        }
      } catch (error) {}
    }
    
    res.json({ success: true, comerciosActualizados });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ success: false });
  }
});

// ========================================
// CEO MASTER PANEL - SUSPENSIONES
// ========================================

app.get('/api/suspensiones', async (req, res) => {
  try {
    const rutaSuspensiones = path.join(__dirname, 'suspensiones');
    
    try {
      await fs.mkdir(rutaSuspensiones, { recursive: true });
    } catch {}
    
    const archivos = await fs.readdir(rutaSuspensiones);
    const suspendidos = [];
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const rutaArchivo = path.join(rutaSuspensiones, archivo);
        const contenido = await fs.readFile(rutaArchivo, 'utf-8');
        suspendidos.push(JSON.parse(contenido));
      }
    }
    
    res.json({ success: true, suspendidos });
  } catch (error) {
    console.error('Error al cargar suspensiones:', error);
    res.json({ success: false, suspendidos: [] });
  }
});

app.post('/api/suspensiones', async (req, res) => {
  const { id, tipo, motivo, temporal, fechaReactivacion } = req.body;
  
  try {
    let usuario = null;
    let rutaUsuario = '';
    
    if (tipo === 'comercio') {
      const carpetas = [
        'servicios-prioridad', 'servicios-alimentacion', 'servicios-salud',
        'servicios-bazar', 'servicios-indumentaria', 'servicios-kiosco', 'servicios-otros'
      ];
      
      for (const carpeta of carpetas) {
        const ruta = path.join(__dirname, carpeta, `${id}.json`);
        try {
          const contenido = await fs.readFile(ruta, 'utf-8');
          usuario = JSON.parse(contenido);
          rutaUsuario = ruta;
          break;
        } catch {}
      }
    } else if (tipo === 'repartidor') {
      rutaUsuario = path.join(__dirname, 'registros', `repartidor_${id}.json`);
      try {
        const contenido = await fs.readFile(rutaUsuario, 'utf-8');
        usuario = JSON.parse(contenido);
      } catch {}
    }
    
    if (!usuario) {
      return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });
    }
    
    usuario.activo = false;
    usuario.suspendido = true;
    usuario.motivoSuspension = motivo;
    await fs.writeFile(rutaUsuario, JSON.stringify(usuario, null, 2), 'utf-8');
    
    const suspension = {
      id, tipo,
      nombre: usuario.nombre || usuario.nombreComercio,
      motivo, temporal, fechaReactivacion,
      fechaSuspension: new Date().toISOString()
    };
    
    const rutaSuspension = path.join(__dirname, 'suspensiones', `${id}.json`);
    await fs.mkdir(path.join(__dirname, 'suspensiones'), { recursive: true });
    await fs.writeFile(rutaSuspension, JSON.stringify(suspension, null, 2), 'utf-8');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error al suspender:', error);
    res.status(500).json({ success: false });
  }
});

app.delete('/api/suspensiones/:id', async (req, res) => {
  const { id } = req.params;
  const { tipo } = req.body;
  
  try {
    if (tipo === 'comercio') {
      const carpetas = [
        'servicios-prioridad', 'servicios-alimentacion', 'servicios-salud',
        'servicios-bazar', 'servicios-indumentaria', 'servicios-kiosco', 'servicios-otros'
      ];
      
      for (const carpeta of carpetas) {
        const ruta = path.join(__dirname, carpeta, `${id}.json`);
        try {
          const contenido = await fs.readFile(ruta, 'utf-8');
          const usuario = JSON.parse(contenido);
          usuario.activo = true;
          usuario.suspendido = false;
          delete usuario.motivoSuspension;
          await fs.writeFile(ruta, JSON.stringify(usuario, null, 2), 'utf-8');
          break;
        } catch {}
      }
    } else if (tipo === 'repartidor') {
      const rutaUsuario = path.join(__dirname, 'registros', `repartidor_${id}.json`);
      try {
        const contenido = await fs.readFile(rutaUsuario, 'utf-8');
        const usuario = JSON.parse(contenido);
        usuario.activo = true;
        usuario.suspendido = false;
        delete usuario.motivoSuspension;
        await fs.writeFile(rutaUsuario, JSON.stringify(usuario, null, 2), 'utf-8');
      } catch {}
    }
    
    const rutaSuspension = path.join(__dirname, 'suspensiones', `${id}.json`);
    await fs.unlink(rutaSuspension);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error al reactivar:', error);
    res.status(500).json({ success: false });
  }
});

// ========================================
// CEO MASTER PANEL - SOLICITUDES
// ========================================

app.get('/api/solicitudes/tienda', async (req, res) => {
  try {
    const rutaSolicitudes = path.join(__dirname, 'solicitudes-tienda');
    
    try {
      await fs.mkdir(rutaSolicitudes, { recursive: true });
    } catch {}
    
    const archivos = await fs.readdir(rutaSolicitudes);
    const solicitudes = [];
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const rutaArchivo = path.join(rutaSolicitudes, archivo);
        const contenido = await fs.readFile(rutaArchivo, 'utf-8');
        const solicitud = JSON.parse(contenido);
        if (solicitud.estado === 'pendiente' || !solicitud.estado) {
          solicitudes.push(solicitud);
        }
      }
    }
    
    res.json({ success: true, solicitudes });
  } catch (error) {
    console.error('Error al cargar solicitudes de tienda:', error);
    res.json({ success: false, solicitudes: [] });
  }
});

app.get('/api/solicitudes/publicidad', async (req, res) => {
  try {
    const rutaSolicitudes = path.join(__dirname, 'solicitudes-publicidad');
    
    try {
      await fs.mkdir(rutaSolicitudes, { recursive: true });
    } catch {}
    
    const archivos = await fs.readdir(rutaSolicitudes);
    const solicitudes = [];
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const rutaArchivo = path.join(rutaSolicitudes, archivo);
        const contenido = await fs.readFile(rutaArchivo, 'utf-8');
        const solicitud = JSON.parse(contenido);
        if (solicitud.estado === 'pendiente' || !solicitud.estado) {
          solicitudes.push(solicitud);
        }
      }
    }
    
    res.json({ success: true, solicitudes });
  } catch (error) {
    console.error('Error al cargar solicitudes de publicidad:', error);
    res.json({ success: false, solicitudes: [] });
  }
});

app.post('/api/solicitudes/:tipo/:id/aprobar', async (req, res) => {
  const { tipo, id } = req.params;
  
  try {
    const carpeta = tipo === 'tienda' ? 'solicitudes-tienda' : 'solicitudes-publicidad';
    const rutaSolicitud = path.join(__dirname, carpeta, `${id}.json`);
    
    const contenido = await fs.readFile(rutaSolicitud, 'utf-8');
    const solicitud = JSON.parse(contenido);
    
    solicitud.estado = 'aprobado';
    solicitud.fechaAprobacion = new Date().toISOString();
    
    await fs.writeFile(rutaSolicitud, JSON.stringify(solicitud, null, 2), 'utf-8');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    res.status(500).json({ success: false });
  }
});

app.post('/api/solicitudes/:tipo/:id/rechazar', async (req, res) => {
  const { tipo, id } = req.params;
  const { motivo } = req.body;
  
  try {
    const carpeta = tipo === 'tienda' ? 'solicitudes-tienda' : 'solicitudes-publicidad';
    const rutaSolicitud = path.join(__dirname, carpeta, `${id}.json`);
    
    const contenido = await fs.readFile(rutaSolicitud, 'utf-8');
    const solicitud = JSON.parse(contenido);
    
    solicitud.estado = 'rechazado';
    solicitud.motivoRechazo = motivo;
    solicitud.fechaRechazo = new Date().toISOString();
    
    await fs.writeFile(rutaSolicitud, JSON.stringify(solicitud, null, 2), 'utf-8');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    res.status(500).json({ success: false });
  }
});

// ========================================
// CEO MASTER PANEL - REGISTROS
// ========================================

app.get('/api/registros/:tipo', async (req, res) => {
  const { tipo } = req.params;
  
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

// Crear nuevo comercio desde CEO panel
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

// ========================================
// 🚫 MANEJADOR DE RUTAS NO ENCONTRADAS (DEBE SER EL ÚLTIMO)
// ========================================
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ success: false, error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
  } else {
    // Para otras rutas, intentar servir archivos estáticos o 404
    next();
  }
});
