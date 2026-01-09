// ====================================
// 📦 YAvoy v3.1 - MIGRATION SCRIPT
// ====================================
// Migración de JSON a Base de Datos
// Ejecutar UNA VEZ antes del despliegue

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { initDatabase, db, closeDatabase } = require('./src/database');

const REGISTROS_DIR = path.join(__dirname, 'registros');

// ========================================
// 🔧 UTILIDADES
// ========================================
async function leerArchivoJSON(rutaCompleta) {
  try {
    const contenido = await fs.readFile(rutaCompleta, 'utf-8');
    return JSON.parse(contenido);
  } catch (error) {
    console.error(`❌ Error leyendo ${rutaCompleta}:`, error.message);
    return null;
  }
}

async function listarArchivosEnCarpeta(carpeta, patron = null) {
  try {
    const archivos = await fs.readdir(carpeta);
    return patron 
      ? archivos.filter(archivo => archivo.includes(patron) && archivo.endsWith('.json'))
      : archivos.filter(archivo => archivo.endsWith('.json'));
  } catch (error) {
    console.error(`❌ Error listando carpeta ${carpeta}:`, error.message);
    return [];
  }
}

// ========================================
// 📊 MIGRACIÓN DE COMERCIOS
// ========================================
async function migrarComercios() {
  console.log('\n🏪 MIGRANDO COMERCIOS...');
  
  const categoriasComercio = [
    'servicios-prioridad',
    'servicios-alimentacion',
    'servicios-salud',
    'servicios-bazar',
    'servicios-indumentaria',
    'servicios-kiosco',
    'servicios-otros'
  ];
  
  let totalMigrados = 0;
  let errores = 0;
  
  for (const categoria of categoriasComercio) {
    const rutaCarpeta = path.join(REGISTROS_DIR, '..', categoria);
    
    try {
      const archivos = await listarArchivosEnCarpeta(rutaCarpeta);
      
      for (const archivo of archivos) {
        const rutaArchivo = path.join(rutaCarpeta, archivo);
        const datos = await leerArchivoJSON(rutaArchivo);
        
        if (!datos) {
          errores++;
          continue;
        }
        
        // Normalizar datos
        const comercio = {
          id: datos.id,
          nombre: datos.nombre || datos.nombreComercio,
          email: datos.email || null,
          telefono: datos.telefono || datos.phone || null,
          categoria: datos.categoria || categoria.replace('servicios-', ''),
          direccion: datos.direccion || datos.address || null,
          coordenadas: datos.coordenadas || datos.location || null,
          horario: datos.horario || datos.horarioAtencion || null,
          foto_perfil: datos.fotoPerfil || datos.foto || null,
          activo: datos.activo !== false,
          verificado: datos.verificado || false,
          calificacion: parseFloat(datos.calificacion || 0),
          total_calificaciones: parseInt(datos.totalCalificaciones || 0),
          metadata: {
            descripcion: datos.descripcion,
            productos: datos.productos,
            fotos: datos.fotos,
            ...datos.metadata
          },
          fecha_registro: datos.fechaRegistro ? new Date(datos.fechaRegistro) : new Date()
        };
        
        try {
          // Verificar si ya existe
          const existe = await db.findOne('comercios', { id: comercio.id });
          
          if (existe) {
            await db.update('comercios', { id: comercio.id }, comercio);
            console.log(`  ✅ Actualizado: ${comercio.nombre} (${comercio.id})`);
          } else {
            await db.insert('comercios', comercio);
            console.log(`  ✅ Insertado: ${comercio.nombre} (${comercio.id})`);
          }
          
          totalMigrados++;
        } catch (dbError) {
          console.error(`  ❌ Error DB para ${comercio.id}:`, dbError.message);
          errores++;
        }
      }
    } catch (error) {
      console.error(`❌ Error procesando categoría ${categoria}:`, error.message);
    }
  }
  
  console.log(`\n📊 Comercios: ${totalMigrados} migrados, ${errores} errores`);
  return { migrados: totalMigrados, errores };
}

// ========================================
// 🏍️ MIGRACIÓN DE REPARTIDORES
// ========================================
async function migrarRepartidores() {
  console.log('\n🏍️ MIGRANDO REPARTIDORES...');
  
  const rutaCarpeta = path.join(REGISTROS_DIR, 'repartidores');
  let totalMigrados = 0;
  let errores = 0;
  
  try {
    const archivos = await listarArchivosEnCarpeta(rutaCarpeta);
    
    for (const archivo of archivos) {
      const rutaArchivo = path.join(rutaCarpeta, archivo);
      const datos = await leerArchivoJSON(rutaArchivo);
      
      if (!datos) {
        errores++;
        continue;
      }
      
      // Normalizar datos
      const repartidor = {
        id: datos.id,
        nombre: datos.nombre,
        email: datos.email || null,
        telefono: datos.telefono || datos.phone,
        dni: datos.dni || null,
        vehiculo: datos.vehiculo || datos.tipoVehiculo || null,
        foto_perfil: datos.fotoPerfil || datos.foto || null,
        foto_dni: datos.fotoDNI || datos.fotoDocumento || null,
        coordenadas_actuales: datos.coordenadas || datos.ubicacion || null,
        activo: datos.activo !== false,
        online: false, // Por defecto offline al migrar
        verificado: datos.verificado || false,
        calificacion: parseFloat(datos.calificacion || 0),
        total_entregas: parseInt(datos.totalEntregas || 0),
        entregas_completadas: parseInt(datos.entregasCompletadas || 0),
        entregas_canceladas: parseInt(datos.entregasCanceladas || 0),
        metadata: {
          horarios: datos.horarios,
          zonas: datos.zonas,
          ...datos.metadata
        },
        fecha_registro: datos.fechaRegistro ? new Date(datos.fechaRegistro) : new Date()
      };
      
      try {
        const existe = await db.findOne('repartidores', { id: repartidor.id });
        
        if (existe) {
          await db.update('repartidores', { id: repartidor.id }, repartidor);
          console.log(`  ✅ Actualizado: ${repartidor.nombre} (${repartidor.id})`);
        } else {
          await db.insert('repartidores', repartidor);
          console.log(`  ✅ Insertado: ${repartidor.nombre} (${repartidor.id})`);
        }
        
        totalMigrados++;
      } catch (dbError) {
        console.error(`  ❌ Error DB para ${repartidor.id}:`, dbError.message);
        errores++;
      }
    }
  } catch (error) {
    console.error('❌ Error procesando repartidores:', error.message);
  }
  
  console.log(`\n📊 Repartidores: ${totalMigrados} migrados, ${errores} errores`);
  return { migrados: totalMigrados, errores };
}

// ========================================
// 👥 MIGRACIÓN DE CLIENTES
// ========================================
async function migrarClientes() {
  console.log('\n👥 MIGRANDO CLIENTES...');
  
  const rutaCarpeta = path.join(REGISTROS_DIR, 'clientes');
  let totalMigrados = 0;
  let errores = 0;
  
  try {
    const archivos = await listarArchivosEnCarpeta(rutaCarpeta);
    
    for (const archivo of archivos) {
      const rutaArchivo = path.join(rutaCarpeta, archivo);
      const datos = await leerArchivoJSON(rutaArchivo);
      
      if (!datos) {
        errores++;
        continue;
      }
      
      const cliente = {
        id: datos.id,
        nombre: datos.nombre,
        email: datos.email || null,
        telefono: datos.telefono || datos.phone,
        foto_perfil: datos.fotoPerfil || datos.foto || null,
        direccion_favorita: datos.direccionFavorita || datos.direccion || null,
        coordenadas_favoritas: datos.coordenadasFavoritas || datos.coordenadas || null,
        activo: datos.activo !== false,
        total_pedidos: parseInt(datos.totalPedidos || 0),
        metadata: datos.metadata || {},
        fecha_registro: datos.fechaRegistro ? new Date(datos.fechaRegistro) : new Date()
      };
      
      try {
        const existe = await db.findOne('clientes', { id: cliente.id });
        
        if (existe) {
          await db.update('clientes', { id: cliente.id }, cliente);
          console.log(`  ✅ Actualizado: ${cliente.nombre} (${cliente.id})`);
        } else {
          await db.insert('clientes', cliente);
          console.log(`  ✅ Insertado: ${cliente.nombre} (${cliente.id})`);
        }
        
        totalMigrados++;
      } catch (dbError) {
        console.error(`  ❌ Error DB para ${cliente.id}:`, dbError.message);
        errores++;
      }
    }
  } catch (error) {
    console.error('❌ Error procesando clientes:', error.message);
  }
  
  console.log(`\n📊 Clientes: ${totalMigrados} migrados, ${errores} errores`);
  return { migrados: totalMigrados, errores };
}

// ========================================
// 📦 MIGRACIÓN DE PEDIDOS
// ========================================
async function migrarPedidos() {
  console.log('\n📦 MIGRANDO PEDIDOS...');
  
  const rutaCarpeta = path.join(REGISTROS_DIR, 'pedidos');
  let totalMigrados = 0;
  let errores = 0;
  
  try {
    const archivos = await listarArchivosEnCarpeta(rutaCarpeta);
    
    for (const archivo of archivos) {
      const rutaArchivo = path.join(rutaCarpeta, archivo);
      const datos = await leerArchivoJSON(rutaArchivo);
      
      if (!datos) {
        errores++;
        continue;
      }
      
      const pedido = {
        id: datos.id,
        comercio_id: datos.comercioId || datos.comercio_id || null,
        cliente_id: datos.clienteId || datos.cliente_id || null,
        repartidor_id: datos.repartidorId || datos.repartidor_id || null,
        estado: datos.estado || 'pendiente',
        monto: parseFloat(datos.monto || datos.total || 0),
        comision: parseFloat(datos.comision || 0),
        direccion_entrega: datos.direccionEntrega || datos.direccion,
        coordenadas_entrega: datos.coordenadasEntrega || datos.coordenadas,
        coordenadas_comercio: datos.coordenadasComercio || null,
        distancia_km: parseFloat(datos.distancia || 0),
        tiempo_estimado_minutos: parseInt(datos.tiempoEstimado || datos.eta || 0),
        detalles: datos.detalles || datos.productos || {},
        propina: parseFloat(datos.propina || 0),
        calificacion_repartidor: datos.calificacionRepartidor || null,
        calificacion_comercio: datos.calificacionComercio || null,
        comentario_cliente: datos.comentario || null,
        metadata: datos.metadata || {},
        fecha_creacion: datos.fechaCreacion ? new Date(datos.fechaCreacion) : new Date(),
        fecha_aceptacion: datos.fechaAceptacion ? new Date(datos.fechaAceptacion) : null,
        fecha_entrega: datos.fechaEntrega ? new Date(datos.fechaEntrega) : null
      };
      
      try {
        const existe = await db.findOne('pedidos', { id: pedido.id });
        
        if (existe) {
          await db.update('pedidos', { id: pedido.id }, pedido);
          console.log(`  ✅ Actualizado: Pedido ${pedido.id}`);
        } else {
          await db.insert('pedidos', pedido);
          console.log(`  ✅ Insertado: Pedido ${pedido.id}`);
        }
        
        totalMigrados++;
      } catch (dbError) {
        console.error(`  ❌ Error DB para pedido ${pedido.id}:`, dbError.message);
        errores++;
      }
    }
  } catch (error) {
    console.error('❌ Error procesando pedidos:', error.message);
  }
  
  console.log(`\n📊 Pedidos: ${totalMigrados} migrados, ${errores} errores`);
  return { migrados: totalMigrados, errores };
}

// ========================================
// 🚀 MAIN - EJECUTAR MIGRACIÓN COMPLETA
// ========================================
async function ejecutarMigracionCompleta() {
  console.log('═══════════════════════════════════════');
  console.log('🚀 YAVOY v3.1 - MIGRACIÓN JSON → DB');
  console.log('═══════════════════════════════════════');
  console.log(`Tipo de DB: ${process.env.DB_TYPE || 'postgresql'}`);
  console.log(`Directorio de datos: ${REGISTROS_DIR}`);
  console.log('═══════════════════════════════════════\n');
  
  try {
    // Inicializar base de datos
    await initDatabase();
    console.log('✅ Base de datos inicializada\n');
    
    // Ejecutar migraciones
    const resultados = {
      comercios: await migrarComercios(),
      repartidores: await migrarRepartidores(),
      clientes: await migrarClientes(),
      pedidos: await migrarPedidos()
    };
    
    // Resumen final
    console.log('\n═══════════════════════════════════════');
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('═══════════════════════════════════════');
    
    let totalMigrados = 0;
    let totalErrores = 0;
    
    for (const [tipo, resultado] of Object.entries(resultados)) {
      console.log(`${tipo.toUpperCase()}: ${resultado.migrados} migrados, ${resultado.errores} errores`);
      totalMigrados += resultado.migrados;
      totalErrores += resultado.errores;
    }
    
    console.log('───────────────────────────────────────');
    console.log(`TOTAL: ${totalMigrados} registros migrados`);
    console.log(`ERRORES: ${totalErrores}`);
    console.log('═══════════════════════════════════════');
    
    if (totalErrores === 0) {
      console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n');
    } else {
      console.log('\n⚠️ MIGRACIÓN COMPLETADA CON ERRORES\n');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN MIGRACIÓN:', error);
  } finally {
    await closeDatabase();
    console.log('✅ Conexión a base de datos cerrada\n');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarMigracionCompleta()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = {
  migrarComercios,
  migrarRepartidores,
  migrarClientes,
  migrarPedidos,
  ejecutarMigracionCompleta
};
