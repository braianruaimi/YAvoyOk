/**
 * YAvoy v3.1 Enterprise - Jest Configuration
 * Configuración de testing para Node.js y APIs
 */

module.exports = {
  // Entorno de testing
  testEnvironment: 'node',
  
  // Directorios de tests
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    'middleware/**/*.js',
    'config/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!**/node_modules/**'
  ],
  
  // Umbrales de coverage
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Transformaciones
  transform: {},
  
  // Variables de entorno para testing
  setupFiles: ['<rootDir>/tests/env.setup.js'],
  
  // Patrones de archivos a ignorar
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/backups/',
    '<rootDir>/coverage/'
  ],
  
  // Verbose output
  verbose: true,
  
  // Detectar tests abiertos
  detectOpenHandles: true,
  
  // Forzar salida después de tests
  forceExit: true,
  
  // Reporters personalizados
  reporters: [
    'default'
  ]
};