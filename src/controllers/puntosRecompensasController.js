/**
 * YAvoy v3.1 - Puntos y Recompensas Controller
 * Sistema completo de loyalidad con puntos y canjes
 */

const { PuntosRecompensas, HistorialPuntos, RecompensasLibrary } = require('../../models/PuntosRecompensas');
const Usuario = require('../../models/Usuario');

class PuntosRecompensasController {
  /**
   * Obtener saldo de puntos del usuario
   */
  async obtenerSaldo(req, res) {
    try {
      const usuarioId = req.user?.id || req.body.usuarioId;

      let saldo = await PuntosRecompensas.findOne({
        where: { usuarioId }
      });

      if (!saldo) {
        // Crear nuevo registro si no existe
        saldo = await PuntosRecompensas.create({ usuarioId });
      }

      res.json({
        success: true,
        usuarioId,
        puntosActuales: saldo.puntosActuales,
        puntosAcumulados: saldo.puntosAcumulados,
        puntosCanjados: saldo.puntosCanjados,
        nivel: saldo.nivel,
        beneficios: saldo.beneficios,
        proximoNivel: this.calcularProximoNivel(saldo.puntosAcumulados),
        cuponesActivos: saldo.cuponesActivos || []
      });
    } catch (error) {
      console.error('Error en obtenerSaldo:', error);
      res.status(500).json({ error: 'Error al obtener saldo' });
    }
  }

  /**
   * Agregar puntos (después de compra, referido, etc)
   */
  async agregarPuntos(req, res) {
    try {
      const { usuarioId, cantidad, tipo, referencia, descripcion } = req.body;

      if (!usuarioId || !cantidad || !tipo) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      if (cantidad <= 0) {
        return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
      }

      let saldo = await PuntosRecompensas.findOne({ where: { usuarioId } });
      if (!saldo) {
        saldo = await PuntosRecompensas.create({ usuarioId });
      }

      const saldoAnterior = saldo.puntosActuales;

      // Actualizar saldos
      saldo.puntosActuales += cantidad;
      saldo.puntosAcumulados += cantidad;

      // Actualizar nivel según puntos acumulados
      const nivelAnterior = saldo.nivel;
      saldo.nivel = this.calcularNivel(saldo.puntosAcumulados);
      
      // Obtener beneficios del nuevo nivel
      if (saldo.nivel !== nivelAnterior) {
        saldo.beneficios = this.obtenerBeneficios(saldo.nivel);
      }

      saldo.totalCompras = (saldo.totalCompras || 0) + 1;
      await saldo.save();

      // Registrar en historial
      await HistorialPuntos.create({
        usuarioId,
        tipo,
        monto: cantidad,
        saldoAnterior,
        saldoPosterior: saldo.puntosActuales,
        referencia,
        descripcion: descripcion || `${cantidad} puntos por ${tipo.toLowerCase()}`
      });

      // Notificación si subió de nivel
      let mensaje = null;
      if (saldo.nivel !== nivelAnterior) {
        mensaje = `¡Feliciidades! Ascendiste al nivel ${saldo.nivel}`;
      }

      res.status(201).json({
        success: true,
        message: 'Puntos agregados',
        saldoNuevo: saldo.puntosActuales,
        cantidadAgregada: cantidad,
        nivelActual: saldo.nivel,
        ascenso: mensaje
      });
    } catch (error) {
      console.error('Error en agregarPuntos:', error);
      res.status(500).json({ error: 'Error al agregar puntos' });
    }
  }

  /**
   * Obtener recompensas disponibles
   */
  async obtenerRecompensas(req, res) {
    try {
      const usuarioId = req.user?.id || req.body.usuarioId;
      const { estado = 'ACTIVO' } = req.query;

      const saldo = await PuntosRecompensas.findOne({ where: { usuarioId } });
      if (!saldo) {
        return res.json({
          success: true,
          recompensas: [],
          puntosDisponibles: 0
        });
      }

      const recompensas = await RecompensasLibrary.findAll({
        where: { 
          estado,
          puntosRequeridos: { [require('sequelize').Op.lte]: saldo.puntosActuales }
        },
        order: [['puntosRequeridos', 'ASC']]
      });

      res.json({
        success: true,
        puntosDisponibles: saldo.puntosActuales,
        nivelUsuario: saldo.nivel,
        recompensas: recompensas.map(r => ({
          ...r.toJSON(),
          puedoComprar: r.puntosRequeridos <= saldo.puntosActuales
        }))
      });
    } catch (error) {
      console.error('Error en obtenerRecompensas:', error);
      res.status(500).json({ error: 'Error' });
    }
  }

  /**
   * Canjear puntos por recompensa
   */
  async canjeRecompensa(req, res) {
    try {
      const usuarioId = req.user?.id || req.body.usuarioId;
      const { recompensaId } = req.body;

      const saldo = await PuntosRecompensas.findOne({ where: { usuarioId } });
      if (!saldo) {
        return res.status(404).json({ error: 'Usuario no tiene cuenta de puntos' });
      }

      const recompensa = await RecompensasLibrary.findByPk(recompensaId);
      if (!recompensa) {
        return res.status(404).json({ error: 'Recompensa no encontrada' });
      }

      // Validaciones
      if (recompensa.estado !== 'ACTIVO') {
        return res.status(400).json({ error: 'Recompensa no disponible' });
      }

      if (saldo.puntosActuales < recompensa.puntosRequeridos) {
        return res.status(400).json({ 
          error: 'No tienes suficientes puntos',
          puntosRequeridos: recompensa.puntosRequeridos,
          puntosActuales: saldo.puntosActuales
        });
      }

      if (recompensa.cantidadDisponible !== null && recompensa.cantidadUsada >= recompensa.cantidadDisponible) {
        return res.status(400).json({ error: 'Recompensa agotada' });
      }

      const saldoAnterior = saldo.puntosActuales;

      // Realizar canje
      saldo.puntosActuales -= recompensa.puntosRequeridos;
      saldo.puntosCanjados += recompensa.puntosRequeridos;
      saldo.ultimoCanjeId = recompensaId;
      saldo.ultimoCanjeFecha = new Date();
      await saldo.save();

      // Registrar en historial
      const canjeHistorial = await HistorialPuntos.create({
        usuarioId,
        tipo: 'CANJE',
        monto: -recompensa.puntosRequeridos,
        saldoAnterior,
        saldoPosterior: saldo.puntosActuales,
        referencia: { recompensaId },
        descripcion: `Canje: ${recompensa.nombre}`
      });

      // Actualizar contador de usos de recompensa
      recompensa.cantidadUsada += 1;
      if (recompensa.cantidadDisponible !== null && recompensa.cantidadUsada >= recompensa.cantidadDisponible) {
        recompensa.estado = 'AGOTADO';
      }
      await recompensa.save();

      // Generar cupón
      const cupón = {
        id: `CPN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
        tipo: recompensa.tipo,
        valor: recompensa.valor,
        descripcion: recompensa.nombre,
        validoHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        canjeado: false,
        fechaGeneracion: new Date()
      };

      // Agregar cupón a la billetera
      if (!saldo.cuponesActivos) {
        saldo.cuponesActivos = [];
      }
      saldo.cuponesActivos.push(cupón);
      await saldo.save();

      res.status(201).json({
        success: true,
        message: 'Recompensa canjeada',
        cupon: cupón,
        puntosNuevos: saldo.puntosActuales,
        puntosGastados: recompensa.puntosRequeridos
      });
    } catch (error) {
      console.error('Error en canjeRecompensa:', error);
      res.status(500).json({ error: 'Error al canjear' });
    }
  }

  /**
   * Obtener historial de puntos
   */
  async obtenerHistorial(req, res) {
    try {
      const usuarioId = req.user?.id || req.body.usuarioId;
      const { limite = 20, pagina = 1 } = req.query;

      const offset = (pagina - 1) * limite;

      const { count, rows } = await HistorialPuntos.findAndCountAll({
        where: { usuarioId },
        order: [['fecha', 'DESC']],
        limit: parseInt(limite),
        offset
      });

      res.json({
        success: true,
        usuarioId,
        total: count,
        pagina: parseInt(pagina),
        totalPaginas: Math.ceil(count / limite),
        historial: rows
      });
    } catch (error) {
      console.error('Error en obtenerHistorial:', error);
      res.status(500).json({ error: 'Error' });
    }
  }

  /**
   * === HELPERS ===
   */

  calcularNivel(puntosAcumulados) {
    if (puntosAcumulados >= 5000) return 'DIAMANTE';
    if (puntosAcumulados >= 3000) return 'PLATINO';
    if (puntosAcumulados >= 1500) return 'ORO';
    if (puntosAcumulados >= 500) return 'PLATA';
    return 'BRONCE';
  }

  calcularProximoNivel(puntosAcumulados) {
    const niveles = [
      { nombre: 'PLATA', puntos: 500 },
      { nombre: 'ORO', puntos: 1500 },
      { nombre: 'PLATINO', puntos: 3000 },
      { nombre: 'DIAMANTE', puntos: 5000 }
    ];

    for (const nivel of niveles) {
      if (puntosAcumulados < nivel.puntos) {
        return {
          nombre: nivel.nombre,
          puntosRequeridos: nivel.puntos,
          puntosRestantes: nivel.puntos - puntosAcumulados
        };
      }
    }

    return null; // Ya en máximo nivel
  }

  obtenerBeneficios(nivel) {
    const beneficiosMap = {
      'BRONCE': { descuentoCompras: 0, puntosPorDolar: 1.0 },
      'PLATA': { descuentoCompras: 2, puntosPorDolar: 1.2 },
      'ORO': { descuentoCompras: 5, puntosPorDolar: 1.5 },
      'PLATINO': { descuentoCompras: 10, puntosPorDolar: 2.0 },
      'DIAMANTE': { descuentoCompras: 15, puntosPorDolar: 2.5 }
    };
    return beneficiosMap[nivel] || beneficiosMap['BRONCE'];
  }
}

module.exports = new PuntosRecompensasController();
