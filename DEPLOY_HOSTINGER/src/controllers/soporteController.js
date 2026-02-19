/**
 * ====================================
 * 🎫 SOPORTE CONTROLLER - YAVOY
 * ====================================
 * 
 * Controlador para gestión de tickets de ayuda
 * Sistema de soporte técnico para usuarios
 * 
 * @author YAvoy Team
 * @version 3.0
 */

const path = require('path');
const fs = require('fs').promises;

const BASE_DIR = path.join(__dirname, '..', '..', 'registros');
const TICKETS_FILE = path.join(BASE_DIR, 'tickets-soporte.json');

// Almacenamiento en memoria (caché)
let tickets = [];
let ticketIdCounter = 1;

/**
 * Cargar tickets desde archivo JSON
 */
async function cargarTickets() {
  try {
    const data = await fs.readFile(TICKETS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    tickets = parsed.tickets || [];
    ticketIdCounter = parsed.nextId || 1;
    console.log(`✓ ${tickets.length} tickets cargados`);
  } catch (error) {
    // Si no existe el archivo, inicializar array vacío
    tickets = [];
    ticketIdCounter = 1;
  }
}

/**
 * Guardar tickets en archivo JSON
 */
async function guardarTickets() {
  try {
    await fs.mkdir(BASE_DIR, { recursive: true });
    await fs.writeFile(TICKETS_FILE, JSON.stringify({
      tickets,
      nextId: ticketIdCounter,
      ultimaActualizacion: new Date().toISOString()
    }, null, 2));
  } catch (error) {
    console.error('Error guardando tickets:', error);
  }
}

// Inicializar al cargar el módulo
cargarTickets();

/**
 * POST /api/soporte/tickets
 * Crear nuevo ticket de soporte
 */
async function crearTicket(req, res) {
  try {
    const { usuario, categoria, prioridad, asunto, descripcion, adjunto } = req.body;

    // Validaciones
    if (!usuario || !categoria || !asunto || !descripcion) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: usuario, categoria, asunto, descripcion'
      });
    }

    const ticket = {
      id: `TKT-${ticketIdCounter++}`,
      usuario,
      categoria, // 'tecnico', 'pago', 'cuenta', 'pedido', 'otro'
      prioridad: prioridad || 'media', // 'baja', 'media', 'alta', 'urgente'
      asunto,
      descripcion,
      adjunto: adjunto || null,
      estado: 'nuevo', // 'nuevo', 'en-progreso', 'resuelto', 'cerrado'
      fecha: new Date().toISOString(),
      respuestas: [],
      ultimaActualizacion: new Date().toISOString()
    };

    tickets.push(ticket);
    await guardarTickets();

    // Emitir evento Socket.IO (si está disponible)
    try {
      const socketService = require('../services/socketService');
      socketService.notificarCEO('nuevo-ticket', ticket);
    } catch (error) {
      // Socket.io no disponible, continuar
    }

    console.log(`🎫 Nuevo ticket creado: ${ticket.id} - ${asunto}`);

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error creando ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear ticket'
    });
  }
}

/**
 * GET /api/soporte/tickets
 * Listar tickets con filtros opcionales
 */
async function listarTickets(req, res) {
  try {
    const { usuario, estado, categoria, prioridad } = req.query;

    let ticketsFiltrados = [...tickets];

    // Filtrar por usuario
    if (usuario) {
      ticketsFiltrados = ticketsFiltrados.filter(t => t.usuario === usuario);
    }

    // Filtrar por estado
    if (estado) {
      ticketsFiltrados = ticketsFiltrados.filter(t => t.estado === estado);
    }

    // Filtrar por categoría
    if (categoria) {
      ticketsFiltrados = ticketsFiltrados.filter(t => t.categoria === categoria);
    }
    
    // Filtrar por prioridad
    if (prioridad) {
      ticketsFiltrados = ticketsFiltrados.filter(t => t.prioridad === prioridad);
    }

    // Ordenar por fecha (más recientes primero)
    ticketsFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json({
      success: true,
      total: ticketsFiltrados.length,
      tickets: ticketsFiltrados
    });
  } catch (error) {
    console.error('Error listando tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar tickets'
    });
  }
}

/**
 * GET /api/soporte/tickets/:id
 * Obtener ticket por ID
 */
async function obtenerTicket(req, res) {
  try {
    const { id } = req.params;
    const ticket = tickets.find(t => t.id === id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error obteniendo ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ticket'
    });
  }
}

/**
 * PUT /api/soporte/tickets/:id
 * Actualizar ticket (cambiar estado, agregar respuesta)
 */
async function actualizarTicket(req, res) {
  try {
    const { id } = req.params;
    const { estado, respuesta, autor } = req.body;

    const ticketIndex = tickets.findIndex(t => t.id === id);

    if (ticketIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    // Actualizar estado si se proporciona
    if (estado) {
      tickets[ticketIndex].estado = estado;
    }

    // Agregar respuesta si se proporciona
    if (respuesta) {
      tickets[ticketIndex].respuestas.push({
        autor: autor || 'Soporte',
        mensaje: respuesta,
        fecha: new Date().toISOString()
      });
    }

    tickets[ticketIndex].ultimaActualizacion = new Date().toISOString();

    await guardarTickets();

    // Emitir evento Socket.IO
    try {
      const socketService = require('../services/socketService');
      socketService.notificarTodos('ticket-actualizado', tickets[ticketIndex]);
    } catch (error) {
      // Socket.io no disponible, continuar
    }

    console.log(`🎫 Ticket actualizado: ${id} - Estado: ${tickets[ticketIndex].estado}`);

    res.json({
      success: true,
      ticket: tickets[ticketIndex]
    });
  } catch (error) {
    console.error('Error actualizando ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar ticket'
    });
  }
}

/**
 * DELETE /api/soporte/tickets/:id
 * Eliminar ticket (admin)
 */
async function eliminarTicket(req, res) {
  try {
    const { id } = req.params;

    const ticketIndex = tickets.findIndex(t => t.id === id);

    if (ticketIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Ticket no encontrado'
      });
    }

    // Eliminar ticket
    const ticketEliminado = tickets.splice(ticketIndex, 1)[0];
    await guardarTickets();

    console.log(`🗑️  Ticket eliminado: ${id}`);

    res.json({
      success: true,
      message: `Ticket ${id} eliminado`,
      ticket: ticketEliminado
    });
  } catch (error) {
    console.error('Error eliminando ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar ticket'
    });
  }
}

/**
 * GET /api/soporte/estadisticas
 * Obtener estadísticas de soporte
 */
async function getEstadisticas(req, res) {
  try {
    const { usuario } = req.query;

    let ticketsConsulta = usuario 
      ? tickets.filter(t => t.usuario === usuario)
      : tickets;

    const stats = {
      total: ticketsConsulta.length,
      nuevo: ticketsConsulta.filter(t => t.estado === 'nuevo').length,
      enProgreso: ticketsConsulta.filter(t => t.estado === 'en-progreso').length,
      resueltos: ticketsConsulta.filter(t => t.estado === 'resuelto').length,
      cerrados: ticketsConsulta.filter(t => t.estado === 'cerrado').length,
      pendientes: ticketsConsulta.filter(t => t.estado !== 'resuelto' && t.estado !== 'cerrado').length,
      tiempoPromedio: 0,
      porCategoria: {},
      porPrioridad: {}
    };

    // Calcular tiempo promedio de resolución (en horas)
    const ticketsResueltos = ticketsConsulta.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado');
    if (ticketsResueltos.length > 0) {
      const tiempos = ticketsResueltos.map(t => {
        const inicio = new Date(t.fecha);
        const fin = new Date(t.ultimaActualizacion);
        return (fin - inicio) / (1000 * 60 * 60); // Convertir a horas
      });
      stats.tiempoPromedio = Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length);
    }

    // Contar por categoría
    ticketsConsulta.forEach(t => {
      stats.porCategoria[t.categoria] = (stats.porCategoria[t.categoria] || 0) + 1;
      stats.porPrioridad[t.prioridad] = (stats.porPrioridad[t.prioridad] || 0) + 1;
    });

    res.json({
      success: true,
      estadisticas: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
}

module.exports = {
  crearTicket,
  listarTickets,
  obtenerTicket,
  actualizarTicket,
  eliminarTicket,
  getEstadisticas
};
