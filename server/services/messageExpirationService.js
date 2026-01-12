import Message from "../models/Message.js";
import { sendDeliveryConfirmation } from "./sseService.js";

/**
 * Service to handle message expiration (disappearing messages)
 */

// Store of active expiration timers
const expirationTimers = new Map();

/**
 * Schedule message expiration
 * @param {string} messageId - Message ID to expire
 * @param {Date} expireAt - When the message should expire
 */
export const scheduleMessageExpiration = (messageId, expireAt) => {
  try {
    // Cancel any existing timer for this message
    if (expirationTimers.has(messageId)) {
      clearTimeout(expirationTimers.get(messageId));
    }

    const timeUntilExpiry = expireAt.getTime() - Date.now();
    
    // Only schedule if time is in the future
    if (timeUntilExpiry > 0) {
      const timer = setTimeout(async () => {
        await expireMessage(messageId);
        expirationTimers.delete(messageId);
      }, timeUntilExpiry);

      expirationTimers.set(messageId, timer);
      console.log(`[MSG-EXP] Scheduled message ${messageId} to expire in ${Math.round(timeUntilExpiry / 1000)}s`);
    } else {
      // Message should have already expired
      expireMessage(messageId);
    }
  } catch (error) {
    console.error(`[MSG-EXP] Error scheduling expiration for message ${messageId}:`, error);
  }
};

/**
 * Mark message as expired/disappeared
 * @param {string} messageId - Message ID to expire
 */
export const expireMessage = async (messageId) => {
  try {
    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        disappeared: true,
        text: "[This message has disappeared]",
        message_url: null,
        message_type: "text"
      },
      { new: true }
    );

    if (message) {
      console.log(`[MSG-EXP] Message ${messageId} expired successfully`);
      // You could emit an event here to notify clients about the expiration
    }
  } catch (error) {
    console.error(`[MSG-EXP] Error expiring message ${messageId}:`, error);
  }
};

/**
 * Load and schedule expiration for all messages that haven't expired yet
 * This is called on server startup
 */
export const initializeMessageExpirations = async () => {
  try {
    console.log('[MSG-EXP] Initializing message expirations...');
    
    const now = new Date();
    // Find all disappearing messages that haven't expired yet
    const messages = await Message.find({
      disappearing_message: true,
      disappeared: false,
      disappear_at: { $gt: now }
    }).select('_id disappear_at');

    console.log(`[MSG-EXP] Found ${messages.length} messages to schedule expiration for`);

    messages.forEach(msg => {
      scheduleMessageExpiration(msg._id.toString(), msg.disappear_at);
    });

  } catch (error) {
    console.error('[MSG-EXP] Error initializing message expirations:', error);
  }
};

/**
 * Cancel expiration for a message (if you want to prevent expiration)
 * @param {string} messageId - Message ID
 */
export const cancelMessageExpiration = (messageId) => {
  if (expirationTimers.has(messageId)) {
    clearTimeout(expirationTimers.get(messageId));
    expirationTimers.delete(messageId);
    console.log(`[MSG-EXP] Cancelled expiration for message ${messageId}`);
  }
};

/**
 * Get count of active expiration timers (for monitoring)
 */
export const getActiveExpirationCount = () => {
  return expirationTimers.size;
};

/**
 * Clear all timers (call on server shutdown)
 */
export const clearAllExpirationTimers = () => {
  expirationTimers.forEach(timer => clearTimeout(timer));
  expirationTimers.clear();
  console.log('[MSG-EXP] Cleared all expiration timers');
};

export default {
  scheduleMessageExpiration,
  expireMessage,
  initializeMessageExpirations,
  cancelMessageExpiration,
  getActiveExpirationCount,
  clearAllExpirationTimers
};
