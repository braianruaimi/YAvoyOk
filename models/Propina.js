/**
 * YAvoy v3.1 - Modelo Propinas Digitales
 * Sistema de propinas directas para repartidores
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Propina = sequelize.define('Propina', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  pedidoId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    references: { model: 'pedidos', key: 'id' }
  },

  repartidorId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' }
  },

  clienteId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' }
  },

  monto: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0.10,
      max: 999.99
    }
  },

  moneda: {
    type: DataTypes.STRING,
    defaultValue: 'ARS',
    allowNull: false
  },

  // Motivo de la propina (opcional pero para análisis)
  motivo: {
    type: DataTypes.ENUM(
      'RAPIDEZ',
      'AMABILIDAD',
      'PROFESIONALISMO',
      'CLIMA',
      'OTRA'
    ),
    allowNull: true
  },

  // Mensaje del cliente
  mensaje: {
    type: DataTypes.STRING(200),
    allowNull: true
  },

  // Estado del pago
  estado: {
    type: DataTypes.ENUM(
      'PENDIENTE',        // Cliente ofreció, repartidor no vio
      'ACEPTADA',         // Repartidor aceptó
      'RECHAZADA',        // Repartidor rechazó
      'PROCESADA',        // Pago procesado
      'COMPLETADA'        // Dinero en cuenta repartidor
    ),
    defaultValue: 'PENDIENTE'
  },

  // Métodos de pago
  metodoPago: {
    type: DataTypes.ENUM(
      'WALLET',           // Billetera YAvoy
      'TARJETA',
      'EFECTIVO',
      'CREDITO'
    ),
    defaultValue: 'WALLET'
  },

  // IDs de transacción
  transaccionId: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // Comisión de YAvoy (%)
  comisionYavoy: {
    type: DataTypes.FLOAT,
    defaultValue: 0.10,  // 10%
    allowNull: false
  },

  montoRepartidor: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.monto * (1 - this.comisionYavoy);
    }
  },

  // Timestamps
  fechaOfrecida: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },

  fechaRespuesta: {
    type: DataTypes.DATE,
    allowNull: true
  },

  fechaProcesamiento: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Notificación
  notificacionEnviada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  notificacionFecha: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'propinas',
  timestamps: true,
  indexes: [
    { fields: ['repartidorId'] },
    { fields: ['clienteId'] },
    { fields: ['pedidoId'] },
    { fields: ['estado'] },
    { fields: ['fechaOfrecida'] }
  ]
});

// Modelo de Estadísticas de Propinas
const EstadisticasPropina = sequelize.define('EstadisticasPropina', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  repartidorId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    references: { model: 'usuarios', key: 'id' }
  },

  totalPropinaRecibida: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    allowNull: false
  },

  contadorPropinas: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },

  porcentajeAceptacion: {
    type: DataTypes.FLOAT,
    defaultValue: 0,  // %
    allowNull: false
  },

  propinaPromedio: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    allowNull: false
  },

  ranking: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  mejorMesRecaudacion: {
    type: DataTypes.STRING,
    allowNull: true
  },

  medallasBronce: {
    type: DataTypes.INTEGER,
    defaultValue: 0  // Recibió +$100 en propinas
  },

  medallasPlata: {
    type: DataTypes.INTEGER,
    defaultValue: 0   // Recibió +$500 en propinas
  },

  medallasOro: {
    type: DataTypes.INTEGER,
    defaultValue: 0    // Recibió +$1000 en propinas
  }
}, {
  tableName: 'estadisticas_propina',
  timestamps: true
});

// Asociaciones
Propina.associate = (models) => {
  Propina.belongsTo(models.Pedido, { foreignKey: 'pedidoId' });
  Propina.belongsTo(models.Usuario, { foreignKey: 'repartidorId', as: 'repartidor' });
  Propina.belongsTo(models.Usuario, { foreignKey: 'clienteId', as: 'cliente' });
};

EstadisticasPropina.associate = (models) => {
  EstadisticasPropina.belongsTo(models.Usuario, { foreignKey: 'repartidorId' });
};

module.exports = { Propina, EstadisticasPropina };
