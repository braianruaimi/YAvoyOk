
const fs = require('fs');
const path = require('path');
const Usuario = require('../models/Usuario');
const Pedido = require('../models/Pedido');
const sequelize = require('../config/database');

async function migrateUsuarios() {
  const files = ['clientes.json', 'comercios.json', 'repartidores.json'];
  for (const file of files) {
    const tipo = file.includes('cliente') ? 'CLIENTE' : file.includes('comercio') ? 'COMERCIO' : 'REPARTIDOR';
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../registros/', file)));
    for (const usuario of data) {
      await Usuario.findOrCreate({
        where: { id: usuario.id },
        defaults: {
          id: usuario.id,
          tipo,
          email: usuario.email,
          password: usuario.password,
          nombre: usuario.nombre,
          telefono: usuario.telefono || '',
          metadata: usuario.metadata || usuario.datos || {},
          estado: usuario.estado || 'activo',
          verificado: usuario.verificado || false
        }
      });
    }
  }
}

async function migratePedidos() {
  const pedidosPath = path.join(__dirname, '../registros/pedidos.json');
  if (!fs.existsSync(pedidosPath)) return;
  const pedidos = JSON.parse(fs.readFileSync(pedidosPath));
  for (const pedido of pedidos) {
    await Pedido.findOrCreate({
      where: { id: pedido.id },
      defaults: {
        id: pedido.id,
        clienteId: pedido.clienteId,
        comercioId: pedido.comercioId,
        repartidorId: pedido.repartidorId || null,
        estado: pedido.estado ? pedido.estado.toUpperCase() : 'PENDIENTE',
        total: pedido.total || 0,
        metodoPago: pedido.metodoPago || 'efectivo',
        productos: pedido.productos || [],
        direccionEntrega: pedido.direccionEntrega || {},
        fecha: pedido.fecha || new Date()
      }
    });
  }
}

(async () => {
  await sequelize.sync();
  await migrateUsuarios();
  await migratePedidos();
  console.log('Migración completada.');
  process.exit(0);
})();
