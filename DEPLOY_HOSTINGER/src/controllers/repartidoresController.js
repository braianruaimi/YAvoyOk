// ========================================
// CONTROLADOR DE REPARTIDORES - YAvoy v3.1
// ========================================
// Extracción completa de las funciones del módulo Repartidores
// Mantiene la lógica 100% idéntica al server.js original

const fs = require('fs').promises;
const path = require('path');

// Constantes y arrays en memoria (compartidos con server.js)
const BASE_DIR = path.join(__dirname, '../../registros');

// Variables globales (compartidas con server.js mediante module.exports)
let repartidores = [];
let emailTransporter = null; // Se configura en server.js
let io = null; // Socket.io instance

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Notificar a un repartidor específico vía Socket.IO
 */
function notificarRepartidor(repartidorId, evento, data) {
  if (!io) return;
  io.to(`repartidor-${repartidorId}`).emit(evento, data);
  console.log(`🔔 Notificación enviada a repartidor ${repartidorId}:`, evento);
}

/**
 * Guardar documentos del repartidor en carpeta CEO para verificación
 */
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

/**
 * Crear informe CEO para repartidor
 */
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

/**
 * Actualizar informe CEO de repartidor
 */
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

/**
 * Guardar repartidores en archivos
 */
async function guardarRepartidores() {
  try {
    const repartidoresDir = path.join(BASE_DIR, 'repartidores');
    for (const repartidor of repartidores) {
      const nombreLimpio = repartidor.nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const filename = `repartidor_${nombreLimpio}_${repartidor.id}.json`;
      const filePath = path.join(repartidoresDir, filename);
      await fs.writeFile(filePath, JSON.stringify(repartidor, null, 2));
    }
    console.log('✓ Repartidores guardados en archivos');
  } catch (error) {
    console.error('Error al guardar repartidores:', error);
  }
}

// ============================================
// FUNCIONES EXPORTADAS (CONTROLLERS)
// ============================================

/**
 * Registrar nuevo repartidor
 * POST /api/repartidores
 */
exports.registrarRepartidor = async (req, res) => {
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

      // Enviar email solo si está configurado
      if (emailTransporter) {
        try {
          await emailTransporter.sendMail(mailOptions);
          console.log(`✅ Email de verificación enviado a ${email}`);
        } catch (emailErr) {
          console.log(`⚠️ No se pudo enviar email (no crítico): ${emailErr.message}`);
        }
      }
      
      // Enviar notificación a YaVoy sobre el nuevo registro
      if (emailTransporter) {
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
};

/**
 * Listar repartidores disponibles
 * GET /api/repartidores
 */
exports.listarRepartidores = (req, res) => {
  const { disponible } = req.query;
  
  let repartidoresFiltrados = [...repartidores];
  
  if (disponible !== undefined) {
    repartidoresFiltrados = repartidoresFiltrados.filter(r => 
      r.disponible === (disponible === 'true')
    );
  }
  
  res.json({ success: true, repartidores: repartidoresFiltrados, total: repartidoresFiltrados.length });
};

/**
 * Actualizar ubicación del repartidor (para seguimiento en tiempo real)
 * PATCH /api/repartidores/:id/ubicacion
 * IMPORTANTE: Usa lat/lng (DECIMAL) en lugar de POINT de PostgreSQL
 */
exports.actualizarUbicacion = (req, res) => {
  const { lat, lng } = req.body;
  const repartidor = repartidores.find(r => r.id === req.params.id);
  
  if (!repartidor) {
    return res.status(404).json({ success: false, error: 'Repartidor no encontrado' });
  }
  
  // Actualizar ubicación usando DECIMAL (lat, lng) - Compatible con MySQL
  repartidor.ubicacion = { lat, lng, timestamp: new Date().toISOString() };
  
  res.json({ success: true, repartidor });
};

/**
 * Configurar credenciales de pago del repartidor
 * El repartidor vincula su cuenta de Mercado Pago
 * POST /api/repartidores/:id/configurar-pago
 */
exports.configurarPago = async (req, res) => {
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
};

/**
 * Aprobar verificación de repartidor (CEO)
 * POST /api/repartidores/:id/aprobar-verificacion
 */
exports.aprobarVerificacion = async (req, res) => {
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
};

/**
 * Rechazar verificación de repartidor (CEO)
 * POST /api/repartidores/:id/rechazar-verificacion
 */
exports.rechazarVerificacion = async (req, res) => {
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
};

/**
 * Actualizar disponibilidad del repartidor
 * PATCH /api/repartidores/:id/disponibilidad
 */
exports.actualizarDisponibilidad = async (req, res) => {
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
};

/**
 * Actualizar perfil del repartidor
 * PATCH /api/repartidores/:id/perfil
 */
exports.actualizarPerfil = async (req, res) => {
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
};

/**
 * Subir foto de perfil del repartidor
 * POST /api/repartidores/:id/foto-perfil
 */
exports.actualizarFotoPerfil = async (req, res) => {
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
};

// ============================================
// INICIALIZACIÓN DEL MÓDULO
// ============================================

/**
 * Inicializar referencias compartidas
 * Debe llamarse desde server.js al arrancar
 */
exports.init = function(repartidoresArray, emailTransporterInstance, ioInstance) {
  repartidores = repartidoresArray;
  emailTransporter = emailTransporterInstance;
  io = ioInstance;
  console.log('✅ RepartidoresController inicializado');
};
