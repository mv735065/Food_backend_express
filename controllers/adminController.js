/**
 * Admin Controller
 * 
 * Admin-only endpoints for managing users, restaurants, orders, and riders
 */

const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/responseHandler');
const { User, Restaurant, Order, MenuItem } = require('../models');

/**
 * Get all users
 * GET /api/admin/users
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    order: [['createdAt', 'DESC']],
  });

  return sendSuccess(res, { users }, 'Users fetched');
});

/**
 * Update a user
 * PUT /api/admin/users/:userId
 */
const updateUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { name, email, role, isActive } = req.body;

  const user = await User.findByPk(userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Prevent admin from changing their own role or deactivating themselves
  if (user.id === req.user.id) {
    if (role && role !== 'ADMIN') {
      return next(new AppError('Cannot change your own role', 400));
    }
    if (isActive === false) {
      return next(new AppError('Cannot deactivate yourself', 400));
    }
  }

  // Update fields
  if (name !== undefined) user.name = name;
  if (email !== undefined) {
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser && existingUser.id !== userId) {
      return next(new AppError('Email already in use', 400));
    }
    user.email = email.toLowerCase();
  }
  if (role !== undefined) {
    if (!User.ROLES.includes(role.toUpperCase())) {
      return next(new AppError('Invalid role', 400));
    }
    user.role = role.toUpperCase();
  }
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  return sendSuccess(res, { user }, 'User updated');
});

/**
 * Delete a user (soft delete)
 * DELETE /api/admin/users/:userId
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findByPk(userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Prevent admin from deleting themselves
  if (user.id === req.user.id) {
    return next(new AppError('Cannot delete yourself', 400));
  }

  await user.destroy();

  return sendSuccess(res, null, 'User deleted');
});

/**
 * Get all restaurants (admin view)
 * GET /api/admin/restaurants
 */
const getRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.findAll({
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: MenuItem,
        as: 'menuItems',
        required: false,
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return sendSuccess(res, { restaurants }, 'Restaurants fetched');
});

/**
 * Create a restaurant (admin can create for any owner)
 * POST /api/admin/restaurants
 */
const createRestaurant = asyncHandler(async (req, res, next) => {
  const { name, description, address, phoneNumber, cuisineType, imageUrl, ownerId } = req.body;

  if (!name) {
    return next(new AppError('Restaurant name is required', 400));
  }

  // If ownerId is provided, verify the user exists and is a RESTAURANT role
  let finalOwnerId = req.user.id;
  if (ownerId) {
    const owner = await User.findByPk(ownerId);
    if (!owner) {
      return next(new AppError('Owner not found', 404));
    }
    if (owner.role !== 'RESTAURANT' && owner.role !== 'ADMIN') {
      return next(new AppError('Owner must have RESTAURANT or ADMIN role', 400));
    }
    finalOwnerId = ownerId;
  }

  const restaurant = await Restaurant.create({
    name,
    description,
    address,
    phoneNumber,
    cuisineType: cuisineType || 'indian',
    imageUrl,
    ownerId: finalOwnerId,
  });

  return sendSuccess(res, { restaurant }, 'Restaurant created', 201);
});

/**
 * Update a restaurant (admin)
 * PUT /api/admin/restaurants/:restaurantId
 */
const updateRestaurant = asyncHandler(async (req, res, next) => {
  const { restaurantId } = req.params;
  const { name, description, address, phoneNumber, cuisineType, imageUrl, isActive, ownerId } = req.body;

  const restaurant = await Restaurant.findByPk(restaurantId);

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  // Update fields
  if (name !== undefined) restaurant.name = name;
  if (description !== undefined) restaurant.description = description;
  if (address !== undefined) restaurant.address = address;
  if (phoneNumber !== undefined) restaurant.phoneNumber = phoneNumber;
  if (cuisineType !== undefined) restaurant.cuisineType = cuisineType;
  if (imageUrl !== undefined) restaurant.imageUrl = imageUrl;
  if (isActive !== undefined) restaurant.isActive = isActive;
  
  // Admin can change restaurant owner
  if (ownerId !== undefined) {
    const owner = await User.findByPk(ownerId);
    if (!owner) {
      return next(new AppError('Owner not found', 404));
    }
    if (owner.role !== 'RESTAURANT' && owner.role !== 'ADMIN') {
      return next(new AppError('Owner must have RESTAURANT or ADMIN role', 400));
    }
    restaurant.ownerId = ownerId;
  }

  await restaurant.save();

  return sendSuccess(res, { restaurant }, 'Restaurant updated');
});

/**
 * Delete a restaurant (admin)
 * DELETE /api/admin/restaurants/:restaurantId
 */
const deleteRestaurant = asyncHandler(async (req, res, next) => {
  const { restaurantId } = req.params;

  const restaurant = await Restaurant.findByPk(restaurantId);

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  await restaurant.destroy();

  return sendSuccess(res, null, 'Restaurant deleted');
});

/**
 * Get all orders (admin view)
 * GET /api/admin/orders
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findAll({
    include: [
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name'],
      },
      {
        model: User,
        as: 'rider',
        attributes: ['id', 'name', 'email'],
        required: false,
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return sendSuccess(res, { orders }, 'Orders fetched');
});

/**
 * Get all riders
 * GET /api/admin/riders
 */
const getRiders = asyncHandler(async (req, res) => {
  const riders = await User.findAll({
    where: { role: 'RIDER' },
    order: [['createdAt', 'DESC']],
  });

  return sendSuccess(res, { riders }, 'Riders fetched');
});

/**
 * Delete a rider (soft delete)
 * DELETE /api/admin/riders/:riderId
 */
const deleteRider = asyncHandler(async (req, res, next) => {
  const { riderId } = req.params;

  const rider = await User.findByPk(riderId);

  if (!rider) {
    return next(new AppError('Rider not found', 404));
  }

  if (rider.role !== 'RIDER') {
    return next(new AppError('User is not a rider', 400));
  }

  await rider.destroy();

  return sendSuccess(res, null, 'Rider deleted');
});

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  getRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getAllOrders,
  getRiders,
  deleteRider,
};
