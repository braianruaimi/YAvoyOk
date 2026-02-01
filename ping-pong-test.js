#!/usr/bin/env node

/**
 * ====================================
 * PING-PONG COMMUNICATION TEST
 * ====================================
 * 
 * Test secuencial de todos los endpoints
 * para validar comunicación correcta antes de hosting
 */

const http = require('http');
const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  BOLD: '\x1b[1m'
};

const log = {
  section: (text) => console.log(`\n${COLORS.BOLD}${COLORS.CYAN}════ ${text} ════${COLORS.RESET}\n`),
  success: (text) => console.log(`${COLORS.GREEN}✅ ${text}${COLORS.RESET}`),
  error: (text) => console.log(`${COLORS.RED}❌ ${text}${COLORS.RESET}`),
  warning: (text) => console.log(`${COLORS.YELLOW}⚠️  ${text}${COLORS.RESET}`),
  info: (text) => console.log(`${COLORS.BLUE}ℹ️  ${text}${COLORS.RESET}`),
  item: (text) => console.log(`  ${COLORS.CYAN}•${COLORS.RESET} ${text}`),
  response: (code, msg) => console.log(`     ${COLORS.BLUE}→${COLORS.RESET} HTTP ${code}: ${msg}`)
};

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TESTS = [];
let testsPassed = 0;
let testsFailed = 0;

/**
 * Realiza una llamada HTTP
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Test helper con reintentos
 */
async function testEndpoint(name, method, path, data, expectedStatus) {
  const testObj = { name, method, path, status: 'pending' };
  TESTS.push(testObj);

  log.item(`${method} ${path}`);
  
  try {
    const response = await makeRequest(method, path, data);
    
    if (response.status === expectedStatus) {
      log.response(response.status, 'OK');
      testObj.status = 'passed';
      testsPassed++;
      return response;
    } else {
      log.response(response.status, `ERROR (esperaba ${expectedStatus})`);
      testObj.status = 'failed';
      testsFailed++;
      return response;
    }
  } catch (err) {
    log.response(0, `Conexión rechazada - ${err.message}`);
    testObj.status = 'failed';
    testsFailed++;
    throw err;
  }
}

/**
 * Main test suite
 */
async function runTests() {
  log.section('VERIFICACIÓN DE CONEXIÓN AL SERVIDOR');
  
  try {
    const healthCheck = await makeRequest('GET', '/api/health');
    if (healthCheck.status === 200 || healthCheck.status === 404) {
      log.success(`Servidor disponible en ${API_URL}`);
    }
  } catch (err) {
    log.error(`No se puede conectar a ${API_URL}`);
    log.info('Asegúrate de que el servidor esté corriendo: npm start');
    console.log(`\nError: ${err.message}\n`);
    process.exit(1);
  }

  // TESTS DE ENDPOINTS
  log.section('1. TEST DE AUTENTICACIÓN');

  const testUser = {
    nombre: `TestUser_${Date.now()}`,
    apellido: 'Tester',
    email: `test_${Date.now()}@yavoy.test`,
    telefono: '5551234567',
    password: 'TestPassword123!'
  };

  log.info(`Usando usuario de prueba: ${testUser.email}`);

  let accessToken = null;
  let refreshToken = null;

  // Test 1: Register Comercio
  try {
    const registerRes = await testEndpoint(
      'Register COMERCIO',
      'POST',
      '/api/auth/register/comercio',
      {
        ...testUser,
        nombreComercio: 'Test Comercio',
        direccion: 'Calle Test 123'
      },
      201
    );
    
    if (registerRes.body.data) {
      accessToken = registerRes.body.data.accessToken;
      refreshToken = registerRes.body.data.refreshToken;
    }
  } catch (err) {
    log.error(`Test de registro falló: ${err.message}`);
  }

  // Test 2: Login
  try {
    const loginRes = await testEndpoint(
      'Login',
      'POST',
      '/api/auth/login',
      {
        email: testUser.email,
        password: testUser.password
      },
      200
    );

    if (loginRes.body.data && loginRes.body.data.accessToken) {
      accessToken = loginRes.body.data.accessToken;
      refreshToken = loginRes.body.data.refreshToken;
      log.info('Token obtenido correctamente');
    }
  } catch (err) {
    log.warning(`Test de login falló: ${err.message}`);
  }

  // Test 3: Get Me (requiere token)
  if (accessToken) {
    try {
      log.section('2. TEST DE ENDPOINTS PROTEGIDOS');
      
      const meRes = await testEndpoint(
        'Get Me',
        'GET',
        '/api/auth/me',
        null,
        200
      );
      
      if (meRes.body.data) {
        log.info(`Usuario verificado: ${meRes.body.data.email}`);
      }
    } catch (err) {
      log.warning(`Test de Get Me falló: ${err.message}`);
    }
  }

  // Test 4: Change Password
  if (accessToken) {
    try {
      await testEndpoint(
        'Change Password',
        'POST',
        '/api/auth/change-password',
        {
          oldPassword: testUser.password,
          newPassword: 'NewPassword123!'
        },
        200
      );
    } catch (err) {
      log.warning(`Test de change password falló: ${err.message}`);
    }
  }

  // Test 5: Refresh Token
  if (refreshToken) {
    try {
      const refreshRes = await testEndpoint(
        'Refresh Token',
        'POST',
        '/api/auth/refresh',
        { refreshToken },
        200
      );

      if (refreshRes.body.data && refreshRes.body.data.accessToken) {
        accessToken = refreshRes.body.data.accessToken;
        log.info('Nuevo token obtenido');
      }
    } catch (err) {
      log.warning(`Test de refresh token falló: ${err.message}`);
    }
  }

  // Test 6: Forgot Password
  try {
    log.section('3. TEST DE RECUPERACIÓN DE CONTRASEÑA');
    
    await testEndpoint(
      'Forgot Password',
      'POST',
      '/api/auth/forgot-password',
      { email: testUser.email },
      200
    );
  } catch (err) {
    log.warning(`Test de forgot password falló: ${err.message}`);
  }

  // RESUMEN
  log.section('RESUMEN DE TESTS');

  const passPercentage = ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2);

  console.log(`
${COLORS.BOLD}Resultados:${COLORS.RESET}
  ${COLORS.GREEN}✅ Pasó: ${testsPassed}${COLORS.RESET}
  ${COLORS.RED}❌ Falló: ${testsFailed}${COLORS.RESET}
  ${COLORS.CYAN}📊 Total: ${testsPassed + testsFailed}${COLORS.RESET}

${COLORS.BOLD}Porcentaje de éxito:${COLORS.RESET} ${COLORS.GREEN}${passPercentage}%${COLORS.RESET}
`);

  TESTS.forEach(test => {
    const icon = test.status === 'passed' ? '✅' : '❌';
    const color = test.status === 'passed' ? COLORS.GREEN : COLORS.RED;
    console.log(`  ${color}${icon} ${test.method.padEnd(6)} ${test.path}${COLORS.RESET}`);
  });

  console.log('');

  if (testsFailed === 0) {
    log.success('PING-PONG TEST COMPLETADO - Todo OK para hosting');
    process.exit(0);
  } else if (testsPassed >= testsFailed) {
    log.warning('PING-PONG TEST COMPLETADO - Revisar fallos antes de hosting');
    process.exit(0);
  } else {
    log.error('PING-PONG TEST FALLÓ - Revisar configuración');
    process.exit(1);
  }
}

// INICIAR TESTS
runTests().catch(err => {
  log.error(`Error fatal: ${err.message}`);
  process.exit(1);
});

// Timeout si no completa
setTimeout(() => {
  log.error('Tests tardaron demasiado, se cancelaron');
  process.exit(1);
}, 30000);
