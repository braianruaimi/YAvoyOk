/**
 * 💳 SISTEMA DE PAGOS MERCADOPAGO CON QR SEGURO
 * YAvoy 2025 - Integración completa con prevención de fraudes
 * 
 * Features:
 * - QR dinámico único por pedido
 * - Validación de webhooks
 * - Prevención de pagos duplicados
 * - Timeout de 15 minutos por QR
 * - Verificación de monto exacto
 * - Logs de auditoría
 */

class MercadoPagoSecure {
  constructor() {
    this.mp = null;
    this.publicKey = null;
    this.qrCodes = new Map(); // Almacenar QRs activos
    this.processedPayments = new Set(); // Prevenir duplicados
    this.init();
  }

  /**
   * Inicializa MercadoPago SDK
   */
  async init() {
    try {
      // Obtener clave pública desde el servidor
      const response = await fetch('/api/mercadopago/public-key');
      const data = await response.json();
      
      if (!data.publicKey) {
        throw new Error('No se pudo obtener la clave pública de MercadoPago');
      }

      this.publicKey = data.publicKey;
      
      // Inicializar SDK
      this.mp = new MercadoPago(this.publicKey, {
        locale: 'es-AR'
      });

      console.log('✅ MercadoPago inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar MercadoPago:', error);
      this.showError('Error al conectar con el sistema de pagos. Intenta más tarde.');
    }
  }

  /**
   * Genera QR dinámico único para un pedido
   * @param {Object} pedidoData - Datos del pedido
   * @returns {Promise<Object>} QR Code data
   */
  async generarQRPago(pedidoData) {
    try {
      const {
        pedidoId,
        monto,
        descripcion,
        comercio,
        cliente,
        email
      } = pedidoData;

      // Validaciones de seguridad
      if (!pedidoId || !monto || monto <= 0) {
        throw new Error('Datos de pedido inválidos');
      }

      // Verificar que el pedido no tenga ya un QR activo
      if (this.qrCodes.has(pedidoId)) {
        const qrExistente = this.qrCodes.get(pedidoId);
        if (this.isQRValid(qrExistente)) {
          return qrExistente; // Retornar QR existente si aún es válido
        }
      }

      // Generar token único para este pedido
      const token = this.generateSecureToken(pedidoId);
      
      // Timestamp para expiración (15 minutos)
      const expiresAt = Date.now() + (15 * 60 * 1000);

      // Crear preferencia de pago en el servidor
      const response = await fetch('/api/mercadopago/crear-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pedidoId,
          monto,
          descripcion: `Pedido #${pedidoId} - ${descripcion}`,
          comercio,
          cliente,
          email,
          token,
          metadata: {
            pedido_id: pedidoId,
            timestamp: Date.now(),
            token: token,
            platform: 'yavoy-web'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Error al generar QR de pago');
      }

      const qrData = await response.json();

      // Almacenar QR con metadata de seguridad
      const qrInfo = {
        pedidoId,
        qrData: qrData.qr_data,
        qrImage: qrData.qr_image,
        paymentId: qrData.payment_id,
        monto,
        token,
        createdAt: Date.now(),
        expiresAt,
        status: 'pending'
      };

      this.qrCodes.set(pedidoId, qrInfo);

      // Auto-expirar el QR después de 15 minutos
      setTimeout(() => {
        this.expireQR(pedidoId);
      }, 15 * 60 * 1000);

      // Log de auditoría
      this.logAudit('QR_GENERATED', {
        pedidoId,
        monto,
        timestamp: new Date().toISOString()
      });

      return qrInfo;

    } catch (error) {
      console.error('❌ Error al generar QR:', error);
      this.showError('No se pudo generar el código QR. Intenta nuevamente.');
      throw error;
    }
  }

  /**
   * Verifica el estado de un pago
   * @param {string} pedidoId - ID del pedido
   * @returns {Promise<Object>} Estado del pago
   */
  async verificarPago(pedidoId) {
    try {
      const response = await fetch(`/api/mercadopago/verificar-pago/${pedidoId}`);
      
      if (!response.ok) {
        throw new Error('Error al verificar el pago');
      }

      const paymentStatus = await response.json();

      // Actualizar estado local
      if (this.qrCodes.has(pedidoId)) {
        const qrInfo = this.qrCodes.get(pedidoId);
        qrInfo.status = paymentStatus.status;
        this.qrCodes.set(pedidoId, qrInfo);
      }

      // Si el pago fue aprobado
      if (paymentStatus.status === 'approved') {
        this.onPaymentApproved(pedidoId, paymentStatus);
      }

      return paymentStatus;

    } catch (error) {
      console.error('❌ Error al verificar pago:', error);
      throw error;
    }
  }

  /**
   * Polling para verificar el pago cada 3 segundos
   * @param {string} pedidoId - ID del pedido
   * @param {Function} callback - Callback cuando se aprueba
   */
  startPaymentPolling(pedidoId, callback) {
    const pollInterval = setInterval(async () => {
      try {
        const qrInfo = this.qrCodes.get(pedidoId);
        
        // Detener polling si el QR expiró
        if (!qrInfo || !this.isQRValid(qrInfo)) {
          clearInterval(pollInterval);
          return;
        }

        // Verificar estado
        const paymentStatus = await this.verificarPago(pedidoId);

        if (paymentStatus.status === 'approved') {
          clearInterval(pollInterval);
          callback(paymentStatus);
        } else if (paymentStatus.status === 'rejected' || paymentStatus.status === 'cancelled') {
          clearInterval(pollInterval);
        }

      } catch (error) {
        console.error('Error en polling:', error);
      }
    }, 3000); // Cada 3 segundos

    // Detener polling después de 15 minutos
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 15 * 60 * 1000);

    return pollInterval;
  }

  /**
   * Procesa webhook de MercadoPago
   * @param {Object} webhookData - Datos del webhook
   */
  async procesarWebhook(webhookData) {
    try {
      const { type, data, action } = webhookData;

      // Solo procesar pagos aprobados
      if (type === 'payment' && action === 'payment.updated') {
        const paymentId = data.id;

        // Verificar que no se haya procesado antes (prevenir duplicados)
        if (this.processedPayments.has(paymentId)) {
          console.warn('⚠️ Pago ya procesado:', paymentId);
          return;
        }

        // Obtener detalles del pago
        const response = await fetch(`/api/mercadopago/payment/${paymentId}`);
        const paymentDetails = await response.json();

        // Validaciones de seguridad
        if (!this.validatePayment(paymentDetails)) {
          this.logAudit('PAYMENT_VALIDATION_FAILED', paymentDetails);
          throw new Error('Pago no válido');
        }

        // Marcar como procesado
        this.processedPayments.add(paymentId);

        // Ejecutar acciones según el estado
        if (paymentDetails.status === 'approved') {
          await this.onPaymentApproved(paymentDetails.metadata.pedido_id, paymentDetails);
        }

        // Log de auditoría
        this.logAudit('WEBHOOK_PROCESSED', {
          paymentId,
          status: paymentDetails.status,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('❌ Error al procesar webhook:', error);
      this.logAudit('WEBHOOK_ERROR', { error: error.message });
    }
  }

  /**
   * Valida que un pago sea legítimo
   * @param {Object} payment - Datos del pago
   * @returns {boolean}
   */
  validatePayment(payment) {
    try {
      // Verificar campos obligatorios
      if (!payment.id || !payment.status || !payment.transaction_amount) {
        return false;
      }

      // Verificar que el monto coincida con el pedido
      const pedidoId = payment.metadata?.pedido_id;
      if (!pedidoId) {
        return false;
      }

      const qrInfo = this.qrCodes.get(pedidoId);
      if (!qrInfo) {
        return false;
      }

      // Verificar monto exacto
      if (Math.abs(payment.transaction_amount - qrInfo.monto) > 0.01) {
        console.error('❌ Monto no coincide:', {
          esperado: qrInfo.monto,
          recibido: payment.transaction_amount
        });
        return false;
      }

      // Verificar token de seguridad
      if (payment.metadata?.token !== qrInfo.token) {
        console.error('❌ Token de seguridad inválido');
        return false;
      }

      // Verificar que el QR no haya expirado
      if (!this.isQRValid(qrInfo)) {
        console.error('❌ QR expirado');
        return false;
      }

      return true;

    } catch (error) {
      console.error('Error en validación:', error);
      return false;
    }
  }

  /**
   * Callback cuando un pago es aprobado
   * @param {string} pedidoId - ID del pedido
   * @param {Object} paymentDetails - Detalles del pago
   */
  async onPaymentApproved(pedidoId, paymentDetails) {
    try {
      console.log('✅ Pago aprobado:', pedidoId);

      // Actualizar estado del pedido en el servidor
      await fetch(`/api/pedidos/${pedidoId}/pago-confirmado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId: paymentDetails.id,
          paymentStatus: 'approved',
          transactionAmount: paymentDetails.transaction_amount,
          paymentMethod: paymentDetails.payment_method_id,
          timestamp: new Date().toISOString()
        })
      });

      // Eliminar QR de la lista de activos
      this.qrCodes.delete(pedidoId);

      // Mostrar notificación al usuario
      this.showSuccess(`¡Pago confirmado! Pedido #${pedidoId}`);

      // Emitir evento para actualizar UI
      window.dispatchEvent(new CustomEvent('pagoAprobado', {
        detail: { pedidoId, paymentDetails }
      }));

      // Enviar notificación push
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        await this.sendPushNotification(pedidoId, 'Pago confirmado ✅');
      }

      // Log de auditoría
      this.logAudit('PAYMENT_APPROVED', {
        pedidoId,
        paymentId: paymentDetails.id,
        monto: paymentDetails.transaction_amount,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error al procesar pago aprobado:', error);
    }
  }

  /**
   * Genera token seguro único
   * @param {string} pedidoId - ID del pedido
   * @returns {string}
   */
  generateSecureToken(pedidoId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const data = `${pedidoId}-${timestamp}-${random}`;
    
    // Simple hash (en producción usar crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Verifica si un QR es válido (no expiró)
   * @param {Object} qrInfo - Información del QR
   * @returns {boolean}
   */
  isQRValid(qrInfo) {
    if (!qrInfo || !qrInfo.expiresAt) {
      return false;
    }
    return Date.now() < qrInfo.expiresAt && qrInfo.status === 'pending';
  }

  /**
   * Expira un QR
   * @param {string} pedidoId - ID del pedido
   */
  expireQR(pedidoId) {
    if (this.qrCodes.has(pedidoId)) {
      const qrInfo = this.qrCodes.get(pedidoId);
      qrInfo.status = 'expired';
      this.qrCodes.set(pedidoId, qrInfo);

      console.log('⏰ QR expirado:', pedidoId);

      // Emitir evento
      window.dispatchEvent(new CustomEvent('qrExpirado', {
        detail: { pedidoId }
      }));
    }
  }

  /**
   * Obtiene el tiempo restante de un QR
   * @param {string} pedidoId - ID del pedido
   * @returns {number} Segundos restantes
   */
  getTimeRemaining(pedidoId) {
    const qrInfo = this.qrCodes.get(pedidoId);
    if (!qrInfo || !qrInfo.expiresAt) {
      return 0;
    }
    
    const remaining = qrInfo.expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  /**
   * Muestra el modal de pago con QR
   * @param {Object} qrInfo - Información del QR
   */
  mostrarModalPago(qrInfo) {
    const modal = document.getElementById('modalPagoQR');
    if (!modal) {
      console.error('Modal de pago no encontrado');
      return;
    }

    // Actualizar contenido
    const qrImage = modal.querySelector('#qrImagePago');
    const montoDisplay = modal.querySelector('#montoPago');
    const timerDisplay = modal.querySelector('#timerPago');
    const pedidoIdDisplay = modal.querySelector('#pedidoIdPago');

    if (qrImage) qrImage.src = qrInfo.qrImage;
    if (montoDisplay) montoDisplay.textContent = `$${qrInfo.monto.toFixed(2)}`;
    if (pedidoIdDisplay) pedidoIdDisplay.textContent = `#${qrInfo.pedidoId}`;

    // Mostrar modal
    modal.classList.add('active');

    // Iniciar countdown
    this.startCountdown(qrInfo.pedidoId, timerDisplay);

    // Iniciar polling de estado
    this.startPaymentPolling(qrInfo.pedidoId, (paymentDetails) => {
      modal.classList.remove('active');
      this.showSuccess('¡Pago confirmado exitosamente! 🎉');
    });
  }

  /**
   * Inicia countdown visual del QR
   * @param {string} pedidoId - ID del pedido
   * @param {HTMLElement} timerElement - Elemento del timer
   */
  startCountdown(pedidoId, timerElement) {
    const updateTimer = () => {
      const remaining = this.getTimeRemaining(pedidoId);
      
      if (remaining <= 0) {
        if (timerElement) {
          timerElement.textContent = 'QR expirado';
          timerElement.style.color = '#ef4444';
        }
        return;
      }

      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      
      if (timerElement) {
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Color de advertencia cuando queden menos de 2 minutos
        if (remaining < 120) {
          timerElement.style.color = '#f59e0b';
        }
      }

      setTimeout(updateTimer, 1000);
    };

    updateTimer();
  }

  /**
   * Envía notificación push
   * @param {string} pedidoId - ID del pedido
   * @param {string} message - Mensaje
   */
  async sendPushNotification(pedidoId, message) {
    try {
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titulo: 'YAvoy - Pago',
          mensaje: message,
          icono: '/icons/icon-192x192.png',
          urlAccion: `/pedidos.html?id=${pedidoId}`
        })
      });
    } catch (error) {
      console.error('Error al enviar notificación:', error);
    }
  }

  /**
   * Log de auditoría
   * @param {string} event - Tipo de evento
   * @param {Object} data - Datos del evento
   */
  logAudit(event, data) {
    const logEntry = {
      event,
      data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    // Enviar al servidor
    fetch('/api/mercadopago/audit-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logEntry)
    }).catch(err => {
      console.error('Error al enviar log:', err);
    });

    // También guardar en localStorage para debugging
    const logs = JSON.parse(localStorage.getItem('yavoy_payment_logs') || '[]');
    logs.push(logEntry);
    
    // Mantener solo los últimos 100 logs
    if (logs.length > 100) {
      logs.shift();
    }
    
    localStorage.setItem('yavoy_payment_logs', JSON.stringify(logs));
  }

  /**
   * Muestra mensaje de error
   * @param {string} message - Mensaje
   */
  showError(message) {
    // Implementar según tu sistema de notificaciones
    if (window.mostrarNotificacion) {
      window.mostrarNotificacion(message, 'error');
    } else {
      alert(message);
    }
  }

  /**
   * Muestra mensaje de éxito
   * @param {string} message - Mensaje
   */
  showSuccess(message) {
    // Implementar según tu sistema de notificaciones
    if (window.mostrarNotificacion) {
      window.mostrarNotificacion(message, 'success');
    } else {
      alert(message);
    }
  }

  /**
   * Limpia QRs expirados (mantenimiento)
   */
  cleanupExpiredQRs() {
    for (const [pedidoId, qrInfo] of this.qrCodes.entries()) {
      if (!this.isQRValid(qrInfo)) {
        this.qrCodes.delete(pedidoId);
      }
    }
  }
}

// Instancia global
window.mercadoPagoSecure = new MercadoPagoSecure();

// Limpieza automática cada 5 minutos
setInterval(() => {
  window.mercadoPagoSecure.cleanupExpiredQRs();
}, 5 * 60 * 1000);
