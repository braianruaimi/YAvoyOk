#!/usr/bin/env node
/**
 * 🔍 VERIFICACIÓN RÁPIDA DEL SISTEMA
 * Valida que todos los componentes estén correctamente configurados
 */

const fs = require('fs');
const path = require('path');

console.log(`
╔════════════════════════════════════════════════════════════╗
║      🔍 VERIFICACIÓN DEL SISTEMA YAVOY v3.1               ║
╚════════════════════════════════════════════════════════════╝
`);

let allGood = true;

// 1. Verificar .env
console.log('1️⃣  Verificando .env...');
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const hasSmtp = envContent.includes('SMTP_HOST=smtp.hostinger.com');
  const hasEmail = envContent.includes('yavoyen5@yavoy.space');
  const hasPort465 = envContent.includes('SMTP_PORT=465');
  const hasSSL = envContent.includes('SMTP_SECURE=true');
  
  if (hasSmtp && hasEmail && hasPort465 && hasSSL) {
    console.log('   ✅ Configuración de email correcta\n');
  } else {
    console.log('   ⚠️  Verificar configuración de email\n');
    allGood = false;
  }
} catch (e) {
  console.log('   ❌ Archivo .env no encontrado\n');
  allGood = false;
}

// 2. Verificar archivos clave
console.log('2️⃣  Verificando archivos clave...');
const files = [
  'server.js',
  'src/utils/emailService.js',
  'src/controllers/authController.js',
  'src/routes/authRoutes.js',
  'verificar-email.html'
];

let filesOk = 0;
files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
    filesOk++;
  } else {
    console.log(`   ❌ ${file} - NO ENCONTRADO`);
    allGood = false;
  }
});
console.log(`   ${filesOk}/${files.length} archivos encontrados\n`);

// 3. Verificar directorios de datos
console.log('3️⃣  Verificando estructura de datos...');
const dirs = [
  'registros/comercios',
  'registros/repartidores',
  'registros/clientes'
];

let dirsOk = 0;
dirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`   ✅ ${dir}`);
    dirsOk++;
  } else {
    console.log(`   ❌ ${dir} - NO ENCONTRADO`);
    allGood = false;
  }
});
console.log(`   ${dirsOk}/${dirs.length} directorios encontrados\n`);

// 4. Verificar bases de datos JSON
console.log('4️⃣  Verificando bases de datos...');
try {
  const comercios = JSON.parse(fs.readFileSync('registros/comercios/comercios.json', 'utf8'));
  const repartidores = JSON.parse(fs.readFileSync('registros/repartidores/repartidores.json', 'utf8'));
  
  console.log(`   ✅ comercios.json - ${comercios.length} registros`);
  console.log(`   ✅ repartidores.json - ${repartidores.length} registros\n`);
} catch (e) {
  console.log(`   ❌ Error leyendo bases de datos\n`);
  allGood = false;
}

// 5. Verificar package.json
console.log('5️⃣  Verificando dependencias...');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = {
    'express': 'Web framework',
    'nodemailer': 'Email service',
    'bcrypt': 'Password hashing',
    'jsonwebtoken': 'JWT tokens',
    'cors': 'CORS handling',
    'helmet': 'Security headers'
  };
  
  let depsOk = 0;
  Object.entries(deps).forEach(([dep, desc]) => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      console.log(`   ✅ ${dep} - ${desc}`);
      depsOk++;
    } else {
      console.log(`   ⚠️  ${dep} - podría no estar instalado`);
    }
  });
  console.log(`\n`);
} catch (e) {
  console.log(`   ❌ Error leyendo package.json\n`);
  allGood = false;
}

// 6. Resumen final
console.log('╔════════════════════════════════════════════════════════════╗');
if (allGood) {
  console.log('║  ✅ SISTEMA COMPLETAMENTE CONFIGURADO                     ║');
  console.log('║                                                            ║');
  console.log('║  Para iniciar el servidor:                               ║');
  console.log('║  $ npm start                                             ║');
  console.log('║                                                            ║');
  console.log('║  Para ejecutar la demostración:                          ║');
  console.log('║  $ node demo-completa.js                                 ║');
} else {
  console.log('║  ⚠️  REVISAR CONFIGURACIÓN                               ║');
  console.log('║                                                            ║');
  console.log('║  Verifique los elementos marcados con ❌                 ║');
}
console.log('╚════════════════════════════════════════════════════════════╝\n');

process.exit(allGood ? 0 : 1);
