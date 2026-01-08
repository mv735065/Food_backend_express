/**
 * Response Handler Utility
 * 
 * Utility functions for sending consistent API responses
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    status: 'success',
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 */
const sendError = (res, message = 'Error', statusCode = 400) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
