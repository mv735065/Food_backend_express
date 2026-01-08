/**
 * Notification Routes
 */

const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread/count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read/all', markAllAsRead);

module.exports = router;
