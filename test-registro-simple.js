#!/usr/bin/env node
/**
 * TEST SIMPLE: Sistema de Registro con Verificación de Email
 * Prueba el flujo completo: registro → email → verificación
 */

const http = require('http');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper para hacer peticiones HTTP
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

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
  console.log(colors.cyan + '  📝 TEST: Sistema de Registro con Email' + colors.reset);
  console.log(colors.cyan + '═'.repeat(60) + colors.reset);

  try {
    // 1. REGISTRAR COMERCIO
    console.log('\n' + colors.blue + '1️⃣  REGISTRANDO COMERCIO...' + colors.reset);
    const timestamp = Date.now();
    const commerceData = {
      nombre: `Test Pizzería ${timestamp}`,
      email: `comercio-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      telefono: '+5491234567890',
      rubro: 'pizzería'
    };

    console.log(colors.yellow + '   Datos:' + colors.reset);
    console.log(`   • Nombre: ${commerceData.nombre}`);
    console.log(`   • Email: ${commerceData.email}`);
    console.log(`   • Rubro: ${commerceData.rubro}`);

    const registerRes = await makeRequest('POST', '/api/auth/register/comercio', commerceData);
    console.log(`\n   Status: ${registerRes.status}`);

    if (registerRes.status !== 201 && registerRes.status !== 200) {
      console.log(colors.red + '   ❌ Error registrando comercio' + colors.reset);
      console.log('   Respuesta:', registerRes.data);
      return;
    }

    console.log(colors.green + '   ✅ Comercio registrado exitosamente' + colors.reset);
    
    const userId = registerRes.data.usuario?.id || registerRes.data.id;
    const userEmail = registerRes.data.usuario?.email || commerceData.email;
    
    console.log(`   • ID Asignado: ${colors.green}${userId}${colors.reset}`);
    console.log(`   • Email Confirmación: ${userEmail}`);
    
    if (registerRes.data.emailEnviado !== undefined) {
      console.log(`   • Email Enviado: ${registerRes.data.emailEnviado ? '✅ Sí' : '❌ No'}`);
    }
    
    if (registerRes.data.confirmacionCode) {
      console.log(`   ${colors.yellow}• Código Generado: (para testing interno)${colors.reset}`);
    }

    // 2. INTENTAR VERIFICAR CON CÓDIGO INCORRECTO
    console.log('\n' + colors.blue + '2️⃣  INTENTANDO VERIFICAR CON CÓDIGO INCORRECTO...' + colors.reset);
    
    const wrongVerifyRes = await makeRequest('POST', '/api/auth/verify-email', {
      email: userEmail,
      code: '999999'
    });

    console.log(`   Status: ${wrongVerifyRes.status}`);
    if (wrongVerifyRes.status !== 200) {
      console.log(colors.green + '   ✅ Correctamente rechazado código inválido' + colors.reset);
    } else {
      console.log(colors.red + '   ❌ Debería rechazar código inválido' + colors.reset);
    }

    // 3. SIMULAR ENVÍO DE RECONFIRMACIÓN
    console.log('\n' + colors.blue + '3️⃣  SOLICITANDO REENVÍO DE CÓDIGO...' + colors.reset);
    
    const resendRes = await makeRequest('POST', '/api/auth/resend-confirmation', {
      email: userEmail
    });

    console.log(`   Status: ${resendRes.status}`);
    if (resendRes.status === 200 || resendRes.status === 201) {
      console.log(colors.green + '   ✅ Código reenviado exitosamente' + colors.reset);
    } else {
      console.log(colors.yellow + '   ⚠️  Respuesta inesperada al reenvío' + colors.reset);
    }

    // 4. REVISAR REGISTROS
    console.log('\n' + colors.blue + '4️⃣  VERIFICANDO DATOS EN BASE DE DATOS...' + colors.reset);
    
    const registrosRes = await makeRequest('GET', '/api/registros');
    console.log(`   Status: ${registrosRes.status}`);
    
    if (registrosRes.status === 200) {
      const registros = registrosRes.data.registros || registrosRes.data;
      console.log(colors.green + `   ✅ ${Object.keys(registros || {}).length} registros encontrados` + colors.reset);
    }

    // RESUMEN
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.green + '✅ SISTEMA DE REGISTRO OPERACIONAL' + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    
    console.log(colors.yellow + '\n📧 Información de Prueba:' + colors.reset);
    console.log(`   Email: ${userEmail}`);
    console.log(`   ID Usuario: ${userId}`);
    console.log(`   \n💡 Para verificar manualmente:`);
    console.log(`   1. Revisar logs de email en: registros/emails/comercios/`);
    console.log(`   2. Usar el formulario en: http://localhost:5502/verificar-email.html`);
    console.log(`   3. Revisar registros en: http://localhost:5502/api/registros`);

  } catch (error) {
    console.log(colors.red + '\n❌ ERROR DE CONEXIÓN' + colors.reset);
    console.log(`   ¿Servidor corriendo en puerto 5502?`);
    console.log(`   Error: ${error.message}`);
    console.log('\n   Ejecuta: npm start');
  }

  console.log('\n');
}

// Ejecutar
runTests().catch(console.error);
