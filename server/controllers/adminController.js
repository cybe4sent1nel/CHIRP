import Admin from '../models/Admin.js';
import Report from '../models/Report.js';
import OnboardingResponse from '../models/OnboardingResponse.js';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { getReportActionEmailTemplate, getContentRemovedNotification } from '../utils/emailTemplates/reportActionEmail.js';

// Generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, name) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: email,
    subject: 'Chirp Admin - Your Login Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .otp-box { background: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; border: 2px dashed #667eea; }
          .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0; }
          .info { color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; color: #856404; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐦 Chirp Admin Portal</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || 'Admin'},</h2>
            <p class="info">We received a request to access the Chirp Admin Dashboard. Use the code below to complete your login:</p>
            
            <div class="otp-box">
              <div style="color: #666; font-size: 14px; margin-bottom: 10px;">Your verification code is:</div>
              <div class="otp-code">${otp}</div>
              <div style="color: #999; font-size: 12px; margin-top: 10px;">This code expires in 10 minutes</div>
            </div>

            <div class="warning">
              ⚠️ <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for this code.
            </div>

            <p class="info">If you didn't request this code, please ignore this email and ensure your account is secure.</p>
          </div>
          <div class="footer">
            <p>© 2026 Chirp Social Media Platform</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Check if user is admin and send OTP
export const initiateAdminLogin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check if email is in admin list
    const admin = await Admin.findOne({ email: email.toLowerCase(), is_active: true });

    if (!admin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access Forbidden: You are not authorized to access the admin dashboard' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to admin record
    admin.otp = {
      code: otp,
      expires_at: expiresAt,
      attempts: 0
    };
    await admin.save();

    // Send OTP email
    await sendOTPEmail(email, otp, admin.name);

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      email: email
    });

  } catch (error) {
    console.error('Error initiating admin login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send verification code' 
    });
  }
};

// Verify OTP and login
export const verifyAdminOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase(), is_active: true });

    if (!admin || !admin.otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request' 
      });
    }

    // Check if OTP expired
    if (new Date() > admin.otp.expires_at) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code expired. Please request a new one.' 
      });
    }

    // Check attempts
    if (admin.otp.attempts >= 3) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many failed attempts. Please request a new code.' 
      });
    }

    // Verify OTP
    if (admin.otp.code !== otp) {
      admin.otp.attempts += 1;
      await admin.save();
      
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code',
        remaining_attempts: 3 - admin.otp.attempts
      });
    }

    // OTP verified - clear OTP and update last login
    admin.otp = undefined;
    admin.last_login = new Date();
    await admin.save();

    res.json({
      success: true,
      message: 'Login successful',
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify code' 
    });
  }
};

// Create new admin (super_admin only)
export const createAdmin = async (req, res) => {
  try {
    const { email, name, role, permissions } = req.body;
    const createdBy = req.admin.id; // From admin middleware

    // Check if requester is super_admin
    const requester = await Admin.findById(createdBy);
    if (requester.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super admins can create new admins' 
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin with this email already exists' 
      });
    }

    const newAdmin = new Admin({
      email: email.toLowerCase(),
      name,
      role: role || 'moderator',
      permissions: permissions || {
        can_manage_users: false,
        can_manage_content: true,
        can_manage_reports: true,
        can_view_analytics: true,
        can_manage_admins: false
      },
      created_by: createdBy
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: newAdmin
    });

  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create admin' 
    });
  }
};

// Get all reports (admin)
export const getAllReports = async (req, res) => {
  try {
    const { status, item_type, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (item_type) query.reported_item_type = item_type;

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('reported_by', 'username profile_picture');

    const count = await Report.countDocuments(query);

    res.json({
      success: true,
      data: reports,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reports' 
    });
  }
};

// Update report status (admin)
export const updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, action_taken, admin_notes } = req.body;
    const adminId = req.admin.id;

    const report = await Report.findById(reportId)
      .populate('reported_by', 'username email clerk_user_id')
      .populate('reported_user', 'username email clerk_user_id');
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    report.status = status || report.status;
    report.action_taken = action_taken || report.action_taken;
    report.admin_notes = admin_notes || report.admin_notes;
    report.reviewed_by = adminId;
    report.reviewed_at = new Date();

    await report.save();

    // Send email notification to reporter
    if (action_taken && report.reported_by?.email) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const emailData = getReportActionEmailTemplate({
          action_taken,
          reporter_name: report.reported_by.username,
          item_type: report.item_type,
          report_reason: report.reason,
          admin_notes
        });

        await transporter.sendMail({
          from: process.env.SENDER_EMAIL,
          to: report.reported_by.email,
          subject: emailData.subject,
          html: emailData.html
        });
      } catch (emailError) {
        console.error('Failed to send report action email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // If content is removed, send notification to content owner
    if ((action_taken === 'content_removed' || action_taken === 'user_warned' || 
         action_taken === 'user_suspended' || action_taken === 'user_banned') && 
        report.reported_user?.email) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const contentOwnerEmail = getContentRemovedNotification(
          report.reported_user.username,
          report.item_type,
          report.reason
        );

        await transporter.sendMail({
          from: process.env.SENDER_EMAIL,
          to: report.reported_user.email,
          subject: contentOwnerEmail.subject,
          html: contentOwnerEmail.html
        });
      } catch (emailError) {
        console.error('Failed to send content removed email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });

  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update report' 
    });
  }
};

// Get all onboarding responses
export const getOnboardingResponses = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const responses = await OnboardingResponse.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user_id', 'username email');

    const count = await OnboardingResponse.countDocuments();

    res.json({
      success: true,
      data: responses,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });

  } catch (error) {
    console.error('Error fetching onboarding responses:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch onboarding responses' 
    });
  }
};

// Get all feedback
export const getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const feedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user_id', 'username email');

    const count = await Feedback.countDocuments();

    // Calculate average ratings
    const avgRatings = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgOverall: { $avg: '$overall_rating' },
          avgNPS: { $avg: '$nps_score' }
        }
      }
    ]);

    res.json({
      success: true,
      data: feedback,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      averages: avgRatings[0] || { avgOverall: 0, avgNPS: 0 }
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch feedback' 
    });
  }
};

// Dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalPosts,
      pendingReports,
      totalFeedback,
      avgRating
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Feedback.countDocuments(),
      Feedback.aggregate([
        { $group: { _id: null, avg: { $avg: '$overall_rating' } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        total_users: totalUsers,
        total_posts: totalPosts,
        pending_reports: pendingReports,
        total_feedback: totalFeedback,
        average_rating: avgRating[0]?.avg || 0
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch stats' 
    });
  }
};

// Get all admins
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select('-otp')
      .populate('created_by', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: admins
    });

  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch admins' 
    });
  }
};

// Update admin (with super admin protection)
export const updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, role, permissions, is_active } = req.body;
    const requesterId = req.admin.id;

    // Get requester info
    const requester = await Admin.findById(requesterId);
    if (!requester) {
      return res.status(404).json({ 
        success: false, 
        message: 'Requester not found' 
      });
    }

    // Get target admin
    const targetAdmin = await Admin.findById(adminId);
    if (!targetAdmin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    // SUPER ADMIN PROTECTION: Prevent modification of info.ops.chirp@gmail.com
    const PROTECTED_SUPER_ADMIN_EMAIL = 'info.ops.chirp@gmail.com';
    if (targetAdmin.email === PROTECTED_SUPER_ADMIN_EMAIL) {
      // Only the super admin themselves can update their own info (except role and permissions)
      if (requesterId.toString() !== adminId.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Cannot modify the primary super admin account' 
        });
      }
      
      // Even the super admin cannot downgrade themselves
      if (role && role !== 'super_admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Cannot change the role of the primary super admin' 
        });
      }
      
      if (is_active === false) {
        return res.status(403).json({ 
          success: false, 
          message: 'Cannot deactivate the primary super admin account' 
        });
      }
    }

    // Only super_admin can modify roles and permissions
    if ((role || permissions) && requester.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super admins can modify roles and permissions' 
      });
    }

    // Update fields
    if (name) targetAdmin.name = name;
    if (role && requester.role === 'super_admin') targetAdmin.role = role;
    if (permissions && requester.role === 'super_admin') targetAdmin.permissions = { ...targetAdmin.permissions, ...permissions };
    if (typeof is_active === 'boolean' && requester.role === 'super_admin') targetAdmin.is_active = is_active;

    await targetAdmin.save();

    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: targetAdmin
    });

  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update admin' 
    });
  }
};

// Delete admin (with super admin protection)
export const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const requesterId = req.admin.id;

    // Get requester info
    const requester = await Admin.findById(requesterId);
    if (requester.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super admins can delete admins' 
      });
    }

    // Get target admin
    const targetAdmin = await Admin.findById(adminId);
    if (!targetAdmin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    // SUPER ADMIN PROTECTION: Prevent deletion of info.ops.chirp@gmail.com
    const PROTECTED_SUPER_ADMIN_EMAIL = 'info.ops.chirp@gmail.com';
    if (targetAdmin.email === PROTECTED_SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete the primary super admin account. This account is permanently protected.' 
      });
    }

    await Admin.findByIdAndDelete(adminId);

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete admin' 
    });
  }
};
