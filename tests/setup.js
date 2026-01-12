/**
 * YAvoy v3.1 Enterprise - Test Setup
 * Configuración global para todos los tests
 */

// Configurar timeout global
jest.setTimeout(30000);

// Variables globales para testing
global.testConfig = {
  baseURL: `http://localhost:${process.env.PORT || 5503}`,
  timeout: 30000,
  retries: 3
};

// Helper functions para tests
global.testHelpers = {
  // Generar token JWT válido para testing
  generateTestToken: () => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { 
        userId: 'test-user-123',
        role: 'comercio',
        email: 'test@yavoy.test'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },
  
  // Datos de prueba estándar
  getTestUser: () => ({
    id: 'test-user-123',
    email: 'test@yavoy.test',
    password: 'TestPassword123!',
    role: 'comercio',
    nombre: 'Test User'
  }),
  
  getTestPedido: () => ({
    id: 'test-pedido-123',
    comercioId: 'test-comercio-123',
    clienteId: 'test-cliente-123',
    productos: [
      { nombre: 'Test Producto', precio: 100, cantidad: 2 }
    ],
    total: 200,
    estado: 'pendiente'
  })
};

// Cleanup después de cada test
afterEach(() => {
  // Limpiar mocks
  jest.clearAllMocks();
});