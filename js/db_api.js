// ====================================
// 🔄 YAvoy v3.1 - NUEVO db.js (API REST)
// ====================================
// Reemplazo de IndexedDB por llamadas a API REST

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api'
  : 'https://api.yavoy.com/api';

// ========================================
// 🔐 HELPER: OBTENER TOKEN
// ========================================
function getAuthToken() {
  return localStorage.getItem('yavoy_auth_token');
}

// ========================================
// 🌐 HELPER: FETCH CON AUTH
// ========================================
async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de red' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// ========================================
// 📦 COMERCIOS
// ========================================
export async function storeComercio(data) {
  try {
    const result = await apiFetch('/comercios', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    console.log('✅ Comercio guardado en DB:', result);
    return result;
  } catch (error) {
    console.error('❌ Error guardando comercio:', error);
    throw error;
  }
}

export async function getComercio(id) {
  try {
    const result = await apiFetch(`/comercios/${id}`);
    return result.data;
  } catch (error) {
    console.error('❌ Error obteniendo comercio:', error);
    return null;
  }
}

export async function getAllComercios(filtros = {}) {
  try {
    const params = new URLSearchParams(filtros);
    const result = await apiFetch(`/comercios?${params}`);
    return result.data || [];
  } catch (error) {
    console.error('❌ Error obteniendo comercios:', error);
    return [];
  }
}

export async function updateComercio(id, data) {
  try {
    const result = await apiFetch(`/comercios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    console.log('✅ Comercio actualizado:', result);
    return result;
  } catch (error) {
    console.error('❌ Error actualizando comercio:', error);
    throw error;
  }
}

// ========================================
// 🏍️ REPARTIDORES
// ========================================
export async function storeRepartidor(data) {
  try {
    const result = await apiFetch('/repartidores', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    console.log('✅ Repartidor guardado en DB:', result);
    return result;
  } catch (error) {
    console.error('❌ Error guardando repartidor:', error);
    throw error;
  }
}

export async function getRepartidor(id) {
  try {
    const result = await apiFetch(`/repartidores/${id}`);
    return result.data;
  } catch (error) {
    console.error('❌ Error obteniendo repartidor:', error);
    return null;
  }
}

export async function getAllRepartidores(filtros = {}) {
  try {
    const params = new URLSearchParams(filtros);
    const result = await apiFetch(`/repartidores?${params}`);
    return result.data || [];
  } catch (error) {
    console.error('❌ Error obteniendo repartidores:', error);
    return [];
  }
}

export async function updateRepartidor(id, data) {
  try {
    const result = await apiFetch(`/repartidores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    console.log('✅ Repartidor actualizado:', result);
    return result;
  } catch (error) {
    console.error('❌ Error actualizando repartidor:', error);
    throw error;
  }
}

// ========================================
// 👥 CLIENTES
// ========================================
export async function storeCliente(data) {
  try {
    const result = await apiFetch('/clientes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    console.log('✅ Cliente guardado en DB:', result);
    return result;
  } catch (error) {
    console.error('❌ Error guardando cliente:', error);
    throw error;
  }
}

export async function getCliente(id) {
  try {
    const result = await apiFetch(`/clientes/${id}`);
    return result.data;
  } catch (error) {
    console.error('❌ Error obteniendo cliente:', error);
    return null;
  }
}

// ========================================
// 📦 PEDIDOS
// ========================================
export async function storePedido(data) {
  try {
    const result = await apiFetch('/pedidos', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    console.log('✅ Pedido creado:', result);
    return result;
  } catch (error) {
    console.error('❌ Error creando pedido:', error);
    throw error;
  }
}

export async function getPedido(id) {
  try {
    const result = await apiFetch(`/pedidos/${id}`);
    return result.data;
  } catch (error) {
    console.error('❌ Error obteniendo pedido:', error);
    return null;
  }
}

export async function getAllPedidos(filtros = {}) {
  try {
    const params = new URLSearchParams(filtros);
    const result = await apiFetch(`/pedidos?${params}`);
    return result.data || [];
  } catch (error) {
    console.error('❌ Error obteniendo pedidos:', error);
    return [];
  }
}

export async function updateEstadoPedido(id, nuevoEstado) {
  try {
    const result = await apiFetch(`/pedidos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: nuevoEstado })
    });
    console.log('✅ Estado de pedido actualizado:', result);
    return result;
  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    throw error;
  }
}

// ========================================
// 💬 CHAT
// ========================================
export async function enviarMensaje(pedidoId, mensaje, remitente, remitenteId) {
  try {
    const result = await apiFetch(`/chat/${pedidoId}/mensajes`, {
      method: 'POST',
      body: JSON.stringify({ mensaje, remitente, remitenteId })
    });
    return result;
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    throw error;
  }
}

export async function obtenerMensajesChat(pedidoId) {
  try {
    const result = await apiFetch(`/chat/${pedidoId}/mensajes`);
    return result.data || [];
  } catch (error) {
    console.error('❌ Error obteniendo mensajes:', error);
    return [];
  }
}

// ========================================
// ⭐ CALIFICACIONES
// ========================================
export async function guardarCalificacion(data) {
  try {
    const result = await apiFetch('/calificaciones', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    console.log('✅ Calificación guardada:', result);
    return result;
  } catch (error) {
    console.error('❌ Error guardando calificación:', error);
    throw error;
  }
}

// ========================================
// 🔔 SUBSCRIPCIONES PUSH
// ========================================
export async function guardarSubscripcionPush(subscription, userId, tipoUsuario) {
  try {
    const result = await apiFetch('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription, userId, tipoUsuario })
    });
    console.log('✅ Subscripción push guardada:', result);
    return result;
  } catch (error) {
    console.error('❌ Error guardando subscripción:', error);
    throw error;
  }
}

// ========================================
// 📊 ESTADÍSTICAS
// ========================================
export async function obtenerEstadisticas(tipo, id) {
  try {
    const result = await apiFetch(`/estadisticas/${tipo}/${id}`);
    return result.data;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return null;
  }
}

// ========================================
// 🗑️ LIMPIAR DATOS (YA NO NECESARIO)
// ========================================
export async function clearSyncData() {
  console.log('⚠️ clearSyncData() es obsoleto. Los datos ahora están en la base de datos centralizada.');
  // No hace nada, pero mantenemos la función por compatibilidad
  return Promise.resolve();
}

// ========================================
// ✅ MIGRACIÓN LEGACY (OPCIONAL)
// ========================================
// Si hay datos en IndexedDB del sistema antiguo, esta función los sube al servidor
export async function migrarDatosLocalesToServidor() {
  try {
    // Intentar cargar idb si existe
    if (typeof idb === 'undefined') {
      console.log('ℹ️ No hay datos locales para migrar');
      return { success: true, migrados: 0 };
    }

    const { openDB } = idb;
    const db = await openDB('YAvoyDB', 1);
    const datosLocales = await db.getAll('sync-comercios');
    
    if (datosLocales.length === 0) {
      console.log('ℹ️ No hay datos locales para migrar');
      return { success: true, migrados: 0 };
    }

    console.log(`🔄 Migrando ${datosLocales.length} registros locales al servidor...`);
    
    let migrados = 0;
    for (const dato of datosLocales) {
      try {
        await storeComercio(dato);
        migrados++;
      } catch (error) {
        console.error('Error migrando registro:', dato.id, error);
      }
    }
    
    // Limpiar datos locales tras migración exitosa
    await db.clear('sync-comercios');
    
    console.log(`✅ Migrados ${migrados}/${datosLocales.length} registros`);
    return { success: true, migrados };
  } catch (error) {
    console.error('❌ Error en migración de datos locales:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// 🔧 UTILIDADES
// ========================================
export function setAuthToken(token) {
  localStorage.setItem('yavoy_auth_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('yavoy_auth_token');
}

export function isAuthenticated() {
  return !!getAuthToken();
}

// ========================================
// 🚀 INICIALIZACIÓN
// ========================================
console.log('✅ YAvoy DB Module v3.1 cargado (API REST)');
console.log(`📡 API URL: ${API_BASE_URL}`);

// Intentar migrar datos locales automáticamente al cargar
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Migración automática silenciosa después de 2 segundos
    setTimeout(() => {
      migrarDatosLocalesToServidor().catch(console.error);
    }, 2000);
  });
}
