import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Send a notification
export const sendNotification = async (req, res) => {
  try {
    const { recipientId, type, message, link, postId, commentId } = req.body;
    const senderId = req.userId; // From auth middleware

    if (!recipientId || !type || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Recipient, type, and message are required' 
      });
    }

    // Don't send notification to yourself
    if (recipientId === senderId) {
      return res.status(200).json({ 
        success: true, 
        message: 'No self-notification' 
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Recipient not found' 
      });
    }

    // Check notification settings
    const notificationSettings = recipient.notification_settings || {};
    if (type === 'like' && !notificationSettings.likeNotifications) {
      return res.status(200).json({ 
        success: true, 
        message: 'User disabled like notifications' 
      });
    }
    if (type === 'comment' && !notificationSettings.commentNotifications) {
      return res.status(200).json({ 
        success: true, 
        message: 'User disabled comment notifications' 
      });
    }
    if (type === 'follow' && !notificationSettings.followNotifications) {
      return res.status(200).json({ 
        success: true, 
        message: 'User disabled follow notifications' 
      });
    }

    // Create notification
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      link: link || '',
      post: postId || null,
      comment: commentId || null
    });

    await notification.save();

    // Populate sender info for response
    await notification.populate('sender', 'full_name username profile_picture');

    res.status(201).json({ 
      success: true, 
      message: 'Notification sent', 
      notification 
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send notification',
      error: error.message 
    });
  }
};

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'full_name username profile_picture')
      .populate('post', 'content')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      read: false 
    });

    res.status(200).json({
      success: true,
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications',
      error: error.message 
    });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      read: false 
    });

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get unread count',
      error: error.message 
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOne({ 
      _id: id, 
      recipient: userId 
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read',
      error: error.message 
    });
  }
};

// Mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark all as read',
      error: error.message 
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOneAndDelete({ 
      _id: id, 
      recipient: userId 
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification',
      error: error.message 
    });
  }
};

// Delete all notifications
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    await Notification.deleteMany({ recipient: userId });

    res.status(200).json({
      success: true,
      message: 'All notifications deleted'
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete all notifications',
      error: error.message 
    });
  }
};
