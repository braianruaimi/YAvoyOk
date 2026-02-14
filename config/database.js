
const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 3,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: 30000,
      idle: 5000
    },
    logging: isProd ? false : console.log,
    timezone: '+00:00',
    retry: {
      max: 3, // Número máximo de reintentos
      backoffBase: 100, // Tiempo base en ms
      backoffExponent: 1.5 // Exponente para backoff exponencial
    }
  }
);

module.exports = sequelize;
