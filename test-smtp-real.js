#!/usr/bin/env node
const http = require('http');

console.log('\n🚀 PRUEBA DE EMAIL REAL CON HOSTINGER SMTP\n');
console.log('═'.repeat(60));

const registerData = JSON.stringify({
  nombre: "Braian Test SMTP",
  email: "cdaimale+test@gmail.com",
  password: "Test1234!",
  telefono: "1234567890",
  direccion: "Calle Test 123, Buenos Aires",
  ciudad: "Buenos Aires",
  codigoPostal: "1425"
});

console.log('📝 REGISTRANDO:');
console.log('   Nombre: Braian Test SMTP');
console.log('   Email: cdaimale+test@gmail.com (llegará a cdaimale@gmail.com)');
console.log('   Password: Test1234!');
console.log('\n═'.repeat(60));
console.log('\n📤 Enviando registro...\n');

const options = {
  hostname: 'localhost',
  port: 5502,
  path: '/api/auth/register/comercio',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': registerData.length
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('✅ RESPUESTA DEL SERVIDOR:\n');
    console.log('Status Code:', res.statusCode);
    console.log('\n📊 DATOS RECIBIDOS:');
    
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 201) {
        console.log('\n✅ Comercio registrado exitosamente');
        console.log('\n📋 INFORMACIÓN:');
        console.log('   ID:', response.comercio.id);
        console.log('   Email:', response.comercio.email);
        console.log('   Email enviado:', response.emailEnviado ? '✅ SÍ' : '❌ NO');
        
        console.log('\n═'.repeat(60));
        console.log('\n📧 INSTRUCCIONES:');
        console.log('1. Abre tu email: cdaimale@gmail.com');
        console.log('2. Busca un correo de: yavoyen5@yavoy.space');
        console.log('3. Si NO llega, busca en SPAM');
        console.log('4. El correo debe contener:');
        console.log('   - Código de 6 dígitos');
        console.log('   - ID: ' + response.comercio.id);
        console.log('\n═'.repeat(60));
      } else {
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (e) {
      console.log(data);
    }
    
    process.exit(res.statusCode === 201 ? 0 : 1);
  });
});

req.on('error', (error) => {
  console.error('❌ ERROR DE CONEXIÓN:', error.message);
  process.exit(1);
});

req.write(registerData);
req.end();
