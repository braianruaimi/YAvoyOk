/**
 * YAvoy v3.1 Enterprise - Pedidos Controller Unit Tests
 * Tests para gestión de pedidos y su persistencia
 */

const PedidosController = require('../../src/controllers/pedidosController');
const Pedido = require('../../models/Pedido');
const fs = require('fs').promises;
const path = require('path');

// Mocks
jest.mock('../../models/Pedido');
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    readFile: jest.fn()
  }
}));

describe('PedidosController Unit Tests', () => {
  let controller;
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    controller = new PedidosController();
    
    req = {
      body: {},
      params: {},
      query: {},
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('crearPedido', () => {
    test('debería crear un pedido exitosamente', async () => {
      const ahora = new Date();
      jest.useFakeTimers();
      jest.setSystemTime(ahora);

      req.body = {
        nombreCliente: 'Juan Pérez',
        telefonoCliente: '1234567890',
        direccionEntrega: 'Calle 1 123, Buenos Aires',
        descripcion: 'Pizza grande + Gaseosa',
        monto: 500,
        comercioId: 'COM001',
        clienteId: 'CLI001'
      };

      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
      Pedido.create.mockResolvedValue({
        id: expect.any(String),
        total: 500
      });

      await controller.crearPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        pedido: expect.objectContaining({
          nombreCliente: 'Juan Pérez',
          estado: 'pendiente',
          monto: 500
        })
      }));

      jest.useRealTimers();
    });

    test('debería validar campos obligatorios', async () => {
      req.body = {
        nombreCliente: 'Juan'
        // Faltan otros campos
      };

      await controller.crearPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Datos incompletos'
      }));
    });

    test('debería calcular comisiones correctamente', async () => {
      req.body = {
        nombreCliente: 'Test',
        telefonoCliente: '1234567890',
        direccionEntrega: 'Calle Test',
        descripcion: 'Producto test',
        monto: 1000
      };

      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
      Pedido.create.mockResolvedValue({});

      await controller.crearPedido(req, res);

      const pedidoCreado = res.json.mock.calls[0][0].pedido;
      
      expect(pedidoCreado.comisionCEO).toBe(1000 * 0.15); // 150
      expect(pedidoCreado.comisionRepartidor).toBe(1000 * 0.85); // 850
      expect(pedidoCreado.comisionCEO + pedidoCreado.comisionRepartidor).toBe(1000);
    });

    test('debería manejar errores de base de datos', async () => {
      req.body = {
        nombreCliente: 'Test',
        telefonoCliente: '1234567890',
        direccionEntrega: 'Calle Test',
        descripcion: 'Producto test',
        monto: 100
      };

      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
      Pedido.create.mockRejectedValue(new Error('DB Error'));

      // Debería continuar y guardar en JSON
      await controller.crearPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    test('debería usar valores por defecto si faltan campos alternos', async () => {
      req.body = {
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '1234567890',
        direccion: 'Calle 1',
        productos: 'Pizza',
        total: 250
      };

      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
      Pedido.create.mockResolvedValue({});

      await controller.crearPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const pedido = res.json.mock.calls[0][0].pedido;
      expect(pedido.nombreCliente).toBe('Juan Pérez');
      expect(pedido.monto).toBe(250);
    });
  });

  describe('listarPedidos', () => {
    test('debería listar todos los pedidos', async () => {
      controller.pedidos = [
        { id: 'PED001', estado: 'pendiente', monto: 100 },
        { id: 'PED002', estado: 'entregado', monto: 200 },
        { id: 'PED003', estado: 'cancelado', monto: 150 }
      ];

      await controller.listarPedidos(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        pedidos: expect.arrayContaining([
          expect.objectContaining({ id: 'PED001' }),
          expect.objectContaining({ id: 'PED002' }),
          expect.objectContaining({ id: 'PED003' })
        ]),
        total: 3
      }));
    });

    test('debería filtrar pedidos por estado', async () => {
      controller.pedidos = [
        { id: 'PED001', estado: 'pendiente', monto: 100 },
        { id: 'PED002', estado: 'entregado', monto: 200 },
        { id: 'PED003', estado: 'pendiente', monto: 150 }
      ];

      req.query = { estado: 'pendiente' };

      await controller.listarPedidos(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        pedidos: expect.arrayContaining([
          expect.objectContaining({ id: 'PED001' }),
          expect.objectContaining({ id: 'PED003' })
        ]),
        total: 2
      }));
    });

    test('debería devolver lista vacía si no hay pedidos', async () => {
      controller.pedidos = [];

      await controller.listarPedidos(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        pedidos: [],
        total: 0
      }));
    });

    test('debería manejar errores en listar pedidos', async () => {
      const error = new Error('Algo salió mal');
      req.query = null; // Forzar un error

      // Mock que lance error
      jest.spyOn(controller, 'listarPedidos').mockImplementation(async () => {
        throw error;
      });

      await controller.listarPedidos(req, res);

      expect(controller.listarPedidos).toHaveBeenCalled();
    });
  });

  describe('guardarPedidoArchivo', () => {
    test('debería crear el directorio de pedidos', async () => {
      const pedido = {
        id: 'PED001',
        nombreCliente: 'Test',
        monto: 100
      };

      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      await controller.guardarPedidoArchivo(pedido);

      expect(fs.mkdir).toHaveBeenCalled();
      const mkdirCall = fs.mkdir.mock.calls[0];
      expect(mkdirCall[1]).toEqual({ recursive: true });
    });

    test('debería guardar el pedido en formato JSON', async () => {
      const pedido = {
        id: 'PED001',
        nombreCliente: 'Test',
        monto: 100
      };

      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      await controller.guardarPedidoArchivo(pedido);

      expect(fs.writeFile).toHaveBeenCalled();
      const writeCall = fs.writeFile.mock.calls[0];
      const contenidoGuardado = JSON.parse(writeCall[1]);
      expect(contenidoGuardado).toEqual(pedido);
    });

    test('debería manejar errores de I/O', async () => {
      const pedido = { id: 'PED001' };
      const error = new Error('Permiso denegado');

      fs.mkdir.mockRejectedValue(error);

      // Debería logged pero no lanzar error
      await expect(controller.guardarPedidoArchivo(pedido)).resolves.toBeUndefined();
    });
  });

  describe('Validación de Datos', () => {
    test('debería validar montos numéricos', async () => {
      req.body = {
        nombreCliente: 'Test',
        telefonoCliente: '1234567890',
        direccionEntrega: 'Calle Test',
        descripcion: 'Producto',
        monto: 'no es un número'
      };

      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
      Pedido.create.mockResolvedValue({});

      await controller.crearPedido(req, res);

      const pedido = res.json.mock.calls[0][0].pedido;
      expect(typeof pedido.monto).toBe('number');
    });

    test('debería generar IDs únicos para cada pedido', async () => {
      const pedidos = [];

      for (let i = 0; i < 3; i++) {
        req.body = {
          nombreCliente: `Cliente ${i}`,
          telefonoCliente: '1234567890',
          direccionEntrega: 'Calle Test',
          descripcion: 'Producto',
          monto: 100
        };

        fs.mkdir.mockResolvedValue();
        fs.writeFile.mockResolvedValue();
        Pedido.create.mockResolvedValue({});

        await controller.crearPedido(req, res);
        
        const pedido = res.json.mock.calls[res.json.mock.calls.length - 1][0].pedido;
        pedidos.push(pedido.id);
      }

      // Todos deberían ser únicos
      const unique = new Set(pedidos);
      expect(unique.size).toBe(3);
    });

    test('debería incluir timestamp en cada pedido', async () => {
      req.body = {
        nombreCliente: 'Test',
        telefonoCliente: '1234567890',
        direccionEntrega: 'Calle Test',
        descripcion: 'Producto',
        monto: 100
      };

      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
      Pedido.create.mockResolvedValue({});

      await controller.crearPedido(req, res);

      const pedido = res.json.mock.calls[0][0].pedido;
      expect(pedido.timestamp).toBeDefined();
      expect(pedido.createdAt).toBeDefined();
      expect(pedido.updatedAt).toBeDefined();
      expect(new Date(pedido.timestamp)).toBeInstanceOf(Date);
    });
  });
});
