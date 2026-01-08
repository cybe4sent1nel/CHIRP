import mongoose from 'mongoose';

const hashtagSchema = new mongoose.Schema({
  tag: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  count: {
    type: Number,
    default: 1
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  trending_score: {
    type: Number,
    default: 0
  },
  last_used: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for trending hashtags
hashtagSchema.index({ trending_score: -1, count: -1 });
hashtagSchema.index({ last_used: -1 });

export default mongoose.model('Hashtag', hashtagSchema);
