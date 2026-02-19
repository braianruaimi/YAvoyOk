/**
 * YAvoy v3.1 - Calificaciones Controller
 * Gestión completa del sistema de ratings 1-5 estrellas
 */

const Calificacion = require('../../models/calificacion');
const Pedido = require('../../models/pedido');
const Usuario = require('../../models/usuario');

class CalificacionesController {
  /**
   * Crear nueva calificación para un pedido
   */
  async crearCalificacion(req, res) {
    try {
      const { pedidoId, estrellas, comentario, aspectos, tags } = req.body;
      const calificadorId = req.user?.id || req.body.calificadorId;

      // Validar datos
      if (!pedidoId || !estrellas || !calificadorId) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      if (estrellas < 1 || estrellas > 5) {
        return res.status(400).json({ error: 'Las estrellas deben estar entre 1 y 5' });
      }

      // Obtener el pedido
      const pedido = await Pedido.findByPk(pedidoId);
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      // Determinar a quién va dirigida la calificación
      let calificadoId, tipo;
      if (pedido.clienteId === calificadorId) {
        // Cliente califica repartidor o comercio
        calificadoId = pedido.repartidorId || pedido.comercioId;
        tipo = pedido.repartidorId ? 'REPARTIDOR' : 'COMERCIO';
      } else if (pedido.comercioId === calificadorId) {
        // Comercio califica cliente (cumplimiento)
        calificadoId = pedido.clienteId;
        tipo = 'CLIENTE'; // TODO: evaluar
      } else {
        return res.status(403).json({ error: 'No tienes permiso para calificar este pedido' });
      }

      // Verificar que no haya calificación previa
      const yaCalificado = await Calificacion.findOne({
        where: { pedidoId, calificadorId }
      });

      if (yaCalificado) {
        return res.status(409).json({ error: 'Ya has calificado este pedido' });
      }

      // Crear calificación
      const calificacion = await Calificacion.create({
        pedidoId,
        calificadorId,
        calificadoId,
        tipo,
        estrellas,
        comentario: comentario?.substring(0, 500) || null,
        aspectos,
        tags,
        estado: 'PUBLICADA' // Publicar inmediatamente
      });

      // Actualizar rating promedio del usuario calificado
      await this.actualizarRatingPromedio(calificadoId);

      res.status(201).json({
        success: true,
        message: 'Calificación creada exitosamente',
        calificacion
      });
    } catch (error) {
      console.error('Error en crearCalificacion:', error);
      res.status(500).json({ error: 'Error al crear calificación' });
    }
  }

  /**
   * Obtener todas las calificaciones de un usuario
   */
  async obtenerCalificacionesPorUsuario(req, res) {
    try {
      const { usuarioId } = req.params;
      const { tipo = null, limite = 10, pagina = 1 } = req.query;

      const offset = (pagina - 1) * limite;

      const where = { 
        calificadoId: usuarioId,
        estado: 'PUBLICADA'
      };

      if (tipo) {
        where.tipo = tipo;
      }

      const { count, rows } = await Calificacion.findAndCountAll({
        where,
        include: [
          { model: Usuario, as: 'calificador', attributes: ['id', 'nombre', 'tipo'] }
        ],
        order: [['fecha', 'DESC']],
        limit: parseInt(limite),
        offset
      });

      const promedioEstrellas = rows.length > 0 
        ? (rows.reduce((sum, c) => sum + c.estrellas, 0) / rows.length).toFixed(1)
        : 0;

      res.json({
        success: true,
        usuario: usuarioId,
        totalCalificaciones: count,
        promedioEstrellas,
        distribucion: {
          '5_estrellas': rows.filter(c => c.estrellas === 5).length,
          '4_estrellas': rows.filter(c => c.estrellas === 4).length,
          '3_estrellas': rows.filter(c => c.estrellas === 3).length,
          '2_estrellas': rows.filter(c => c.estrellas === 2).length,
          '1_estrellas': rows.filter(c => c.estrellas === 1).length
        },
        pagina: parseInt(pagina),
        totalPaginas: Math.ceil(count / limite),
        calificaciones: rows
      });
    } catch (error) {
      console.error('Error en obtenerCalificacionesPorUsuario:', error);
      res.status(500).json({ error: 'Error al obtener calificaciones' });
    }
  }

  /**
   * Obtener un resumen del rating de un usuario
   */
  async obtenerResumenRating(req, res) {
    try {
      const { usuarioId } = req.params;

      const calificaciones = await Calificacion.findAll({
        where: { 
          calificadoId: usuarioId,
          estado: 'PUBLICADA'
        },
        attributes: ['estrellas', 'tipo']
      });

      if (calificaciones.length === 0) {
        return res.json({
          usuarioId,
          promedio: 0,
          totalCalificaciones: 0,
          distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        });
      }

      const promedio = (
        calificaciones.reduce((sum, c) => sum + c.estrellas, 0) / 
        calificaciones.length
      ).toFixed(1);

      const distribucion = {
        5: calificaciones.filter(c => c.estrellas === 5).length,
        4: calificaciones.filter(c => c.estrellas === 4).length,
        3: calificaciones.filter(c => c.estrellas === 3).length,
        2: calificaciones.filter(c => c.estrellas === 2).length,
        1: calificaciones.filter(c => c.estrellas === 1).length
      };

      res.json({
        usuarioId,
        promedio: parseFloat(promedio),
        totalCalificaciones: calificaciones.length,
        distribucion,
        badge: this.obtenerBadge(parseFloat(promedio), calificaciones.length)
      });
    } catch (error) {
      console.error('Error en obtenerResumenRating:', error);
      res.status(500).json({ error: 'Error al obtener resumen' });
    }
  }

  /**
   * Responder a una calificación (negocio)
   */
  async responderCalificacion(req, res) {
    try {
      const { calificacionId } = req.params;
      const { respuesta } = req.body;
      const usuarioId = req.user?.id || req.body.usuarioId;

      if (!respuesta || respuesta.length < 10) {
        return res.status(400).json({ error: 'Respuesta debe tener al menos 10 caracteres' });
      }

      const calificacion = await Calificacion.findByPk(calificacionId);
      if (!calificacion) {
        return res.status(404).json({ error: 'Calificación no encontrada' });
      }

      // Verificar que el usuario sea el calificado
      if (calificacion.calificadoId !== usuarioId) {
        return res.status(403).json({ error: 'No tienes permiso para responder' });
      }

      calificacion.respuesta = respuesta.substring(0, 500);
      calificacion.respuestaFecha = new Date();
      await calificacion.save();

      res.json({
        success: true,
        message: 'Respuesta guardada',
        calificacion
      });
    } catch (error) {
      console.error('Error en responderCalificacion:', error);
      res.status(500).json({ error: 'Error al responder' });
    }
  }

  /**
   * Marcar calificación como útil
   */
  async marcarUtil(req, res) {
    try {
      const { calificacionId } = req.params;

      const calificacion = await Calificacion.findByPk(calificacionId);
      if (!calificacion) {
        return res.status(404).json({ error: 'Calificación no encontrada' });
      }

      calificacion.utilVotos = (calificacion.utilVotos || 0) + 1;
      await calificacion.save();

      res.json({
        success: true,
        utilVotos: calificacion.utilVotos
      });
    } catch (error) {
      console.error('Error en marcarUtil:', error);
      res.status(500).json({ error: 'Error' });
    }
  }

  /**
   * Obtener calificaciones más útiles de un usuario
   */
  async obtenerCalificacionesDestacadas(req, res) {
    try {
      const { usuarioId } = req.params;
      const { limite = 5 } = req.query;

      const calificaciones = await Calificacion.findAll({
        where: { 
          calificadoId: usuarioId,
          estado: 'PUBLICADA'
        },
        order: [
          ['utilVotos', 'DESC'],
          ['estrellas', 'DESC']
        ],
        limit: parseInt(limite),
        include: [
          { model: Usuario, as: 'calificador', attributes: ['nombre'] }
        ]
      });

      res.json({
        success: true,
        usuarioId,
        calificaciones
      });
    } catch (error) {
      console.error('Error en obtenerCalificacionesDestacadas:', error);
      res.status(500).json({ error: 'Error' });
    }
  }

  /**
   * === HELPERS ===
   */

  async actualizarRatingPromedio(usuarioId) {
    const calificaciones = await Calificacion.findAll({
      where: { calificadoId: usuarioId, estado: 'PUBLICADA' }
    });

    if (calificaciones.length === 0) return;

    const promedio = calificaciones.reduce((sum, c) => sum + c.estrellas, 0) / calificaciones.length;

    // Actualizar metadata del usuario
    const usuario = await Usuario.findByPk(usuarioId);
    if (usuario) {
      usuario.metadata = usuario.metadata || {};
      usuario.metadata.ratingPromedio = parseFloat(promedio.toFixed(1));
      usuario.metadata.totalCalificaciones = calificaciones.length;
      await usuario.save();
    }
  }

  obtenerBadge(promedio, total) {
    if (total < 5) return null;

    if (promedio >= 4.8) return { nombre: 'Excelente', emoji: '⭐⭐⭐⭐⭐', color: 'gold' };
    if (promedio >= 4.5) return { nombre: 'Muy Bueno', emoji: '⭐⭐⭐⭐', color: 'silver' };
    if (promedio >= 4.0) return { nombre: 'Bueno', emoji: '⭐⭐⭐⭐', color: 'blue' };
    if (promedio >= 3.5) return { nombre: 'Aceptable', emoji: '⭐⭐⭐', color: 'green' };
    return { nombre: 'Regular', emoji: '⭐⭐', color: 'orange' };
  }
}

module.exports = new CalificacionesController();
