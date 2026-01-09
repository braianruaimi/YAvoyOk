/**
 * 💵 SISTEMA DE PROPINAS DIGITAL - YAvoy 2026
 * 
 * Sistema completo de propinas integrado con MercadoPago
 * - Opciones predefinidas: 5%, 10%, 15%
 * - Propina personalizada
 * - Pago directo al repartidor
 * - Badges y reconocimientos
 * - Estadísticas de propinas
 * 
 * @version 2.0.0
 * @author YAvoy Team
 * @date 2025-12-11
 */

class SistemaPropinas {
  constructor() {
    this.propinas = new Map();
    this.repartidoresTop = [];
    this.initialized = false;
  }

  async init() {
    console.log('💵 Inicializando Sistema de Propinas...');
    await this.cargarPropinas();
    this.setupEventListeners();
    this.initialized = true;
    console.log('✅ Sistema de Propinas inicializado');
    return true;
  }

  async cargarPropinas() {
    try {
      const response = await fetch('/api/propinas');
      const data = await response.json();
      data.forEach(p => this.propinas.set(p.id, p));
    } catch (error) {
      console.error('Error cargando propinas:', error);
    }
  }

  mostrarModalPropina(pedidoId, repartidorId, nombreRepartidor) {
    const modal = document.getElementById('modalPropina');
    if (!modal) return;

    modal.dataset.pedidoId = pedidoId;
    modal.dataset.repartidorId = repartidorId;
    
    const nombreEl = modal.querySelector('.nombre-repartidor');
    if (nombreEl) nombreEl.textContent = nombreRepartidor;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  cerrarModalPropina() {
    const modal = document.getElementById('modalPropina');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  async procesarPropina(pedidoId, repartidorId, monto, tipo) {
    try {
      const propina = {
        id: `PROP-${Date.now()}`,
        pedidoId,
        repartidorId,
        monto,
        tipo,
        fecha: new Date().toISOString(),
        estado: 'pendiente'
      };

      // Si tiene MercadoPago, procesar pago
      if (window.mercadoPagoSecure) {
        const resultado = await this.procesarPagoPropina(propina);
        if (!resultado.success) {
          throw new Error('Error procesando pago de propina');
        }
        propina.estado = 'pagada';
        propina.pagoId = resultado.paymentId;
      }

      // Guardar en servidor
      const response = await fetch('/api/propinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propina)
      });

      if (!response.ok) throw new Error('Error guardando propina');

      this.propinas.set(propina.id, propina);

      // Notificar al repartidor
      await this.notificarRepartidor(repartidorId, monto);

      // Mostrar confirmación
      this.mostrarConfirmacion(monto);

      // Cerrar modal
      this.cerrarModalPropina();

      return { success: true, propina };

    } catch (error) {
      console.error('Error procesando propina:', error);
      alert(`Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async procesarPagoPropina(propina) {
    // Crear preferencia en MercadoPago para la propina
    try {
      const response = await fetch('/api/mercadopago/crear-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId: `PROPINA-${propina.id}`,
          monto: propina.monto,
          descripcion: `Propina para repartidor`,
          comercio: 'YAvoy Propinas',
          cliente: 'Usuario',
          email: 'propinas@yavoy.com'
        })
      });

      const data = await response.json();
      return { success: true, paymentId: data.payment_id };
    } catch (error) {
      console.error('Error en pago de propina:', error);
      return { success: false, error: error.message };
    }
  }

  async notificarRepartidor(repartidorId, monto) {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: '💵 ¡Nueva Propina!',
        mensaje: `Recibiste una propina de $${monto}. ¡Excelente trabajo!`,
        icono: '/icons/icon-yavoy.png',
        urlAccion: `/repartidor/propinas`
      })
    });
  }

  mostrarConfirmacion(monto) {
    if (window.mostrarNotificacion) {
      window.mostrarNotificacion(
        `✅ Propina de $${monto} enviada\n¡Gracias por tu generosidad!`,
        'success'
      );
    }
  }

  async obtenerEstadisticas(repartidorId) {
    const propinasRepartidor = Array.from(this.propinas.values())
      .filter(p => p.repartidorId === repartidorId && p.estado === 'pagada');

    const total = propinasRepartidor.reduce((sum, p) => sum + p.monto, 0);
    const promedio = propinasRepartidor.length > 0 ? total / propinasRepartidor.length : 0;

    return {
      total,
      cantidad: propinasRepartidor.length,
      promedio: Math.round(promedio * 100) / 100
    };
  }

  async obtenerRepartidoresTop(limite = 10) {
    const response = await fetch(`/api/propinas/top-repartidores?limite=${limite}`);
    return await response.json();
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-propina-porcentaje')) {
        const porcentaje = parseInt(e.target.dataset.porcentaje);
        const montoPedido = parseFloat(document.getElementById('montoPedido')?.value || 0);
        const monto = Math.round((montoPedido * porcentaje) / 100);
        document.getElementById('montoPropina').value = monto;
      }

      if (e.target.classList.contains('btn-enviar-propina')) {
        const modal = document.getElementById('modalPropina');
        const pedidoId = modal.dataset.pedidoId;
        const repartidorId = modal.dataset.repartidorId;
        const monto = parseFloat(document.getElementById('montoPropina').value);
        
        if (monto > 0) {
          this.procesarPropina(pedidoId, repartidorId, monto, 'personalizada');
        }
      }
    });
  }
}

window.sistemaPropinas = new SistemaPropinas();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.sistemaPropinas.init());
} else {
  window.sistemaPropinas.init();
}
