/**
 * 💰 CONTROLADOR ASTROPAY - YAvoy 2026
 * 
 * Controlador para billetera virtual AstroPay
 * Usa paymentService.js para toda la lógica de negocio
 */

const paymentService = require('../services/paymentService');

/**
 * 🔑 Obtener configuración de AstroPay
 */
function getConfig(req, res) {
  try {
    const config = paymentService.obtenerConfigAstroPay();
    
    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('❌ Error obteniendo config AstroPay:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuración'
    });
  }
}

/**
 * 💵 Consultar saldo de billetera
 */
function consultarSaldo(req, res) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId requerido'
      });
    }

    const result = paymentService.consultarSaldo(userId);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Error consultando saldo:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al consultar saldo'
    });
  }
}

/**
 * 💳 Recargar billetera (simulado para testing)
 */
function recargarBilletera(req, res) {
  try {
    const { userId, monto } = req.body;

    if (!userId || !monto) {
      return res.status(400).json({
        success: false,
        error: 'userId y monto son requeridos'
      });
    }

    const result = paymentService.recargarBilletera(userId, parseFloat(monto));
    
    res.json(result);
  } catch (error) {
    console.error('❌ Error recargando billetera:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al recargar billetera'
    });
  }
}

/**
 * 🎯 Crear pago con AstroPay
 */
async function crearPago(req, res) {
  try {
    const {
      pedidoId,
      monto,
      descripcion,
      userId,
      clienteNombre,
      clienteEmail
    } = req.body;

    if (!pedidoId || !monto || !userId) {
      return res.status(400).json({
        success: false,
        error: 'pedidoId, monto y userId son requeridos'
      });
    }

    const result = await paymentService.crearPagoAstroPay({
      pedidoId,
      monto: parseFloat(monto),
      descripcion,
      userId,
      clienteNombre,
      clienteEmail
    });

    res.json(result);
  } catch (error) {
    console.error('❌ Error creando pago AstroPay:', error);
    
    if (error.message === 'Saldo insuficiente') {
      return res.status(400).json({
        success: false,
        error: error.message,
        saldo: error.saldo,
        requerido: error.requerido
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Error al crear pago'
    });
  }
}

/**
 * ✅ Confirmar pago con AstroPay (debitar saldo)
 */
async function confirmarPago(req, res) {
  try {
    const { pedidoId } = req.params;

    if (!pedidoId) {
      return res.status(400).json({
        success: false,
        error: 'pedidoId requerido'
      });
    }

    const result = await paymentService.confirmarPagoAstroPay(pedidoId);

    res.json(result);
  } catch (error) {
    console.error('❌ Error confirmando pago AstroPay:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al confirmar pago'
    });
  }
}

/**
 * 📊 Obtener billetera de un usuario
 */
function getBilletera(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId requerido'
      });
    }

    const billetera = paymentService.obtenerBilletera(userId);

    if (!billetera) {
      return res.status(404).json({
        success: false,
        error: 'Billetera no encontrada'
      });
    }

    res.json({
      success: true,
      billetera
    });
  } catch (error) {
    console.error('❌ Error obteniendo billetera:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener billetera'
    });
  }
}

module.exports = {
  getConfig,
  consultarSaldo,
  recargarBilletera,
  crearPago,
  confirmarPago,
  getBilletera
};
