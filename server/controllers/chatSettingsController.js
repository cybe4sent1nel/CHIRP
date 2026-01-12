import ChatSettings from '../models/ChatSettings.js';

/**
 * Get user's chat settings
 */
export const getChatSettings = async (req, res) => {
  try {
    const userId = req.userId;

    let settings = await ChatSettings.findOne({ user_id: userId });

    if (!settings) {
      // Create default settings
      settings = await ChatSettings.create({ user_id: userId });
    }

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get chat settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat settings',
      error: error.message
    });
  }
};

/**
 * Update privacy settings
 */
export const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.userId;
    const { privacy } = req.body;

    let settings = await ChatSettings.findOne({ user_id: userId });

    if (!settings) {
      settings = await ChatSettings.create({ user_id: userId });
    }

    // Update privacy settings
    settings.privacy = { ...settings.privacy, ...privacy };
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Privacy settings updated',
      settings
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings',
      error: error.message
    });
  }
};

/**
 * Update security settings
 */
export const updateSecuritySettings = async (req, res) => {
  try {
    const userId = req.userId;
    const { security } = req.body;

    let settings = await ChatSettings.findOne({ user_id: userId });

    if (!settings) {
      settings = await ChatSettings.create({ user_id: userId });
    }

    // Update security settings
    settings.security = { ...settings.security, ...security };
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Security settings updated',
      settings
    });
  } catch (error) {
    console.error('Update security settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update security settings',
      error: error.message
    });
  }
};

/**
 * Block a user
 */
export const blockUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { blockedUserId } = req.body;

    let settings = await ChatSettings.findOne({ user_id: userId });

    if (!settings) {
      settings = await ChatSettings.create({ user_id: userId });
    }

    // Add to blocked users if not already blocked
    if (!settings.privacy.blocked_users.includes(blockedUserId)) {
      settings.privacy.blocked_users.push(blockedUserId);
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: 'User blocked',
      settings
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block user',
      error: error.message
    });
  }
};

/**
 * Unblock a user
 */
export const unblockUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { blockedUserId } = req.body;

    let settings = await ChatSettings.findOne({ user_id: userId });

    if (settings) {
      settings.privacy.blocked_users = settings.privacy.blocked_users.filter(
        id => id !== blockedUserId
      );
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: 'User unblocked',
      settings
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock user',
      error: error.message
    });
  }
};

/**
 * Get blocked users
 */
export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.userId;

    const settings = await ChatSettings.findOne({ user_id: userId });

    res.status(200).json({
      success: true,
      blocked_users: settings?.privacy.blocked_users || []
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blocked users',
      error: error.message
    });
  }
};

/**
 * Mute notifications for a chat
 */
export const muteChatNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.body;

    let settings = await ChatSettings.findOne({ user_id: userId });

    if (!settings) {
      settings = await ChatSettings.create({ user_id: userId });
    }

    if (!settings.notifications.muted_chats.includes(chatId)) {
      settings.notifications.muted_chats.push(chatId);
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: 'Chat notifications muted',
      settings
    });
  } catch (error) {
    console.error('Mute chat notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mute notifications',
      error: error.message
    });
  }
};

/**
 * Unmute notifications for a chat
 */
export const unmuteChatNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.body;

    let settings = await ChatSettings.findOne({ user_id: userId });

    if (settings) {
      settings.notifications.muted_chats = settings.notifications.muted_chats.filter(
        id => id !== chatId
      );
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: 'Chat notifications unmuted',
      settings
    });
  } catch (error) {
    console.error('Unmute chat notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unmute notifications',
      error: error.message
    });
  }
};

/**
 * Export chat data
 */
export const exportChatData = async (req, res) => {
  try {
    const userId = req.userId;

    // Collect all user's chat data
    const userData = {
      userId,
      exportedAt: new Date(),
      settings: await ChatSettings.findOne({ user_id: userId }),
      // Add more data exports as needed
    };

    res.status(200).json({
      success: true,
      message: 'Chat data exported',
      data: userData
    });
  } catch (error) {
    console.error('Export chat data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export chat data',
      error: error.message
    });
  }
};

/**
 * Delete all chat data
 */
export const deleteAllChatData = async (req, res) => {
  try {
    const userId = req.userId;

    // Delete all user's chat settings and related data
    await ChatSettings.deleteOne({ user_id: userId });

    res.status(200).json({
      success: true,
      message: 'All chat data deleted'
    });
  } catch (error) {
    console.error('Delete chat data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat data',
      error: error.message
    });
  }
};
