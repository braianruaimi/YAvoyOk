/**
 * ⭐ Sistema Completo de Calificaciones y Reseñas - YaVoy
 * Incluye: Ratings 5 estrellas, comentarios, fotos, ranking
 */

class RatingSystem {
  constructor(socket = null) {
    this.socket = socket;
    this.ratings = new Map();
    this.reviews = new Map();
    this.userAverages = new Map();
  }

  /**
   * Crear calificación para una entrega
   */
  async crearCalificacion(pedidoId, data) {
    const {
      repartidorId,
      clienteId,
      estrellas,
      comentario,
      imagenes = [],
      aspecto = {
        puntualidad: 5,
        amabilidad: 5,
        limpieza: 5,
        exactitud: 5
      }
    } = data;

    if (estrellas < 1 || estrellas > 5) {
      throw new Error('Las estrellas deben estar entre 1 y 5');
    }

    const calificacion = {
      id: `RAT-${Date.now()}`,
      pedidoId,
      repartidorId,
      clienteId,
      estrellas,
      comentario,
      imagenes,
      aspecto,
      fecha: new Date().toISOString(),
      verificada: false,
      utiles: 0,
      respuesta: null
    };

    // Guardar calificación
    if (!this.ratings.has(repartidorId)) {
      this.ratings.set(repartidorId, []);
    }
    this.ratings.get(repartidorId).push(calificacion);

    // Actualizar promedio
    this.actualizarPromedioRepartidor(repartidorId);

    // Guardar en servidor
    if (this.socket) {
      this.socket.emit('nuevaCalificacion', calificacion);
    }

    // Guardar en JSON
    await this.guardarCalificacion(calificacion);

    return calificacion;
  }

  /**
   * Obtiene calificaciones de un repartidor
   */
  obtenerCalificaciones(repartidorId, opciones = {}) {
    const {
      ordenar = 'reciente', // 'reciente', 'util', 'puntuacion'
      filtro = null // null, 5, 4, 3, 2, 1
    } = opciones;

    let calificaciones = this.ratings.get(repartidorId) || [];

    // Aplicar filtro
    if (filtro) {
      calificaciones = calificaciones.filter(r => r.estrellas === filtro);
    }

    // Ordenar
    switch (ordenar) {
      case 'util':
        calificaciones.sort((a, b) => b.utiles - a.utiles);
        break;
      case 'puntuacion':
        calificaciones.sort((a, b) => b.estrellas - a.estrellas);
        break;
      case 'reciente':
      default:
        calificaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    return calificaciones;
  }

  /**
   * Obtiene promedio de calificaciones
   */
  obtenerPromedioRepartidor(repartidorId) {
    const calificaciones = this.ratings.get(repartidorId) || [];
    
    if (calificaciones.length === 0) {
      return {
        promedio: 0,
        total: 0,
        distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const suma = calificaciones.reduce((acc, r) => acc + r.estrellas, 0);
    const promedio = (suma / calificaciones.length).toFixed(1);

    // Distribución
    const distribucion = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    calificaciones.forEach(r => {
      distribucion[r.estrellas]++;
    });

    return {
      promedio: parseFloat(promedio),
      total: calificaciones.length,
      distribucion,
      aspectos: this.calcularAspectos(repartidorId)
    };
  }

  /**
   * Calcula promedio de aspectos (puntualidad, amabilidad, etc)
   */
  calcularAspectos(repartidorId) {
    const calificaciones = this.ratings.get(repartidorId) || [];
    
    if (calificaciones.length === 0) {
      return { puntualidad: 0, amabilidad: 0, limpieza: 0, exactitud: 0 };
    }

    const aspectos = { puntualidad: 0, amabilidad: 0, limpieza: 0, exactitud: 0 };
    
    calificaciones.forEach(r => {
      if (r.aspecto) {
        Object.keys(aspectos).forEach(key => {
          aspectos[key] += r.aspecto[key] || 0;
        });
      }
    });

    Object.keys(aspectos).forEach(key => {
      aspectos[key] = (aspectos[key] / calificaciones.length).toFixed(1);
    });

    return aspectos;
  }

  /**
   * Actualiza promedio de repartidor
   */
  actualizarPromedioRepartidor(repartidorId) {
    const promedio = this.obtenerPromedioRepartidor(repartidorId);
    this.userAverages.set(repartidorId, promedio);
    
    // Emitir actualización
    if (this.socket) {
      this.socket.emit('promedioActualizado', {
        repartidorId,
        promedio
      });
    }
  }

  /**
   * Agrega marca útil a una reseña
   */
  marcarUtil(resenaId, repartidorId) {
    const calificaciones = this.ratings.get(repartidorId) || [];
    const resena = calificaciones.find(r => r.id === resenaId);
    
    if (resena) {
      resena.utiles++;
      return true;
    }
    return false;
  }

  /**
   * Repartidor responde a una calificación
   */
  responderCalificacion(resenaId, repartidorId, respuesta) {
    const calificaciones = this.ratings.get(repartidorId) || [];
    const resena = calificaciones.find(r => r.id === resenaId);
    
    if (resena) {
      resena.respuesta = {
        texto: respuesta,
        fecha: new Date().toISOString(),
        repartidorId
      };
      return true;
    }
    return false;
  }

  /**
   * Obtiene ranking de repartidores
   */
  obtenerRanking(limite = 10) {
    const repartidores = [];

    this.userAverages.forEach((promedio, repartidorId) => {
      repartidores.push({
        repartidorId,
        ...promedio
      });
    });

    return repartidores
      .sort((a, b) => b.promedio - a.promedio)
      .slice(0, limite);
  }

  /**
   * Obtiene estadísticas generales del sistema
   */
  obtenerEstadisticas() {
    const totalCalificaciones = Array.from(this.ratings.values())
      .reduce((sum, arr) => sum + arr.length, 0);
    
    const promedioGeneral = totalCalificaciones > 0
      ? Array.from(this.userAverages.values())
          .reduce((sum, rating) => sum + rating.promedio, 0) / this.userAverages.size
      : 0;

    const distribucionGeneral = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    Array.from(this.ratings.values()).forEach(calificaciones => {
      calificaciones.forEach(r => {
        distribucionGeneral[r.estrellas]++;
      });
    });

    return {
      totalCalificaciones,
      promedioGeneral: promedioGeneral.toFixed(1),
      distribucion: distribucionGeneral,
      repartidoresCalificados: this.userAverages.size
    };
  }

  /**
   * Guarda calificación en servidor
   */
  async guardarCalificacion(calificacion) {
    try {
      const response = await fetch('/api/calificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calificacion)
      });
      return await response.json();
    } catch (error) {
      console.error('Error al guardar calificación:', error);
    }
  }

  /**
   * Carga calificaciones desde servidor
   */
  async cargarCalificaciones(repartidorId) {
    try {
      const response = await fetch(`/api/repartidores/${repartidorId}/calificaciones`);
      const data = await response.json();
      
      if (data.success) {
        this.ratings.set(repartidorId, data.calificaciones);
        this.actualizarPromedioRepartidor(repartidorId);
      }
    } catch (error) {
      console.error('Error al cargar calificaciones:', error);
    }
  }
}

/**
 * 🏆 Sistema de Logros (Badges y Logros)
 */
class AchievementSystem {
  constructor(socket = null) {
    this.socket = socket;
    this.achievements = new Map();
    this.userAchievements = new Map();
    
    // Definir logros
    this.defineAchievements();
  }

  /**
   * Define todos los logros disponibles
   */
  defineAchievements() {
    const achievements = {
      'PRIMER_PEDIDO': {
        id: 'PRIMER_PEDIDO',
        nombre: '🚀 Primeros Pasos',
        descripcion: 'Completar tu primer pedido',
        icono: '🚀',
        color: '#667eea',
        requiere: { tipo: 'pedidos', cantidad: 1 }
      },
      'CINCO_PEDIDOS': {
        id: 'CINCO_PEDIDOS',
        nombre: '⚡ En Marcha',
        descripcion: 'Completar 5 pedidos',
        icono: '⚡',
        color: '#764ba2',
        requiere: { tipo: 'pedidos', cantidad: 5 }
      },
      'CINCUENTA_PEDIDOS': {
        id: 'CINCUENTA_PEDIDOS',
        nombre: '💪 Profesional',
        descripcion: 'Completar 50 pedidos',
        icono: '💪',
        color: '#10b981',
        requiere: { tipo: 'pedidos', cantidad: 50 }
      },
      'CIEN_PEDIDOS': {
        id: 'CIEN_PEDIDOS',
        nombre: '🏅 Leyenda',
        descripcion: 'Completar 100 pedidos',
        icono: '🏅',
        color: '#f59e0b',
        requiere: { tipo: 'pedidos', cantidad: 100 }
      },
      'CINCO_ESTRELLAS': {
        id: 'CINCO_ESTRELLAS',
        nombre: '⭐ Impecable',
        descripcion: 'Mantener 5 estrellas en 10 calificaciones',
        icono: '⭐',
        color: '#fbbf24',
        requiere: { tipo: 'rating', cantidad: 5, minimo: 10 }
      },
      'SIN_CANCELACIONES': {
        id: 'SIN_CANCELACIONES',
        nombre: '✅ Confiable',
        descripcion: '50 pedidos sin cancelaciones',
        icono: '✅',
        color: '#10b981',
        requiere: { tipo: 'nocancel', cantidad: 50 }
      },
      'RAPIDO': {
        id: 'RAPIDO',
        nombre: '🔥 Rayo',
        descripcion: 'Entregar 10 pedidos en menos de 30 min',
        icono: '🔥',
        color: '#ef4444',
        requiere: { tipo: 'velocidad', cantidad: 10, tiempo: 30 }
      },
      'MADRUGADOR': {
        id: 'MADRUGADOR',
        nombre: '🌅 Madrugador',
        descripcion: '20 entregas entre 6-9 AM',
        icono: '🌅',
        color: '#84cc16',
        requiere: { tipo: 'horario', hora: [6, 9], cantidad: 20 }
      },
      'NOCTAMBULO': {
        id: 'NOCTAMBULO',
        nombre: '🌙 Noctámbulo',
        descripcion: '20 entregas entre 9 PM - 12 AM',
        icono: '🌙',
        color: '#3b82f6',
        requiere: { tipo: 'horario', hora: [21, 24], cantidad: 20 }
      },
      'GENEROSO': {
        id: 'GENEROSO',
        nombre: '❤️ Generoso',
        descripcion: 'Recibir 50 comentarios positivos',
        icono: '❤️',
        color: '#ec4899',
        requiere: { tipo: 'comentarios', cantidad: 50 }
      }
    };

    achievements.forEach((achievement, key) => {
      this.achievements.set(key, achievement);
    });
  }

  /**
   * Desbloquea un logro para un usuario
   */
  desbloquearLogro(repartidorId, achievementId) {
    if (!this.achievements.has(achievementId)) {
      return false;
    }

    if (!this.userAchievements.has(repartidorId)) {
      this.userAchievements.set(repartidorId, []);
    }

    const logros = this.userAchievements.get(repartidorId);
    
    // Verificar si ya está desbloqueado
    if (logros.some(a => a.id === achievementId)) {
      return false;
    }

    const achievement = this.achievements.get(achievementId);
    const logro = {
      ...achievement,
      desbloqueado: new Date().toISOString(),
      notificado: false
    };

    logros.push(logro);

    // Emitir evento
    if (this.socket) {
      this.socket.emit('logroDesbloqueado', {
        repartidorId,
        logro
      });
    }

    return true;
  }

  /**
   * Verifica y desbloquea logros según estadísticas
   */
  verificarLogros(repartidorId, estadisticas) {
    const {
      totalPedidos = 0,
      calificacionPromedio = 0,
      sinCancelaciones = 0,
      tiempoPromedio = 0,
      comentariosPositivos = 0
    } = estadisticas;

    // Logros basados en cantidad de pedidos
    if (totalPedidos >= 1) this.desbloquearLogro(repartidorId, 'PRIMER_PEDIDO');
    if (totalPedidos >= 5) this.desbloquearLogro(repartidorId, 'CINCO_PEDIDOS');
    if (totalPedidos >= 50) this.desbloquearLogro(repartidorId, 'CINCUENTA_PEDIDOS');
    if (totalPedidos >= 100) this.desbloquearLogro(repartidorId, 'CIEN_PEDIDOS');

    // Logros basados en calificación
    if (calificacionPromedio === 5 && totalPedidos >= 10) {
      this.desbloquearLogro(repartidorId, 'CINCO_ESTRELLAS');
    }

    // Logros sin cancelaciones
    if (sinCancelaciones >= 50) this.desbloquearLogro(repartidorId, 'SIN_CANCELACIONES');

    // Logros de velocidad
    if (tiempoPromedio < 30 && totalPedidos >= 10) {
      this.desbloquearLogro(repartidorId, 'RAPIDO');
    }

    // Logros de comentarios
    if (comentariosPositivos >= 50) this.desbloquearLogro(repartidorId, 'GENEROSO');
  }

  /**
   * Obtiene logros de un repartidor
   */
  obtenerLogros(repartidorId) {
    return this.userAchievements.get(repartidorId) || [];
  }

  /**
   * Obtiene progreso hacia un logro
   */
  obtenerProgreso(repartidorId, achievementId, estadisticas) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return null;

    const { requiere } = achievement;
    let actual = 0;
    let porcentaje = 0;

    switch (requiere.tipo) {
      case 'pedidos':
        actual = estadisticas.totalPedidos || 0;
        porcentaje = (actual / requiere.cantidad) * 100;
        break;
      case 'rating':
        actual = estadisticas.calificacionPromedio || 0;
        porcentaje = (actual / 5) * 100;
        break;
      case 'nocancel':
        actual = estadisticas.sinCancelaciones || 0;
        porcentaje = (actual / requiere.cantidad) * 100;
        break;
      case 'velocidad':
        actual = estadisticas.pedidosRapidos || 0;
        porcentaje = (actual / requiere.cantidad) * 100;
        break;
      case 'comentarios':
        actual = estadisticas.comentariosPositivos || 0;
        porcentaje = (actual / requiere.cantidad) * 100;
        break;
    }

    return {
      achievementId,
      actual,
      requerido: requiere.cantidad,
      porcentaje: Math.min(porcentaje, 100),
      completado: actual >= requiere.cantidad
    };
  }

  /**
   * Obtiene ranking global de logros
   */
  obtenerRankingLogros(limite = 10) {
    const ranking = [];

    this.userAchievements.forEach((logros, repartidorId) => {
      ranking.push({
        repartidorId,
        logrosDesbloqueados: logros.length,
        logros
      });
    });

    return ranking
      .sort((a, b) => b.logrosDesbloqueados - a.logrosDesbloqueados)
      .slice(0, limite);
  }
}

// Crear instancias globales
let ratingSystem = null;
let achievementSystem = null;

function initRatingAndAchievementSystems(socket = null) {
  ratingSystem = new RatingSystem(socket);
  achievementSystem = new AchievementSystem(socket);
  return { ratingSystem, achievementSystem };
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RatingSystem, AchievementSystem };
}
