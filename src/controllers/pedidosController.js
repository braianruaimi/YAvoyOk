/**
 * pedidosController.js
 * Controlador para la gestión de pedidos en YAvoy v3.1
 * 
 * Migración desde server.js monolítico hacia arquitectura MVC
 * Mantiene compatibilidad con sistema de archivos JSON y Socket.IO
 */

const fs = require('fs').promises;
const path = require('path');
const Pedido = require('../../models/Pedido');

class PedidosController {
  constructor() {
    this.BASE_DIR = path.join(__dirname, '../../registros');
    this.pedidos = [];
    this.repartidores = [];
    this.calificaciones = [];
    this.chats = {};
  }

  /**
   * Guardar pedido en archivo JSON
   */
  async guardarPedidoArchivo(pedido) {
    try {
      const pedidosDir = path.join(this.BASE_DIR, 'pedidos');
      await fs.mkdir(pedidosDir, { recursive: true });
      
      const nombreArchivo = `${pedido.id}.json`;
      const rutaArchivo = path.join(pedidosDir, nombreArchivo);
      await fs.writeFile(rutaArchivo, JSON.stringify(pedido, null, 2), 'utf8');
      
      console.log(`✓ Pedido guardado: ${nombreArchivo}`);
    } catch (error) {
      console.error('Error al guardar pedido:', error);
    }
  }

  /**
   * Actualizar pedido en archivo
   */
  async actualizarPedidoArchivo(pedido) {
    try {
      const pedidosDir = path.join(this.BASE_DIR, 'pedidos');
      const archivos = await fs.readdir(pedidosDir);
      
      for (const archivo of archivos) {
        if (archivo.endsWith('.json')) {
          const rutaArchivo = path.join(pedidosDir, archivo);
          const contenido = await fs.readFile(rutaArchivo, 'utf-8');
          const data = JSON.parse(contenido);
          
          if (data.id === pedido.id) {
            await fs.writeFile(rutaArchivo, JSON.stringify(pedido, null, 2));
            console.log(`✓ Pedido actualizado: ${archivo}`);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
    }
  }

  /**
   * Crear nuevo pedido
   */
  async crearPedido(req, res) {
    try {
      const { 
        clienteNombre, clienteTelefono, direccion, productos, comercioId, total, 
        nombreCliente, telefonoCliente, direccionEntrega, descripcion, monto, email 
      } = req.body;
      
      const nombre = nombreCliente || clienteNombre;
      const telefono = telefonoCliente || clienteTelefono;
      const dir = direccionEntrega || direccion;
      const desc = descripcion || productos;
      const montoFinal = monto || total;
      
      if (!nombre || !telefono || !dir || !desc) {
        return res.status(400).json({ success: false, error: 'Datos incompletos' });
      }

      const montoTotal = parseFloat(montoFinal) || 0;
      const comisionCEO = montoTotal * 0.15;
      const comisionRepartidor = montoTotal * 0.85;
      
      const nuevoPedido = {
        id: `PED-${Date.now()}`,
        nombreCliente: nombre,
        telefonoCliente: telefono,
        direccionEntrega: dir,
        descripcion: desc,
        monto: montoTotal,
        comisionCEO: comisionCEO,
        comisionRepartidor: comisionRepartidor,
        estado: 'pendiente',
        comercioId: comercioId || null,
        clienteId: req.body.clienteId || null,
        repartidorId: null,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.pedidos.push(nuevoPedido);
      
      // Guardar en PostgreSQL
      try {
        await Pedido.create({
          id: nuevoPedido.id,
          clienteId: nuevoPedido.clienteId,
          comercioId: nuevoPedido.comercioId,
          estado: 'PENDIENTE',
          total: nuevoPedido.monto,
          productos: Array.isArray(desc) ? desc : [desc],
          direccionEntrega: typeof dir === 'object' ? dir : { direccion: dir },
          fecha: new Date()
        });
      } catch (error) {
        console.error('⚠️ Error SQL:', error.message);
      }
      
      // Guardar en JSON
      await this.guardarPedidoArchivo(nuevoPedido);
      
      console.log(`✓ Pedido creado: ${nuevoPedido.id}`);
      res.status(201).json({ success: true, pedido: nuevoPedido });
    } catch (error) {
      console.error('❌ Error al crear pedido:', error);
      res.status(500).json({ success: false, error: 'Error interno' });
    }
  }

  /**
   * Listar todos los pedidos
   */
  async listarPedidos(req, res) {
    try {
      const { estado } = req.query;
      let pedidosFiltrados = [...this.pedidos];
      
      if (estado) {
        pedidosFiltrados = pedidosFiltrados.filter(p => p.estado === estado);
      }
      
      res.json({ success: true, pedidos: pedidosFiltrados, total: pedidosFiltrados.length });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, error: 'Error' });
    }
  }

  /**
   * Obtener un pedido
   */
  async obtenerPedido(req, res) {
    try {
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'No encontrado' });
      }
      res.json({ success: true, pedido });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error' });
    }
  }

  /**
   * Actualizar estado
   */
  async actualizarEstadoPedido(req, res) {
    try {
      const { estado } = req.body;
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'No encontrado' });
      }
      
      pedido.estado = estado;
      pedido.updatedAt = new Date().toISOString();
      
      if (estado === 'entregado') {
        pedido.fechaEntrega = new Date().toISOString();
      }
      
      await this.actualizarPedidoArchivo(pedido);
      res.json({ success: true, pedido });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error' });
    }
  }

  /**
   * Cancelar pedido
   */
  async cancelarPedido(req, res) {
    try {
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'No encontrado' });
      }
      
      pedido.estado = 'cancelado';
      pedido.updatedAt = new Date().toISOString();
      
      await this.actualizarPedidoArchivo(pedido);
      res.json({ success: true, pedido });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error' });
    }
  }

  /**
   * Obtener tracking
   */
  async obtenerTracking(req, res) {
    try {
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'No encontrado' });
      }

      res.json({ success: true, tracking: {
        pedidoId: pedido.id,
        estado: pedido.estado,
        createdAt: pedido.createdAt,
        updatedAt: pedido.updatedAt
      }});
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error' });
    }
  }

  /**
   * Confirmar pago
   */
  async confirmarPago(req, res) {
    try {
      const { metodoPago } = req.body;
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'No encontrado' });
      }

      pedido.pago = {
        confirmado: true,
        metodoPago: metodoPago || 'mercadopago',
        fecha: new Date().toISOString()
      };

      await this.actualizarPedidoArchivo(pedido);
      res.json({ success: true, pedido });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error' });
    }
  }
}

module.exports = new PedidosController();
