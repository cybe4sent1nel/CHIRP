import mongoose from "mongoose";

const chatSettingsSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true },
    
    // Privacy Settings
    privacy: {
      // Who can message me
      allow_messages_from: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone"
      },
      
      // Who can see my online status
      show_online_status: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone"
      },
      
      // Who can see my last seen
      show_last_seen: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone"
      },
      
      // Who can call me
      allow_calls_from: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone"
      },
      
      // Who can see my profile picture
      profile_picture_visibility: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone"
      },
      
      // Block specific users
      blocked_users: [{ type: String }]
    },
    
    // Security Settings
    security: {
      // Two-factor authentication
      two_factor_enabled: { type: Boolean, default: false },
      
      // End-to-end encryption
      e2e_encryption: { type: Boolean, default: true },
      
      // Auto delete messages
      auto_delete_messages: {
        enabled: { type: Boolean, default: false },
        after_days: { type: Number, default: 30 }
      },
      
      // Disappearing messages (like WhatsApp)
      disappearing_messages_default: {
        enabled: { type: Boolean, default: false },
        duration: { 
          type: String, 
          enum: ["15s", "1m", "1h", "1d", "7d"],
          default: "1h"
        }
      },
      
      // Screen share security
      allow_screen_sharing: { type: Boolean, default: true },
      notify_on_screenshot: { type: Boolean, default: true },
      
      // Forward message permissions
      allow_forwarding: { type: Boolean, default: true }
    },
    
    // Notification Settings
    notifications: {
      // Message notifications
      message_notifications: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      vibration: { type: Boolean, default: true },
      
      // Call notifications
      call_notifications: { type: Boolean, default: true },
      missed_call_notifications: { type: Boolean, default: true },
      
      // Mute notifications for specific chats
      muted_chats: [{ type: String }],
      
      // Do not disturb
      do_not_disturb: {
        enabled: { type: Boolean, default: false },
        start_time: { type: String }, // HH:mm format
        end_time: { type: String }     // HH:mm format
      }
    },
    
    // Read Receipts
    read_receipts: {
      // Show read receipts
      show_read_receipts: { type: Boolean, default: true },
      
      // Show typing indicator
      show_typing_indicator: { type: Boolean, default: true },
      
      // Receive read receipts from others
      show_others_read_receipts: { type: Boolean, default: true }
    },
    
    // Storage Settings
    storage: {
      // Auto download media
      auto_download_media: {
        wifi: { type: Boolean, default: true },
        cellular: { type: Boolean, default: false }
      },
      
      // Keep media
      keep_media_duration: {
        type: String,
        enum: ["forever", "30d", "7d", "3d"],
        default: "forever"
      }
    },
    
    // Group Chat Settings
    group_chat_settings: {
      // Who can add me to groups
      allow_group_invites_from: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone"
      },
      
      // Default group notification preference
      group_notifications: { type: Boolean, default: true }
    },
    
    // Advanced Privacy
    advanced: {
      // Hide profile from search
      hide_from_search: { type: Boolean, default: false },
      
      // One-time view messages (burn after reading)
      burn_after_reading: { type: Boolean, default: false },
      
      // Anonymous chat mode
      anonymous_mode: { type: Boolean, default: false },
      
      // Location sharing
      share_location: { type: Boolean, default: false },
      
      // Activity status
      show_activity_status: { type: Boolean, default: true },
      
      // Message search indexing
      allow_message_search_index: { type: Boolean, default: true }
    },
    
    // Data & Privacy
    data_privacy: {
      // Data export
      allow_data_export: { type: Boolean, default: true },
      
      // Device backup
      backup_encryption_enabled: { type: Boolean, default: true },
      
      // Analytics
      allow_analytics: { type: Boolean, default: false },
      
      // Third party data sharing
      allow_third_party_sharing: { type: Boolean, default: false }
    }
  },
  { timestamps: true, minimize: false }
);

const ChatSettings = mongoose.model("ChatSettings", chatSettingsSchema);

export default ChatSettings;
