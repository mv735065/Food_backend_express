/**
 * Menu Routes (nested under restaurant)
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createMenuItem,
  getMenu,
  getAllMenuItems,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuController');
const { authenticate, authorize } = require('../middlewares/auth');

// Only restaurant owner / admin can manage menu
router.post('/', authenticate, authorize('RESTAURANT', 'ADMIN'), createMenuItem);

// Get all menu items (including unavailable) - for restaurant owner
router.get('/all', authenticate, authorize('RESTAURANT', 'ADMIN'), getAllMenuItems);

// Public menu (only available items)
router.get('/', getMenu);

// Update menu item (owner or admin only)
router.put('/items/:itemId', authenticate, authorize('RESTAURANT', 'ADMIN'), updateMenuItem);

// Delete menu item (owner or admin only)
router.delete('/items/:itemId', authenticate, authorize('RESTAURANT', 'ADMIN'), deleteMenuItem);

module.exports = router;

