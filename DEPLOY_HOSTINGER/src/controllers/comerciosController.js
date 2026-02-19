// ========================================
// CONTROLADOR DE COMERCIOS - YAvoy v3.1
// ========================================
// Gestión completa de comercios: registro, actualización, fotos, solicitudes

const fs = require('fs').promises;
const path = require('path');

// Directorio base para todos los registros
const BASE_DIR = path.join(__dirname, '../../registros');

// ========================================
// FUNCIÓN AUXILIAR: Crear informe CEO
// ========================================
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

// ========================================
// CONTROLADORES
// ========================================

/**
 * Guardar nuevo comercio
 * POST /api/guardar-comercio
 */
exports.guardarComercio = async (req, res) => {
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
};

/**
 * Listar comercios (todos o por carpeta)
 * GET /api/listar-comercios?carpeta=servicios-alimentacion
 */
exports.listarComercios = async (req, res) => {
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
};

/**
 * Obtener comercio individual por ID
 * GET /api/comercio/:id
 */
exports.obtenerComercioPorId = async (req, res) => {
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
};

/**
 * Actualizar datos del comercio
 * PATCH /api/comercio/:id
 */
exports.actualizarComercio = async (req, res) => {
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
};

/**
 * Subir foto de perfil del comercio
 * POST /api/comercio/:id/foto-perfil
 */
exports.actualizarFotoPerfil = async (req, res) => {
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
};

/**
 * Subir fotos de productos/servicios del comercio
 * POST /api/comercio/:id/fotos-productos
 */
exports.subirFotosProductos = async (req, res) => {
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

    const nuevaFoto = {
      id: `foto_${timestamp}`,
      url: urlFoto,
      precio: precio || null,
      enlace: enlace || null,
      descripcion: descripcion || null,
      fechaCreacion: new Date().toISOString()
    };

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
};

/**
 * Eliminar foto de producto del comercio
 * DELETE /api/comercio/:id/fotos-productos/:fotoId
 */
exports.eliminarFotoProducto = async (req, res) => {
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
                const rutaArchivo = path.join(__dirname, '../..', foto.url);
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
};

/**
 * Actualizar estado activo/inactivo del comercio
 * PATCH /api/comercio/:id/estado
 */
exports.actualizarEstadoComercio = async (req, res) => {
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
};

/**
 * Obtener comercios activos/inactivos
 * GET /api/comercios/por-estado?activo=true
 */
exports.obtenerComerciosPorEstado = async (req, res) => {
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
};

/**
 * Solicitar creación de tienda premium
 * POST /api/comercio/solicitar-tienda
 */
exports.solicitarTienda = async (req, res) => {
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
};

/**
 * Solicitar publicidad
 * POST /api/comercio/solicitar-publicidad
 */
exports.solicitarPublicidad = async (req, res) => {
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
};

/**
 * Obtener solicitudes de tienda (para admin)
 * GET /api/admin/solicitudes-tienda
 */
exports.obtenerSolicitudesTienda = async (req, res) => {
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
};

/**
 * Obtener solicitudes de publicidad (para admin)
 * GET /api/admin/solicitudes-publicidad
 */
exports.obtenerSolicitudesPublicidad = async (req, res) => {
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
};
