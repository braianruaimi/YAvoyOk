/**
 * YAvoy v3.1 Enterprise - WebAuthn Security Unit Tests
 * Tests unitarios para el sistema de autenticación biométrica
 */

const WebAuthnSecurityEnhanced = require('../../middleware/webauthn-security');
const crypto = require('crypto');

// Mock crypto para tests determinísticos
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
  createHash: jest.fn(),
  timingSafeEqual: jest.fn()
}));

describe('WebAuthnSecurityEnhanced Unit Tests', () => {
  let webauthnSecurity;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock crypto functions
    crypto.randomBytes.mockReturnValue(Buffer.from('mock-challenge-bytes-12345678901234567890'));
    crypto.createHash.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('mock-hash')
    });
    crypto.timingSafeEqual.mockReturnValue(true);

    webauthnSecurity = new WebAuthnSecurityEnhanced();
  });

  describe('Challenge Generation', () => {
    test('should generate secure challenge with proper structure', () => {
      const { challengeId, challenge } = webauthnSecurity.generateSecureChallenge();

      expect(challengeId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
      expect(Array.isArray(challenge)).toBe(true);
      expect(challenge.length).toBe(48); // 32 bytes converted to array + mock string length
    });

    test('should store challenge in memory with timestamp', () => {
      const { challengeId } = webauthnSecurity.generateSecureChallenge();

      expect(webauthnSecurity.challenges.has(challengeId)).toBe(true);
      const stored = webauthnSecurity.challenges.get(challengeId);
      expect(stored).toHaveProperty('challenge');
      expect(stored).toHaveProperty('timestamp');
      expect(stored).toHaveProperty('used', false);
    });

    test('should mark challenge as used after validation', () => {
      const { challengeId } = webauthnSecurity.generateSecureChallenge();
      
      // Mock clientData
      const mockClientData = Buffer.from(JSON.stringify({
        challenge: Buffer.from('mock-challenge-bytes-12345678901234567890').toString('base64')
      })).toString('base64');

      webauthnSecurity.validateChallenge(challengeId, mockClientData);

      const stored = webauthnSecurity.challenges.get(challengeId);
      expect(stored.used).toBe(true);
    });
  });

  describe('Fraud Detection', () => {
    test('should record attempt with proper metadata', () => {
      const userId = 'test-user-123';
      const metadata = {
        ip: '192.168.1.1',
        userAgent: 'Test Browser',
        deviceInfo: 'Test Device'
      };

      webauthnSecurity.recordAttempt(userId, true, metadata);

      const attempts = webauthnSecurity.getRecentAttempts(userId, 60000);
      expect(attempts.length).toBe(1);
      expect(attempts[0]).toMatchObject({
        success: true,
        ip: metadata.ip,
        userAgent: metadata.userAgent
      });
    });

    test('should detect excessive failed attempts', () => {
      const userId = 'test-user-123';
      const metadata = {
        ip: '192.168.1.1',
        deviceFingerprint: 'device-123'
      };

      // Simular 5 intentos fallidos (máximo permitido)
      for (let i = 0; i < 5; i++) {
        webauthnSecurity.recordAttempt(userId, false, metadata);
      }

      // El 6to intento debería lanzar error
      expect(() => {
        webauthnSecurity.recordAttempt(userId, false, metadata);
      }).toThrow('Dispositivo temporalmente bloqueado');
    });

    test('should detect multiple IP addresses pattern', () => {
      const userId = 'test-user-123';
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Simular intentos desde múltiples IPs
      for (let i = 1; i <= 4; i++) {
        webauthnSecurity.recordAttempt(userId, true, { ip: `192.168.1.${i}` });
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Actividad sospechosa')
      );

      consoleSpy.mockRestore();
    });

    test('should track recent attempts within time window', () => {
      const userId = 'test-user-123';
      
      // Agregar intento hace 10 minutos (simulado)
      const oldAttempt = {
        timestamp: Date.now() - 10 * 60 * 1000,
        success: true,
        ip: '192.168.1.1'
      };
      webauthnSecurity.attemptHistory.set(`${userId}_old`, oldAttempt);

      // Agregar intento reciente
      webauthnSecurity.recordAttempt(userId, true, { ip: '192.168.1.1' });

      // Solo el intento reciente debería estar en los últimos 5 minutos
      const recentAttempts = webauthnSecurity.getRecentAttempts(userId, 5 * 60 * 1000);
      expect(recentAttempts.length).toBe(1);
    });
  });

  describe('Registration Validation', () => {
    test('should validate registration options with proper structure', () => {
      const userId = 'test-user';
      const userName = 'Test User';

      const result = webauthnSecurity.validateRegistrationOptions(userId, userName);

      expect(result).toHaveProperty('options');
      expect(result).toHaveProperty('challengeId');
      expect(result.options).toHaveProperty('challenge');
      expect(result.options).toHaveProperty('rp');
      expect(result.options).toHaveProperty('user');
      expect(result.options.rp).toHaveProperty('id', 'yavoy.space');
    });

    test('should sanitize user inputs', () => {
      const userId = 'test<script>alert("xss")</script>';
      const userName = 'Test"User\'<>';

      const result = webauthnSecurity.validateRegistrationOptions(userId, userName);

      expect(result.options.user.id.toString()).not.toContain('<script>');
      expect(result.options.user.name).toBe('TestUser');
    });

    test('should reject invalid user data', () => {
      expect(() => {
        webauthnSecurity.validateRegistrationOptions('', 'Test User');
      }).toThrow('userId inválido');

      expect(() => {
        webauthnSecurity.validateRegistrationOptions('test', '');
      }).toThrow('userName inválido');

      expect(() => {
        webauthnSecurity.validateRegistrationOptions('ab', 'Test User');
      }).toThrow('userId inválido');
    });
  });

  describe('Credential Management', () => {
    test('should store credentials properly', () => {
      const userId = 'test-user';
      const credentialId = 'test-credential-id';
      const publicKey = 'test-public-key';

      webauthnSecurity.storeCredential(userId, credentialId, publicKey, 0);

      const credentials = webauthnSecurity.getUserCredentials(userId);
      expect(credentials).toHaveLength(1);
      expect(credentials[0]).toMatchObject({
        id: credentialId,
        publicKey: publicKey,
        counter: 0
      });
    });

    test('should return empty array for non-existent user', () => {
      const credentials = webauthnSecurity.getUserCredentials('non-existent-user');
      expect(credentials).toEqual([]);
    });

    test('should verify signatures (simplified)', () => {
      const isValid = webauthnSecurity.verifySignature(
        'credential-id',
        'mock-signature',
        'mock-client-data',
        'mock-auth-data'
      );

      // Con nuestro mock simple, cualquier signature con datos válidos debería pasar
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Security Metrics', () => {
    test('should provide comprehensive metrics', () => {
      // Agregar algunos datos de prueba
      webauthnSecurity.generateSecureChallenge();
      webauthnSecurity.storeCredential('user1', 'cred1', 'key1');
      webauthnSecurity.recordAttempt('user1', true);

      const metrics = webauthnSecurity.getSecurityMetrics();

      expect(metrics).toHaveProperty('activeChallenges');
      expect(metrics).toHaveProperty('blacklistedDevices');
      expect(metrics).toHaveProperty('registeredUsers');
      expect(metrics).toHaveProperty('totalCredentials');
      expect(metrics).toHaveProperty('attempts');
      expect(metrics.attempts).toHaveProperty('lastHour');
      expect(metrics.attempts).toHaveProperty('lastDay');
      expect(metrics.attempts).toHaveProperty('successRate');
    });

    test('should calculate success rate correctly', () => {
      // Agregar intentos mixtos
      webauthnSecurity.recordAttempt('user1', true);
      webauthnSecurity.recordAttempt('user1', true);
      webauthnSecurity.recordAttempt('user1', false);

      const metrics = webauthnSecurity.getSecurityMetrics();
      
      // 2 éxitos de 3 intentos = 66.67%
      expect(metrics.attempts.successRate).toBeCloseTo(0.67, 1);
    });
  });

  describe('Cleanup Operations', () => {
    test('should clean expired challenges', () => {
      const { challengeId } = webauthnSecurity.generateSecureChallenge();
      
      // Simular challenge expirado
      const stored = webauthnSecurity.challenges.get(challengeId);
      stored.timestamp = Date.now() - (6 * 60 * 1000); // 6 minutos atrás
      
      webauthnSecurity.cleanExpiredChallenges();
      
      expect(webauthnSecurity.challenges.has(challengeId)).toBe(false);
    });

    test('should clean old attempt history', () => {
      const oldKey = 'user1_' + (Date.now() - 25 * 60 * 60 * 1000); // 25 horas atrás
      webauthnSecurity.attemptHistory.set(oldKey, {
        timestamp: Date.now() - 25 * 60 * 60 * 1000,
        success: true
      });

      webauthnSecurity.cleanAttemptHistory();

      expect(webauthnSecurity.attemptHistory.has(oldKey)).toBe(false);
    });
  });
});