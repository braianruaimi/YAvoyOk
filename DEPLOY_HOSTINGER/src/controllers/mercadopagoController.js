/**
 * 💳 CONTROLADOR MERCADOPAGO - YAvoy 2026
 * 
 * Controlador simplificado que usa paymentService.js
 * Mantiene compatibilidad con rutas existentes
 */

const paymentService = require('../services/paymentService');
const mercadopagoConfig = require('../config/mercadopago');

/**
 * 🔑 Obtener clave pública de MercadoPago
 */
async function getPublicKey(req, res) {
  try {
    const publicKey = paymentService.MERCADOPAGO_PUBLIC_KEY;
    
    if (!publicKey || publicKey.includes('tu_')) {
      return res.status(500).json({
        success: false,
        error: 'MercadoPago no configurado correctamente'
      });
    }

    res.json({
      success: true,
      publicKey,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'test'
    });

  } catch (error) {
    console.error('❌ Error obteniendo public key:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * 🎯 Crear QR de pago dinámico
 */
async function crearQR(req, res) {
  try {
    const {
      pedidoId,
      monto,
      descripcion,
      comercio,
      cliente,
      email,
      repartidorId
    } = req.body;

    // Validaciones
    if (!pedidoId || !monto || monto <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos de pedido inválidos'
      });
    }

    // Si hay repartidorId, usar QR con comisión CEO
    if (repartidorId) {
      const result = await paymentService.generarQRRepartidor({
        repartidorId,
        pedidoId,
        monto,
        descripcion: descripcion || `Pedido #${pedidoId}`,
        clienteNombre: cliente,
        clienteEmail: email
      });

      return res.json({
        success: true,
        qr_data: result.qr.data,
        qr_image: result.qr.image,
        payment_id: result.qr.preferenceId,
        preference_id: result.qr.preferenceId,
        expires_at: result.expiresAt,
        detalles: result.detalles
      });
    }

    // QR básico sin comisión
    const result = await paymentService.crearQR({
      pedidoId,
      monto,
      descripcion: descripcion || `Pedido #${pedidoId}`,
      clienteNombre: cliente,
      clienteEmail: email
    });

    res.json({
      success: true,
      qr_data: result.qr.data,
      qr_image: result.qr.image,
      payment_id: result.qr.preferenceId,
      preference_id: result.qr.preferenceId,
      expires_at: result.expiresAt
    });

  } catch (error) {
    console.error('❌ Error creando QR:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al crear QR de pago'
    });
  }
}

/**
 * 🔍 Verificar estado de pago
 */
async function verificarPago(req, res) {
  try {
    const { pedidoId } = req.params;

    const result = await paymentService.verificarPago(pedidoId);

    if (result.status === 'not_found') {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Error verificando pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar pago'
    });
  }
}

/**
 * 🔔 Webhook de MercadoPago (general)
 */
async function webhook(req, res) {
  try {
    const { type, action, data } = req.body;

    console.log(`📥 Webhook recibido: ${type} - ${action}`, data);

    // Responder inmediatamente a MercadoPago
    res.status(200).json({ success: true });

    // Procesar webhook de forma asíncrona
    if (type === 'payment' && data?.id) {
      await paymentService.procesarWebhook(type, data.id);
    }

  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.status(500).json({ error: 'Error interno' });
  }
}

/**
 * 🔔 Webhook específico para pagos de repartidor (con comisión CEO)
 */
async function webhookRepartidor(req, res) {
  try {
    const { type, data } = req.body;

    console.log(`📥 Webhook repartidor recibido: ${type}`, data);

    // Responder inmediatamente
    res.status(200).json({ success: true });

    // Procesar webhook de forma asíncrona
    if (type === 'payment' && data?.id) {
      await paymentService.procesarWebhookRepartidor(data.id);
    }

  } catch (error) {
    console.error('❌ Error en webhook repartidor:', error);
    res.status(500).json({ error: 'Error interno' });
  }
}

/**
 * ✅ Confirmar pago manualmente
 */
async function confirmarPago(req, res) {
  try {
    const { pedidoId } = req.params;
    const { paymentId, paymentStatus, transactionAmount, paymentMethod, timestamp } = req.body;

    console.log(`🎯 Confirmando pago: Pedido ${pedidoId} - Pago ${paymentId}`);

    const result = await paymentService.confirmarPago({
      pedidoId,
      paymentId,
      paymentStatus,
      transactionAmount,
      paymentMethod,
      timestamp: timestamp || new Date().toISOString()
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Error confirmando pago:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al confirmar pago'
    });
  }
}

/**
 * 📊 Obtener estadísticas de pagos
 */
async function getEstadisticas(req, res) {
  try {
    const pagosActivos = paymentService.obtenerPagosActivos();
    const comisiones = paymentService.obtenerComisionesAcumuladas();

    const stats = {
      qrs_activos: pagosActivos.length,
      comisiones_acumuladas: comisiones,
      configuracion: {
        ambiente: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'TEST',
        comision_ceo: `${paymentService.CEO_COMISION_PORCENTAJE * 100}%`
      },
      pagos_activos: pagosActivos.map(p => ({
        pedidoId: p.pedidoId,
        monto: p.monto,
        status: p.status,
        metodoPago: p.metodoPago
      }))
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
}

/**
 * 💰 Obtener detalle de un pago
 */
async function getDetallePago(req, res) {
  try {
    const { paymentId } = req.params;

    const payment = await paymentService.obtenerDetallePago(paymentId);

    res.json({
      success: true,
      payment
    });

  } catch (error) {
    console.error('❌ Error obteniendo pago:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener detalles del pago'
    });
  }
}

/**
 * 📝 Guardar log de auditoría
 */
async function auditLog(req, res) {
  try {
    const logEntry = req.body;
    
    await paymentService.guardarAuditLog(logEntry);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error al guardar log:', error);
    res.status(500).json({ success: false, error: 'Error al guardar log' });
  }
}

module.exports = {
  getPublicKey,
  crearQR,
  verificarPago,
  webhook,
  webhookRepartidor,
  confirmarPago,
  getEstadisticas,
  getDetallePago,
  auditLog
};