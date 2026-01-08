/**
 * Health Check Controller
 * 
 * Handles health check endpoint logic
 */

const { sendSuccess } = require('../utils/responseHandler');

/**
 * Get health status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getHealth = (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  };

  return sendSuccess(res, healthData, 'Server is healthy', 200);
};

module.exports = {
  getHealth,
};
