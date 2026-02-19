/**
 * ========================================
 * YAVOY v3.1 ENTERPRISE - IndexedDB Client
 * ========================================
 * IndexedDB como CACHÉ DE SOLO LECTURA
 * 
 * ⚠️ REGLA DE ORO: TODAS LAS ESCRITURAS VAN AL BACKEND
 * 
 * IndexedDB se usa ÚNICAMENTE para:
 * 1. Cache de comercios para búsqueda offline
 * 2. Cache de productos para navegación rápida
 * 3. Sincronización temporal (pending sync)
 * 
 * NO se usa para:
 * ❌ Crear pedidos (va directo a API)
 * ❌ Actualizar estados (va directo a API)
 * ❌ Lógica de negocio
 * 
 * @version 3.1.0-enterprise
 * @date 21 de diciembre de 2025
 */

const { openDB } = idb;

const DB_NAME = 'YAvoyDB';
const DB_VERSION = 2; // Incrementado por refactorización
const STORES = {
    COMERCIOS_CACHE: 'comercios-cache', // Cache read-only
    PRODUCTOS_CACHE: 'productos-cache', // Cache read-only
    PENDING_SYNC: 'pending-sync'        // Solo para offline sync
};

let db;

// ============================================
// INICIALIZACIÓN
// ============================================

async function initDB() {
    if (db) return db;

    db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            // Crear stores si no existen
            if (!db.objectStoreNames.contains(STORES.COMERCIOS_CACHE)) {
                const comerciosStore = db.createObjectStore(STORES.COMERCIOS_CACHE, {
                    keyPath: 'id'
                });
                comerciosStore.createIndex('categoria', 'categoria', { unique: false });
                comerciosStore.createIndex('activo', 'activo', { unique: false });
                comerciosStore.createIndex('syncedAt', 'syncedAt', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.PRODUCTOS_CACHE)) {
                const productosStore = db.createObjectStore(STORES.PRODUCTOS_CACHE, {
                    keyPath: 'id'
                });
                productosStore.createIndex('comercioId', 'comercioId', { unique: false });
                productosStore.createIndex('categoria', 'categoria', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
                db.createObjectStore(STORES.PENDING_SYNC, {
                    keyPath: 'id',
                    autoIncrement: true
                });
            }

            console.log('✅ IndexedDB actualizado a versión', newVersion);
        }
    });

    return db;
}

// ============================================
// CACHE DE COMERCIOS (Read-Only)
// ============================================

/**
 * Sincronizar cache de comercios desde API
 * ⚠️ SOLO LLAMAR CUANDO HAY CONEXIÓN
 */
export async function sincronizarComerciosDesdeAPI() {
    try {
        const response = await fetch('/api/comercios');
        const data = await response.json();

        if (!data.success) throw new Error('Error en respuesta API');

        const db = await initDB();
        const tx = db.transaction(STORES.COMERCIOS_CACHE, 'readwrite');
        const store = tx.objectStore(STORES.COMERCIOS_CACHE);

        // Limpiar cache anterior
        await store.clear();

        // Insertar nuevos datos con timestamp de sincronización
        for (const comercio of data.comercios) {
            await store.put({
                ...comercio,
                syncedAt: new Date().toISOString()
            });
        }

        await tx.done;
        console.log(`✅ Cache de comercios sincronizado: ${data.comercios.length} registros`);
        return { success: true, count: data.comercios.length };

    } catch (error) {
        console.error('❌ Error sincronizando comercios:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtener comercios desde cache (para uso offline)
 */
export async function obtenerComerciosCache(filtros = {}) {
    try {
        const db = await initDB();
        let comercios = await db.getAll(STORES.COMERCIOS_CACHE);

        // Aplicar filtros
        if (filtros.categoria && filtros.categoria !== 'todos') {
            comercios = comercios.filter(c => c.categoria === filtros.categoria);
        }

        if (filtros.activo !== undefined) {
            comercios = comercios.filter(c => c.activo === filtros.activo);
        }

        return comercios;

    } catch (error) {
        console.error('Error obteniendo comercios del cache:', error);
        return [];
    }
}

/**
 * Verificar si el cache está desactualizado
 */
export async function cacheEstaDesactualizado(maxHoras = 24) {
    try {
        const db = await initDB();
        const comercios = await db.getAll(STORES.COMERCIOS_CACHE);

        if (comercios.length === 0) return true;

        const primeraSync = new Date(comercios[0].syncedAt);
        const horasTranscurridas = (new Date() - primeraSync) / (1000 * 60 * 60);

        return horasTranscurridas > maxHoras;

    } catch (error) {
        return true; // Asumir desactualizado si hay error
    }
}

// ============================================
// CACHE DE PRODUCTOS (Read-Only)
// ============================================

/**
 * Sincronizar productos de un comercio desde API
 */
export async function sincronizarProductosComercio(comercioId) {
    try {
        const response = await fetch(`/api/comercios/${comercioId}/productos`);
        const data = await response.json();

        if (!data.success) throw new Error('Error en respuesta API');

        const db = await initDB();
        const tx = db.transaction(STORES.PRODUCTOS_CACHE, 'readwrite');
        const store = tx.objectStore(STORES.PRODUCTOS_CACHE);

        // Eliminar productos antiguos del comercio
        const index = store.index('comercioId');
        const productosAntiguos = await index.getAll(comercioId);
        for (const producto of productosAntiguos) {
            await store.delete(producto.id);
        }

        // Insertar nuevos productos
        for (const producto of data.productos) {
            await store.put({
                ...producto,
                comercioId,
                syncedAt: new Date().toISOString()
            });
        }

        await tx.done;
        console.log(`✅ Productos de comercio ${comercioId} sincronizados`);
        return { success: true, count: data.productos.length };

    } catch (error) {
        console.error('Error sincronizando productos:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtener productos desde cache
 */
export async function obtenerProductosCache(comercioId) {
    try {
        const db = await initDB();
        const tx = db.transaction(STORES.PRODUCTOS_CACHE, 'readonly');
        const index = tx.objectStore(STORES.PRODUCTOS_CACHE).index('comercioId');
        const productos = await index.getAll(comercioId);
        return productos;

    } catch (error) {
        console.error('Error obteniendo productos del cache:', error);
        return [];
    }
}

// ============================================
// PENDING SYNC (Para operaciones offline)
// ============================================

/**
 * Guardar operación pendiente de sincronización
 * ⚠️ SOLO USAR CUANDO NO HAY CONEXIÓN
 */
export async function guardarPendingSync(operacion) {
    try {
        const db = await initDB();
        const tx = db.transaction(STORES.PENDING_SYNC, 'readwrite');
        const id = await tx.store.add({
            ...operacion,
            timestamp: new Date().toISOString(),
            sincronizado: false
        });
        await tx.done;
        console.log(`⏳ Operación guardada para sync posterior: ${id}`);
        return { success: true, id };

    } catch (error) {
        console.error('Error guardando pending sync:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtener todas las operaciones pendientes de sincronización
 */
export async function obtenerPendingSync() {
    try {
        const db = await initDB();
        const operaciones = await db.getAll(STORES.PENDING_SYNC);
        return operaciones.filter(op => !op.sincronizado);

    } catch (error) {
        console.error('Error obteniendo pending sync:', error);
        return [];
    }
}

/**
 * Sincronizar operaciones pendientes con el backend
 */
export async function sincronizarPendientes() {
    try {
        const operaciones = await obtenerPendingSync();
        
        if (operaciones.length === 0) {
            console.log('✅ No hay operaciones pendientes');
            return { success: true, sincronizadas: 0 };
        }

        const db = await initDB();
        let sincronizadas = 0;

        for (const operacion of operaciones) {
            try {
                // Intentar sincronizar con API
                const response = await fetch(operacion.endpoint, {
                    method: operacion.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(operacion.data)
                });

                if (response.ok) {
                    // Marcar como sincronizado
                    const tx = db.transaction(STORES.PENDING_SYNC, 'readwrite');
                    await tx.store.delete(operacion.id);
                    await tx.done;
                    sincronizadas++;
                }

            } catch (error) {
                console.error(`Error sincronizando operación ${operacion.id}:`, error);
            }
        }

        console.log(`✅ ${sincronizadas}/${operaciones.length} operaciones sincronizadas`);
        return { success: true, sincronizadas, total: operaciones.length };

    } catch (error) {
        console.error('Error en sincronización pendiente:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Limpiar TODO el cache (usar con precaución)
 */
export async function limpiarTodoElCache() {
    try {
        const db = await initDB();
        
        await db.clear(STORES.COMERCIOS_CACHE);
        await db.clear(STORES.PRODUCTOS_CACHE);
        
        console.log('✅ Cache limpiado completamente');
        return { success: true };

    } catch (error) {
        console.error('Error limpiando cache:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtener estadísticas del cache
 */
export async function obtenerEstadisticasCache() {
    try {
        const db = await initDB();
        
        const stats = {
            comercios: await db.count(STORES.COMERCIOS_CACHE),
            productos: await db.count(STORES.PRODUCTOS_CACHE),
            pendingSync: await db.count(STORES.PENDING_SYNC)
        };

        return stats;

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return { comercios: 0, productos: 0, pendingSync: 0 };
    }
}

/**
 * Verificar si hay conexión a internet
 */
export function hayConexion() {
    return navigator.onLine;
}

// ============================================
// SINCRONIZACIÓN AUTOMÁTICA
// ============================================

/**
 * Estrategia de sincronización inteligente
 */
export async function estrategiaSincronizacion() {
    if (!hayConexion()) {
        console.log('⚠️ Sin conexión, usando cache local');
        return { modo: 'offline', cache: true };
    }

    const desactualizado = await cacheEstaDesactualizado();
    
    if (desactualizado) {
        console.log('🔄 Cache desactualizado, sincronizando...');
        await sincronizarComerciosDesdeAPI();
        return { modo: 'online', sincronizado: true };
    }

    console.log('✅ Cache actualizado, usando datos locales');
    return { modo: 'online', cache: true };
}

// Auto-sincronizar al cargar la página
if (typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
        await initDB();
        await estrategiaSincronizacion();
        
        // Intentar sincronizar operaciones pendientes
        await sincronizarPendientes();
    });

    // Detectar cuando vuelve la conexión
    window.addEventListener('online', async () => {
        console.log('🌐 Conexión restaurada, sincronizando...');
        await sincronizarComerciosDesdeAPI();
        await sincronizarPendientes();
    });

    window.addEventListener('offline', () => {
        console.log('⚠️ Sin conexión, modo offline activado');
    });
}

// ============================================
// EXPORTACIONES
// ============================================

// Mantener compatibilidad con código antiguo
export async function storeDataForSync(data) {
    console.warn('⚠️ ADVERTENCIA: storeDataForSync está deprecated. Usa guardarPendingSync()');
    return guardarPendingSync(data);
}

export async function getAllDataForSync() {
    console.warn('⚠️ ADVERTENCIA: getAllDataForSync está deprecated. Usa obtenerPendingSync()');
    return obtenerPendingSync();
}

export async function clearSyncData() {
    console.warn('⚠️ ADVERTENCIA: clearSyncData está deprecated. Usa limpiarTodoElCache()');
    return limpiarTodoElCache();
}

