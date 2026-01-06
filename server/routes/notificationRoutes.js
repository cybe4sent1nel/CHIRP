import express from 'express';
const router = express.Router();
import { protect } from '../middlewares/auth.js';
import {
  sendNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} from '../controllers/notificationController.js';

// All routes require authentication
router.use(protect);

// Send notification
router.post('/send', sendNotification);

// Get user notifications
router.get('/user', getUserNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark as read
router.put('/read/:id', markAsRead);

// Mark all as read
router.put('/read-all', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Delete all notifications
router.delete('/all', deleteAllNotifications);

export default router;
