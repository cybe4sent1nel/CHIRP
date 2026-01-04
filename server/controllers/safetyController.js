import User from '../models/User.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import BlockList from '../models/BlockList.js';

// Block User
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { blockedUserId } = req.body;

    if (userId === blockedUserId) {
      return res.json({ success: false, message: 'You cannot block yourself' });
    }

    // Check if already blocked
    const existing = await BlockList.findOne({
      user_id: userId,
      blocked_user_id: blockedUserId,
    });

    if (existing) {
      return res.json({ success: false, message: 'User already blocked' });
    }

    // Create block entry
    await BlockList.create({
      user_id: userId,
      blocked_user_id: blockedUserId,
    });

    // Remove from connections if connected
    const user = await User.findById(userId);
    user.connections = user.connections.filter(
      (conn) => conn.toString() !== blockedUserId
    );
    user.following = user.following.filter(
      (f) => f.toString() !== blockedUserId
    );
    user.followers = user.followers.filter(
      (f) => f.toString() !== blockedUserId
    );
    await user.save();

    const blockedUser = await User.findById(blockedUserId);
    blockedUser.connections = blockedUser.connections.filter(
      (conn) => conn.toString() !== userId
    );
    blockedUser.following = blockedUser.following.filter(
      (f) => f.toString() !== userId
    );
    blockedUser.followers = blockedUser.followers.filter(
      (f) => f.toString() !== userId
    );
    await blockedUser.save();

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Unblock User
export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { blockedUserId } = req.body;

    await BlockList.deleteOne({
      user_id: userId,
      blocked_user_id: blockedUserId,
    });

    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get Blocked Users
export const getBlockedUsers = async (req, res) => {
  try {
    const { userId } = req.auth();

    const blockedUsers = await BlockList.find({
      user_id: userId,
    }).populate('blocked_user_id', 'username profile_picture full_name');

    res.json({
      success: true,
      blockedUsers: blockedUsers.map((block) => block.blocked_user_id),
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Report User
export const reportUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { reportedUserId, reason, description } = req.body;

    if (!reason) {
      return res.json({
        success: false,
        message: 'Please provide a reason for reporting',
      });
    }

    // Check if already reported
    const existing = await Report.findOne({
      reporter_id: userId,
      reported_user_id: reportedUserId,
      type: 'user',
    });

    if (existing) {
      return res.json({
        success: false,
        message: 'You have already reported this user',
      });
    }

    await Report.create({
      reporter_id: userId,
      reported_user_id: reportedUserId,
      type: 'user',
      reason,
      description,
    });

    res.json({ success: true, message: 'User reported successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Report Post
export const reportPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId, reason, description } = req.body;

    if (!reason) {
      return res.json({
        success: false,
        message: 'Please provide a reason for reporting',
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.json({ success: false, message: 'Post not found' });
    }

    // Check if already reported
    const existing = await Report.findOne({
      reporter_id: userId,
      reported_post_id: postId,
      type: 'post',
    });

    if (existing) {
      return res.json({
        success: false,
        message: 'You have already reported this post',
      });
    }

    await Report.create({
      reporter_id: userId,
      reported_post_id: postId,
      type: 'post',
      reason,
      description,
    });

    res.json({ success: true, message: 'Post reported successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Delete Message (for me)
export const deleteMessageForMe = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { messageId } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.json({ success: false, message: 'Message not found' });
    }

    // Only sender or recipient can delete
    if (
      message.sender_id.toString() !== userId &&
      message.recipient_id.toString() !== userId
    ) {
      return res.json({
        success: false,
        message: 'You cannot delete this message',
      });
    }

    // Add user to deleted_by array
    if (!message.deleted_by) {
      message.deleted_by = [];
    }
    message.deleted_by.push(userId);
    await message.save();

    // If both users deleted, remove message
    const userIds = [message.sender_id.toString(), message.recipient_id.toString()];
    if (message.deleted_by.length === userIds.length) {
      await Message.deleteOne({ _id: messageId });
    }

    res.json({ success: true, message: 'Message deleted for you' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Delete Message for Everyone
export const deleteMessageForEveryone = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { messageId } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.json({ success: false, message: 'Message not found' });
    }

    // Only sender can delete for everyone
    if (message.sender_id.toString() !== userId) {
      return res.json({
        success: false,
        message: 'Only the sender can delete for everyone',
      });
    }

    // Mark message as deleted for everyone
    message.is_deleted = true;
    message.deleted_at = new Date();
    await message.save();

    res.json({ success: true, message: 'Message deleted for everyone' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Clear Chat (delete all messages between two users)
export const clearChat = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { otherUserId } = req.body;

    // Delete all messages where current user was sender
    await Message.deleteMany({
      sender_id: userId,
      recipient_id: otherUserId,
    });

    // Delete all messages where current user was recipient
    await Message.deleteMany({
      sender_id: otherUserId,
      recipient_id: userId,
    });

    res.json({ success: true, message: 'Chat cleared successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get Message Info (who read/delivered)
export const getMessageInfo = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { messageId } = req.body;

    const message = await Message.findById(messageId)
      .populate('sender_id', 'username profile_picture')
      .populate('read_by', 'username profile_picture')
      .populate('delivered_to', 'username profile_picture');

    if (!message) {
      return res.json({ success: false, message: 'Message not found' });
    }

    // Only sender can view message info
    if (message.sender_id._id.toString() !== userId) {
      return res.json({
        success: false,
        message: 'You can only view info for your own messages',
      });
    }

    res.json({
      success: true,
      messageInfo: {
        sent_at: message.created_at,
        delivered_to: message.delivered_to || [],
        read_by: message.read_by || [],
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Update User Settings
export const updateUserSettings = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { privacy, notifications, account } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    if (privacy) {
      user.privacy_settings = {
        ...user.privacy_settings,
        ...privacy,
      };
    }

    if (notifications) {
      user.notification_settings = {
        ...user.notification_settings,
        ...notifications,
      };
    }

    if (account) {
      user.account_settings = {
        ...user.account_settings,
        ...account,
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      user,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Delete Account
export const deleteAccount = async (req, res) => {
  try {
    const { userId } = req.auth();

    // Delete user
    await User.findByIdAndDelete(userId);

    // Delete all posts by user
    await Post.deleteMany({ user: userId });

    // Delete all messages
    await Message.deleteMany({
      $or: [{ sender_id: userId }, { recipient_id: userId }],
    });

    // Delete all reports by/about user
    await Report.deleteMany({
      $or: [{ reporter_id: userId }, { reported_user_id: userId }],
    });

    // Delete all block entries
    await BlockList.deleteMany({
      $or: [{ user_id: userId }, { blocked_user_id: userId }],
    });

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
