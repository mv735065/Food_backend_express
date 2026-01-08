/**
 * Restaurant Controller
 */

const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/responseHandler');
const { Restaurant } = require('../models');

/**
 * Create a restaurant (owner must be RESTAURANT or ADMIN)
 */
const createRestaurant = asyncHandler(async (req, res, next) => {
  const { name, description, address, phoneNumber, cuisineType, imageUrl } = req.body;

  if (!name) {
    return next(new AppError('Restaurant name is required', 400));
  }

  const restaurant = await Restaurant.create({
    name,
    description,
    address,
    phoneNumber,
    cuisineType: cuisineType || 'indian',
    imageUrl,
    ownerId: req.user.id,
  });

  return sendSuccess(res, { restaurant }, 'Restaurant created', 201);
});

/**
 * Get all active restaurants (public)
 */
const getRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.findAll({
    where: { isActive: true },
    order: [['createdAt', 'DESC']],
  });

  return sendSuccess(res, { restaurants }, 'Restaurants fetched');
});

/**
 * Get restaurants owned by the authenticated user
 */
const getMyRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.findAll({
    where: { ownerId: req.user.id },
    include: [
      {
        model: require('../models').MenuItem,
        as: 'menuItems',
        required: false,
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return sendSuccess(res, { restaurants }, 'My restaurants fetched');
});

/**
 * Get a single restaurant by ID (with menu items)
 */
const getRestaurantById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const restaurant = await Restaurant.findByPk(id, {
    include: [
      {
        model: require('../models').MenuItem,
        as: 'menuItems',
        required: false,
      },
    ],
  });

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  return sendSuccess(res, { restaurant }, 'Restaurant fetched');
});

/**
 * Update a restaurant (only owner or admin)
 */
const updateRestaurant = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, address, phoneNumber, cuisineType, imageUrl, isActive } = req.body;

  const restaurant = await Restaurant.findByPk(id);

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  // Check ownership
  if (req.user.role !== 'ADMIN' && restaurant.ownerId !== req.user.id) {
    return next(new AppError('Not allowed to update this restaurant', 403));
  }

  // Update fields
  if (name !== undefined) restaurant.name = name;
  if (description !== undefined) restaurant.description = description;
  if (address !== undefined) restaurant.address = address;
  if (phoneNumber !== undefined) restaurant.phoneNumber = phoneNumber;
  if (cuisineType !== undefined) restaurant.cuisineType = cuisineType;
  if (imageUrl !== undefined) restaurant.imageUrl = imageUrl;
  if (isActive !== undefined) restaurant.isActive = isActive;

  await restaurant.save();

  return sendSuccess(res, { restaurant }, 'Restaurant updated');
});

/**
 * Delete a restaurant (soft delete - only owner or admin)
 */
const deleteRestaurant = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const restaurant = await Restaurant.findByPk(id);

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  // Check ownership
  if (req.user.role !== 'ADMIN' && restaurant.ownerId !== req.user.id) {
    return next(new AppError('Not allowed to delete this restaurant', 403));
  }

  await restaurant.destroy();

  return sendSuccess(res, null, 'Restaurant deleted');
});

module.exports = {
  createRestaurant,
  getRestaurants,
  getMyRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
};
