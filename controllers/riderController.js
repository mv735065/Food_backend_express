/**
 * Rider Controller
 *
 * Rider-specific endpoints (no maps, status + order listing only).
 */

const { Op } = require('sequelize');
const { asyncHandler } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/responseHandler');
const { Order, Restaurant } = require('../models');

/**
 * Get orders assigned to the authenticated rider
 * GET /api/rider/orders
 */
const getRiderOrders = asyncHandler(async (req, res) => {
  const riderId = req.user.id;

  const orders = await Order.findAll({
    where: {
      riderId,
      status: {
        [Op.notIn]: ['CANCELLED'],
      },
    },
    include: [{ model: Restaurant, as: 'restaurant' }],
    order: [['createdAt', 'DESC']],
  });

  return sendSuccess(res, { orders }, 'Rider orders fetched');
});

module.exports = {
  getRiderOrders,
};

