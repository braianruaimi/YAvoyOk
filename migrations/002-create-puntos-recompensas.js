'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ========================================
    // TABLA: PuntosRecompensas
    // ========================================
    await queryInterface.createTable('PuntosRecompensas', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      usuarioId: {
        type: Sequelize.STRING,
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
      puntosActuales: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        validate: { min: 0 },
      },
      puntosAcumulados: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        validate: { min: 0 },
      },
      nivel: {
        type: Sequelize.ENUM('BRONCE', 'PLATA', 'ORO', 'PLATINO', 'DIAMANTE'),
        defaultValue: 'BRONCE',
        index: true,
      },
      beneficios: {
        type: Sequelize.JSON,
        defaultValue: {
          descuentoCompras: 0,
          puntosPorDolar: 1.0,
          accesoEspecial: false,
        },
      },
      cuponesActivos: {
        type: Sequelize.JSON,
        defaultValue: [],
        comment: '[{"id": "CUPON-123", "tipo": "DESCUENTO", "valor": 10, "valido": "2026-06-01"}]',
      },
      ultimoCanjeReal: {
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
    // TABLA: HistorialPuntos
    // ========================================
    await queryInterface.createTable('HistorialPuntos', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      usuarioId: {
        type: Sequelize.STRING,
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
        type: Sequelize.ENUM('COMPRA', 'REFERIDO', 'RESENA', 'CANJE', 'BONO', 'AJUSTE'),
        allowNull: false,
        index: true,
      },
      monto: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Positivos o negativos',
      },
      saldoAnterior: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      saldoPosterior: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      referencia: {
        type: Sequelize.STRING,
        defaultValue: null,
        comment: 'pedidoId, recompensaId, etc',
      },
      descripcion: {
        type: Sequelize.TEXT,
        defaultValue: null,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        index: true,
      },
    });

    // ========================================
    // TABLA: RecompensasLibrary
    // ========================================
    await queryInterface.createTable('RecompensasLibrary', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      descripcion: {
        type: Sequelize.TEXT,
        defaultValue: null,
      },
      puntosRequeridos: {
        type: Sequelize.INTEGER,
        allowNull: false,
        index: true,
      },
      tipo: {
        type: Sequelize.ENUM(
          'DESCUENTO',
          'PRODUCTO_GRATIS',
          'ENVIO_GRATIS',
          'BONO_PUNTOS',
          'ACCESO_PREMIUM',
          'OTRO'
        ),
        allowNull: false,
      },
      valor: {
        type: Sequelize.INTEGER,
        comment: 'Para descuentos: porcentaje (10 = 10%). Para bonos: puntos',
      },
      cantidadDisponible: {
        type: Sequelize.INTEGER,
        defaultValue: null,
        comment: 'null = ilimitado',
      },
      validoDesde: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      validoHasta: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      imagen: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // Índices
    await queryInterface.addIndex('PuntosRecompensas', ['nivel']);
    await queryInterface.addIndex('HistorialPuntos', ['tipo', 'createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('RecompensasLibrary');
    await queryInterface.dropTable('HistorialPuntos');
    await queryInterface.dropTable('PuntosRecompensas');
  },
};
