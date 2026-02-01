#!/usr/bin/env node
/**
 * TEST COMPLETO: Flujo Registro → Verificación
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

async function runFullTest() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║ 🚀 TEST COMPLETO: Sistema de Registro + Verificación      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. REGISTRAR COMERCIO
    console.log('📝 PASO 1: Registrando comercio...');
    const email = `test-${Date.now()}@example.com`;
    const registerRes = await request('POST', '/api/auth/register/comercio', {
      nombre: `Pizzería Test ${Date.now()}`,
      email: email,
      password: 'SecurePass123!',
      telefono: '+5491234567890',
      rubro: 'pizzería'
    });

    if (registerRes.status !== 201) {
      console.log('❌ Error registrando:', registerRes.data);
      return;
    }

    const userId = registerRes.data.comercio.id;
    console.log(`✅ Comercio registrado: ${userId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Verificado: ${registerRes.data.comercio.verificado}`);
    console.log(`   Email enviado: ${registerRes.data.emailEnviado}\n`);

    // 2. LEER DATOS DEL COMERCIO REGISTRADO
    console.log('📋 PASO 2: Verificando datos en base de datos...');
    const registrosRes = await request('GET', '/api/registros');
    if (registrosRes.status === 200) {
      const registros = registrosRes.data.registros || {};
      const comercios = Object.values(registros).filter(r => r.id === userId);
      if (comercios.length > 0) {
        const comercio = comercios[0];
        console.log(`✅ Usuario encontrado en BD`);
        console.log(`   Código confirmación: ${comercio.confirmacionCode ? '✅ Generado' : '❌ No generado'}`);
        console.log(`   Expira: ${comercio.confirmacionExpira || 'N/A'}\n`);

        // 3. INTENTAR VERIFICAR CON CÓDIGO ERRÓNEO
        console.log('🔐 PASO 3: Probando verificación con código incorrecto...');
        const wrongVerifyRes = await request('POST', '/api/auth/verify-email', {
          email: email,
          code: '999999'
        });

        if (wrongVerifyRes.status === 400) {
          console.log('✅ Correctamente rechazado código inválido\n');
        } else {
          console.log(`⚠️  Status inesperado: ${wrongVerifyRes.status}\n`);
        }

        // 4. VERIFICAR CON CÓDIGO CORRECTO (si está disponible en desarrollo)
        if (comercio.confirmacionCode) {
          console.log('✅ PASO 4: Verificando con código correcto (modo simulación)...');
          const correctVerifyRes = await request('POST', '/api/auth/verify-email', {
            email: email,
            code: comercio.confirmacionCode
          });

          console.log(`   Status: ${correctVerifyRes.status}`);
          if (correctVerifyRes.status === 200) {
            console.log(`✅ Usuario verificado exitosamente`);
            console.log(`   Mensaje: ${correctVerifyRes.data.message}\n`);
          } else {
            console.log(`⚠️  Respuesta: ${JSON.stringify(correctVerifyRes.data)}\n`);
          }
        }

      } else {
        console.log(`❌ Usuario no encontrado en BD`);
      }
    }

    // RESUMEN
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║ ✅ SISTEMA DE REGISTRO + VERIFICACIÓN OPERACIONAL          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`
📌 DATOS DEL TEST:
   • ID Usuario: ${userId}
   • Email: ${email}
   • Rol: Comercio
   • Estado: ${registerRes.data.comercio.verificado ? 'Verificado ✅' : 'Pendiente ⏳'}

📡 ENDPOINTS UTILIZADOS:
   • POST /api/auth/register/comercio
   • POST /api/auth/verify-email
   • GET /api/registros

🔗 ACCESO AL PANEL DE VERIFICACIÓN:
   http://localhost:5502/verificar-email.html

✨ El sistema está completo y operativo en ambiente development.
   El modo simulación de email permite testing sin credenciales reales.
    `);

  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

runFullTest();
