/**
 * YAvoy v3.1 - Propinas Controller
 * Gestión de propinas digitales para repartidores
 */

const { Propina, EstadisticasPropina } = require('../../models/Propina');
const Pedido = require('../../models/Pedido');
const Usuario = require('../../models/Usuario');

class PropinasController {
  /**
   * Ofrecer propina en un pedido
   */
  async ofrecerPropina(req, res) {
    try {
      const clienteId = req.user?.id || req.body.clienteId;
      const { pedidoId, monto, motivo, mensaje } = req.body;

      // Validar datos
      if (!pedidoId || !monto || monto <= 0) {
        return res.status(400).json({ error: 'Datos inválidos' });
      }

      if (monto > 999.99) {
        return res.status(400).json({ error: 'La propina máxima es $999.99' });
      }

      // Obtener pedido
      const pedido = await Pedido.findByPk(pedidoId);
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      if (pedido.clienteId !== clienteId) {
        return res.status(403).json({ error: 'No puedes hacer propina en este pedido' });
      }

      if (!pedido.repartidorId) {
        return res.status(400).json({ error: 'El pedido no tiene repartidor asignado' });
      }

      // Verificar que no haya propina previa
      const yaExiste = await Propina.findOne({ where: { pedidoId } });
      if (yaExiste) {
        return res.status(409).json({ error: 'Ya hay una propina para este pedido' });
      }

      // Crear propina
      const propina = await Propina.create({
        pedidoId,
        repartidorId: pedido.repartidorId,
        clienteId,
        monto,
        motivo: motivo || null,
        mensaje: mensaje?.substring(0, 200) || null,
        metodoPago: 'WALLET',
        estado: 'PENDIENTE'
      });

      // Notificar repartidor
      await this.notificarRepartidor(propina);

      res.status(201).json({
        success: true,
        message: 'Propina ofrecida',
        propina: {
          id: propina.id,
          monto: propina.monto,
          estado: propina.estado
        }
      });
    } catch (error) {
      console.error('Error en ofrecerPropina:', error);
      res.status(500).json({ error: 'Error al ofrecer propina' });
    }
  }

  /**
   * Repartidor acepta o rechaza propina
   */
  async responderPropina(req, res) {
    try {
      const repartidorId = req.user?.id || req.body.repartidorId;
      const { propinaId, aceptada } = req.body;

      const propina = await Propina.findByPk(propinaId);
      if (!propina) {
        return res.status(404).json({ error: 'Propina no encontrada' });
      }

      if (propina.repartidorId !== repartidorId) {
        return res.status(403).json({ error: 'No tienes derecho a responder' });
      }

      const nuevoEstado = aceptada ? 'ACEPTADA' : 'RECHAZADA';

      propina.estado = nuevoEstado;
      propina.fechaRespuesta = new Date();
      await propina.save();

      // Si acepta, procesar pago
      if (aceptada) {
        await this.procesarPagosPropina(propina);
      }

      res.json({
        success: true,
        message: aceptada ? 'Propina aceptada' : 'Propina rechazada',
        propina: {
          id: propina.id,
          estado: propina.estado,
          monto: propina.monto
        }
      });
    } catch (error) {
      console.error('Error en responderPropina:', error);
      res.status(500).json({ error: 'Error' });
    }
  }

  /**
   * Obtener propinas de un repartidor
   */
  async obtenerPropinasPorRepartidor(req, res) {
    try {
      const repartidorId = req.user?.id || req.params.repartidorId;
      const { estado = null, limite = 20, pagina = 1 } = req.query;

      const offset = (pagina - 1) * limite;
      const where = { repartidorId };

      if (estado) {
        where.estado = estado;
      }

      const { count, rows } = await Propina.findAndCountAll({
        where,
        order: [['fechaOfrecida', 'DESC']],
        limit: parseInt(limite),
        offset,
        attributes: { exclude: ['clienteId'] }
      });

      // Calcular estadísticas
      const totales = {
        ofrecidas: count,
        aceptadas: rows.filter(p => p.estado === 'ACEPTADA').length,
        rechazadas: rows.filter(p => p.estado === 'RECHAZADA').length,
        montoTotal: rows
          .filter(p => p.estado === 'ACEPTADA')
          .reduce((sum, p) => sum + p.monto, 0)
      };

      res.json({
        success: true,
        repartidorId,
        pagina: parseInt(pagina),
        totalPaginas: Math.ceil(count / limite),
        totales,
        propinas: rows
      });
    } catch (error) {
      console.error('Error en obtenerPropinasPorRepartidor:', error);
      res.status(500).json({ error: 'Error' });
    }
  }

  /**
   * Obtener estadísticas de propinas del repartidor
   */
  async obtenerEstadisticas(req, res) {
    try {
      const repartidorId = req.user?.id || req.params.repartidorId;

      let stats = await EstadisticasPropina.findOne({ where: { repartidorId } });

      if (!stats) {
        // Calcular estadísticas desde cero
        const propinas = await Propina.findAll({
          where: { repartidorId, estado: 'ACEPTADA' }
        });

        const totalRecibida = propinas.reduce((sum, p) => sum + p.monto, 0);
        const contador = propinas.length;
        const porcentajeAceptacion = contador > 0 ? ((contador / await Propina.count({ where: { repartidorId } })) * 100).toFixed(1) : 0;

        stats = await EstadisticasPropina.create({
          repartidorId,
          totalPropinaRecibida: totalRecibida,
          contadorPropinas: contador,
          porcentajeAceptacion,
          propinaPromedio: contador > 0 ? (totalRecibida / contador).toFixed(2) : 0
        });
      }

      // Determinar medallas
      const medallasInfo = {
        bronce: { require: 100, ganadoFecha: stats.medallasbronce > 0 },
        plata: { require: 500, ganado: stats.medallasPlata > 0 },
        oro: { require: 1000, ganado: stats.medallasOro > 0 }
      };

      res.json({
        success: true,
        repartidorId,
        estadisticas: {
          totalRecibido: stats.totalPropinaRecibida.toFixed(2),
          cantidadPropinas: stats.contadorPropinas,
          porcentajeAceptacion: parseFloat(stats.porcentajeAceptacion),
          propinaPromedio: stats.propinaPromedio,
          ranking: stats.ranking || 'Calculando...',
          medallas: {
            bronce: stats.medallasBronce,
            plata: stats.medallasPlata,
            oro: stats.medallasOro
          }
        },
        proximaMedalla: this.calcularProximaMedalla(stats.totalPropinaRecibida)
      });
    } catch (error) {
      console.error('Error en obtenerEstadisticas:', error);
      res.status(500).json({ error: 'Error' });
    }
  }

  /**
   * Ranking de repartidores por propinas
   */
  async obtenerRanking(req, res) {
    try {
      const { limite = 10 } = req.query;

      const ranking = await EstadisticasPropina.findAll({
        order: [['totalPropinaRecibida', 'DESC']],
        limit: parseInt(limite),
        include: [{ 
          model: Usuario, 
          foreignKey: 'repartidorId',
          attributes: ['id', 'nombre']
        }]
      });

      res.json({
        success: true,
        ranking: ranking.map((r, index) => ({
          posicion: index + 1,
          repartidorId: r.repartidorId,
          nombre: r.Usuario?.nombre,
          totalRecibido: r.totalPropinaRecibida,
          propinas: r.contadorPropinas,
          promedio: r.propinaPromedio,
          badge: this.obtenerBadge(r.totalPropinaRecibida)
        }))
      });
    } catch (error) {
      console.error('Error en obtenerRanking:', error);
      res.status(500).json({ error: 'Error' });
    }
  }

  /**
   * === HELPERS ===
   */

  async notificarRepartidor(propina) {
    // TODO: Integrar con sistema de notificaciones
    console.log(`[PROPINA] Notificación a ${propina.repartidorId}: $${propina.monto} disponibles`);
  }

  async procesarPagosPropina(propina) {
    // TODO: Integrar con sistema de pagos
    propina.estado = 'PROCESADA';
    propina.fechaProcesamiento = new Date();
    propina.transaccionId = `TRX-${Date.now()}`;
    await propina.save();

    // Actualizar estadísticas
    const stats = await EstadisticasPropina.findOne({
      where: { repartidorId: propina.repartidorId }
    });

    if (stats) {
      stats.totalPropinaRecibida += propina.monto;
      stats.contadorPropinas += 1;
      stats.propinaPromedio = (stats.totalPropinaRecibida / stats.contadorPropinas).toFixed(2);
      
      // Actualizar medallas
      if (stats.totalPropinaRecibida >= 100 && stats.medallasBronce === 0) {
        stats.medallasBronce = 1;
      }
      if (stats.totalPropinaRecibida >= 500 && stats.medallasPlata === 0) {
        stats.medallasPlata = 1;
      }
      if (stats.totalPropinaRecibida >= 1000 && stats.medallasOro === 0) {
        stats.medallasOro = 1;
      }

      await stats.save();
    }
  }

  calcularProximaMedalla(totalRecibido) {
    if (totalRecibido >= 1000) return null; // Máxima
    if (totalRecibido >= 500) {
      return { nombre: 'Oro', requerido: 1000, falta: 1000 - totalRecibido };
    }
    if (totalRecibido >= 100) {
      return { nombre: 'Plata', requerido: 500, falta: 500 - totalRecibido };
    }
    return { nombre: 'Bronce', requerido: 100, falta: 100 - totalRecibido };
  }

  obtenerBadge(totalRecibido) {
    if (totalRecibido >= 1000) return { nombre: 'Elite', emoji: '👑', color: 'gold' };
    if (totalRecibido >= 500) return { nombre: 'Oro', emoji: '🥇', color: 'gold' };
    if (totalRecibido >= 100) return { nombre: 'Plata', emoji: '🥈', color: 'silver' };
    return { nombre: 'Bronce', emoji: '🥉', color: 'bronze' };
  }
}

module.exports = new PropinasController();
