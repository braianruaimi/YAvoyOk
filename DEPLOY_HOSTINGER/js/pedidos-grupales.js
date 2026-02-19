/**
 * 👥 SISTEMA DE PEDIDOS GRUPALES - YAvoy 2026
 * 
 * Pedidos compartidos entre múltiples usuarios
 * - Creación de pedidos grupales
 * - División automática de costos
 * - Invitaciones por link
 * - Chat grupal del pedido
 * - Confirmación de pago individual
 * 
 * @version 2.0.0
 * @author YAvoy Team
 * @date 2025-12-11
 */

class PedidosGrupales {
  constructor() {
    this.pedidosGrupales = new Map();
    this.initialized = false;
  }

  async init() {
    console.log('👥 Inicializando Sistema de Pedidos Grupales...');
    await this.cargarPedidosGrupales();
    this.setupEventListeners();
    this.initialized = true;
    console.log('✅ Sistema de Pedidos Grupales inicializado');
    return true;
  }

  async cargarPedidosGrupales() {
    try {
      const response = await fetch('/api/pedidos-grupales');
      const data = await response.json();
      data.forEach(p => this.pedidosGrupales.set(p.id, p));
    } catch (error) {
      console.error('Error cargando pedidos grupales:', error);
    }
  }

  async crearPedidoGrupal(datosInicio) {
    try {
      const pedidoGrupal = {
        id: `PG-${Date.now()}`,
        creadorId: datosInicio.usuarioId,
        creadorNombre: datosInicio.usuarioNombre,
        titulo: datosInicio.titulo || 'Pedido Grupal',
        comercioId: datosInicio.comercioId,
        comercioNombre: datosInicio.comercioNombre,
        participantes: [{
          id: datosInicio.usuarioId,
          nombre: datosInicio.usuarioNombre,
          items: [],
          monto: 0,
          pagado: false
        }],
        items: [],
        montoTotal: 0,
        estado: 'abierto', // abierto, cerrado, confirmado, entregado
        fechaCreacion: new Date().toISOString(),
        linkInvitacion: this.generarLinkInvitacion(),
        chat: [],
        direccionEntrega: datosInicio.direccion || '',
        horaLimite: datosInicio.horaLimite || null
      };

      const response = await fetch('/api/pedidos-grupales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoGrupal)
      });

      if (!response.ok) throw new Error('Error creando pedido grupal');

      this.pedidosGrupales.set(pedidoGrupal.id, pedidoGrupal);

      console.log(`✅ Pedido grupal creado: ${pedidoGrupal.id}`);
      return { success: true, pedidoGrupal };

    } catch (error) {
      console.error('Error:', error);
      return { success: false, error: error.message };
    }
  }

  async unirseAPedido(pedidoGrupalId, usuarioId, usuarioNombre) {
    try {
      const pedido = this.pedidosGrupales.get(pedidoGrupalId);
      if (!pedido) throw new Error('Pedido no encontrado');
      if (pedido.estado !== 'abierto') throw new Error('Pedido cerrado');

      // Verificar si ya está en el pedido
      if (pedido.participantes.some(p => p.id === usuarioId)) {
        return { success: false, error: 'Ya estás en este pedido' };
      }

      // Agregar participante
      pedido.participantes.push({
        id: usuarioId,
        nombre: usuarioNombre,
        items: [],
        monto: 0,
        pagado: false
      });

      // Actualizar en servidor
      await this.actualizarPedido(pedido);

      // Notificar al grupo
      await this.enviarMensajeChat(pedidoGrupalId, {
        tipo: 'sistema',
        mensaje: `${usuarioNombre} se unió al pedido`
      });

      return { success: true };

    } catch (error) {
      console.error('Error uniéndose:', error);
      return { success: false, error: error.message };
    }
  }

  async agregarItem(pedidoGrupalId, usuarioId, item) {
    try {
      const pedido = this.pedidosGrupales.get(pedidoGrupalId);
      if (!pedido) throw new Error('Pedido no encontrado');

      const participante = pedido.participantes.find(p => p.id === usuarioId);
      if (!participante) throw new Error('No eres participante de este pedido');

      // Agregar item al participante
      participante.items.push({
        ...item,
        id: `ITEM-${Date.now()}`,
        agregadoEn: new Date().toISOString()
      });

      // Recalcular montos
      this.recalcularMontos(pedido);

      // Actualizar en servidor
      await this.actualizarPedido(pedido);

      return { success: true };

    } catch (error) {
      console.error('Error agregando item:', error);
      return { success: false, error: error.message };
    }
  }

  recalcularMontos(pedido) {
    pedido.participantes.forEach(p => {
      p.monto = p.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    });

    pedido.montoTotal = pedido.participantes.reduce((sum, p) => sum + p.monto, 0);
  }

  async cerrarPedido(pedidoGrupalId) {
    const pedido = this.pedidosGrupales.get(pedidoGrupalId);
    if (!pedido) return { success: false, error: 'Pedido no encontrado' };

    pedido.estado = 'cerrado';
    pedido.fechaCierre = new Date().toISOString();

    await this.actualizarPedido(pedido);

    // Notificar a todos
    pedido.participantes.forEach(p => {
      this.notificarParticipante(p.id, {
        titulo: '🍕 Pedido Cerrado',
        mensaje: `El pedido grupal ha sido cerrado. Tu parte: $${p.monto}`,
        urlAccion: `/pedido-grupal/${pedidoGrupalId}`
      });
    });

    return { success: true };
  }

  async confirmarPago(pedidoGrupalId, usuarioId) {
    const pedido = this.pedidosGrupales.get(pedidoGrupalId);
    if (!pedido) return { success: false };

    const participante = pedido.participantes.find(p => p.id === usuarioId);
    if (!participante) return { success: false };

    participante.pagado = true;
    participante.fechaPago = new Date().toISOString();

    await this.actualizarPedido(pedido);

    // Verificar si todos pagaron
    if (pedido.participantes.every(p => p.pagado)) {
      await this.confirmarPedidoCompleto(pedidoGrupalId);
    }

    return { success: true };
  }

  async confirmarPedidoCompleto(pedidoGrupalId) {
    const pedido = this.pedidosGrupales.get(pedidoGrupalId);
    pedido.estado = 'confirmado';

    await this.actualizarPedido(pedido);

    // Notificar a todos
    await this.enviarMensajeChat(pedidoGrupalId, {
      tipo: 'sistema',
      mensaje: '✅ ¡Todos pagaron! Pedido confirmado y enviado al comercio.'
    });
  }

  async enviarMensajeChat(pedidoGrupalId, mensaje) {
    const pedido = this.pedidosGrupales.get(pedidoGrupalId);
    if (!pedido) return;

    const mensajeCompleto = {
      ...mensaje,
      id: `MSG-${Date.now()}`,
      fecha: new Date().toISOString()
    };

    pedido.chat.push(mensajeCompleto);
    await this.actualizarPedido(pedido);

    // Emitir evento
    window.dispatchEvent(new CustomEvent('mensajeChatGrupal', {
      detail: { pedidoGrupalId, mensaje: mensajeCompleto }
    }));
  }

  generarLinkInvitacion() {
    const codigo = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `${window.location.origin}/unirse-pedido?codigo=${codigo}`;
  }

  async actualizarPedido(pedido) {
    await fetch(`/api/pedidos-grupales/${pedido.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido)
    });
  }

  async notificarParticipante(usuarioId, notificacion) {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificacion)
    });
  }

  renderizarPedidoGrupal(pedidoGrupalId, container) {
    const pedido = this.pedidosGrupales.get(pedidoGrupalId);
    if (!pedido || !container) return;

    let html = `
      <div class="pedido-grupal-card">
        <div class="header">
          <h2>👥 ${pedido.titulo}</h2>
          <span class="estado estado-${pedido.estado}">${pedido.estado}</span>
        </div>
        
        <div class="comercio-info">
          <h3>🏪 ${pedido.comercioNombre}</h3>
          <p>📍 ${pedido.direccionEntrega}</p>
        </div>

        <div class="participantes-lista">
          <h4>Participantes (${pedido.participantes.length})</h4>
          ${pedido.participantes.map(p => `
            <div class="participante-item">
              <span class="nombre">${p.nombre}</span>
              <span class="monto">$${p.monto}</span>
              <span class="estado-pago">${p.pagado ? '✅' : '⏳'}</span>
            </div>
          `).join('')}
        </div>

        <div class="total-pedido">
          <strong>Total:</strong> <span>$${pedido.montoTotal}</span>
        </div>

        ${pedido.estado === 'abierto' ? `
          <div class="acciones">
            <button class="btn-compartir" data-link="${pedido.linkInvitacion}">
              🔗 Compartir Link
            </button>
            <button class="btn-cerrar-pedido" data-id="${pedido.id}">
              🔒 Cerrar Pedido
            </button>
          </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-compartir')) {
        const link = e.target.dataset.link;
        navigator.clipboard.writeText(link);
        alert('¡Link copiado al portapapeles!');
      }

      if (e.target.classList.contains('btn-cerrar-pedido')) {
        const id = e.target.dataset.id;
        if (confirm('¿Cerrar pedido para nuevos participantes?')) {
          this.cerrarPedido(id);
        }
      }
    });
  }
}

window.pedidosGrupales = new PedidosGrupales();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.pedidosGrupales.init());
} else {
  window.pedidosGrupales.init();
}
