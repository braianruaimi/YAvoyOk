/**
 * 🎯 CONFIGURACIÓN MERCADOPAGO - YAvoy 2026
 * 
 * Configuración completa para integración con MercadoPago
 * Incluye manejo de environment variables y fallbacks seguros
 */

// Configuración principal
const MERCADOPAGO_CONFIG = {
  // PRODUCTION KEYS (usar en yavoy.space)
  PRODUCTION: {
    ACCESS_TOKEN: (typeof process !== 'undefined' && process.env && process.env.MERCADOPAGO_ACCESS_TOKEN) || 'APP_USR-tu_access_token_aqui',
    PUBLIC_KEY: (typeof process !== 'undefined' && process.env && process.env.MERCADOPAGO_PUBLIC_KEY) || 'APP_USR-tu_public_key_aqui',
    WEBHOOK_SECRET: (typeof process !== 'undefined' && process.env && process.env.MERCADOPAGO_WEBHOOK_SECRET) || 'tu_webhook_secret_aqui'
  },
  
  // TEST KEYS (para desarrollo)
  TEST: {
    ACCESS_TOKEN: (typeof process !== 'undefined' && process.env && process.env.MERCADOPAGO_TEST_ACCESS_TOKEN) || 'TEST-tu_test_token_aqui',
    PUBLIC_KEY: (typeof process !== 'undefined' && process.env && process.env.MERCADOPAGO_TEST_PUBLIC_KEY) || 'TEST-tu_test_public_key_aqui',
    WEBHOOK_SECRET: (typeof process !== 'undefined' && process.env && process.env.MERCADOPAGO_TEST_WEBHOOK_SECRET) || 'test_webhook_secret'
  }
};

// Detectar ambiente
const isProduction = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') || 
                    (typeof process !== 'undefined' && process.env && process.env.MERCADOPAGO_ENV === 'production');

// Configuración activa
const activeConfig = isProduction ? MERCADOPAGO_CONFIG.PRODUCTION : MERCADOPAGO_CONFIG.TEST;

module.exports = {
  // Configuración principal
  ACCESS_TOKEN: activeConfig.ACCESS_TOKEN,
  PUBLIC_KEY: activeConfig.PUBLIC_KEY,
  WEBHOOK_SECRET: activeConfig.WEBHOOK_SECRET,
  
  // URLs base
  API_BASE_URL: isProduction 
    ? 'https://api.mercadopago.com'
    : 'https://api.mercadopago.com', // Usar la misma para ambos
  
  // Configuración de QR
  QR_CONFIG: {
    EXTERNAL_REFERENCE_PREFIX: 'YAVOY_',
    DESCRIPTION_PREFIX: 'YAvoy - Pedido #',
    EXPIRATION_MINUTES: 15,
    AUTO_RETURN: 'approved',
    
    // URLs de callback (ajustar según tu dominio)
    SUCCESS_URL: isProduction 
      ? 'https://yavoy.space/pago-exitoso'
      : 'http://localhost:3000/pago-exitoso',
    FAILURE_URL: isProduction 
      ? 'https://yavoy.space/pago-fallido'
      : 'http://localhost:3000/pago-fallido',
    PENDING_URL: isProduction 
      ? 'https://yavoy.space/pago-pendiente'
      : 'http://localhost:3000/pago-pendiente',
    
    // Webhook URL
    WEBHOOK_URL: isProduction 
      ? 'https://yavoy.space/api/mercadopago/webhook'
      : 'http://localhost:3000/api/mercadopago/webhook'
  },
  
  // Configuración de pagos
  PAYMENT_CONFIG: {
    CURRENCY: 'ARS',
    INSTALLMENTS: 1,
    CAPTURE: true,
    
    // Métodos de pago permitidos
    PAYMENT_METHODS: {
      excluded_payment_methods: [
        // { id: 'visa' } // Ejemplo: excluir visa
      ],
      excluded_payment_types: [
        // { id: 'ticket' } // Ejemplo: excluir efectivo
      ]
    }
  },
  
  // Headers para requests
  getHeaders: () => ({
    'Authorization': `Bearer ${activeConfig.ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'X-Idempotency-Key': Date.now().toString()
  }),
  
  // Validar configuración
  validate: () => {
    const errors = [];
    
    if (!activeConfig.ACCESS_TOKEN || activeConfig.ACCESS_TOKEN.includes('tu_')) {
      errors.push('ACCESS_TOKEN no configurado');
    }
    
    if (!activeConfig.PUBLIC_KEY || activeConfig.PUBLIC_KEY.includes('tu_')) {
      errors.push('PUBLIC_KEY no configurado');
    }
    
    if (!activeConfig.WEBHOOK_SECRET || activeConfig.WEBHOOK_SECRET.includes('tu_')) {
      errors.push('WEBHOOK_SECRET no configurado');
    }
    
    if (errors.length > 0) {
      console.warn('⚠️  Configuración MercadoPago incompleta:', errors);
      console.log('💡 Para configurar correctamente:');
      console.log('1. Obtén tus credenciales en: https://www.mercadopago.com.ar/developers/panel');
      console.log('2. Agrega las variables de entorno o modifica este archivo');
      console.log('3. Reinicia el servidor');
      return false;
    }
    
    console.log('✅ MercadoPago configurado correctamente');
    console.log(`🌍 Ambiente: ${isProduction ? 'PRODUCTION' : 'TEST'}`);
    return true;
  },
  
  // Información del ambiente actual
  environment: {
    isProduction,
    accessTokenType: activeConfig.ACCESS_TOKEN.startsWith('APP_USR') ? 'PRODUCTION' : 'TEST'
  }
};