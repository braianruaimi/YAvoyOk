// ========================================
// CONTROLADOR CEO - YAvoy v3.1
// ========================================
// Lógica de administración central, panel de control y métricas generales

const fs = require('fs').promises;
const path = require('path');

// Constantes
const BASE_DIR = path.join(__dirname, '../../registros');

// Importar funciones de autenticación CEO
const { loginCEO, validarCEO } = require('../middleware/auth');

// ============================================
// FUNCIONES EXPORTADAS (CONTROLLERS)
// ============================================

/**
 * Login CEO
 * POST /api/ceo/login
 */
exports.loginCEO = (req, res) => {
  const { usuario, password } = req.body;
  
  if (!usuario || !password) {
    return res.status(400).json({
      success: false,
      error: 'Usuario y contraseña son requeridos'
    });
  }
  
  const result = loginCEO(usuario, password);
  
  if (!result.success) {
    console.log(`⚠️ Intento de login CEO fallido: ${usuario}`);
    return res.status(401).json(result);
  }
  
  console.log(`✅ Login CEO exitoso: ${result.ceo.nombre}`);
  res.json(result);
};

/**
 * Verificar sesión CEO
 * GET /api/ceo/verificar
 * Requiere: requireCEO middleware
 */
exports.verificarSesion = (req, res) => {
  res.json({
    success: true,
    ceo: req.ceo,
    message: 'Sesión CEO válida'
  });
};

/**
 * Dashboard CEO - Métricas generales
 * GET /api/ceo/dashboard
 * Requiere: requireCEO middleware
 */
exports.getDashboard = async (req, res) => {
  try {
    // Cargar datos de todos los archivos
    const comerciosPath = path.join(BASE_DIR, 'comercios.json');
    const repartidoresPath = path.join(BASE_DIR, 'repartidores.json');
    const pedidosPath = path.join(BASE_DIR, 'pedidos.json');
    
    let comercios = [], repartidores = [], pedidosData = [];
    
    try {
      const comerciosData = await fs.readFile(comerciosPath, 'utf-8');
      comercios = JSON.parse(comerciosData);
    } catch (e) { 
      comercios = []; 
    }
    
    try {
      const repartidoresData = await fs.readFile(repartidoresPath, 'utf-8');
      repartidores = JSON.parse(repartidoresData);
    } catch (e) { 
      repartidores = []; 
    }
    
    try {
      const pedidosRaw = await fs.readFile(pedidosPath, 'utf-8');
      pedidosData = JSON.parse(pedidosRaw);
    } catch (e) { 
      pedidosData = []; 
    }
    
    // Calcular métricas
    const pedidosEntregados = pedidosData.filter(p => p.estado === 'entregado');
    const recaudacionTotal = pedidosEntregados.reduce((sum, p) => sum + (p.total || 0), 0);
    
    res.json({
      success: true,
      ceo: req.ceo.nombre,
      stats: {
        totalComercios: comercios.length,
        totalRepartidores: repartidores.length,
        totalPedidos: pedidosData.length,
        pedidosEntregados: pedidosEntregados.length,
        pedidosPendientes: pedidosData.filter(p => p.estado === 'pendiente').length,
        pedidosEnCamino: pedidosData.filter(p => p.estado === 'en-camino').length,
        recaudacionTotal: recaudacionTotal,
        comisionYAvoy: recaudacionTotal * 0.15 // 15% comisión
      },
      comercios: comercios.slice(0, 10), // Top 10
      repartidores: repartidores.slice(0, 10), // Top 10
      ultimosPedidos: pedidosData.slice(-20).reverse() // Últimos 20
    });
  } catch (error) {
    console.error('[CEO Dashboard] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * Obtener informes CEO de todos los repartidores
 * GET /api/ceo/repartidores
 */
exports.getInformesRepartidores = async (req, res) => {
  try {
    const informesDir = path.join(BASE_DIR, 'informes-ceo', 'repartidores');
    const archivos = await fs.readdir(informesDir);
    const informes = [];
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const contenido = await fs.readFile(path.join(informesDir, archivo), 'utf-8');
        informes.push(JSON.parse(contenido));
      }
    }
    
    // Calcular totales
    const totales = {
      totalRepartidores: informes.length,
      repartidoresActivos: informes.filter(i => i.estadisticas.disponible).length,
      saldoTotalGeneral: informes.reduce((sum, i) => sum + i.estadisticas.saldoTotal, 0),
      pedidosCompletadosTotal: informes.reduce((sum, i) => sum + i.estadisticas.pedidosCompletados, 0)
    };
    
    res.json({ 
      success: true, 
      informes, 
      totales 
    });
  } catch (error) {
    console.error('Error al obtener informes de repartidores:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener informes' 
    });
  }
};

/**
 * Obtener informe CEO de un repartidor específico
 * GET /api/ceo/repartidores/:id
 */
exports.getInformeRepartidor = async (req, res) => {
  try {
    const informesDir = path.join(BASE_DIR, 'informes-ceo', 'repartidores');
    const archivos = await fs.readdir(informesDir);
    
    for (const archivo of archivos) {
      if (archivo.includes(req.params.id)) {
        const contenido = await fs.readFile(path.join(informesDir, archivo), 'utf-8');
        const informe = JSON.parse(contenido);
        return res.json({ 
          success: true, 
          informe 
        });
      }
    }
    
    res.status(404).json({ 
      success: false, 
      error: 'Informe no encontrado' 
    });
  } catch (error) {
    console.error('Error al obtener informe de repartidor:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener informe' 
    });
  }
};

/**
 * Obtener informes CEO de todos los comercios
 * GET /api/ceo/comercios
 */
exports.getInformesComercios = async (req, res) => {
  try {
    const informesDir = path.join(BASE_DIR, 'informes-ceo', 'comercios');
    const archivos = await fs.readdir(informesDir);
    const informes = [];
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const contenido = await fs.readFile(path.join(informesDir, archivo), 'utf-8');
        informes.push(JSON.parse(contenido));
      }
    }
    
    // Calcular totales
    const totales = {
      totalComercios: informes.length,
      comerciosActivos: informes.filter(i => i.estadisticas.activo).length,
      ventasTotales: informes.reduce((sum, i) => sum + i.estadisticas.ventasTotal, 0),
      pedidosTotales: informes.reduce((sum, i) => sum + i.estadisticas.pedidosRecibidos, 0)
    };
    
    res.json({ 
      success: true, 
      informes, 
      totales 
    });
  } catch (error) {
    console.error('Error al obtener informes de comercios:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener informes' 
    });
  }
};

/**
 * Obtener informes CEO de todos los clientes
 * GET /api/ceo/clientes
 */
exports.getInformesClientes = async (req, res) => {
  try {
    const informesDir = path.join(BASE_DIR, 'informes-ceo', 'clientes');
    const archivos = await fs.readdir(informesDir);
    const informes = [];
    
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const contenido = await fs.readFile(path.join(informesDir, archivo), 'utf-8');
        informes.push(JSON.parse(contenido));
      }
    }
    
    // Calcular totales
    const totales = {
      totalClientes: informes.length,
      pedidosTotales: informes.reduce((sum, i) => sum + i.totalPedidos, 0),
      ingresosTotales: informes.reduce((sum, i) => sum + i.gastoTotal, 0),
      promedioGastoPorCliente: informes.length > 0 
        ? (informes.reduce((sum, i) => sum + i.gastoTotal, 0) / informes.length).toFixed(2)
        : 0
    };
    
    res.json({ 
      success: true, 
      informes, 
      totales 
    });
  } catch (error) {
    console.error('Error al obtener informes de clientes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener informes' 
    });
  }
};

/**
 * Enviar email de verificación (simulado)
 * POST /api/ceo/enviar-verificacion-email
 */
exports.enviarVerificacionEmail = async (req, res) => {
  const { email, nombre, idRepartidor } = req.body;
  
  try {
    // En producción, aquí se enviaría un email real usando nodemailer o servicio similar
    // Por ahora, simulamos el envío y lo registramos en consola
    
    const linkVerificacion = `http://localhost:${process.env.PORT || 3000}/verificar-email?id=${idRepartidor}&token=${Date.now()}`;
    
    console.log(`\n📧 EMAIL DE VERIFICACIÓN ENVIADO:`);
    console.log(`   Para: ${email}`);
    console.log(`   Nombre: ${nombre}`);
    console.log(`   ID Repartidor: ${idRepartidor}`);
    console.log(`   Link de verificación: ${linkVerificacion}`);
    console.log(`\n   Mensaje:`);
    console.log(`   ¡Hola ${nombre}!`);
    console.log(`   Gracias por registrarte en YaVoy como repartidor.`);
    console.log(`   Tu ID es: ${idRepartidor}`);
    console.log(`   Haz clic en el siguiente enlace para verificar tu email:`);
    console.log(`   ${linkVerificacion}`);
    console.log(`\n`);
    
    res.json({ 
      success: true, 
      message: 'Email de verificación enviado (simulado)',
      // En desarrollo, devolvemos el link para testing
      linkVerificacion: linkVerificacion
    });
  } catch (error) {
    console.error('Error al enviar email de verificación:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al enviar email' 
    });
  }
};
