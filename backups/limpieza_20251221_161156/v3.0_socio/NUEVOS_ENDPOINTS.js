// =============================================================================
// ENDPOINTS PARA LAS 6 NUEVAS FEATURES
// Agregar estos endpoints al server.js después de la sección de calificaciones
// =============================================================================

// =============================================================================
// 💵 SISTEMA DE PROPINAS
// =============================================================================
let propinas = [];

app.get('/api/propinas', (req, res) => {
  res.json(propinas);
});

app.post('/api/propinas', async (req, res) => {
  try {
    const propina = req.body;
    propinas.push(propina);
    res.json({ success: true, propina });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/propinas/top-repartidores', (req, res) => {
  const limite = parseInt(req.query.limite) || 10;
  const stats = {};
  
  propinas.filter(p => p.estado === 'pagada').forEach(p => {
    if (!stats[p.repartidorId]) {
      stats[p.repartidorId] = { total: 0, cantidad: 0 };
    }
    stats[p.repartidorId].total += p.monto;
    stats[p.repartidorId].cantidad++;
  });
  
  const top = Object.entries(stats)
    .map(([id, data]) => ({ repartidorId: id, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limite);
  
  res.json(top);
});

// =============================================================================
// 👥 PEDIDOS GRUPALES
// =============================================================================
let pedidosGrupales = [];

app.get('/api/pedidos-grupales', (req, res) => {
  res.json(pedidosGrupales);
});

app.post('/api/pedidos-grupales', async (req, res) => {
  try {
    const pedidoGrupal = req.body;
    pedidosGrupales.push(pedidoGrupal);
    res.json({ success: true, pedidoGrupal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/pedidos-grupales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const index = pedidosGrupales.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'No encontrado' });
    
    pedidosGrupales[index] = req.body;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// 🎁 SISTEMA DE REFERIDOS
// =============================================================================
let referidos = [];
let codigosReferidos = new Map();

app.get('/api/referidos', (req, res) => {
  res.json(referidos);
});

app.post('/api/referidos', async (req, res) => {
  try {
    const referido = req.body;
    referidos.push(referido);
    res.json({ success: true, referido });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/referidos/codigo/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;
  const codigo = codigosReferidos.get(usuarioId);
  res.json({ codigo: codigo || null });
});

app.post('/api/referidos/codigo', (req, res) => {
  const { usuarioId, codigo } = req.body;
  codigosReferidos.set(usuarioId, codigo);
  res.json({ success: true });
});

app.get('/api/referidos/validar-codigo/:codigo', (req, res) => {
  const { codigo } = req.params;
  for (const [usuarioId, cod] of codigosReferidos) {
    if (cod === codigo) {
      return res.json({ valido: true, usuarioId });
    }
  }
  res.json({ valido: false });
});

app.put('/api/referidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const index = referidos.findIndex(r => r.id === id);
    if (index === -1) return res.status(404).json({ error: 'No encontrado' });
    
    referidos[index] = req.body;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/usuarios/:id/credito', (req, res) => {
  res.json({ success: true });
});

// =============================================================================
// 🔔 NOTIFICACIONES IA
// =============================================================================
let perfilesIA = [];

app.get('/api/notificaciones-ia/perfiles', (req, res) => {
  res.json(perfilesIA);
});

app.put('/api/notificaciones-ia/perfiles/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const index = perfilesIA.findIndex(p => p.usuarioId === usuarioId);
    
    if (index === -1) {
      perfilesIA.push(req.body);
    } else {
      perfilesIA[index] = req.body;
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notificaciones-ia/envios', (req, res) => {
  res.json({ success: true });
});

app.get('/api/pedidos/historial/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;
  const historial = pedidos.filter(p => p.clienteId === usuarioId);
  res.json(historial);
});

app.get('/api/categorias', (req, res) => {
  const categorias = ['Pizza', 'Hamburguesas', 'Sushi', 'Empanadas', 'Asado', 'Pasta', 'Ensaladas'];
  res.json(categorias);
});

// =============================================================================
// 📦 INVENTARIO INTELIGENTE
// =============================================================================
let inventario = [];
let movimientos = [];
let alertasInventario = [];

app.get('/api/inventario', (req, res) => {
  res.json(inventario);
});

app.post('/api/inventario', async (req, res) => {
  try {
    const producto = req.body;
    inventario.push(producto);
    res.json({ success: true, producto });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/inventario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const index = inventario.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'No encontrado' });
    
    inventario[index] = req.body;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/inventario/movimientos', (req, res) => {
  movimientos.push(req.body);
  res.json({ success: true });
});

app.post('/api/inventario/alertas', (req, res) => {
  alertasInventario.push(req.body);
  res.json({ success: true });
});

// =============================================================================
// 📊 ANALYTICS DASHBOARD
// =============================================================================

app.get('/api/analytics/datos-completos', async (req, res) => {
  try {
    const datos = {
      ingresosTotales: 125000,
      cambioIngresos: 15,
      totalPedidos: 450,
      cambioPedidos: 8,
      ticketPromedio: 278,
      cambioTicket: 5,
      tasaConversion: 72,
      cambioConversion: 3,
      serieIngresos: Array.from({ length: 7 }, (_, i) => ({
        fecha: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        valor: Math.floor(Math.random() * 20000) + 15000
      })),
      seriePedidos: Array.from({ length: 7 }, (_, i) => ({
        fecha: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        valor: Math.floor(Math.random() * 80) + 40
      })),
      pedidosPorHora: Array.from({ length: 24 }, (_, i) => ({
        hora: i,
        cantidad: Math.floor(Math.random() * 30)
      })),
      categorias: [
        { nombre: 'Pizza', ventas: 180 },
        { nombre: 'Hamburguesas', ventas: 150 },
        { nombre: 'Sushi', ventas: 120 },
        { nombre: 'Empanadas', ventas: 100 },
        { nombre: 'Asado', ventas: 80 }
      ],
      tiemposEntrega: [
        { rango: '< 15 min', cantidad: 120 },
        { rango: '15-30 min', cantidad: 250 },
        { rango: '30-45 min', cantidad: 80 },
        { rango: '> 45 min', cantidad: 30 }
      ],
      pedidosPorDia: [45, 65, 70, 85, 90, 120, 55],
      topRepartidores: [
        { nombre: 'Juan Pérez', entregas: 85 },
        { nombre: 'María González', entregas: 78 },
        { nombre: 'Carlos Rodríguez', entregas: 72 }
      ],
      topProductos: Array.from({ length: 10 }, (_, i) => ({
        nombre: `Producto ${i + 1}`,
        vendidos: Math.floor(Math.random() * 100) + 50,
        ingresos: Math.floor(Math.random() * 50000) + 10000
      })),
      topComercios: [
        { nombre: 'Comercio A', pedidos: 120, ingresos: 45000, rating: 4.8 },
        { nombre: 'Comercio B', pedidos: 110, ingresos: 42000, rating: 4.7 },
        { nombre: 'Comercio C', pedidos: 100, ingresos: 38000, rating: 4.6 }
      ],
      zonasDemanda: [
        { nombre: 'Zona Norte', demanda: 150 },
        { nombre: 'Zona Sur', demanda: 120 },
        { nombre: 'Zona Este', demanda: 100 },
        { nombre: 'Zona Oeste', demanda: 80 }
      ],
      predicciones: {
        ingresosSemana: 135000,
        pedidosSemana: 480,
        horaPico: '20:00 - 21:00',
        confianza: 85,
        crecimiento: 8
      }
    };
    
    res.json(datos);
  } catch (error) {
    console.error('Error generando datos analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/comercio/:id', async (req, res) => {
  res.redirect('/api/analytics/datos-completos');
});
