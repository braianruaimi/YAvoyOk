// ====================================
// 📍 YAvoy v3.1 - GEOFENCING MIDDLEWARE
// ====================================
// Asignación Inteligente de Repartidores
// Algoritmo: Distancia Manhattan + ETA

const { getRepartidoresOnlinePorCiudad } = require('../database');

// ========================================
// 📐 DISTANCIA MANHATTAN
// ========================================
// Más rápido que Haversine para áreas urbanas con calles en cuadrícula
function calcularDistanciaManhattan(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  
  const toRad = (deg) => deg * (Math.PI / 180);
  
  const dLat = Math.abs(lat2 - lat1);
  const dLon = Math.abs(lon2 - lon1);
  
  // Convertir diferencias a km (aproximación válida para distancias cortas)
  const distLat = dLat * (Math.PI / 180) * R;
  const distLon = dLon * (Math.PI / 180) * R * Math.cos(toRad((lat1 + lat2) / 2));
  
  // Distancia Manhattan (L1)
  return distLat + distLon;
}

// ========================================
// ⏱️ CÁLCULO DE ETA (Tiempo Estimado de Llegada)
// ========================================
function calcularETA(distanciaKm, velocidadPromedio = 25) {
  // velocidadPromedio: km/h (25 km/h es típico para motos en ciudad)
  
  // Factores de corrección
  const FACTOR_TRAFICO = 1.3; // 30% más tiempo por tráfico
  const TIEMPO_BASE_MIN = 5; // Tiempo base mínimo (preparación, etc.)
  
  const tiempoViaje = (distanciaKm / velocidadPromedio) * 60; // minutos
  const tiempoTotal = (tiempoViaje * FACTOR_TRAFICO) + TIEMPO_BASE_MIN;
  
  return Math.ceil(tiempoTotal);
}

// ========================================
// 🎯 ENCONTRAR REPARTIDOR MÁS CERCANO
// ========================================
async function encontrarRepartidorCercano(coordenadasComercio, ciudad = null) {
  try {
    const { lat: latComercio, lng: lngComercio } = coordenadasComercio;
    
    // Obtener repartidores online
    let repartidores;
    if (ciudad) {
      repartidores = await getRepartidoresOnlinePorCiudad(ciudad);
    } else {
      // Fallback: todos los repartidores online
      const { db } = require('../database');
      repartidores = await db.findMany('repartidores', {
        online: true,
        activo: true
      });
    }
    
    if (repartidores.length === 0) {
      return {
        success: false,
        error: 'No hay repartidores disponibles en este momento',
        code: 'NO_REPARTIDORES_DISPONIBLES'
      };
    }
    
    // Calcular distancia y ETA para cada repartidor
    const repartidoresConDistancia = repartidores.map(rep => {
      const coords = rep.coordenadas_actuales;
      
      if (!coords || !coords.lat || !coords.lng) {
        return {
          ...rep,
          distancia: Infinity,
          eta: Infinity,
          disponible: false
        };
      }
      
      const distancia = calcularDistanciaManhattan(
        latComercio,
        lngComercio,
        coords.lat,
        coords.lng
      );
      
      const eta = calcularETA(distancia);
      
      return {
        ...rep,
        distancia: parseFloat(distancia.toFixed(2)),
        eta,
        disponible: true
      };
    });
    
    // Filtrar repartidores disponibles y ordenar por distancia
    const repartidoresDisponibles = repartidoresConDistancia
      .filter(r => r.disponible)
      .sort((a, b) => a.distancia - b.distancia);
    
    if (repartidoresDisponibles.length === 0) {
      return {
        success: false,
        error: 'No hay repartidores con ubicación válida',
        code: 'NO_UBICACION_VALIDA'
      };
    }
    
    // Retornar el más cercano
    const masCercano = repartidoresDisponibles[0];
    
    return {
      success: true,
      repartidor: {
        id: masCercano.id,
        nombre: masCercano.nombre,
        telefono: masCercano.telefono,
        vehiculo: masCercano.vehiculo,
        calificacion: masCercano.calificacion,
        foto_perfil: masCercano.foto_perfil,
        coordenadas: masCercano.coordenadas_actuales
      },
      distancia: masCercano.distancia,
      eta: masCercano.eta,
      alternativas: repartidoresDisponibles.slice(1, 4) // Top 3 alternativas
    };
  } catch (error) {
    console.error('❌ Error en encontrarRepartidorCercano:', error);
    return {
      success: false,
      error: 'Error al buscar repartidores',
      details: error.message
    };
  }
}

// ========================================
// 🧮 MIDDLEWARE DE ASIGNACIÓN AUTOMÁTICA
// ========================================
async function middlewareAsignacionAutomatica(req, res, next) {
  try {
    const { comercio_id, coordenadas_comercio, ciudad } = req.body;
    
    if (!coordenadas_comercio || !coordenadas_comercio.lat || !coordenadas_comercio.lng) {
      return res.status(400).json({
        success: false,
        error: 'Coordenadas del comercio requeridas para asignación automática'
      });
    }
    
    // Buscar repartidor más cercano
    const resultado = await encontrarRepartidorCercano(coordenadas_comercio, ciudad);
    
    if (!resultado.success) {
      return res.status(404).json(resultado);
    }
    
    // Agregar repartidor sugerido al request
    req.repartidorSugerido = resultado;
    
    // Log de asignación
    console.log('📍 [GEOFENCING] Repartidor asignado:', {
      pedido: req.body.id || 'nuevo',
      repartidor: resultado.repartidor.nombre,
      distancia: resultado.distancia + ' km',
      eta: resultado.eta + ' min'
    });
    
    next();
  } catch (error) {
    console.error('❌ Error en middlewareAsignacionAutomatica:', error);
    res.status(500).json({
      success: false,
      error: 'Error en asignación automática',
      details: error.message
    });
  }
}

// ========================================
// 🗺️ CALCULAR RUTA ÓPTIMA
// ========================================
function calcularRutaOptima(puntos) {
  // Algoritmo simplificado del Problema del Viajante (TSP)
  // Para producción avanzada, usar Google Routes API
  
  if (puntos.length <= 2) {
    return puntos;
  }
  
  // Nearest Neighbor Heuristic
  const rutaOptimizada = [puntos[0]];
  let puntosRestantes = puntos.slice(1);
  
  while (puntosRestantes.length > 0) {
    const actual = rutaOptimizada[rutaOptimizada.length - 1];
    
    let indiceMasCercano = 0;
    let distanciaMinima = Infinity;
    
    puntosRestantes.forEach((punto, index) => {
      const distancia = calcularDistanciaManhattan(
        actual.lat,
        actual.lng,
        punto.lat,
        punto.lng
      );
      
      if (distancia < distanciaMinima) {
        distanciaMinima = distancia;
        indiceMasCercano = index;
      }
    });
    
    rutaOptimizada.push(puntosRestantes[indiceMasCercano]);
    puntosRestantes.splice(indiceMasCercano, 1);
  }
  
  return rutaOptimizada;
}

// ========================================
// 📊 ESTADÍSTICAS DE REPARTIDOR
// ========================================
async function obtenerMetricasRepartidor(repartidorId) {
  const { getEstadisticasRepartidor } = require('../database');
  
  try {
    const stats = await getEstadisticasRepartidor(repartidorId);
    
    const tasaExito = stats.total_pedidos > 0
      ? ((stats.completados / stats.total_pedidos) * 100).toFixed(1)
      : 0;
    
    const tasaCancelacion = stats.total_pedidos > 0
      ? ((stats.cancelados / stats.total_pedidos) * 100).toFixed(1)
      : 0;
    
    return {
      total_pedidos: stats.total_pedidos || 0,
      completados: stats.completados || 0,
      cancelados: stats.cancelados || 0,
      tasa_exito: parseFloat(tasaExito),
      tasa_cancelacion: parseFloat(tasaCancelacion),
      calificacion_promedio: parseFloat((stats.calificacion_promedio || 0).toFixed(2)),
      ingresos_totales: parseFloat((stats.ingresos_totales || 0).toFixed(2))
    };
  } catch (error) {
    console.error('❌ Error obteniendo métricas:', error);
    return null;
  }
}

// ========================================
// 🌍 VERIFICAR SI ESTÁ EN ZONA DE COBERTURA
// ========================================
function verificarZonaCobertura(coordenadas, zonasCobertura = []) {
  // zonasCobertura: array de polígonos o centros con radio
  
  if (zonasCobertura.length === 0) {
    return true; // Sin restricciones de zona
  }
  
  // Implementación simplificada: radio desde centro de ciudad
  // Para producción: usar geofencing preciso con polígonos
  
  for (const zona of zonasCobertura) {
    if (zona.tipo === 'circular') {
      const distancia = calcularDistanciaManhattan(
        coordenadas.lat,
        coordenadas.lng,
        zona.centro.lat,
        zona.centro.lng
      );
      
      if (distancia <= zona.radio_km) {
        return true;
      }
    }
  }
  
  return false;
}

// ========================================
// EXPORTS
// ========================================
module.exports = {
  calcularDistanciaManhattan,
  calcularETA,
  encontrarRepartidorCercano,
  middlewareAsignacionAutomatica,
  calcularRutaOptima,
  obtenerMetricasRepartidor,
  verificarZonaCobertura
};
