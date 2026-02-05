'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ========================================
    // TABLA: Calificaciones
    // ========================================
    await queryInterface.createTable('Calificaciones', {
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
      calificadorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      calificadoId: {
        // Puede ser comercio, repartidor, o cliente
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
      tipo: {
        type: Sequelize.ENUM('COMERCIO', 'REPARTIDOR', 'CLIENTE'),
        allowNull: false,
        index: true,
      },
      estrellas: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
      comentario: {
        type: Sequelize.TEXT,
        defaultValue: null,
        validate: { len: [0, 500] },
      },
      aspectos: {
        type: Sequelize.JSON,
        defaultValue: {},
        comment: '{"velocidad": 5, "amabilidad": 4, "presentacion": 5}',
      },
      tags: {
        type: Sequelize.JSON,
        defaultValue: [],
        comment: '["rapido", "profesional", "amable"]',
      },
      utilVotos: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      respuesta: {
        type: Sequelize.TEXT,
        defaultValue: null,
      },
      respuestaFecha: {
        type: Sequelize.DATE,
        defaultValue: null,
      },
      estado: {
        type: Sequelize.ENUM('PENDIENTE', 'PUBLICADA', 'OCULTA', 'RECHAZADA'),
        defaultValue: 'PENDIENTE',
        index: true,
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

    // Índices adicionales
    await queryInterface.addIndex('Calificaciones', ['calificadoId', 'tipo']);
    await queryInterface.addIndex('Calificaciones', ['estado', 'estrellas']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Calificaciones');
  },
};
