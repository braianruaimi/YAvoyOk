/**
 * 🛣️ RUTAS MERCADOPAGO - YAvoy 2026
 * 
 * Rutas completas para la API de MercadoPago
 * Incluye todas las funcionalidades necesarias para los pagos
 */

const express = require('express');
const router = express.Router();
const mercadopagoController = require('../controllers/mercadopagoController');

// Middleware para logging de requests
const logRequest = (req, res, next) => {
  console.log(`🔄 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
};

// 🔑 Obtener clave pública
router.get('/public-key', logRequest, mercadopagoController.getPublicKey);

// 🎯 Crear QR de pago
router.post('/crear-qr', logRequest, mercadopagoController.crearQR);

// 🔍 Verificar estado de pago
router.get('/verificar-pago/:pedidoId', logRequest, mercadopagoController.verificarPago);

// ✅ Confirmar pago (PATCH para actualizar estado)
router.patch('/confirmar-pago/:pedidoId', logRequest, mercadopagoController.confirmarPago);

// 🔔 Webhook de MercadoPago genérico
router.post('/webhook', mercadopagoController.webhook);

// 🔔 Webhook de MercadoPago para pagos de repartidor (con comisión CEO)
router.post('/webhook/repartidor-pago', mercadopagoController.webhookRepartidor);

// 💰 Obtener detalles de un pago específico
router.get('/payment/:paymentId', logRequest, mercadopagoController.getDetallePago);

// 📝 Log de auditoría de pagos
router.post('/audit-log', logRequest, mercadopagoController.auditLog);

// 📊 Estadísticas de pagos (para admin)
router.get('/stats', logRequest, mercadopagoController.getEstadisticas);

// 🧪 Endpoints de testing (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  // Test de configuración
  router.get('/test/config', (req, res) => {
    const paymentService = require('../services/paymentService');
    res.json({
      success: true,
      config: {
        environment: process.env.NODE_ENV || 'development',
        has_access_token: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
        has_public_key: !!process.env.MERCADOPAGO_PUBLIC_KEY,
        comision_ceo: `${paymentService.CEO_COMISION_PORCENTAJE * 100}%`
      }
    });
  });

  // Test de webhook simulado
  router.post('/test/webhook-simulation', (req, res) => {
    const simulatedWebhook = {
      type: 'payment',
      action: 'payment.updated',
      data: {
        id: 'test_payment_' + Date.now()
      },
      date_created: new Date().toISOString()
    };

    mercadopagoController.webhook({
      body: simulatedWebhook,
      headers: {}
    }, res);
  });
}

module.exports = router;