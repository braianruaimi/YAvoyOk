/**
 * 🎯 SISTEMA DE RECOMPENSAS Y PUNTOS - YAvoy 2026
 * 
 * Sistema de gamificación completo:
 * - Puntos por pedidos completados
 * - Niveles: Bronce, Plata, Oro, Platino, Diamante
 * - Insignias por logros
 * - Descuentos exclusivos por nivel
 * - Dashboard de progreso
 * - Recompensas especiales
 * 
 * @version 2.0.0
 * @author YAvoy Team
 * @date 2025-12-11
 */

class SistemaRecompensas {
  constructor() {
    this.usuarios = new Map(); // Map<userId, userData>
    this.niveles = this.configurarNiveles();
    this.insignias = this.configurarInsignias();
    this.initialized = false;
  }

  /**
   * Configurar niveles del sistema
   */
  configurarNiveles() {
    return {
      bronce: {
        nombre: '🥉 Bronce',
        puntosMin: 0,
        puntosMax: 999,
        descuento: 0,
        beneficios: ['Acceso a la plataforma', 'Soporte básico'],
        color: '#CD7F32',
        icono: '🥉'
      },
      plata: {
        nombre: '🥈 Plata',
        puntosMin: 1000,
        puntosMax: 2999,
        descuento: 5,
        beneficios: ['5% de descuento', 'Prioridad en pedidos', 'Soporte prioritario'],
        color: '#C0C0C0',
        icono: '🥈'
      },
      oro: {
        nombre: '🥇 Oro',
        puntosMin: 3000,
        puntosMax: 5999,
        descuento: 10,
        beneficios: ['10% de descuento', 'Envío gratis 1 vez/semana', 'Soporte VIP', 'Acceso a ofertas exclusivas'],
        color: '#FFD700',
        icono: '🥇'
      },
      platino: {
        nombre: '💎 Platino',
        puntosMin: 6000,
        puntosMax: 9999,
        descuento: 15,
        beneficios: ['15% de descuento', 'Envío gratis ilimitado', 'Soporte 24/7', 'Acceso anticipado a nuevos comercios', 'Regalos mensuales'],
        color: '#E5E4E2',
        icono: '💎'
      },
      diamante: {
        nombre: '💠 Diamante',
        puntosMin: 10000,
        puntosMax: Infinity,
        descuento: 20,
        beneficios: ['20% de descuento', 'Envío gratis premium', 'Asistente personal', 'Eventos exclusivos', 'Menú secreto', 'Cashback 5%'],
        color: '#B9F2FF',
        icono: '💠'
      }
    };
  }

  /**
   * Configurar insignias disponibles
   */
  configurarInsignias() {
    return {
      primerPedido: {
        id: 'primer-pedido',
        nombre: '🎉 Primer Pedido',
        descripcion: 'Completaste tu primer pedido',
        puntos: 50,
        icono: '🎉',
        condicion: (user) => user.pedidosCompletados >= 1
      },
      cincoPedidos: {
        id: 'cinco-pedidos',
        nombre: '🔥 5 Pedidos',
        descripcion: 'Completaste 5 pedidos',
        puntos: 100,
        icono: '🔥',
        condicion: (user) => user.pedidosCompletados >= 5
      },
      diezPedidos: {
        id: 'diez-pedidos',
        nombre: '⭐ 10 Pedidos',
        descripcion: 'Completaste 10 pedidos',
        puntos: 200,
        icono: '⭐',
        condicion: (user) => user.pedidosCompletados >= 10
      },
      cincuentaPedidos: {
        id: 'cincuenta-pedidos',
        nombre: '🏆 50 Pedidos',
        descripcion: 'Completaste 50 pedidos',
        puntos: 500,
        icono: '🏆',
        condicion: (user) => user.pedidosCompletados >= 50
      },
      cienPedidos: {
        id: 'cien-pedidos',
        nombre: '👑 100 Pedidos',
        descripcion: 'Completaste 100 pedidos',
        puntos: 1000,
        icono: '👑',
        condicion: (user) => user.pedidosCompletados >= 100
      },
      madrugador: {
        id: 'madrugador',
        nombre: '🌅 Madrugador',
        descripcion: 'Pediste antes de las 8 AM',
        puntos: 25,
        icono: '🌅',
        condicion: (user) => user.pedidosMadrugada > 0
      },
      nocturno: {
        id: 'nocturno',
        nombre: '🌙 Nocturno',
        descripcion: 'Pediste después de las 11 PM',
        puntos: 25,
        icono: '🌙',
        condicion: (user) => user.pedidosNoche > 0
      },
      finDeSemana: {
        id: 'fin-de-semana',
        nombre: '🎊 Weekender',
        descripcion: 'Pediste 5 veces en fin de semana',
        puntos: 150,
        icono: '🎊',
        condicion: (user) => user.pedidosFinDeSemana >= 5
      },
      gastador: {
        id: 'gastador',
        nombre: '💰 Gran Gastador',
        descripcion: 'Gastaste más de $10,000',
        puntos: 300,
        icono: '💰',
        condicion: (user) => user.totalGastado >= 10000
      },
      referidor: {
        id: 'referidor',
        nombre: '🎁 Referidor Pro',
        descripcion: 'Invitaste 5 amigos',
        puntos: 250,
        icono: '🎁',
        condicion: (user) => user.referidosActivos >= 5
      },
      critico: {
        id: 'critico',
        nombre: '📝 Crítico',
        descripcion: 'Dejaste 10 reseñas',
        puntos: 100,
        icono: '📝',
        condicion: (user) => user.reseñasEscritas >= 10
      },
      fiel: {
        id: 'fiel',
        nombre: '❤️ Cliente Fiel',
        descripcion: 'Pediste 7 días consecutivos',
        puntos: 400,
        icono: '❤️',
        condicion: (user) => user.diasConsecutivos >= 7
      },
      explorador: {
        id: 'explorador',
        nombre: '🗺️ Explorador',
        descripcion: 'Probaste 10 comercios diferentes',
        puntos: 200,
        icono: '🗺️',
        condicion: (user) => user.comerciosUnicos >= 10
      },
      velocista: {
        id: 'velocista',
        nombre: '⚡ Velocista',
        descripcion: 'Recibiste 5 pedidos en menos de 15 min',
        puntos: 150,
        icono: '⚡',
        condicion: (user) => user.pedidosRapidos >= 5
      },
      propinero: {
        id: 'propinero',
        nombre: '💵 Generoso',
        descripcion: 'Dejaste propina 10 veces',
        puntos: 150,
        icono: '💵',
        condicion: (user) => user.propinasOtorgadas >= 10
      }
    };
  }

  /**
   * Inicializar sistema
   */
  async init() {
    try {
      console.log('🎯 Inicializando Sistema de Recompensas...');
      
      // Cargar datos de usuarios
      await this.cargarUsuarios();
      
      // Configurar event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('✅ Sistema de Recompensas inicializado');
      
      return true;
    } catch (error) {
      console.error('❌ Error inicializando recompensas:', error);
      return false;
    }
  }

  /**
   * Cargar datos de usuarios
   */
  async cargarUsuarios() {
    try {
      const response = await fetch('/api/recompensas/usuarios');
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      
      const data = await response.json();
      
      data.forEach(user => {
        this.usuarios.set(user.id, user);
      });
      
      console.log(`👥 ${data.length} usuarios cargados`);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      this.usuarios = new Map();
    }
  }

  /**
   * Obtener datos de un usuario
   */
  getUsuario(userId) {
    return this.usuarios.get(userId) || this.crearUsuarioNuevo(userId);
  }

  /**
   * Crear usuario nuevo
   */
  crearUsuarioNuevo(userId) {
    return {
      id: userId,
      puntos: 0,
      nivel: 'bronce',
      pedidosCompletados: 0,
      totalGastado: 0,
      insignias: [],
      historialPuntos: [],
      fechaRegistro: new Date().toISOString(),
      ultimaActividad: new Date().toISOString(),
      // Estadísticas adicionales
      pedidosMadrugada: 0,
      pedidosNoche: 0,
      pedidosFinDeSemana: 0,
      comerciosUnicos: 0,
      referidosActivos: 0,
      reseñasEscritas: 0,
      diasConsecutivos: 0,
      pedidosRapidos: 0,
      propinasOtorgadas: 0
    };
  }

  /**
   * Agregar puntos a un usuario
   */
  async agregarPuntos(userId, puntos, razon, metadata = {}) {
    try {
      const user = this.getUsuario(userId);
      
      // Agregar puntos
      user.puntos += puntos;
      user.ultimaActividad = new Date().toISOString();
      
      // Registrar en historial
      user.historialPuntos.push({
        puntos,
        razon,
        fecha: new Date().toISOString(),
        metadata
      });

      // Verificar cambio de nivel
      const nivelAnterior = user.nivel;
      const nivelNuevo = this.calcularNivel(user.puntos);
      
      if (nivelAnterior !== nivelNuevo) {
        user.nivel = nivelNuevo;
        await this.notificarCambioNivel(userId, nivelAnterior, nivelNuevo);
      }

      // Verificar insignias nuevas
      await this.verificarInsignias(userId);

      // Guardar cambios
      await this.guardarUsuario(user);

      // Emitir evento
      window.dispatchEvent(new CustomEvent('puntosAgregados', {
        detail: { userId, puntos, razon, puntosTotal: user.puntos, nivel: user.nivel }
      }));

      console.log(`✅ +${puntos} puntos para ${userId}: ${razon} (Total: ${user.puntos})`);

      return { success: true, puntos: user.puntos, nivel: user.nivel };

    } catch (error) {
      console.error('Error agregando puntos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calcular nivel según puntos
   */
  calcularNivel(puntos) {
    for (const [key, nivel] of Object.entries(this.niveles)) {
      if (puntos >= nivel.puntosMin && puntos <= nivel.puntosMax) {
        return key;
      }
    }
    return 'bronce';
  }

  /**
   * Obtener datos del nivel actual
   */
  getNivelActual(userId) {
    const user = this.getUsuario(userId);
    const nivelData = this.niveles[user.nivel];
    
    // Calcular progreso al siguiente nivel
    let progreso = 0;
    let puntosParaSiguiente = 0;
    
    const nivelesOrden = ['bronce', 'plata', 'oro', 'platino', 'diamante'];
    const indexActual = nivelesOrden.indexOf(user.nivel);
    
    if (indexActual < nivelesOrden.length - 1) {
      const siguienteNivel = this.niveles[nivelesOrden[indexActual + 1]];
      puntosParaSiguiente = siguienteNivel.puntosMin - user.puntos;
      const rangoPuntos = siguienteNivel.puntosMin - nivelData.puntosMin;
      const puntosEnRango = user.puntos - nivelData.puntosMin;
      progreso = (puntosEnRango / rangoPuntos) * 100;
    } else {
      progreso = 100; // Nivel máximo
    }
    
    return {
      ...nivelData,
      puntosActuales: user.puntos,
      progreso: Math.min(100, Math.max(0, progreso)),
      puntosParaSiguiente
    };
  }

  /**
   * Verificar y otorgar insignias
   */
  async verificarInsignias(userId) {
    const user = this.getUsuario(userId);
    const insigniasOtorgadas = [];

    for (const [key, insignia] of Object.entries(this.insignias)) {
      // Verificar si ya tiene la insignia
      if (user.insignias.includes(insignia.id)) {
        continue;
      }

      // Verificar condición
      if (insignia.condicion(user)) {
        user.insignias.push(insignia.id);
        insigniasOtorgadas.push(insignia);
        
        // Otorgar puntos de la insignia
        user.puntos += insignia.puntos;
        
        // Notificar
        await this.notificarInsignia(userId, insignia);
        
        console.log(`🏅 Insignia desbloqueada: ${insignia.nombre} (+${insignia.puntos} puntos)`);
      }
    }

    if (insigniasOtorgadas.length > 0) {
      await this.guardarUsuario(user);
    }

    return insigniasOtorgadas;
  }

  /**
   * Procesar pedido completado
   */
  async procesarPedidoCompletado(userId, pedidoData) {
    const user = this.getUsuario(userId);
    
    // Actualizar estadísticas
    user.pedidosCompletados++;
    user.totalGastado += pedidoData.monto || 0;
    
    // Detectar hora del pedido
    const hora = new Date(pedidoData.fecha).getHours();
    if (hora < 8) {
      user.pedidosMadrugada++;
    } else if (hora >= 23) {
      user.pedidosNoche++;
    }
    
    // Detectar fin de semana
    const dia = new Date(pedidoData.fecha).getDay();
    if (dia === 0 || dia === 6) {
      user.pedidosFinDeSemana++;
    }
    
    // Detectar pedido rápido (menos de 15 minutos)
    if (pedidoData.tiempoEntrega && pedidoData.tiempoEntrega < 15) {
      user.pedidosRapidos++;
    }
    
    // Actualizar comercios únicos
    if (!user.comerciosVisitados) {
      user.comerciosVisitados = [];
    }
    if (!user.comerciosVisitados.includes(pedidoData.comercioId)) {
      user.comerciosVisitados.push(pedidoData.comercioId);
      user.comerciosUnicos = user.comerciosVisitados.length;
    }
    
    // Calcular puntos por el pedido
    const puntosPorPedido = Math.floor((pedidoData.monto || 0) / 10); // 1 punto por cada $10
    const puntosBase = 10; // Puntos base por completar
    const puntosTotal = puntosBase + puntosPorPedido;
    
    // Otorgar puntos
    await this.agregarPuntos(userId, puntosTotal, 'Pedido completado', {
      pedidoId: pedidoData.id,
      monto: pedidoData.monto
    });
    
    return { success: true, puntos: puntosTotal };
  }

  /**
   * Canjear descuento de nivel
   */
  async canjearDescuento(userId, montoPedido) {
    const user = this.getUsuario(userId);
    const nivelData = this.niveles[user.nivel];
    
    if (nivelData.descuento === 0) {
      return { descuento: 0, montofinal: montoPedido };
    }
    
    const descuento = (montoPedido * nivelData.descuento) / 100;
    const montoFinal = montoPedido - descuento;
    
    console.log(`💰 Descuento ${nivelData.descuento}% aplicado: -$${descuento.toFixed(2)}`);
    
    return {
      descuento,
      montoFinal,
      porcentaje: nivelData.descuento
    };
  }

  /**
   * Guardar usuario
   */
  async guardarUsuario(user) {
    try {
      this.usuarios.set(user.id, user);
      
      const response = await fetch('/api/recompensas/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar usuario');
      }
      
      return true;
    } catch (error) {
      console.error('Error guardando usuario:', error);
      return false;
    }
  }

  /**
   * Notificar cambio de nivel
   */
  async notificarCambioNivel(userId, nivelAnterior, nivelNuevo) {
    const nivelData = this.niveles[nivelNuevo];
    
    this.mostrarNotificacion(
      `🎉 ¡Nivel Subido!`,
      `Alcanzaste el nivel ${nivelData.nombre}!\nDescuento: ${nivelData.descuento}%`,
      'success'
    );
    
    // Enviar notificación push
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: '🎉 ¡Nuevo Nivel Desbloqueado!',
        mensaje: `Felicitaciones! Alcanzaste el nivel ${nivelData.nombre}`,
        icono: '/icons/icon-yavoy.png',
        urlAccion: '/recompensas'
      })
    });
  }

  /**
   * Notificar insignia
   */
  async notificarInsignia(userId, insignia) {
    this.mostrarNotificacion(
      `🏅 ${insignia.nombre}`,
      `${insignia.descripcion}\n+${insignia.puntos} puntos`,
      'success'
    );
    
    // Enviar notificación push
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: '🏅 Nueva Insignia Desbloqueada!',
        mensaje: `${insignia.nombre}: ${insignia.descripcion}`,
        icono: '/icons/icon-yavoy.png',
        urlAccion: '/recompensas'
      })
    });
  }

  /**
   * Renderizar dashboard de recompensas
   */
  renderizarDashboard(userId, container) {
    if (!container) return;

    const user = this.getUsuario(userId);
    const nivelActual = this.getNivelActual(userId);
    
    let html = `
      <div class="recompensas-dashboard">
        <!-- Tarjeta de Nivel -->
        <div class="nivel-card" style="background: linear-gradient(135deg, ${nivelActual.color}33 0%, ${nivelActual.color}66 100%);">
          <div class="nivel-header">
            <span class="nivel-icono">${nivelActual.icono}</span>
            <div class="nivel-info">
              <h3 class="nivel-nombre">${nivelActual.nombre}</h3>
              <p class="nivel-puntos">${user.puntos} puntos</p>
            </div>
          </div>
          
          <div class="nivel-progreso">
            <div class="progreso-barra">
              <div class="progreso-fill" style="width: ${nivelActual.progreso}%; background: ${nivelActual.color};"></div>
            </div>
            <p class="progreso-texto">
              ${nivelActual.puntosParaSiguiente > 0 
                ? `${nivelActual.puntosParaSiguiente} puntos para el siguiente nivel`
                : '¡Nivel máximo alcanzado!'
              }
            </p>
          </div>
          
          <div class="nivel-beneficios">
            <h4>Tus Beneficios:</h4>
            <ul>
              ${nivelActual.beneficios.map(b => `<li>✓ ${b}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <!-- Estadísticas -->
        <div class="estadisticas-grid">
          <div class="stat-card">
            <span class="stat-icono">📦</span>
            <span class="stat-numero">${user.pedidosCompletados}</span>
            <span class="stat-label">Pedidos</span>
          </div>
          <div class="stat-card">
            <span class="stat-icono">💰</span>
            <span class="stat-numero">$${user.totalGastado.toFixed(0)}</span>
            <span class="stat-label">Gastado</span>
          </div>
          <div class="stat-card">
            <span class="stat-icono">🏅</span>
            <span class="stat-numero">${user.insignias.length}</span>
            <span class="stat-label">Insignias</span>
          </div>
          <div class="stat-card">
            <span class="stat-icono">💎</span>
            <span class="stat-numero">${nivelActual.descuento}%</span>
            <span class="stat-label">Descuento</span>
          </div>
        </div>
        
        <!-- Insignias -->
        <div class="insignias-seccion">
          <h3>🏅 Tus Insignias (${user.insignias.length}/${Object.keys(this.insignias).length})</h3>
          <div class="insignias-grid">
            ${this.renderizarInsignias(user)}
          </div>
        </div>
        
        <!-- Historial -->
        <div class="historial-seccion">
          <h3>📜 Historial de Puntos</h3>
          <div class="historial-lista">
            ${this.renderizarHistorial(user)}
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }

  /**
   * Renderizar insignias
   */
  renderizarInsignias(user) {
    let html = '';
    
    for (const [key, insignia] of Object.entries(this.insignias)) {
      const desbloqueada = user.insignias.includes(insignia.id);
      const clase = desbloqueada ? 'desbloqueada' : 'bloqueada';
      
      html += `
        <div class="insignia-item ${clase}" title="${insignia.descripcion}">
          <span class="insignia-icono">${insignia.icono}</span>
          <span class="insignia-nombre">${insignia.nombre}</span>
          ${desbloqueada ? '' : '<span class="insignia-lock">🔒</span>'}
        </div>
      `;
    }
    
    return html;
  }

  /**
   * Renderizar historial
   */
  renderizarHistorial(user) {
    if (!user.historialPuntos || user.historialPuntos.length === 0) {
      return '<p class="historial-vacio">Aún no tienes actividad</p>';
    }
    
    const historial = [...user.historialPuntos].reverse().slice(0, 10);
    
    return historial.map(item => `
      <div class="historial-item">
        <div class="historial-info">
          <span class="historial-razon">${item.razon}</span>
          <span class="historial-fecha">${new Date(item.fecha).toLocaleDateString('es-AR')}</span>
        </div>
        <span class="historial-puntos">+${item.puntos} pts</span>
      </div>
    `).join('');
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    // Escuchar eventos de pedidos completados
    window.addEventListener('pedidoCompletado', (e) => {
      const { userId, pedidoData } = e.detail;
      this.procesarPedidoCompletado(userId, pedidoData);
    });
  }

  /**
   * Mostrar notificación
   */
  mostrarNotificacion(titulo, mensaje, tipo = 'info') {
    if (window.mostrarNotificacion) {
      window.mostrarNotificacion(`${titulo}\n${mensaje}`, tipo);
    } else {
      alert(`${titulo}\n${mensaje}`);
    }
  }
}

// Crear instancia global
window.sistemaRecompensas = new SistemaRecompensas();

// Auto-inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.sistemaRecompensas.init();
  });
} else {
  window.sistemaRecompensas.init();
}
