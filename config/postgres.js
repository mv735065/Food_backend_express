/**
 * PostgreSQL Database Configuration
 * 
 * Handles PostgreSQL database connection using Sequelize ORM.
 * This database stores all relational data:
 * - Users (all roles: customer, restaurant, rider, admin)
 * - Restaurants
 * - Menu items
 * - Orders
 * - Riders
 * - Payments
 */

const { Sequelize } = require('sequelize');
const config = require('./config');

// Use DATABASE_URL if present (Render production) or fallback to individual config
const sequelize = config.postgres.url
  ? new Sequelize(config.postgres.url, {
      dialect: 'postgres',
      logging: config.nodeEnv === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // required for Render Postgres
        },
      },
    })
  : new Sequelize(
      config.postgres.database,
      config.postgres.username,
      config.postgres.password,
      {
        host: config.postgres.host,
        port: config.postgres.port,
        dialect: 'postgres',
        logging: config.nodeEnv === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        dialectOptions: {
          ssl: config.postgres.ssl
            ? { require: true, rejectUnauthorized: false }
            : false,
        },
      }
    );

/**
 * Test PostgreSQL connection
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL database:', error.message);
    throw error;
  }
};

/**
 * Connect to PostgreSQL database
 */
const connectPostgres = async () => {
  try {
    await testConnection();
    // Initialize models
    require('../models');
    // Synchronize models with the database
    const syncOptions = config.nodeEnv === 'development' ? { alter: true } : {};
    await sequelize.sync(syncOptions);
    console.log('📦 Sequelize models synchronized');

    const dbName = config.postgres.url
      ? sequelize.config.database || 'connected'
      : config.postgres.database;
    console.log(`📊 PostgreSQL database: ${dbName}`);
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    process.exit(1);
  }
};

/**
 * Close PostgreSQL connection gracefully
 */
const closePostgres = async () => {
  try {
    await sequelize.close();
    console.log('PostgreSQL connection closed');
  } catch (error) {
    console.error('Error closing PostgreSQL connection:', error);
  }
};

module.exports = {
  sequelize,
  connectPostgres,
  closePostgres,
  testConnection,
};
