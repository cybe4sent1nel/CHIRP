/**
 * SSE (Server-Sent Events) Service
 * Handles real-time message delivery, online status, and delivery/read receipts
 * Supports both Clerk and custom JWT authentication
 */

import Message from "../models/Message.js";
import { getCorsOriginHeader } from "../configs/cors.js";

// Central connection manager
class SSEConnectionManager {
    constructor() {
        this.connections = new Map(); // userId -> { res, connectedAt, lastActivity, heartbeat }
        this.messageQueue = new Map(); // userId -> Array of pending messages
        this.userStatus = new Map(); // userId -> { isOnline, connectedAt, lastActivity }
    }

    /**
     * Register a new SSE connection for a user
     */
    registerConnection(userId, res) {
        console.log(`[SSE] Registering connection for user: ${userId}`);

        // Close existing connection if any
        if (this.connections.has(userId)) {
            this.closeConnection(userId, 'replaced');
        }

        // Create connection object
        const connectionObj = {
            res,
            connectedAt: new Date(),
            lastActivity: new Date(),
            heartbeat: null,
            userId
        };

        this.connections.set(userId, connectionObj);
        this.userStatus.set(userId, {
            isOnline: true,
            connectedAt: new Date(),
            lastActivity: new Date()
        });

        console.log(`[SSE] Connection registered. Total online users: ${this.connections.size}`);
        return connectionObj;
    }

    /**
     * Close a connection for a user
     */
    closeConnection(userId, reason = 'unknown') {
        console.log(`[SSE] Closing connection for user ${userId} (reason: ${reason})`);

        const connObj = this.connections.get(userId);
        if (connObj && connObj.heartbeat) {
            clearInterval(connObj.heartbeat);
        }

        this.connections.delete(userId);

        // Mark user as offline
        if (this.userStatus.has(userId)) {
            this.userStatus.get(userId).isOnline = false;
        }

        console.log(`[SSE] Connection closed. Total online users: ${this.connections.size}`);
    }

    /**
     * Send a message to a specific user via SSE
     */
    sendToUser(userId, data) {
        const connObj = this.connections.get(userId);

        if (!connObj) {
            console.log(`[SSE] User ${userId} not connected, queueing message`);
            this.queueMessage(userId, data);
            return false;
        }

        try {
            if (!connObj.res || !connObj.res.writable) {
                console.log(`[SSE] Connection for ${userId} not writable, removing`);
                this.closeConnection(userId, 'not-writable');
                this.queueMessage(userId, data);
                return false;
            }

            const message = `data: ${JSON.stringify(data)}\n\n`;
            connObj.res.write(message);
            connObj.lastActivity = new Date();

            console.log(`[SSE] Message sent to user ${userId}`);
            return true;
        } catch (err) {
            console.error(`[SSE] Error sending message to ${userId}:`, err.message);
            this.closeConnection(userId, 'write-error');
            this.queueMessage(userId, data);
            return false;
        }
    }

    /**
     * Broadcast a message to all connected users except the sender
     */
    broadcast(data, excludeUserId = null) {
        console.log(`[SSE] Broadcasting to ${this.connections.size} users (excluding ${excludeUserId})`);

        const failedUsers = [];

        for (const [userId, connObj] of this.connections.entries()) {
            if (excludeUserId && userId === excludeUserId) continue;

            try {
                if (!connObj.res || !connObj.res.writable) {
                    console.log(`[SSE] Connection for ${userId} not writable during broadcast`);
                    failedUsers.push(userId);
                    continue;
                }

                const message = `data: ${JSON.stringify(data)}\n\n`;
                connObj.res.write(message);
                connObj.lastActivity = new Date();
            } catch (err) {
                console.error(`[SSE] Error broadcasting to ${userId}:`, err.message);
                failedUsers.push(userId);
            }
        }

        // Clean up failed connections
        failedUsers.forEach(userId => this.closeConnection(userId, 'broadcast-error'));

        return failedUsers.length === 0;
    }

    /**
     * Queue a message for delivery when user comes online
     */
    queueMessage(userId, data) {
        if (!this.messageQueue.has(userId)) {
            this.messageQueue.set(userId, []);
        }
        this.messageQueue.get(userId).push(data);
        console.log(`[SSE] Message queued for ${userId}, queue size: ${this.messageQueue.get(userId).length}`);
    }

    /**
     * Get and clear queued messages for a user
     */
    getQueuedMessages(userId) {
        const messages = this.messageQueue.get(userId) || [];
        this.messageQueue.delete(userId);
        console.log(`[SSE] Retrieved ${messages.length} queued messages for ${userId}`);
        return messages;
    }

    /**
     * Get list of online users
     */
    getOnlineUsers() {
        return Array.from(this.connections.keys());
    }

    /**
     * Get user status
     */
    getUserStatus(userId) {
        return this.userStatus.get(userId) || { isOnline: false };
    }

    /**
     * Setup heartbeat for a connection
     */
    setupHeartbeat(userId, interval = 25000) {
        const connObj = this.connections.get(userId);
        if (!connObj) return;

        if (connObj.heartbeat) {
            clearInterval(connObj.heartbeat);
        }

        connObj.heartbeat = setInterval(() => {
            try {
                const currentConnObj = this.connections.get(userId);
                if (currentConnObj && currentConnObj.res && currentConnObj.res.writable) {
                    currentConnObj.res.write(': heartbeat\n\n');
                    currentConnObj.lastActivity = new Date();
                } else {
                    this.closeConnection(userId, 'heartbeat-failed');
                }
            } catch (err) {
                console.error(`[SSE] Heartbeat error for ${userId}:`, err.message);
                this.closeConnection(userId, 'heartbeat-error');
            }
        }, interval);

        console.log(`[SSE] Heartbeat setup for user ${userId} (interval: ${interval}ms)`);
    }

    /**
     * Get connection statistics
     */
    getStats() {
        return {
            totalConnections: this.connections.size,
            totalQueued: Array.from(this.messageQueue.values()).reduce((sum, arr) => sum + arr.length, 0),
            connections: Array.from(this.connections.entries()).map(([userId, connObj]) => ({
                userId,
                connectedAt: connObj.connectedAt,
                lastActivity: connObj.lastActivity
            }))
        };
    }
}

// Export singleton instance
export const sseManager = new SSEConnectionManager();

/**
 * Initialize SSE connection for a user
 */
export const initializeSSEConnection = async (userId, res, req) => {
  console.log(`[SSE-INIT] Starting initialization for user: ${userId}`);
  console.log(`[SSE-INIT] Response state - writable: ${res?.writable}, headersSent: ${res?.headersSent}`);
  
  try {
    console.log(`[SSE] Initializing SSE connection for user: ${userId}`);

    // Check if response is still valid
    if (!res || !res.writable) {
      console.error(`[SSE] Response object is not writable for ${userId}`);
      throw new Error('Response object is not writable');
    }

    // Configure socket BEFORE writing headers
    if (req.socket) {
      try {
        req.socket.setTimeout(0); // Disable socket timeout
        req.socket.setNoDelay(true); // Low latency
        req.socket.setKeepAlive(true, 30000); // Keep-alive every 30s
      } catch (err) {
        console.warn(`[SSE] Socket configuration error: ${err.message}`);
      }
    }

    // Write response headers first (must be done before writing data)
    if (!res.headersSent) {
      try {
        // Get the requesting origin for CORS
        const origin = req.headers.origin;
        const corsOrigin = getCorsOriginHeader(origin);
        
        console.log(`[SSE] Writing headers for user ${userId}, origin: ${origin}, cors: ${corsOrigin}`);
        
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Credentials': 'true',
          'X-Accel-Buffering': 'no',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Content-Encoding': 'identity'
        });
        console.log(`[SSE] Headers sent for user ${userId}`);
      } catch (headerErr) {
        console.error(`[SSE] Error writing headers for ${userId}:`, headerErr.message);
        throw new Error(`Failed to write SSE headers: ${headerErr.message}`);
      }
    }

    // Setup cleanup handlers BEFORE anything else can fail
    const setupCleanup = () => {
      const onClose = () => {
        console.log(`[SSE] Request closed for ${userId}`);
        sseManager.closeConnection(userId, 'request-close');
      };
      const onError = (err) => {
        console.error(`[SSE] Connection error for ${userId}:`, err.code || err.message);
        sseManager.closeConnection(userId, 'request-error');
      };

      req.on('close', onClose);
      req.on('error', onError);
      res.on('error', onError);

      if (req.socket) {
        req.socket.on('error', (err) => {
          console.error(`[SSE] Socket error for ${userId}:`, err.code || err.message);
          sseManager.closeConnection(userId, 'socket-error');
        });
        req.socket.on('end', () => {
          console.log(`[SSE] Socket end for ${userId}`);
          sseManager.closeConnection(userId, 'socket-end');
        });
      }
    };

    setupCleanup();

    // Register connection
    const connObj = sseManager.registerConnection(userId, res);
    console.log(`[SSE] Connection registered for ${userId}`);

    // Send initial keep-alive comment
    try {
      if (res.writable) {
        res.write(': keep-alive\n\n');
        console.log(`[SSE] Initial keep-alive sent to ${userId}`);
      } else {
        console.warn(`[SSE] Response not writable for ${userId}`);
        throw new Error('Response not writable');
      }
    } catch (err) {
      console.error(`[SSE] Error sending keep-alive to ${userId}:`, err.message);
      sseManager.closeConnection(userId, 'keep-alive-error');
      throw err;
    }

    // Mark pending messages as delivered
    await markPendingMessagesAsDelivered(userId);

    // Send online users list
    try {
      const onlineUsers = sseManager.getOnlineUsers();
      sseManager.sendToUser(userId, {
        type: 'onlineUsersList',
        users: onlineUsers,
        timestamp: new Date().toISOString()
      });
      console.log(`[SSE] Sent online users list to ${userId}`);
    } catch (err) {
      console.warn(`[SSE] Warning: Failed to send online users list to ${userId}:`, err.message);
      // Don't throw - this is not critical
    }

    // Send any queued messages
    try {
      const queuedMessages = sseManager.getQueuedMessages(userId);
      if (queuedMessages.length > 0) {
        console.log(`[SSE] Sending ${queuedMessages.length} queued messages to ${userId}`);
        queuedMessages.forEach(msg => {
          try {
            sseManager.sendToUser(userId, msg);
          } catch (msgErr) {
            console.warn(`[SSE] Warning: Failed to send queued message to ${userId}:`, msgErr.message);
          }
        });
      }
    } catch (queueErr) {
      console.warn(`[SSE] Warning: Error processing queued messages for ${userId}:`, queueErr.message);
    }

    // Broadcast user online status
    broadcastUserStatus(userId, true);

    // Setup heartbeat
    sseManager.setupHeartbeat(userId, 25000);

    console.log(`[SSE] Connection initialized successfully for user ${userId}`);
  } catch (err) {
    console.error(`[SSE] Error initializing connection for ${userId}:`, err.message);
    console.error(`[SSE] Stack:`, err.stack);
    if (!res.headersSent) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
    }
    if (res.writable) {
      res.end();
    }
    throw err;
  }
};

/**
 * Mark pending messages as delivered when user comes online
 */
export const markPendingMessagesAsDelivered = async (userId) => {
    try {
        const result = await Message.updateMany(
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

        if (result.modifiedCount > 0) {
            console.log(`[SSE] Marked ${result.modifiedCount} messages as delivered for user ${userId}`);

            // Notify senders about delivery
            const deliveredMessages = await Message.find({
                to_user_id: userId,
                delivered: true,
                delivered_at: { $gte: new Date(Date.now() - 5000) }
            });

            deliveredMessages.forEach(msg => {
                const senderId = msg.from_user_id || msg.sender_id;
                if (senderId) {
                    sseManager.sendToUser(senderId, {
                        type: 'messageStatus',
                        messageId: msg._id,
                        status: 'delivered',
                        timestamp: new Date().toISOString()
                    });
                }
            });
        }
    } catch (err) {
        console.error(`[SSE] Error marking messages as delivered for ${userId}:`, err.message);
    }
};

/**
 * Broadcast user status (online/offline) to all connected users
 */
export const broadcastUserStatus = (userId, isOnline) => {
    const statusMessage = {
        type: 'userStatus',
        userId,
        isOnline,
        timestamp: new Date().toISOString()
    };

    console.log(`[SSE] Broadcasting status: ${userId} is ${isOnline ? 'online' : 'offline'}`);
    sseManager.broadcast(statusMessage);
};

/**
 * Send a message to a specific user via SSE
 */
export const sendMessageToUser = (userId, messageData) => {
    return sseManager.sendToUser(userId, messageData);
};

/**
 * Send delivery confirmation to sender
 */
export const sendDeliveryConfirmation = (senderId, messageId) => {
    return sseManager.sendToUser(senderId, {
        type: 'messageStatus',
        messageId,
        status: 'delivered',
        timestamp: new Date().toISOString()
    });
};

/**
 * Send read receipt to sender
 */
export const sendReadReceipt = (senderId, messageId) => {
    return sseManager.sendToUser(senderId, {
        type: 'messageStatus',
        messageId,
        status: 'read',
        timestamp: new Date().toISOString()
    });
};

/**
 * Send view notification for view-once messages
 */
export const sendViewNotification = (senderId, messageId, viewedBy) => {
    return sseManager.sendToUser(senderId, {
        type: 'messageViewed',
        messageId,
        viewedBy,
        timestamp: new Date().toISOString()
    });
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId) => {
    return sseManager.connections.has(userId);
};

/**
 * Get all online users
 */
export const getOnlineUsers = () => {
    return sseManager.getOnlineUsers();
};

/**
 * Get SSE stats (useful for monitoring)
 */
export const getSSEStats = () => {
    return sseManager.getStats();
};
