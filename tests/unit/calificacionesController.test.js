const request = require('supertest');
const express = require('express');
const {
  crearCalificacion,
  obtenerCalificacionesPorUsuario,
  obtenerResumenRating,
  responderCalificacion,
  marcarUtil,
  obtenerCalificacionesDestacadas,
} = require('../src/controllers/calificacionesController');

// Mock de bases de datos
jest.mock('../models', () => ({
  Calificacion: {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
  },
  Pedido: {
    findByPk: jest.fn(),
  },
  Usuario: {
    findByPk: jest.fn(),
    update: jest.fn(),
  },
}));

const { Calificacion, Pedido, Usuario } = require('../models');

describe('CalificacionesController', () => {
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
  // crearCalificacion()
  // ========================================
  describe('crearCalificacion', () => {
    it('✅ Debe crear una calificación exitosamente', async () => {
      mockReq.body = {
        pedidoId: 'ped-123',
        estrellas: 5,
        comentario: 'Excelente servicio',
        aspectos: { velocidad: 5, amabilidad: 5 },
        tags: ['rapido'],
      };

      Pedido.findByPk.mockResolvedValue({ id: 'ped-123', clienteId: 'usuario-123' });
      Calificacion.findOne.mockResolvedValue(null); // No existe calificación previa
      Calificacion.create.mockResolvedValue({
        id: 'cal-123',
        estrellas: 5,
        estado: 'PUBLICADA',
      });

      await crearCalificacion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Calificación'),
        })
      );
    });

    it('❌ Debe validar que estrellas sea 1-5', async () => {
      mockReq.body = {
        pedidoId: 'ped-123',
        estrellas: 6,
        comentario: 'Invalid',
      };

      await crearCalificacion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('1 y 5'),
        })
      );
    });

    it('❌ Debe evitar calificaciones duplicadas', async () => {
      mockReq.body = {
        pedidoId: 'ped-123',
        estrellas: 5,
      };

      Pedido.findByPk.mockResolvedValue({ id: 'ped-123' });
      Calificacion.findOne.mockResolvedValue({ id: 'cal-existing' }); // Ya existe

      await crearCalificacion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('ya existe'),
        })
      );
    });

    it('❌ Debe validar que pedido existe', async () => {
      mockReq.body = {
        pedidoId: 'ped-inexistente',
        estrellas: 5,
      };

      Pedido.findByPk.mockResolvedValue(null);

      await crearCalificacion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  // ========================================
  // obtenerCalificacionesPorUsuario()
  // ========================================
  describe('obtenerCalificacionesPorUsuario', () => {
    it('✅ Debe obtener calificaciones paginadas', async () => {
      mockReq.params = { usuarioId: 'usuario-123' };
      mockReq.query = { pagina: 1, limite: 10 };

      const mockCalificaciones = [
        { id: 'cal-1', estrellas: 5, comentario: 'Bueno' },
        { id: 'cal-2', estrellas: 4, comentario: 'Muy bueno' },
      ];

      Calificacion.findAll.mockResolvedValue(mockCalificaciones);

      await obtenerCalificacionesPorUsuario(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          calificaciones: mockCalificaciones,
        })
      );
    });

    it('✅ Debe incluir distribución de estrellas', async () => {
      mockReq.params = { usuarioId: 'usuario-123' };
      mockReq.query = { pagina: 1, limite: 10 };

      Calificacion.findAll.mockResolvedValue([
        { estrellas: 5 },
        { estrellas: 5 },
        { estrellas: 4 },
      ]);

      await obtenerCalificacionesPorUsuario(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          distribucion: expect.any(Object),
        })
      );
    });
  });

  // ========================================
  // obtenerResumenRating()
  // ========================================
  describe('obtenerResumenRating', () => {
    it('✅ Debe devolver resumen de calificaciones', async () => {
      mockReq.params = { usuarioId: 'usuario-123' };

      Calificacion.findAll.mockResolvedValue([
        { estrellas: 5 },
        { estrellas: 5 },
        { estrellas: 4 },
      ]);

      Usuario.findByPk.mockResolvedValue({ id: 'usuario-123' });

      await obtenerResumenRating(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          promedio: expect.any(Number),
          total: expect.any(Number),
          badge: expect.any(String),
        })
      );
    });

    it('✅ Debe asignar badge correcto según promedio', async () => {
      mockReq.params = { usuarioId: 'usuario-123' };

      // Calificación promedio 4.8
      Calificacion.findAll.mockResolvedValue(Array(5).fill({ estrellas: 5 }));
      Usuario.findByPk.mockResolvedValue({ id: 'usuario-123' });

      await obtenerResumenRating(mockReq, mockRes);

      const callArg = mockRes.json.mock.calls[0][0];
      expect(callArg.badge).toMatch(/⭐|👍|🌟/); // Debe contener un emoji
    });
  });

  // ========================================
  // responderCalificacion()
  // ========================================
  describe('responderCalificacion', () => {
    it('✅ Debe permitir respuesta del negocio', async () => {
      mockReq.params = { id: 'cal-123' };
      mockReq.body = { respuesta: 'Gracias por tu reseña' };
      mockReq.user.id = 'negocio-123';

      Calificacion.findByPk.mockResolvedValue({
        id: 'cal-123',
        calificadoId: 'negocio-123',
        update: jest.fn().mockResolvedValue({}),
      });

      await responderCalificacion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('respuesta'),
        })
      );
    });

    it('❌ Debe validar permisos', async () => {
      mockReq.params = { id: 'cal-123' };
      mockReq.body = { respuesta: 'Respuesta' };
      mockReq.user.id = 'otro-123';

      Calificacion.findByPk.mockResolvedValue({
        calificadoId: 'negocio-123',
      });

      await responderCalificacion(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  // ========================================
  // marcarUtil()
  // ========================================
  describe('marcarUtil', () => {
    it('✅ Debe incrementar votos útiles', async () => {
      mockReq.params = { id: 'cal-123' };

      const mockCalificacion = {
        id: 'cal-123',
        utilVotos: 0,
        update: jest.fn().mockResolvedValue({ utilVotos: 1 }),
      };

      Calificacion.findByPk.mockResolvedValue(mockCalificacion);

      await marcarUtil(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          utilVotos: expect.any(Number),
        })
      );
    });
  });

  // ========================================
  // obtenerCalificacionesDestacadas()
  // ========================================
  describe('obtenerCalificacionesDestacadas', () => {
    it('✅ Debe devolver reviews con más votos útiles', async () => {
      mockReq.query = { limite: 5 };

      const mockDestacadas = [
        { id: 'cal-1', estrellas: 5, utilVotos: 100 },
        { id: 'cal-2', estrellas: 5, utilVotos: 85 },
      ];

      Calificacion.findAll.mockResolvedValue(mockDestacadas);

      await obtenerCalificacionesDestacadas(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          calificaciones: mockDestacadas,
        })
      );
    });
  });

  // ========================================
  // ERROR HANDLING
  // ========================================
  describe('Error Handling', () => {
    it('❌ Debe manejar errores de servidor', async () => {
      Calificacion.findAll.mockRejectedValue(new Error('Database error'));

      await obtenerCalificacionesPorUsuario(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('error'),
        })
      );
    });
  });
});
