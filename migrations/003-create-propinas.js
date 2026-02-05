'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ========================================
    // TABLA: Propinas
    // ========================================
    await queryInterface.createTable('Propinas', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      pedidoId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Pedidos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        index: true,
      },
      clienteId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        index: true,
      },
      repartidorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        index: true,
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0.1, max: 9999.99 },
      },
      estado: {
        type: Sequelize.ENUM('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'PROCESADA', 'COMPLETADA'),
        defaultValue: 'PENDIENTE',
        index: true,
      },
      motivo: {
        type: Sequelize.ENUM('RAPIDEZ', 'AMABILIDAD', 'PROFESIONALISMO', 'CLIMA', 'OTRA'),
        allowNull: false,
      },
      mensaje: {
        type: Sequelize.TEXT,
        defaultValue: null,
        validate: { len: [0, 200] },
      },
      metodoPago: {
        type: Sequelize.ENUM('WALLET', 'TARJETA', 'EFECTIVO', 'CREDITO'),
        defaultValue: 'WALLET',
      },
      comisionYavoy: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.1,
        comment: 'Porcentaje de comisión (0.10 = 10%)',
      },
      respuestaRepartidor: {
        type: Sequelize.ENUM('ACEPTADA', 'RECHAZADA'),
        defaultValue: null,
      },
      respuestaFecha: {
        type: Sequelize.DATE,
        defaultValue: null,
      },
      fechaProcesamiento: {
        type: Sequelize.DATE,
        defaultValue: null,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // ========================================
    // TABLA: EstadisticasPropinas
    // ========================================
    await queryInterface.createTable('EstadisticasPropinas', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      repartidorId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'Usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        index: true,
      },
      totalPropinaRecibida: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.0,
      },
      cantidadPropinas: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      propinaPromedio: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      cantidadAceptadas: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      cantidadRechazadas: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      porcentajeAceptacion: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.0,
        comment: 'Porcentaje (0-100)',
      },
      medallasBronce: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '$100 en propinas',
      },
      medallasPlata: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '$500 en propinas',
      },
      medallasOro: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '$1000 en propinas',
      },
      medallasElite: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '$1000+ en propinas',
      },
      ranking: {
        type: Sequelize.INTEGER,
        defaultValue: null,
        index: true,
      },
      ultimaActualizacion: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Índices
    await queryInterface.addIndex('Propinas', ['estado', 'repartidorId']);
    await queryInterface.addIndex('Propinas', ['clienteId', 'createdAt']);
    await queryInterface.addIndex('EstadisticasPropinas', ['ranking', 'totalPropinaRecibida']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('EstadisticasPropinas');
    await queryInterface.dropTable('Propinas');
  },
};
