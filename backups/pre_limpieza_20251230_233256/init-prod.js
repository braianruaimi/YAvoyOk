/**
 * ========================================
 * SCRIPT DE INICIALIZACIÓN PRE-PRODUCCIÓN
 * ========================================
 * Verifica la conexión a PostgreSQL antes de iniciar el servidor
 * Valida variables de entorno críticas
 * Ejecuta health checks básicos
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// ============================================
// 1. VALIDAR VARIABLES DE ENTORNO CRÍTICAS
// ============================================

console.log(`${colors.cyan}🔍 Verificando variables de entorno...${colors.reset}\n`);

const REQUIRED_VARS = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'PORT'
];

const missingVars = [];
REQUIRED_VARS.forEach(varName => {
    if (!process.env[varName]) {
        missingVars.push(varName);
        console.log(`${colors.red}❌ Falta: ${varName}${colors.reset}`);
    } else {
        // Ofuscar valores sensibles
        const displayValue = ['PASSWORD', 'SECRET', 'TOKEN'].some(s => varName.includes(s))
            ? '***' + process.env[varName].slice(-4)
            : process.env[varName];
        console.log(`${colors.green}✅ ${varName}=${displayValue}${colors.reset}`);
    }
});

if (missingVars.length > 0) {
    console.log(`\n${colors.red}❌ FALLO: Faltan ${missingVars.length} variables de entorno críticas${colors.reset}`);
    console.log(`${colors.yellow}📝 Revisa el archivo .env y asegúrate de configurar: ${missingVars.join(', ')}${colors.reset}\n`);
    process.exit(1);
}

console.log(`${colors.green}\n✅ Todas las variables de entorno están configuradas${colors.reset}\n`);

// ============================================
// 2. VERIFICAR CONEXIÓN A POSTGRESQL
// ============================================

console.log(`${colors.cyan}🔌 Verificando conexión a PostgreSQL...${colors.reset}\n`);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000
});

async function verificarConexionDB() {
    try {
        // Test de conexión
        const client = await pool.connect();
        console.log(`${colors.green}✅ Conexión exitosa a PostgreSQL${colors.reset}`);
        
        // Verificar versión de PostgreSQL
        const versionResult = await client.query('SELECT version()');
        const version = versionResult.rows[0].version.split(' ')[1];
        console.log(`${colors.blue}   PostgreSQL versión: ${version}${colors.reset}`);
        
        // Verificar base de datos
        const dbResult = await client.query('SELECT current_database()');
        console.log(`${colors.blue}   Base de datos: ${dbResult.rows[0].current_database}${colors.reset}`);
        
        client.release();
        return true;
    } catch (error) {
        console.log(`${colors.red}❌ Error conectando a PostgreSQL:${colors.reset}`);
        console.log(`${colors.red}   ${error.message}${colors.reset}\n`);
        
        console.log(`${colors.yellow}🔧 Posibles soluciones:${colors.reset}`);
        console.log(`   1. Verifica que PostgreSQL esté corriendo: pg_ctl status`);
        console.log(`   2. Verifica credenciales en .env (DB_USER, DB_PASSWORD)`);
        console.log(`   3. Verifica que la base de datos existe: psql -U postgres -c "\\l"`);
        console.log(`   4. Crea la base de datos: psql -U postgres -c "CREATE DATABASE yavoy_enterprise;"`);
        console.log(`   5. Ejecuta el schema: psql -U postgres -d yavoy_enterprise -f database-schema.sql\n`);
        
        return false;
    }
}

// ============================================
// 3. VERIFICAR TABLAS CRÍTICAS
// ============================================

async function verificarTablas() {
    console.log(`${colors.cyan}\n📊 Verificando estructura de tablas...${colors.reset}\n`);
    
    const tablasRequeridas = [
        'users',
        'delivery_persons',
        'shops',
        'orders',
        'order_status_history',
        'reviews',
        'chat_messages',
        'system_logs',
        'products',
        'referral_codes',
        'referrals',
        'rewards',
        'tips',
        'pedidos_grupales'
    ];
    
    try {
        const client = await pool.connect();
        
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        const tablasExistentes = result.rows.map(r => r.table_name);
        const tablasFaltantes = tablasRequeridas.filter(t => !tablasExistentes.includes(t));
        
        if (tablasFaltantes.length > 0) {
            console.log(`${colors.yellow}⚠️  Faltan ${tablasFaltantes.length} tablas:${colors.reset}`);
            tablasFaltantes.forEach(t => console.log(`   - ${t}`));
            console.log(`\n${colors.yellow}📝 Ejecuta el schema: psql -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -f database-schema.sql${colors.reset}\n`);
            client.release();
            return false;
        }
        
        console.log(`${colors.green}✅ Todas las ${tablasRequeridas.length} tablas requeridas existen${colors.reset}`);
        
        // Mostrar conteo de registros
        console.log(`${colors.blue}\n📈 Conteo de registros:${colors.reset}`);
        for (const tabla of ['users', 'shops', 'orders', 'delivery_persons']) {
            try {
                const countResult = await client.query(`SELECT COUNT(*) FROM ${tabla}`);
                const count = parseInt(countResult.rows[0].count, 10);
                console.log(`   ${tabla}: ${count} registros`);
            } catch (err) {
                console.log(`   ${tabla}: Error (${err.message})`);
            }
        }
        
        client.release();
        return true;
    } catch (error) {
        console.log(`${colors.red}❌ Error verificando tablas: ${error.message}${colors.reset}\n`);
        return false;
    }
}

// ============================================
// 4. VERIFICAR ARCHIVOS CRÍTICOS
// ============================================

function verificarArchivos() {
    console.log(`${colors.cyan}\n📁 Verificando archivos críticos...${colors.reset}\n`);
    
    const archivosCriticos = [
        'server-enterprise.js',
        'package.json',
        'database-schema.sql',
        'ecosystem.config.js',
        'src/config/logger.js',
        'src/validation/schemas.js'
    ];
    
    let todosExisten = true;
    
    archivosCriticos.forEach(archivo => {
        const rutaCompleta = path.join(__dirname, archivo);
        if (fs.existsSync(rutaCompleta)) {
            const stats = fs.statSync(rutaCompleta);
            const sizeKB = (stats.size / 1024).toFixed(2);
            console.log(`${colors.green}✅ ${archivo} (${sizeKB} KB)${colors.reset}`);
        } else {
            console.log(`${colors.red}❌ Falta: ${archivo}${colors.reset}`);
            todosExisten = false;
        }
    });
    
    if (!todosExisten) {
        console.log(`${colors.red}\n❌ Faltan archivos críticos del sistema${colors.reset}\n`);
        return false;
    }
    
    console.log(`${colors.green}\n✅ Todos los archivos críticos existen${colors.reset}`);
    return true;
}

// ============================================
// 5. EJECUTAR VERIFICACIONES
// ============================================

(async function main() {
    console.log(`${colors.cyan}
╔════════════════════════════════════════════════╗
║  YAvoy v3.1 Enterprise - Pre-Flight Check     ║
║  Verificación Pre-Producción                   ║
╚════════════════════════════════════════════════╝${colors.reset}\n`);
    
    // Paso 1: Archivos
    const archivosOK = verificarArchivos();
    if (!archivosOK) {
        console.log(`${colors.red}\n❌ FALLO: Sistema incompleto${colors.reset}\n`);
        await pool.end();
        process.exit(1);
    }
    
    // Paso 2: Conexión DB
    const conexionOK = await verificarConexionDB();
    if (!conexionOK) {
        console.log(`${colors.red}\n❌ FALLO: No se pudo conectar a PostgreSQL${colors.reset}\n`);
        await pool.end();
        process.exit(1);
    }
    
    // Paso 3: Tablas
    const tablasOK = await verificarTablas();
    if (!tablasOK) {
        console.log(`${colors.yellow}\n⚠️  ADVERTENCIA: Estructura de base de datos incompleta${colors.reset}\n`);
        await pool.end();
        process.exit(1);
    }
    
    // Cerrar pool
    await pool.end();
    
    // Resultado final
    console.log(`${colors.green}
╔════════════════════════════════════════════════╗
║  ✅ SISTEMA LISTO PARA PRODUCCIÓN             ║
║                                                ║
║  Todos los checks pasaron exitosamente        ║
║  Puedes iniciar el servidor con seguridad     ║
╚════════════════════════════════════════════════╝${colors.reset}\n`);
    
    console.log(`${colors.cyan}🚀 Comandos para iniciar:${colors.reset}`);
    console.log(`   ${colors.yellow}Desarrollo:${colors.reset}  npm start`);
    console.log(`   ${colors.yellow}Producción:${colors.reset}  npm run prod`);
    console.log(`   ${colors.yellow}PM2:${colors.reset}         pm2 start ecosystem.config.js\n`);
    
    process.exit(0);
})();

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
    console.error(`${colors.red}\n❌ Error no manejado:${colors.reset}`, error);
    process.exit(1);
});
