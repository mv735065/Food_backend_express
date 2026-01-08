/**
 * Notification Controller
 */

const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/responseHandler');
const Notification = require('../models/mongodb/notification');

/**
 * Get notifications for authenticated user
 * Query params: ?isRead=true/false, ?limit=20, ?page=1
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { isRead, limit = 20, page = 1 } = req.query;
  const userId = req.user.id;

  const query = { userId };

  if (isRead !== undefined) {
    query.isRead = isRead === 'true';
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  const total = await Notification.countDocuments(query);

  return sendSuccess(
    res,
    {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
    'Notifications fetched'
  );
});

/**
 * Mark notification as read
 */
const markAsRead = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await Notification.findOne({ _id: id, userId });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  notification.isRead = true;
  await notification.save();

  return sendSuccess(res, { notification }, 'Notification marked as read');
});

/**
 * Mark all notifications as read
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await Notification.updateMany({ userId, isRead: false }, { isRead: true });

  return sendSuccess(res, null, 'All notifications marked as read');
});

/**
 * Get unread notification count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const count = await Notification.countDocuments({ userId, isRead: false });

  return sendSuccess(res, { count }, 'Unread count fetched');
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
