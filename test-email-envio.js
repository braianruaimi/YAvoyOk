#!/usr/bin/env node
const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('\n📧 PRUEBA DE ENVÍO DE EMAIL\n');
console.log('═'.repeat(60));

// ⚠️ EDITAR ESTA VARIABLE CON TU EMAIL
const EMAIL_DESTINO = process.argv[2] || 'tu-email@example.com';

if (EMAIL_DESTINO === 'tu-email@example.com') {
  console.log('\n⚠️  ESPECIFICA TU EMAIL:\n');
  console.log('   node test-email-envio.js tu-email@gmail.com\n');
  console.log('Ejemplo:');
  console.log('   node test-email-envio.js braian@example.com\n');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'yavoyen5@yavoy.space',
    pass: process.env.SMTP_PASS || 'BraianCesar26!'
  }
});

const codigoVerificacion = String(Math.floor(100000 + Math.random() * 900000));

const mailOptions = {
  from: 'YAvoy <yavoyen5@yavoy.space>',
  to: EMAIL_DESTINO,
  subject: '✅ Prueba de Sistema de Email - YAvoy',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px 0; }
        .code-box { background: #f0f0f0; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
        .code { font-size: 32px; letter-spacing: 4px; font-weight: bold; text-align: center; color: #667eea; }
        .footer { border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 YAvoy - Sistema Operativo</h1>
        </div>
        
        <div class="content">
          <h2>Hola! 👋</h2>
          <p>Este es un email de <strong>prueba exitosa</strong> del sistema YAvoy.</p>
          
          <div class="code-box">
            <p><strong>Tu código de verificación:</strong></p>
            <div class="code">${codigoVerificacion}</div>
          </div>
          
          <h3>✅ Confirmaciones:</h3>
          <ul>
            <li>✓ Hostinger SMTP está configurado correctamente</li>
            <li>✓ Las credenciales de email son válidas</li>
            <li>✓ La plataforma YAvoy puede enviar emails</li>
            <li>✓ Sistema de verificación está operativo</li>
          </ul>
          
          <h3>📊 Información de Prueba:</h3>
          <ul>
            <li><strong>Remitente:</strong> YAvoy &lt;yavoyen5@yavoy.space&gt;</li>
            <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</li>
            <li><strong>Servidor:</strong> smtp.hostinger.com:465</li>
            <li><strong>Estado:</strong> ✅ OPERATIVO EN PRODUCCIÓN</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>Este es un email de prueba automático. No responder a este correo.</p>
          <p>YAvoy © 2026 - Plataforma de Entregas</p>
        </div>
      </div>
    </body>
    </html>
  `
};

console.log('📤 ENVIANDO EMAIL DE PRUEBA...\n');
console.log(`   Para: ${EMAIL_DESTINO}`);
console.log(`   Desde: yavoyen5@yavoy.space`);
console.log(`   Código generado: ${codigoVerificacion}\n`);
console.log('═'.repeat(60));

const startTime = Date.now();

transporter.sendMail(mailOptions, (error, info) => {
  const duration = Date.now() - startTime;
  
  if (error) {
    console.log('\n❌ ERROR AL ENVIAR EMAIL:\n');
    console.log(error);
    console.log('\n⏰ Tiempo de intento:', duration + 'ms');
    process.exit(1);
  } else {
    console.log('\n✅ EMAIL ENVIADO EXITOSAMENTE\n');
    console.log('═'.repeat(60));
    console.log('📊 DETALLES DE ENVÍO:\n');
    console.log(`   ID del mensaje: ${info.messageId}`);
    console.log(`   Destinatario: ${EMAIL_DESTINO}`);
    console.log(`   Remitente: yavoyen5@yavoy.space`);
    console.log(`   Tiempo de envío: ${duration}ms`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    
    console.log('\n💡 PRÓXIMOS PASOS:\n');
    console.log('   1. Revisa tu bandeja de entrada');
    console.log('   2. Si no lo ves, busca en SPAM');
    console.log('   3. El código de prueba es: ' + codigoVerificacion);
    console.log('   4. Verifica que el email se vea correctamente\n');
    
    console.log('═'.repeat(60));
    console.log('🎉 Sistema de email está 100% operativo\n');
    process.exit(0);
  }
});
