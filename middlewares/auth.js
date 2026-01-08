/**
 * Authentication & Authorization Middleware
 */

const jwt = require('jsonwebtoken');
const { AppError, asyncHandler } = require('./errorHandler');
const { User } = require('../models');
const config = require('../config/config');

/**
 * Protect routes - requires valid JWT
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authorization header missing', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return next(new AppError('User not found or inactive', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
});

/**
 * Role-based authorization middleware
 * @param  {...string} roles - allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: insufficient permissions', 403));
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
