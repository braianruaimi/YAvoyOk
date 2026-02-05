const request = require('supertest');
const {
  ofrecerPropina,
  responderPropina,
  obtenerPropinasPorRepartidor,
  obtenerEstadisticas,
  obtenerRanking,
} = require('../src/controllers/propinasController');

jest.mock('../models', () => ({
  Propina: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
  EstadisticasPropinas: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    findByPk: jest.fn(),
  },
  Pedido: {
    findByPk: jest.fn(),
  },
  Usuario: {
    findByPk: jest.fn(),
    update: jest.fn(),
  },
}));

const { Propina, EstadisticasPropinas, Pedido, Usuario } = require('../models');

describe('PropinasController', () => {
  const mockReq = {
    user: { id: 'usuario-cliente-123' },
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
  // ofrecerPropina()
  // ========================================
  describe('ofrecerPropina', () => {
    it('✅ Debe crear propina exitosamente', async () => {
      mockReq.body = {
        pedidoId: 'ped-123',
        monto: 50,
        motivo: 'RAPIDEZ',
        mensaje: 'Gracias por la rapidez',
      };

      Pedido.findByPk.mockResolvedValue({
        id: 'ped-123',
        clienteId: 'usuario-cliente-123',
        repartidorId: 'repartidor-456',
        estado: 'ENTREGADO',
      });

      Propina.findOne.mockResolvedValue(null); // No existe propina previa

      Propina.create.mockResolvedValue({
        id: 'prop-123',
        monto: 50,
        estado: 'PENDIENTE',
      });

      await ofrecerPropina(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('ofrecida'),
        })
      );
    });

    it('❌ Debe validar rango de monto', async () => {
      mockReq.body = {
        pedidoId: 'ped-123',
        monto: 0.05, // Menor que 0.10
        motivo: 'RAPIDEZ',
      };

      Pedido.findByPk.mockResolvedValue({
        id: 'ped-123',
        estado: 'ENTREGADO',
      });

      await ofrecerPropina(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('0.10'),
        })
      );
    });

    it('❌ Debe validar que pedido sea ENTREGADO', async () => {
      mockReq.body = {
        pedidoId: 'ped-123',
        monto: 50,
      };

      Pedido.findByPk.mockResolvedValue({
        id: 'ped-123',
        estado: 'PENDIENTE',
      });

      await ofrecerPropina(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('entregado'),
        })
      );
    });

    it('❌ Debe evitar propinas duplicadas', async () => {
      mockReq.body = {
        pedidoId: 'ped-123',
        monto: 50,
      };

      Pedido.findByPk.mockResolvedValue({
        id: 'ped-123',
        estado: 'ENTREGADO',
      });

      Propina.findOne.mockResolvedValue({ id: 'prop-existing' });

      await ofrecerPropina(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('ya existe'),
        })
      );
    });

    it('❌ Debe validar que cliente es quien ofrece', async () => {
      mockReq.body = {
        pedidoId: 'ped-123',
        monto: 50,
      };

      mockReq.user.id = 'otro-usuario';

      Pedido.findByPk.mockResolvedValue({
        id: 'ped-123',
        clienteId: 'usuario-cliente-123',
        estado: 'ENTREGADO',
      });

      await ofrecerPropina(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  // ========================================
  // responderPropina()
  // ========================================
  describe('responderPropina', () => {
    it('✅ Debe aceptar propina', async () => {
      mockReq.params = { id: 'prop-123' };
      mockReq.body = { aceptada: true };
      mockReq.user.id = 'repartidor-456';

      const mockPropina = {
        id: 'prop-123',
        repartidorId: 'repartidor-456',
        monto: 50,
        comisionYavoy: 0.1,
        estado: 'PENDIENTE',
        update: jest
          .fn()
          .mockResolvedValue({
            estado: 'ACEPTADA',
            respuestaRepartidor: 'ACEPTADA',
          }),
      };

      Propina.findByPk.mockResolvedValue(mockPropina);
      EstadisticasPropinas.findOne.mockResolvedValue({
        totalPropinaRecibida: 0,
        cantidadAceptadas: 0,
        update: jest.fn(),
      });

      await responderPropina(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          montoRecibido: 45, // 50 - 10% comisión
        })
      );
    });

    it('✅ Debe rechazar propina', async () => {
      mockReq.params = { id: 'prop-123' };
      mockReq.body = { aceptada: false };
      mockReq.user.id = 'repartidor-456';

      const mockPropina = {
        repartidorId: 'repartidor-456',
        estado: 'PENDIENTE',
        update: jest.fn().mockResolvedValue({ estado: 'RECHAZADA' }),
      };

      Propina.findByPk.mockResolvedValue(mockPropina);
      EstadisticasPropinas.findOne.mockResolvedValue({
        cantidadRechazadas: 0,
        update: jest.fn(),
      });

      await responderPropina(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('rechazada'),
        })
      );
    });

    it('❌ Debe validar permisos del repartidor', async () => {
      mockReq.params = { id: 'prop-123' };
      mockReq.body = { aceptada: true };
      mockReq.user.id = 'otro-repartidor';

      Propina.findByPk.mockResolvedValue({
        repartidorId: 'repartidor-456',
      });

      await responderPropina(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  // ========================================
  // obtenerPropinasPorRepartidor()
  // ========================================
  describe('obtenerPropinasPorRepartidor', () => {
    it('✅ Debe listar propinas del repartidor', async () => {
      mockReq.user.id = 'repartidor-456';
      mockReq.query = { pagina: 1, limite: 10 };

      const mockPropinas = [
        {
          id: 'prop-1',
          monto: 50,
          estado: 'ACEPTADA',
          motivo: 'RAPIDEZ',
        },
        {
          id: 'prop-2',
          monto: 30,
          estado: 'ACEPTADA',
          motivo: 'AMABILIDAD',
        },
      ];

      Propina.findAll.mockResolvedValue(mockPropinas);

      await obtenerPropinasPorRepartidor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          propinas: mockPropinas,
        })
      );
    });

    it('✅ Debe incluir estadísticas rápidas', async () => {
      mockReq.user.id = 'repartidor-456';
      mockReq.query = { pagina: 1, limite: 10 };

      const mockPropinas = [
        { monto: 50, estado: 'ACEPTADA' },
        { monto: 30, estado: 'ACEPTADA' },
      ];

      Propina.findAll.mockResolvedValue(mockPropinas);

      await obtenerPropinasPorRepartidor(mockReq, mockRes);

      const respuesta = mockRes.json.mock.calls[0][0];
      expect(respuesta.totalRecibido).toBe(80);
      expect(respuesta.cantidad).toBe(2);
      expect(respuesta.promedio).toBe(40);
    });
  });

  // ========================================
  // obtenerEstadisticas()
  // ========================================
  describe('obtenerEstadisticas', () => {
    it('✅ Debe devolver estadísticas del repartidor', async () => {
      mockReq.user.id = 'repartidor-456';

      EstadisticasPropinas.findOne.mockResolvedValue({
        totalPropinaRecibida: 1250,
        cantidadAceptadas: 35,
        cantidadRechazadas: 5,
        propinaPromedio: 35.71,
        porcentajeAceptacion: 87.5,
        medallasBronce: 1,
        medallasPlata: 1,
        medallasOro: 0,
      });

      await obtenerEstadisticas(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          totalRecibido: 1250,
          porcentajeAceptacion: 87.5,
        })
      );
    });

    it('✅ Debe incluir información de medallas', async () => {
      mockReq.user.id = 'repartidor-456';

      EstadisticasPropinas.findOne.mockResolvedValue({
        totalPropinaRecibida: 1500,
        medallasBronce: 2,
        medallasPlata: 1,
        medallasOro: 1,
      });

      await obtenerEstadisticas(mockReq, mockRes);

      const respuesta = mockRes.json.mock.calls[0][0];
      expect(respuesta.medallas).toBeGreaterThan(0);
    });

    it('❌ Debe crear estadísticas si no existen', async () => {
      mockReq.user.id = 'repartidor-456';

      EstadisticasPropinas.findOne.mockResolvedValue(null);
      EstadisticasPropinas.create = jest
        .fn()
        .mockResolvedValue({ totalPropinaRecibida: 0 });

      await obtenerEstadisticas(mockReq, mockRes);

      expect(EstadisticasPropinas.create).toHaveBeenCalled();
    });
  });

  // ========================================
  // obtenerRanking()
  // ========================================
  describe('obtenerRanking', () => {
    it('✅ Debe devolver top repartidores', async () => {
      mockReq.query = { limite: 5 };

      const mockRanking = [
        {
          posicion: 1,
          repartidorId: 'rep-1',
          totalRecibido: 1250,
          cantidadPropinas: 35,
          propinaPromedio: 35.71,
          medallasOro: 1,
          badge: '👑',
        },
        {
          posicion: 2,
          repartidorId: 'rep-2',
          totalRecibido: 950,
          cantidadPropinas: 28,
          propinaPromedio: 33.93,
          medallasOro: 0,
          badge: '⭐',
        },
      ];

      EstadisticasPropinas.findAll.mockResolvedValue(mockRanking);

      await obtenerRanking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          ranking: mockRanking,
        })
      );
    });

    it('✅ Debe asignar posiciones correctas', async () => {
      mockReq.query = { limite: 3 };

      const mockRanking = [
        { totalRecibido: 1000, posicion: 1 },
        { totalRecibido: 800, posicion: 2 },
        { totalRecibido: 600, posicion: 3 },
      ];

      EstadisticasPropinas.findAll.mockResolvedValue(mockRanking);

      await obtenerRanking(mockReq, mockRes);

      const respuesta = mockRes.json.mock.calls[0][0];
      expect(respuesta.ranking[0].posicion).toBe(1);
      expect(respuesta.ranking[1].posicion).toBe(2);
    });

    it('✅ Debe respetarl ímite de resultados', async () => {
      mockReq.query = { limite: 10 };

      const manyRanks = Array(20)
        .fill(null)
        .map((_, i) => ({
          totalRecibido: 1000 - i * 50,
          posicion: i + 1,
        }));

      EstadisticasPropinas.findAll.mockResolvedValue(manyRanks);

      await obtenerRanking(mockReq, mockRes);

      const respuesta = mockRes.json.mock.calls[0][0];
      expect(respuesta.ranking.length).toBeLessThanOrEqual(10);
    });
  });

  // ========================================
  // ERROR HANDLING
  // ========================================
  describe('Error Handling', () => {
    it('❌ Debe manejar errores de servidor', async () => {
      Propina.findByPk.mockRejectedValue(new Error('Database error'));

      mockReq.params = { id: 'prop-123' };
      mockReq.body = { aceptada: true };

      await responderPropina(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it('❌ Debe validar propina no existe', async () => {
      Propina.findByPk.mockResolvedValue(null);

      mockReq.params = { id: 'prop-inexistente' };

      await responderPropina(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
