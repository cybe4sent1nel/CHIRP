import Message from "../models/Message.js";
import fs from "fs";
import imageKit from "../configs/imageKit.js";

// Object for server side event for real time message
const connections = {};

// Track online users and their connections
const onlineUsers = new Map(); // userId -> { res, connectedAt, lastActivity }
// Expose for best-effort server-side polling endpoints (may be empty on serverless deployments)
global.__onlineUsers = onlineUsers;

// Function to broadcast user status to all connected clients
const broadcastUserStatus = (userId, isOnline) => {
  const statusMessage = {
    type: 'userStatus',
    userId,
    isOnline,
    timestamp: new Date().toISOString()
  };
  
  console.log(`Broadcasting status: ${userId} is ${isOnline ? 'online' : 'offline'} to ${Object.keys(connections).length} connected clients`);
  
  // Send to all connected clients
  Object.entries(connections).forEach(([connectedUserId, res]) => {
    try {
      if (res && res.writable) {
        res.write(`data: ${JSON.stringify(statusMessage)}\n\n`);
        console.log(`  ✓ Status sent to user: ${connectedUserId}`);
      } else {
        console.log(`  ✗ User ${connectedUserId} connection not writable`);
      }
    } catch (err) {
      console.error(`  ✗ Error broadcasting status to ${connectedUserId}:`, err.message);
    }
  });
};

// Controller function for SSE endpoint
export const sseController = async (req, res) => {
  const { userId } = req.params;
  console.log("New client connected: ", userId);

  // Disable compression to prevent buffering
  res.setHeader("Content-Encoding", "identity");
  
  // Set sse headers with proper connection management
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  // Use "upgrade" to indicate this is a connection upgrade, preventing pipelining
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  // Prevent HTTP pipelining - tell the client not to pipeline requests on this connection
  res.setHeader("Upgrade", "keep-alive");

  // Keep-alive timeout settings for stability - BEFORE any writing
  if (req.socket) {
    req.socket.setTimeout(0); // Disable socket timeout
    req.socket.setNoDelay(true); // Disable Nagle algorithm for low-latency
    req.socket.setKeepAlive(true, 30000); // Keep-alive every 30s
  }

  // IMPORTANT: For SSE to work, we must NOT consume the request body
  // We also must NOT call res.end(). The response stays open indefinitely.

  // Close any existing connection for this user (prevent duplicates)
  if (connections[userId]) {
    try {
      console.log(`Closing previous connection for user ${userId}`);
      delete connections[userId];
    } catch (err) {
      console.log("Error closing previous connection for user:", userId);
    }
  }

  // Setup cleanup function BEFORE adding connection
  let heartbeat = null;
  const cleanup = (reason) => {
    console.log("Cleanup called for user:", userId, "reason:", reason || "unknown");
    if (heartbeat) {
      clearInterval(heartbeat);
    }
    if (connections[userId] === res) {
      delete connections[userId];
    }
    // Remove from online users
    if (onlineUsers.has(userId)) {
      onlineUsers.delete(userId);
      console.log(`User ${userId} marked as offline`);
      // Broadcast offline status to all connected clients
      broadcastUserStatus(userId, false);
    }
  };

  // Setup event handlers BEFORE sending data
  const onRequestClose = () => cleanup("request close");
  const onRequestError = (err) => {
    console.error("SSE request error for user:", userId, err.code || err.message);
    cleanup("request error");
  };
  const onResponseError = (err) => {
    console.error("SSE response error for user:", userId, err.code || err.message);
    cleanup("response error");
  };
  const onSocketError = (err) => {
    console.error("SSE socket error for user:", userId, err.code || err.message);
    cleanup("socket error");
  };

  // Register handlers - be careful about which events we listen to
  req.on("close", onRequestClose);
  req.on("error", onRequestError);
  res.on("error", onResponseError);
  // NOTE: DO NOT listen to res.finish or res.close - they fire too early for SSE
  // The only reliable indicators of connection close are req events
  
  if (req.socket) {
    req.socket.on("error", onSocketError);
    // Also listen to socket end
    req.socket.on("end", () => {
      console.log("Socket end event for user:", userId);
      cleanup("socket end");
    });
  }

  // Now add the client's response object to the connections object
  connections[userId] = res;
  
  // Add to online users
  onlineUsers.set(userId, {
    res,
    connectedAt: new Date(),
    lastActivity: new Date()
  });
  console.log(`User ${userId} marked as online, total online users:`, onlineUsers.size);
  
  // Mark pending messages as delivered when user comes online
  try {
    const deliveryResult = await Message.updateMany(
      {
        to_user_id: userId,
        delivered: false,
        is_deleted: false
      },
      {
        delivered: true,
        delivered_at: new Date()
      }
    );
    console.log(`Marked ${deliveryResult.modifiedCount} pending messages as delivered for user ${userId}`);
    
    // Notify senders about delivery status updates
    if (deliveryResult.modifiedCount > 0) {
      const updatedMessages = await Message.find({
        to_user_id: userId,
        delivered: true,
        delivered_at: { $gte: new Date(Date.now() - 5000) } // Last 5 seconds
      });
      
      updatedMessages.forEach(msg => {
        const senderId = msg.from_user_id || msg.sender_id;
        if (connections[senderId] && connections[senderId].writable) {
          const deliveryUpdate = {
            type: 'messageStatus',
            messageId: msg._id,
            status: 'delivered',
            timestamp: new Date().toISOString()
          };
          connections[senderId].write(`data: ${JSON.stringify(deliveryUpdate)}\n\n`);
        }
      });
    }
  } catch (err) {
    console.error(`Error marking messages as delivered for ${userId}:`, err);
  }
  
  // Broadcast online status to all connected clients
  broadcastUserStatus(userId, true);

  // Send current online users list to the newly connected user
  try {
    const onlineUsersList = Array.from(onlineUsers.keys());
    const onlineStatusMessage = {
      type: 'onlineUsersList',
      users: onlineUsersList,
      timestamp: new Date().toISOString()
    };
    res.write(`data: ${JSON.stringify(onlineStatusMessage)}\n\n`);
    console.log(`Sent online users list to ${userId}:`, onlineUsersList);
  } catch (err) {
    console.error('Error sending online users list:', err.message);
  }

  // Send a keep-alive comment as the first message
  // This helps with proxies and confirms the connection is working
  try {
    console.log(`Writing initial keep-alive message for user ${userId}`);
    // Write a comment (starts with :) - these are ignored by EventSource but keep the connection alive
    const written = res.write(": keep-alive\n\n");
    console.log(`Initial keep-alive written for user ${userId}, writable:`, res.writable, "result:", written);
  } catch (err) {
    console.error("Error writing initial keep-alive for response:", err.message);
    cleanup("write error");
    return;
  }

  // Keep connection alive with heartbeat (every 25 seconds to prevent timeout)
  heartbeat = setInterval(() => {
    try {
      if (connections[userId] === res && res.writable) {
        res.write(": heartbeat\n\n");
      } else {
        cleanup("heartbeat - not writable");
      }
    } catch (err) {
      console.error("Heartbeat error for user:", userId, err.message);
      cleanup("heartbeat error");
    }
  }, 25000); // Every 25 seconds
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
    const { userId } = req.auth();
    const { to_user_id, text, view_once, allow_save } = req.body;
    
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
    const isRecipientOnline = connections[to_user_id] && connections[to_user_id].writable;

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
      // View-once fields
      view_once: view_once === 'true' || view_once === true,
      allow_save: allow_save === 'false' || allow_save === false ? false : true,
      viewed_by: [],
    });

    res.json({ success: true, message });

    // Send message to_user_id using SSE
    const messageWithUserData = await Message.findById(message._id).populate(
      "from_user_id"
    );

    if (connections[to_user_id]) {
      try {
        if (connections[to_user_id].writable) {
          console.log(`Sending message to user ${to_user_id}`);
          const written = connections[to_user_id].write(
            `data: ${JSON.stringify(messageWithUserData)}\n\n`
          );
          console.log(`Message sent to user ${to_user_id}, bytes written:`, written);
          
          // Broadcast delivery status back to sender
          if (connections[userId] && connections[userId].writable) {
            const deliveryUpdate = {
              type: 'messageStatus',
              messageId: message._id,
              status: 'delivered',
              timestamp: new Date().toISOString()
            };
            connections[userId].write(`data: ${JSON.stringify(deliveryUpdate)}\n\n`);
          }
        } else {
          console.log(`User ${to_user_id} connection not writable, removing`);
          delete connections[to_user_id];
        }
      } catch (err) {
        console.error(`Error sending message to ${to_user_id}:`, err.message);
        delete connections[to_user_id];
      }
    } else {
      console.log(`User ${to_user_id} not connected for message delivery`);
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
    let userId;
    try {
      const auth = req.auth();
      userId = auth?.userId;
    } catch (e) {
      // Auth might fail, try from header
      console.warn('Auth middleware failed:', e.message);
      return res.status(401).json({success: false, message: 'Unauthorized - Auth failed: ' + e.message});
    }

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
      .populate('from_user_id', 'full_name profile_picture username');

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
        const { userId } = req.auth()
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
    const { userId } = req.auth();
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
    
    // Broadcast read status to sender via SSE
    if (result.modifiedCount > 0 && connections[from_user_id] && connections[from_user_id].writable) {
      const readMessages = await Message.find({
        from_user_id: from_user_id,
        to_user_id: userId,
        read: true,
        read_at: { $gte: new Date(Date.now() - 5000) } // Last 5 seconds
      }).select('_id');
      
      readMessages.forEach(msg => {
        const readUpdate = {
          type: 'messageStatus',
          messageId: msg._id,
          status: 'read',
          timestamp: new Date().toISOString()
        };
        connections[from_user_id].write(`data: ${JSON.stringify(readUpdate)}\n\n`);
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
    const { userId } = req.auth();

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
    const { userId } = req.auth();
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
    const { userId } = req.auth();
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
    const { userId } = req.auth();
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
    const { userId } = req.auth();
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
    const { userId } = req.auth();
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
    const { userId } = req.auth();
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
    const { userId } = req.auth();
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
    if (connections[senderId] && connections[senderId].writable) {
      const viewUpdate = {
        type: 'messageViewed',
        messageId: message._id,
        viewedBy: userId,
        viewedAt: message.viewed_at,
        timestamp: new Date().toISOString()
      };
      connections[senderId].write(`data: ${JSON.stringify(viewUpdate)}\n\n`);
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