/**
 * YAvoy v3.1 Enterprise - Auth Controller Unit Tests
 * Tests para los métodos de autenticación, registro y login
 */

const authController = require('../../src/controllers/authController');
const Usuario = require('../../models/Usuario');
const emailService = require('../../src/utils/emailService');
const { generateToken, generateRefreshToken } = require('../../src/middleware/auth');
const bcrypt = require('bcryptjs');

// Mocks
jest.mock('../../models/Usuario');
jest.mock('../../src/utils/emailService');
jest.mock('../../src/middleware/auth');
jest.mock('bcryptjs');

describe('AuthController Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    // Reset todos los mocks
    jest.clearAllMocks();
    
    // Setup mock req/res
    req = {
      body: {},
      params: {},
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };
  });

  describe('registerComercio', () => {
    test('debería registrar un comercio exitosamente', async () => {
      // Arrange
      req.body = {
        nombre: 'Mi Super Comercio',
        email: 'comercio@test.com',
        telefono: '1234567890',
        direccion: 'Calle 1, Buenos Aires',
        password: 'SecurePassword123!',
        rubro: 'alimentos'
      };

      const mockComercio = {
        id: 'COM123456',
        nombre: 'Mi Super Comercio',
        email: 'comercio@test.com',
        tipo: 'COMERCIO',
        toJSON: jest.fn().mockReturnValue({
          id: 'COM123456',
          nombre: 'Mi Super Comercio',
          email: 'comercio@test.com'
        })
      };

      Usuario.findOne.mockResolvedValue(null); // Email no existe
      Usuario.create.mockResolvedValue(mockComercio);
      emailService.sendRegistrationEmail.mockResolvedValue({
        success: true,
        confirmationCode: 'ABC123'
      });
      generateToken.mockReturnValue('token_mock_123');
      generateRefreshToken.mockReturnValue('refresh_token_mock_123');

      // Act
      await authController.registerComercio(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('registrado'),
        token: 'token_mock_123',
        refreshToken: 'refresh_token_mock_123'
      }));
    });

    test('debería rechazar si faltan datos obligatorios', async () => {
      req.body = {
        nombre: 'Mi Comercio'
        // Faltan email y password
      };

      await authController.registerComercio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Datos incompletos'
      }));
    });

    test('debería validar formato de email', async () => {
      req.body = {
        nombre: 'Mi Comercio',
        email: 'email_invalido',
        password: 'SecurePassword123!'
      };

      await authController.registerComercio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Email inválido'
      }));
    });

    test('debería rechazar contraseñas débiles (< 8 caracteres)', async () => {
      req.body = {
        nombre: 'Mi Comercio',
        email: 'comercio@test.com',
        password: '123'
      };

      await authController.registerComercio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Contraseña débil'
      }));
    });

    test('debería rechazar si el email ya existe', async () => {
      req.body = {
        nombre: 'Mi Comercio',
        email: 'comercio@test.com',
        password: 'SecurePassword123!'
      };

      Usuario.findOne.mockResolvedValue({ 
        id: 'COM999', 
        email: 'comercio@test.com' 
      });

      await authController.registerComercio(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Email duplicado'
      }));
    });

    test('debería manejar errores de servidor', async () => {
      req.body = {
        nombre: 'Mi Comercio',
        email: 'comercio@test.com',
        password: 'SecurePassword123!'
      };

      Usuario.findOne.mockRejectedValue(new Error('DB Error'));

      await authController.registerComercio(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Error del servidor'
      }));
    });
  });

  describe('registerRepartidor', () => {
    test('debería registrar un repartidor exitosamente', async () => {
      req.body = {
        nombre: 'Juan Repartidor',
        email: 'repartidor@test.com',
        telefono: '0987654321',
        password: 'SecurePassword123!',
        vehiculo: 'bicicleta',
        zonaCobertura: ['Buenos Aires', 'La Plata']
      };

      const mockRepartidor = {
        id: 'REP123456',
        nombre: 'Juan Repartidor',
        email: 'repartidor@test.com',
        tipo: 'REPARTIDOR',
        toJSON: jest.fn().mockReturnValue({
          id: 'REP123456',
          nombre: 'Juan Repartidor',
          email: 'repartidor@test.com'
        })
      };

      Usuario.findOne.mockResolvedValue(null);
      Usuario.create.mockResolvedValue(mockRepartidor);
      emailService.sendRegistrationEmail.mockResolvedValue({
        success: true,
        confirmationCode: 'DEF456'
      });
      generateToken.mockReturnValue('token_mock_456');
      generateRefreshToken.mockReturnValue('refresh_token_mock_456');

      await authController.registerRepartidor(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('registrado')
      }));
    });

    test('debería validar datos obligatorios en repartidor', async () => {
      req.body = {
        email: 'repartidor@test.com'
        // Faltan nombre y password
      };

      await authController.registerRepartidor(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Datos incompletos'
      }));
    });
  });

  describe('Login', () => {
    test('debería loguear usuario existente con credenciales correctas', async () => {
      req.body = {
        email: 'usuario@test.com',
        password: 'CorrectPassword123!'
      };

      const mockUsuario = {
        id: 'USR123',
        email: 'usuario@test.com',
        password: await bcrypt.hash('CorrectPassword123!', 10),
        tipo: 'CLIENTE',
        toJSON: jest.fn().mockReturnValue({
          id: 'USR123',
          email: 'usuario@test.com',
          tipo: 'CLIENTE'
        })
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      bcrypt.compare.mockResolvedValue(true);
      generateToken.mockReturnValue('login_token_123');
      generateRefreshToken.mockReturnValue('login_refresh_123');

      // Assumiendo existe método login
      if (authController.login) {
        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          token: 'login_token_123'
        }));
      }
    });

    test('debería rechazar credenciales incorrectas', async () => {
      req.body = {
        email: 'usuario@test.com',
        password: 'WrongPassword'
      };

      const mockUsuario = {
        id: 'USR123',
        email: 'usuario@test.com',
        password: await bcrypt.hash('CorrectPassword123!', 10)
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      bcrypt.compare.mockResolvedValue(false);

      if (authController.login) {
        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          error: expect.stringContaining('credenciales')
        }));
      }
    });

    test('debería rechazar usuario no encontrado', async () => {
      req.body = {
        email: 'noexiste@test.com',
        password: 'AnyPassword123!'
      };

      Usuario.findOne.mockResolvedValue(null);

      if (authController.login) {
        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          error: 'Usuario no encontrado'
        }));
      }
    });
  });

  describe('Validaciones de Seguridad', () => {
    test('debería sanitizar inputs para prevenir XSS', async () => {
      req.body = {
        nombre: '<script>alert("XSS")</script>',
        email: 'test@test.com',
        password: 'SecurePassword123!'
      };

      Usuario.findOne.mockResolvedValue(null);
      Usuario.create.mockResolvedValue({
        id: 'COM123',
        nombre: 'scriptalertXSSscript', // Debería estar sanitizado
        toJSON: jest.fn().mockReturnValue({})
      });

      await authController.registerComercio(req, res);

      // Verificar que Usuario.create fue llamado con campos sanitizados
      expect(Usuario.create).toHaveBeenCalled();
      const createCall = Usuario.create.mock.calls[0][0];
      // El nombre no debería contener tags HTML
      expect(createCall.nombre).not.toContain('<script>');
    });

    test('debería validar contraseñas fuertes', async () => {
      const testCases = [
        { password: '123456', expected: 'Contraseña débil' },
        { password: 'abcdefgh', expected: 'Contraseña débil' },
        { password: 'SecurePass123', expected: null } // Válida
      ];

      for (const testCase of testCases) {
        req.body = {
          nombre: 'Test',
          email: `test${Math.random()}@test.com`,
          password: testCase.password
        };

        jest.clearAllMocks();
        
        if (testCase.expected) {
          await authController.registerComercio(req, res);
          expect(res.status).toHaveBeenCalledWith(400);
        }
      }
    });
  });
});
