/**
 * 🔔 SISTEMA DE NOTIFICACIONES INTELIGENTES CON IA - YAvoy 2026
 * 
 * Notificaciones personalizadas basadas en ML/IA
 * - Sugerencias de restaurantes basadas en historial
 * - Recordatorios por frecuencia de pedido
 * - Timing óptimo para notificaciones
 * - Predicción de preferencias
 * - Ofertas personalizadas
 * 
 * @version 2.0.0
 * @author YAvoy Team
 * @date 2025-12-11
 */

class NotificacionesIA {
  constructor() {
    this.perfilesUsuarios = new Map();
    this.modeloEntrenado = false;
    this.horariosOptimos = new Map();
    this.initialized = false;
  }

  async init() {
    console.log('🔔 Inicializando Sistema de Notificaciones IA...');
    await this.cargarPerfiles();
    await this.entrenarModelo();
    this.programarNotificaciones();
    this.setupEventListeners();
    this.initialized = true;
    console.log('✅ Sistema de Notificaciones IA inicializado');
    return true;
  }

  async cargarPerfiles() {
    try {
      const response = await fetch('/api/notificaciones-ia/perfiles');
      const data = await response.json();
      data.forEach(p => this.perfilesUsuarios.set(p.usuarioId, p));
    } catch (error) {
      console.error('Error cargando perfiles:', error);
    }
  }

  async entrenarModelo() {
    console.log('🧠 Entrenando modelo de IA...');
    
    // Analizar patrones de todos los usuarios
    for (const [usuarioId, perfil] of this.perfilesUsuarios) {
      await this.analizarPatronesUsuario(usuarioId, perfil);
    }
    
    this.modeloEntrenado = true;
    console.log('✅ Modelo entrenado correctamente');
  }

  async analizarPatronesUsuario(usuarioId, perfil) {
    // Análisis de historial de pedidos
    const historial = await this.obtenerHistorialPedidos(usuarioId);
    
    // 1. Detectar comercios favoritos
    const comerciosFrecuencia = this.calcularFrecuenciaComercio(historial);
    perfil.comerciosFavoritos = comerciosFrecuencia.slice(0, 5);
    
    // 2. Detectar horarios preferidos
    const horarios = this.analizarHorarios(historial);
    perfil.horariosPreferidos = horarios;
    this.horariosOptimos.set(usuarioId, horarios);
    
    // 3. Detectar días de la semana con más pedidos
    const diasPreferidos = this.analizarDiasSemana(historial);
    perfil.diasPreferidos = diasPreferidos;
    
    // 4. Categorías favoritas
    const categorias = this.analizarCategorias(historial);
    perfil.categoriasFavoritas = categorias;
    
    // 5. Rango de precios promedio
    const rangoPrecios = this.calcularRangoPrecios(historial);
    perfil.presupuestoPromedio = rangoPrecios;
    
    // 6. Frecuencia de pedidos (días entre pedidos)
    const frecuencia = this.calcularFrecuencia(historial);
    perfil.frecuenciaDias = frecuencia;
    
    // 7. Predicción del próximo pedido
    perfil.proximoPedidoPrediccion = this.predecirProximoPedido(perfil);
    
    await this.guardarPerfil(usuarioId, perfil);
  }

  calcularFrecuenciaComercio(historial) {
    const frecuencia = {};
    historial.forEach(pedido => {
      const id = pedido.comercioId;
      if (!frecuencia[id]) {
        frecuencia[id] = { id, nombre: pedido.comercioNombre, cantidad: 0 };
      }
      frecuencia[id].cantidad++;
    });
    
    return Object.values(frecuencia).sort((a, b) => b.cantidad - a.cantidad);
  }

  analizarHorarios(historial) {
    const franjas = {
      mañana: 0,    // 6-12
      mediodia: 0,  // 12-15
      tarde: 0,     // 15-20
      noche: 0      // 20-24
    };
    
    historial.forEach(pedido => {
      const hora = new Date(pedido.fecha).getHours();
      if (hora >= 6 && hora < 12) franjas.mañana++;
      else if (hora >= 12 && hora < 15) franjas.mediodia++;
      else if (hora >= 15 && hora < 20) franjas.tarde++;
      else if (hora >= 20 || hora < 6) franjas.noche++;
    });
    
    const total = historial.length;
    return {
      mañana: Math.round((franjas.mañana / total) * 100),
      mediodia: Math.round((franjas.mediodia / total) * 100),
      tarde: Math.round((franjas.tarde / total) * 100),
      noche: Math.round((franjas.noche / total) * 100)
    };
  }

  analizarDiasSemana(historial) {
    const dias = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    historial.forEach(pedido => {
      const dia = new Date(pedido.fecha).getDay();
      dias[dia]++;
    });
    
    const total = historial.length;
    const diasNombres = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    
    return Object.entries(dias)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([dia, cant]) => ({
        dia: diasNombres[dia],
        porcentaje: Math.round((cant / total) * 100)
      }));
  }

  analizarCategorias(historial) {
    const categorias = {};
    historial.forEach(pedido => {
      const cat = pedido.categoria || 'General';
      if (!categorias[cat]) categorias[cat] = 0;
      categorias[cat]++;
    });
    
    return Object.entries(categorias)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));
  }

  calcularRangoPrecios(historial) {
    if (historial.length === 0) return { min: 0, max: 0, promedio: 0 };
    
    const precios = historial.map(p => p.total);
    return {
      min: Math.min(...precios),
      max: Math.max(...precios),
      promedio: Math.round(precios.reduce((a, b) => a + b, 0) / precios.length)
    };
  }

  calcularFrecuencia(historial) {
    if (historial.length < 2) return null;
    
    const fechas = historial.map(p => new Date(p.fecha).getTime()).sort();
    const diferencias = [];
    
    for (let i = 1; i < fechas.length; i++) {
      const diff = (fechas[i] - fechas[i-1]) / (1000 * 60 * 60 * 24); // días
      diferencias.push(diff);
    }
    
    const promedio = diferencias.reduce((a, b) => a + b, 0) / diferencias.length;
    return Math.round(promedio);
  }

  predecirProximoPedido(perfil) {
    if (!perfil.frecuenciaDias) return null;
    
    const ultimoPedido = new Date(perfil.ultimoPedido || Date.now());
    const proximaFecha = new Date(ultimoPedido.getTime() + (perfil.frecuenciaDias * 24 * 60 * 60 * 1000));
    
    return {
      fecha: proximaFecha.toISOString(),
      confianza: this.calcularConfianza(perfil),
      horarioSugerido: this.obtenerHorarioOptimo(perfil.horariosPreferidos)
    };
  }

  calcularConfianza(perfil) {
    let puntaje = 0;
    if (perfil.comerciosFavoritos?.length > 0) puntaje += 25;
    if (perfil.frecuenciaDias) puntaje += 25;
    if (perfil.horariosPreferidos) puntaje += 25;
    if (perfil.categoriasFavoritas?.length > 0) puntaje += 25;
    return puntaje;
  }

  obtenerHorarioOptimo(horariosPreferidos) {
    if (!horariosPreferidos) return '12:00';
    
    const franjas = Object.entries(horariosPreferidos)
      .sort((a, b) => b[1] - a[1]);
    
    const franjaMasComun = franjas[0][0];
    
    const horarios = {
      mañana: '10:00',
      mediodia: '13:00',
      tarde: '18:00',
      noche: '21:00'
    };
    
    return horarios[franjaMasComun] || '12:00';
  }

  async generarSugerencias(usuarioId) {
    const perfil = this.perfilesUsuarios.get(usuarioId);
    if (!perfil) return [];
    
    const sugerencias = [];
    
    // 1. Sugerencia de restaurante favorito
    if (perfil.comerciosFavoritos && perfil.comerciosFavoritos.length > 0) {
      const favorito = perfil.comerciosFavoritos[0];
      sugerencias.push({
        tipo: 'restaurante_favorito',
        titulo: `🍕 ¿Antojo de ${favorito.nombre}?`,
        mensaje: `Has pedido aquí ${favorito.cantidad} veces. ¡Vuelve a disfrutar!`,
        comercioId: favorito.id,
        prioridad: 'alta'
      });
    }
    
    // 2. Sugerencia por frecuencia
    if (perfil.proximoPedidoPrediccion) {
      const prediccion = perfil.proximoPedidoPrediccion;
      const ahora = new Date();
      const fechaPrediccion = new Date(prediccion.fecha);
      
      if (fechaPrediccion <= ahora && prediccion.confianza >= 50) {
        sugerencias.push({
          tipo: 'recordatorio_frecuencia',
          titulo: '⏰ ¡Es tu hora de pedir!',
          mensaje: `Generalmente pides cada ${perfil.frecuenciaDias} días. ¿Qué te parece hoy?`,
          prioridad: 'media'
        });
      }
    }
    
    // 3. Sugerencia de nueva categoría
    const categoriasNoExploradas = await this.obtenerCategoriasNoExploradas(usuarioId, perfil);
    if (categoriasNoExploradas.length > 0) {
      const categoria = categoriasNoExploradas[0];
      sugerencias.push({
        tipo: 'explorar_categoria',
        titulo: `🆕 Descubre ${categoria}`,
        mensaje: `Aún no has probado esta categoría. ¡Explora opciones nuevas!`,
        categoria: categoria,
        prioridad: 'baja'
      });
    }
    
    // 4. Oferta personalizada
    if (perfil.presupuestoPromedio) {
      sugerencias.push({
        tipo: 'oferta_personalizada',
        titulo: '💰 Oferta especial para ti',
        mensaje: `Restaurantes con platos en tu rango de $${perfil.presupuestoPromedio.promedio}`,
        prioridad: 'media'
      });
    }
    
    return sugerencias;
  }

  async enviarNotificacionInteligente(usuarioId, sugerencia) {
    // Verificar horario óptimo
    const horarioOptimo = this.horariosOptimos.get(usuarioId);
    const horaActual = new Date().getHours();
    
    let debeEnviar = true;
    
    if (horarioOptimo) {
      // Solo enviar en franjas con > 20% de preferencia
      const franjasPreferidas = Object.entries(horarioOptimo)
        .filter(([franja, porcentaje]) => porcentaje > 20)
        .map(([franja]) => franja);
      
      const franjaActual = this.obtenerFranjaActual(horaActual);
      debeEnviar = franjasPreferidas.includes(franjaActual);
    }
    
    if (!debeEnviar) {
      console.log(`⏸️ Notificación pospuesta para mejor horario (usuario ${usuarioId})`);
      return { success: false, motivo: 'horario_no_optimo' };
    }
    
    // Enviar notificación
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: sugerencia.titulo,
        mensaje: sugerencia.mensaje,
        icono: '/icons/icon-yavoy.png',
        urlAccion: sugerencia.urlAccion || '/pedidos',
        usuarioId
      })
    });
    
    // Registrar envío
    await this.registrarEnvio(usuarioId, sugerencia);
    
    return { success: true };
  }

  obtenerFranjaActual(hora) {
    if (hora >= 6 && hora < 12) return 'mañana';
    if (hora >= 12 && hora < 15) return 'mediodia';
    if (hora >= 15 && hora < 20) return 'tarde';
    return 'noche';
  }

  async obtenerHistorialPedidos(usuarioId) {
    const response = await fetch(`/api/pedidos/historial/${usuarioId}`);
    return await response.json();
  }

  async obtenerCategoriasNoExploradas(usuarioId, perfil) {
    const response = await fetch('/api/categorias');
    const todasCategorias = await response.json();
    
    const exploradas = perfil.categoriasFavoritas?.map(c => c.nombre) || [];
    return todasCategorias.filter(c => !exploradas.includes(c));
  }

  async guardarPerfil(usuarioId, perfil) {
    await fetch(`/api/notificaciones-ia/perfiles/${usuarioId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(perfil)
    });
  }

  async registrarEnvio(usuarioId, sugerencia) {
    await fetch('/api/notificaciones-ia/envios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId,
        tipo: sugerencia.tipo,
        fecha: new Date().toISOString()
      })
    });
  }

  programarNotificaciones() {
    // Ejecutar cada hora para verificar usuarios que necesitan notificación
    setInterval(() => {
      this.verificarYEnviarNotificaciones();
    }, 60 * 60 * 1000); // 1 hora
    
    // Primera ejecución inmediata
    this.verificarYEnviarNotificaciones();
  }

  async verificarYEnviarNotificaciones() {
    console.log('🔔 Verificando usuarios para notificaciones...');
    
    for (const [usuarioId, perfil] of this.perfilesUsuarios) {
      const sugerencias = await this.generarSugerencias(usuarioId);
      
      if (sugerencias.length > 0) {
        // Enviar solo la de mayor prioridad
        const sugerencia = sugerencias.sort((a, b) => {
          const prioridades = { alta: 3, media: 2, baja: 1 };
          return prioridades[b.prioridad] - prioridades[a.prioridad];
        })[0];
        
        await this.enviarNotificacionInteligente(usuarioId, sugerencia);
      }
    }
  }

  setupEventListeners() {
    // Escuchar cuando se completa un pedido para actualizar perfil
    window.addEventListener('pedidoCompletado', async (e) => {
      const { usuarioId, pedido } = e.detail;
      
      let perfil = this.perfilesUsuarios.get(usuarioId);
      if (!perfil) {
        perfil = { usuarioId, ultimoPedido: pedido.fecha };
        this.perfilesUsuarios.set(usuarioId, perfil);
      }
      
      perfil.ultimoPedido = pedido.fecha;
      await this.analizarPatronesUsuario(usuarioId, perfil);
    });
  }
}

window.notificacionesIA = new NotificacionesIA();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.notificacionesIA.init());
} else {
  window.notificacionesIA.init();
}
