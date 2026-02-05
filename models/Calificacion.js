/**
 * YAvoy v3.1 - Modelo Calificaciones
 * Sistema de ratings 1-5 estrellas para repartidores y comercios
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Calificacion = sequelize.define('Calificacion', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => `CAL${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  pedidoId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'pedidos', key: 'id' }
  },
  
  // Quién califica
  calificadorId: {
    type: DataTypes.STRING,
    allowNull: false,  // Cliente o Comercio
    references: { model: 'usuarios', key: 'id' }
  },
  
  // A quién se califica
  calificadoId: {
    type: DataTypes.STRING,
    allowNull: false,  // Repartidor o Comercio
    references: { model: 'usuarios', key: 'id' }
  },
  
  tipo: {
    type: DataTypes.ENUM('REPARTIDOR', 'COMERCIO'),
    allowNull: false
  },
  
  // Rating 1-5 estrellas
  estrellas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  
  // Comentario del usuario
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: { len: [0, 500] }
  },
  
  // Categorías específicas
  aspectos: {
    type: DataTypes.JSON,  // { velocidad: 5, amabilidad: 4, presentacion: 5 }
    allowNull: true
  },
  
  // Tags predefinidos
  tags: {
    type: DataTypes.JSON,  // ['rapido', 'profesional', 'amable']
    allowNull: true
  },
  
  // Respuesta del negocio
  respuesta: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  respuestaFecha: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Útilidad de la reseña
  utilVotos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  
  // Puntuación de confiabilidad (admin)
  verificada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'PUBLICADA', 'OCULTA', 'RECHAZADA'),
    defaultValue: 'PENDIENTE'
  },
  
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'calificaciones',
  timestamps: true,
  indexes: [
    { fields: ['calificadoId'] },
    { fields: ['pedidoId'] },
    { fields: ['tipo'] },
    { fields: ['estado'] },
    { fields: ['estrellas'] }
  ]
});

// Asociaciones
Calificacion.associate = (models) => {
  Calificacion.belongsTo(models.Pedido, { foreignKey: 'pedidoId' });
  Calificacion.belongsTo(models.Usuario, { foreignKey: 'calificadorId', as: 'calificador' });
  Calificacion.belongsTo(models.Usuario, { foreignKey: 'calificadoId', as: 'calificado' });
};

module.exports = Calificacion;
