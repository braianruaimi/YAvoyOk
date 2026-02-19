/**
 * ====================================
 * 💰 PAYMENT SERVICE - YAVOY
 * ====================================
 * 
 * Servicio centralizado para procesar pagos con MercadoPago y AstroPay
 * Maneja comisiones del CEO (15%), transferencias automáticas, y billeteras virtuales
 * 
 * @author YAvoy Team
 * @version 3.0
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

// ====================================
// CONFIGURACIÓN
// ====================================

const BASE_DIR = path.join(__dirname, '..', '..', 'registros');

// MercadoPago
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
const MERCADOPAGO_PUBLIC_KEY = process.env.MERCADOPAGO_PUBLIC_KEY || '';
const CEO_MERCADOPAGO_ACCESS_TOKEN = process.env.CEO_MERCADOPAGO_ACCESS_TOKEN || MERCADOPAGO_ACCESS_TOKEN;
const CEO_MERCADOPAGO_EMAIL = process.env.CEO_MERCADOPAGO_EMAIL || 'ceo@yavoy.com';

// AstroPay
const ASTROPAY_API_KEY = process.env.ASTROPAY_API_KEY || 'test_key';
const ASTROPAY_SECRET_KEY = process.env.ASTROPAY_SECRET_KEY || 'test_secret';
const ASTROPAY_SANDBOX = process.env.ASTROPAY_SANDBOX === 'true';
const ASTROPAY_API_URL = ASTROPAY_SANDBOX 
  ? 'https://sandbox-checkout.astropay.com/api/v1'
  : 'https://checkout.astropay.com/api/v1';

// Comisión del CEO (15%)
const CEO_COMISION_PORCENTAJE = 0.15;

// ====================================
// ALMACENAMIENTO EN MEMORIA
// ====================================

const pagosActivos = new Map(); // pedidoId -> pagoInfo
const pagosCompletados = new Set(); // Set de paymentIds procesados
const billeteras = new Map(); // userId -> { saldo, moneda, historial }
let comisionesAcumuladas = 0;

// ====================================
// FUNCIONES AUXILIARES
// ====================================

/**
 * Cargar repartidor desde archivo JSON
 */
async function cargarRepartidor(repartidorId) {
  try {
    const filePath = path.join(BASE_DIR, 'repartidores', `${repartidorId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error al cargar repartidor ${repartidorId}:`, error);
    return null;
  }
}

/**
 * Guardar repartidor en archivo JSON
 */
async function guardarRepartidor(repartidorId, repartidor) {
  try {
    const filePath = path.join(BASE_DIR, 'repartidores', `${repartidorId}.json`);
    await fs.writeFile(filePath, JSON.stringify(repartidor, null, 2));
    return true;
  } catch (error) {
    console.error(`Error al guardar repartidor ${repartidorId}:`, error);
    return false;
  }
}

/**
 * Cargar pedido desde archivo JSON
 */
async function cargarPedido(pedidoId) {
  try {
    const filePath = path.join(BASE_DIR, 'pedidos', `${pedidoId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error al cargar pedido ${pedidoId}:`, error);
    return null;
  }
}

/**
 * Guardar pedido en archivo JSON
 */
async function guardarPedido(pedidoId, pedido) {
  try {
    const filePath = path.join(BASE_DIR, 'pedidos', `${pedidoId}.json`);
    await fs.writeFile(filePath, JSON.stringify(pedido, null, 2));
    return true;
  } catch (error) {
    console.error(`Error al guardar pedido ${pedidoId}:`, error);
    return false;
  }
}

/**
 * Registrar comisión del CEO en archivo JSON
 */
async function registrarComision(pagoInfo, paymentId) {
  try {
    const comisionesDir = path.join(BASE_DIR, 'comisiones-ceo');
    await fs.mkdir(comisionesDir, { recursive: true });
    
    const transaccion = {
      fecha: new Date().toISOString(),
      pedidoId: pagoInfo.pedidoId,
      repartidorId: pagoInfo.repartidorId,
      repartidorNombre: pagoInfo.repartidorNombre,
      montoTotal: pagoInfo.monto,
      comisionCEO: pagoInfo.comisionCEO,
      montoRepartidor: pagoInfo.montoRepartidor,
      porcentaje: CEO_COMISION_PORCENTAJE * 100,
      paymentId: paymentId,
      transferId: pagoInfo.transferId || null,
      transferStatus: pagoInfo.transferStatus || 'pending',
      cuentaDestinoRepartidor: pagoInfo.cuentaDestinoRepartidor,
      metodoPago: pagoInfo.metodoPago || 'mercadopago'
    };

    const filename = `comision_${pagoInfo.pedidoId}_${Date.now()}.json`;
    await fs.writeFile(
      path.join(comisionesDir, filename),
      JSON.stringify(transaccion, null, 2)
    );

    console.log(`💾 Comisión registrada: ${filename}`);
    return true;
  } catch (error) {
    console.error('Error al registrar comisión:', error);
    return false;
  }
}

// ====================================
// MERCADOPAGO - FUNCIONES CORE
// ====================================

/**
 * Crear QR de MercadoPago para pedido
 */
async function crearQR({ pedidoId, monto, descripcion, clienteNombre, clienteEmail }) {
  try {
    // Validaciones
    if (!monto || monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    // Generar token de seguridad
    const token = crypto.randomBytes(32).toString('hex');

    // Crear preferencia de pago
    const preference = {
      items: [{
        title: descripcion || `Pedido YAvoy #${pedidoId}`,
        quantity: 1,
        unit_price: parseFloat(monto),
        currency_id: 'ARS'
      }],
      payer: {
        name: clienteNombre || 'Cliente YAvoy',
        email: clienteEmail || 'cliente@yavoy.com'
      },
      back_urls: {
        success: `http://localhost:5501/pago-exitoso.html?pedido=${pedidoId}`,
        failure: `http://localhost:5501/pago-fallido.html?pedido=${pedidoId}`,
        pending: `http://localhost:5501/pago-pendiente.html?pedido=${pedidoId}`
      },
      auto_return: 'approved',
      external_reference: pedidoId,
      notification_url: `http://localhost:5501/api/mercadopago/webhook`,
      metadata: {
        pedidoId,
        token,
        sistemaYAvoy: true
      },
      statement_descriptor: 'YAVOY DELIVERY',
      expiration_date_to: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    // Llamar a API de MercadoPago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
      },
      body: JSON.stringify(preference)
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json();
      throw new Error(`MercadoPago error: ${JSON.stringify(errorData)}`);
    }

    const preferenceData = await mpResponse.json();

    // Generar imagen QR
    const qrData = preferenceData.init_point;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    // Registrar pago pendiente
    const pagoInfo = {
      pedidoId,
      preferenceId: preferenceData.id,
      qrData,
      qrImage: qrImageUrl,
      monto: parseFloat(monto),
      token,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000),
      metodoPago: 'mercadopago'
    };

    pagosActivos.set(pedidoId, pagoInfo);

    console.log(`✅ QR generado para pedido ${pedidoId}: ${preferenceData.id}`);

    return {
      success: true,
      qr: {
        image: qrImageUrl,
        data: qrData,
        preferenceId: preferenceData.id
      },
      pedidoId,
      expiresAt: pagoInfo.expiresAt
    };

  } catch (error) {
    console.error('❌ Error al crear QR:', error);
    throw error;
  }
}

/**
 * Generar QR de cobro para repartidor con comisión CEO
 */
async function generarQRRepartidor({ repartidorId, pedidoId, monto, descripcion, clienteNombre, clienteEmail }) {
  try {
    // Validaciones
    if (!monto || monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    // Cargar repartidor
    const repartidor = await cargarRepartidor(repartidorId);
    if (!repartidor) {
      throw new Error('Repartidor no encontrado');
    }

    // Verificar configuración de pago
    if (!repartidor.configPago || (!repartidor.configPago.cbu && !repartidor.configPago.alias)) {
      throw new Error('El repartidor no tiene configurado su CBU/CVU para recibir pagos');
    }

    // Calcular comisiones
    const comisionCEO = monto * CEO_COMISION_PORCENTAJE;
    const montoRepartidor = monto - comisionCEO;

    console.log(`💰 Generando QR para cobro:`);
    console.log(`   Repartidor: ${repartidor.nombre} (${repartidorId})`);
    console.log(`   Monto total: $${monto}`);
    console.log(`   Comisión CEO (15%): $${comisionCEO.toFixed(2)}`);
    console.log(`   Para repartidor (85%): $${montoRepartidor.toFixed(2)}`);

    // Generar token de seguridad
    const token = crypto.randomBytes(32).toString('hex');

    // Crear preferencia de pago (cliente paga a cuenta CEO)
    const preference = {
      items: [{
        title: descripcion || `Pedido YAvoy #${pedidoId}`,
        quantity: 1,
        unit_price: parseFloat(monto),
        currency_id: 'ARS'
      }],
      payer: {
        name: clienteNombre || 'Cliente YAvoy',
        email: clienteEmail || 'cliente@yavoy.com'
      },
      back_urls: {
        success: `http://localhost:5501/pago-exitoso.html?pedido=${pedidoId}`,
        failure: `http://localhost:5501/pago-fallido.html?pedido=${pedidoId}`,
        pending: `http://localhost:5501/pago-pendiente.html?pedido=${pedidoId}`
      },
      auto_return: 'approved',
      external_reference: pedidoId,
      notification_url: `http://localhost:5501/api/webhook/repartidor-pago`,
      metadata: {
        pedidoId,
        repartidorId,
        montoTotal: monto,
        comisionCEO,
        montoRepartidor,
        token,
        sistemaYAvoy: true
      },
      statement_descriptor: 'YAVOY DELIVERY',
      expiration_date_to: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    // Llamar a MercadoPago con credenciales del CEO
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CEO_MERCADOPAGO_ACCESS_TOKEN}`
      },
      body: JSON.stringify(preference)
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json();
      throw new Error(`MercadoPago error: ${JSON.stringify(errorData)}`);
    }

    const preferenceData = await mpResponse.json();

    // Generar QR
    const qrData = preferenceData.init_point;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    // Registrar pago pendiente
    const pagoInfo = {
      pedidoId,
      repartidorId,
      repartidorNombre: repartidor.nombre,
      preferenceId: preferenceData.id,
      qrData,
      qrImage: qrImageUrl,
      monto: parseFloat(monto),
      comisionCEO,
      montoRepartidor,
      token,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000),
      cuentaDestinoCEO: CEO_MERCADOPAGO_EMAIL,
      cuentaDestinoRepartidor: repartidor.configPago.cbu || repartidor.configPago.alias,
      metodoPago: 'mercadopago'
    };

    pagosActivos.set(pedidoId, pagoInfo);

    console.log(`✅ QR generado exitosamente para ${repartidorId}`);
    console.log(`   Preference ID: ${preferenceData.id}`);
    console.log(`   💰 Cliente paga a cuenta CEO: ${CEO_MERCADOPAGO_EMAIL}`);
    console.log(`   📤 Sistema transferirá $${montoRepartidor.toFixed(2)} a: ${repartidor.configPago.cbu || repartidor.configPago.alias}`);

    return {
      success: true,
      qr: {
        image: qrImageUrl,
        data: qrData,
        preferenceId: preferenceData.id
      },
      detalles: {
        montoTotal: monto,
        comisionCEO,
        montoRepartidor,
        porcentajeComision: `${CEO_COMISION_PORCENTAJE * 100}%`,
        cuentaReceptora: CEO_MERCADOPAGO_EMAIL,
        transferencia: `$${montoRepartidor.toFixed(2)} será transferido a ${repartidor.nombre}`
      },
      pedidoId,
      expiresAt: pagoInfo.expiresAt
    };

  } catch (error) {
    console.error('❌ Error al generar QR de cobro:', error);
    throw error;
  }
}

/**
 * Verificar estado de pago
 */
async function verificarPago(pedidoId) {
  try {
    const pagoActivo = pagosActivos.get(pedidoId);
    
    if (!pagoActivo) {
      return {
        status: 'not_found',
        error: 'Pago no encontrado'
      };
    }

    // Verificar si expiró
    if (Date.now() > pagoActivo.expiresAt) {
      pagosActivos.delete(pedidoId);
      return {
        status: 'expired',
        message: 'El QR ha expirado'
      };
    }

    return {
      status: pagoActivo.status,
      monto: pagoActivo.monto,
      createdAt: pagoActivo.createdAt,
      expiresAt: pagoActivo.expiresAt
    };

  } catch (error) {
    console.error('Error al verificar pago:', error);
    throw error;
  }
}

/**
 * Procesar webhook de pago repartidor (con transferencia automática)
 */
async function procesarWebhookRepartidor(paymentId) {
  try {
    console.log(`🔍 Procesando pago ID: ${paymentId}`);

    // Buscar pago pendiente
    const pagoRegistrado = Array.from(pagosActivos.entries())
      .find(([_, pago]) => pago.preferenceId && pago.status === 'pending');

    if (!pagoRegistrado) {
      console.warn(`⚠️ No se encontró pago pendiente para procesar`);
      return false;
    }

    const [pedidoId, pagoInfo] = pagoRegistrado;

    console.log(`💰 Pago detectado para pedido: ${pedidoId}`);
    console.log(`   Repartidor: ${pagoInfo.repartidorNombre} (${pagoInfo.repartidorId})`);
    console.log(`   Monto total: $${pagoInfo.monto}`);
    console.log(`   Comisión CEO: $${pagoInfo.comisionCEO}`);

    // Actualizar estado del pago
    pagoInfo.status = 'approved';
    pagoInfo.paymentId = paymentId;
    pagoInfo.approvedAt = Date.now();
    pagosActivos.set(pedidoId, pagoInfo);
    pagosCompletados.add(paymentId);

    // Retener comisión (15% queda en cuenta CEO)
    comisionesAcumuladas += pagoInfo.comisionCEO;

    console.log(`✅ Comisión retenida: $${pagoInfo.comisionCEO.toFixed(2)}`);
    console.log(`📊 Total comisiones CEO: $${comisionesAcumuladas.toFixed(2)}`);

    // Transferir automáticamente el 85% al repartidor
    const repartidor = await cargarRepartidor(pagoInfo.repartidorId);
    
    if (repartidor && pagoInfo.cuentaDestinoRepartidor) {
      console.log(`\n💸 Iniciando transferencia automática...`);
      console.log(`   Monto: $${pagoInfo.montoRepartidor.toFixed(2)}`);
      console.log(`   Destino: ${pagoInfo.cuentaDestinoRepartidor}`);
      
      try {
        // Transferir usando MercadoPago Money Transfer API
        const transferResponse = await fetch('https://api.mercadopago.com/v1/money_transfers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CEO_MERCADOPAGO_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            amount: parseFloat(pagoInfo.montoRepartidor.toFixed(2)),
            description: `Pago pedido #${pedidoId} - YAvoy Delivery`,
            destination: {
              type: repartidor.configPago.cbu ? 'bank_account' : 'alias',
              value: pagoInfo.cuentaDestinoRepartidor
            },
            metadata: {
              pedidoId,
              repartidorId: pagoInfo.repartidorId,
              comisionRetenida: pagoInfo.comisionCEO
            }
          })
        });

        if (transferResponse.ok) {
          const transferData = await transferResponse.json();
          console.log(`✅ Transferencia exitosa!`);
          console.log(`   Transfer ID: ${transferData.id}`);
          
          pagoInfo.transferId = transferData.id;
          pagoInfo.transferStatus = 'completed';
          pagosActivos.set(pedidoId, pagoInfo);
        } else {
          const errorData = await transferResponse.json();
          console.error(`❌ Error en transferencia:`, errorData);
          pagoInfo.transferStatus = 'failed';
          pagoInfo.transferError = errorData;
          pagosActivos.set(pedidoId, pagoInfo);
        }
      } catch (transferError) {
        console.error(`❌ Error al transferir:`, transferError);
        pagoInfo.transferStatus = 'failed';
        pagoInfo.transferError = transferError.message;
        pagosActivos.set(pedidoId, pagoInfo);
      }
    }

    // Actualizar saldo del repartidor
    if (repartidor) {
      repartidor.saldoTotal = (repartidor.saldoTotal || 0) + pagoInfo.montoRepartidor;
      repartidor.comisionesRetenidas = (repartidor.comisionesRetenidas || 0) + pagoInfo.comisionCEO;
      repartidor.pedidosCompletados = (repartidor.pedidosCompletados || 0) + 1;
      
      if (pagoInfo.transferId) {
        repartidor.ultimaTransferencia = {
          id: pagoInfo.transferId,
          monto: pagoInfo.montoRepartidor,
          fecha: new Date().toISOString(),
          pedidoId
        };
      }

      await guardarRepartidor(pagoInfo.repartidorId, repartidor);

      console.log(`👤 Repartidor actualizado:`);
      console.log(`   Saldo: $${repartidor.saldoTotal.toFixed(2)}`);
      console.log(`   Comisiones retenidas: $${repartidor.comisionesRetenidas.toFixed(2)}`);
    }

    // Actualizar pedido
    const pedido = await cargarPedido(pedidoId);
    if (pedido) {
      pedido.pagado = true;
      pedido.metodoPago = 'mercadopago';
      pedido.montoPagado = pagoInfo.monto;
      pedido.pagoId = paymentId;
      pedido.fechaPago = new Date().toISOString();
      pedido.comisionCEO = pagoInfo.comisionCEO;
      pedido.montoRepartidor = pagoInfo.montoRepartidor;
      
      await guardarPedido(pedidoId, pedido);
    }

    // Registrar comisión
    await registrarComision(pagoInfo, paymentId);

    console.log(`✅ Proceso de comisión completado para pedido ${pedidoId}`);
    return true;

  } catch (error) {
    console.error('❌ Error en webhook repartidor:', error);
    return false;
  }
}

/**
 * Procesar webhook general de MercadoPago
 */
async function procesarWebhook(type, paymentId) {
  try {
    console.log(`📨 Procesando webhook: ${type} - Payment ID: ${paymentId}`);

    if (type !== 'payment') {
      console.log('Tipo de webhook no es payment, ignorando');
      return true;
    }

    // Obtener detalles del pago
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
      }
    });

    if (!paymentResponse.ok) {
      console.error('Error al obtener detalles del pago');
      return false;
    }

    const payment = await paymentResponse.json();
    const pedidoId = payment.external_reference;

    // Validar que el pedido exista
    const pagoActivo = pagosActivos.get(pedidoId);
    if (!pagoActivo) {
      console.warn(`⚠️ Pago recibido para pedido inexistente: ${pedidoId}`);
      return false;
    }

    // Prevenir procesamiento duplicado
    if (pagosCompletados.has(payment.id)) {
      console.warn(`⚠️ Pago ya procesado: ${payment.id}`);
      return true;
    }

    // Validar monto
    if (Math.abs(payment.transaction_amount - pagoActivo.monto) > 0.01) {
      console.error(`❌ Monto no coincide para pedido ${pedidoId}`);
      return false;
    }

    // Validar token de seguridad
    if (payment.metadata?.token !== pagoActivo.token) {
      console.error(`❌ Token inválido para pedido ${pedidoId}`);
      return false;
    }

    // Actualizar estado según el pago
    if (payment.status === 'approved') {
      pagoActivo.status = 'approved';
      pagoActivo.paymentId = payment.id;
      pagoActivo.approvedAt = Date.now();
      
      pagosCompletados.add(payment.id);
      pagosActivos.set(pedidoId, pagoActivo);

      // Actualizar pedido
      const pedido = await cargarPedido(pedidoId);
      if (pedido) {
        pedido.pagado = true;
        pedido.metodoPago = payment.payment_method_id;
        pedido.montoPagado = payment.transaction_amount;
        pedido.pagoId = payment.id;
        pedido.fechaPago = new Date().toISOString();
        
        await guardarPedido(pedidoId, pedido);
      }

      console.log(`✅ Pago aprobado para pedido ${pedidoId}: $${payment.transaction_amount}`);
      return true;

    } else if (payment.status === 'rejected') {
      pagoActivo.status = 'rejected';
      pagosActivos.set(pedidoId, pagoActivo);
      console.log(`❌ Pago rechazado para pedido ${pedidoId}`);
      return false;
    }

    return true;

  } catch (error) {
    console.error('❌ Error al procesar webhook:', error);
    return false;
  }
}

/**
 * Obtener detalles de un pago desde MercadoPago
 */
async function obtenerDetallePago(paymentId) {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener detalles del pago');
    }

    const payment = await response.json();
    return payment;

  } catch (error) {
    console.error('Error al obtener pago:', error);
    throw error;
  }
}

/**
 * Confirmar pago de pedido manualmente
 */
async function confirmarPago({ pedidoId, paymentId, paymentStatus, transactionAmount, paymentMethod, timestamp }) {
  try {
    const pedido = await cargarPedido(pedidoId);
    
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    pedido.pagado = true;
    pedido.pagoId = paymentId;
    pedido.estadoPago = paymentStatus;
    pedido.montoPagado = transactionAmount;
    pedido.metodoPago = paymentMethod;
    pedido.fechaPago = timestamp;

    await guardarPedido(pedidoId, pedido);

    return { success: true, pedido };

  } catch (error) {
    console.error('Error al confirmar pago:', error);
    throw error;
  }
}

/**
 * Guardar log de auditoría de pagos
 */
async function guardarAuditLog(logEntry) {
  try {
    const logsDir = path.join(BASE_DIR, 'logs-pagos');
    await fs.mkdir(logsDir, { recursive: true });
    
    const fecha = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `pagos-${fecha}.json`);
    
    let logs = [];
    try {
      const existingLogs = await fs.readFile(logFile, 'utf-8');
      logs = JSON.parse(existingLogs);
    } catch {
      // Archivo no existe, crear nuevo
    }
    
    logs.push(logEntry);
    await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error al guardar log:', error);
    return false;
  }
}

// ====================================
// ASTROPAY - BILLETERA VIRTUAL
// ====================================

/**
 * Obtener configuración de AstroPay
 */
function obtenerConfigAstroPay() {
  return {
    apiKey: ASTROPAY_API_KEY,
    sandbox: ASTROPAY_SANDBOX,
    apiUrl: ASTROPAY_API_URL
  };
}

/**
 * Consultar saldo de billetera
 */
function consultarSaldo(userId) {
  const billetera = billeteras.get(userId) || { 
    saldo: 0, 
    moneda: 'ARS',
    userId 
  };
  
  return {
    success: true,
    saldo: billetera.saldo,
    moneda: billetera.moneda,
    ultimaActualizacion: billetera.ultimaActualizacion || new Date().toISOString()
  };
}

/**
 * Recargar billetera (simulado para testing)
 */
function recargarBilletera(userId, monto) {
  if (!userId || !monto || monto <= 0) {
    throw new Error('Datos inválidos: se requiere userId y monto válido');
  }

  // Obtener o crear billetera
  let billetera = billeteras.get(userId) || {
    saldo: 0,
    moneda: 'ARS',
    userId,
    historial: []
  };

  // Agregar monto
  billetera.saldo += parseFloat(monto);
  billetera.ultimaActualizacion = new Date().toISOString();
  billetera.historial.push({
    tipo: 'recarga',
    monto: parseFloat(monto),
    fecha: new Date().toISOString(),
    descripcion: 'Recarga de saldo'
  });

  billeteras.set(userId, billetera);

  console.log(`💰 Recarga exitosa: ${userId} +$${monto} → Saldo: $${billetera.saldo}`);

  return {
    success: true,
    saldo: billetera.saldo,
    moneda: billetera.moneda,
    recarga: parseFloat(monto)
  };
}

/**
 * Crear pago con AstroPay
 */
async function crearPagoAstroPay({ pedidoId, monto, descripcion, userId, clienteNombre, clienteEmail }) {
  try {
    // Validaciones
    if (!pedidoId || !monto || monto <= 0) {
      throw new Error('Datos inválidos: se requiere pedidoId y monto válido');
    }

    if (!userId) {
      throw new Error('Usuario requerido para pagar con AstroPay');
    }

    // Verificar saldo suficiente
    const billetera = billeteras.get(userId);
    if (!billetera || billetera.saldo < monto) {
      const error = new Error('Saldo insuficiente');
      error.saldo = billetera?.saldo || 0;
      error.requerido = monto;
      throw error;
    }

    // Generar token de seguridad
    const token = crypto.randomBytes(32).toString('hex');

    // Crear registro de pago pendiente
    const pagoInfo = {
      pedidoId,
      monto: parseFloat(monto),
      descripcion: descripcion || 'Pedido YAvoy',
      userId,
      clienteNombre,
      clienteEmail,
      token,
      status: 'pending',
      metodoPago: 'astropay',
      createdAt: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000),
      billetera: {
        saldoAntes: billetera.saldo,
        saldoDespues: billetera.saldo - monto
      }
    };

    pagosActivos.set(pedidoId, pagoInfo);

    console.log(`💰 Pago AstroPay creado: ${pedidoId} - $${monto} (Usuario: ${userId})`);

    return {
      success: true,
      pedidoId,
      monto: parseFloat(monto),
      metodoPago: 'astropay',
      status: 'pending',
      mensaje: 'Pago creado, confirme para debitar de su billetera'
    };

  } catch (error) {
    console.error('Error al crear pago AstroPay:', error);
    throw error;
  }
}

/**
 * Confirmar pago con AstroPay (debitar saldo)
 */
async function confirmarPagoAstroPay(pedidoId) {
  try {
    const pagoInfo = pagosActivos.get(pedidoId);
    
    if (!pagoInfo) {
      throw new Error('Pago no encontrado');
    }

    if (pagoInfo.metodoPago !== 'astropay') {
      throw new Error('El método de pago no es AstroPay');
    }

    // Verificar expiración
    if (Date.now() > pagoInfo.expiresAt) {
      pagosActivos.delete(pedidoId);
      throw new Error('El pago ha expirado');
    }

    // Debitar saldo de billetera
    const billetera = billeteras.get(pagoInfo.userId);
    if (!billetera || billetera.saldo < pagoInfo.monto) {
      throw new Error('Saldo insuficiente');
    }

    billetera.saldo -= pagoInfo.monto;
    billetera.ultimaActualizacion = new Date().toISOString();
    billetera.historial.push({
      tipo: 'pago',
      monto: pagoInfo.monto,
      fecha: new Date().toISOString(),
      descripcion: pagoInfo.descripcion,
      pedidoId
    });

    billeteras.set(pagoInfo.userId, billetera);

    // Actualizar pago
    pagoInfo.status = 'approved';
    pagoInfo.approvedAt = Date.now();
    pagoInfo.paymentId = `astropay_${Date.now()}`;
    pagosActivos.set(pedidoId, pagoInfo);
    pagosCompletados.add(pagoInfo.paymentId);

    // Actualizar pedido
    const pedido = await cargarPedido(pedidoId);
    if (pedido) {
      pedido.pagado = true;
      pedido.metodoPago = 'astropay';
      pedido.montoPagado = pagoInfo.monto;
      pedido.pagoId = pagoInfo.paymentId;
      pedido.fechaPago = new Date().toISOString();
      
      await guardarPedido(pedidoId, pedido);
    }

    console.log(`✅ Pago AstroPay confirmado: ${pedidoId} - $${pagoInfo.monto}`);
    console.log(`   Nuevo saldo: $${billetera.saldo}`);

    return {
      success: true,
      pedidoId,
      monto: pagoInfo.monto,
      saldoRestante: billetera.saldo,
      paymentId: pagoInfo.paymentId
    };

  } catch (error) {
    console.error('Error al confirmar pago AstroPay:', error);
    throw error;
  }
}

// ====================================
// GESTORES DE ESTADO
// ====================================

/**
 * Obtener todos los pagos activos
 */
function obtenerPagosActivos() {
  return Array.from(pagosActivos.entries()).map(([pedidoId, pago]) => ({
    pedidoId,
    ...pago
  }));
}

/**
 * Obtener comisiones acumuladas del CEO
 */
function obtenerComisionesAcumuladas() {
  return comisionesAcumuladas;
}

/**
 * Obtener billetera de un usuario
 */
function obtenerBilletera(userId) {
  return billeteras.get(userId) || null;
}

// ====================================
// EXPORTACIONES
// ====================================

module.exports = {
  // MercadoPago
  crearQR,
  generarQRRepartidor,
  verificarPago,
  procesarWebhookRepartidor,
  procesarWebhook,
  obtenerDetallePago,
  confirmarPago,
  guardarAuditLog,
  
  // AstroPay
  obtenerConfigAstroPay,
  consultarSaldo,
  recargarBilletera,
  crearPagoAstroPay,
  confirmarPagoAstroPay,
  
  // Gestores de estado
  obtenerPagosActivos,
  obtenerComisionesAcumuladas,
  obtenerBilletera,
  
  // Constantes
  CEO_COMISION_PORCENTAJE,
  MERCADOPAGO_PUBLIC_KEY
};
