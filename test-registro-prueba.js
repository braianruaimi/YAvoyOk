#!/usr/bin/env node
const http = require('http');

console.log('\n🚀 REGISTRANDO COMERCIO DE PRUEBA\n');
console.log('═'.repeat(60));

const registerData = JSON.stringify({
  nombre: "Comercio Test Braian",
  email: "cdaimale@gmail.com",
  password: "Test1234!",
  telefono: "1234567890",
  direccion: "Calle Test 123, Buenos Aires",
  ciudad: "Buenos Aires",
  codigoPostal: "1425"
});

console.log('📝 DATOS DEL REGISTRO:');
console.log('   Nombre: Comercio Test Braian');
console.log('   Email: cdaimale@gmail.com');
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
      console.log(JSON.stringify(response, null, 2));
      
      console.log('\n═'.repeat(60));
      console.log('\n🎉 REGISTRO COMPLETADO\n');
      
      if (res.statusCode === 201) {
        console.log('✅ Comercio registrado exitosamente');
        console.log('\n📧 PRÓXIMOS PASOS:');
        console.log('1. Revisa tu email: cdaimale@gmail.com');
        console.log('2. Busca un correo de: yavoyen5@yavoy.space');
        console.log('3. El correo contiene tu código de verificación (6 dígitos)');
        console.log('4. Usa ese código en: http://localhost:5502/verificar-email.html');
        
        if (response.data) {
          console.log('\n📋 ID COMERCIO:', response.data.id);
          console.log('📋 EMAIL:', response.data.email);
          console.log('✓ VERIFICADO:', response.data.verificado);
        }
      }
    } catch (e) {
      console.log(data);
    }
    
    console.log('\n═'.repeat(60));
    process.exit(res.statusCode === 201 ? 0 : 1);
  });
});

req.on('error', (error) => {
  console.error('❌ ERROR DE CONEXIÓN:', error.message);
  console.log('\n⚠️  Asegúrate que el servidor está ejecutando:');
  console.log('   npm start');
  process.exit(1);
});

req.write(registerData);
req.end();
