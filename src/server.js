/**
 * Server Startup File
 * 
 * Entry point for the application. Handles server initialization,
 * database connections, and graceful shutdown.
 */

require('dotenv').config();
const app = require('./app');
const config = require('../config/config');
const { connectDB, closeDB } = require('../config/database');
const { initializeSocket } = require('../config/socket');

// Initialize database connections before starting server
const startServer = async () => {
  try {
    // Connect to databases first
    await connectDB();

    // Start server after database connections are established
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🌐 API available at http://localhost:${config.port}${config.apiPrefix}`);
    });

    // Initialize Socket.io
    initializeSocket(server);

    // Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log('HTTP server closed.');
        // Close database connections
        await closeDB();
        process.exit(0);
      });

      // Force close server after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
const server = startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', async (err) => {
  console.error('Unhandled Promise Rejection:', err);
  const { closeDB } = require('../config/database');
  await closeDB();
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err);
  const { closeDB } = require('../config/database');
  await closeDB();
  process.exit(1);
});

module.exports = server;
