import mongoose from 'mongoose';

const channelMessageSchema = new mongoose.Schema({
  channel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  message_type: {
    type: String,
    enum: ['text', 'voice', 'image', 'video', 'audio', 'document', 'gif', 'poll'],
    default: 'text'
  },
  file_name: {
    type: String,
    default: null
  },
  reactions: {
    type: Map,
    of: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: {}
  },
  reply_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChannelMessage',
    default: null
  },
  viewed_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  is_pinned: {
    type: Boolean,
    default: false
  },
  forwarded: {
    type: Boolean,
    default: false
  },
  poll_data: {
    question: String,
    options: [{
      text: String,
      votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],
    multiple_choice: {
      type: Boolean,
      default: false
    },
    expires_at: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('ChannelMessage', channelMessageSchema);
