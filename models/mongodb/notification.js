/**
 * Notification Model (MongoDB)
 *
 * Stores notifications for users, restaurants, and riders.
 */

const { mongoose } = require('../../config/mongodb');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'order_created',
        'order_accepted',
        'order_prepared',
        'rider_assigned',
        'order_picked_up',
        'order_delivered',
        'order_cancelled',
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    restaurantId: {
      type: String,
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ orderId: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
