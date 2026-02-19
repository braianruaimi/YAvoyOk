const mysql = require('mysql2/promise');

/**
 * Pool de conexiones MySQL2/Promise
 * Conecta a Hostinger o base de datos local
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'yavoyok',
  port: process.env.DB_PORT || 3306,
  
  // Opciones del Pool
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10', 10),
  queueLimit: 0,
  
  // Timeout
  connectionTimeout: 10000, // 10 segundos
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  
  // Debug
  debug: process.env.DB_DEBUG === 'true' ? ['ComQueryPacket', 'RowDataPacket'] : false
});

/**
 * Chequeo inicial de conexión
 * Verifica conectividad con MySQL en Hostinger o local
 */
async function checkConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('');
    console.log('✅ ╔════════════════════════════════════════════════════════╗');
    console.log('✅ ║       CONEXIÓN A MYSQL EXITOSA                        ║');
    console.log('✅ ╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Puerto: ${process.env.DB_PORT || 3306}`);
    console.log(`   Base de datos: ${process.env.DB_NAME || 'yavoyok'}`);
    console.log(`   Pool: ${process.env.DB_POOL_LIMIT || '10'} conexiones máximo`);
    console.log('');
    connection.release();
    return true;
  } catch (error) {
    console.error('');
    console.error('❌ ╔════════════════════════════════════════════════════════╗');
    console.error('❌ ║        ERROR CONECTANDO A MYSQL - HOSTINGER           ║');
    console.error('❌ ╚════════════════════════════════════════════════════════╝');
    console.error('');
    
    // Diagnosticar el tipo de error
    switch (error.code) {
      case 'PROTOCOL_CONNECTION_LOST':
        console.error('❌ Tipo: Conexión perdida durante comunicación');
        break;
      case 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR':
        console.error('❌ Tipo: Error fatal - encolamiento bloqueado');
        break;
      case 'PROTOCOL_ENQUEUE_AFTER_QUIT':
        console.error('❌ Tipo: Intento de operación después de quit');
        break;
      case 'PROTOCOL_HANDSHAKE_UNSUPPORTED_AUTH_METHOD':
        console.error('❌ Tipo: Método de autenticación no soportado');
        console.error('   Verifica el método de autenticación en Hostinger');
        break;
      case 'PROTOCOL_HANDSHAKE_TIMEOUT':
        console.error('❌ Tipo: Timeout en handshake (10 segundos)');
        console.error('   Hostinger podría estar lento o inaccesible');
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        console.error('❌ Tipo: ACCESO DENEGADO');
        console.error('   Usuario o contraseña incorrectos');
        console.error(`   Usuario: ${process.env.DB_USER || 'root'}`);
        console.error('   Verificar en panel Hostinger:');
        console.error('   → Hosting > Gestor de contraseñas > MySQL');
        break;
      case 'ER_BAD_DB_ERROR':
        console.error('❌ Tipo: BASE DE DATOS NO EXISTE');
        console.error(`   Base de datos "${process.env.DB_NAME || 'yavoyok'}" no encontrada`);
        console.error('   Crear base de datos en Hostinger:');
        console.error('   → Hosting > MySQL > Nueva base de datos');
        break;
      case 'ENOTFOUND':
        console.error('❌ Tipo: HOST NO ENCONTRADO (DNS)');
        console.error(`   Host: ${process.env.DB_HOST || 'localhost'}`);
        console.error('   Verificar servidor DNS o nombre de host');
        break;
      case 'ECONNREFUSED':
        console.error('❌ Tipo: CONEXIÓN RECHAZADA');
        console.error(`   Hostinger rechaza conexión en puerto ${process.env.DB_PORT || 3306}`);
        console.error('   Posibles causas:');
        console.error('   1. MySQL no está corriendo en Hostinger');
        console.error('   2. Puerto incorrecto');
        console.error('   3. Firewall de Hostinger bloqueando');
        break;
      case 'ETIMEDOUT':
        console.error('❌ Tipo: TIMEOUT - Hostinger no responde');
        console.error('   Verifica estado del servidor en panel Hostinger');
        break;
      default:
        console.error(`❌ Tipo: ${error.code || 'DESCONOCIDO'}`);
    }
    
    console.error('');
    console.error('📋 Detalles del error:');
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error(`   Errno: ${error.errno || 'N/A'}`);
    console.error('');
    console.error('🔧 Acciones:');
    console.error('   1. Verifica variables de entorno en .env:');
    console.error('      DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT');
    console.error('   2. Accede a panel Hostinger y verifica credenciales MySQL');
    console.error('   3. Verifica que base de datos exista');
    console.error('   4. Verifica estado del servidor');
    console.error('   5. Si todo falla, contacta soporte Hostinger');
    console.error('');
    
    return false;
  }
}

/**
 * Ejecutar chequeo al cargar el módulo
 * Solo en desarrollo/producción (no en testing)
 */
if (process.env.NODE_ENV !== 'test') {
  // Ejecutar chequeo de forma inmediata
  checkConnection().catch(err => {
    console.error('Error durante chequeo de conexión:', err);
  });
}

/**
 * Exportar pool y función de chequeo
 */
module.exports = {
  pool,
  checkConnection,
  
  /**
   * Función helper para ejecutar queries
   */
  query: async (sql, values) => {
    const connection = await pool.getConnection();
    try {
      const [results] = await connection.query(sql, values);
      return results;
    } finally {
      connection.release();
    }
  },
  
  /**
   * Función helper para ejecutar queries con información de filas
   */
  execute: async (sql, values) => {
    const connection = await pool.getConnection();
    try {
      const [results, fields] = await connection.execute(sql, values);
      return { results, fields };
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
};