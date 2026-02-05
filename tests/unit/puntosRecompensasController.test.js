const request = require('supertest');
const {
  obtenerSaldo,
  agregarPuntos,
  obtenerRecompensas,
  canjeRecompensa,
  obtenerHistorial,
} = require('../src/controllers/puntosRecompensasController');

jest.mock('../models', () => ({
  PuntosRecompensas: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
  },
  HistorialPuntos: {
    create: jest.fn(),
    findAll: jest.fn(),
  },
  RecompensasLibrary: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
  Usuario: {
    findByPk: jest.fn(),
  },
}));

const { PuntosRecompensas, HistorialPuntos, RecompensasLibrary, Usuario } = require('../models');

describe('PuntosRecompensasController', () => {
  const mockReq = {
    user: { id: 'usuario-123' },
    body: {},
    params: {},
    query: {},
  };

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // obtenerSaldo()
  // ========================================
  describe('obtenerSaldo', () => {
    it('✅ Debe devolver saldo actual de puntos', async () => {
      PuntosRecompensas.findOne.mockResolvedValue({
        puntosActuales: 850,
        puntosAcumulados: 2500,
        nivel: 'ORO',
        beneficios: { descuentoCompras: 5, puntosPorDolar: 1.5 },
      });

      await obtenerSaldo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          puntosActuales: 850,
          nivel: 'ORO',
        })
      );
    });

    it('✅ Debe incluir próximo nivel en respuesta', async () => {
      PuntosRecompensas.findOne.mockResolvedValue({
        puntosActuales: 850,
        nivel: 'ORO',
        beneficios: {},
      });

      await obtenerSaldo(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          proximoNivel: expect.objectContaining({
            nombre: expect.any(String),
            puntosRequiridos: expect.any(Number),
          }),
        })
      );
    });

    it('❌ Debe crear saldo si no existe', async () => {
      PuntosRecompensas.findOne.mockResolvedValue(null);
      PuntosRecompensas.create = jest.fn().mockResolvedValue({
        puntosActuales: 0,
        nivel: 'BRONCE',
      });

      await obtenerSaldo(mockReq, mockRes);

      expect(PuntosRecompensas.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  // ========================================
  // agregarPuntos()
  // ========================================
  describe('agregarPuntos', () => {
    it('✅ Debe agregar puntos por compra', async () => {
      mockReq.body = {
        tipo: 'COMPRA',
        monto: 50,
        referencia: 'ped-123',
      };

      const mockPuntos = {
        puntosActuales: 0,
        puntosAcumulados: 0,
        nivel: 'BRONCE',
        update: jest
          .fn()
          .mockResolvedValue({
            puntosActuales: 50,
            puntosAcumulados: 50,
            nivel: 'BRONCE',
          }),
      };

      PuntosRecompensas.findOne.mockResolvedValue(mockPuntos);
      HistorialPuntos.create.mockResolvedValue({ id: 'hist-123' });

      await agregarPuntos(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(HistorialPuntos.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'COMPRA',
          monto: 50,
        })
      );
    });

    it('✅ Debe calculer nivel automáticamente', async () => {
      mockReq.body = {
        tipo: 'BONO',
        monto: 1500,
      };

      const mockPuntos = {
        puntosActuales: 0,
        puntosAcumulados: 0,
        nivel: 'BRONCE',
        update: jest
          .fn()
          .mockResolvedValue({
            puntosActuales: 1500,
            puntosAcumulados: 1500,
            nivel: 'ORO',
          }),
      };

      PuntosRecompensas.findOne.mockResolvedValue(mockPuntos);
      HistorialPuntos.create.mockResolvedValue({});

      await agregarPuntos(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          nuevoNivel: 'ORO',
        })
      );
    });

    it('❌ Debe validar monto positivo', async () => {
      mockReq.body = {
        tipo: 'COMPRA',
        monto: -100,
      };

      await agregarPuntos(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  // ========================================
  // obtenerRecompensas()
  // ========================================
  describe('obtenerRecompensas', () => {
    it('✅ Debe listar recompensas disponibles', async () => {
      PuntosRecompensas.findOne.mockResolvedValue({
        puntosActuales: 2000,
      });

      const mockRecompensas = [
        {
          id: 'recp-1',
          nombre: 'Descuento 10%',
          puntosRequeridos: 500,
          tipo: 'DESCUENTO',
          cantidadDisponible: 50,
        },
        {
          id: 'recp-2',
          nombre: 'Envío gratis',
          puntosRequeridos: 1000,
          tipo: 'ENVIO_GRATIS',
          cantidadDisponible: null,
        },
      ];

      RecompensasLibrary.findAll.mockResolvedValue(mockRecompensas);

      await obtenerRecompensas(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          recompensas: expect.arrayContaining([
            expect.objectContaining({ id: 'recp-1' }),
          ]),
        })
      );
    });

    it('✅ Debe marcar recompensas que puedo canjear', async () => {
      PuntosRecompensas.findOne.mockResolvedValue({
        puntosActuales: 1500,
      });

      RecompensasLibrary.findAll.mockResolvedValue([
        { id: 'recp-1', puntosRequeridos: 500 },
        { id: 'recp-2', puntosRequeridos: 2000 },
      ]);

      await obtenerRecompensas(mockReq, mockRes);

      const respuesta = mockRes.json.mock.calls[0][0];
      expect(respuesta.recompensas[0].puedoCanjear).toBe(true);
      expect(respuesta.recompensas[1].puedoCanjear).toBe(false);
    });

    it('❌ Debe filtrar recompensas agotadas', async () => {
      PuntosRecompensas.findOne.mockResolvedValue({
        puntosActuales: 5000,
      });

      RecompensasLibrary.findAll.mockResolvedValue([
        {
          id: 'recp-1',
          puntosRequeridos: 500,
          cantidadDisponible: 0,
        },
        {
          id: 'recp-2',
          puntosRequeridos: 500,
          cantidadDisponible: null,
        },
      ]);

      await obtenerRecompensas(mockReq, mockRes);

      const respuesta = mockRes.json.mock.calls[0][0];
      expect(respuesta.recompensas.length).toBe(1); // Solo la ilimitada
    });
  });

  // ========================================
  // canjeRecompensa()
  // ========================================
  describe('canjeRecompensa', () => {
    it('✅ Debe canjear recompensa exitosamente', async () => {
      mockReq.body = { recompensaId: 'recp-123' };

      const mockPuntos = {
        puntosActuales: 1000,
        cuponesActivos: [],
        update: jest
          .fn()
          .mockResolvedValue({
            puntosActuales: 500,
            cuponesActivos: expect.any(Array),
          }),
      };

      PuntosRecompensas.findOne.mockResolvedValue(mockPuntos);
      RecompensasLibrary.findByPk.mockResolvedValue({
        id: 'recp-123',
        puntosRequeridos: 500,
        tipo: 'DESCUENTO',
        valor: 10,
        cantidadDisponible: 50,
      });
      HistorialPuntos.create.mockResolvedValue({});

      await canjeRecompensa(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          cupongenerado: expect.any(String),
        })
      );
    });

    it('❌ Debe validar suficientes puntos', async () => {
      mockReq.body = { recompensaId: 'recp-123' };

      PuntosRecompensas.findOne.mockResolvedValue({
        puntosActuales: 100,
      });

      RecompensasLibrary.findByPk.mockResolvedValue({
        puntosRequeridos: 500,
      });

      await canjeRecompensa(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('puntos'),
        })
      );
    });

    it('❌ Debe evitar canjear recompensas agotadas', async () => {
      mockReq.body = { recompensaId: 'recp-123' };

      PuntosRecompensas.findOne.mockResolvedValue({
        puntosActuales: 5000,
      });

      RecompensasLibrary.findByPk.mockResolvedValue({
        puntosRequeridos: 500,
        cantidadDisponible: 0,
      });

      await canjeRecompensa(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('agotada'),
        })
      );
    });
  });

  // ========================================
  // obtenerHistorial()
  // ========================================
  describe('obtenerHistorial', () => {
    it('✅ Debe devolver historial de puntos', async () => {
      mockReq.query = { pagina: 1, limite: 10 };

      const mockHistorial = [
        {
          id: 'hist-1',
          tipo: 'COMPRA',
          monto: 50,
          createdAt: new Date(),
        },
        {
          id: 'hist-2',
          tipo: 'CANJE',
          monto: -500,
          createdAt: new Date(),
        },
      ];

      HistorialPuntos.findAll.mockResolvedValue(mockHistorial);

      await obtenerHistorial(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          historial: mockHistorial,
        })
      );
    });

    it('✅ Debe paginar resultados', async () => {
      mockReq.query = { pagina: 2, limite: 5 };

      HistorialPuntos.findAll.mockResolvedValue([]);

      await obtenerHistorial(mockReq, mockRes);

      expect(HistorialPuntos.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 5,
          limit: 5,
        })
      );
    });
  });

  // ========================================
  // ERROR HANDLING
  // ========================================
  describe('Error Handling', () => {
    it('❌ Debe manejar errores de servidor', async () => {
      PuntosRecompensas.findOne.mockRejectedValue(
        new Error('Database error')
      );

      await obtenerSaldo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });
  });
});
