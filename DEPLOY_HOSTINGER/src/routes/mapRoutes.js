// ========================================
// MAP ROUTES - YAvoy v3.1
// ========================================
// Endpoints REST para geolocalización y mapas
// Complementa la funcionalidad de Socket.IO con fallbacks HTTP

const express = require('express');
const router = express.Router();
const locationService = require('../services/locationService');
const pool = require('../config/database');

// ====================================
// MIDDLEWARE DE AUTENTICACIÓN
// ====================================

/**
 * Middleware simple de autenticación
 * Verifica que el usuario esté logueado
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: 'No autorizado',
      mensaje: 'Debes iniciar sesión para acceder a este recurso'
    });
  }
  next();
}

/**
 * Middleware para verificar tipo de usuario
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.session.userType)) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        mensaje: 'No tienes permisos para acceder a este recurso'
      });
    }
    next();
  };
}

// ====================================
// ENDPOINTS DE UBICACIÓN
// ====================================

/**
 * POST /api/map/ubicacion
 * Actualizar ubicación del repartidor (fallback HTTP)
 * Normalmente se hace vía Socket, pero esto permite fallback si falla
 */
router.post('/ubicacion', requireAuth, requireRole('repartidor'), async (req, res) => {
  try {
    const { lat, lng, pedidoId } = req.body;
    const repartidorId = req.session.userId;
    
    // Validar coordenadas
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ 
        error: 'Coordenadas inválidas',
        mensaje: 'Debes proporcionar lat y lng válidos'
      });
    }
    
    // Validar rango de coordenadas (Argentina)
    if (lat < -55 || lat > -21 || lng < -73 || lng > -53) {
      return res.status(400).json({ 
        error: 'Coordenadas fuera de rango',
        mensaje: 'Las coordenadas deben estar dentro de Argentina'
      });
    }
    
    const resultado = await locationService.guardarUbicacion(
      repartidorId, 
      parseFloat(lat), 
      parseFloat(lng), 
      pedidoId
    );
    
    res.json({
      success: true,
      ...resultado
    });
  } catch (error) {
    console.error('Error actualizando ubicación:', error);
    res.status(500).json({ 
      error: 'Error del servidor',
      mensaje: 'No se pudo actualizar la ubicación'
    });
  }
});

/**
 * GET /api/map/ubicacion/:repartidorId
 * Obtener última ubicación de un repartidor
 * Accesible por: repartidor (su propia ubicación), cliente (su repartidor asignado), comercio, CEO
 */
router.get('/ubicacion/:repartidorId', requireAuth, async (req, res) => {
  try {
    const { repartidorId } = req.params;
    const { userId, userType } = req.session;
    
    // Verificar permisos
    if (userType === 'repartidor' && repartidorId !== userId) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        mensaje: 'Solo puedes ver tu propia ubicación'
      });
    }
    
    if (userType === 'cliente') {
      // Verificar que el cliente tenga un pedido con este repartidor
      const [pedidos] = await pool.query(`
        SELECT id FROM orders 
        WHERE cliente_id = ? 
        AND repartidor_id = ? 
        AND estado IN ('aceptado', 'en_camino', 'recogido')
        LIMIT 1
      `, [userId, repartidorId]);
      
      if (pedidos.length === 0) {
        return res.status(403).json({ 
          error: 'Acceso denegado',
          mensaje: 'No tienes un pedido activo con este repartidor'
        });
      }
    }
    
    const ubicacion = await locationService.obtenerUbicacion(repartidorId);
    
    if (!ubicacion) {
      return res.status(404).json({ 
        error: 'Ubicación no encontrada',
        mensaje: 'No hay datos de ubicación para este repartidor'
      });
    }
    
    res.json({
      success: true,
      ubicacion
    });
  } catch (error) {
    console.error('Error obteniendo ubicación:', error);
    res.status(500).json({ 
      error: 'Error del servidor',
      mensaje: 'No se pudo obtener la ubicación'
    });
  }
});

/**
 * GET /api/map/repartidores-activos
 * Obtener todos los repartidores activos con ubicación
 * Solo accesible por CEO y comercios
 */
router.get('/repartidores-activos', requireAuth, requireRole('ceo', 'comercio'), async (req, res) => {
  try {
    const repartidores = await locationService.obtenerRepartidoresActivos();
    
    res.json({
      success: true,
      total: repartidores.length,
      repartidores
    });
  } catch (error) {
    console.error('Error obteniendo repartidores activos:', error);
    res.status(500).json({ 
      error: 'Error del servidor',
      mensaje: 'No se pudieron obtener los repartidores activos'
    });
  }
});

/**
 * GET /api/map/repartidores-cercanos
 * Obtener repartidores cercanos a una ubicación
 * Usado por comercios para ver repartidores disponibles
 */
router.get('/repartidores-cercanos', requireAuth, requireRole('comercio', 'ceo'), async (req, res) => {
  try {
    const { lat, lng, radio } = req.query;
    
    // Si es comercio, obtener su ubicación automáticamente
    let latitud, longitud;
    
    if (req.session.userType === 'comercio') {
      const [comercios] = await pool.query(
        'SELECT lat, lng FROM comercios WHERE id = ?',
        [req.session.userId]
      );
      
      if (comercios.length === 0) {
        return res.status(404).json({ 
          error: 'Comercio no encontrado',
          mensaje: 'No se pudo obtener la ubicación del comercio'
        });
      }
      
      latitud = parseFloat(comercios[0].lat);
      longitud = parseFloat(comercios[0].lng);
    } else {
      // Si es CEO, debe proporcionar coordenadas
      if (!lat || !lng) {
        return res.status(400).json({ 
          error: 'Coordenadas requeridas',
          mensaje: 'Debes proporcionar lat y lng'
        });
      }
      latitud = parseFloat(lat);
      longitud = parseFloat(lng);
    }
    
    const radioMetros = radio ? parseInt(radio) : 3000;
    
    const repartidores = await locationService.obtenerRepartidoresCercanos(
      latitud, 
      longitud, 
      radioMetros
    );
    
    res.json({
      success: true,
      centro: { lat: latitud, lng: longitud },
      radio: radioMetros,
      total: repartidores.length,
      repartidores
    });
  } catch (error) {
    console.error('Error obteniendo repartidores cercanos:', error);
    res.status(500).json({ 
      error: 'Error del servidor',
      mensaje: 'No se pudieron obtener los repartidores cercanos'
    });
  }
});

/**
 * GET /api/map/proximidad/:pedidoId
 * Verificar si el repartidor está cerca del destino
 * Usado por cliente para saber cuándo preparar la mesa
 */
router.get('/proximidad/:pedidoId', requireAuth, async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { userId, userType } = req.session;
    
    // Obtener datos del pedido
    const [pedidos] = await pool.query(`
      SELECT 
        o.id,
        o.cliente_id,
        o.repartidor_id,
        o.direccion_entrega_lat,
        o.direccion_entrega_lng,
        o.estado
      FROM orders o
      WHERE o.id = ?
    `, [pedidoId]);
    
    if (pedidos.length === 0) {
      return res.status(404).json({ 
        error: 'Pedido no encontrado',
        mensaje: 'No existe un pedido con ese ID'
      });
    }
    
    const pedido = pedidos[0];
    
    // Verificar permisos
    if (userType === 'cliente' && pedido.cliente_id !== userId) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        mensaje: 'Solo puedes ver el estado de tus propios pedidos'
      });
    }
    
    if (!pedido.repartidor_id) {
      return res.json({
        success: true,
        cerca: false,
        mensaje: 'El pedido aún no tiene repartidor asignado'
      });
    }
    
    if (!pedido.direccion_entrega_lat || !pedido.direccion_entrega_lng) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        mensaje: 'El pedido no tiene coordenadas de entrega'
      });
    }
    
    const proximidad = await locationService.verificarProximidad(
      pedido.repartidor_id,
      parseFloat(pedido.direccion_entrega_lat),
      parseFloat(pedido.direccion_entrega_lng)
    );
    
    res.json({
      success: true,
      pedidoId,
      estado: pedido.estado,
      ...proximidad
    });
  } catch (error) {
    console.error('Error verificando proximidad:', error);
    res.status(500).json({ 
      error: 'Error del servidor',
      mensaje: 'No se pudo verificar la proximidad'
    });
  }
});

/**
 * GET /api/map/eta-comercio/:pedidoId
 * Calcular ETA de llegada del repartidor al comercio para recogida
 * Usado por comercios para saber cuándo preparar el pedido
 */
router.get('/eta-comercio/:pedidoId', requireAuth, requireRole('comercio', 'ceo'), async (req, res) => {
  try {
    const { pedidoId } = req.params;
    
    // Obtener datos del pedido
    const [pedidos] = await pool.query(`
      SELECT 
        o.id,
        o.comercio_id,
        o.repartidor_id,
        o.estado
      FROM orders o
      WHERE o.id = ?
    `, [pedidoId]);
    
    if (pedidos.length === 0) {
      return res.status(404).json({ 
        error: 'Pedido no encontrado',
        mensaje: 'No existe un pedido con ese ID'
      });
    }
    
    const pedido = pedidos[0];
    
    // Verificar permisos
    if (req.session.userType === 'comercio' && pedido.comercio_id !== req.session.userId) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        mensaje: 'Solo puedes ver tus propios pedidos'
      });
    }
    
    if (!pedido.repartidor_id) {
      return res.json({
        success: true,
        mensaje: 'El pedido aún no tiene repartidor asignado',
        distancia: null,
        eta: null
      });
    }
    
    const resultado = await locationService.calcularDistanciaComercio(
      pedido.repartidor_id,
      pedido.comercio_id
    );
    
    res.json({
      success: true,
      pedidoId,
      estado: pedido.estado,
      ...resultado
    });
  } catch (error) {
    console.error('Error calculando ETA a comercio:', error);
    res.status(500).json({ 
      error: 'Error del servidor',
      mensaje: 'No se pudo calcular el ETA'
    });
  }
});

/**
 * GET /api/map/zonas
 * Obtener información sobre las zonas de cobertura
 */
router.get('/zonas', (req, res) => {
  res.json({
    success: true,
    zonas: locationService.ZONAS_ENSENADA,
    distanciaProximidad: locationService.DISTANCIA_PROXIMIDAD
  });
});

/**
 * POST /api/map/validar-zona
 * Validar si una ubicación está en zona de cobertura
 */
router.post('/validar-zona', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ 
        error: 'Coordenadas inválidas',
        mensaje: 'Debes proporcionar lat y lng válidos'
      });
    }
    
    const validacion = locationService.validarZonaEnsenada(
      parseFloat(lat), 
      parseFloat(lng)
    );
    
    if (!validacion.valido) {
      const zonaCercana = locationService.encontrarZonaMasCercana(
        parseFloat(lat), 
        parseFloat(lng)
      );
      
      return res.json({
        success: true,
        ...validacion,
        zonaMasCercana: zonaCercana
      });
    }
    
    res.json({
      success: true,
      ...validacion
    });
  } catch (error) {
    console.error('Error validando zona:', error);
    res.status(500).json({ 
      error: 'Error del servidor',
      mensaje: 'No se pudo validar la zona'
    });
  }
});

// ====================================
// ENDPOINTS DE MANTENIMIENTO (Solo CEO)
// ====================================

/**
 * DELETE /api/map/limpiar
 * Eliminar ubicaciones antiguas (más de 24 horas)
 */
router.delete('/limpiar', requireAuth, requireRole('ceo'), async (req, res) => {
  try {
    const eliminados = await locationService.limpiarUbicacionesAntiguas();
    
    res.json({
      success: true,
      mensaje: `Se eliminaron ${eliminados} ubicaciones antiguas`,
      registrosEliminados: eliminados
    });
  } catch (error) {
    console.error('Error limpiando ubicaciones:', error);
    res.status(500).json({ 
      error: 'Error del servidor',
      mensaje: 'No se pudieron limpiar las ubicaciones'
    });
  }
});

// ====================================
// EXPORTAR ROUTER
// ====================================

module.exports = router;
