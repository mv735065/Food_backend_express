/**
 * Models Index
 * 
 * This file exports all models for easy importing.
 * Add your models here as you create them.
 * 
 * Example:
 * const User = require('./userModel');
 * const Product = require('./productModel');
 * 
 * module.exports = {
 *   User,
 *   Product,
 * };
 */

const User = require('./user');
const Restaurant = require('./restaurant');
const MenuItem = require('./menuItem');
const Order = require('./order');
const OrderStatusHistory = require('./orderStatusHistory');
const Payment = require('./payment');

// Associations

// User (RESTAURANT) -> Restaurant (one owner can have multiple restaurants)
User.hasMany(Restaurant, {
  foreignKey: 'ownerId',
  as: 'restaurants',
});
Restaurant.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner',
});

// Restaurant -> MenuItems
Restaurant.hasMany(MenuItem, {
  foreignKey: 'restaurantId',
  as: 'menuItems',
});
MenuItem.belongsTo(Restaurant, {
  foreignKey: 'restaurantId',
  as: 'restaurant',
});

// User (USER) -> Orders (as customer)
User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders',
});
Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'customer',
});

// User (RIDER) -> Assigned Orders
User.hasMany(Order, {
  foreignKey: 'riderId',
  as: 'assignedOrders',
});
Order.belongsTo(User, {
  foreignKey: 'riderId',
  as: 'rider',
});

// Restaurant -> Orders
Restaurant.hasMany(Order, {
  foreignKey: 'restaurantId',
  as: 'orders',
});
Order.belongsTo(Restaurant, {
  foreignKey: 'restaurantId',
  as: 'restaurant',
});

// Order -> Status History
Order.hasMany(OrderStatusHistory, {
  foreignKey: 'orderId',
  as: 'statusHistory',
});
OrderStatusHistory.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

// Order -> Payments
Order.hasMany(Payment, {
  foreignKey: 'orderId',
  as: 'payments',
});
Payment.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

module.exports = {
  User,
  Restaurant,
  MenuItem,
  Order,
  OrderStatusHistory,
  Payment,
};
