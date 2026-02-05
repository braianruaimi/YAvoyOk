/**
 * YAvoy v3.1 - Modelo Puntos y Recompensas
 * Sistema de loyalidad - Acumular puntos y canjearlos
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PuntosRecompensas = sequelize.define('PuntosRecompensas', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  usuarioId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    references: { model: 'usuarios', key: 'id' }
  },

  // Puntos actuales disponibles
  puntosActuales: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: { min: 0 }
  },

  // Total de puntos acumulados históricos
  puntosAcumulados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },

  // Total de puntos canjeados
  puntosCanjados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },

  // Nivel de usuario (basado en puntos totales)
  nivel: {
    type: DataTypes.ENUM('BRONCE', 'PLATA', 'ORO', 'PLATINO', 'DIAMANTE'),
    defaultValue: 'BRONCE'
  },

  // Beneficios del nivel actual
  beneficios: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: { descuentoCompras: 0, puntosPorDolar: 1 }
  },

  // Último canje
  ultimoCanjeId: {
    type: DataTypes.UUID,
    allowNull: true
  },

  ultimoCanjeFecha: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Cupones activos
  cuponesActivos: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: true
  },

  // Estadísticas
  totalCompras: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  totalGastado: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },

  // Fecha de activación
  fechaActivacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },

  estado: {
    type: DataTypes.ENUM('ACTIVO', 'SUSPENDIDO', 'CANCELADO'),
    defaultValue: 'ACTIVO'
  }
}, {
  tableName: 'puntos_recompensas',
  timestamps: true
});

// Modelo de Historial de Puntos
const HistorialPuntos = sequelize.define('HistorialPuntos', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  usuarioId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' }
  },

  tipo: {
    type: DataTypes.ENUM('COMPRA', 'REFERIDO', 'RESENA', 'CANJE', 'BONO', 'AJUSTE'),
    allowNull: false
  },

  monto: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  referencia: {
    type: DataTypes.JSON,
    allowNull: true,
    // { pedidoId, referenciaId, etc }
  },

  descripcion: {
    type: DataTypes.STRING,
    allowNull: true
  },

  saldoAnterior: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  saldoPosterior: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'historial_puntos',
  timestamps: false
});

// Modelo de Recompensas Disponibles
const RecompensasLibrary = sequelize.define('RecompensasLibrary', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },

  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  puntosRequeridos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 10 }
  },

  tipo: {
    type: DataTypes.ENUM('DESCUENTO', 'PRODUCTO_GRATIS', 'ENVIO_GRATIS', 'BONO_PUNTOS', 'ACCESO_PREMIUM'),
    allowNull: false
  },

  valor: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },

  categoriasAplicable: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: true
  },

  cantidadDisponible: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null // null = ilimitado
  },

  cantidadUsada: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  validoHasta: {
    type: DataTypes.DATE,
    allowNull: true
  },

  estado: {
    type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'AGOTADO'),
    defaultValue: 'ACTIVO'
  },

  icono: {
    type: DataTypes.STRING,
    defaultValue: '🎁'
  },

  color: {
    type: DataTypes.STRING,
    defaultValue: '#FFD700' // dorado
  }
}, {
  tableName: 'recompensas_library',
  timestamps: true
});

// Asociaciones
PuntosRecompensas.associate = (models) => {
  PuntosRecompensas.belongsTo(models.Usuario, { foreignKey: 'usuarioId' });
  PuntosRecompensas.hasMany(HistorialPuntos, { foreignKey: 'usuarioId' });
};

HistorialPuntos.associate = (models) => {
  HistorialPuntos.belongsTo(models.Usuario, { foreignKey: 'usuarioId' });
};

module.exports = { PuntosRecompensas, HistorialPuntos, RecompensasLibrary };
