// ====================================
// 🗄️ YAvoy v3.1 - DATABASE MODULE
// ====================================
// Arquitectura PostgreSQL Empresarial

require('dotenv').config();
const { Pool } = require('pg');

// ========================================
// CONFIGURACIÓN POSTGRESQL
// ========================================

const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'yavoy_prod',
  user: process.env.DB_USER || 'yavoy_user',
  password: process.env.DB_PASSWORD || '',
  max: 20, // conexiones máximas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ========================================
// CONEXIÓN INICIAL
// ========================================

async function initializeDatabase() {
  try {
    await pgPool.query('SELECT NOW()');
    console.log('✅ PostgreSQL conectado exitosamente');
    await createTables();
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error);
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
      id SERIAL PRIMARY KEY,
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
      documentos JSONB DEFAULT '{}',
      ubicacion JSONB DEFAULT '{}'
    )`,

    // Tabla de comercios
    `CREATE TABLE IF NOT EXISTS comercios (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      direccion TEXT NOT NULL,
      telefono VARCHAR(20),
      email VARCHAR(255),
      categoria VARCHAR(100),
      horarios JSONB DEFAULT '{}',
      activo BOOLEAN DEFAULT true,
      calificacion DECIMAL(3,2) DEFAULT 5.0,
      fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      configuracion JSONB DEFAULT '{}'
    )`,

    // Tabla de pedidos
    `CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      comercio_id INTEGER REFERENCES comercios(id),
      repartidor_id INTEGER REFERENCES repartidores(id),
      cliente_nombre VARCHAR(255),
      cliente_telefono VARCHAR(20),
      direccion_entrega TEXT,
      productos JSONB NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      estado VARCHAR(50) DEFAULT 'pendiente',
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_entrega TIMESTAMP,
      metodo_pago VARCHAR(50),
      comentarios TEXT,
      ubicacion_gps JSONB DEFAULT '{}'
    )`,

    // Tabla de calificaciones
    `CREATE TABLE IF NOT EXISTS calificaciones (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER REFERENCES pedidos(id),
      tipo VARCHAR(50) NOT NULL, -- 'repartidor', 'comercio'
      entidad_id INTEGER NOT NULL,
      calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
      comentario TEXT,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Tabla de chat/mensajes
    `CREATE TABLE IF NOT EXISTS mensajes_chat (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER REFERENCES pedidos(id),
      usuario_tipo VARCHAR(50) NOT NULL, -- 'cliente', 'repartidor', 'comercio'
      usuario_id VARCHAR(255),
      mensaje TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Tabla de propinas
    `CREATE TABLE IF NOT EXISTS propinas (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER REFERENCES pedidos(id),
      repartidor_id INTEGER REFERENCES repartidores(id),
      monto DECIMAL(10,2) NOT NULL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const query of createTableQueries) {
    try {
      await pgPool.query(query);
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
      await pgPool.query(index);
    } catch (error) {
      // Los índices pueden fallar si ya existen, es normal
    }
  }

  console.log('✅ Tablas PostgreSQL creadas/verificadas');
}

// ========================================
// FUNCIONES DE CONSULTA
// ========================================

async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pgPool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutado:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
}

async function getClient() {
  return await pgPool.connect();
}

function close() {
  return pgPool.end();
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
  pgPool,
  
  // Funciones específicas
  getPedidos,
  createPedido,
  updatePedidoEstado,
  getRepartidores,
  updateRepartidorEstado,
  getComercios
};