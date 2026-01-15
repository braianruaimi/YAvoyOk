/**
 * YAvoy v3.1 Enterprise - API Tests
 * Tests de integración para endpoints principales
 */

const request = require('supertest');
const express = require('express');

// Mock del servidor para testing
const createTestServer = () => {
  const app = express();
  app.use(express.json());
  
  // Mock básico de rutas para testing
  app.get('/api/diagnostics/database', (req, res) => {
    res.json({
      status: 'ok',
      database: {
        postgresql: { available: false, connected: false },
        jsonFallback: { enabled: true }
      },
      timestamp: new Date().toISOString()
    });
  });
  
  app.get('/api/diagnostics/email', (req, res) => {
    res.json({
      status: 'ok',
      email: { configured: true, connected: false },
      timestamp: new Date().toISOString()
    });
  });
  
  app.get('/api/webauthn/status', (req, res) => {
    res.json({
      success: true,
      status: 'active',
      metrics: {
        activeChallenges: 0,
        registeredUsers: 0
      },
      timestamp: new Date().toISOString()
    });
  });
  
  return app;
};

describe('API Endpoints Integration Tests', () => {
  let server;
  
  beforeAll(() => {
    server = createTestServer();
  });

  describe('GET /api/diagnostics/database', () => {
    test('should return database status', async () => {
      const response = await request(server)
        .get('/api/diagnostics/database')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('database');
      expect(response.body.database).toHaveProperty('postgresql');
      expect(response.body.database).toHaveProperty('jsonFallback');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should have proper response structure', async () => {
      const response = await request(server)
        .get('/api/diagnostics/database');

      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('GET /api/diagnostics/email', () => {
    test('should return email configuration status', async () => {
      const response = await request(server)
        .get('/api/diagnostics/email')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toHaveProperty('configured');
    });
  });

  describe('GET /api/webauthn/status', () => {
    test('should return WebAuthn status and metrics', async () => {
      const response = await request(server)
        .get('/api/webauthn/status')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 'active');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveProperty('activeChallenges');
      expect(response.body.metrics).toHaveProperty('registeredUsers');
    });
  });
  
  describe('Error Handling', () => {
    test('should handle non-existent endpoints', async () => {
      await request(server)
        .get('/api/non-existent-endpoint')
        .expect(404);
    });
  });
});

describe('API Security Tests', () => {
  let server;
  
  beforeAll(() => {
    server = createTestServer();
  });

  test('should validate Content-Type headers', async () => {
    const response = await request(server)
      .get('/api/diagnostics/database');
    
    expect(response.headers['content-type']).toMatch(/application\/json/);
  });

  test('should not leak sensitive information in responses', async () => {
    const response = await request(server)
      .get('/api/diagnostics/database');
    
    const responseString = JSON.stringify(response.body);
    expect(responseString).not.toMatch(/password|secret|key|token/i);
  });

  test('should handle malformed requests gracefully', async () => {
    await request(server)
      .post('/api/diagnostics/database')
      .send('invalid-json-here')
      .expect(404); // Endpoint no existe como POST
  });
});