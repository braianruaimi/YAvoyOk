const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('\n🔌 PROBANDO CONEXIÓN SMTP CON: BrainCesar26!\n');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'yavoyen5@yavoy.space',
    pass: 'BrainCesar26!'
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ ERROR:\n', error.message);
  } else {
    console.log('✅ CONEXIÓN EXITOSA!\n');
    console.log('La contraseña BrainCesar26! es correcta');
  }
  process.exit(error ? 1 : 0);
});
