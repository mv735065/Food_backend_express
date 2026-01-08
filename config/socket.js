/**
 * Socket.io Configuration
 *
 * Sets up Socket.io server with authentication and room management.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');
const { User } = require('../models');
const { setSocketIO } = require('../utils/notificationService');

let io = null;

/**
 * Initialize Socket.io server
 * @param {http.Server} server - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findByPk(decoded.id);

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.userId} (${socket.userRole})`);

    // Join user-specific room
    socket.join(`user_${socket.userId}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.userId}`);
    });

    // Optional: Handle custom events
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  // Set Socket.io instance in notification service
  setSocketIO(io);

  console.log('✅ Socket.io initialized');

  return io;
};

/**
 * Get Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
