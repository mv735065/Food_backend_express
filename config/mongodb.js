/**
 * MongoDB Database Configuration
 * 
 * Handles MongoDB database connection using Mongoose ODM.
 * This database stores only notifications:
 * - User notifications
 * - Restaurant notifications
 * - Rider notifications
 * - Order status notifications
 */

const mongoose = require('mongoose');
const config = require('./config');

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectMongoDB = async () => {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(config.mongodb.uri, options);
    console.log('✅ MongoDB connection established successfully');
    console.log(`📊 MongoDB database: ${mongoose.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
  } catch (error) {
    console.error('❌ Unable to connect to MongoDB database:', error.message);
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Close MongoDB connection gracefully
 * @returns {Promise<void>}
 */
const closeMongoDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};

module.exports = {
  mongoose,
  connectMongoDB,
  closeMongoDB,
};
