/**
 * Payment Controller (Dummy)
 *
 * Simulates payments (success/failure) and records them in PostgreSQL.
 */

const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/responseHandler');
const { Order, Payment } = require('../models');

/**
 * Helper: check if order already has a successful payment
 */
const hasPaid = async (orderId) => {
  const paid = await Payment.findOne({
    where: { orderId, status: 'PAID' },
  });
  return Boolean(paid);
};

/**
 * POST /api/payments/pay
 * Body: { orderId, amount?, method?, forceStatus? ('PAID' | 'FAILED') }
 * - Simulates payment success/failure (default: success)
 */
const payOrder = asyncHandler(async (req, res, next) => {
  const { orderId, amount, method = 'DUMMY', forceStatus } = req.body || {};

  if (!orderId) {
    return next(new AppError('orderId is required', 400));
  }

  const order = await Order.findByPk(orderId, { include: ['payments'] });
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Only the order owner or admin can pay (keep it simple)
  if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
    return next(new AppError('Not allowed to pay for this order', 403));
  }

  // Prevent paying twice
  if (await hasPaid(order.id)) {
    return next(new AppError('Order already paid', 400));
  }

  const amt = amount != null ? amount : order.totalAmount;

  // Create pending payment
  const payment = await Payment.create({
    orderId: order.id,
    amount: amt,
    status: 'PENDING',
    transactionId: `txn_${Date.now()}`,
    method,
  });

  // Simulate result
  const success =
    forceStatus === 'PAID'
      ? true
      : forceStatus === 'FAILED'
      ? false
      : true; // default to success if not specified

  payment.status = success ? 'PAID' : 'FAILED';
  await payment.save();

  // If paid, allow order to progress (no auto-transition; enforced in status updates)
  return sendSuccess(
    res,
    { payment },
    success ? 'Payment successful (simulated)' : 'Payment failed (simulated)',
    success ? 200 : 402
  );
});

module.exports = {
  payOrder,
  hasPaid,
};

