/**
 * Database Configuration
 * 
 * Main database connection handler that initializes both
 * PostgreSQL (Sequelize) and MongoDB (Mongoose) connections.
 * 
 * PostgreSQL: Stores all relational data (users, restaurants, orders, etc.)
 * MongoDB: Stores notifications only
 */

const { connectPostgres, closePostgres } = require('./postgres');
const { connectMongoDB, closeMongoDB } = require('./mongodb');

/**
 * Initialize all database connections
 * Connects to both PostgreSQL and MongoDB
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    console.log('🔄 Initializing database connections...');
    
    // Connect to PostgreSQL (main relational database)
    await connectPostgres();
    
    // Connect to MongoDB (notifications only)
    await connectMongoDB();
    
    console.log('✅ All database connections established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

/**
 * Close all database connections gracefully
 * Used during server shutdown
 * @returns {Promise<void>}
 */
const closeDB = async () => {
  try {
    console.log('🔄 Closing database connections...');
    await Promise.all([closePostgres(), closeMongoDB()]);
    console.log('✅ All database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
};

module.exports = {
  connectDB,
  closeDB,
};
