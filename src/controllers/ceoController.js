
const Usuario = require('../../models/Usuario');
const Pedido = require('../../models/Pedido');

const ceoController = {
  async getRepartidores(req, res) {
    try {
      const repartidores = await Usuario.findAll({ where: { tipo: 'REPARTIDOR' } });
      res.json({ success: true, repartidores });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener repartidores' });
    }
  },
  async getComercios(req, res) {
    try {
      const comercios = await Usuario.findAll({ where: { tipo: 'COMERCIO' } });
      res.json({ success: true, comercios });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener comercios' });
    }
  },
  async getClientes(req, res) {
    try {
      const clientes = await Usuario.findAll({ where: { tipo: 'CLIENTE' } });
      res.json({ success: true, clientes });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener clientes' });
    }
  },
  async getStats(req, res) {
    try {
      const totalPedidos = await Pedido.count();
      const totalUsuarios = await Usuario.count({ where: { estado: 'activo' } });
      const totalComercios = await Usuario.count({ where: { tipo: 'COMERCIO' } });
      const totalRepartidores = await Usuario.count({ where: { tipo: 'REPARTIDOR' } });
      const totalClientes = await Usuario.count({ where: { tipo: 'CLIENTE' } });
      res.json({ success: true, totalPedidos, totalUsuarios, totalComercios, totalRepartidores, totalClientes });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
  },
  // Agrega aquí los métodos para las demás pestañas del panel CEO según sea necesario
};

module.exports = ceoController;
