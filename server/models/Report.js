import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reported_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reported_post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
  type: {
    type: String,
    enum: ['user', 'post'],
    required: true,
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'harassment',
      'hate_speech',
      'false_information',
      'spam',
      'adult_content',
      'violence',
      'other',
    ],
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Report = mongoose.model('Report', reportSchema);
export default Report;
