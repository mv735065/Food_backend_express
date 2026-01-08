/**
 * Notification Service
 *
 * Handles emitting Socket.io events and storing notifications in MongoDB.
 */

const Notification = require('../models/mongodb/notification');

// Socket.io instance (will be set by socket setup)
let io = null;

/**
 * Initialize Socket.io instance
 */
const setSocketIO = (socketInstance) => {
  io = socketInstance;
};

/**
 * Create and emit notification
 * @param {Object} params
 * @param {string} params.userId - Target user ID
 * @param {string} params.type - Notification type
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} params.orderId - Order ID
 * @param {string} [params.restaurantId] - Restaurant ID
 * @param {Object} [params.metadata] - Additional metadata
 */
const createNotification = async ({
  userId,
  type,
  title,
  message,
  orderId,
  restaurantId = null,
  metadata = {},
}) => {
  try {
    // Store notification in MongoDB
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      orderId,
      restaurantId,
      metadata,
      isRead: false,
    });

    // Emit Socket.io event to user's room
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        orderId: notification.orderId,
        restaurantId: notification.restaurantId,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        metadata: notification.metadata,
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Notify multiple users
 */
const notifyUsers = async (userIds, notificationData) => {
  const promises = userIds.map((userId) =>
    createNotification({
      ...notificationData,
      userId,
    })
  );
  return Promise.all(promises);
};

/**
 * Notification templates for order events
 */
const notificationTemplates = {
  order_created: (order, restaurant) => ({
    type: 'order_created',
    title: 'New Order Received',
    message: `New order #${order.id.substring(0, 8)} received from ${order.customer?.name || 'Customer'}`,
  }),
  order_accepted: (order, restaurant) => ({
    type: 'order_accepted',
    title: 'Order Accepted',
    message: `Your order #${order.id.substring(0, 8)} has been accepted by ${restaurant.name}`,
  }),
  order_prepared: (order, restaurant) => ({
    type: 'order_prepared',
    title: 'Order Ready',
    message: `Your order #${order.id.substring(0, 8)} is ready for pickup from ${restaurant.name}`,
  }),
  rider_assigned: (order, rider) => ({
    type: 'rider_assigned',
    title: 'Rider Assigned',
    message: `Rider ${rider?.name || 'assigned'} will deliver your order #${order.id.substring(0, 8)}`,
  }),
  order_picked_up: (order, rider) => ({
    type: 'order_picked_up',
    title: 'Order Picked Up',
    message: `Your order #${order.id.substring(0, 8)} has been picked up and is out for delivery`,
  }),
  order_delivered: (order) => ({
    type: 'order_delivered',
    title: 'Order Delivered',
    message: `Your order #${order.id.substring(0, 8)} has been delivered successfully`,
  }),
  order_cancelled: (order, reason) => ({
    type: 'order_cancelled',
    title: 'Order Cancelled',
    message: `Order #${order.id.substring(0, 8)} has been cancelled${reason ? `: ${reason}` : ''}`,
  }),
};

module.exports = {
  setSocketIO,
  createNotification,
  notifyUsers,
  notificationTemplates,
};
