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
    enum: ['text', 'voice', 'image'],
    default: 'text'
  },
  likes_count: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
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
