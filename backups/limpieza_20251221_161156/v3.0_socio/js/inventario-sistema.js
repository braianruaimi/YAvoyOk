/**
 * 📦 SISTEMA DE INVENTARIO INTELIGENTE - YAvoy 2026
 * 
 * Gestión de inventario para comercios
 * - Control de stock en tiempo real
 * - Auto-desactivación de productos sin stock
 * - Estadísticas de ventas
 * - Alertas de stock bajo
 * - Sugerencias de reabastecimiento
 * - Análisis de rendimiento de productos
 * 
 * @version 2.0.0
 * @author YAvoy Team
 * @date 2025-12-11
 */

class InventarioInteligente {
  constructor() {
    this.productos = new Map();
    this.alertasActivas = new Map();
    this.umbralStockBajo = 5;
    this.initialized = false;
  }

  async init() {
    console.log('📦 Inicializando Sistema de Inventario...');
    await this.cargarInventario();
    this.iniciarMonitoreo();
    this.setupEventListeners();
    this.initialized = true;
    console.log('✅ Sistema de Inventario inicializado');
    return true;
  }

  async cargarInventario() {
    try {
      const response = await fetch('/api/inventario');
      const data = await response.json();
      data.forEach(p => this.productos.set(p.id, p));
    } catch (error) {
      console.error('Error cargando inventario:', error);
    }
  }

  async agregarProducto(productoData) {
    try {
      const producto = {
        id: `PROD-${Date.now()}`,
        comercioId: productoData.comercioId,
        nombre: productoData.nombre,
        categoria: productoData.categoria,
        precio: productoData.precio,
        stock: productoData.stock || 0,
        stockMinimo: productoData.stockMinimo || 5,
        activo: true,
        fechaCreacion: new Date().toISOString(),
        estadisticas: {
          totalVendido: 0,
          ingresos: 0,
          ultimaVenta: null,
          ventasDiarias: [],
          promedioVentasSemanal: 0
        }
      };

      const response = await fetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto)
      });

      if (!response.ok) throw new Error('Error agregando producto');

      this.productos.set(producto.id, producto);
      console.log(`✅ Producto agregado: ${producto.nombre}`);
      
      return { success: true, producto };

    } catch (error) {
      console.error('Error:', error);
      return { success: false, error: error.message };
    }
  }

  async actualizarStock(productoId, cantidad, operacion = 'restar') {
    try {
      const producto = this.productos.get(productoId);
      if (!producto) throw new Error('Producto no encontrado');

      const stockAnterior = producto.stock;

      if (operacion === 'restar') {
        producto.stock -= cantidad;
      } else if (operacion === 'sumar') {
        producto.stock += cantidad;
      } else if (operacion === 'establecer') {
        producto.stock = cantidad;
      }

      // No permitir stock negativo
      if (producto.stock < 0) producto.stock = 0;

      // Auto-desactivar si stock = 0
      if (producto.stock === 0 && producto.activo) {
        producto.activo = false;
        await this.notificarProductoAgotado(producto);
        console.log(`⚠️ Producto desactivado por falta de stock: ${producto.nombre}`);
      }

      // Re-activar si vuelve a tener stock
      if (producto.stock > 0 && !producto.activo) {
        producto.activo = true;
        console.log(`✅ Producto reactivado: ${producto.nombre}`);
      }

      // Verificar stock bajo
      if (producto.stock <= producto.stockMinimo && producto.stock > 0) {
        await this.generarAlertaStockBajo(producto);
      }

      await this.guardarProducto(producto);

      // Registrar movimiento
      await this.registrarMovimiento({
        productoId,
        operacion,
        cantidad,
        stockAnterior,
        stockNuevo: producto.stock,
        fecha: new Date().toISOString()
      });

      return { success: true, stockNuevo: producto.stock };

    } catch (error) {
      console.error('Error actualizando stock:', error);
      return { success: false, error: error.message };
    }
  }

  async procesarVenta(productoId, cantidad, precioVenta) {
    const resultado = await this.actualizarStock(productoId, cantidad, 'restar');
    if (!resultado.success) return resultado;

    const producto = this.productos.get(productoId);
    
    // Actualizar estadísticas
    producto.estadisticas.totalVendido += cantidad;
    producto.estadisticas.ingresos += precioVenta * cantidad;
    producto.estadisticas.ultimaVenta = new Date().toISOString();

    // Agregar a ventas diarias
    const hoy = new Date().toISOString().split('T')[0];
    const ventaHoy = producto.estadisticas.ventasDiarias.find(v => v.fecha === hoy);
    
    if (ventaHoy) {
      ventaHoy.cantidad += cantidad;
      ventaHoy.ingresos += precioVenta * cantidad;
    } else {
      producto.estadisticas.ventasDiarias.push({
        fecha: hoy,
        cantidad,
        ingresos: precioVenta * cantidad
      });
    }

    // Calcular promedio semanal
    this.calcularPromedioSemanal(producto);

    await this.guardarProducto(producto);

    return { success: true };
  }

  calcularPromedioSemanal(producto) {
    const ultimos7Dias = producto.estadisticas.ventasDiarias.slice(-7);
    const totalVentas = ultimos7Dias.reduce((sum, v) => sum + v.cantidad, 0);
    producto.estadisticas.promedioVentasSemanal = Math.round(totalVentas / 7 * 10) / 10;
  }

  async generarAlertaStockBajo(producto) {
    const alertaId = `ALERT-${producto.id}-${Date.now()}`;
    
    if (this.alertasActivas.has(producto.id)) {
      return; // Ya hay una alerta activa
    }

    const alerta = {
      id: alertaId,
      productoId: producto.id,
      productoNombre: producto.nombre,
      stockActual: producto.stock,
      stockMinimo: producto.stockMinimo,
      tipo: 'stock_bajo',
      fecha: new Date().toISOString(),
      resuelta: false
    };

    this.alertasActivas.set(producto.id, alerta);

    // Guardar en servidor
    await fetch('/api/inventario/alertas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alerta)
    });

    // Notificar al comercio
    await this.notificarComercio(producto.comercioId, {
      titulo: '⚠️ Stock Bajo',
      mensaje: `${producto.nombre} tiene solo ${producto.stock} unidades`,
      urlAccion: `/inventario?producto=${producto.id}`
    });

    console.log(`⚠️ Alerta de stock bajo: ${producto.nombre}`);
  }

  async notificarProductoAgotado(producto) {
    await this.notificarComercio(producto.comercioId, {
      titulo: '🚫 Producto Agotado',
      mensaje: `${producto.nombre} se quedó sin stock y fue desactivado`,
      urlAccion: `/inventario?producto=${producto.id}`
    });
  }

  async generarSugerenciasReabastecimiento(comercioId) {
    const productosComercio = Array.from(this.productos.values())
      .filter(p => p.comercioId === comercioId);

    const sugerencias = [];

    for (const producto of productosComercio) {
      // Calcular días hasta agotamiento
      const diasHastaAgotamiento = this.calcularDiasHastaAgotamiento(producto);
      
      if (diasHastaAgotamiento !== null && diasHastaAgotamiento <= 3) {
        const cantidadSugerida = this.calcularCantidadReabastecimiento(producto);
        
        sugerencias.push({
          productoId: producto.id,
          productoNombre: producto.nombre,
          stockActual: producto.stock,
          promedioVentas: producto.estadisticas.promedioVentasSemanal,
          diasHastaAgotamiento,
          cantidadSugerida,
          prioridad: diasHastaAgotamiento <= 1 ? 'alta' : 'media'
        });
      }
    }

    return sugerencias.sort((a, b) => {
      const prioridades = { alta: 2, media: 1 };
      return prioridades[b.prioridad] - prioridades[a.prioridad];
    });
  }

  calcularDiasHastaAgotamiento(producto) {
    if (producto.estadisticas.promedioVentasSemanal === 0) return null;
    
    const ventasDiarias = producto.estadisticas.promedioVentasSemanal / 7;
    if (ventasDiarias === 0) return null;
    
    return Math.floor(producto.stock / ventasDiarias);
  }

  calcularCantidadReabastecimiento(producto) {
    // Sugerir cantidad para 2 semanas basado en promedio semanal
    const ventasSemana = producto.estadisticas.promedioVentasSemanal;
    const para2Semanas = ventasSemana * 2;
    const faltante = para2Semanas - producto.stock;
    
    return Math.max(0, Math.ceil(faltante));
  }

  async obtenerEstadisticasComercio(comercioId) {
    const productosComercio = Array.from(this.productos.values())
      .filter(p => p.comercioId === comercioId);

    const totalProductos = productosComercio.length;
    const productosActivos = productosComercio.filter(p => p.activo).length;
    const productosAgotados = productosComercio.filter(p => p.stock === 0).length;
    const productosStockBajo = productosComercio.filter(
      p => p.stock > 0 && p.stock <= p.stockMinimo
    ).length;

    const ingresosTotal = productosComercio.reduce(
      (sum, p) => sum + p.estadisticas.ingresos, 0
    );

    const topProductos = productosComercio
      .sort((a, b) => b.estadisticas.totalVendido - a.estadisticas.totalVendido)
      .slice(0, 5)
      .map(p => ({
        nombre: p.nombre,
        vendidos: p.estadisticas.totalVendido,
        ingresos: p.estadisticas.ingresos
      }));

    return {
      totalProductos,
      productosActivos,
      productosAgotados,
      productosStockBajo,
      ingresosTotal,
      topProductos
    };
  }

  async guardarProducto(producto) {
    await fetch(`/api/inventario/${producto.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(producto)
    });
  }

  async registrarMovimiento(movimiento) {
    await fetch('/api/inventario/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movimiento)
    });
  }

  async notificarComercio(comercioId, notificacion) {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificacion)
    });
  }

  iniciarMonitoreo() {
    // Verificar alertas cada 30 minutos
    setInterval(() => {
      this.verificarStocksBajos();
    }, 30 * 60 * 1000);
    
    // Primera verificación inmediata
    this.verificarStocksBajos();
  }

  async verificarStocksBajos() {
    console.log('🔍 Verificando stocks bajos...');
    
    for (const [id, producto] of this.productos) {
      if (producto.stock <= producto.stockMinimo && producto.stock > 0) {
        await this.generarAlertaStockBajo(producto);
      }
    }
  }

  renderizarDashboard(comercioId, container) {
    if (!container) return;

    this.obtenerEstadisticasComercio(comercioId).then(stats => {
      let html = `
        <div class="inventario-dashboard">
          <h2>📦 Gestión de Inventario</h2>
          
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-icon">📦</span>
              <div>
                <span class="stat-numero">${stats.totalProductos}</span>
                <span class="stat-label">Total Productos</span>
              </div>
            </div>
            
            <div class="stat-card">
              <span class="stat-icon">✅</span>
              <div>
                <span class="stat-numero">${stats.productosActivos}</span>
                <span class="stat-label">Activos</span>
              </div>
            </div>
            
            <div class="stat-card alert">
              <span class="stat-icon">⚠️</span>
              <div>
                <span class="stat-numero">${stats.productosStockBajo}</span>
                <span class="stat-label">Stock Bajo</span>
              </div>
            </div>
            
            <div class="stat-card danger">
              <span class="stat-icon">🚫</span>
              <div>
                <span class="stat-numero">${stats.productosAgotados}</span>
                <span class="stat-label">Agotados</span>
              </div>
            </div>
          </div>

          <div class="ingresos-card">
            <h3>💰 Ingresos Totales</h3>
            <div class="monto-grande">$${stats.ingresosTotal.toLocaleString()}</div>
          </div>

          <div class="top-productos">
            <h3>🏆 Top Productos</h3>
            ${stats.topProductos.map((p, i) => `
              <div class="top-producto-item">
                <span class="ranking">#${i + 1}</span>
                <div class="info">
                  <span class="nombre">${p.nombre}</span>
                  <span class="detalle">${p.vendidos} vendidos - $${p.ingresos}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      container.innerHTML = html;
    });
  }

  setupEventListeners() {
    // Escuchar ventas de productos
    window.addEventListener('productoVendido', async (e) => {
      const { productoId, cantidad, precio } = e.detail;
      await this.procesarVenta(productoId, cantidad, precio);
    });
  }
}

window.inventarioInteligente = new InventarioInteligente();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.inventarioInteligente.init());
} else {
  window.inventarioInteligente.init();
}
