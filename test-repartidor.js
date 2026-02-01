#!/usr/bin/env node
/**
 * TEST: Registro de Repartidor
 */

const http = require('http');

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5502,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseData) });
        } catch { resolve({ status: res.statusCode, data: responseData }); }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║ 🚴 TEST: Registro de Repartidor               ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    const repartidorData = {
      nombre: `Repartidor Test ${Date.now()}`,
      email: `rep-${Date.now()}@example.com`,
      password: 'SecurePass123!',
      telefono: '+5491234567891',
      vehiculo: 'bicicleta',
      zonaCobertura: ['Centro', 'Flores']
    };

    console.log('📝 Registrando repartidor...');
    const res = await request('POST', '/api/auth/register/repartidor', repartidorData);

    if (res.status !== 201) {
      console.log('❌ Error:', res.data);
      return;
    }

    const repartidor = res.data.repartidor;
    console.log(`\n✅ Repartidor registrado exitosamente\n`);
    console.log(`📊 Detalles:`);
    console.log(`   ID: ${repartidor.id}`);
    console.log(`   Nombre: ${repartidor.nombre}`);
    console.log(`   Email: ${repartidor.email}`);
    console.log(`   Teléfono: ${repartidor.telefono}`);
    console.log(`   Vehículo: ${repartidor.vehiculo}`);
    console.log(`   Estado: ${repartidor.estado}`);
    console.log(`   Verificado: ${repartidor.verificado ? '✅ Sí' : '⏳ Pendiente'}`);
    console.log(`   Email enviado: ${res.data.emailEnviado ? '✅ Sí' : '📧 Simulación'}`);

    console.log(`\n🔑 Tokens generados:`);
    console.log(`   JWT: ${res.data.token.substring(0, 30)}...`);
    console.log(`   Refresh: ${res.data.refreshToken.substring(0, 30)}...`);

    console.log('\n✨ Sistema de registro completamente operativo');

  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n');
}

test();
