/**
 * Script para probar la conexión a MySQL
 * Ejecutar: node test-mysql-connection.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('🔍 Probando conexión a MySQL...\n');
    console.log('📋 Configuración:');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   Password: ${'*'.repeat(process.env.DB_PASSWORD?.length || 0)}`);
    console.log('');

    try {
        // Obtener IP local
        const https = require('https');
        const getIP = () => new Promise((resolve) => {
            https.get('https://api.ipify.org?format=json', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data).ip));
            }).on('error', () => resolve('desconocida'));
        });

        const ip = await getIP();
        console.log(`🌐 Tu IP actual: ${ip}`);
        console.log('');

        console.log('⏳ Intentando conectar...');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ ¡Conexión exitosa a MySQL!\n');

        // Probar una query simple
        const [rows] = await connection.execute('SELECT DATABASE() as db, VERSION() as version, NOW() as now');
        console.log('📊 Información del servidor:');
        console.log(`   Base de datos: ${rows[0].db}`);
        console.log(`   Versión MySQL: ${rows[0].version}`);
        console.log(`   Fecha/Hora: ${rows[0].now}`);
        console.log('');

        // Verificar tablas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📁 Tablas en la base de datos (${tables.length}):`);
        if (tables.length > 0) {
            tables.forEach(table => {
                console.log(`   - ${Object.values(table)[0]}`);
            });
        } else {
            console.log('   (vacía - se crearán al iniciar el servidor)');
        }

        await connection.end();
        
        console.log('\n✅ Todo está configurado correctamente');
        console.log('🚀 Puedes iniciar el servidor con: npm start');

    } catch (error) {
        console.error('❌ ERROR al conectar a MySQL:\n');
        console.error(`   ${error.message}\n`);
        
        const myIP = await getIP().catch(() => '181.89.23.79');
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('🔧 SOLUCIÓN - Acceso denegado:');
            console.error('   1. Ve a phpMyAdmin en Hostinger');
            console.error('   2. Ejecuta el script: scripts/habilitar-mysql-remoto.sql');
            console.error('   3. O desde el panel Hostinger:');
            console.error('      → Databases → Remote MySQL');
            console.error(`      → Agrega la IP: ${myIP} (o usa % para todas)\n`);
        } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
            console.error('🔧 SOLUCIÓN - Host no encontrado:');
            console.error('   1. Verifica que DB_HOST sea correcto');
            console.error('   2. Verifica tu conexión a Internet');
            console.error('   3. Intenta hacer ping: ping ' + process.env.DB_HOST + '\n');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('🔧 SOLUCIÓN - Base de datos no existe:');
            console.error('   1. Verifica que DB_NAME sea correcto');
            console.error('   2. Crea la base de datos en Hostinger Panel\n');
        }
        
        process.exit(1);
    }
}

testConnection();
