// ====================================
// YAVOY v3.1 - DIAGNÓSTICO COMPLETO
// ====================================
// Verifica MySQL y Email configuraciones

require('dotenv').config();
const { Sequelize } = require('sequelize');
const nodemailer = require('nodemailer');

console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE MYSQL Y EMAIL\n');
console.log('='.repeat(60));

// ====================================
// 1️⃣ VERIFICAR VARIABLES DE ENTORNO
// ====================================
console.log('\n📋 PASO 1: VERIFICAR VARIABLES DE ENTORNO\n');

const envVars = {
  'DB_TYPE': process.env.DB_TYPE,
  'DB_HOST': process.env.DB_HOST,
  'DB_HOST_IP': process.env.DB_HOST_IP,
  'DB_PORT': process.env.DB_PORT,
  'DB_NAME': process.env.DB_NAME,
  'DB_USER': process.env.DB_USER,
  'DB_PASSWORD': process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-4) : 'NO CONFIGURADO',
  'SMTP_HOST': process.env.SMTP_HOST,
  'SMTP_PORT': process.env.SMTP_PORT,
  'SMTP_USER': process.env.SMTP_USER,
  'SMTP_PASS': process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NO CONFIGURADO'
};

let missingVars = [];
for (const [key, value] of Object.entries(envVars)) {
  const status = value ? '✅' : '❌';
  console.log(`  ${status} ${key}: ${value || 'NO CONFIGURADO'}`);
  if (!value) missingVars.push(key);
}

if (missingVars.length > 0) {
  console.log('\n⚠️  VARIABLES FALTANTES:', missingVars.join(', '));
} else {
  console.log('\n✅ Todas las variables están configuradas');
}

// ====================================
// 2️⃣ PROBAR CONEXIÓN MYSQL
// ====================================
console.log('\n' + '='.repeat(60));
console.log('\n🗄️  PASO 2: PROBAR CONEXIÓN A MYSQL\n');

async function testMySQLConnection() {
  try {
    console.log('📡 Intentando conectar a MySQL...');
    console.log(`   Host: ${process.env.DB_HOST || 'NO CONFIGURADO'}`);
    console.log(`   Puerto: ${process.env.DB_PORT || '3306'}`);
    console.log(`   Base de datos: ${process.env.DB_NAME || 'NO CONFIGURADO'}`);
    console.log(`   Usuario: ${process.env.DB_USER || 'NO CONFIGURADO'}`);
    
    const sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        port: process.env.DB_PORT || 3306,
        logging: false
      }
    );

    await sequelize.authenticate();
    console.log('\n✅ CONEXIÓN A MYSQL EXITOSA');
    
    // Probar una consulta simple
    const [results] = await sequelize.query('SELECT VERSION() as version, DATABASE() as db_name, USER() as user');
    console.log('\n📊 INFORMACIÓN DEL SERVIDOR:');
    console.log('   Versión MySQL:', results[0].version);
    console.log('   Base de datos actual:', results[0].db_name);
    console.log('   Usuario conectado:', results[0].user);
    
    // Listar tablas
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('\n📋 TABLAS EXISTENTES:', tables.length > 0 ? tables.length : 'Ninguna');
    if (tables.length > 0) {
      tables.forEach((table, i) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${i + 1}. ${tableName}`);
      });
    }
    
    await sequelize.close();
    return true;
  } catch (error) {
    console.log('\n❌ ERROR DE CONEXIÓN A MYSQL:');
    console.log('   Mensaje:', error.message);
    console.log('   Código:', error.original?.code || 'N/A');
    console.log('   Errno:', error.original?.errno || 'N/A');
    
    console.log('\n🔧 POSIBLES SOLUCIONES:');
    console.log('   1. Verificar credenciales en archivo .env');
    console.log('   2. Comprobar que el host es correcto:', process.env.DB_HOST);
    console.log('   3. Verificar que el puerto 3306 esté accesible');
    console.log('   4. Habilitar acceso remoto en Hostinger Panel:');
    console.log('      → https://hpanel.hostinger.com');
    console.log('      → Databases → Remote MySQL');
    console.log('      → Agregar tu IP pública o usar % (todas las IPs)');
    
    return false;
  }
}

// ====================================
// 3️⃣ PROBAR CONFIGURACIÓN DE EMAIL
// ====================================
console.log('\n' + '='.repeat(60));
console.log('\n📧 PASO 3: PROBAR CONFIGURACIÓN DE EMAIL\n');

async function testEmailConfiguration() {
  try {
    console.log('📡 Verificando configuración SMTP...');
    console.log(`   Host: ${process.env.SMTP_HOST || 'NO CONFIGURADO'}`);
    console.log(`   Puerto: ${process.env.SMTP_PORT || '587'}`);
    console.log(`   Usuario: ${process.env.SMTP_USER || 'NO CONFIGURADO'}`);
    console.log(`   Secure: ${process.env.SMTP_SECURE || 'false'}`);
    console.log(`   TLS: ${process.env.SMTP_TLS || 'true'}`);
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });

    console.log('\n🔄 Verificando conexión SMTP...');
    await transporter.verify();
    console.log('✅ CONEXIÓN SMTP EXITOSA');
    console.log('   El servidor de email está configurado correctamente');
    
    return true;
  } catch (error) {
    console.log('\n❌ ERROR DE CONFIGURACIÓN DE EMAIL:');
    console.log('   Mensaje:', error.message);
    console.log('   Código:', error.code || 'N/A');
    
    console.log('\n🔧 POSIBLES SOLUCIONES:');
    console.log('   1. Verificar credenciales SMTP en archivo .env');
    console.log('   2. Comprobar que el host SMTP es correcto:', process.env.SMTP_HOST);
    console.log('   3. Verificar usuario y contraseña de email');
    console.log('   4. Para Gmail: usar "Contraseña de aplicación"');
    console.log('      → https://myaccount.google.com/apppasswords');
    console.log('   5. Para Hostinger: usar credenciales del panel de email');
    
    return false;
  }
}

// ====================================
// 4️⃣ EJECUTAR DIAGNÓSTICO COMPLETO
// ====================================
(async () => {
  try {
    const mysqlOk = await testMySQLConnection();
    const emailOk = await testEmailConfiguration();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:\n');
    console.log(`  ${mysqlOk ? '✅' : '❌'} Conexión MySQL: ${mysqlOk ? 'FUNCIONANDO' : 'CON ERRORES'}`);
    console.log(`  ${emailOk ? '✅' : '❌'} Configuración Email: ${emailOk ? 'FUNCIONANDO' : 'CON ERRORES'}`);
    
    if (mysqlOk && emailOk) {
      console.log('\n🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!');
      console.log('   Tu aplicación puede guardar en MySQL y enviar emails.');
    } else {
      console.log('\n⚠️  HAY PROBLEMAS QUE RESOLVER');
      console.log('   Revisa los errores anteriores y aplica las soluciones sugeridas.');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 SIGUIENTE PASO:');
    if (!mysqlOk) {
      console.log('   1. Corrige la configuración de MySQL en el archivo .env');
      console.log('   2. Ejecuta nuevamente este diagnóstico: node diagnostico-mysql-email.js');
    } else if (!emailOk) {
      console.log('   1. Corrige la configuración de Email en el archivo .env');
      console.log('   2. Ejecuta nuevamente este diagnóstico: node diagnostico-mysql-email.js');
    } else {
      console.log('   ✅ Todo está listo. Inicia tu servidor con: npm start');
    }
    
    process.exit(mysqlOk && emailOk ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ ERROR INESPERADO:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
