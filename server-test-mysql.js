/**
 * ====================================
 * YAVOY v3.1 - SERVIDOR DE PRUEBA MYSQL
 * ====================================
 * Versión simplificada para probar conexión MySQL
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuración de MySQL para Hostinger VPS
const dbConfig = {
  host: process.env.DB_HOST || 'srv1722.hstgr.io',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'u695828542_yavoyen5',
  password: process.env.DB_PASSWORD || 'Braiancesar25!',
  database: process.env.DB_NAME || 'u695828542_yavoy_web',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4'
};

console.log('🔍 Probando conexión a MySQL Hostinger...');
console.log('📍 Host:', dbConfig.host);
console.log('🗂️  Base de datos:', dbConfig.database);
console.log('👤 Usuario:', dbConfig.user);

async function testConnection() {
  let connection;
  
  try {
    // Intentar conectar
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa a MySQL Hostinger!');
    
    // Probar consulta simple
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log('📊 Versión de MySQL:', rows[0].version);
    
    // Listar tablas existentes
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tablas existentes:', tables.length);
    tables.forEach(table => {
      console.log('  -', Object.values(table)[0]);
    });
    
    // Probar crear tabla de usuarios si no existe
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id VARCHAR(50) PRIMARY KEY,
        tipo ENUM('COMERCIO', 'REPARTIDOR', 'CLIENTE') NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        telefono VARCHAR(50),
        direccion TEXT,
        verificado BOOLEAN DEFAULT FALSE,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultima_conexion TIMESTAMP NULL,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_tipo (tipo),
        INDEX idx_activo (activo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.execute(createTableSQL);
    console.log('✅ Tabla usuarios verificada/creada');
    
    // Probar crear tabla de pedidos si no existe
    const createPedidosSQL = `
      CREATE TABLE IF NOT EXISTS pedidos (
        id VARCHAR(50) PRIMARY KEY,
        cliente_id VARCHAR(50) NOT NULL,
        comercio_id VARCHAR(50) NOT NULL,
        repartidor_id VARCHAR(50) NULL,
        estado ENUM('PENDIENTE', 'ACEPTADO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO') DEFAULT 'PENDIENTE',
        productos JSON NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        costo_envio DECIMAL(10,2) DEFAULT 0.00,
        direccion_entrega TEXT NOT NULL,
        coordenadas_cliente VARCHAR(100) NULL,
        coordenadas_repartidor VARCHAR(100) NULL,
        fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_aceptado TIMESTAMP NULL,
        fecha_entrega TIMESTAMP NULL,
        metodo_pago VARCHAR(50) DEFAULT 'mercadopago',
        estado_pago ENUM('PENDIENTE', 'PAGADO', 'FALLIDO') DEFAULT 'PENDIENTE',
        notas_cliente TEXT NULL,
        calificacion_cliente INT NULL,
        calificacion_repartidor INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cliente (cliente_id),
        INDEX idx_comercio (comercio_id),
        INDEX idx_repartidor (repartidor_id),
        INDEX idx_estado (estado),
        INDEX idx_fecha_pedido (fecha_pedido)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.execute(createPedidosSQL);
    console.log('✅ Tabla pedidos verificada/creada');
    
    // Probar inserción de prueba
    const testUser = {
      id: 'TEST-' + Date.now(),
      tipo: 'CLIENTE',
      email: 'test@yavoy.com',
      password: 'hashed_password_123',
      nombre: 'Usuario Test',
      telefono: '123456789',
      direccion: 'Dirección de prueba'
    };
    
    const [insertResult] = await connection.execute(
      'INSERT INTO usuarios (id, tipo, email, password, nombre, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [testUser.id, testUser.tipo, testUser.email, testUser.password, testUser.nombre, testUser.telefono, testUser.direccion]
    );
    
    console.log('✅ Usuario de prueba insertado, ID:', testUser.id);
    
    // Consultar el usuario insertado
    const [users] = await connection.execute('SELECT * FROM usuarios WHERE id = ?', [testUser.id]);
    console.log('👤 Usuario recuperado:', users[0].nombre, '-', users[0].email);
    
    // Eliminar usuario de prueba
    await connection.execute('DELETE FROM usuarios WHERE id = ?', [testUser.id]);
    console.log('🗑️  Usuario de prueba eliminado');
    
    console.log('\n🎉 ¡Todas las pruebas de MySQL funcionaron correctamente!');
    console.log('🚀 El sistema está listo para usar MySQL en producción');
    
  } catch (error) {
    console.error('❌ Error en la prueba de MySQL:', error.message);
    console.error('📋 Detalles del error:', error);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Error de acceso: Verifica el usuario y contraseña');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 La base de datos no existe: Verifica el nombre de la BD');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Conexión rechazada: Verifica el host y puerto');
    }
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar prueba
testConnection().then(() => {
  console.log('\n✨ Prueba completada');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
