import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  background_url: {
    type: String,
    default: null
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members_roles: {
    type: Map,
    of: String, // Maps user ID to role: 'admin', 'moderator', 'member'
    default: {}
  },
  admin_only_posting: {
    type: Boolean,
    default: false
  },
  pinned_messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChannelMessage'
  }],
  muted_members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  category: {
    type: String,
    enum: ['general', 'tech', 'entertainment', 'sports', 'news', 'education', 'business', 'other'],
    default: 'general'
  },
  is_pinned_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  total_messages: {
    type: Number,
    default: 0
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

export default mongoose.model('Channel', channelSchema);
