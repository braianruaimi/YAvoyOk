// ====================================
// 🗄️ YAvoy v3.1 - DATABASE MODULE
// ====================================
// Arquitectura MySQL Empresarial

require('dotenv').config();
const sequelize = require('../config/database');

// ========================================
// CONFIGURACIÓN MYSQL
// ========================================
// Usando Sequelize configurado en ../config/database

// ========================================
// CONEXIÓN INICIAL
// ========================================

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL conectado exitosamente vía Sequelize');
    await createTables();
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error);
    throw error;
  }
}

// ========================================
// CREACIÓN DE TABLAS
// ========================================

async function createTables() {
  const createTableQueries = [
    // Tabla de repartidores
    `CREATE TABLE IF NOT EXISTS repartidores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      apellido VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      telefono VARCHAR(20),
      zona VARCHAR(255),
      vehiculo VARCHAR(100),
      activo BOOLEAN DEFAULT true,
      online BOOLEAN DEFAULT false,
      calificacion DECIMAL(3,2) DEFAULT 5.0,
      fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      documentos JSON DEFAULT '{}',
      ubicacion JSON DEFAULT '{}'
    )`,

    // Tabla de comercios
    `CREATE TABLE IF NOT EXISTS comercios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      direccion TEXT NOT NULL,
      telefono VARCHAR(20),
      email VARCHAR(255),
      categoria VARCHAR(100),
      horarios JSON DEFAULT '{}',
      activo BOOLEAN DEFAULT true,
      calificacion DECIMAL(3,2) DEFAULT 5.0,
      fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      configuracion JSON DEFAULT '{}'
    )`,

    // Tabla de pedidos
    `CREATE TABLE IF NOT EXISTS pedidos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      comercio_id INTEGER,
      repartidor_id INTEGER,
      cliente_nombre VARCHAR(255),
      cliente_telefono VARCHAR(20),
      direccion_entrega TEXT,
      productos JSON NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      estado VARCHAR(50) DEFAULT 'pendiente',
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_entrega TIMESTAMP,
      metodo_pago VARCHAR(50),
      comentarios TEXT,
      ubicacion_gps JSON DEFAULT '{}',
      FOREIGN KEY (comercio_id) REFERENCES comercios(id),
      FOREIGN KEY (repartidor_id) REFERENCES repartidores(id)
    )`,

    // Tabla de calificaciones
    `CREATE TABLE IF NOT EXISTS calificaciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pedido_id INTEGER,
      tipo VARCHAR(50) NOT NULL, -- 'repartidor', 'comercio'
      entidad_id INTEGER NOT NULL,
      calificacion INTEGER,
      comentario TEXT,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )`,

    // Tabla de chat/mensajes
    `CREATE TABLE IF NOT EXISTS mensajes_chat (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pedido_id INTEGER,
      usuario_tipo VARCHAR(50) NOT NULL, -- 'cliente', 'repartidor', 'comercio'
      usuario_id VARCHAR(255),
      mensaje TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )`,

    // Tabla de propinas
    `CREATE TABLE IF NOT EXISTS propinas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pedido_id INTEGER,
      repartidor_id INTEGER,
      monto DECIMAL(10,2) NOT NULL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
      FOREIGN KEY (repartidor_id) REFERENCES repartidores(id)
    )`
  ];

  for (const query of createTableQueries) {
    try {
      await sequelize.query(query);
    } catch (error) {
      console.error('Error creando tabla:', error);
    }
  }

  // Crear índices para optimizar consultas
  const indices = [
    'CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado)',
    'CREATE INDEX IF NOT EXISTS idx_pedidos_comercio ON pedidos(comercio_id)',
    'CREATE INDEX IF NOT EXISTS idx_pedidos_repartidor ON pedidos(repartidor_id)',
    'CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_creacion)',
    'CREATE INDEX IF NOT EXISTS idx_repartidores_activo ON repartidores(activo, online)',
    'CREATE INDEX IF NOT EXISTS idx_mensajes_pedido ON mensajes_chat(pedido_id)'
  ];

  for (const index of indices) {
    try {
      await sequelize.query(index);
    } catch (error) {
      // Los índices pueden fallar si ya existen, es normal
    }
  }

  console.log('✅ Tablas MySQL creadas/verificadas');
}

// ========================================
// FUNCIONES DE CONSULTA
// ========================================

async function query(text, params = []) {
  const start = Date.now();
  try {
    const [results, metadata] = await sequelize.query(text, { replacements: params, type: sequelize.QueryTypes.SELECT });
    const duration = Date.now() - start;
    console.log('Query ejecutado:', { text, duration, rows: results.length });
    return { rows: results, rowCount: results.length };
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
}

async function getClient() {
  return sequelize;
}

function close() {
  return sequelize.close();
}

// ========================================
// FUNCIONES ESPECÍFICAS DE NEGOCIO
// ========================================

// Funciones de pedidos
async function getPedidos(filtros = {}) {
  let queryText = 'SELECT * FROM pedidos WHERE 1=1';
  const params = [];
  let paramCount = 1;

  if (filtros.estado) {
    queryText += ` AND estado = $${paramCount}`;
    params.push(filtros.estado);
    paramCount++;
  }

  if (filtros.comercio_id) {
    queryText += ` AND comercio_id = $${paramCount}`;
    params.push(filtros.comercio_id);
    paramCount++;
  }

  if (filtros.repartidor_id) {
    queryText += ` AND repartidor_id = $${paramCount}`;
    params.push(filtros.repartidor_id);
    paramCount++;
  }

  queryText += ' ORDER BY fecha_creacion DESC';
  
  if (filtros.limite) {
    queryText += ` LIMIT $${paramCount}`;
    params.push(filtros.limite);
  }

  const result = await query(queryText, params);
  return result.rows;
}

async function createPedido(pedidoData) {
  const queryText = `
    INSERT INTO pedidos (comercio_id, cliente_nombre, cliente_telefono, 
                        direccion_entrega, productos, total, metodo_pago, comentarios)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const params = [
    pedidoData.comercio_id,
    pedidoData.cliente_nombre,
    pedidoData.cliente_telefono,
    pedidoData.direccion_entrega,
    JSON.stringify(pedidoData.productos),
    pedidoData.total,
    pedidoData.metodo_pago || 'efectivo',
    pedidoData.comentarios || ''
  ];

  const result = await query(queryText, params);
  return result.rows[0];
}

async function updatePedidoEstado(pedidoId, nuevoEstado, repartidorId = null) {
  let queryText = 'UPDATE pedidos SET estado = $1';
  const params = [nuevoEstado];
  let paramCount = 2;

  if (repartidorId) {
    queryText += `, repartidor_id = $${paramCount}`;
    params.push(repartidorId);
    paramCount++;
  }

  if (nuevoEstado === 'entregado') {
    queryText += `, fecha_entrega = CURRENT_TIMESTAMP`;
  }

  queryText += ` WHERE id = $${paramCount} RETURNING *`;
  params.push(pedidoId);

  const result = await query(queryText, params);
  return result.rows[0];
}

// Funciones de repartidores
async function getRepartidores(activos = null) {
  let queryText = 'SELECT * FROM repartidores WHERE 1=1';
  const params = [];

  if (activos !== null) {
    queryText += ' AND activo = $1';
    params.push(activos);
  }

  queryText += ' ORDER BY calificacion DESC';

  const result = await query(queryText, params);
  return result.rows;
}

async function updateRepartidorEstado(repartidorId, online) {
  const queryText = 'UPDATE repartidores SET online = $1 WHERE id = $2 RETURNING *';
  const result = await query(queryText, [online, repartidorId]);
  return result.rows[0];
}

// Funciones de comercios
async function getComercios(activos = null) {
  let queryText = 'SELECT * FROM comercios WHERE 1=1';
  const params = [];

  if (activos !== null) {
    queryText += ' AND activo = $1';
    params.push(activos);
  }

  queryText += ' ORDER BY nombre';

  const result = await query(queryText, params);
  return result.rows;
}

// ========================================
// EXPORTACIÓN
// ========================================

module.exports = {
  initializeDatabase,
  query,
  getClient,
  close,
  sequelize,
  
  // Funciones específicas
  getPedidos,
  createPedido,
  updatePedidoEstado,
  getRepartidores,
  updateRepartidorEstado,
  getComercios
};