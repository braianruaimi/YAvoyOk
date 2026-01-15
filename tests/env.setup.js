/**
 * YAvoy v3.1 Enterprise - Test Environment Setup
 * Variables de entorno para testing
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_yavoy_testing_only';
process.env.PORT = '5503'; // Puerto diferente para testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/yavoy_test';

// Configuraciones específicas para testing
process.env.EMAIL_HOST = 'test.smtp.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@yavoy.test';
process.env.EMAIL_PASS = 'test_password';

// Deshabilitar clustering en tests
process.env.ENABLE_CLUSTERING = 'false';

// Configurar timeout más alto para tests
process.env.TEST_TIMEOUT = '30000';