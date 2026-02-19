// ========================================
// LOCATION SERVICE - YAvoy v3.1
// ========================================
// Servicio de geolocalización y cálculo de distancias
// Implementa fórmula de Haversine y validación de zonas de Ensenada

const pool = require('../config/database');

// ====================================
// CONSTANTES DE CONFIGURACIÓN
// ====================================

// Coordenadas de referencia de Ensenada, Buenos Aires
const ZONAS_ENSENADA = {
  'Punta Lara': {
    centro: { lat: -34.8500, lng: -57.9667 },
    radio: 3000 // metros
  },
  'El Dique': {
    centro: { lat: -34.8667, lng: -57.9000 },
    radio: 2500
  },
  'Centro Ensenada': {
    centro: { lat: -34.8667, lng: -57.9167 },
    radio: 2000
  },
  'Villa Catela': {
    centro: { lat: -34.8500, lng: -57.9333 },
    radio: 1500
  },
  'Isla Santiago': {
    centro: { lat: -34.8333, lng: -57.8833 },
    radio: 2000
  }
};

// Distancia mínima para notificación de proximidad (500 metros)
const DISTANCIA_PROXIMIDAD = 500;

// Radio de la Tierra en kilómetros
const RADIO_TIERRA_KM = 6371;

// ====================================
// FÓRMULA DE HAVERSINE
// ====================================

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lng1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2
 * @param {number} lng2 - Longitud del punto 2
 * @returns {number} - Distancia en metros
 */
function calcularDistancia(lat1, lng1, lat2, lng2) {
  // Convertir grados a radianes
  const toRad = (valor) => (valor * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distanciaKm = RADIO_TIERRA_KM * c;
  return distanciaKm * 1000; // Convertir a metros
}

/**
 * Calcula el tiempo estimado de llegada (ETA) basado en la distancia
 * Velocidad promedio en ciudad: 30 km/h para motos
 * @param {number} distanciaMetros - Distancia en metros
 * @returns {number} - Tiempo estimado en minutos
 */
function calcularETA(distanciaMetros) {
  const velocidadPromedio = 30; // km/h
  const distanciaKm = distanciaMetros / 1000;
  const tiempoHoras = distanciaKm / velocidadPromedio;
  const tiempoMinutos = Math.ceil(tiempoHoras * 60);
  
  // Mínimo 2 minutos, máximo 60 minutos
  return Math.max(2, Math.min(60, tiempoMinutos));
}

// ====================================
// VALIDACIÓN DE ZONAS
// ====================================

/**
 * Verifica si una ubicación está dentro de las zonas de cobertura de Ensenada
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {Object} - { valido: boolean, zona: string | null, distanciaAlCentro: number }
 */
function validarZonaEnsenada(lat, lng) {
  for (const [nombreZona, datos] of Object.entries(ZONAS_ENSENADA)) {
    const distancia = calcularDistancia(
      lat, lng,
      datos.centro.lat, datos.centro.lng
    );
    
    if (distancia <= datos.radio) {
      return {
        valido: true,
        zona: nombreZona,
        distanciaAlCentro: Math.round(distancia)
      };
    }
  }
  
  return {
    valido: false,
    zona: null,
    distanciaAlCentro: null
  };
}

/**
 * Encuentra la zona más cercana a una ubicación
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {Object} - { zona: string, distancia: number }
 */
function encontrarZonaMasCercana(lat, lng) {
  let zonaMasCercana = null;
  let distanciaMinima = Infinity;
  
  for (const [nombreZona, datos] of Object.entries(ZONAS_ENSENADA)) {
    const distancia = calcularDistancia(
      lat, lng,
      datos.centro.lat, datos.centro.lng
    );
    
    if (distancia < distanciaMinima) {
      distanciaMinima = distancia;
      zonaMasCercana = nombreZona;
    }
  }
  
  return {
    zona: zonaMasCercana,
    distancia: Math.round(distanciaMinima)
  };
}

// ====================================
// GESTIÓN DE UBICACIONES EN BASE DE DATOS
// ====================================

/**
 * Guarda la ubicación de un repartidor en la base de datos
 * @param {string} repartidorId - ID del repartidor
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @param {string} pedidoId - ID del pedido activo (opcional)
 * @returns {Promise<Object>} - Resultado de la operación
 */
async function guardarUbicacion(repartidorId, lat, lng, pedidoId = null) {
  try {
    const validacion = validarZonaEnsenada(lat, lng);
    
    // Si está fuera de zona, guardar igualmente pero marcar como fuera de cobertura
    const zona = validacion.valido ? validacion.zona : null;
    const enZona = validacion.valido ? 1 : 0;
    
    const query = `
      INSERT INTO delivery_person_locations 
      (repartidor_id, lat, lng, zona, en_zona, pedido_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        lat = VALUES(lat),
        lng = VALUES(lng),
        zona = VALUES(zona),
        en_zona = VALUES(en_zona),
        pedido_id = VALUES(pedido_id),
        timestamp = NOW()
    `;
    
    await pool.query(query, [repartidorId, lat, lng, zona, enZona, pedidoId]);
    
    return {
      success: true,
      ubicacion: { lat, lng },
      zona,
      enZona: enZona === 1,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error guardando ubicación:', error);
    throw error;
  }
}

/**
 * Obtiene la última ubicación conocida de un repartidor
 * @param {string} repartidorId - ID del repartidor
 * @returns {Promise<Object|null>} - Datos de ubicación o null si no existe
 */
async function obtenerUbicacion(repartidorId) {
  try {
    const query = `
      SELECT 
        repartidor_id,
        lat,
        lng,
        zona,
        en_zona,
        pedido_id,
        timestamp,
        TIMESTAMPDIFF(SECOND, timestamp, NOW()) as segundos_desde_actualizacion
      FROM delivery_person_locations
      WHERE repartidor_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    const [rows] = await pool.query(query, [repartidorId]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const ubicacion = rows[0];
    
    return {
      repartidorId: ubicacion.repartidor_id,
      lat: parseFloat(ubicacion.lat),
      lng: parseFloat(ubicacion.lng),
      zona: ubicacion.zona,
      enZona: ubicacion.en_zona === 1,
      pedidoId: ubicacion.pedido_id,
      timestamp: ubicacion.timestamp,
      segundosDesdeActualizacion: ubicacion.segundos_desde_actualizacion,
      esReciente: ubicacion.segundos_desde_actualizacion < 60 // < 1 minuto
    };
  } catch (error) {
    console.error('Error obteniendo ubicación:', error);
    throw error;
  }
}

/**
 * Obtiene todos los repartidores activos con su ubicación
 * Solo devuelve repartidores con ubicación actualizada en los últimos 5 minutos
 * @returns {Promise<Array>} - Array de repartidores con ubicación
 */
async function obtenerRepartidoresActivos() {
  try {
    const query = `
      SELECT 
        l.repartidor_id,
        l.lat,
        l.lng,
        l.zona,
        l.en_zona,
        l.pedido_id,
        l.timestamp,
        u.nombre,
        u.apellido,
        d.tipo_vehiculo,
        d.rating,
        TIMESTAMPDIFF(SECOND, l.timestamp, NOW()) as segundos_desde_actualizacion
      FROM delivery_person_locations l
      INNER JOIN delivery_persons d ON l.repartidor_id = d.id
      INNER JOIN users u ON d.id = u.id
      WHERE TIMESTAMPDIFF(SECOND, l.timestamp, NOW()) < 300
        AND u.activo = 1
      ORDER BY l.timestamp DESC
    `;
    
    const [rows] = await pool.query(query);
    
    return rows.map(row => ({
      repartidorId: row.repartidor_id,
      nombre: `${row.nombre} ${row.apellido}`,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      zona: row.zona,
      enZona: row.en_zona === 1,
      pedidoId: row.pedido_id,
      tipoVehiculo: row.tipo_vehiculo,
      rating: parseFloat(row.rating),
      timestamp: row.timestamp,
      segundosDesdeActualizacion: row.segundos_desde_actualizacion
    }));
  } catch (error) {
    console.error('Error obteniendo repartidores activos:', error);
    throw error;
  }
}

/**
 * Obtiene repartidores cercanos a una ubicación específica
 * @param {number} lat - Latitud del punto de referencia
 * @param {number} lng - Longitud del punto de referencia
 * @param {number} radioMetros - Radio de búsqueda en metros (default: 3000)
 * @returns {Promise<Array>} - Array de repartidores cercanos con distancia
 */
async function obtenerRepartidoresCercanos(lat, lng, radioMetros = 3000) {
  try {
    const repartidores = await obtenerRepartidoresActivos();
    
    const repartidoresCercanos = repartidores
      .map(rep => {
        const distancia = calcularDistancia(lat, lng, rep.lat, rep.lng);
        return {
          ...rep,
          distancia: Math.round(distancia),
          eta: calcularETA(distancia)
        };
      })
      .filter(rep => rep.distancia <= radioMetros)
      .sort((a, b) => a.distancia - b.distancia);
    
    return repartidoresCercanos;
  } catch (error) {
    console.error('Error obteniendo repartidores cercanos:', error);
    throw error;
  }
}

// ====================================
// LÓGICA DE PROXIMIDAD (para notificaciones)
// ====================================

/**
 * Verifica si el repartidor está cerca del destino
 * @param {string} repartidorId - ID del repartidor
 * @param {number} destinoLat - Latitud del destino
 * @param {number} destinoLng - Longitud del destino
 * @returns {Promise<Object>} - { cerca: boolean, distancia: number, eta: number }
 */
async function verificarProximidad(repartidorId, destinoLat, destinoLng) {
  try {
    const ubicacion = await obtenerUbicacion(repartidorId);
    
    if (!ubicacion || !ubicacion.esReciente) {
      return {
        cerca: false,
        distancia: null,
        eta: null,
        mensaje: 'Ubicación no disponible'
      };
    }
    
    const distancia = calcularDistancia(
      ubicacion.lat, ubicacion.lng,
      destinoLat, destinoLng
    );
    
    const eta = calcularETA(distancia);
    const cerca = distancia <= DISTANCIA_PROXIMIDAD;
    
    return {
      cerca,
      distancia: Math.round(distancia),
      eta,
      mensaje: cerca 
        ? `¡Prepara la mesa! Tu pedido está a ${eta} minutos` 
        : `Tu pedido está a ${eta} minutos de distancia`
    };
  } catch (error) {
    console.error('Error verificando proximidad:', error);
    throw error;
  }
}

/**
 * Calcula la distancia entre repartidor y comercio (para ETA de recogida)
 * @param {string} repartidorId - ID del repartidor
 * @param {string} comercioId - ID del comercio
 * @returns {Promise<Object>} - { distancia: number, eta: number }
 */
async function calcularDistanciaComercio(repartidorId, comercioId) {
  try {
    const ubicacionRepartidor = await obtenerUbicacion(repartidorId);
    
    if (!ubicacionRepartidor || !ubicacionRepartidor.esReciente) {
      return {
        distancia: null,
        eta: null,
        mensaje: 'Ubicación del repartidor no disponible'
      };
    }
    
    // Obtener ubicación del comercio
    const query = `
      SELECT lat, lng, nombre FROM comercios WHERE id = ?
    `;
    const [rows] = await pool.query(query, [comercioId]);
    
    if (rows.length === 0) {
      throw new Error('Comercio no encontrado');
    }
    
    const comercio = rows[0];
    const distancia = calcularDistancia(
      ubicacionRepartidor.lat, ubicacionRepartidor.lng,
      parseFloat(comercio.lat), parseFloat(comercio.lng)
    );
    
    const eta = calcularETA(distancia);
    
    return {
      distancia: Math.round(distancia),
      eta,
      nombreComercio: comercio.nombre,
      mensaje: `El repartidor llegará en aproximadamente ${eta} minutos`
    };
  } catch (error) {
    console.error('Error calculando distancia a comercio:', error);
    throw error;
  }
}

// ====================================
// LIMPIEZA DE DATOS ANTIGUOS
// ====================================

/**
 * Elimina ubicaciones antiguas (más de 24 horas)
 * Debe ejecutarse periódicamente (ej: cron job)
 * @returns {Promise<number>} - Número de registros eliminados
 */
async function limpiarUbicacionesAntiguas() {
  try {
    const query = `
      DELETE FROM delivery_person_locations
      WHERE TIMESTAMPDIFF(HOUR, timestamp, NOW()) > 24
    `;
    
    const [result] = await pool.query(query);
    console.log(`🧹 Ubicaciones antiguas eliminadas: ${result.affectedRows}`);
    
    return result.affectedRows;
  } catch (error) {
    console.error('Error limpiando ubicaciones antiguas:', error);
    throw error;
  }
}

// ====================================
// EXPORTAR MÓDULO
// ====================================

module.exports = {
  // Funciones de cálculo
  calcularDistancia,
  calcularETA,
  
  // Validación de zonas
  validarZonaEnsenada,
  encontrarZonaMasCercana,
  ZONAS_ENSENADA,
  DISTANCIA_PROXIMIDAD,
  
  // Gestión de ubicaciones
  guardarUbicacion,
  obtenerUbicacion,
  obtenerRepartidoresActivos,
  obtenerRepartidoresCercanos,
  
  // Lógica de proximidad
  verificarProximidad,
  calcularDistanciaComercio,
  
  // Mantenimiento
  limpiarUbicacionesAntiguas
};
