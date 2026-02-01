#!/usr/bin/env node

/**
 * ====================================
 * DEEP SCAN - ANÁLISIS PROFUNDO DEL SISTEMA
 * ====================================
 * 
 * Verifica integridad de la estructura, imports, dependencias
 * y configuración antes de deploy a hosting
 */

const fs = require('fs');
const path = require('path');

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
  item: (text) => console.log(`  ${COLORS.CYAN}•${COLORS.RESET} ${text}`)
};

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

// 1. VERIFICACIÓN DE ARCHIVOS CRÍTICOS
log.section('1. VERIFICACIÓN DE ARCHIVOS CRÍTICOS');

const criticalFiles = [
  'server.js',
  'package.json',
  '.env.example',
  'models/Usuario.js',
  'models/Pedido.js',
  'config/database.js',
  'src/controllers/authController.js',
  'src/controllers/pedidosController.js',
  'src/controllers/ceoController.js',
  'src/middleware/auth.js',
  'src/middleware/security.js',
  'src/utils/emailService.js',
  'src/routes/authRoutes.js',
];

criticalFiles.forEach(file => {
  results.total++;
  if (fs.existsSync(file)) {
    log.success(`${file}`);
    results.passed++;
  } else {
    log.error(`${file} - NO ENCONTRADO`);
    results.failed++;
  }
});

// 2. VERIFICACIÓN DE ESTRUCTURA DE DIRECTORIOS
log.section('2. VERIFICACIÓN DE ESTRUCTURA DE DIRECTORIOS');

const directories = [
  'models',
  'config',
  'src',
  'src/controllers',
  'src/middleware',
  'src/utils',
  'src/routes',
  'registros',
  'scripts'
];

directories.forEach(dir => {
  results.total++;
  if (fs.existsSync(dir)) {
    log.success(`${dir}/`);
    results.passed++;
  } else {
    log.warning(`${dir}/ - No crítico`);
    results.warnings++;
  }
});

// 3. VERIFICACIÓN DE DEPENDENCIAS EN PACKAGE.JSON
log.section('3. VERIFICACIÓN DE DEPENDENCIAS');

try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = [
    'express', 'sequelize', 'pg', 'bcryptjs', 'jsonwebtoken',
    'nodemailer', 'cors', 'dotenv', 'socket.io'
  ];

  requiredDeps.forEach(dep => {
    results.total++;
    if (pkg.dependencies[dep] || pkg.devDependencies[dep]) {
      log.success(`${dep} - ${pkg.dependencies[dep] || pkg.devDependencies[dep]}`);
      results.passed++;
    } else {
      log.warning(`${dep} - No encontrado en package.json`);
      results.warnings++;
    }
  });
} catch (err) {
  results.failed++;
  log.error(`No se pudo leer package.json: ${err.message}`);
}

// 4. VERIFICACIÓN DE VARIABLES DE ENTORNO
log.section('4. VERIFICACIÓN DE VARIABLES DE ENTORNO');

const envVars = [
  'DB_NAME', 'DB_USER', 'DB_PASS', 'DB_HOST',
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS',
  'JWT_SECRET', 'FRONTEND_URL'
];

const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const exampleContent = fs.existsSync('.env.example') ? fs.readFileSync('.env.example', 'utf8') : '';

envVars.forEach(varName => {
  results.total++;
  const hasEnv = envContent.includes(varName);
  const hasExample = exampleContent.includes(varName);
  
  if (hasEnv && hasExample) {
    log.success(`${varName}`);
    results.passed++;
  } else if (!hasEnv && hasExample) {
    log.warning(`${varName} - Configurado en .env.example, falta en .env`);
    results.warnings++;
  } else {
    log.warning(`${varName} - No configurado`);
    results.warnings++;
  }
});

// 5. VERIFICACIÓN DE IMPORTS EN ARCHIVOS CRÍTICOS
log.section('5. VERIFICACIÓN DE IMPORTS');

const filesToCheck = [
  { file: 'models/Usuario.js', imports: ['sequelize', 'bcryptjs'] },
  { file: 'models/Pedido.js', imports: ['sequelize'] },
  { file: 'config/database.js', imports: ['sequelize', 'dotenv'] },
  { file: 'src/controllers/authController.js', imports: ['bcryptjs', 'crypto'] },
  { file: 'src/utils/emailService.js', imports: ['nodemailer'] },
];

filesToCheck.forEach(({ file, imports }) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    imports.forEach(imp => {
      results.total++;
      if (content.includes(`require('${imp}')`) || content.includes(`require("${imp}")`)) {
        log.success(`${path.basename(file)} → require('${imp}')`);
        results.passed++;
      } else {
        log.warning(`${path.basename(file)} → require('${imp}') no encontrado`);
        results.warnings++;
      }
    });
  }
});

// 6. VERIFICACIÓN DE MODELOS SEQUELIZE
log.section('6. VERIFICACIÓN DE MODELOS SEQUELIZE');

const modelChecks = [
  { file: 'models/Usuario.js', model: 'Usuario', fields: ['id', 'email', 'password', 'resetPasswordToken'] },
  { file: 'models/Pedido.js', model: 'Pedido', fields: ['id', 'clienteId', 'estado'] },
];

modelChecks.forEach(({ file, model, fields }) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    fields.forEach(field => {
      results.total++;
      if (content.includes(field)) {
        log.success(`${model}.${field}`);
        results.passed++;
      } else {
        log.error(`${model}.${field} - No encontrado`);
        results.failed++;
      }
    });
  }
});

// 7. VERIFICACIÓN DE ENDPOINTS
log.section('7. VERIFICACIÓN DE ENDPOINTS');

const routeChecks = [
  { file: 'src/routes/authRoutes.js', endpoints: ['/register/comercio', '/login', '/forgot-password', '/reset-password'] },
];

routeChecks.forEach(({ file, endpoints }) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    endpoints.forEach(endpoint => {
      results.total++;
      if (content.includes(endpoint) || content.includes(`'${endpoint}'`) || content.includes(`"${endpoint}"`)) {
        log.success(`${endpoint}`);
        results.passed++;
      } else {
        log.warning(`${endpoint} - No encontrado en rutas`);
        results.warnings++;
      }
    });
  }
});

// 8. VERIFICACIÓN DE SEGURIDAD
log.section('8. VERIFICACIÓN DE MEDIDAS DE SEGURIDAD');

const securityChecks = [
  { file: 'src/controllers/authController.js', check: 'bcrypt.hash', name: 'Hashing de contraseña' },
  { file: 'src/middleware/auth.js', check: 'jwt', name: 'JWT authentication' },
  { file: 'config/database.js', check: 'dialect: \'postgres\'', name: 'PostgreSQL dialect' },
  { file: 'src/utils/emailService.js', check: 'nodemailer.createTransport', name: 'SMTP configurado' },
];

securityChecks.forEach(({ file, check, name }) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    results.total++;
    if (content.includes(check)) {
      log.success(`${name}`);
      results.passed++;
    } else {
      log.warning(`${name} - No verificado`);
      results.warnings++;
    }
  }
});

// RESUMEN
log.section('RESUMEN DEL DEEP SCAN');

console.log(`
${COLORS.BOLD}Resultados:${COLORS.RESET}
  ${COLORS.GREEN}✅ Pasó: ${results.passed}${COLORS.RESET}
  ${COLORS.RED}❌ Falló: ${results.failed}${COLORS.RESET}
  ${COLORS.YELLOW}⚠️  Advertencias: ${results.warnings}${COLORS.RESET}
  ${COLORS.CYAN}📊 Total: ${results.total}${COLORS.RESET}

${COLORS.BOLD}Porcentaje de éxito:${COLORS.RESET} ${COLORS.GREEN}${((results.passed / results.total) * 100).toFixed(2)}%${COLORS.RESET}
`);

if (results.failed === 0 && results.warnings <= 5) {
  log.success('DEEP SCAN COMPLETADO - Sistema listo para siguiente fase');
  process.exit(0);
} else {
  log.warning('DEEP SCAN COMPLETADO - Revisar advertencias antes de continuar');
  process.exit(0);
}
