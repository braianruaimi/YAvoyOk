/**
 * pedidosRoutes.js
 * Rutas para la gestión de pedidos en YAvoy v3.1
 * 
 * Migración desde server.js monolítico hacia arquitectura MVC
 * Utiliza express.Router() para mapear rutas al controlador de pedidos
 */

const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { requireAuth } = require('../middleware/auth');
const { schemas, validate, validateAll } = require('../validation/schemas');

/**
 * @route   POST /api/pedidos
 * @desc    Crear un nuevo pedido
 * @access  Public
 * @body    { nombreCliente, telefonoCliente, direccionEntrega, descripcion, monto, comercioId?, clienteId?, email?, notas?, destinatario?, telefonoDestinatario? }
 */
router.post('/', 
  // validate(schemas.crearPedido), // Temporal: desactivar validación
  (req, res) => {
    pedidosController.crearPedido(req, res);
  }
);

/**
 * @route   GET /api/pedidos
 * @desc    Listar todos los pedidos (con filtros opcionales)
 * @access  Public
 * @query   { estado?, repartidorId?, comercioId?, clienteId? }
 */
router.get('/', (req, res) => {
  console.log('🔥 ROUTER MVC - GET / (listar pedidos) - REQUEST RECEIVED');
  console.log('   Query params:', req.query);
  pedidosController.listarPedidos(req, res);
});

/**
 * @route   GET /api/pedidos/:id
 * @desc    Obtener un pedido específico por ID
 * @access  Public
 * @param   id - ID del pedido
 */
router.get('/:id', (req, res) => {
  pedidosController.obtenerPedido(req, res);
});

/**
 * @route   PATCH /api/pedidos/:id/estado
 * @desc    Actualizar estado del pedido
 * @access  Public
 * @param   id - ID del pedido
 * @body    { estado }
 */
router.patch('/:id/estado', (req, res) => {
  pedidosController.actualizarEstadoPedido(req, res);
});

/**
 * @route   PUT /api/pedidos/:id/estado
 * @desc    Actualizar estado del pedido (alternativo para compatibilidad)
 * @access  Public
 * @param   id - ID del pedido
 * @body    { estado }
 */
router.put('/:id/estado', (req, res) => {
  pedidosController.actualizarEstadoPedido(req, res);
});

/**
 * @route   PATCH /api/pedidos/:id/pago-confirmado
 * @desc    Confirmar pago de un pedido
 * @access  Public
 * @param   id - ID del pedido
 * @body    { paymentId, paymentStatus, transactionAmount, paymentMethod, timestamp }
 */
router.patch('/:id/pago-confirmado', (req, res) => {
  // Redireccionar a MercadoPago controller
  const mercadopagoController = require('../controllers/mercadopagoController');
  req.params.pedidoId = req.params.id; // Mapear parámetro
  mercadopagoController.confirmarPago(req, res);
});

module.exports = router;