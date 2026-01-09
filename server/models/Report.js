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
  reported_message_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  type: {
    type: String,
    enum: ['user', 'post', 'message'],
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
      'scam',
      'impersonation',
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
  action_taken: {
    type: String,
    enum: ['no_action', 'content_removed', 'user_warned', 'user_suspended', 'user_banned'],
  },
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  reviewed_at: {
    type: Date,
  },
  admin_notes: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Report = mongoose.model('Report', reportSchema);
export default Report;
