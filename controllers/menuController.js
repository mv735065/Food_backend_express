/**
 * Menu Controller
 */

const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/responseHandler');
const { Restaurant, MenuItem } = require('../models');

/**
 * Ensure the authenticated user owns the restaurant (or is admin)
 */
const assertRestaurantOwner = async (req, restaurantId) => {
  const restaurant = await Restaurant.findByPk(restaurantId);

  if (!restaurant || !restaurant.isActive) {
    throw new AppError('Restaurant not found', 404);
  }

  if (req.user.role !== 'ADMIN' && restaurant.ownerId !== req.user.id) {
    throw new AppError('Not allowed to manage this restaurant', 403);
  }

  return restaurant;
};

/**
 * Create a menu item for a restaurant
 */
const createMenuItem = asyncHandler(async (req, res, next) => {
  const restaurantId = req.params.id; // From nested route /restaurants/:id/menu
  const { name, description, price, category, imageUrl, isAvailable = true } = req.body;

  if (!name || price == null) {
    return next(new AppError('Name and price are required', 400));
  }

  if (!category) {
    return next(new AppError('Category is required', 400));
  }

  const restaurant = await assertRestaurantOwner(req, restaurantId);

  const menuItem = await MenuItem.create({
    name,
    description,
    price,
    category,
    imageUrl,
    isAvailable,
    restaurantId: restaurant.id,
  });

  return sendSuccess(res, { menuItem }, 'Menu item created', 201);
});

/**
 * Get menu for a restaurant
 */
const getMenu = asyncHandler(async (req, res, next) => {
  const restaurantId = req.params.id; // From nested route /restaurants/:id/menu

  const restaurant = await Restaurant.findByPk(restaurantId);
  if (!restaurant || !restaurant.isActive) {
    return next(new AppError('Restaurant not found', 404));
  }

  const menuItems = await MenuItem.findAll({
    where: { restaurantId: restaurant.id, isAvailable: true },
    order: [['createdAt', 'DESC']],
  });

  return sendSuccess(res, { restaurant, menuItems }, 'Menu fetched');
});

/**
 * Update a menu item (only restaurant owner or admin)
 */
const updateMenuItem = asyncHandler(async (req, res, next) => {
  const restaurantId = req.params.id; // From nested route /restaurants/:id/menu
  const itemId = req.params.itemId;
  const { name, description, price, category, imageUrl, isAvailable } = req.body;

  // Verify restaurant ownership
  const restaurant = await assertRestaurantOwner(req, restaurantId);

  const menuItem = await MenuItem.findOne({
    where: { id: itemId, restaurantId: restaurant.id },
  });

  if (!menuItem) {
    return next(new AppError('Menu item not found', 404));
  }

  // Update fields
  if (name !== undefined) menuItem.name = name;
  if (description !== undefined) menuItem.description = description;
  if (price !== undefined) {
    if (price < 0) {
      return next(new AppError('Price cannot be negative', 400));
    }
    menuItem.price = price;
  }
  if (category !== undefined) menuItem.category = category;
  if (imageUrl !== undefined) menuItem.imageUrl = imageUrl;
  if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;

  await menuItem.save();

  return sendSuccess(res, { menuItem }, 'Menu item updated');
});

/**
 * Delete a menu item (only restaurant owner or admin)
 */
const deleteMenuItem = asyncHandler(async (req, res, next) => {
  const restaurantId = req.params.id; // From nested route /restaurants/:id/menu
  const itemId = req.params.itemId;

  // Verify restaurant ownership
  const restaurant = await assertRestaurantOwner(req, restaurantId);

  const menuItem = await MenuItem.findOne({
    where: { id: itemId, restaurantId: restaurant.id },
  });

  if (!menuItem) {
    return next(new AppError('Menu item not found', 404));
  }

  await menuItem.destroy();

  return sendSuccess(res, null, 'Menu item deleted');
});

/**
 * Get all menu items for a restaurant (including unavailable - for owner)
 */
const getAllMenuItems = asyncHandler(async (req, res, next) => {
  const restaurantId = req.params.id; // From nested route /restaurants/:id/menu

  // Verify restaurant ownership
  const restaurant = await assertRestaurantOwner(req, restaurantId);

  const menuItems = await MenuItem.findAll({
    where: { restaurantId: restaurant.id },
    order: [['createdAt', 'DESC']],
  });

  return sendSuccess(res, { restaurant, menuItems }, 'All menu items fetched');
});

module.exports = {
  createMenuItem,
  getMenu,
  updateMenuItem,
  deleteMenuItem,
  getAllMenuItems,
};
