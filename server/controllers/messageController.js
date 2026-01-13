import Message from "../models/Message.js";
import fs from "fs";
import imageKit from "../configs/imageKit.js";
import {
  sseManager,
  sendMessageToUser,
  sendDeliveryConfirmation,
  sendReadReceipt,
  getOnlineUsers,
  isUserOnline
} from '../services/sseService.js';
import { scheduleMessageExpiration } from '../services/messageExpirationService.js';

// Expose online users for polling endpoints (legacy compatibility)
Object.defineProperty(global, '__onlineUsers', {
  get() {
    const onlineUsers = new Map();
    getOnlineUsers().forEach(userId => {
      onlineUsers.set(userId, {
        connectedAt: new Date(),
        lastActivity: new Date()
      });
    });
    return onlineUsers;
  },
  configurable: true
});

// Legacy export for backward compatibility (new code uses SSE controller)
export const sseController = async (req, res) => {
  // This is now handled by sseController.js
  // Kept here only for backward compatibility
  console.warn('[MSG-CTRL] sseController called on messageController, should use sseController instead');
  res.status(503).json({ success: false, message: 'SSE Service Unavailable' });
};

/**
 * Get userId from both Clerk and custom JWT auth
 */
const getUserIdFromRequest = (req) => {
  try {
    const clerkAuth = req.auth();
    if (clerkAuth?.userId) return clerkAuth.userId;
  } catch (e) {
    // Not Clerk auth, try custom JWT
  }
  return req.userId;
};

// Determine message type based on MIME type
const getMessageType = (mimeType) => {
  if (!mimeType) return "text";
  
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) {
    // Could be voice note or music
    return "audio";
  }
  // Document types
  if (mimeType.includes("pdf") || 
      mimeType.includes("document") || 
      mimeType.includes("sheet") ||
      mimeType.includes("word") ||
      mimeType.includes("text") ||
      mimeType.includes("zip") ||
      mimeType.includes("compressed")) {
    return "document";
  }
  return "document"; // Default to document for unknown types
};

// Send Message
export const sendMessage = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID not found in auth' });
    }

    const { to_user_id, text, view_once, allow_save, disappearing_message, disappear_duration } = req.body;
    
    // Handle file from any field name
    const uploadedFile = req.files?.[0] || req.file;

    let media_url = "";
    let message_type = "text";
    let file_name = "";
    let file_size = 0;
    let file_type = "";

    if (uploadedFile) {
      message_type = getMessageType(uploadedFile.mimetype);
      file_name = uploadedFile.originalname;
      file_size = uploadedFile.size;
      file_type = uploadedFile.mimetype;

      console.log(`Uploading ${message_type}: ${file_name}`);

      // Upload to ImageKit
      const response = await imageKit.files.upload({
        file: fs.createReadStream(uploadedFile.path),
        fileName: uploadedFile.originalname,
      });

      media_url = response.url;

      // For images, apply transformation
      if (message_type === "image") {
        media_url = imageKit.helper.buildSrc({
          src: response.url,
          transformation: [{ width: 1280, quality: "auto", format: "webp" }],
        });
      }

      // Clean up temp file
      fs.unlink(uploadedFile.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Check if recipient is online
    const isRecipientOnline = isUserOnline(to_user_id);

    // Calculate disappear time if disappearing message is enabled
    let disappearAt = null;
    if (disappearing_message === 'true' || disappearing_message === true) {
      const durationMap = {
        '15s': 15 * 1000,
        '1m': 60 * 1000,
        '1h': 60 * 60 * 1000,
        '1d': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      };
      const durationMs = durationMap[disappear_duration] || 60 * 60 * 1000; // Default to 1 hour
      disappearAt = new Date(Date.now() + durationMs);
    }

    const message = await Message.create({
      sender_id: userId,         // Required field
      recipient_id: to_user_id,  // Required field
      from_user_id: userId,      // Legacy support
      to_user_id,                // Legacy support
      text,
      message_type,
      message_url: media_url,
      file_name,
      file_size,
      file_type,
      sent: true,
      delivered: isRecipientOnline,  // Mark as delivered if recipient is online
      delivered_at: isRecipientOnline ? new Date() : null,
      read: false,
      read_at: null,
      // View-once fields
      view_once: view_once === 'true' || view_once === true,
      allow_save: allow_save === 'false' || allow_save === false ? false : true,
      viewed_by: [],
      // Disappearing message fields
      disappearing_message: disappearing_message === 'true' || disappearing_message === true,
      disappear_duration,
      disappear_at: disappearAt,
      disappeared: false
    });

    // Ensure we return the message with all fields properly set
    const responseMessage = {
      ...message.toObject(),
      sent: true,  // Explicitly ensure sent is true
      delivered: isRecipientOnline,
      delivered_at: isRecipientOnline ? new Date().toISOString() : null,
      read: false,
      read_at: null
    };

    res.json({ success: true, message: responseMessage });

    // Schedule message expiration if it's a disappearing message
    if (disappearAt) {
      scheduleMessageExpiration(message._id.toString(), disappearAt);
    }

    // Send message to recipient via SSE
    const messageWithUserData = await Message.findById(message._id).populate(
      "from_user_id"
    );

    const sent = sendMessageToUser(to_user_id, messageWithUserData);
    
    if (sent) {
      console.log(`[MSG] Message delivered to user ${to_user_id} via SSE`);
      // Send delivery confirmation to sender
      sendDeliveryConfirmation(userId, message._id);
    } else {
      console.log(`[MSG] User ${to_user_id} not connected, message queued for delivery`);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get chat messages
export const getChatMessages = async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] getChatMessages called`);
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      console.warn('No userId found');
      return res.status(401).json({success: false, message: 'User ID not found'});
    }

    const { to_user_id } = req.body;
    console.log(`[${timestamp}] Fetching messages for userId:`, userId, 'to_user_id:', to_user_id);

    if (!to_user_id) {
      return res.status(400).json({success: false, message: 'to_user_id is required'});
    }

    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
    }).sort({ createdAt: -1 })
      .populate('from_user_id', '_id full_name profile_picture username');

    console.log('Found messages:', messages.length);

    // Don't automatically mark as read - only when user explicitly opens chat
    // Messages will be marked as read via the markMessagesAsRead endpoint

    console.log(`[${timestamp}] Sending ${messages.length} messages back to client`);
    res.json({success: true, messages});
    console.log(`[${timestamp}] Response sent, waiting for SSE connections...`);
  } catch (error) {
    console.error('getChatMessages error:', error);
    res.status(500).json({success: false, message: 'Server error: ' + error.message})
  }
};


// Get user recent messages
export const getUserRecentMessages = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req)
        const messages = await Message.find({to_user_id: userId}).populate('from_user_id to_user_id').sort({createdAt: -1})

        res.json({success: true, messages})
    } catch (error) {
        console.log(error)
        res.status(500).json({success: false, message: error.message})
    }
}

// Mark messages as read when user opens chat
export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { from_user_id } = req.body;

    if (!from_user_id) {
      return res.status(400).json({ success: false, message: 'from_user_id is required' });
    }

    // Mark all messages from this user as read
    const result = await Message.updateMany(
      { 
        from_user_id: from_user_id, 
        to_user_id: userId,
        read: false
      },
      { 
        read: true, 
        seen: true,
        read_at: new Date() 
      }
    );

    console.log(`Marked ${result.modifiedCount} messages as read for user ${userId} from ${from_user_id}`);
    
    // Send read receipts to sender via SSE
    if (result.modifiedCount > 0) {
      const readMessages = await Message.find({
        from_user_id: from_user_id,
        to_user_id: userId,
        read: true,
        read_at: { $gte: new Date(Date.now() - 5000) }
      }).select('_id');
      
      readMessages.forEach(msg => {
        sendReadReceipt(from_user_id, msg._id);
      });
      
      console.log(`Sent read receipts for ${readMessages.length} messages to user ${from_user_id}`);
    }
    
    res.json({ success: true, message: 'Messages marked as read', count: result.modifiedCount });
  } catch (error) {
    console.error('markMessagesAsRead error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get unread message counts per user
export const getUnreadCounts = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    // Aggregate unread messages by sender
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          to_user_id: userId,
          read: false,
          is_deleted: false
        }
      },
      {
        $group: {
          _id: '$from_user_id',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate total unread
    const total = unreadCounts.reduce((sum, item) => sum + item.count, 0);

    // Convert to object format { userId: count }
    const countsMap = unreadCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({ success: true, unreadCounts: countsMap, total });
  } catch (error) {
    console.error('getUnreadCounts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Edit message
export const editMessage = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { id } = req.params;
    const { text } = req.body;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender_id !== userId && message.from_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this message' });
    }

    if (message.message_type !== 'text') {
      return res.status(400).json({ success: false, message: 'Only text messages can be edited' });
    }

    message.text = text;
    message.edited = true;
    message.edited_at = new Date();
    await message.save();

    res.json({ success: true, message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Forward message
export const forwardMessage = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { messageId, to_user_id } = req.body;

    const originalMessage = await Message.findById(messageId);

    if (!originalMessage) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const newMessage = await Message.create({
      sender_id: userId,
      recipient_id: to_user_id,
      from_user_id: userId,
      to_user_id,
      text: originalMessage.text,
      message_type: originalMessage.message_type,
      message_url: originalMessage.message_url,
      file_name: originalMessage.file_name,
      file_size: originalMessage.file_size,
      file_type: originalMessage.file_type,
      forwarded: true,
      forwarded_from: originalMessage._id
    });

    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Star message
export const starMessage = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.starred = message.starred || [];
    if (!message.starred.includes(userId)) {
      message.starred.push(userId);
    }
    await message.save();

    res.json({ success: true, message: 'Message starred' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Pin message
export const pinMessage = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.pinned = message.pinned || [];
    if (!message.pinned.includes(userId)) {
      message.pinned.push(userId);
    }
    await message.save();

    res.json({ success: true, message: 'Message pinned' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete message for me
export const deleteMessageForMe = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.deleted_by = message.deleted_by || [];
    if (!message.deleted_by.includes(userId)) {
      message.deleted_by.push(userId);
    }
    await message.save();

    res.json({ success: true, message: 'Message deleted for you' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete message for everyone
export const deleteMessageForEveryone = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender_id !== userId && message.from_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages for everyone' });
    }

    message.is_deleted = true;
    message.deleted_at = new Date();
    message.text = 'This message was deleted';
    await message.save();

    res.json({ success: true, message: 'Message deleted for everyone' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark message as viewed (for view-once messages)
export const markMessageAsViewed = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is the recipient
    if (message.recipient_id !== userId && message.to_user_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view messages sent to you' 
      });
    }

    // Check if it's a view-once message
    if (!message.view_once) {
      return res.status(400).json({ 
        success: false, 
        message: 'This is not a view-once message' 
      });
    }

    // Check if already viewed by this user
    if (message.viewed_by && message.viewed_by.includes(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message already viewed',
        viewed_at: message.viewed_at
      });
    }

    // Mark as viewed
    if (!message.viewed_by) {
      message.viewed_by = [];
    }
    message.viewed_by.push(userId);
    
    // Set viewed_at timestamp if first time
    if (!message.viewed_at) {
      message.viewed_at = new Date();
    }

    await message.save();

    // Notify sender about view status via SSE
    const senderId = message.sender_id || message.from_user_id;
    if (senderId) {
      sendMessageToUser(senderId, {
        type: 'messageViewed',
        messageId: message._id,
        viewedBy: userId,
        viewedAt: message.viewed_at,
        timestamp: new Date().toISOString()
      });
      console.log(`Sent view notification to sender ${senderId}`);
    }

    res.json({ 
      success: true, 
      message: 'Message marked as viewed',
      viewed_at: message.viewed_at
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};