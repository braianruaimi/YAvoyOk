/**
 * ⭐ SISTEMA DE CALIFICACIONES Y REVIEWS - YAvoy 2026
 * 
 * Sistema completo de valoración para comercios y repartidores
 * - Calificación 1-5 estrellas
 * - Reviews con comentarios
 * - Respuestas de comercios
 * - Promedio y estadísticas
 * - Filtrado por tipo y calificación
 * 
 * @version 2.0.0
 * @author YAvoy Team
 * @date 2025-12-11
 */

class SistemaCalificaciones {
  constructor() {
    this.calificaciones = new Map(); // Map<entityId, Array<calificacion>>
    this.promedios = new Map(); // Map<entityId, promedio>
    this.initialized = false;
  }

  /**
   * Inicializar el sistema de calificaciones
   */
  async init() {
    try {
      console.log('🌟 Inicializando Sistema de Calificaciones...');
      
      // Cargar calificaciones desde el servidor
      await this.cargarCalificaciones();
      
      // Configurar event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('✅ Sistema de Calificaciones inicializado');
      
      return true;
    } catch (error) {
      console.error('❌ Error inicializando calificaciones:', error);
      return false;
    }
  }

  /**
   * Cargar todas las calificaciones del servidor
   */
  async cargarCalificaciones() {
    try {
      const response = await fetch('/api/calificaciones');
      if (!response.ok) {
        throw new Error('Error al cargar calificaciones');
      }
      
      const data = await response.json();
      
      // Organizar calificaciones por entidad
      data.forEach(cal => {
        const entityId = cal.entityId;
        if (!this.calificaciones.has(entityId)) {
          this.calificaciones.set(entityId, []);
        }
        this.calificaciones.get(entityId).push(cal);
      });
      
      // Calcular promedios
      this.calcularTodosLosPromedios();
      
      console.log(`📊 Cargadas ${data.length} calificaciones`);
    } catch (error) {
      console.error('Error cargando calificaciones:', error);
      // Si no existen, empezar con array vacío
      this.calificaciones = new Map();
    }
  }

  /**
   * Calcular promedio de calificaciones para una entidad
   */
  calcularPromedio(entityId) {
    const cals = this.calificaciones.get(entityId) || [];
    
    if (cals.length === 0) {
      return {
        promedio: 0,
        total: 0,
        distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
    
    const suma = cals.reduce((acc, cal) => acc + cal.estrellas, 0);
    const promedio = suma / cals.length;
    
    // Calcular distribución de estrellas
    const distribucion = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    cals.forEach(cal => {
      distribucion[cal.estrellas]++;
    });
    
    return {
      promedio: Math.round(promedio * 10) / 10,
      total: cals.length,
      distribucion
    };
  }

  /**
   * Calcular todos los promedios
   */
  calcularTodosLosPromedios() {
    this.calificaciones.forEach((cals, entityId) => {
      this.promedios.set(entityId, this.calcularPromedio(entityId));
    });
  }

  /**
   * Obtener promedio de una entidad
   */
  getPromedio(entityId) {
    return this.promedios.get(entityId) || {
      promedio: 0,
      total: 0,
      distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  /**
   * Obtener calificaciones de una entidad
   */
  getCalificaciones(entityId, filtros = {}) {
    let cals = this.calificaciones.get(entityId) || [];
    
    // Filtrar por estrellas
    if (filtros.estrellas) {
      cals = cals.filter(cal => cal.estrellas === filtros.estrellas);
    }
    
    // Filtrar por fecha
    if (filtros.desde) {
      cals = cals.filter(cal => new Date(cal.fecha) >= new Date(filtros.desde));
    }
    
    // Ordenar
    const orden = filtros.orden || 'reciente';
    cals.sort((a, b) => {
      switch (orden) {
        case 'reciente':
          return new Date(b.fecha) - new Date(a.fecha);
        case 'antigua':
          return new Date(a.fecha) - new Date(b.fecha);
        case 'mejor':
          return b.estrellas - a.estrellas;
        case 'peor':
          return a.estrellas - b.estrellas;
        default:
          return 0;
      }
    });
    
    return cals;
  }

  /**
   * Crear nueva calificación
   */
  async crearCalificacion(data) {
    try {
      // Validar datos
      const validacion = this.validarCalificacion(data);
      if (!validacion.valido) {
        throw new Error(validacion.error);
      }

      const calificacion = {
        id: this.generarId(),
        entityId: data.entityId,
        entityType: data.entityType, // 'comercio' o 'repartidor'
        pedidoId: data.pedidoId,
        clienteId: data.clienteId,
        clienteNombre: data.clienteNombre,
        estrellas: data.estrellas,
        comentario: data.comentario || '',
        aspectos: data.aspectos || {}, // { calidad: 5, velocidad: 4, servicio: 5 }
        fecha: new Date().toISOString(),
        respuesta: null,
        likes: 0,
        reportes: 0,
        verificado: data.verificado || false
      };

      // Guardar en el servidor
      const response = await fetch('/api/calificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calificacion)
      });

      if (!response.ok) {
        throw new Error('Error al guardar calificación');
      }

      const resultado = await response.json();

      // Actualizar cache local
      if (!this.calificaciones.has(calificacion.entityId)) {
        this.calificaciones.set(calificacion.entityId, []);
      }
      this.calificaciones.get(calificacion.entityId).unshift(calificacion);

      // Recalcular promedio
      this.promedios.set(
        calificacion.entityId,
        this.calcularPromedio(calificacion.entityId)
      );

      // Emitir evento
      window.dispatchEvent(new CustomEvent('calificacionCreada', {
        detail: { calificacion }
      }));

      // Mostrar notificación
      this.mostrarNotificacion('✅ Calificación enviada exitosamente', 'success');

      // Enviar notificación push al comercio/repartidor
      await this.enviarNotificacionNuevaCalificacion(calificacion);

      console.log('✅ Calificación creada:', calificacion.id);
      return { success: true, calificacion };

    } catch (error) {
      console.error('❌ Error creando calificación:', error);
      this.mostrarNotificacion(`Error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Validar datos de calificación
   */
  validarCalificacion(data) {
    if (!data.entityId) {
      return { valido: false, error: 'ID de entidad requerido' };
    }

    if (!data.entityType || !['comercio', 'repartidor'].includes(data.entityType)) {
      return { valido: false, error: 'Tipo de entidad inválido' };
    }

    if (!data.estrellas || data.estrellas < 1 || data.estrellas > 5) {
      return { valido: false, error: 'Calificación debe ser entre 1 y 5 estrellas' };
    }

    if (!data.pedidoId) {
      return { valido: false, error: 'ID de pedido requerido' };
    }

    if (!data.clienteId) {
      return { valido: false, error: 'ID de cliente requerido' };
    }

    // Verificar que no haya calificado ya este pedido
    if (this.yaCalificoPedido(data.pedidoId, data.entityId, data.clienteId)) {
      return { valido: false, error: 'Ya calificaste este pedido' };
    }

    return { valido: true };
  }

  /**
   * Verificar si ya calificó un pedido
   */
  yaCalificoPedido(pedidoId, entityId, clienteId) {
    const cals = this.calificaciones.get(entityId) || [];
    return cals.some(cal => 
      cal.pedidoId === pedidoId && cal.clienteId === clienteId
    );
  }

  /**
   * Responder a una calificación (solo comercios/repartidores)
   */
  async responderCalificacion(calificacionId, respuesta, entityId) {
    try {
      if (!respuesta.trim()) {
        throw new Error('La respuesta no puede estar vacía');
      }

      const response = await fetch(`/api/calificaciones/${calificacionId}/respuesta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuesta, entityId })
      });

      if (!response.ok) {
        throw new Error('Error al guardar respuesta');
      }

      // Actualizar cache local
      this.calificaciones.forEach(cals => {
        const cal = cals.find(c => c.id === calificacionId);
        if (cal) {
          cal.respuesta = {
            texto: respuesta,
            fecha: new Date().toISOString()
          };
        }
      });

      // Emitir evento
      window.dispatchEvent(new CustomEvent('respuestaAgregada', {
        detail: { calificacionId, respuesta }
      }));

      this.mostrarNotificacion('✅ Respuesta publicada', 'success');
      console.log('✅ Respuesta agregada a calificación:', calificacionId);

      return { success: true };

    } catch (error) {
      console.error('❌ Error respondiendo calificación:', error);
      this.mostrarNotificacion(`Error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Dar like a una calificación
   */
  async darLike(calificacionId) {
    try {
      const response = await fetch(`/api/calificaciones/${calificacionId}/like`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Error al dar like');
      }

      // Actualizar cache local
      this.calificaciones.forEach(cals => {
        const cal = cals.find(c => c.id === calificacionId);
        if (cal) {
          cal.likes++;
        }
      });

      return { success: true };

    } catch (error) {
      console.error('Error dando like:', error);
      return { success: false };
    }
  }

  /**
   * Reportar una calificación
   */
  async reportarCalificacion(calificacionId, motivo) {
    try {
      const response = await fetch(`/api/calificaciones/${calificacionId}/reportar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo })
      });

      if (!response.ok) {
        throw new Error('Error al reportar');
      }

      this.mostrarNotificacion('✅ Reporte enviado', 'success');
      return { success: true };

    } catch (error) {
      console.error('Error reportando:', error);
      this.mostrarNotificacion('Error al enviar reporte', 'error');
      return { success: false };
    }
  }

  /**
   * Mostrar modal de calificación
   */
  mostrarModalCalificacion(entityId, entityType, entityNombre, pedidoId) {
    const modal = document.getElementById('modalCalificacion');
    if (!modal) {
      console.error('Modal de calificación no encontrado');
      return;
    }

    // Configurar datos del modal
    modal.dataset.entityId = entityId;
    modal.dataset.entityType = entityType;
    modal.dataset.pedidoId = pedidoId;

    // Actualizar título
    const titulo = modal.querySelector('.modal-title');
    if (titulo) {
      const icono = entityType === 'comercio' ? '🏪' : '🚴';
      titulo.textContent = `${icono} Calificar ${entityNombre}`;
    }

    // Resetear formulario
    this.resetearFormularioCalificacion();

    // Mostrar modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Cerrar modal de calificación
   */
  cerrarModalCalificacion() {
    const modal = document.getElementById('modalCalificacion');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      this.resetearFormularioCalificacion();
    }
  }

  /**
   * Resetear formulario de calificación
   */
  resetearFormularioCalificacion() {
    // Resetear estrellas
    const estrellas = document.querySelectorAll('.estrella-calificacion');
    estrellas.forEach(e => e.classList.remove('activa'));

    // Resetear aspectos
    const aspectos = document.querySelectorAll('.estrella-aspecto');
    aspectos.forEach(e => e.classList.remove('activa'));

    // Limpiar comentario
    const comentario = document.getElementById('comentarioCalificacion');
    if (comentario) comentario.value = '';
  }

  /**
   * Renderizar estrellas
   */
  renderizarEstrellas(promedio, container, size = 'medium') {
    if (!container) return;

    const fullStars = Math.floor(promedio);
    const hasHalfStar = promedio % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let html = '<div class="estrellas-container ' + size + '">';

    // Estrellas llenas
    for (let i = 0; i < fullStars; i++) {
      html += '<span class="estrella llena">★</span>';
    }

    // Media estrella
    if (hasHalfStar) {
      html += '<span class="estrella media">★</span>';
    }

    // Estrellas vacías
    for (let i = 0; i < emptyStars; i++) {
      html += '<span class="estrella vacia">☆</span>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Renderizar distribución de calificaciones
   */
  renderizarDistribucion(entityId, container) {
    if (!container) return;

    const data = this.getPromedio(entityId);
    const { distribucion, total } = data;

    let html = '<div class="distribucion-estrellas">';

    for (let i = 5; i >= 1; i--) {
      const cantidad = distribucion[i] || 0;
      const porcentaje = total > 0 ? (cantidad / total) * 100 : 0;

      html += `
        <div class="fila-distribucion">
          <span class="label-estrellas">${i} ★</span>
          <div class="barra-progreso">
            <div class="barra-fill" style="width: ${porcentaje}%"></div>
          </div>
          <span class="cantidad-reviews">${cantidad}</span>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Renderizar lista de calificaciones
   */
  renderizarListaCalificaciones(entityId, container, opciones = {}) {
    if (!container) return;

    const cals = this.getCalificaciones(entityId, opciones.filtros || {});
    const limite = opciones.limite || 10;
    const mostrarMas = cals.length > limite;

    let html = '<div class="lista-calificaciones">';

    if (cals.length === 0) {
      html += `
        <div class="no-calificaciones">
          <p>😊 Aún no hay calificaciones</p>
          <p>¡Sé el primero en dejar tu opinión!</p>
        </div>
      `;
    } else {
      const calsAMostrar = cals.slice(0, limite);

      calsAMostrar.forEach(cal => {
        html += this.renderizarCalificacionItem(cal);
      });

      if (mostrarMas) {
        html += `
          <button class="btn-ver-mas-calificaciones" data-entity="${entityId}">
            Ver las ${cals.length - limite} calificaciones restantes
          </button>
        `;
      }
    }

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Renderizar una calificación individual
   */
  renderizarCalificacionItem(cal) {
    const fecha = new Date(cal.fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const estrellas = '★'.repeat(cal.estrellas) + '☆'.repeat(5 - cal.estrellas);
    const verificado = cal.verificado ? '<span class="badge-verificado">✓ Verificado</span>' : '';

    let html = `
      <div class="calificacion-item" data-id="${cal.id}">
        <div class="calificacion-header">
          <div class="info-cliente">
            <span class="nombre-cliente">${cal.clienteNombre}</span>
            ${verificado}
          </div>
          <div class="info-fecha">${fecha}</div>
        </div>
        
        <div class="calificacion-estrellas">
          <span class="estrellas">${estrellas}</span>
          <span class="numero-estrellas">${cal.estrellas}.0</span>
        </div>
    `;

    if (cal.comentario) {
      html += `
        <div class="calificacion-comentario">
          ${this.escaparHTML(cal.comentario)}
        </div>
      `;
    }

    if (cal.aspectos && Object.keys(cal.aspectos).length > 0) {
      html += '<div class="calificacion-aspectos">';
      for (const [aspecto, valor] of Object.entries(cal.aspectos)) {
        const aspectoNombre = this.getAspectoNombre(aspecto);
        html += `
          <div class="aspecto-item">
            <span class="aspecto-label">${aspectoNombre}:</span>
            <span class="aspecto-valor">${'★'.repeat(valor)}${'☆'.repeat(5 - valor)}</span>
          </div>
        `;
      }
      html += '</div>';
    }

    if (cal.respuesta) {
      const fechaRespuesta = new Date(cal.respuesta.fecha).toLocaleDateString('es-AR');
      html += `
        <div class="calificacion-respuesta">
          <div class="respuesta-header">
            <span class="respuesta-label">💬 Respuesta del comercio</span>
            <span class="respuesta-fecha">${fechaRespuesta}</span>
          </div>
          <div class="respuesta-texto">
            ${this.escaparHTML(cal.respuesta.texto)}
          </div>
        </div>
      `;
    }

    html += `
        <div class="calificacion-acciones">
          <button class="btn-like ${cal.likes > 0 ? 'active' : ''}" data-id="${cal.id}">
            👍 Útil (${cal.likes})
          </button>
          <button class="btn-reportar" data-id="${cal.id}">
            🚩 Reportar
          </button>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Obtener nombre de aspecto
   */
  getAspectoNombre(aspecto) {
    const nombres = {
      calidad: '📦 Calidad',
      velocidad: '⚡ Velocidad',
      servicio: '💁 Servicio',
      presentacion: '🎨 Presentación',
      comunicacion: '💬 Comunicación',
      puntualidad: '⏰ Puntualidad'
    };
    return nombres[aspecto] || aspecto;
  }

  /**
   * Enviar notificación de nueva calificación
   */
  async enviarNotificacionNuevaCalificacion(calificacion) {
    try {
      const tipoEntidad = calificacion.entityType === 'comercio' ? '🏪' : '🚴';
      const mensaje = `${tipoEntidad} Nueva calificación: ${calificacion.estrellas} ★ - "${calificacion.comentario.substring(0, 50)}..."`;

      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: 'Nueva Calificación Recibida',
          mensaje: mensaje,
          icono: '/icons/icon-yavoy.png',
          urlAccion: `/perfil?id=${calificacion.entityId}&tab=calificaciones`
        })
      });

    } catch (error) {
      console.error('Error enviando notificación:', error);
    }
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    // Click en estrellas de calificación principal
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('estrella-calificacion')) {
        this.handleClickEstrella(e.target);
      }
    });

    // Click en estrellas de aspectos
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('estrella-aspecto')) {
        this.handleClickEstrellaAspecto(e.target);
      }
    });

    // Submit formulario de calificación
    const formCalificacion = document.getElementById('formCalificacion');
    if (formCalificacion) {
      formCalificacion.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmitCalificacion(e.target);
      });
    }

    // Botón cerrar modal
    const btnCerrar = document.querySelector('.btn-cerrar-modal-calificacion');
    if (btnCerrar) {
      btnCerrar.addEventListener('click', () => this.cerrarModalCalificacion());
    }

    // Click fuera del modal
    const modal = document.getElementById('modalCalificacion');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.cerrarModalCalificacion();
        }
      });
    }

    // Botones de like
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn-like')) {
        const btn = e.target.closest('.btn-like');
        const calId = btn.dataset.id;
        this.darLike(calId);
      }
    });

    // Botones de reportar
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn-reportar')) {
        const btn = e.target.closest('.btn-reportar');
        const calId = btn.dataset.id;
        this.mostrarDialogoReporte(calId);
      }
    });
  }

  /**
   * Handle click en estrella
   */
  handleClickEstrella(estrella) {
    const valor = parseInt(estrella.dataset.valor);
    const container = estrella.parentElement;
    const estrellas = container.querySelectorAll('.estrella-calificacion');

    estrellas.forEach((e, index) => {
      if (index < valor) {
        e.classList.add('activa');
      } else {
        e.classList.remove('activa');
      }
    });
  }

  /**
   * Handle click en estrella de aspecto
   */
  handleClickEstrellaAspecto(estrella) {
    const valor = parseInt(estrella.dataset.valor);
    const aspecto = estrella.dataset.aspecto;
    const container = estrella.closest('.aspecto-calificacion');
    const estrellas = container.querySelectorAll('.estrella-aspecto');

    estrellas.forEach((e, index) => {
      if (index < valor) {
        e.classList.add('activa');
      } else {
        e.classList.remove('activa');
      }
    });
  }

  /**
   * Handle submit formulario
   */
  async handleSubmitCalificacion(form) {
    const modal = document.getElementById('modalCalificacion');
    const entityId = modal.dataset.entityId;
    const entityType = modal.dataset.entityType;
    const pedidoId = modal.dataset.pedidoId;

    // Obtener estrellas seleccionadas
    const estrellasActivas = document.querySelectorAll('.estrella-calificacion.activa');
    const estrellas = estrellasActivas.length;

    if (estrellas === 0) {
      this.mostrarNotificacion('Por favor selecciona una calificación', 'warning');
      return;
    }

    // Obtener aspectos
    const aspectos = {};
    const aspectosContainers = document.querySelectorAll('.aspecto-calificacion');
    aspectosContainers.forEach(container => {
      const aspecto = container.dataset.aspecto;
      const activas = container.querySelectorAll('.estrella-aspecto.activa');
      if (activas.length > 0) {
        aspectos[aspecto] = activas.length;
      }
    });

    // Obtener comentario
    const comentario = document.getElementById('comentarioCalificacion').value.trim();

    // Crear calificación
    const resultado = await this.crearCalificacion({
      entityId,
      entityType,
      pedidoId,
      clienteId: 'CLIENTE-001', // TODO: Obtener del sistema de autenticación
      clienteNombre: 'Usuario', // TODO: Obtener del sistema de autenticación
      estrellas,
      comentario,
      aspectos,
      verificado: true
    });

    if (resultado.success) {
      this.cerrarModalCalificacion();
    }
  }

  /**
   * Mostrar diálogo de reporte
   */
  mostrarDialogoReporte(calificacionId) {
    const motivo = prompt('¿Por qué quieres reportar esta calificación?\n\n1. Contenido inapropiado\n2. Spam\n3. Información falsa\n4. Otro');
    
    if (motivo) {
      this.reportarCalificacion(calificacionId, motivo);
    }
  }

  /**
   * Generar ID único
   */
  generarId() {
    return 'CAL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Escapar HTML
   */
  escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  /**
   * Mostrar notificación
   */
  mostrarNotificacion(mensaje, tipo = 'info') {
    if (window.mostrarNotificacion) {
      window.mostrarNotificacion(mensaje, tipo);
    } else {
      alert(mensaje);
    }
  }
}

// Crear instancia global
window.sistemaCalificaciones = new SistemaCalificaciones();

// Auto-inicializar si el DOM está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.sistemaCalificaciones.init();
  });
} else {
  window.sistemaCalificaciones.init();
}
