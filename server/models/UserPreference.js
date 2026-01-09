import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Hidden/blocked users - user won't see content from these users
  hidden_users: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    hidden_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Not interested categories - for content filtering
  not_interested_categories: [{
    type: String,
    // Can be tags, topics, or content types
  }],
  
  // Not interested posts - specific posts marked as not interested
  not_interested_posts: [{
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    marked_at: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      enum: ['not_interested', 'seen_too_many', 'sensitive_content', 'other']
    }
  }],
  
  // Content preferences
  show_sensitive_content: {
    type: Boolean,
    default: false
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
userPreferenceSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create indexes for better query performance
userPreferenceSchema.index({ 'hidden_users.user_id': 1 });
userPreferenceSchema.index({ 'not_interested_posts.post_id': 1 });

const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);
export default UserPreference;
