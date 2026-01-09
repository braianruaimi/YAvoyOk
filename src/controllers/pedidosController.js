/**
 * pedidosController.js
 * Controlador para la gestión de pedidos en YAvoy v3.1
 * 
 * Migración desde server.js monolítico hacia arquitectura MVC
 * Mantiene compatibilidad con sistema de archivos JSON y Socket.IO
 */

const fs = require('fs').promises;
const path = require('path');

class PedidosController {
  constructor() {
    this.BASE_DIR = path.join(__dirname, '../../registros');
    this.pedidos = [];
    this.repartidores = [];
    this.calificaciones = [];
    this.chats = {};
  }

  /**
   * Inicializar controller con datos desde la aplicación principal
   */
  init(app, pedidos, repartidores, calificaciones, chats) {
    this.app = app;
    this.pedidos = pedidos;
    this.repartidores = repartidores;
    this.calificaciones = calificaciones;
    this.chats = chats;
  }

  /**
   * Helper para obtener Socket.IO desde la app
   */
  getSocketIO() {
    return this.app ? this.app.get('socketio') : null;
  }

  /**
   * Helper para emitir notificaciones
   */
  notificarTodos(evento, data) {
    const io = this.getSocketIO();
    if (io) {
      io.emit(evento, data);
      console.log(`🔔 Notificación broadcast:`, evento);
    }
  }

  notificarRepartidor(repartidorId, evento, data) {
    const io = this.getSocketIO();
    if (io) {
      io.to(`repartidor-${repartidorId}`).emit(evento, data);
      console.log(`🔔 Notificación enviada a repartidor ${repartidorId}:`, evento);
    }
  }

  notificarCliente(clienteId, evento, data) {
    const io = this.getSocketIO();
    if (io) {
      io.to(`cliente-${clienteId}`).emit(evento, data);
      console.log(`🔔 Notificación enviada a cliente ${clienteId}:`, evento);
    }
  }

  /**
   * Guardar pedido en archivo JSON
   */
  async guardarPedidoArchivo(pedido) {
    try {
      const pedidosDir = path.join(this.BASE_DIR, 'pedidos');
      const nombreArchivo = `${pedido.id}_${Date.now()}.json`;
      const rutaArchivo = path.join(pedidosDir, nombreArchivo);
      
      await fs.writeFile(rutaArchivo, JSON.stringify(pedido, null, 2));
      console.log(`✓ Pedido guardado: ${nombreArchivo}`);
    } catch (error) {
      console.error('Error al guardar pedido:', error);
      throw error;
    }
  }

  /**
   * Actualizar pedido en archivo JSON
   */
  async actualizarPedidoArchivo(pedido) {
    try {
      const pedidosDir = path.join(this.BASE_DIR, 'pedidos');
      const archivos = await fs.readdir(pedidosDir);
      
      for (const archivo of archivos) {
        if (archivo.startsWith(pedido.id)) {
          const rutaArchivo = path.join(pedidosDir, archivo);
          await fs.writeFile(rutaArchivo, JSON.stringify(pedido, null, 2));
          console.log(`✓ Pedido actualizado en archivo: ${archivo}`);
          return;
        }
      }
    } catch (error) {
      console.error('Error al actualizar pedido en archivo:', error);
      throw error;
    }
  }

  /**
   * Crear informe CEO del cliente
   */
  async crearOActualizarInformeCEOCliente(clienteData) {
    // Implementación simplificada - expandir según necesidades
    try {
      const informesDir = path.join(this.BASE_DIR, 'informes-ceo');
      await fs.mkdir(informesDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
      const nombreArchivo = `cliente_${clienteData.telefono}_${timestamp}.json`;
      const rutaArchivo = path.join(informesDir, nombreArchivo);
      
      const informe = {
        tipo: 'cliente',
        cliente: clienteData,
        fechaCreacion: new Date().toISOString()
      };
      
      await fs.writeFile(rutaArchivo, JSON.stringify(informe, null, 2));
      console.log(`📊 Informe CEO de cliente creado: ${nombreArchivo}`);
    } catch (error) {
      console.error('Error al crear informe CEO:', error);
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
      
      // Soportar ambos formatos de request
      const nombre = nombreCliente || clienteNombre;
      const telefono = telefonoCliente || clienteTelefono;
      const dir = direccionEntrega || direccion;
      const desc = descripcion || productos;
      const montoFinal = monto || total;
      
      if (!nombre || !telefono || !dir || !desc) {
        return res.status(400).json({ success: false, error: 'Datos incompletos' });
      }

      const montoTotal = parseFloat(montoFinal) || 0;
      const comisionCEO = montoTotal * 0.15; // 15% para CEO
      const comisionRepartidor = montoTotal * 0.85; // 85% para repartidor
      
      const nuevoPedido = {
        id: `PED-${Date.now()}`,
        nombreCliente: nombre,
        telefonoCliente: telefono,
        direccionEntrega: dir,
        descripcion: desc,
        destinatario: req.body.destinatario || nombre,
        telefonoDestinatario: req.body.telefonoDestinatario || telefono,
        notas: req.body.notas || '',
        monto: montoTotal,
        comisionCEO: comisionCEO,
        comisionRepartidor: comisionRepartidor,
        estado: 'pendiente',
        comercioId: comercioId || null,
        clienteId: req.body.clienteId || null,
        cliente: req.body.clienteNombre ? {
          nombre: req.body.clienteNombre,
          telefono: telefono
        } : null,
        repartidorId: null,
        repartidor: null,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.pedidos.push(nuevoPedido);
      
      // Guardar pedido en archivo JSON
      await this.guardarPedidoArchivo(nuevoPedido);
      
      // Crear o actualizar informe CEO del cliente
      await this.crearOActualizarInformeCEOCliente({
        nombre,
        telefono,
        email: email || '',
        direccion: dir,
        pedido: nuevoPedido
      });
      
      console.log(`✓ Pedido creado: ${nuevoPedido.id} - Cliente: ${nombre}`);
      console.log(`  💰 Monto: $${montoTotal.toFixed(2)} | CEO: $${comisionCEO.toFixed(2)} | Repartidor: $${comisionRepartidor.toFixed(2)}`);
      console.log(`  📊 Informe CEO de cliente actualizado`);
      
      // 📝 REGISTRAR CREACIÓN DE PEDIDO POR COMERCIO
      if (comercioId || req.body.clienteId) {
        await this.registrarCreacionPorComercio(req, nuevoPedido, nombre, telefono, dir, desc, montoTotal, comisionCEO, comisionRepartidor, email);
      }
      
      // Notificar a repartidores disponibles
      this.notificarTodos('nuevoPedido', {
        pedido: {
          id: nuevoPedido.id,
          direccion: nuevoPedido.direccion,
          monto: nuevoPedido.monto,
          comisionRepartidor: nuevoPedido.comisionRepartidor
        }
      });
      
      res.status(201).json({ success: true, pedido: nuevoPedido });
    } catch (error) {
      console.error('❌ Error al crear pedido:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  /**
   * Registrar creación de pedido por comercio
   */
  async registrarCreacionPorComercio(req, nuevoPedido, nombre, telefono, dir, desc, montoTotal, comisionCEO, comisionRepartidor, email) {
    try {
      const ahora = new Date();
      const timestamp = ahora.getTime();
      const fechaLegible = ahora.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const registroComercio = {
        id: `comercio_pedido_${timestamp}_${nuevoPedido.id}`,
        tipo: 'creacion_pedido',
        pedidoId: nuevoPedido.id,
        pedidoNumero: nuevoPedido.id,
        descripcionEnvio: desc,
        montoEnvio: montoTotal,
        comisionCEO: comisionCEO,
        comisionRepartidor: comisionRepartidor,
        comercio: {
          id: req.body.comercioId || req.body.clienteId,
          nombre: req.body.clienteNombre || 'Comercio',
          telefono: req.body.clienteTelefono || 'No especificado',
          email: email || 'No proporcionado'
        },
        cliente: {
          nombre: nombre,
          telefono: telefono,
          direccion: dir
        },
        destinatario: req.body.destinatario || nombre,
        telefonoDestinatario: req.body.telefonoDestinatario || telefono,
        notas: req.body.notas || '',
        fechaCreacion: ahora.toISOString(),
        fechaLegible: fechaLegible,
        timestamp: timestamp,
        ipComercio: req.ip || req.connection.remoteAddress || 'No disponible',
        userAgent: req.headers['user-agent'] || 'No disponible'
      };
      
      // Guardar en carpeta general de aceptaciones comercio
      const dirAceptacionesComercio = path.join(this.BASE_DIR, 'aceptaciones-comercio');
      await fs.mkdir(dirAceptacionesComercio, { recursive: true });
      
      const nombreArchivo = `comercio_pedido_${req.body.comercioId || req.body.clienteId}_${nuevoPedido.id}_${timestamp}.json`;
      const rutaArchivo = path.join(dirAceptacionesComercio, nombreArchivo);
      await fs.writeFile(rutaArchivo, JSON.stringify(registroComercio, null, 2), 'utf8');
      
      console.log(`📝 Pedido registrado por comercio: ${nombreArchivo}`);
    } catch (error) {
      console.error('⚠️ Error al registrar creación de pedido por comercio:', error);
    }
  }

  /**
   * Listar todos los pedidos (con filtros opcionales)
   */
  async listarPedidos(req, res) {
    console.log('🎯 CONTROLLER - listarPedidos() ejecutándose');
    console.log('   Pedidos disponibles:', this.pedidos?.length || 0);
    
    try {
      const { estado, repartidorId, comercioId, clienteId } = req.query;
      
      let pedidosFiltrados = [...this.pedidos];
      
      if (estado) {
        pedidosFiltrados = pedidosFiltrados.filter(p => p.estado === estado);
      }
      
      if (repartidorId) {
        pedidosFiltrados = pedidosFiltrados.filter(p => p.repartidorId === repartidorId);
      }
      
      if (comercioId) {
        pedidosFiltrados = pedidosFiltrados.filter(p => p.comercioId === comercioId);
      }
      
      if (clienteId) {
        pedidosFiltrados = pedidosFiltrados.filter(p => p.clienteId === clienteId);
      }
      
      res.json({ success: true, pedidos: pedidosFiltrados, total: pedidosFiltrados.length });
    } catch (error) {
      console.error('❌ Error al listar pedidos:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener un pedido específico
   */
  async obtenerPedido(req, res) {
    try {
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }
      
      res.json({ success: true, pedido });
    } catch (error) {
      console.error('❌ Error al obtener pedido:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  /**
   * Asignar pedido a repartidor
   */
  async asignarPedido(req, res) {
    try {
      const { repartidorId } = req.body;
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }
      
      if (pedido.estado !== 'pendiente') {
        return res.status(400).json({ success: false, error: 'El pedido ya fue asignado' });
      }
      
      // Buscar información del repartidor
      const repartidor = this.repartidores.find(r => r.id === repartidorId);
      
      if (!repartidor) {
        return res.status(404).json({ success: false, error: 'Repartidor no encontrado' });
      }
      
      pedido.repartidorId = repartidorId;
      pedido.repartidor = {
        id: repartidor.id,
        nombre: repartidor.nombre,
        telefono: repartidor.telefono,
        vehiculo: repartidor.vehiculo
      };
      pedido.estado = 'asignado';
      pedido.updatedAt = new Date().toISOString();
      pedido.fechaAsignacion = new Date().toISOString();
      
      // Registrar aceptación del envío
      await this.registrarAceptacionEnvio(req, pedido, repartidor);
      
      console.log(`✅ Pedido ${pedido.id} asignado a repartidor ${repartidorId}`);
      
      res.json({ success: true, pedido });
    } catch (error) {
      console.error('❌ Error al asignar pedido:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  /**
   * Registrar aceptación de envío
   */
  async registrarAceptacionEnvio(req, pedido, repartidor) {
    try {
      const ahora = new Date();
      const timestamp = ahora.getTime();
      const fechaLegible = ahora.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const registroAceptacion = {
        id: `aceptacion_${timestamp}_${repartidor.id}`,
        tipo: 'asignacion_repartidor',
        pedidoId: pedido.id,
        pedidoNumero: pedido.numero || pedido.id,
        descripcionEnvio: pedido.descripcion,
        montoEnvio: pedido.monto,
        comisionCEO: pedido.comisionCEO,
        comisionRepartidor: pedido.comisionRepartidor,
        repartidor: {
          id: repartidor.id,
          nombre: repartidor.nombre,
          email: repartidor.email || 'No proporcionado',
          telefono: repartidor.telefono,
          documento: repartidor.documento || repartidor.dni || 'No proporcionado',
          vehiculo: repartidor.vehiculo
        },
        comercio: {
          id: pedido.comercioId || pedido.clienteId || 'No especificado',
          nombre: pedido.nombreComercio || pedido.comercio || (pedido.cliente ? pedido.cliente.nombre : 'No especificado'),
          direccion: pedido.direccionComercio || pedido.origen || 'No especificada'
        },
        cliente: {
          nombre: pedido.nombreCliente || 'No especificado',
          telefono: pedido.telefonoCliente || 'No especificado',
          direccion: pedido.direccionEntrega || pedido.destino || 'No especificada'
        },
        destinatario: pedido.destinatario || pedido.nombreCliente,
        telefonoDestinatario: pedido.telefonoDestinatario || pedido.telefonoCliente,
        fechaAceptacion: ahora.toISOString(),
        fechaLegible: fechaLegible,
        timestamp: timestamp,
        ipAsignador: req.ip || req.connection.remoteAddress || 'No disponible',
        userAgent: req.headers['user-agent'] || 'No disponible',
        asignadoPor: pedido.comercioId || pedido.clienteId ? 'comercio' : 'repartidor'
      };
      
      // Guardar en carpeta general de aceptaciones
      const dirAceptaciones = path.join(this.BASE_DIR, 'aceptaciones-envios');
      await fs.mkdir(dirAceptaciones, { recursive: true });
      
      const nombreArchivo = `aceptacion_${repartidor.id}_${pedido.id}_${timestamp}.json`;
      const rutaArchivo = path.join(dirAceptaciones, nombreArchivo);
      await fs.writeFile(rutaArchivo, JSON.stringify(registroAceptacion, null, 2), 'utf8');
      
      // También guardar en la carpeta del repartidor
      const dirRepartidor = path.join(this.BASE_DIR, 'repartidores');
      const nombreArchivoRepartidor = `aceptacion_${pedido.id}_${timestamp}.json`;
      const rutaArchivoRepartidor = path.join(dirRepartidor, nombreArchivoRepartidor);
      await fs.writeFile(rutaArchivoRepartidor, JSON.stringify(registroAceptacion, null, 2), 'utf8');
      
      console.log(`📝 Aceptación de envío registrada: ${nombreArchivo}`);
    } catch (error) {
      console.error('⚠️ Error al registrar aceptación de envío:', error);
    }
  }

  /**
   * Actualizar pedido (genérico)
   */
  async actualizarPedido(req, res) {
    try {
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }
      
      // Actualizar campos permitidos
      const camposPermitidos = ['estado', 'descripcion', 'monto', 'notas', 'direccionEntrega'];
      
      Object.keys(req.body).forEach(key => {
        if (camposPermitidos.includes(key)) {
          pedido[key] = req.body[key];
        }
      });
      
      pedido.updatedAt = new Date().toISOString();
      
      // Actualizar archivo del pedido
      await this.actualizarPedidoArchivo(pedido);
      
      console.log(`✓ Pedido ${pedido.id} actualizado`);
      res.json({ success: true, pedido });
    } catch (error) {
      console.error('❌ Error al actualizar pedido:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  /**
   * Actualizar estado del pedido
   */
  async actualizarEstadoPedido(req, res) {
    try {
      const { estado } = req.body;
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }
      
      const estadosValidos = ['pendiente', 'asignado', 'en-camino', 'entregado', 'cancelado'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ success: false, error: 'Estado inválido' });
      }
      
      const estadoAnterior = pedido.estado;
      pedido.estado = estado;
      pedido.updatedAt = new Date().toISOString();
      
      // Guardar fecha de entrega
      if (estado === 'entregado') {
        pedido.fechaEntrega = new Date().toISOString();
      }
      
      // Si el pedido se marca como entregado, actualizar estadísticas del repartidor
      if (estado === 'entregado' && estadoAnterior !== 'entregado' && pedido.repartidorId) {
        await this.actualizarEstadisticasRepartidor(pedido);
      }
      
      // Actualizar archivo del pedido
      await this.actualizarPedidoArchivo(pedido);
      
      console.log(`✓ Pedido ${pedido.id} - Estado actualizado a: ${estado}`);
      res.json({ success: true, pedido });
    } catch (error) {
      console.error('❌ Error al actualizar estado del pedido:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  /**
   * Actualizar estadísticas del repartidor cuando completa un pedido
   */
  async actualizarEstadisticasRepartidor(pedido) {
    try {
      const repartidor = this.repartidores.find(r => r.id === pedido.repartidorId);
      
      if (repartidor) {
        repartidor.pedidosCompletados = (repartidor.pedidosCompletados || 0) + 1;
        repartidor.saldoTotal = (repartidor.saldoTotal || 0) + (parseFloat(pedido.monto) || 0);
        
        // Agregar al historial
        if (!repartidor.historialPedidos) repartidor.historialPedidos = [];
        repartidor.historialPedidos.push({
          pedidoId: pedido.id,
          monto: parseFloat(pedido.monto) || 0,
          fecha: new Date().toISOString(),
          cliente: pedido.nombreCliente,
          direccion: pedido.direccionEntrega
        });
        
        // Actualizar archivo del repartidor
        const repartidoresDir = path.join(this.BASE_DIR, 'repartidores');
        const archivos = await fs.readdir(repartidoresDir);
        
        for (const archivo of archivos) {
          if (archivo.endsWith('.json')) {
            const filePath = path.join(repartidoresDir, archivo);
            const contenido = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(contenido);
            
            if (data.id === pedido.repartidorId) {
              data.pedidosCompletados = repartidor.pedidosCompletados;
              data.saldoTotal = repartidor.saldoTotal;
              data.historialPedidos = repartidor.historialPedidos;
              await fs.writeFile(filePath, JSON.stringify(data, null, 2));
              
              console.log(`✓ Saldo actualizado para ${repartidor.nombre}: $${repartidor.saldoTotal.toFixed(2)}`);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al actualizar estadísticas del repartidor:', error);
    }
  }

  /**
   * Cancelar pedido
   */
  async cancelarPedido(req, res) {
    try {
      const { razon } = req.body;
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }
      
      if (pedido.estado === 'entregado') {
        return res.status(400).json({ success: false, error: 'No se puede cancelar un pedido ya entregado' });
      }
      
      pedido.estado = 'cancelado';
      pedido.fechaCancelacion = new Date().toISOString();
      pedido.razonCancelacion = razon || 'No especificada';
      pedido.updatedAt = new Date().toISOString();
      
      // Si tenía repartidor asignado, notificar
      if (pedido.repartidorId) {
        this.notificarRepartidor(pedido.repartidorId, 'pedidoCancelado', {
          pedidoId: pedido.id,
          razon: pedido.razonCancelacion
        });
      }
      
      await this.actualizarPedidoArchivo(pedido);
      
      console.log(`🚫 Pedido ${pedido.id} cancelado - Razón: ${pedido.razonCancelacion}`);
      res.json({ success: true, pedido });
    } catch (error) {
      console.error('❌ Error al cancelar pedido:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  /**
   * Generar QR de pago por distancia
   */
  async generarQRPago(req, res) {
    try {
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }

      // Calcular costo por distancia (simulado - en producción usar API de mapas)
      const distanciaKm = req.body.distancia || 5; // km
      const costoPorKm = 50; // $50 por km
      const costoBase = 200; // $200 base
      const costoTotal = costoBase + (distanciaKm * costoPorKm);
      
      // Generar QR usando API pública
      const datoPago = JSON.stringify({
        pedidoId: pedido.id,
        monto: costoTotal,
        concepto: `Envío YAvoy - ${distanciaKm}km`,
        repartidor: pedido.repartidor?.nombre || 'Repartidor',
        cliente: pedido.nombreCliente
      });
      
      const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(datoPago)}`;
      
      // Guardar información de pago en el pedido
      pedido.pagoEnvio = {
        distanciaKm,
        costoPorKm,
        costoBase,
        costoTotal,
        qrGenerado: new Date().toISOString(),
        qrImage,
        estado: 'pendiente'
      };
      
      await this.actualizarPedidoArchivo(pedido);
      
      console.log(`💳 QR de pago generado para pedido ${pedido.id}: $${costoTotal} (${distanciaKm}km)`);
      
      res.json({
        success: true,
        pago: {
          pedidoId: pedido.id,
          distanciaKm,
          costoBase,
          costoPorKm,
          costoTotal,
          qrImage,
          concepto: `Envío YAvoy - ${distanciaKm}km`
        }
      });
    } catch (error) {
      console.error('❌ Error al generar QR de pago:', error);
      res.status(500).json({ success: false, error: 'Error al generar QR de pago' });
    }
  }

  /**
   * Cliente confirma recepción del pedido
   */
  async clienteConfirma(req, res) {
    try {
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }

      pedido.confirmacionCliente = {
        confirmado: true,
        fecha: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress || 'No disponible'
      };
      
      pedido.updatedAt = new Date().toISOString();
      
      await this.actualizarPedidoArchivo(pedido);
      
      // Notificar al repartidor
      this.notificarTodos('clienteConfirmoRecepcion', {
        pedidoId: pedido.id,
        repartidorId: pedido.repartidorId,
        mensaje: 'El cliente confirmó que recibió el pedido'
      });
      
      console.log(`✅ Cliente confirmó recepción del pedido ${pedido.id}`);
      
      res.json({
        success: true,
        mensaje: 'Confirmación registrada. Esperando confirmación del repartidor.',
        pedido
      });
    } catch (error) {
      console.error('❌ Error al registrar confirmación del cliente:', error);
      res.status(500).json({ success: false, error: 'Error al registrar confirmación' });
    }
  }

  /**
   * Calificar envío
   */
  async calificarEnvio(req, res) {
    try {
      const { calificacion, comentario } = req.body;
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }

      if (!calificacion || calificacion < 1 || calificacion > 5) {
        return res.status(400).json({ success: false, error: 'Calificación debe ser entre 1 y 5 estrellas' });
      }

      const nuevaCalificacion = {
        id: `CAL-${Date.now()}`,
        pedidoId: pedido.id,
        repartidorId: pedido.repartidorId,
        calificacion: parseInt(calificacion),
        comentario: comentario || '',
        fecha: new Date().toISOString(),
        cliente: pedido.nombreCliente
      };
      
      // Guardar calificación
      this.calificaciones.push(nuevaCalificacion);
      
      // Guardar en archivo
      const dirCalificaciones = path.join(this.BASE_DIR, 'calificaciones');
      await fs.mkdir(dirCalificaciones, { recursive: true });
      
      const nombreArchivo = `calificacion_${pedido.id}_${Date.now()}.json`;
      const rutaArchivo = path.join(dirCalificaciones, nombreArchivo);
      await fs.writeFile(rutaArchivo, JSON.stringify(nuevaCalificacion, null, 2), 'utf8');
      
      // Actualizar calificación promedio del repartidor
      if (pedido.repartidorId) {
        const repartidor = this.repartidores.find(r => r.id === pedido.repartidorId);
        if (repartidor) {
          const calificacionesRepartidor = this.calificaciones.filter(c => c.repartidorId === pedido.repartidorId);
          const promedio = calificacionesRepartidor.reduce((sum, c) => sum + c.calificacion, 0) / calificacionesRepartidor.length;
          repartidor.calificacion = promedio.toFixed(1);
          repartidor.totalCalificaciones = calificacionesRepartidor.length;
        }
      }
      
      // Actualizar pedido
      pedido.calificacion = nuevaCalificacion;
      await this.actualizarPedidoArchivo(pedido);
      
      console.log(`⭐ Calificación registrada: ${calificacion} estrellas para pedido ${pedido.id}`);
      
      res.json({
        success: true,
        mensaje: '¡Gracias por tu calificación!',
        calificacion: nuevaCalificacion
      });
    } catch (error) {
      console.error('❌ Error al registrar calificación:', error);
      res.status(500).json({ success: false, error: 'Error al registrar calificación' });
    }
  }

  /**
   * Repartidor confirma entrega
   */
  async repartidorConfirmaEntrega(req, res) {
    try {
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }

      pedido.confirmacionRepartidor = {
        confirmado: true,
        fecha: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress || 'No disponible'
      };
      
      // Cambiar estado a entregado
      pedido.estado = 'entregado';
      pedido.fechaEntrega = new Date().toISOString();
      pedido.updatedAt = new Date().toISOString();
      
      await this.actualizarPedidoArchivo(pedido);
      
      // Notificar al comercio
      this.notificarTodos('pedidoEntregado', {
        pedidoId: pedido.id,
        comercioId: pedido.comercioId || pedido.clienteId,
        mensaje: 'El repartidor confirmó la entrega del pedido',
        cliente: pedido.nombreCliente
      });
      
      // Actualizar estadísticas del repartidor
      await this.actualizarEstadisticasRepartidor(pedido);
      
      console.log(`✅ Repartidor confirmó entrega del pedido ${pedido.id} - Notificación enviada al comercio`);
      
      res.json({
        success: true,
        mensaje: 'Entrega confirmada exitosamente',
        pedido
      });
    } catch (error) {
      console.error('❌ Error al confirmar entrega:', error);
      res.status(500).json({ success: false, error: 'Error al confirmar entrega' });
    }
  }

  /**
   * Actualizar ubicación del pedido
   */
  async actualizarUbicacion(req, res) {
    try {
      const { lat, lng, repartidorId } = req.body;
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }

      if (!pedido.ubicaciones) {
        pedido.ubicaciones = [];
      }

      const nuevaUbicacion = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        timestamp: new Date().toISOString(),
        repartidorId: repartidorId || pedido.repartidorId
      };

      pedido.ubicaciones.push(nuevaUbicacion);
      pedido.ubicacionActual = nuevaUbicacion;
      pedido.updatedAt = new Date().toISOString();

      await this.actualizarPedidoArchivo(pedido);

      // Notificar tracking en tiempo real
      this.notificarTodos('ubicacionActualizada', {
        pedidoId: pedido.id,
        ubicacion: nuevaUbicacion
      });

      console.log(`📍 Ubicación actualizada para pedido ${pedido.id}: ${lat}, ${lng}`);
      
      res.json({
        success: true,
        mensaje: 'Ubicación actualizada',
        ubicacion: nuevaUbicacion
      });
    } catch (error) {
      console.error('❌ Error al actualizar ubicación:', error);
      res.status(500).json({ success: false, error: 'Error al actualizar ubicación' });
    }
  }

  /**
   * Cliente confirma entrega (alias para compatibilidad)
   */
  async clienteConfirmaEntrega(req, res) {
    return this.clienteConfirma(req, res);
  }

  /**
   * Actualizar ubicación del pedido (alias para compatibilidad)
   */
  async actualizarUbicacionPedido(req, res) {
    return this.actualizarUbicacion(req, res);
  }

  /**
   * Enviar mensaje al chat del pedido
   */
  async enviarMensajeChat(req, res) {
    try {
      const { mensaje, remitente } = req.body;
      const pedidoId = req.params.id;
      
      if (!mensaje || !remitente) {
        return res.status(400).json({ success: false, error: 'Mensaje y remitente requeridos' });
      }
      
      // Acceder al sistema de chats desde la app
      const chats = this.app ? this.app.get('chats') : this.chats;
      
      if (!chats[pedidoId]) {
        chats[pedidoId] = [];
      }
      
      const nuevoMensaje = {
        id: `MSG-${Date.now()}`,
        mensaje,
        remitente,
        timestamp: new Date().toISOString()
      };
      
      chats[pedidoId].push(nuevoMensaje);
      
      // Guardar en archivo si es necesario
      try {
        const chatPath = path.join(this.BASE_DIR, 'chats', `${pedidoId}.json`);
        await fs.mkdir(path.dirname(chatPath), { recursive: true });
        await fs.writeFile(chatPath, JSON.stringify(chats[pedidoId], null, 2));
      } catch (error) {
        console.error('Error guardando chat:', error);
      }
      
      console.log(`✓ Mensaje enviado en pedido ${pedidoId}`);
      res.json({ success: true, mensaje: nuevoMensaje });
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener chat de un pedido
   */
  async obtenerChatPedido(req, res) {
    try {
      const pedidoId = req.params.id;
      
      // Acceder al sistema de chats desde la app
      const chats = this.app ? this.app.get('chats') : this.chats;
      const mensajes = chats[pedidoId] || [];
      
      res.json({ success: true, mensajes, total: mensajes.length });
    } catch (error) {
      console.error('❌ Error obteniendo chat:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener tracking GPS del pedido
   */
  async obtenerTracking(req, res) {
    try {
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }

      const tracking = {
        pedidoId: pedido.id,
        estado: pedido.estado,
        ubicacionActual: pedido.ubicacionActual || null,
        ubicaciones: pedido.ubicaciones || [],
        repartidor: pedido.repartidor || null,
        fechaCreacion: pedido.createdAt,
        fechaAsignacion: pedido.fechaAsignacion || null,
        fechaEntrega: pedido.fechaEntrega || null
      };

      res.json({ success: true, tracking });
    } catch (error) {
      console.error('❌ Error al obtener tracking:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  /**
   * Confirmar pago del pedido
   */
  async confirmarPago(req, res) {
    try {
      const { metodoPago, transactionId } = req.body;
      const pedido = this.pedidos.find(p => p.id === req.params.id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }

      pedido.pago = {
        confirmado: true,
        metodoPago: metodoPago || 'mercadopago',
        transactionId: transactionId || `TXN-${Date.now()}`,
        fecha: new Date().toISOString(),
        monto: pedido.monto
      };

      // Si el pago está confirmado, cambiar estado
      if (pedido.estado === 'pendiente') {
        pedido.estado = 'pagado';
      }

      pedido.updatedAt = new Date().toISOString();

      await this.actualizarPedidoArchivo(pedido);

      console.log(`💳 Pago confirmado para pedido ${pedido.id} - ${metodoPago}`);
      
      res.json({
        success: true,
        mensaje: 'Pago confirmado exitosamente',
        pedido
      });
    } catch (error) {
      console.error('❌ Error al confirmar pago:', error);
      res.status(500).json({ success: false, error: 'Error al confirmar pago' });
    }
  }
}

// Exportar instancia singleton
const instance = new PedidosController();
module.exports = instance;