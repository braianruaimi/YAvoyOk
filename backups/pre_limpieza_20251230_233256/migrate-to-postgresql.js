/**
 * ========================================
 * YAvoy v3.1 - Script de Migración a PostgreSQL
 * ========================================
 * Descripción: Migra todos los archivos JSON de registros/ y servicios-*/ a PostgreSQL
 * Fecha: 21 de diciembre de 2025
 * 
 * USO:
 * 1. Configurar .env con credenciales de PostgreSQL
 * 2. Ejecutar schema: psql -U usuario -d yavoy_db -f database-schema.sql
 * 3. Ejecutar: node migrate-to-postgresql.js
 */

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// ============================================
// CONFIGURACIÓN
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

// Estadísticas de migración
const stats = {
    users: { total: 0, exitosos: 0, errores: 0 },
    delivery_persons: { total: 0, exitosos: 0, errores: 0 },
    shops: { total: 0, exitosos: 0, errores: 0 },
    orders: { total: 0, exitosos: 0, errores: 0 },
    errores: []
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Leer archivo JSON de forma segura
 */
async function leerJSON(rutaArchivo) {
    try {
        const contenido = await fs.readFile(rutaArchivo, 'utf-8');
        return JSON.parse(contenido);
    } catch (error) {
        console.error(`❌ Error leyendo ${rutaArchivo}:`, error.message);
        return null;
    }
}

/**
 * Listar archivos recursivamente en un directorio
 */
async function listarArchivosRecursivo(directorio, extension = '.json') {
    const archivos = [];
    
    try {
        const items = await fs.readdir(directorio, { withFileTypes: true });
        
        for (const item of items) {
            const rutaCompleta = path.join(directorio, item.name);
            
            if (item.isDirectory()) {
                const subArchivos = await listarArchivosRecursivo(rutaCompleta, extension);
                archivos.push(...subArchivos);
            } else if (item.isFile() && item.name.endsWith(extension)) {
                archivos.push(rutaCompleta);
            }
        }
    } catch (error) {
        console.warn(`⚠️ No se pudo acceder a ${directorio}:`, error.message);
    }
    
    return archivos;
}

/**
 * Normalizar timestamp a formato PostgreSQL
 */
function normalizarTimestamp(timestamp) {
    if (!timestamp) return null;
    
    const fecha = new Date(timestamp);
    return isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

/**
 * Extraer ID limpio de nombre de archivo
 */
function extraerIdDeArchivo(nombreArchivo) {
    // Ejemplos: "comercio_astra2_2025-12-04T07-08-37-227Z.json" -> "astra2"
    //           "repartidor_braian.json" -> "braian"
    //           "cliente_cesar.json" -> "cesar"
    
    const base = path.basename(nombreArchivo, '.json');
    const partes = base.split('_');
    
    if (partes.length >= 2) {
        return partes[1]; // Segundo elemento después del tipo
    }
    
    return base;
}

// ============================================
// MIGRACIÓN: USUARIOS (Clientes)
// ============================================
async function migrarClientes() {
    console.log('\n📋 Migrando CLIENTES...');
    
    const dirClientes = path.join(__dirname, 'registros', 'clientes');
    let archivos = [];
    
    try {
        archivos = await listarArchivosRecursivo(dirClientes);
        
        // Buscar también archivos individuales en registros/
        const archivosDirectos = await fs.readdir(path.join(__dirname, 'registros'));
        for (const archivo of archivosDirectos) {
            if (archivo.startsWith('cliente_') && archivo.endsWith('.json')) {
                archivos.push(path.join(__dirname, 'registros', archivo));
            }
        }
    } catch (error) {
        console.warn('⚠️ No se encontró directorio de clientes');
        return;
    }
    
    stats.users.total = archivos.length;
    console.log(`   Encontrados: ${archivos.length} archivos`);
    
    for (const archivo of archivos) {
        const datos = await leerJSON(archivo);
        if (!datos) {
            stats.users.errores++;
            continue;
        }
        
        try {
            // Si no tiene ID, usar nombre del archivo
            const userId = datos.id || extraerIdDeArchivo(archivo);
            
            const query = `
                INSERT INTO users (
                    id, email, nombre, apellido, whatsapp, tipo,
                    direccion_calle, direccion_barrio, direccion_ciudad, 
                    direccion_provincia, direccion_codigo_postal,
                    direccion_latitud, direccion_longitud, direccion_referencia,
                    activo, verificado, fecha_registro, ultima_conexion,
                    foto_perfil, metodo_pago_preferido, notificaciones_push,
                    total_pedidos, gasto_total
                ) VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9, $10, $11, $12, $13, $14,
                    $15, $16, $17, $18, $19, $20, $21, $22, $23
                )
                ON CONFLICT (id) DO UPDATE SET
                    email = EXCLUDED.email,
                    nombre = EXCLUDED.nombre,
                    apellido = EXCLUDED.apellido,
                    updated_at = NOW()
            `;
            
            const direccion = datos.direccion || {};
            
            await pool.query(query, [
                userId,
                datos.email || `${userId}@yavoy.app`,
                datos.nombre || 'Usuario',
                datos.apellido || '',
                datos.whatsapp || datos.telefono || '0000000000',
                datos.tipo || 'cliente',
                direccion.calle || null,
                direccion.barrio || null,
                direccion.ciudad || null,
                direccion.provincia || null,
                direccion.codigoPostal || direccion.codigo_postal || null,
                direccion.latitud || null,
                direccion.longitud || null,
                direccion.referencia || null,
                datos.activo !== false,
                datos.verificado || false,
                normalizarTimestamp(datos.fechaRegistro || datos.fecha_registro),
                normalizarTimestamp(datos.ultimaConexion || datos.ultima_conexion),
                datos.fotoPerfil || datos.foto_perfil || null,
                datos.metodoPagoPreferido || datos.metodo_pago_preferido || 'efectivo',
                datos.notificacionesPush !== false,
                datos.totalPedidos || datos.total_pedidos || 0,
                datos.gastoTotal || datos.gasto_total || 0
            ]);
            
            stats.users.exitosos++;
            process.stdout.write(`\r   ✅ Migrados: ${stats.users.exitosos}/${stats.users.total}`);
            
        } catch (error) {
            stats.users.errores++;
            stats.errores.push({
                tipo: 'cliente',
                archivo: path.basename(archivo),
                error: error.message
            });
        }
    }
    
    console.log(`\n   ✅ Completado: ${stats.users.exitosos} exitosos, ${stats.users.errores} errores`);
}

// ============================================
// MIGRACIÓN: REPARTIDORES
// ============================================
async function migrarRepartidores() {
    console.log('\n🛵 Migrando REPARTIDORES...');
    
    const dirRepartidores = path.join(__dirname, 'registros', 'repartidores');
    let archivos = [];
    
    try {
        archivos = await listarArchivosRecursivo(dirRepartidores);
        
        // Buscar también archivos individuales
        const archivosDirectos = await fs.readdir(path.join(__dirname, 'registros'));
        for (const archivo of archivosDirectos) {
            if (archivo.startsWith('repartidor_') && archivo.endsWith('.json')) {
                archivos.push(path.join(__dirname, 'registros', archivo));
            }
        }
    } catch (error) {
        console.warn('⚠️ No se encontró directorio de repartidores');
        return;
    }
    
    stats.delivery_persons.total = archivos.length;
    console.log(`   Encontrados: ${archivos.length} archivos`);
    
    for (const archivo of archivos) {
        const datos = await leerJSON(archivo);
        if (!datos) {
            stats.delivery_persons.errores++;
            continue;
        }
        
        try {
            const repartidorId = datos.id || extraerIdDeArchivo(archivo);
            
            // 1. Insertar como usuario primero
            const queryUser = `
                INSERT INTO users (
                    id, email, nombre, apellido, whatsapp, tipo,
                    direccion_calle, direccion_barrio, direccion_ciudad,
                    direccion_provincia, direccion_codigo_postal,
                    activo, verificado, fecha_registro
                ) VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9, $10, $11, $12, $13, $14
                )
                ON CONFLICT (id) DO UPDATE SET
                    tipo = 'repartidor',
                    updated_at = NOW()
            `;
            
            const direccion = datos.direccion || {};
            
            await pool.query(queryUser, [
                repartidorId,
                datos.email || `${repartidorId}@yavoy.app`,
                datos.nombre || 'Repartidor',
                datos.apellido || '',
                datos.whatsapp || datos.telefono || '0000000000',
                'repartidor',
                direccion.calle || null,
                direccion.barrio || null,
                direccion.ciudad || null,
                direccion.provincia || null,
                direccion.codigoPostal || direccion.codigo_postal || null,
                datos.activo !== false,
                datos.verificado || false,
                normalizarTimestamp(datos.fechaRegistro || datos.fecha_registro)
            ]);
            
            // 2. Insertar datos específicos de repartidor
            const queryDelivery = `
                INSERT INTO delivery_persons (
                    id, tipo_vehiculo, modelo_vehiculo, patente,
                    zona_operacion, disponible, premium,
                    rating, total_entregas, monto_ganado,
                    doc_dni, doc_licencia, doc_seguro, doc_vtv,
                    horarios_preferido, horarios_disponibilidad
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
                )
                ON CONFLICT (id) DO UPDATE SET
                    rating = EXCLUDED.rating,
                    total_entregas = EXCLUDED.total_entregas,
                    monto_ganado = EXCLUDED.monto_ganado,
                    updated_at = NOW()
            `;
            
            const documentos = datos.documentos || {};
            const horarios = datos.horarios || {};
            
            await pool.query(queryDelivery, [
                repartidorId,
                datos.tipoVehiculo || datos.tipo_vehiculo || null,
                datos.modeloVehiculo || datos.modelo_vehiculo || null,
                datos.patente || null,
                datos.zonaOperacion || datos.zona_operacion || null,
                datos.disponible !== false,
                datos.premium || false,
                datos.rating || 0,
                datos.totalEntregas || datos.total_entregas || 0,
                datos.montoGanado || datos.monto_ganado || 0,
                documentos.dni || 'pendiente',
                documentos.licencia || 'pendiente',
                documentos.seguro || 'pendiente',
                documentos.vtv || 'pendiente',
                horarios.preferido || null,
                horarios.disponibilidad ? JSON.stringify(horarios.disponibilidad) : null
            ]);
            
            stats.delivery_persons.exitosos++;
            process.stdout.write(`\r   ✅ Migrados: ${stats.delivery_persons.exitosos}/${stats.delivery_persons.total}`);
            
        } catch (error) {
            stats.delivery_persons.errores++;
            stats.errores.push({
                tipo: 'repartidor',
                archivo: path.basename(archivo),
                error: error.message
            });
        }
    }
    
    console.log(`\n   ✅ Completado: ${stats.delivery_persons.exitosos} exitosos, ${stats.delivery_persons.errores} errores`);
}

// ============================================
// MIGRACIÓN: COMERCIOS
// ============================================
async function migrarComercios() {
    console.log('\n🏪 Migrando COMERCIOS...');
    
    let archivos = [];
    
    // 1. Buscar en carpetas servicios-*
    const carpetasServicios = [
        'servicios-alimentacion',
        'servicios-bazar',
        'servicios-indumentaria',
        'servicios-kiosco',
        'servicios-otros',
        'servicios-prioridad',
        'servicios-salud'
    ];
    
    for (const carpeta of carpetasServicios) {
        const rutaCarpeta = path.join(__dirname, 'registros', carpeta);
        try {
            const archivosCategoria = await listarArchivosRecursivo(rutaCarpeta);
            archivos.push(...archivosCategoria);
        } catch (error) {
            // Carpeta no existe, continuar
        }
    }
    
    // 2. Buscar archivos comercio_* en registros/
    try {
        const archivosDirectos = await fs.readdir(path.join(__dirname, 'registros'));
        for (const archivo of archivosDirectos) {
            if (archivo.startsWith('comercio_') && archivo.endsWith('.json')) {
                archivos.push(path.join(__dirname, 'registros', archivo));
            }
        }
    } catch (error) {
        console.warn('⚠️ Error buscando archivos directos');
    }
    
    // 3. Buscar en registros/comercios/
    try {
        const dirComercios = path.join(__dirname, 'registros', 'comercios');
        const archivosComercios = await listarArchivosRecursivo(dirComercios);
        archivos.push(...archivosComercios);
    } catch (error) {
        // No existe, continuar
    }
    
    stats.shops.total = archivos.length;
    console.log(`   Encontrados: ${archivos.length} archivos`);
    
    for (const archivo of archivos) {
        const datos = await leerJSON(archivo);
        if (!datos) {
            stats.shops.errores++;
            continue;
        }
        
        try {
            const comercioId = datos.id || extraerIdDeArchivo(archivo);
            
            // Extraer categoría del path si no está en datos
            let categoria = datos.categoria;
            if (!categoria) {
                const match = archivo.match(/servicios-([^/\\]+)/);
                categoria = match ? match[1] : 'otros';
            }
            
            const query = `
                INSERT INTO shops (
                    id, nombre_comercio, nombre_propietario, email, telefono, categoria,
                    direccion_calle, direccion_barrio, direccion_ciudad,
                    direccion_provincia, direccion_codigo_postal,
                    direccion_latitud, direccion_longitud,
                    horarios, activo, verificado, premium,
                    pedidos_recibidos, ventas_total, rating,
                    logo, descripcion, fecha_registro
                ) VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9, $10, $11, $12, $13, $14,
                    $15, $16, $17, $18, $19, $20, $21, $22, $23
                )
                ON CONFLICT (id) DO UPDATE SET
                    pedidos_recibidos = EXCLUDED.pedidos_recibidos,
                    ventas_total = EXCLUDED.ventas_total,
                    updated_at = NOW()
            `;
            
            const direccion = datos.direccion || {};
            const coordenadas = datos.coordenadas || {};
            
            await pool.query(query, [
                comercioId,
                datos.nombreComercio || datos.nombre_comercio || datos.nombre || 'Comercio',
                datos.nombrePropietario || datos.nombre_propietario || 'Propietario',
                datos.email || `${comercioId}@yavoy.app`,
                datos.telefono || datos.whatsapp || '0000000000',
                categoria,
                direccion.calle || datos.direccion || null,
                direccion.barrio || null,
                direccion.ciudad || null,
                direccion.provincia || null,
                direccion.codigoPostal || direccion.codigo_postal || null,
                coordenadas.lat || datos.latitud || null,
                coordenadas.lng || datos.longitud || null,
                datos.horarios ? JSON.stringify(datos.horarios) : null,
                datos.activo !== false,
                datos.verificado || false,
                datos.premium || false,
                datos.pedidosRecibidos || datos.pedidos_recibidos || 0,
                datos.ventasTotal || datos.ventas_total || 0,
                datos.rating || 0,
                datos.logo || null,
                datos.descripcion || null,
                normalizarTimestamp(datos.fechaRegistro || datos.fecha_registro || datos.timestamp)
            ]);
            
            stats.shops.exitosos++;
            process.stdout.write(`\r   ✅ Migrados: ${stats.shops.exitosos}/${stats.shops.total}`);
            
        } catch (error) {
            stats.shops.errores++;
            stats.errores.push({
                tipo: 'comercio',
                archivo: path.basename(archivo),
                error: error.message
            });
        }
    }
    
    console.log(`\n   ✅ Completado: ${stats.shops.exitosos} exitosos, ${stats.shops.errores} errores`);
}

// ============================================
// MIGRACIÓN: PEDIDOS
// ============================================
async function migrarPedidos() {
    console.log('\n📦 Migrando PEDIDOS...');
    
    const dirPedidos = path.join(__dirname, 'registros', 'pedidos');
    let archivos = [];
    
    try {
        archivos = await listarArchivosRecursivo(dirPedidos);
    } catch (error) {
        console.warn('⚠️ No se encontró directorio de pedidos');
        return;
    }
    
    stats.orders.total = archivos.length;
    console.log(`   Encontrados: ${archivos.length} archivos`);
    
    for (const archivo of archivos) {
        const datos = await leerJSON(archivo);
        if (!datos) {
            stats.orders.errores++;
            continue;
        }
        
        try {
            const query = `
                INSERT INTO orders (
                    id, cliente_id, comercio_id, repartidor_id,
                    nombre_cliente, telefono_cliente, direccion_entrega, descripcion,
                    destinatario, telefono_destinatario, notas,
                    monto, comision_ceo, comision_repartidor, propina,
                    estado, fecha_creacion, metodo_pago, codigo_seguimiento, timestamp
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                    $12, $13, $14, $15, $16, $17, $18, $19, $20
                )
                ON CONFLICT (id) DO UPDATE SET
                    estado = EXCLUDED.estado,
                    updated_at = NOW()
            `;
            
            await pool.query(query, [
                datos.id,
                datos.clienteId || datos.cliente_id || null,
                datos.comercioId || datos.comercio_id || null,
                datos.repartidorId || datos.repartidor_id || null,
                datos.nombreCliente || datos.nombre_cliente || 'Cliente',
                datos.telefonoCliente || datos.telefono_cliente || '0000000000',
                datos.direccionEntrega || datos.direccion_entrega || 'Sin dirección',
                datos.descripcion || 'Sin descripción',
                datos.destinatario || null,
                datos.telefonoDestinatario || datos.telefono_destinatario || null,
                datos.notas || null,
                datos.monto || 0,
                datos.comisionCEO || datos.comision_ceo || 0,
                datos.comisionRepartidor || datos.comision_repartidor || 0,
                datos.propina || 0,
                datos.estado || 'pendiente',
                normalizarTimestamp(datos.createdAt || datos.created_at || datos.timestamp),
                datos.metodoPago || datos.metodo_pago || 'efectivo',
                datos.codigoSeguimiento || datos.codigo_seguimiento || null,
                normalizarTimestamp(datos.timestamp)
            ]);
            
            stats.orders.exitosos++;
            process.stdout.write(`\r   ✅ Migrados: ${stats.orders.exitosos}/${stats.orders.total}`);
            
        } catch (error) {
            stats.orders.errores++;
            stats.errores.push({
                tipo: 'pedido',
                archivo: path.basename(archivo),
                error: error.message
            });
        }
    }
    
    console.log(`\n   ✅ Completado: ${stats.orders.exitosos} exitosos, ${stats.orders.errores} errores`);
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function ejecutarMigracion() {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('   YAvoy v3.1 - Migración a PostgreSQL');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    
    const inicio = Date.now();
    
    try {
        // Verificar conexión a DB
        console.log('🔌 Verificando conexión a PostgreSQL...');
        const testQuery = await pool.query('SELECT NOW()');
        console.log(`✅ Conectado a: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
        console.log(`   Timestamp DB: ${testQuery.rows[0].now}`);
        
        // Ejecutar migraciones en orden
        await migrarClientes();
        await migrarRepartidores();
        await migrarComercios();
        await migrarPedidos();
        
        // Resumen final
        const fin = Date.now();
        const duracion = ((fin - inicio) / 1000).toFixed(2);
        
        console.log('\n');
        console.log('═══════════════════════════════════════════════════');
        console.log('   RESUMEN DE MIGRACIÓN');
        console.log('═══════════════════════════════════════════════════');
        console.log(`\n📊 Estadísticas:`);
        console.log(`   Clientes:     ${stats.users.exitosos}/${stats.users.total} migrados`);
        console.log(`   Repartidores: ${stats.delivery_persons.exitosos}/${stats.delivery_persons.total} migrados`);
        console.log(`   Comercios:    ${stats.shops.exitosos}/${stats.shops.total} migrados`);
        console.log(`   Pedidos:      ${stats.orders.exitosos}/${stats.orders.total} migrados`);
        console.log(`\n⏱️  Duración: ${duracion} segundos`);
        
        // Mostrar errores si existen
        if (stats.errores.length > 0) {
            console.log(`\n⚠️  Errores encontrados: ${stats.errores.length}`);
            console.log('\nDetalles de errores:');
            stats.errores.slice(0, 10).forEach((err, idx) => {
                console.log(`   ${idx + 1}. [${err.tipo}] ${err.archivo}: ${err.error}`);
            });
            
            if (stats.errores.length > 10) {
                console.log(`   ... y ${stats.errores.length - 10} errores más`);
            }
        } else {
            console.log('\n✅ Migración completada sin errores');
        }
        
        console.log('\n═══════════════════════════════════════════════════\n');
        
    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO EN MIGRACIÓN:', error);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('🔌 Conexión a PostgreSQL cerrada');
    }
}

// ============================================
// EJECUCIÓN
// ============================================
if (require.main === module) {
    ejecutarMigracion()
        .then(() => {
            console.log('\n✅ Script finalizado correctamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { ejecutarMigracion, pool };
