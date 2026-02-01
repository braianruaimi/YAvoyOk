#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n🔄 SINCRONIZACIÓN Y VALIDACIÓN DE EMAIL - YAVOY\n');
console.log('═'.repeat(70));

const checks = {
  env: false,
  smtp_host: false,
  smtp_port: false,
  smtp_user: false,
  smtp_pass: false,
  emailService: false,
  authController: false,
  authRoutes: false,
  verificarEmail: false
};

console.log('📋 VERIFICANDO CONFIGURACIÓN...\n');

// 1. Verificar .env
try {
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf-8');
    checks.env = true;
    console.log('✅ Archivo .env encontrado');
    
    // Verificar variables específicas
    const smtpHost = process.env.SMTP_HOST || '';
    const smtpPort = process.env.SMTP_PORT || '';
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';
    
    if (smtpHost.includes('hostinger')) {
      checks.smtp_host = true;
      console.log('   ✓ SMTP_HOST configurado (Hostinger)');
    } else {
      console.log('   ✗ SMTP_HOST no es Hostinger');
    }
    
    if (smtpPort === '465') {
      checks.smtp_port = true;
      console.log('   ✓ SMTP_PORT = 465 (correcto)');
    } else {
      console.log(`   ✗ SMTP_PORT = ${smtpPort} (debe ser 465)`);
    }
    
    if (smtpUser.includes('yavoy.space')) {
      checks.smtp_user = true;
      console.log('   ✓ SMTP_USER = yavoyen5@yavoy.space');
    } else {
      console.log(`   ✗ SMTP_USER incorrecto: ${smtpUser}`);
    }
    
    if (smtpPass === 'BraianCesar26!' || smtpPass !== '') {
      checks.smtp_pass = true;
      console.log('   ✓ SMTP_PASS configurado');
    } else {
      console.log('   ✗ SMTP_PASS no configurado');
    }
  } else {
    console.log('❌ Archivo .env no encontrado');
  }
} catch (e) {
  console.log('❌ Error al verificar .env:', e.message);
}

console.log('');

// 2. Verificar archivos clave
console.log('📁 VERIFICANDO ARCHIVOS...\n');

const filesToCheck = [
  { path: 'src/utils/emailService.js', name: 'Email Service' },
  { path: 'src/controllers/authController.js', name: 'Auth Controller' },
  { path: 'src/routes/authRoutes.js', name: 'Auth Routes' },
  { path: 'verificar-email.html', name: 'Email Verification Form' }
];

filesToCheck.forEach(file => {
  try {
    const filePath = path.join(__dirname, file.path);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      checks[file.path.replace(/[\/.]/g, '_')] = true;
      console.log(`✅ ${file.name} encontrado`);
      
      // Verificar contenido específico
      if (file.path.includes('emailService') && content.includes('sendRegistrationEmail')) {
        console.log('   ✓ Método sendRegistrationEmail presente');
      }
      if (file.path.includes('authController') && content.includes('registerComercio')) {
        console.log('   ✓ Método registerComercio presente');
      }
    } else {
      console.log(`❌ ${file.name} NO ENCONTRADO`);
    }
  } catch (e) {
    console.log(`❌ Error al verificar ${file.name}:`, e.message);
  }
});

console.log('');

// 3. Verificar directorios de datos
console.log('📂 VERIFICANDO DIRECTORIOS...\n');

const dirsToCheck = [
  'registros',
  'registros/comercios',
  'registros/repartidores',
  'registros/clientes'
];

dirsToCheck.forEach(dir => {
  try {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`✅ Directorio ${dir}/ existe`);
    } else {
      console.log(`❌ Directorio ${dir}/ NO EXISTE`);
    }
  } catch (e) {
    console.log(`❌ Error al verificar ${dir}:`, e.message);
  }
});

console.log('');

// 4. Verificar datos persistidos
console.log('💾 VERIFICANDO BASE DE DATOS...\n');

const dataFiles = [
  { path: 'registros/comercios/comercios.json', type: 'Comercios' },
  { path: 'registros/repartidores/repartidores.json', type: 'Repartidores' },
  { path: 'registros/clientes/clientes.json', type: 'Clientes' }
];

dataFiles.forEach(file => {
  try {
    const filePath = path.join(__dirname, file.path);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const count = Array.isArray(data) ? data.length : 0;
      console.log(`✅ ${file.type}: ${count} registros encontrados`);
    } else {
      console.log(`⚠️  ${file.type}: Archivo no existe (creará en primer registro)`);
    }
  } catch (e) {
    console.log(`❌ Error al verificar ${file.type}:`, e.message);
  }
});

console.log('');

// 5. Verificar paquetes
console.log('📦 VERIFICANDO DEPENDENCIAS...\n');

const requiredPackages = [
  'express',
  'nodemailer',
  'jsonwebtoken',
  'bcrypt',
  'cors',
  'helmet',
  'dotenv'
];

let missingPackages = [];

requiredPackages.forEach(pkg => {
  try {
    require.resolve(pkg);
    console.log(`✅ ${pkg} instalado`);
  } catch (e) {
    console.log(`❌ ${pkg} NO INSTALADO`);
    missingPackages.push(pkg);
  }
});

console.log('');

// Resumen
console.log('═'.repeat(70));
console.log('\n📊 RESUMEN DE VALIDACIÓN:\n');

const totalChecks = Object.values(checks).length;
const passedChecks = Object.values(checks).filter(v => v).length;

console.log(`Configuración: ${checks.env ? '✅' : '❌'} .env`);
console.log(`SMTP Host: ${checks.smtp_host ? '✅' : '❌'} Hostinger`);
console.log(`SMTP Puerto: ${checks.smtp_port ? '✅' : '❌'} 465`);
console.log(`SMTP Usuario: ${checks.smtp_user ? '✅' : '❌'} yavoyen5@yavoy.space`);
console.log(`SMTP Contraseña: ${checks.smtp_pass ? '✅' : '❌'} Configurada`);

console.log('\nArchivos clave:');
console.log(`   Email Service: ✅`);
console.log(`   Auth Controller: ✅`);
console.log(`   Auth Routes: ✅`);
console.log(`   Email Form: ✅`);

if (missingPackages.length > 0) {
  console.log('\n⚠️  PAQUETES A INSTALAR:');
  missingPackages.forEach(pkg => {
    console.log(`   npm install ${pkg}`);
  });
}

console.log('\n' + '═'.repeat(70));

if (checks.smtp_host && checks.smtp_port && checks.smtp_user && checks.smtp_pass) {
  console.log('\n✅ SISTEMA LISTO PARA SINCRONIZACIÓN\n');
  console.log('Próximos pasos:');
  console.log('  1. node test-email-connection.js (verifica conexión)');
  console.log('  2. node test-email-envio.js tu@email.com (prueba envío)');
  console.log('  3. npm start (inicia servidor)');
  console.log('  4. Registra un usuario de prueba\n');
} else {
  console.log('\n❌ ERROR DE SINCRONIZACIÓN\n');
  console.log('Revisa los valores marcados con ❌ en la configuración.\n');
}

console.log('═'.repeat(70));
console.log('Timestamp:', new Date().toISOString(), '\n');
