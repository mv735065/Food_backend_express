/**
 * Restaurant Routes
 */

const express = require('express');
const router = express.Router();
const {
  createRestaurant,
  getRestaurants,
  getMyRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
} = require('../controllers/restaurantController');
const { authenticate, authorize } = require('../middlewares/auth');

// Only RESTAURANT owners and ADMIN can create restaurants
router.post('/', authenticate, authorize('RESTAURANT', 'ADMIN'), createRestaurant);

// Get restaurants owned by authenticated user
router.get('/my-restaurants', authenticate, authorize('RESTAURANT', 'ADMIN'), getMyRestaurants);

// Public list of restaurants
router.get('/', getRestaurants);

// Get single restaurant by ID
router.get('/:id', getRestaurantById);

// Update restaurant (owner or admin only)
router.put('/:id', authenticate, authorize('RESTAURANT', 'ADMIN'), updateRestaurant);

// Delete restaurant (owner or admin only)
router.delete('/:id', authenticate, authorize('RESTAURANT', 'ADMIN'), deleteRestaurant);

module.exports = router;

