import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  overall_rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  features_rating: {
    posts: { type: Number, min: 1, max: 5 },
    messaging: { type: Number, min: 1, max: 5 },
    stories: { type: Number, min: 1, max: 5 },
    reactions: { type: Number, min: 1, max: 5 },
    trending: { type: Number, min: 1, max: 5 }
  },
  what_you_like: {
    type: String,
    maxLength: 1000
  },
  what_to_improve: {
    type: String,
    maxLength: 1000
  },
  missing_features: {
    type: String,
    maxLength: 1000
  },
  would_recommend: {
    type: Boolean,
    required: true
  },
  nps_score: {
    type: Number,
    min: 0,
    max: 10
  },
  contact_for_followup: {
    type: Boolean,
    default: false
  },
  feedback_type: {
    type: String,
    enum: ['popup_7day', 'manual', 'email_link'],
    default: 'manual'
  }
}, {
  timestamps: true
});

// Index for analytics
feedbackSchema.index({ user_id: 1 });
feedbackSchema.index({ overall_rating: 1 });
feedbackSchema.index({ createdAt: -1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
