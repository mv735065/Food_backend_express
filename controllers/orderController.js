/**
 * Order Controller
 */

const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/responseHandler');
const { Restaurant, MenuItem, Order, OrderStatusHistory, User, Payment } = require('../models');
const { Op } = require('sequelize');
const {
  createNotification,
  notifyUsers,
  notificationTemplates,
} = require('../utils/notificationService');

// Valid status transitions
const STATUS_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

const createStatusHistory = async ({ orderId, fromStatus, toStatus, changedByRole }) => {
  await OrderStatusHistory.create({
    orderId,
    fromStatus,
    toStatus,
    changedByRole,
  });
};

/**
 * Helper: ensure order has at least one PAID payment before moving forward (except cancel)
 */
const ensureOrderPaid = async (order) => {
  const paid = await Payment.findOne({
    where: { orderId: order.id, status: 'PAID' },
  });
  return Boolean(paid);
};

/**
 * Create a new order
 * Body: { restaurantId, items: [{ menuItemId, quantity }], deliveryAddress }
 */
const createOrder = asyncHandler(async (req, res, next) => {
  const { restaurantId, items, deliveryAddress } = req.body;

  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    return next(new AppError('restaurantId and items are required', 400));
  }

  const restaurant = await Restaurant.findByPk(restaurantId);
  if (!restaurant || !restaurant.isActive) {
    return next(new AppError('Restaurant not found', 404));
  }

  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await MenuItem.findAll({
    where: { id: menuItemIds, restaurantId: restaurantId, isAvailable: true },
  });

  if (menuItems.length !== items.length) {
    return next(new AppError('One or more menu items are invalid or unavailable', 400));
  }

  let totalAmount = 0;
  const normalizedItems = items.map((item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    const quantity = Number(item.quantity) || 1;
    const price = Number(menuItem.price);
    const lineTotal = price * quantity;
    totalAmount += lineTotal;
    return {
      menuItemId: menuItem.id,
      name: menuItem.name,
      price,
      quantity,
    };
  });

  const order = await Order.create({
    restaurantId: restaurant.id,
    userId: req.user.id,
    items: normalizedItems,
    totalAmount,
    deliveryAddress,
    status: 'PENDING',
  });

  await createStatusHistory({
    orderId: order.id,
    fromStatus: null,
    toStatus: 'PENDING',
    changedByRole: req.user.role,
  });

  // Load restaurant owner for notification
  const restaurantOwner = await User.findByPk(restaurant.ownerId);
  const customer = req.user;

  // Notify restaurant owner
  const restaurantNotification = notificationTemplates.order_created(order, restaurant);
  await createNotification({
    userId: restaurant.ownerId,
    ...restaurantNotification,
    orderId: order.id,
    restaurantId: restaurant.id,
    metadata: { customerName: customer.name },
  });

  // Notify customer
  const customerNotification = notificationTemplates.order_created(order, restaurant);
  await createNotification({
    userId: customer.id,
    type: 'order_created',
    title: 'Order Placed',
    message: `Your order #${order.id.substring(0, 8)} has been placed at ${restaurant.name}`,
    orderId: order.id,
    restaurantId: restaurant.id,
    metadata: { restaurantName: restaurant.name },
  });

  return sendSuccess(res, { order }, 'Order created', 201);
});

/**
 * Get all orders for the authenticated user (role-based)
 * - USER: Get their own orders
 * - RESTAURANT: Get orders for their restaurants
 * - RIDER: Get orders assigned to them
 * - ADMIN: Get all orders
 */
const getOrders = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { status, restaurantId } = req.query;

  let whereClause = {};
  let includeClause = [
    { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'address', 'phoneNumber', 'imageUrl'] },
    { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
    { model: User, as: 'rider', attributes: ['id', 'name', 'email'], required: false },
  ];

  // Role-based filtering
  if (user.role === 'USER') {
    whereClause.userId = user.id;
  } else if (user.role === 'RESTAURANT') {
    // Get restaurants owned by this user
    const ownedRestaurants = await Restaurant.findAll({
      where: { ownerId: user.id },
      attributes: ['id'],
    });
    const restaurantIds = ownedRestaurants.map((r) => r.id);
    if (restaurantIds.length === 0) {
      return sendSuccess(res, { orders: [] }, 'No orders found');
    }
    // If restaurantId query param is provided, validate it belongs to user
    if (restaurantId) {
      if (!restaurantIds.includes(restaurantId)) {
        return next(new AppError('You can only view orders from your restaurants', 403));
      }
      whereClause.restaurantId = restaurantId;
    } else {
      whereClause.restaurantId = { [Op.in]: restaurantIds };
    }
  } else if (user.role === 'RIDER') {
    // If status is explicitly given, filter for unassigned and ready to pick-up (e.g., status=READY_FOR_PICKUP)
    if (status === 'READY_FOR_PICKUP') {
      // Riders can see: all orders with status READY_FOR_PICKUP that are not assigned to a rider or assigned to themselves
      whereClause.status = 'READY_FOR_PICKUP';
      // (Unassigned or assigned to them)
      whereClause[Op.or] = [
        { riderId: null },
        { riderId: user.id }
      ];
    } else {
      // Otherwise, show orders assigned to this rider
      whereClause.riderId = user.id;
      // Additional status filter will be applied below (if present)
    }
  }
  // ADMIN can see all orders

  // Optional status filter
  if (status && user.role !== 'RIDER') {
    if (!Order.STATUSES.includes(status)) {
      return next(new AppError('Invalid status', 400));
    }
    whereClause.status = status;
  }

  // Optional restaurant filter (for ADMIN only)
  if (restaurantId && user.role === 'ADMIN') {
    whereClause.restaurantId = restaurantId;
  }

  const orders = await Order.findAll({
    where: whereClause,
    include: includeClause,
    order: [['createdAt', 'DESC']],
  });

  return sendSuccess(res, { orders }, 'Orders fetched');
});

/**
 * Get single order with basic access control
 */
const getOrderById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findByPk(id, {
    include: [
      { model: Restaurant, as: 'restaurant' },
      { model: User, as: 'customer' },
      { model: User, as: 'rider' },
      { model: OrderStatusHistory, as: 'statusHistory' },
    ],
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const user = req.user;
  if (user.role === 'USER' && order.userId !== user.id) {
    return next(new AppError('You can only view your own orders', 403));
  }

  if (user.role === 'RESTAURANT') {
    const restaurant = await Restaurant.findOne({ where: { id: order.restaurantId, ownerId: user.id } });
    if (!restaurant) {
      return next(new AppError('Not allowed to view this order', 403));
    }
  }

  if (user.role === 'RIDER' && order.riderId !== user.id) {
    return next(new AppError('Not allowed to view this order', 403));
  }

  // ADMIN can view all

  return sendSuccess(res, { order }, 'Order fetched');
});

/**
 * Update order status with valid transitions and role rules
 * Body: { status }
 */
const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status: newStatus } = req.body;

  if (!newStatus) {
    return next(new AppError('New status is required', 400));
  }

  if (!Order.STATUSES.includes(newStatus)) {
    return next(new AppError('Invalid status', 400));
  }

  const order = await Order.findByPk(id);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const currentStatus = order.status;
  const allowedNext = STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(newStatus)) {
    return next(
      new AppError(`Invalid status transition from ${currentStatus} to ${newStatus}`, 400)
    );
  }

  const user = req.user;

  // Require payment before moving forward (except cancellation)
  // if (newStatus !== 'CANCELLED') {
  //   const isPaid = await ensureOrderPaid(order);
  //   if (!isPaid) {
  //     return next(new AppError('Payment required before updating order status', 400));
  //   }
  // }

  // Role-based rules
  if (user.role === 'USER') {
    if (
      newStatus !== 'CANCELLED' ||
      !['PENDING', 'ACCEPTED'].includes(currentStatus) ||
      order.userId !== user.id
    ) {
      return next(new AppError('You cannot perform this status change', 403));
    }
  } else if (user.role === 'RESTAURANT') {
    const restaurant = await Restaurant.findOne({
      where: { id: order.restaurantId, ownerId: user.id },
    });
    if (!restaurant) {
      return next(new AppError('You cannot manage this order', 403));
    }
    if (['OUT_FOR_DELIVERY', 'DELIVERED'].includes(newStatus)) {
      return next(new AppError('Restaurant cannot set delivery statuses', 403));
    }
  } else if (user.role === 'RIDER') {
    if (order.riderId !== user.id) {
      return next(new AppError('You are not assigned to this order', 403));
    }
    if (!['OUT_FOR_DELIVERY', 'DELIVERED'].includes(newStatus)) {
      return next(new AppError('Rider can only set delivery-related statuses', 403));
    }
  }
  // ADMIN can do all

  order.status = newStatus;
  await order.save();

  await createStatusHistory({
    orderId: order.id,
    fromStatus: currentStatus,
    toStatus: newStatus,
    changedByRole: user.role,
  });

  // Load related data for notifications
  const restaurant = await Restaurant.findByPk(order.restaurantId);
  const customer = await User.findByPk(order.userId);
  const rider = order.riderId ? await User.findByPk(order.riderId) : null;

  // Emit notifications based on status change
  const notificationsToSend = [];

  switch (newStatus) {
    case 'ACCEPTED':
      notificationsToSend.push({
        userId: order.userId,
        ...notificationTemplates.order_accepted(order, restaurant),
        orderId: order.id,
        restaurantId: restaurant.id,
      });
      break;

    case 'PREPARING':
      // Notify customer that order is being prepared
      notificationsToSend.push({
        userId: order.userId,
        type: 'order_prepared',
        title: 'Order Being Prepared',
        message: `Your order #${order.id.substring(0, 8)} is being prepared at ${restaurant.name}`,
        orderId: order.id,
        restaurantId: restaurant.id,
      });
      break;

    case 'READY_FOR_PICKUP':
      notificationsToSend.push({
        userId: order.userId,
        ...notificationTemplates.order_prepared(order, restaurant),
        orderId: order.id,
        restaurantId: restaurant.id,
      });
      if (rider) {
        notificationsToSend.push({
          userId: rider.id,
          type: 'order_prepared',
          title: 'Order Ready for Pickup',
          message: `Order #${order.id.substring(0, 8)} is ready for pickup at ${restaurant.name}`,
          orderId: order.id,
          restaurantId: restaurant.id,
        });
      }
      break;

    case 'OUT_FOR_DELIVERY':
      notificationsToSend.push({
        userId: order.userId,
        ...notificationTemplates.order_picked_up(order, rider),
        orderId: order.id,
        restaurantId: restaurant.id,
        metadata: { riderName: rider?.name },
      });
      break;

    case 'DELIVERED':
      notificationsToSend.push({
        userId: order.userId,
        ...notificationTemplates.order_delivered(order),
        orderId: order.id,
        restaurantId: restaurant.id,
      });
      // Notify restaurant
      if (restaurant.ownerId) {
        notificationsToSend.push({
          userId: restaurant.ownerId,
          type: 'order_delivered',
          title: 'Order Delivered',
          message: `Order #${order.id.substring(0, 8)} has been delivered successfully`,
          orderId: order.id,
          restaurantId: restaurant.id,
        });
      }
      break;

    case 'CANCELLED':
      const reason = req.body.reason || '';
      notificationsToSend.push({
        userId: order.userId,
        ...notificationTemplates.order_cancelled(order, reason),
        orderId: order.id,
        restaurantId: restaurant.id,
      });
      if (restaurant.ownerId && restaurant.ownerId !== user.id) {
        notificationsToSend.push({
          userId: restaurant.ownerId,
          type: 'order_cancelled',
          title: 'Order Cancelled',
          message: `Order #${order.id.substring(0, 8)} has been cancelled`,
          orderId: order.id,
          restaurantId: restaurant.id,
        });
      }
      if (rider && rider.id !== user.id) {
        notificationsToSend.push({
          userId: rider.id,
          type: 'order_cancelled',
          title: 'Order Cancelled',
          message: `Order #${order.id.substring(0, 8)} has been cancelled`,
          orderId: order.id,
          restaurantId: restaurant.id,
        });
      }
      break;
  }

  // Send all notifications
  await Promise.all(notificationsToSend.map((notif) => createNotification(notif)));

  return sendSuccess(res, { order }, 'Order status updated');
});

/**
 * Assign rider to order
 * - ADMIN: Can assign any rider to any order
 * - RESTAURANT: Can assign riders to orders from their restaurants
 * - RIDER: Can only assign themselves to orders ready for pickup
 * Body: { riderId }
 */
const assignRider = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { riderId } = req.body;

  if (!riderId) {
    return next(new AppError('riderId is required', 400));
  }

  const order = await Order.findByPk(id);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check authorization
  const user = req.user;
  if (user.role === 'RESTAURANT') {
    const restaurant = await Restaurant.findOne({
      where: { id: order.restaurantId, ownerId: user.id },
    });
    if (!restaurant) {
      return next(new AppError('You cannot manage this order', 403));
    }
  } else if (user.role === 'RIDER') {
    // Riders can only assign themselves
    if (riderId !== user.id) {
      return next(new AppError('Riders can only assign themselves to orders', 403));
    }
    // Riders can only assign themselves to orders that are ready for pickup and unassigned
    if (order.status !== 'READY_FOR_PICKUP') {
      return next(new AppError('Riders can only assign themselves to orders ready for pickup', 400));
    }
    if (order.riderId && order.riderId !== user.id) {
      return next(new AppError('This order is already assigned to another rider', 400));
    }
  } else if (user.role !== 'ADMIN') {
    return next(new AppError('Only admin, restaurant owner, or rider can assign riders', 403));
  }

  // Verify rider exists and has RIDER role
  const rider = await User.findByPk(riderId);
  if (!rider || rider.role !== 'RIDER' || !rider.isActive) {
    return next(new AppError('Invalid rider', 400));
  }

  // Check if order is in a state that allows rider assignment
  if (!['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.status)) {
    return next(new AppError('Rider can only be assigned to accepted/preparing/ready orders', 400));
  }

  const previousRiderId = order.riderId;
  order.riderId = riderId;
  await order.save();

  // Load related data
  const restaurant = await Restaurant.findByPk(order.restaurantId);
  const customer = await User.findByPk(order.userId);

  // Notify rider
  await createNotification({
    userId: riderId,
    ...notificationTemplates.rider_assigned(order, rider),
    orderId: order.id,
    restaurantId: restaurant.id,
    metadata: { customerName: customer.name, restaurantName: restaurant.name },
  });

  // Notify customer
  await createNotification({
    userId: order.userId,
    ...notificationTemplates.rider_assigned(order, rider),
    orderId: order.id,
    restaurantId: restaurant.id,
    metadata: { riderName: rider.name },
  });

  // Notify restaurant owner if different from current user
  if (restaurant.ownerId && restaurant.ownerId !== user.id) {
    await createNotification({
      userId: restaurant.ownerId,
      type: 'rider_assigned',
      title: 'Rider Assigned',
      message: `Rider ${rider.name} has been assigned to order #${order.id.substring(0, 8)}`,
      orderId: order.id,
      restaurantId: restaurant.id,
      metadata: { riderName: rider.name },
    });
  }

  // If previous rider was different, notify them
  if (previousRiderId && previousRiderId !== riderId) {
    await createNotification({
      userId: previousRiderId,
      type: 'order_cancelled',
      title: 'Order Reassigned',
      message: `Order #${order.id.substring(0, 8)} has been reassigned to another rider`,
      orderId: order.id,
      restaurantId: restaurant.id,
    });
  }

  return sendSuccess(res, { order }, 'Rider assigned successfully');
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  assignRider,
};

