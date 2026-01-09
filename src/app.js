/**
 * Express Application Setup
 * 
 * Main application file that configures Express middleware,
 * routes, and error handling.
 */

const express = require('express');
const cors = require('cors');
const config = require('../config/config');
const logger = require('../middlewares/logger');
const { errorHandler, notFoundHandler } = require('../middlewares/errorHandler');
const routes = require('../routes');

// Initialize Express app
const app = express();

// CORS Middleware (must be before other middleware)
// Allowed origins: localhost for development, Vercel URL for production
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // Alternative dev port
  'http://localhost:5174', // Alternative Vite port
  'https://food-react-frontend-6acnuyohi-mv735065s-projects.vercel.app',
  // Add your Vercel preview URLs pattern (Vercel generates different URLs for each deployment)
  /^https:\/\/food-react-frontend.*\.vercel\.app$/,
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    // In development, also allow all localhost origins
    if (config.nodeEnv === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // In development, allow all origins for easier testing
    if (config.nodeEnv === 'development') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (isAllowed) {
      callback(null, true);
    } else {
      // If CORS_ORIGIN env var is set, use it as fallback
      if (config.cors.origin && config.cors.origin !== '*') {
        const envOrigins = config.cors.origin.includes(',')
          ? config.cors.origin.split(',').map(o => o.trim())
          : [config.cors.origin];
        if (envOrigins.includes(origin)) {
          return callback(null, true);
        }
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(logger); // Request logging

// Health check route (before API prefix)
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Food Backend API',
    version: '1.0.0',
    status: 'running',
  });
});

// API Routes
app.use(config.apiPrefix, routes);

// 404 Handler (must be after all routes)
app.use(notFoundHandler);

// Error Handler (must be last)
app.use(errorHandler);

module.exports = app;
