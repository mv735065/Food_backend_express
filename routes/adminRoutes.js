/**
 * Admin Routes
 * 
 * Admin-only routes for managing the entire system
 */

const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/auth');

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// User management
router.get('/users', getUsers);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);

// Restaurant management
router.get('/restaurants', getRestaurants);
router.post('/restaurants', createRestaurant);
router.put('/restaurants/:restaurantId', updateRestaurant);
router.delete('/restaurants/:restaurantId', deleteRestaurant);

// Order management
router.get('/orders', getAllOrders);

// Rider management
router.get('/riders', getRiders);
router.delete('/riders/:riderId', deleteRider);

module.exports = router;
