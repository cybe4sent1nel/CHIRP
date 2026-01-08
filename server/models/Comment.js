import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  user: {
    type: String,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    trim: true
  },
  media_url: {
    type: String,
    trim: true
  },
  media_type: {
    type: String,
    enum: ['gif', 'sticker'],
    trim: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  reactions: [{
    user: { type: String, ref: "User" },
    type: { type: String, enum: ["LIKE", "SUPPORT", "CELEBRATE", "CHEER", "INSIGHT", "OMG"], default: "LIKE" },
    createdAt: { type: Date, default: Date.now }
  }],
  // Hashtags and mentions for comments
  hashtags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  mentions: [{
    type: String,
    ref: "User"
  }],
}, {
  timestamps: true
});

// Index for efficient queries
commentSchema.index({ post: 1, createdAt: -1 });

export default mongoose.model('Comment', commentSchema);
