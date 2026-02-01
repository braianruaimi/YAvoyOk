#!/usr/bin/env node
const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('\n🔌 PRUEBA DE CONEXIÓN SMTP HOSTINGER\n');
console.log('═'.repeat(60));

const config = {
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true' || true,
  auth: {
    user: process.env.SMTP_USER || 'yavoyen5@yavoy.space',
    pass: process.env.SMTP_PASS || 'BraianCesar26!'
  }
};

console.log('📋 CONFIGURACIÓN CARGADA:');
console.log(`   Host: ${config.host}`);
console.log(`   Puerto: ${config.port}`);
console.log(`   Usuario: ${config.auth.user}`);
console.log(`   Secure (SSL): ${config.secure}`);
console.log('═'.repeat(60));

const transporter = nodemailer.createTransport(config);

console.log('\n🔗 Intentando conectar...\n');

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ ERROR DE CONEXIÓN:\n');
    console.log(error);
    
    console.log('\n═'.repeat(60));
    console.log('💡 POSIBLES SOLUCIONES:\n');
    console.log('1️⃣  Verificar credenciales:');
    console.log('    - Email: yavoyen5@yavoy.space');
    console.log('    - Password: BraianCesar26!');
    console.log('    - Sin espacios al inicio/final\n');
    
    console.log('2️⃣  Usar puerto correcto:');
    console.log('    - ✅ Puerto 465 con SSL=true');
    console.log('    - ❌ NO usar puerto 587\n');
    
    console.log('3️⃣  Verificar en Hostinger:');
    console.log('    - Email activo en panel');
    console.log('    - Contraseña coincide\n');
    
    console.log('4️⃣  Revisar firewall:');
    console.log('    - Puerto 465 no bloqueado');
    console.log('    - Antivirus no interfiriendo\n');
    
    console.log('═'.repeat(60));
    console.log('⏰ Timestamp:', new Date().toISOString());
    process.exit(1);
  } else {
    console.log('✅ CONEXIÓN EXITOSA A HOSTINGER SMTP\n');
    console.log('═'.repeat(60));
    console.log('📊 INFORMACIÓN DE CONEXIÓN:\n');
    console.log(`   ✓ Host SMTP: ${config.host}`);
    console.log(`   ✓ Puerto: ${config.port}`);
    console.log(`   ✓ Usuario: ${config.auth.user}`);
    console.log(`   ✓ Encriptación: ${config.secure ? 'SSL/TLS' : 'NONE'}`);
    console.log('\n✨ El servidor SMTP está configurado correctamente');
    console.log('🎉 Listo para enviar emails desde YAvoy\n');
    console.log('═'.repeat(60));
    console.log('⏰ Timestamp:', new Date().toISOString());
    process.exit(0);
  }
});
