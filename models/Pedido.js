const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');

const Pedido = sequelize.define('Pedido', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true
  },
  clienteId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  comercioId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  repartidorId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'ASIGNADO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'),
    allowNull: false
  },
  total: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  metodoPago: {
    type: DataTypes.STRING,
    allowNull: false
  },
  productos: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  direccionEntrega: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'pedidos',
  timestamps: true
});

Pedido.belongsTo(Usuario, { as: 'cliente', foreignKey: 'clienteId' });
Pedido.belongsTo(Usuario, { as: 'comercio', foreignKey: 'comercioId' });
Pedido.belongsTo(Usuario, { as: 'repartidor', foreignKey: 'repartidorId' });

module.exports = Pedido;
