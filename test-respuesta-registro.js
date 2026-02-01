#!/usr/bin/env node
/**
 * TEST DETALLADO: Revisar respuesta completa del registro
 */

const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5502,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  const commerceData = {
    nombre: `Test Pizzería ${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    telefono: '+5491234567890',
    rubro: 'pizzería'
  };

  console.log('🔄 Registrando comercio...\n');
  const res = await makeRequest('POST', '/api/auth/register/comercio', commerceData);
  
  console.log('📊 RESPUESTA COMPLETA:');
  console.log('Status:', res.status);
  console.log('\nDatos:');
  console.log(JSON.stringify(res.data, null, 2));
}

test().catch(console.error);
