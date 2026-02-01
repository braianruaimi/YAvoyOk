#!/usr/bin/env node

/**
 * Script de prueba para sistema de registro con email
 * Uso: node test-email-registration.js
 */

const http = require('http');

// Configuración
const API_HOST = 'localhost';
const API_PORT = 5502;

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log(colors.cyan + colors.bright, `  ${title}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: body });
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

async function runTests() {
  header('🧪 TEST: Sistema de Registro con Email - YAvoy');

  log(colors.yellow, '⚠️  IMPORTANTE:');
  log(colors.yellow, '   • El servidor debe estar corriendo en puerto 5502');
  log(colors.yellow, '   • npm start o npm run dev\n');

  // Test 1: Registrar comercio
  header('1️⃣  Registrando nuevo comercio...');
  
  const comercioData = {
    nombre: 'Test Pizzería',
    email: `pizzeria-test-${Date.now()}@example.com`,
    password: 'TestPassword123',
    telefono: '+5491234567890',
    rubro: 'pizza'
  };

  log(colors.blue, `📝 Datos a registrar:`);
  console.log(JSON.stringify(comercioData, null, 2));

  try {
    const registerRes = await makeRequest('POST', '/api/auth/register/comercio', comercioData);
    
    if (registerRes.status === 201 || registerRes.status === 200) {
      log(colors.green, '✅ Comercio registrado exitosamente!');
      console.log(JSON.stringify(registerRes.body, null, 2));
      
      const userId = registerRes.body.comercio?.id;
      const emailStatus = registerRes.body.emailStatus;
      
      if (userId) {
        log(colors.green, `\n✅ ID asignado: ${userId}`);
        log(colors.green, `✅ Email: ${emailStatus === 'enviado' ? 'ENVIADO ✉️' : 'Modo desarrollo (simulado)'}`);
        
        // Test 2: Simular código (en desarrollo)
        header('2️⃣  Verificando email con código de prueba...');
        
        log(colors.yellow, '📌 En modo desarrollo, usa un código de 6 dígitos (ej: 123456)');
        log(colors.blue, `\n🆔 ID Usuario: ${userId}`);
        
        // Aquí iría la verificación real, pero como es para demostración:
        log(colors.yellow, '\n💡 Para verificar en producción:');
        log(colors.yellow, '   1. Revisar email recibido');
        log(colors.yellow, '   2. Copiar código de 6 dígitos');
        log(colors.yellow, '   3. Ingresar en verificar-email.html');
        
        // Demostración de respuesta exitosa
        log(colors.cyan, '\n📋 Ejemplo de respuesta exitosa al verificar:');
        const successExample = {
          success: true,
          message: 'Email verificado exitosamente',
          usuario: {
            id: userId,
            nombre: comercioData.nombre,
            email: comercioData.email,
            verificado: true
          }
        };
        console.log(JSON.stringify(successExample, null, 2));
      }
    } else {
      log(colors.red, '❌ Error al registrar comercio');
      log(colors.red, `Status: ${registerRes.status}`);
      console.log(registerRes.body);
    }
  } catch (error) {
    log(colors.red, `\n❌ Error de conexión: ${error.message}`);
    log(colors.red, '⚠️  ¿El servidor está corriendo en puerto 5502?');
    log(colors.red, '    Ejecuta: npm start o npm run dev');
  }

  header('📚 ENDPOINTS DISPONIBLES');
  
  log(colors.cyan, 'Registro:');
  log(colors.yellow, '  POST /api/auth/register/comercio');
  log(colors.yellow, '  POST /api/auth/register/repartidor');
  
  log(colors.cyan, '\nVerificación:');
  log(colors.yellow, '  POST /api/auth/verify-email');
  log(colors.yellow, '  POST /api/auth/resend-confirmation');
  
  log(colors.cyan, '\nFrontend:');
  log(colors.yellow, '  http://localhost:5502/verificar-email.html');

  header('📧 CONFIGURACIÓN DE EMAIL');
  
  log(colors.yellow, 'Variables de entorno necesarias (.env):');
  log(colors.cyan, '  SMTP_USER=tu-email@gmail.com');
  log(colors.cyan, '  SMTP_PASS=tu-contraseña-app-google');
  log(colors.cyan, '  SMTP_SECURE=true');
  log(colors.cyan, '  SMTP_TLS=true');
  
  log(colors.yellow, '\nSin configuración = modo desarrollo (emails simulados en consola)');

  header('📖 DOCUMENTACIÓN');
  log(colors.cyan, 'Ver: SISTEMA_REGISTRO_EMAIL.md\n');
}

// Ejecutar tests
runTests().catch(error => {
  log(colors.red, `\n❌ Error fatal: ${error.message}`);
  process.exit(1);
});
