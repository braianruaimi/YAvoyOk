/**
 * 🎁 SISTEMA DE REFERIDOS - YAvoy 2026
 * 
 * Programa de referidos con recompensas
 * - Código único por usuario
 * - Crédito de $100 para ambos (referidor y referido)
 * - Dashboard de estadísticas
 * - Links compartibles
 * - Tracking de conversiones
 * 
 * @version 2.0.0
 * @author YAvoy Team
 * @date 2025-12-11
 */

class SistemaReferidos {
  constructor() {
    this.referidos = new Map();
    this.creditoPorReferido = 100;
    this.initialized = false;
  }

  async init() {
    console.log('🎁 Inicializando Sistema de Referidos...');
    await this.cargarReferidos();
    this.setupEventListeners();
    this.initialized = true;
    console.log('✅ Sistema de Referidos inicializado');
    return true;
  }

  async cargarReferidos() {
    try {
      const response = await fetch('/api/referidos');
      const data = await response.json();
      data.forEach(r => this.referidos.set(r.id, r));
    } catch (error) {
      console.error('Error cargando referidos:', error);
    }
  }

  generarCodigoReferido(usuarioId) {
    const prefijo = usuarioId.substring(0, 3).toUpperCase();
    const sufijo = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${prefijo}${sufijo}`;
  }

  async obtenerCodigoUsuario(usuarioId) {
    try {
      const response = await fetch(`/api/referidos/codigo/${usuarioId}`);
      const data = await response.json();
      
      if (!data.codigo) {
        // Generar nuevo código
        const codigo = this.generarCodigoReferido(usuarioId);
        await this.guardarCodigo(usuarioId, codigo);
        return codigo;
      }
      
      return data.codigo;
    } catch (error) {
      console.error('Error obteniendo código:', error);
      return null;
    }
  }

  async guardarCodigo(usuarioId, codigo) {
    await fetch('/api/referidos/codigo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, codigo })
    });
  }

  async registrarReferido(codigoReferidor, nuevoUsuarioId, nuevoUsuarioNombre) {
    try {
      // Verificar que el código existe
      const response = await fetch(`/api/referidos/validar-codigo/${codigoReferidor}`);
      const data = await response.json();
      
      if (!data.valido) {
        throw new Error('Código de referido inválido');
      }

      const referidorId = data.usuarioId;

      // Crear registro de referido
      const referido = {
        id: `REF-${Date.now()}`,
        referidorId,
        referidoId: nuevoUsuarioId,
        referidoNombre: nuevoUsuarioNombre,
        codigo: codigoReferidor,
        fecha: new Date().toISOString(),
        creditoOtorgado: false,
        estado: 'pendiente' // pendiente, completado
      };

      const saveResponse = await fetch('/api/referidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referido)
      });

      if (!saveResponse.ok) throw new Error('Error guardando referido');

      this.referidos.set(referido.id, referido);

      console.log(`✅ Referido registrado: ${nuevoUsuarioNombre} por código ${codigoReferidor}`);
      return { success: true, referido };

    } catch (error) {
      console.error('Error registrando referido:', error);
      return { success: false, error: error.message };
    }
  }

  async otorgarCredito(referidoId) {
    try {
      const referido = this.referidos.get(referidoId);
      if (!referido) throw new Error('Referido no encontrado');
      if (referido.creditoOtorgado) throw new Error('Crédito ya otorgado');

      // Otorgar crédito al referidor
      await this.agregarCredito(referido.referidorId, this.creditoPorReferido, 'referido');
      
      // Otorgar crédito al referido
      await this.agregarCredito(referido.referidoId, this.creditoPorReferido, 'bienvenida');

      // Actualizar estado
      referido.creditoOtorgado = true;
      referido.estado = 'completado';
      referido.fechaCredito = new Date().toISOString();

      await this.actualizarReferido(referido);

      // Notificar a ambos
      await this.notificarCredito(referido);

      console.log(`💰 Crédito otorgado: $${this.creditoPorReferido} a referidor y referido`);
      return { success: true };

    } catch (error) {
      console.error('Error otorgando crédito:', error);
      return { success: false, error: error.message };
    }
  }

  async agregarCredito(usuarioId, monto, motivo) {
    await fetch(`/api/usuarios/${usuarioId}/credito`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto, motivo })
    });
  }

  async notificarCredito(referido) {
    // Notificar al referidor
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: '🎉 ¡Nuevo Referido!',
        mensaje: `${referido.referidoNombre} se registró con tu código. ¡Ganaste $${this.creditoPorReferido}!`,
        icono: '/icons/icon-yavoy.png',
        urlAccion: '/referidos'
      })
    });

    // Notificar al referido
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: '🎁 ¡Bienvenido a YAvoy!',
        mensaje: `Recibiste $${this.creditoPorReferido} de crédito por unirte. ¡Disfruta tu primer pedido!`,
        icono: '/icons/icon-yavoy.png',
        urlAccion: '/pedidos'
      })
    });
  }

  async obtenerEstadisticas(usuarioId) {
    const referidosUsuario = Array.from(this.referidos.values())
      .filter(r => r.referidorId === usuarioId);

    const completados = referidosUsuario.filter(r => r.estado === 'completado').length;
    const pendientes = referidosUsuario.filter(r => r.estado === 'pendiente').length;
    const creditoTotal = completados * this.creditoPorReferido;

    return {
      totalReferidos: referidosUsuario.length,
      completados,
      pendientes,
      creditoTotal,
      referidos: referidosUsuario
    };
  }

  generarLinkCompartir(codigo) {
    return `${window.location.origin}/registro?ref=${codigo}`;
  }

  async compartirEnRedes(codigo, red) {
    const link = this.generarLinkCompartir(codigo);
    const texto = `¡Únete a YAvoy y recibe $${this.creditoPorReferido} de crédito! Usa mi código: ${codigo}`;

    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(texto + ' ' + link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(link)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(texto)}`
    };

    if (urls[red]) {
      window.open(urls[red], '_blank', 'width=600,height=400');
    }
  }

  copiarLinkAlPortapapeles(codigo) {
    const link = this.generarLinkCompartir(codigo);
    navigator.clipboard.writeText(link).then(() => {
      alert('¡Link copiado al portapapeles!');
    });
  }

  async actualizarReferido(referido) {
    await fetch(`/api/referidos/${referido.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(referido)
    });
  }

  renderizarDashboard(usuarioId, container) {
    if (!container) return;

    this.obtenerEstadisticas(usuarioId).then(stats => {
      const codigo = this.obtenerCodigoUsuario(usuarioId);

      let html = `
        <div class="referidos-dashboard">
          <div class="hero-referidos">
            <h2>🎁 Invita amigos y gana</h2>
            <p>Por cada amigo que se registre con tu código, ambos reciben $${this.creditoPorReferido}</p>
          </div>

          <div class="codigo-referido-card">
            <h3>Tu Código de Referido</h3>
            <div class="codigo-display">${codigo}</div>
            <button class="btn-copiar-codigo" data-codigo="${codigo}">
              📋 Copiar Código
            </button>
          </div>

          <div class="compartir-redes">
            <h4>Compartir en:</h4>
            <div class="botones-redes">
              <button class="btn-red whatsapp" data-red="whatsapp" data-codigo="${codigo}">
                💬 WhatsApp
              </button>
              <button class="btn-red facebook" data-red="facebook" data-codigo="${codigo}">
                📘 Facebook
              </button>
              <button class="btn-red twitter" data-red="twitter" data-codigo="${codigo}">
                🐦 Twitter
              </button>
              <button class="btn-red telegram" data-red="telegram" data-codigo="${codigo}">
                ✈️ Telegram
              </button>
            </div>
          </div>

          <div class="estadisticas-referidos">
            <div class="stat-card">
              <span class="stat-numero">${stats.totalReferidos}</span>
              <span class="stat-label">Referidos Totales</span>
            </div>
            <div class="stat-card">
              <span class="stat-numero">${stats.completados}</span>
              <span class="stat-label">Completados</span>
            </div>
            <div class="stat-card">
              <span class="stat-numero">$${stats.creditoTotal}</span>
              <span class="stat-label">Crédito Ganado</span>
            </div>
          </div>

          <div class="lista-referidos">
            <h4>Tus Referidos</h4>
            ${stats.referidos.length === 0 ? '<p class="sin-referidos">Aún no has referido a nadie</p>' : ''}
            ${stats.referidos.map(r => `
              <div class="referido-item">
                <span class="nombre">${r.referidoNombre}</span>
                <span class="fecha">${new Date(r.fecha).toLocaleDateString()}</span>
                <span class="estado estado-${r.estado}">${r.estado === 'completado' ? '✅ Completado' : '⏳ Pendiente'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      container.innerHTML = html;
    });
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-copiar-codigo')) {
        const codigo = e.target.dataset.codigo;
        this.copiarLinkAlPortapapeles(codigo);
      }

      if (e.target.classList.contains('btn-red')) {
        const red = e.target.dataset.red;
        const codigo = e.target.dataset.codigo;
        this.compartirEnRedes(codigo, red);
      }
    });

    // Verificar código de referido en URL
    const urlParams = new URLSearchParams(window.location.search);
    const codigoRef = urlParams.get('ref');
    if (codigoRef) {
      localStorage.setItem('codigoReferido', codigoRef);
      console.log(`🎁 Código de referido detectado: ${codigoRef}`);
    }
  }
}

window.sistemaReferidos = new SistemaReferidos();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.sistemaReferidos.init());
} else {
  window.sistemaReferidos.init();
}
