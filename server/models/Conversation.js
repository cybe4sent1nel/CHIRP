import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    user_id: {
      type: String,
      ref: 'User',
      required: true
    },
    // User-specific settings for this conversation
    archived: {
      type: Boolean,
      default: false
    },
    archived_at: {
      type: Date
    },
    muted: {
      type: Boolean,
      default: false
    },
    muted_until: {
      type: Date
    },
    pinned: {
      type: Boolean,
      default: false
    },
    pinned_at: {
      type: Date
    },
    deleted: {
      type: Boolean,
      default: false
    },
    deleted_at: {
      type: Date
    },
    // Custom name for conversation (if user renamed it)
    custom_name: {
      type: String
    },
    // Last read message timestamp for unread count
    last_read_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Conversation type
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  
  // Group conversation details (if applicable)
  group_name: {
    type: String
  },
  group_picture: {
    type: String
  },
  group_admins: [{
    type: String,
    ref: 'User'
  }],
  
  // Last message info for sorting
  last_message: {
    text: String,
    sender_id: {
      type: String,
      ref: 'User'
    },
    sent_at: {
      type: Date,
      default: Date.now
    },
    message_type: {
      type: String,
      enum: ["text", "image", "video", "audio", "document", "voice", "gif", "sticker"],
      default: "text"
    }
  },
  
  // Message count for analytics
  message_count: {
    type: Number,
    default: 0
  },
  
  // Encryption key for E2E (will implement later)
  encryption_key: {
    type: String
  },
  
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at timestamp on save
conversationSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create indexes
conversationSchema.index({ 'participants.user_id': 1 });
conversationSchema.index({ 'last_message.sent_at': -1 });
conversationSchema.index({ 'participants.user_id': 1, 'participants.archived': 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
