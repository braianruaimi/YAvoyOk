/**
 * ====================================
 * 📊 ANALYTICS CONTROLLER - YAVOY
 * ====================================
 * 
 * Controlador para métricas y visualización de datos
 * Dashboard del CEO con estadísticas en tiempo real
 * 
 * @author YAvoy Team
 * @version 3.0
 */

const path = require('path');
const fs = require('fs').promises;

const BASE_DIR = path.join(__dirname, '..', '..', 'registros');

/**
 * Cargar pedidos desde archivos JSON
 */
async function cargarPedidos() {
  try {
    const pedidosDir = path.join(BASE_DIR, 'pedidos');
    const archivos = await fs.readdir(pedidosDir);
    const pedidos = [];
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const contenido = await fs.readFile(path.join(pedidosDir, archivo), 'utf-8');
        pedidos.push(JSON.parse(contenido));
      }
    }
    
    return pedidos;
  } catch (error) {
    console.error('Error cargando pedidos:', error);
    return [];
  }
}

/**
 * Cargar repartidores desde archivos JSON
 */
async function cargarRepartidores() {
  try {
    const repartidoresDir = path.join(BASE_DIR, 'repartidores');
    const archivos = await fs.readdir(repartidoresDir);
    const repartidores = [];
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const contenido = await fs.readFile(path.join(repartidoresDir, archivo), 'utf-8');
        repartidores.push(JSON.parse(contenido));
      }
    }
    
    return repartidores;
  } catch (error) {
    console.error('Error cargando repartidores:', error);
    return [];
  }
}

/**
 * Cargar comercios desde archivos JSON
 */
async function cargarComercios() {
  try {
    const comerciosPath = path.join(BASE_DIR, 'comercios.json');
    const contenido = await fs.readFile(comerciosPath, 'utf-8');
    return JSON.parse(contenido);
  } catch (error) {
    console.error('Error cargando comercios:', error);
    return [];
  }
}

/**
 * GET /api/analytics/dashboard
 * Dashboard general con todas las métricas
 */
async function getDashboard(req, res) {
  try {
    // Cargar todos los datos
    const pedidos = await cargarPedidos();
    const repartidores = await cargarRepartidores();
    const comercios = await cargarComercios();
    
    // Calcular estadísticas de pedidos
    const totalPedidos = pedidos.length;
    const pedidosCompletados = pedidos.filter(p => p.estado === 'entregado').length;
    const pedidosEnCurso = pedidos.filter(p => ['pendiente', 'aceptado', 'en_camino'].includes(p.estado)).length;
    const pedidosCancelados = pedidos.filter(p => p.estado === 'cancelado').length;
    
    // Estadísticas de repartidores
    const totalRepartidores = repartidores.length;
    const repartidoresActivos = repartidores.filter(r => r.disponible).length;
    const repartidoresVerificados = repartidores.filter(r => 
      r.configPago && r.configPago.estadoVerificacion === 'aprobada'
    ).length;
    
    // Calcular ingresos
    const pedidosPagados = pedidos.filter(p => p.pagado);
    const ingresosTotales = pedidosPagados.reduce((sum, p) => sum + (p.monto || p.total || 0), 0);
    const comisionesTotales = ingresosTotales * 0.15; // 15% de comisión
    
    // Pedidos por día (últimos 7 días)
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    
    const pedidosPorDia = {};
    for (let i = 0; i < 7; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      pedidosPorDia[fechaStr] = 0;
    }
    
    pedidos.forEach(p => {
      if (p.fecha) {
        const fechaPedido = new Date(p.fecha).toISOString().split('T')[0];
        if (pedidosPorDia.hasOwnProperty(fechaPedido)) {
          pedidosPorDia[fechaPedido]++;
        }
      }
    });
    
    // Repartidores top (por pedidos completados)
    const repartidoresTop = repartidores
      .map(r => ({
        id: r.id,
        nombre: r.nombre,
        pedidosCompletados: r.pedidosCompletados || 0,
        calificacion: r.calificacion || 0,
        comisionesRetenidas: r.comisionesRetenidas || 0,
        saldoTotal: r.saldoTotal || 0
      }))
      .sort((a, b) => b.pedidosCompletados - a.pedidosCompletados)
      .slice(0, 10);
    
    // Tiempo promedio de entrega
    const pedidosConTiempo = pedidos.filter(p => p.tiempoEntrega);
    const tiempoPromedioEntrega = pedidosConTiempo.length > 0
      ? pedidosConTiempo.reduce((sum, p) => sum + p.tiempoEntrega, 0) / pedidosConTiempo.length
      : 0;
    
    // Comercios más activos
    const comerciosTop = comercios
      .map(c => ({
        id: c.id,
        nombre: c.nombre,
        categoria: c.categoria,
        pedidosRecibidos: c.pedidosRecibidos || 0,
        ventasTotal: c.ventasTotal || 0
      }))
      .sort((a, b) => b.pedidosRecibidos - a.pedidosRecibidos)
      .slice(0, 10);
    
    res.json({
      success: true,
      estadisticas: {
        pedidos: {
          total: totalPedidos,
          completados: pedidosCompletados,
          enCurso: pedidosEnCurso,
          cancelados: pedidosCancelados,
          tasaExito: totalPedidos > 0 ? ((pedidosCompletados / totalPedidos) * 100).toFixed(1) : 0
        },
        repartidores: {
          total: totalRepartidores,
          activos: repartidoresActivos,
          verificados: repartidoresVerificados,
          pendientesVerificacion: totalRepartidores - repartidoresVerificados
        },
        comercios: {
          total: comercios.length,
          activos: comercios.filter(c => c.activo !== false).length
        },
        finanzas: {
          ingresosTotales: ingresosTotales.toFixed(2),
          comisionesTotales: comisionesTotales.toFixed(2),
          ingresoPromedioPorPedido: totalPedidos > 0 ? (ingresosTotales / totalPedidos).toFixed(2) : 0
        },
        rendimiento: {
          tiempoPromedioEntrega: Math.round(tiempoPromedioEntrega),
          pedidosPorDia,
          repartidoresTop,
          comerciosTop
        }
      }
    });
    
  } catch (error) {
    console.error('Error al obtener analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
}

/**
 * GET /api/analytics/pedidos
 * Estadísticas detalladas de pedidos
 */
async function getEstadisticasPedidos(req, res) {
  try {
    const pedidos = await cargarPedidos();
    const { desde, hasta } = req.query;
    
    let pedidosFiltrados = pedidos;
    
    // Filtrar por rango de fechas
    if (desde) {
      const fechaDesde = new Date(desde);
      pedidosFiltrados = pedidosFiltrados.filter(p => new Date(p.fecha) >= fechaDesde);
    }
    
    if (hasta) {
      const fechaHasta = new Date(hasta);
      pedidosFiltrados = pedidosFiltrados.filter(p => new Date(p.fecha) <= fechaHasta);
    }
    
    // Calcular métricas
    const porEstado = {};
    const porCategoria = {};
    const porHora = Array(24).fill(0);
    
    pedidosFiltrados.forEach(p => {
      // Por estado
      porEstado[p.estado] = (porEstado[p.estado] || 0) + 1;
      
      // Por categoría
      if (p.categoria) {
        porCategoria[p.categoria] = (porCategoria[p.categoria] || 0) + 1;
      }
      
      // Por hora del día
      if (p.fecha) {
        const hora = new Date(p.fecha).getHours();
        porHora[hora]++;
      }
    });
    
    res.json({
      success: true,
      total: pedidosFiltrados.length,
      porEstado,
      porCategoria,
      porHora,
      rangoFechas: {
        desde: desde || 'inicio',
        hasta: hasta || 'presente'
      }
    });
    
  } catch (error) {
    console.error('Error en estadísticas de pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de pedidos'
    });
  }
}

/**
 * GET /api/analytics/repartidores
 * Estadísticas detalladas de repartidores
 */
async function getEstadisticasRepartidores(req, res) {
  try {
    const repartidores = await cargarRepartidores();
    
    // Calcular métricas
    const disponibles = repartidores.filter(r => r.disponible).length;
    const ocupados = repartidores.length - disponibles;
    const verificados = repartidores.filter(r => 
      r.configPago && r.configPago.estadoVerificacion === 'aprobada'
    ).length;
    
    const saldoTotalGeneral = repartidores.reduce((sum, r) => sum + (r.saldoTotal || 0), 0);
    const comisionesTotales = repartidores.reduce((sum, r) => sum + (r.comisionesRetenidas || 0), 0);
    
    // Rankings
    const topPorPedidos = [...repartidores]
      .sort((a, b) => (b.pedidosCompletados || 0) - (a.pedidosCompletados || 0))
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        nombre: r.nombre,
        pedidosCompletados: r.pedidosCompletados || 0
      }));
    
    const topPorCalificacion = [...repartidores]
      .filter(r => r.calificacion > 0)
      .sort((a, b) => b.calificacion - a.calificacion)
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        nombre: r.nombre,
        calificacion: r.calificacion || 0,
        totalCalificaciones: r.totalCalificaciones || 0
      }));
    
    res.json({
      success: true,
      total: repartidores.length,
      disponibles,
      ocupados,
      verificados,
      finanzas: {
        saldoTotalGeneral: saldoTotalGeneral.toFixed(2),
        comisionesTotales: comisionesTotales.toFixed(2)
      },
      rankings: {
        topPorPedidos,
        topPorCalificacion
      }
    });
    
  } catch (error) {
    console.error('Error en estadísticas de repartidores:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de repartidores'
    });
  }
}

/**
 * GET /api/analytics/finanzas
 * Reporte financiero consolidado
 */
async function getReporteFinanzas(req, res) {
  try {
    const pedidos = await cargarPedidos();
    const repartidores = await cargarRepartidores();
    const { mes, año } = req.query;
    
    let pedidosFiltrados = pedidos;
    
    // Filtrar por mes/año si se especifica
    if (mes && año) {
      pedidosFiltrados = pedidos.filter(p => {
        const fecha = new Date(p.fecha);
        return fecha.getMonth() === parseInt(mes) - 1 && fecha.getFullYear() === parseInt(año);
      });
    }
    
    // Calcular ingresos
    const pedidosPagados = pedidosFiltrados.filter(p => p.pagado);
    const ingresosBrutos = pedidosPagados.reduce((sum, p) => sum + (p.monto || p.total || 0), 0);
    const comisionesRetenidas = ingresosBrutos * 0.15;
    const transferidoARepartidores = ingresosBrutos * 0.85;
    
    // Transferencias realizadas
    const transferencias = repartidores
      .filter(r => r.ultimaTransferencia)
      .map(r => ({
        repartidorId: r.id,
        nombre: r.nombre,
        monto: r.ultimaTransferencia.monto,
        fecha: r.ultimaTransferencia.fecha
      }));
    
    res.json({
      success: true,
      periodo: mes && año ? `${mes}/${año}` : 'Histórico',
      ingresosBrutos: ingresosBrutos.toFixed(2),
      comisionesRetenidas: comisionesRetenidas.toFixed(2),
      transferidoARepartidores: transferidoARepartidores.toFixed(2),
      pedidosProcesados: pedidosPagados.length,
      transferencias: transferencias.length,
      detalleTransferencias: transferencias
    });
    
  } catch (error) {
    console.error('Error en reporte de finanzas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte financiero'
    });
  }
}

module.exports = {
  getDashboard,
  getEstadisticasPedidos,
  getEstadisticasRepartidores,
  getReporteFinanzas
};
