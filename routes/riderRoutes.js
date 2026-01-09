/**
 * Rider Routes
 *
 * Rider-only APIs for viewing and updating assigned orders.
 */

const express = require('express');
const router = express.Router();

const { getRiderOrders } = require('../controllers/riderController');
const { updateOrderStatus } = require('../controllers/orderController');
const { authenticate, authorize } = require('../middlewares/auth');
const { AppError } = require('../middlewares/errorHandler');

// All rider routes require rider auth (ADMIN has full access automatically via authorize middleware)
router.use(authenticate, authorize('RIDER', 'ADMIN'));

// GET /api/rider/orders
router.get('/orders', getRiderOrders);

// PUT /api/rider/orders/:id/status
router.put('/orders/:id/status', (req, res, next) => {
  const { status } = req.body || {};

  if (!status) {
    return next(new AppError('Status is required', 400));
  }

  // Map rider-facing statuses to internal order statuses
  let internalStatus;
  switch (status) {
    case 'ASSIGNED':
      // Assignment is handled via admin/restaurant; rider cannot set this directly
      return next(new AppError('ASSIGNED status is managed by the system', 400));
    case 'PICKED_UP':
      internalStatus = 'OUT_FOR_DELIVERY';
      break;
    case 'DELIVERED':
      internalStatus = 'DELIVERED';
      break;
    default:
      return next(new AppError('Invalid status for rider', 400));
  }

  // Delegate to the main order status handler (which:
  // - enforces rider ownership
  // - validates transitions
  // - emits notifications)
  req.body.status = internalStatus;
  return updateOrderStatus(req, res, next);
});

module.exports = router;

