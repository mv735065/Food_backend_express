/**
 * Order Routes
 */

const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  assignRider,
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middlewares/auth');

// Create order - authenticated user (typically USER)
router.post('/', authenticate, createOrder);

// Get all orders (role-based filtering)
router.get('/', authenticate, getOrders);

// Get single order
router.get('/:id', authenticate, getOrderById);

// Update order status
router.put('/:id/status', authenticate, updateOrderStatus);

// Assign rider (ADMIN or RESTAURANT only)
router.put('/:id/assign-rider', authenticate, authorize('ADMIN', 'RESTAURANT'), assignRider);

module.exports = router;

