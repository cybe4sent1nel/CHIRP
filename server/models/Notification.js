import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: String,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: String,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'repost', 'follow', 'mention', 'message', 'profile_view'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: ''
  },
  read: {
    type: Boolean,
    default: false
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

export default mongoose.model('Notification', notificationSchema);
