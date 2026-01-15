/**
 * 💳 CONTROLADOR MERCADOPAGO - YAvoy 2026
 * 
 * Controlador completo para manejo de pagos con MercadoPago
 * Incluye QR dinámicos, webhooks y validaciones de seguridad
 */

const https = require('https');
const crypto = require('crypto');
const mercadopagoConfig = require('../config/mercadopago');

// Función helper para hacer requests HTTP
const makeHttpRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ 
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => jsonData,
            text: () => data
          });
        } catch (error) {
          resolve({ 
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => ({}),
            text: () => data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
};

class MercadoPagoController {
  constructor() {
    this.activePayments = new Map(); // QRs activos
    this.processedPayments = new Set(); // Prevenir duplicados
    
    // Validar configuración al inicializar
    mercadopagoConfig.validate();
  }

  /**
   * 🔑 Obtener clave pública
   */
  async getPublicKey(req, res) {
    try {
      if (!mercadopagoConfig.PUBLIC_KEY || mercadopagoConfig.PUBLIC_KEY.includes('tu_')) {
        return res.status(500).json({
          success: false,
          error: 'MercadoPago no configurado correctamente'
        });
      }

      res.json({
        success: true,
        publicKey: mercadopagoConfig.PUBLIC_KEY,
        environment: mercadopagoConfig.environment.isProduction ? 'production' : 'test'
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
  async crearQR(req, res) {
    try {
      const {
        pedidoId,
        monto,
        descripcion,
        comercio,
        cliente,
        email,
        token
      } = req.body;

      // Validaciones
      if (!pedidoId || !monto || monto <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Datos de pedido inválidos'
        });
      }

      // Verificar que no exista un QR activo para este pedido
      if (this.activePayments.has(pedidoId)) {
        const existing = this.activePayments.get(pedidoId);
        if (Date.now() < existing.expiresAt) {
          return res.json({
            success: true,
            qr_data: existing.qr_data,
            qr_image: existing.qr_image,
            payment_id: existing.payment_id,
            message: 'QR existente aún válido'
          });
        }
      }

      // Crear preferencia de pago
      const preference = {
        items: [
          {
            id: `yavoy_pedido_${pedidoId}`,
            title: descripcion || `Pedido #${pedidoId}`,
            description: `${comercio} - YAvoy`,
            quantity: 1,
            unit_price: parseFloat(monto),
            currency_id: mercadopagoConfig.PAYMENT_CONFIG.CURRENCY
          }
        ],
        external_reference: `${mercadopagoConfig.QR_CONFIG.EXTERNAL_REFERENCE_PREFIX}${pedidoId}`,
        auto_return: mercadopagoConfig.QR_CONFIG.AUTO_RETURN,
        back_urls: {
          success: mercadopagoConfig.QR_CONFIG.SUCCESS_URL,
          failure: mercadopagoConfig.QR_CONFIG.FAILURE_URL,
          pending: mercadopagoConfig.QR_CONFIG.PENDING_URL
        },
        notification_url: mercadopagoConfig.QR_CONFIG.WEBHOOK_URL,
        payment_methods: mercadopagoConfig.PAYMENT_CONFIG.PAYMENT_METHODS,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + (mercadopagoConfig.QR_CONFIG.EXPIRATION_MINUTES * 60 * 1000)).toISOString(),
        metadata: {
          pedido_id: pedidoId,
          comercio: comercio,
          cliente: cliente,
          token: token,
          timestamp: Date.now(),
          platform: 'yavoy-web'
        },
        additional_info: {
          payer: {
            first_name: cliente?.split(' ')[0] || 'Cliente',
            last_name: cliente?.split(' ')[1] || 'YAvoy'
          },
          items: [
            {
              id: `yavoy_pedido_${pedidoId}`,
              title: descripcion,
              description: `Pedido de ${comercio}`,
              quantity: 1,
              unit_price: parseFloat(monto)
            }
          ]
        }
      };

      // Crear la preferencia en MercadoPago
      const response = await makeHttpRequest(`${mercadopagoConfig.API_BASE_URL}/checkout/preferences`, {
        method: 'POST',
        headers: mercadopagoConfig.getHeaders(),
        body: JSON.stringify(preference)
      });

      if (!response.ok) {
        const errorData = response.text();
        console.error('❌ Error API MercadoPago:', errorData);
        throw new Error(`Error ${response.status}: ${errorData}`);
      }

      const preferenceData = response.json();

      // Generar QR usando la sandbox URL o init point
      const qr_data = preferenceData.sandbox_init_point || preferenceData.init_point;
      const qr_image = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr_data)}`;

      // Almacenar información del QR
      const paymentInfo = {
        pedidoId,
        preference_id: preferenceData.id,
        qr_data,
        qr_image,
        payment_id: preferenceData.id,
        monto: parseFloat(monto),
        token,
        createdAt: Date.now(),
        expiresAt: Date.now() + (mercadopagoConfig.QR_CONFIG.EXPIRATION_MINUTES * 60 * 1000),
        status: 'pending'
      };

      this.activePayments.set(pedidoId, paymentInfo);

      // Auto-expirar
      setTimeout(() => {
        this.activePayments.delete(pedidoId);
      }, mercadopagoConfig.QR_CONFIG.EXPIRATION_MINUTES * 60 * 1000);

      console.log(`✅ QR creado para pedido ${pedidoId}: $${monto}`);

      res.json({
        success: true,
        qr_data,
        qr_image,
        payment_id: preferenceData.id,
        preference_id: preferenceData.id,
        expires_at: paymentInfo.expiresAt
      });

    } catch (error) {
      console.error('❌ Error creando QR:', error);
      res.status(500).json({
        success: false,
        error: 'Error al crear QR de pago'
      });
    }
  }

  /**
   * 🔍 Verificar estado de pago
   */
  async verificarPago(req, res) {
    try {
      const { pedidoId } = req.params;

      const paymentInfo = this.activePayments.get(pedidoId);
      if (!paymentInfo) {
        return res.status(404).json({
          success: false,
          error: 'Pago no encontrado'
        });
      }

      // Verificar si expiró
      if (Date.now() > paymentInfo.expiresAt) {
        this.activePayments.delete(pedidoId);
        return res.json({
          success: true,
          status: 'expired',
          message: 'QR de pago expirado'
        });
      }

      // Consultar estado en MercadoPago (opcional - usa webhooks para tiempo real)
      try {
        const response = await makeHttpRequest(`${mercadopagoConfig.API_BASE_URL}/checkout/preferences/${paymentInfo.preference_id}`, {
          headers: mercadopagoConfig.getHeaders()
        });

        if (response.ok) {
          const preferenceData = response.json();
          
          res.json({
            success: true,
            status: paymentInfo.status,
            pedidoId,
            preference_id: paymentInfo.preference_id,
            expires_at: paymentInfo.expiresAt,
            time_remaining: Math.max(0, paymentInfo.expiresAt - Date.now())
          });
        } else {
          throw new Error('No se pudo verificar con MercadoPago');
        }

      } catch (mpError) {
        // Fallback: retornar estado local
        res.json({
          success: true,
          status: paymentInfo.status,
          pedidoId,
          expires_at: paymentInfo.expiresAt,
          time_remaining: Math.max(0, paymentInfo.expiresAt - Date.now()),
          note: 'Estado local (sin verificación MP)'
        });
      }

    } catch (error) {
      console.error('❌ Error verificando pago:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar pago'
      });
    }
  }

  /**
   * 🔔 Webhook de MercadoPago
   */
  async webhook(req, res) {
    try {
      const { type, action, data, date_created, id } = req.body;

      console.log(`📥 Webhook recibido: ${type} - ${action}`, data);

      // Validar signature (si está configurado)
      if (mercadopagoConfig.WEBHOOK_SECRET) {
        const signature = req.headers['x-signature'];
        if (signature && !this.validateWebhookSignature(req.body, signature)) {
          console.error('❌ Webhook signature inválida');
          return res.status(401).json({ error: 'Signature inválida' });
        }
      }

      // Procesar según el tipo
      if (type === 'payment' && action === 'payment.updated' && data?.id) {
        await this.procesarWebhookPago(data.id);
      }

      res.status(200).json({ success: true });

    } catch (error) {
      console.error('❌ Error en webhook:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }

  /**
   * 🔒 Validar firma del webhook
   */
  validateWebhookSignature(body, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', mercadopagoConfig.WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * 💰 Procesar webhook de pago
   */
  async procesarWebhookPago(paymentId) {
    try {
      // Prevenir duplicados
      if (this.processedPayments.has(paymentId)) {
        console.log('⚠️ Pago ya procesado:', paymentId);
        return;
      }

      // Obtener detalles del pago
      const response = await makeHttpRequest(`${mercadopagoConfig.API_BASE_URL}/v1/payments/${paymentId}`, {
        headers: mercadopagoConfig.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo pago: ${response.status}`);
      }

      const payment = response.json();
      const pedidoId = payment.external_reference?.replace(mercadopagoConfig.QR_CONFIG.EXTERNAL_REFERENCE_PREFIX, '');

      if (payment.status === 'approved' && pedidoId) {
        // Marcar como procesado
        this.processedPayments.add(paymentId);

        // Actualizar estado del QR
        if (this.activePayments.has(pedidoId)) {
          const paymentInfo = this.activePayments.get(pedidoId);
          paymentInfo.status = 'approved';
          paymentInfo.payment_id = paymentId;
          paymentInfo.approved_at = Date.now();
        }

        console.log(`✅ Pago aprobado: Pedido ${pedidoId} - $${payment.transaction_amount}`);

        // Aquí puedes agregar lógica adicional:
        // - Actualizar base de datos del pedido
        // - Enviar notificaciones
        // - Disparar siguiente paso del flujo
      }

    } catch (error) {
      console.error('❌ Error procesando webhook de pago:', error);
    }
  }

  /**
   * ✅ Confirmar pago manualmente
   */
  async confirmarPago(req, res) {
    try {
      const { pedidoId } = req.params;
      const { paymentId, paymentStatus, transactionAmount } = req.body;

      console.log(`🎯 Confirmando pago: Pedido ${pedidoId} - Pago ${paymentId}`);

      // Actualizar estado local
      if (this.activePayments.has(pedidoId)) {
        const paymentInfo = this.activePayments.get(pedidoId);
        paymentInfo.status = paymentStatus;
        paymentInfo.payment_id = paymentId;
        paymentInfo.approved_at = Date.now();
      }

      // Aquí puedes actualizar tu base de datos de pedidos
      // Ejemplo: await database.updatePedido(pedidoId, { estado: 'pagado', payment_id: paymentId });

      res.json({
        success: true,
        message: 'Pago confirmado correctamente',
        pedidoId,
        paymentId
      });

    } catch (error) {
      console.error('❌ Error confirmando pago:', error);
      res.status(500).json({
        success: false,
        error: 'Error al confirmar pago'
      });
    }
  }

  /**
   * 📊 Obtener estadísticas de pagos
   */
  async getEstadisticas(req, res) {
    try {
      const stats = {
        qrs_activos: this.activePayments.size,
        pagos_procesados: this.processedPayments.size,
        configuracion: {
          ambiente: mercadopagoConfig.environment.isProduction ? 'PRODUCTION' : 'TEST',
          webhook_configurado: !!mercadopagoConfig.WEBHOOK_SECRET
        }
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
}

module.exports = new MercadoPagoController();