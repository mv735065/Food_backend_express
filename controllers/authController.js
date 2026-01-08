/**
 * Authentication Controller
 * Handles user registration, login, and profile retrieval.
 */

const jwt = require('jsonwebtoken');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/responseHandler');
const { User, Restaurant, MenuItem } = require('../models');
const config = require('../config/config');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn || '7d' }
  );
};

/**
 * Register a new user
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role = 'USER' } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Name, email, and password are required', 400));
  }

  const normalizedEmail = email.toLowerCase();
  const normalizedRole = String(role).toUpperCase();

  if (!User.ROLES.includes(normalizedRole)) {
    return next(new AppError('Invalid role provided', 400));
  }

  const existingUser = await User.scope('withPassword').findOne({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return next(new AppError('Email already registered', 409));
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: normalizedRole,
  });

  const token = generateToken(user);

  return sendSuccess(
    res,
    { user: user.toJSON(), token },
    'User registered successfully',
    201
  );
});

/**
 * Login existing user
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  const normalizedEmail = email.toLowerCase();
  const user = await User.scope('withPassword').findOne({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  const isValid = await user.validPassword(password);

  if (!isValid) {
    return next(new AppError('Invalid credentials', 401));
  }

  const token = generateToken(user);
  const userData = user.toJSON();

  // If user is a restaurant owner, include their restaurants
  if (user.role === 'RESTAURANT' || user.role === 'ADMIN') {
    const restaurants = await Restaurant.findAll({
      where: { ownerId: user.id },
      include: [
        {
          model: MenuItem,
          as: 'menuItems',
          required: false,
        },
      ],
    });
    userData.restaurants = restaurants;
  }

  return sendSuccess(res, { user: userData, token }, 'Login successful');
});

/**
 * Get current authenticated user
 */
const getMe = asyncHandler(async (req, res) => {
  const userData = req.user.toJSON();

  // If user is a restaurant owner, include their restaurants
  if (req.user.role === 'RESTAURANT' || req.user.role === 'ADMIN') {
    const restaurants = await Restaurant.findAll({
      where: { ownerId: req.user.id },
      include: [
        {
          model: MenuItem,
          as: 'menuItems',
          required: false,
        },
      ],
    });
    userData.restaurants = restaurants;
  }

  return sendSuccess(res, { user: userData }, 'Current user fetched');
});

module.exports = {
  register,
  login,
  getMe,
};
