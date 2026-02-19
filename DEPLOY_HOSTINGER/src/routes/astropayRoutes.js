/**
 * 🛣️ RUTAS ASTROPAY - YAvoy 2026
 * 
 * Rutas para billetera virtual AstroPay
 * Gestión de saldo, recargas y pagos
 */

const express = require('express');
const router = express.Router();
const astropayController = require('../controllers/astropayController');

// Middleware para logging
const logRequest = (req, res, next) => {
  console.log(`🔄 AstroPay ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
};

// 🔑 Obtener configuración de AstroPay
router.get('/config', logRequest, astropayController.getConfig);

// 💵 Consultar saldo de billetera
router.get('/saldo/:userId', logRequest, astropayController.consultarSaldo);

// 💳 Recargar billetera (simulado para testing)
router.post('/recargar', logRequest, astropayController.recargarBilletera);

// 🎯 Crear pago con AstroPay
router.post('/crear-pago', logRequest, astropayController.crearPago);

// ✅ Confirmar pago con AstroPay (debitar saldo)
router.post('/confirmar-pago/:pedidoId', logRequest, astropayController.confirmarPago);

// 📊 Obtener billetera completa de un usuario
router.get('/billetera/:userId', logRequest, astropayController.getBilletera);

module.exports = router;
