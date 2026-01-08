/**
 * Express Application Setup
 * 
 * Main application file that configures Express middleware,
 * routes, and error handling.
 */

const express = require('express');
const config = require('../config/config');
const logger = require('../middlewares/logger');
const { errorHandler, notFoundHandler } = require('../middlewares/errorHandler');
const routes = require('../routes');

// Initialize Express app
const app = express();

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
