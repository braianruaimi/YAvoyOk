/**
 * 📊 DASHBOARD DE ANALYTICS AVANZADO - YAvoy 2026
 * 
 * Sistema de análisis y visualización de datos
 * - Integración con Chart.js para gráficos
 * - Tracking de ingresos (diario/semanal/mensual)
 * - Análisis de pedidos por hora
 * - Top productos y categorías
 * - Métricas de repartidores
 * - Mapas de calor de zonas
 * - Análisis de tiempos de entrega
 * - Tasa de conversión
 * - Predicciones con ML
 * - Exportación a PDF/CSV
 * 
 * @version 2.0.0
 * @author YAvoy Team
 * @date 2025-12-11
 */

class AnalyticsDashboard {
  constructor() {
    this.charts = new Map();
    this.datosHistoricos = [];
    this.initialized = false;
  }

  async init() {
    console.log('📊 Inicializando Analytics Dashboard...');
    await this.cargarChartJS();
    await this.cargarDatos();
    this.setupEventListeners();
    this.initialized = true;
    console.log('✅ Analytics Dashboard inicializado');
    return true;
  }

  async cargarChartJS() {
    if (window.Chart) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async cargarDatos() {
    try {
      const response = await fetch('/api/analytics/datos-completos');
      this.datosHistoricos = await response.json();
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  async renderizarDashboardCompleto(container, comercioId = null) {
    if (!container) return;

    const datos = await this.obtenerDatosComercio(comercioId);

    let html = `
      <div class="analytics-dashboard">
        <header class="dashboard-header">
          <h1>📊 Analytics Dashboard</h1>
          <div class="header-acciones">
            <select id="rango-fechas" class="select-rango">
              <option value="hoy">Hoy</option>
              <option value="semana" selected>Esta Semana</option>
              <option value="mes">Este Mes</option>
              <option value="ano">Este Año</option>
              <option value="personalizado">Personalizado</option>
            </select>
            <button class="btn-exportar" data-tipo="pdf">📄 PDF</button>
            <button class="btn-exportar" data-tipo="csv">📊 CSV</button>
          </div>
        </header>

        <!-- KPIs Principales -->
        <div class="kpis-grid">
          <div class="kpi-card ingresos">
            <div class="kpi-icono">💰</div>
            <div class="kpi-contenido">
              <span class="kpi-valor">$${datos.ingresosTotales.toLocaleString()}</span>
              <span class="kpi-label">Ingresos Totales</span>
              <span class="kpi-cambio ${datos.cambioIngresos >= 0 ? 'positivo' : 'negativo'}">
                ${datos.cambioIngresos >= 0 ? '↑' : '↓'} ${Math.abs(datos.cambioIngresos)}%
              </span>
            </div>
          </div>

          <div class="kpi-card pedidos">
            <div class="kpi-icono">📦</div>
            <div class="kpi-contenido">
              <span class="kpi-valor">${datos.totalPedidos}</span>
              <span class="kpi-label">Pedidos Totales</span>
              <span class="kpi-cambio ${datos.cambioPedidos >= 0 ? 'positivo' : 'negativo'}">
                ${datos.cambioPedidos >= 0 ? '↑' : '↓'} ${Math.abs(datos.cambioPedidos)}%
              </span>
            </div>
          </div>

          <div class="kpi-card ticket">
            <div class="kpi-icono">🧾</div>
            <div class="kpi-contenido">
              <span class="kpi-valor">$${datos.ticketPromedio}</span>
              <span class="kpi-label">Ticket Promedio</span>
              <span class="kpi-cambio ${datos.cambioTicket >= 0 ? 'positivo' : 'negativo'}">
                ${datos.cambioTicket >= 0 ? '↑' : '↓'} ${Math.abs(datos.cambioTicket)}%
              </span>
            </div>
          </div>

          <div class="kpi-card conversion">
            <div class="kpi-icono">🎯</div>
            <div class="kpi-contenido">
              <span class="kpi-valor">${datos.tasaConversion}%</span>
              <span class="kpi-label">Tasa de Conversión</span>
              <span class="kpi-cambio ${datos.cambioConversion >= 0 ? 'positivo' : 'negativo'}">
                ${datos.cambioConversion >= 0 ? '↑' : '↓'} ${Math.abs(datos.cambioConversion)}%
              </span>
            </div>
          </div>
        </div>

        <!-- Gráficos Principales -->
        <div class="graficos-principales">
          <div class="grafico-card grande">
            <h3>📈 Ingresos y Pedidos</h3>
            <canvas id="chartIngresosPedidos"></canvas>
          </div>

          <div class="grafico-card">
            <h3>🕐 Pedidos por Hora</h3>
            <canvas id="chartPedidosHora"></canvas>
          </div>

          <div class="grafico-card">
            <h3>📊 Categorías Más Vendidas</h3>
            <canvas id="chartCategorias"></canvas>
          </div>
        </div>

        <!-- Fila 2: Análisis Detallados -->
        <div class="analisis-detallados">
          <div class="grafico-card">
            <h3>⏱️ Tiempo de Entrega Promedio</h3>
            <canvas id="chartTiemposEntrega"></canvas>
          </div>

          <div class="grafico-card">
            <h3>🗓️ Pedidos por Día de la Semana</h3>
            <canvas id="chartPedidosDia"></canvas>
          </div>

          <div class="grafico-card">
            <h3>🚴 Top Repartidores</h3>
            <canvas id="chartRepartidores"></canvas>
          </div>
        </div>

        <!-- Tablas de Datos -->
        <div class="tablas-datos">
          <div class="tabla-card">
            <h3>🏆 Top 10 Productos</h3>
            <div id="tablaTopProductos"></div>
          </div>

          <div class="tabla-card">
            <h3>🏪 Top Comercios</h3>
            <div id="tablaTopComercios"></div>
          </div>
        </div>

        <!-- Predicciones ML -->
        <div class="predicciones-ml">
          <h2>🔮 Predicciones Inteligentes</h2>
          <div class="predicciones-grid">
            <div class="prediccion-card">
              <h4>📊 Ingresos Próxima Semana</h4>
              <span class="prediccion-valor">$${datos.predicciones.ingresosSemana.toLocaleString()}</span>
              <span class="prediccion-confianza">Confianza: ${datos.predicciones.confianza}%</span>
            </div>

            <div class="prediccion-card">
              <h4>📦 Pedidos Esperados (7 días)</h4>
              <span class="prediccion-valor">${datos.predicciones.pedidosSemana}</span>
              <span class="prediccion-confianza">Basado en tendencia histórica</span>
            </div>

            <div class="prediccion-card">
              <h4>🕐 Hora Pico Hoy</h4>
              <span class="prediccion-valor">${datos.predicciones.horaPico}</span>
              <span class="prediccion-confianza">Prepara tus recursos</span>
            </div>

            <div class="prediccion-card">
              <h4>📈 Crecimiento Mensual</h4>
              <span class="prediccion-valor">${datos.predicciones.crecimiento >= 0 ? '+' : ''}${datos.predicciones.crecimiento}%</span>
              <span class="prediccion-confianza">Comparado con mes anterior</span>
            </div>
          </div>
        </div>

        <!-- Mapa de Calor de Zonas -->
        <div class="mapa-calor-card">
          <h3>🗺️ Zonas de Mayor Demanda</h3>
          <div id="mapaCalorZonas"></div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Renderizar todos los gráficos
    await this.renderizarGraficos(datos);
  }

  async renderizarGraficos(datos) {
    // 1. Gráfico de Ingresos y Pedidos (Línea combinada)
    this.crearGraficoIngresosPedidos(datos.serieIngresos, datos.seriePedidos);

    // 2. Pedidos por Hora (Barra)
    this.crearGraficoPedidosHora(datos.pedidosPorHora);

    // 3. Categorías (Doughnut)
    this.crearGraficoCategorias(datos.categorias);

    // 4. Tiempos de Entrega (Barra horizontal)
    this.crearGraficoTiemposEntrega(datos.tiemposEntrega);

    // 5. Pedidos por Día (Polar Area)
    this.crearGraficoPedidosDia(datos.pedidosPorDia);

    // 6. Top Repartidores (Barra)
    this.crearGraficoRepartidores(datos.topRepartidores);

    // 7. Tablas
    this.renderizarTablaTopProductos(datos.topProductos);
    this.renderizarTablaTopComercios(datos.topComercios);

    // 8. Mapa de Calor
    this.renderizarMapaCalor(datos.zonasDemanda);
  }

  crearGraficoIngresosPedidos(serieIngresos, seriePedidos) {
    const ctx = document.getElementById('chartIngresosPedidos');
    if (!ctx) return;

    if (this.charts.has('ingresosPedidos')) {
      this.charts.get('ingresosPedidos').destroy();
    }

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: serieIngresos.map(d => d.fecha),
        datasets: [{
          label: 'Ingresos ($)',
          data: serieIngresos.map(d => d.valor),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          yAxisID: 'y',
          tension: 0.4
        }, {
          label: 'Pedidos',
          data: seriePedidos.map(d => d.valor),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          yAxisID: 'y1',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Ingresos ($)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Pedidos' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });

    this.charts.set('ingresosPedidos', chart);
  }

  crearGraficoPedidosHora(datos) {
    const ctx = document.getElementById('chartPedidosHora');
    if (!ctx) return;

    if (this.charts.has('pedidosHora')) {
      this.charts.get('pedidosHora').destroy();
    }

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datos.map(d => `${d.hora}:00`),
        datasets: [{
          label: 'Pedidos',
          data: datos.map(d => d.cantidad),
          backgroundColor: '#8b5cf6',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });

    this.charts.set('pedidosHora', chart);
  }

  crearGraficoCategorias(datos) {
    const ctx = document.getElementById('chartCategorias');
    if (!ctx) return;

    if (this.charts.has('categorias')) {
      this.charts.get('categorias').destroy();
    }

    const colores = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: datos.map(d => d.nombre),
        datasets: [{
          data: datos.map(d => d.ventas),
          backgroundColor: colores.slice(0, datos.length),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    this.charts.set('categorias', chart);
  }

  crearGraficoTiemposEntrega(datos) {
    const ctx = document.getElementById('chartTiemposEntrega');
    if (!ctx) return;

    if (this.charts.has('tiemposEntrega')) {
      this.charts.get('tiemposEntrega').destroy();
    }

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datos.map(d => d.rango),
        datasets: [{
          label: 'Cantidad de Entregas',
          data: datos.map(d => d.cantidad),
          backgroundColor: '#10b981',
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true
      }
    });

    this.charts.set('tiemposEntrega', chart);
  }

  crearGraficoPedidosDia(datos) {
    const ctx = document.getElementById('chartPedidosDia');
    if (!ctx) return;

    if (this.charts.has('pedidosDia')) {
      this.charts.get('pedidosDia').destroy();
    }

    const chart = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        datasets: [{
          data: datos,
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 159, 64, 0.5)',
            'rgba(255, 99, 255, 0.5)'
          ]
        }]
      },
      options: {
        responsive: true
      }
    });

    this.charts.set('pedidosDia', chart);
  }

  crearGraficoRepartidores(datos) {
    const ctx = document.getElementById('chartRepartidores');
    if (!ctx) return;

    if (this.charts.has('repartidores')) {
      this.charts.get('repartidores').destroy();
    }

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datos.map(d => d.nombre),
        datasets: [{
          label: 'Entregas',
          data: datos.map(d => d.entregas),
          backgroundColor: '#3b82f6',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });

    this.charts.set('repartidores', chart);
  }

  renderizarTablaTopProductos(productos) {
    const container = document.getElementById('tablaTopProductos');
    if (!container) return;

    let html = `
      <table class="tabla-analytics">
        <thead>
          <tr>
            <th>#</th>
            <th>Producto</th>
            <th>Vendidos</th>
            <th>Ingresos</th>
          </tr>
        </thead>
        <tbody>
          ${productos.map((p, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${p.nombre}</td>
              <td>${p.vendidos}</td>
              <td>$${p.ingresos.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  }

  renderizarTablaTopComercios(comercios) {
    const container = document.getElementById('tablaTopComercios');
    if (!container) return;

    let html = `
      <table class="tabla-analytics">
        <thead>
          <tr>
            <th>#</th>
            <th>Comercio</th>
            <th>Pedidos</th>
            <th>Ingresos</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          ${comercios.map((c, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${c.nombre}</td>
              <td>${c.pedidos}</td>
              <td>$${c.ingresos.toLocaleString()}</td>
              <td>⭐ ${c.rating}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  }

  renderizarMapaCalor(zonas) {
    const container = document.getElementById('mapaCalorZonas');
    if (!container) return;

    const maxDemanda = Math.max(...zonas.map(z => z.demanda));

    let html = `
      <div class="mapa-calor-grid">
        ${zonas.map(zona => {
          const intensidad = (zona.demanda / maxDemanda) * 100;
          return `
            <div class="zona-item" style="opacity: ${intensidad / 100}">
              <span class="zona-nombre">${zona.nombre}</span>
              <span class="zona-demanda">${zona.demanda} pedidos</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  async obtenerDatosComercio(comercioId) {
    const response = await fetch(`/api/analytics/comercio/${comercioId || 'todos'}`);
    return await response.json();
  }

  async predecirIngresos(datosHistoricos) {
    // Regresión lineal simple
    const n = datosHistoricos.length;
    if (n < 2) return 0;

    const sumX = datosHistoricos.reduce((sum, _, i) => sum + i, 0);
    const sumY = datosHistoricos.reduce((sum, d) => sum + d.ingresos, 0);
    const sumXY = datosHistoricos.reduce((sum, d, i) => sum + (i * d.ingresos), 0);
    const sumX2 = datosHistoricos.reduce((sum, _, i) => sum + (i * i), 0);

    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    // Predecir para 7 días adelante
    const prediccion = m * (n + 7) + b;
    return Math.max(0, Math.round(prediccion));
  }

  async exportarPDF() {
    alert('Exportando a PDF... (Funcionalidad en desarrollo)');
    // TODO: Implementar con jsPDF o similar
  }

  async exportarCSV() {
    const datos = await this.obtenerDatosComercio(null);
    
    let csv = 'Fecha,Ingresos,Pedidos,Ticket Promedio\n';
    datos.serieIngresos.forEach((d, i) => {
      csv += `${d.fecha},${d.valor},${datos.seriePedidos[i].valor},${datos.ticketPromedio}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-exportar')) {
        const tipo = e.target.dataset.tipo;
        if (tipo === 'pdf') this.exportarPDF();
        if (tipo === 'csv') this.exportarCSV();
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'rango-fechas') {
        const rango = e.target.value;
        console.log(`Cambio de rango a: ${rango}`);
        // TODO: Recargar datos con nuevo rango
      }
    });
  }
}

window.analyticsDashboard = new AnalyticsDashboard();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.analyticsDashboard.init());
} else {
  window.analyticsDashboard.init();
}
