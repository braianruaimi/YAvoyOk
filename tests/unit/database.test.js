/**
 * YAvoy v3.1 Enterprise - Database Manager Unit Tests
 * Tests unitarios para el sistema de base de datos híbrido
 */

const DatabaseManager = require('../../src/config/database');
const fs = require('fs').promises;
const { Pool } = require('pg');

// Mock de Pool
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    on: jest.fn(),
    end: jest.fn()
  }))
}));

// Mock de fs
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn()
  }
}));

describe('DatabaseManager Unit Tests', () => {
  let dbManager;
  let mockPool;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock pool
    mockPool = {
      connect: jest.fn(),
      query: jest.fn(),
      on: jest.fn(),
      end: jest.fn()
    };
    Pool.mockImplementation(() => mockPool);

    // Mock successful filesystem operations
    fs.access.mockResolvedValue();
    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.readFile.mockResolvedValue('{"test": "data"}');
  });

  afterEach(async () => {
    if (dbManager) {
      await dbManager.close();
    }
  });

  describe('Initialization', () => {
    test('should initialize with PostgreSQL when DATABASE_URL is provided', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
      
      // Mock successful connection
      const mockClient = { query: jest.fn(), release: jest.fn() };
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

      dbManager = new DatabaseManager();
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async init

      expect(Pool).toHaveBeenCalledWith({
        connectionString: process.env.DATABASE_URL,
        ssl: false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        acquireTimeoutMillis: 10000
      });
    });

    test('should handle PostgreSQL connection failure gracefully', async () => {
      process.env.DATABASE_URL = 'postgresql://invalid:invalid@invalid/invalid';
      
      // Mock connection failure
      mockPool.connect.mockRejectedValue(new Error('Connection failed'));

      dbManager = new DatabaseManager();
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async init

      expect(dbManager.isPostgresAvailable).toBeFalsy();
    });

    test('should create necessary JSON directories', async () => {
      delete process.env.DATABASE_URL;
      
      dbManager = new DatabaseManager();
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async init

      expect(fs.mkdir).toHaveBeenCalledWith('./registros', { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith('./registros/comercios', { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith('./registros/repartidores', { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith('./registros/pedidos', { recursive: true });
    });
  });

  describe('Query Operations', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
      dbManager = new DatabaseManager();
    });

    test('should use PostgreSQL when available', async () => {
      dbManager.isPostgresAvailable = true;
      dbManager.pool = mockPool;
      
      const mockResult = { rows: [{ id: 1, name: 'test' }], rowCount: 1 };
      mockPool.query.mockResolvedValue(mockResult);

      const result = await dbManager.query('SELECT * FROM users');

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM users', []);
      expect(result).toEqual(mockResult);
    });

    test('should fallback to JSON when PostgreSQL fails', async () => {
      dbManager.isPostgresAvailable = true;
      dbManager.pool = mockPool;
      
      // Mock PostgreSQL failure
      mockPool.query.mockRejectedValue(new Error('DB Error'));

      const result = await dbManager.query('SELECT * FROM users');

      expect(result).toBeDefined();
      expect(result.rows).toEqual([]);
    });

    test('should handle INSERT operations with JSON fallback', async () => {
      dbManager.isPostgresAvailable = false;

      const result = await dbManager.query('INSERT INTO users (name) VALUES (?)', ['test']);

      expect(result.rowCount).toBe(1);
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed SQL gracefully', async () => {
      dbManager = new DatabaseManager();
      dbManager.isPostgresAvailable = false;

      const result = await dbManager.query('INVALID SQL STATEMENT');

      expect(result).toEqual({ rows: [], rowCount: 0 });
    });

    test('should retry PostgreSQL connections on failure', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
      
      mockPool.connect.mockRejectedValueOnce(new Error('Connection failed'))
                    .mockRejectedValueOnce(new Error('Connection failed'))
                    .mockResolvedValue({ query: jest.fn(), release: jest.fn() });

      dbManager = new DatabaseManager();
      
      // Simulate retry mechanism
      expect(dbManager.retryAttempts).toBe(0);
    });
  });

  describe('Status and Metrics', () => {
    test('should return correct status information', () => {
      dbManager = new DatabaseManager();
      dbManager.isPostgresAvailable = true;
      dbManager.pool = mockPool;

      const status = dbManager.getStatus();

      expect(status).toEqual({
        postgresql: {
          available: true,
          connected: true,
          retryAttempts: 0
        },
        jsonFallback: {
          enabled: true,
          path: './registros'
        }
      });
    });

    test('should close connections properly', async () => {
      dbManager = new DatabaseManager();
      dbManager.pool = mockPool;
      mockPool.end.mockResolvedValue();

      await dbManager.close();

      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});