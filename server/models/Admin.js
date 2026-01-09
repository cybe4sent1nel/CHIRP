import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'moderator'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  permissions: {
    can_manage_users: { type: Boolean, default: false },
    can_manage_content: { type: Boolean, default: true },
    can_manage_reports: { type: Boolean, default: true },
    can_view_analytics: { type: Boolean, default: true },
    can_manage_admins: { type: Boolean, default: false }
  },
  created_by: {
    type: String,
    ref: 'Admin'
  },
  last_login: {
    type: Date
  },
  otp: {
    code: String,
    expires_at: Date,
    attempts: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for faster email lookups
adminSchema.index({ email: 1 });

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
