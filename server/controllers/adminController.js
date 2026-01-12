import Admin from '../models/Admin.js';
import Report from '../models/Report.js';
import OnboardingResponse from '../models/OnboardingResponse.js';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { getReportActionEmailTemplate, getContentRemovedNotification } from '../utils/emailTemplates/reportActionEmail.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT Token
const generateToken = (adminId) => {
    return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: '30d' });
};

// Generate 6-digit OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, name) => {
    console.log('[ADMIN] sendOTPEmail - Starting email send process');
    console.log('[ADMIN] sendOTPEmail - Email config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? `${process.env.SMTP_USER.split('@')[0]}@***` : 'NOT SET',
        senderEmail: process.env.SENDER_EMAIL
    });

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    console.log('[ADMIN] sendOTPEmail - Transporter created');

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

    try {
        console.log('[ADMIN] sendOTPEmail - Attempting to send email to:', email);
        const info = await transporter.sendMail(mailOptions);
        console.log('[ADMIN] sendOTPEmail - Email sent successfully');
        console.log('[ADMIN] sendOTPEmail - Response ID:', info.response);
        return info;
    } catch (error) {
        console.error('[ADMIN] sendOTPEmail - Error details:', {
            message: error.message,
            code: error.code,
            command: error.command,
            responseCode: error.responseCode
        });
        throw error;
    }
};

// Get all admin emails for login dropdown
export const getAdminEmails = async (req, res) => {
    try {
        console.log('[ADMIN] Getting all admin emails for login...');
        const admins = await Admin.find(
            { is_active: true },
            'email'
        ).lean();

        const emails = admins.map(admin => admin.email);
        console.log('[ADMIN] Found admin emails:', emails);

        res.json({
            success: true,
            emails: emails
        });
    } catch (error) {
        console.error('[ADMIN] Error fetching admin emails:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin emails'
        });
    }
};

// Check if user is admin and send OTP
export const initiateAdminLogin = async (req, res) => {
    try {
        console.log('[ADMIN] ===== INITIATE LOGIN START =====');
        console.log('[ADMIN] Request source:', {
            method: req.method,
            path: req.path,
            headers: Object.keys(req.headers),
            ip: req.ip
        });
        console.log('[ADMIN] initiateAdminLogin body:', req.body);
        const { email } = req.body;

        if (!email) {
            console.log('[ADMIN] ❌ Email not provided - returning 400');
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const normalizedEmail = email.toLowerCase();
        console.log('[ADMIN] 🔍 Searching for admin with email:', normalizedEmail);

        // Check if email is in admin list
        let admin = await Admin.findOne({ email: normalizedEmail, is_active: true });

        console.log('[ADMIN] Database query result:', admin ? '✅ Found' : '❌ Not found');

        if (!admin) {
            console.log('[ADMIN] ❌ Admin not found for email:', normalizedEmail);
            try {
                const allAdmins = await Admin.find({}, 'email is_active').lean();
                console.log('[ADMIN] Available admins in DB:', allAdmins);
            } catch (dbError) {
                console.error('[ADMIN] Error fetching available admins:', dbError);
            }
            return res.status(403).json({
                success: false,
                message: 'Access Denied: This email is not authorized to access the admin dashboard'
            });
        }

        console.log('[ADMIN] ✅ Admin found:', admin._id);

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log('[ADMIN] 📝 Generated OTP:', otp, 'Expires at:', expiresAt);

        // Save OTP to admin record
        admin.otp = {
            code: otp,
            expires_at: expiresAt,
            attempts: 0
        };

        console.log('[ADMIN] 💾 Saving OTP to admin record...');
        await admin.save();
        console.log('[ADMIN] ✅ OTP saved successfully');

        console.log('[ADMIN] 📧 Attempting to send OTP email to:', email);

        // Send OTP email
        try {
            await sendOTPEmail(email, otp, admin.name);
            console.log('[ADMIN] ✅ OTP email sent successfully');
        } catch (emailError) {
            console.error('[ADMIN] ❌ Error sending OTP email:', emailError.message);
            console.error('[ADMIN] Full email error:', emailError);
            return res.status(500).json({
                success: false,
                message: `Failed to send verification code: ${emailError.message}`
            });
        }

        console.log('[ADMIN] ===== INITIATE LOGIN SUCCESS =====');
        res.json({
            success: true,
            message: 'Verification code sent to your email',
            email: email
        });

    } catch (error) {
        console.error('[ADMIN] ===== INITIATE LOGIN ERROR =====');
        console.error('[ADMIN] Error name:', error.name);
        console.error('[ADMIN] Error message:', error.message);
        console.error('[ADMIN] Full error:', error);
        res.status(500).json({
            success: false,
            message: `Error: ${error.message || 'Failed to send verification code'}`
        });
    }
};

// Verify OTP and login
export const verifyAdminOTP = async (req, res) => {
    try {
        console.log('[ADMIN] ===== VERIFY OTP START =====');
        console.log('[ADMIN] verifyAdminOTP body:', req.body);
        const { email, otp } = req.body;

        if (!email || !otp) {
            console.log('[ADMIN] ❌ Email or OTP missing');
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        console.log('[ADMIN] 🔍 Finding admin:', email.toLowerCase());
        const admin = await Admin.findOne({ email: email.toLowerCase(), is_active: true });

        if (!admin || !admin.otp) {
            console.log('[ADMIN] ❌ Admin or OTP not found');
            return res.status(400).json({
                success: false,
                message: 'Invalid request'
            });
        }

        console.log('[ADMIN] ✅ Admin found, checking OTP validity');

        // Check if OTP expired
        if (new Date() > admin.otp.expires_at) {
            console.log('[ADMIN] ❌ OTP expired:', admin.otp.expires_at);
            return res.status(400).json({
                success: false,
                message: 'Verification code expired. Please request a new one.'
            });
        }

        console.log('[ADMIN] ✅ OTP not expired');

        // Check attempts
        if (admin.otp.attempts >= 3) {
            console.log('[ADMIN] ❌ Too many attempts:', admin.otp.attempts);
            return res.status(429).json({
                success: false,
                message: 'Too many failed attempts. Please request a new code.'
            });
        }

        console.log('[ADMIN] 📝 Comparing OTP codes - Expected:', admin.otp.code, '| Provided:', otp);

        // Verify OTP
        if (admin.otp.code !== otp) {
            console.log('[ADMIN] ❌ OTP mismatch!');
            admin.otp.attempts += 1;
            await admin.save();

            return res.status(400).json({
                success: false,
                message: 'Invalid verification code',
                remaining_attempts: 3 - admin.otp.attempts
            });
        }

        console.log('[ADMIN] ✅ OTP verified successfully!');

        // OTP verified - clear OTP and update last login
        admin.otp = undefined;
        admin.last_login = new Date();
        console.log('[ADMIN] 💾 Saving admin record...');
        await admin.save();
        console.log('[ADMIN] ✅ Admin record saved');

        console.log('[ADMIN] ===== VERIFY OTP SUCCESS =====');
        console.log('[ADMIN] Admin login complete:', admin.email, 'Role:', admin.role);

        res.json({
            success: true,
            message: 'Login successful',
            token: generateToken(admin._id),
            admin: {
                _id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
                permissions: admin.permissions
            }
        });

    } catch (error) {
        console.error('[ADMIN] ===== VERIFY OTP ERROR =====');
        console.error('[ADMIN] Error name:', error.name);
        console.error('[ADMIN] Error message:', error.message);
        console.error('[ADMIN] Full error:', error);
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
        console.log('[ADMIN DASHBOARD] Starting getDashboardStats');

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

        console.log('[ADMIN DASHBOARD] Stats retrieved:', {
            totalUsers,
            totalPosts,
            pendingReports,
            totalFeedback,
            avgRating: avgRating[0]?.avg || 0
        });

        res.json({
            success: true,
            stats: {
                total_users: totalUsers || 0,
                total_posts: totalPosts || 0,
                pending_reports: pendingReports || 0,
                total_feedback: totalFeedback || 0,
                average_rating: avgRating[0]?.avg || 0
            }
        });

    } catch (error) {
        console.error('[ADMIN DASHBOARD] Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: error.message
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

// Get user statistics
export const getUserStats = async (req, res) => {
    try {
        console.log('[ADMIN] Getting user stats');

        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ lastActive: { $gt: Date.now() - 24 * 60 * 60 * 1000 } });
        const bannedUsers = await User.countDocuments({ is_banned: true });
        const verifiedUsers = await User.countDocuments({ emailVerified: true });

        console.log('[ADMIN] User stats:', { totalUsers, activeUsers, bannedUsers, verifiedUsers });

        res.json({
            success: true,
            stats: {
                totalUsers: totalUsers || 0,
                activeUsers: activeUsers || 0,
                bannedUsers: bannedUsers || 0,
                verifiedUsers: verifiedUsers || 0,
            }
        });
    } catch (error) {
        console.error('[ADMIN] Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user statistics',
            error: error.message
        });
    }
};

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        console.log('[ADMIN] Getting all users');

        const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
        const skip = (page - 1) * limit;

        const sortObj = {};
        sortObj[sortBy] = order === 'desc' ? -1 : 1;

        const users = await User.find()
            .select('-password -otp -emailVerificationToken')
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const totalUsers = await User.countDocuments();

        console.log('[ADMIN] Retrieved', users.length, 'users out of', totalUsers, 'total');

        res.json({
            success: true,
            users: users || [],
            pagination: {
                total: totalUsers,
                pages: Math.ceil(totalUsers / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('[ADMIN] Error fetching all users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

// Ban a user
export const banUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { is_banned: true, banned_at: new Date() },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User banned successfully',
            user
        });
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to ban user'
        });
    }
};

// Unban a user
export const unbanUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { is_banned: false, banned_at: null },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User unbanned successfully',
            user
        });
    } catch (error) {
        console.error('Error unbanning user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unban user'
        });
    }
};

// Delete a user
export const deleteUserByAdmin = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user first
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete user's posts and comments
        await Post.deleteMany({ user: userId });

        // Delete user
        await User.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
};

// Get app metrics
export const getMetrics = async (req, res) => {
    try {
        console.log('[ADMIN METRICS] Starting getMetrics');
        const { timeframe = '7d' } = req.query;

        const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const totalUsers = await User.countDocuments();
        const totalPosts = await Post.countDocuments();
        const totalLikes = await Post.aggregate([
            { $group: { _id: null, total: { $sum: '$likes_count' } } }
        ]);
        const totalComments = await Post.aggregate([
            { $group: { _id: null, total: { $sum: '$comments_count' } } }
        ]);
        const activeUsers = await User.countDocuments({ lastActive: { $gt: startDate } });

        console.log('[ADMIN METRICS] Metrics retrieved:', {
            totalUsers,
            totalPosts,
            totalLikes: totalLikes[0]?.total || 0,
            totalComments: totalComments[0]?.total || 0,
            activeUsers,
            timeframe
        });

        res.json({
            success: true,
            metrics: {
                totalUsers: totalUsers || 0,
                totalPosts: totalPosts || 0,
                totalLikes: totalLikes[0]?.total || 0,
                totalComments: totalComments[0]?.total || 0,
                totalViews: (totalPosts || 0) * 10, // Placeholder
                activeUsers: activeUsers || 0,
                userGrowthChart: [],
                postActivityChart: [],
                engagementData: [
                    { name: 'Likes', value: totalLikes[0]?.total || 0 },
                    { name: 'Comments', value: totalComments[0]?.total || 0 },
                ],
                trendingHashtags: []
            }
        });
    } catch (error) {
        console.error('[ADMIN METRICS] Error fetching metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch metrics',
            error: error.message
        });
    }
};

// Get maintenance status
export const getMaintenanceStatus = async (req, res) => {
    try {
        // For now, return a default maintenance status
        // In production, this would be stored in the database
        res.json({
            success: true,
            maintenance: {
                enabled: false,
                title: "We'll be back soon!",
                message: "We're currently performing maintenance. Please check back later.",
                estimatedTime: "2 hours",
                contactEmail: "support@chirp.com",
                routes: []
            }
        });
    } catch (error) {
        console.error('Error fetching maintenance status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch maintenance status'
        });
    }
};

// Toggle maintenance mode
export const toggleMaintenance = async (req, res) => {
    try {
        const { enabled } = req.body;

        // Store in database or Redis in production
        res.json({
            success: true,
            message: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
            enabled
        });
    } catch (error) {
        console.error('Error toggling maintenance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle maintenance mode'
        });
    }
};

// Update maintenance settings
export const updateMaintenanceSettings = async (req, res) => {
    try {
        const { title, message, estimatedTime, contactEmail, routes } = req.body;

        // Store in database or Redis in production
        res.json({
            success: true,
            message: 'Maintenance settings updated',
            maintenance: {
                title,
                message,
                estimatedTime,
                contactEmail,
                routes
            }
        });
    } catch (error) {
        console.error('Error updating maintenance settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update maintenance settings'
        });
    }
};

// Get all ads
export const getAllAds = async (req, res) => {
    try {
        // Placeholder for ads collection
        res.json({
            success: true,
            ads: []
        });
    } catch (error) {
        console.error('Error fetching ads:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ads'
        });
    }
};

// Create ad
export const createAd = async (req, res) => {
    try {
        const { title, description, image, link, isActive, startDate, endDate, startTime, endTime } = req.body;

        // Placeholder for creating ad
        res.json({
            success: true,
            message: 'Ad created successfully',
            ad: {
                _id: 'new_ad_id',
                title,
                description,
                image,
                link,
                isActive,
                startDate,
                endDate,
                startTime,
                endTime
            }
        });
    } catch (error) {
        console.error('Error creating ad:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create ad'
        });
    }
};

// Update ad
export const updateAd = async (req, res) => {
    try {
        const { adId } = req.params;
        const { title, description, image, link, isActive, startDate, endDate, startTime, endTime } = req.body;

        res.json({
            success: true,
            message: 'Ad updated successfully'
        });
    } catch (error) {
        console.error('Error updating ad:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update ad'
        });
    }
};

// Delete ad
export const deleteAd = async (req, res) => {
    try {
        const { adId } = req.params;

        res.json({
            success: true,
            message: 'Ad deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting ad:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete ad'
        });
    }
};

// Get all animations
export const getAnimations = async (req, res) => {
    try {
        // Placeholder for animations collection
        res.json({
            success: true,
            animations: {
                maintenance: null,
                error403: null,
                error404: null,
                error500: null,
                error408: null,
            }
        });
    } catch (error) {
        console.error('Error fetching animations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch animations'
        });
    }
};

// Upload animation
export const uploadAnimation = async (req, res) => {
    try {
        const { type } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        if (!['maintenance', 'error403', 'error404', 'error500', 'error408'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid animation type'
            });
        }

        // Validate file type
        const validTypes = ['application/json', 'video/mp4', 'application/octet-stream'];
        if (!validTypes.includes(file.mimetype) && !file.originalname.endsWith('.lottie')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Please upload Lottie JSON, .lottie, or MP4'
            });
        }

        // Placeholder: In production, save file to storage service (S3, ImageKit, etc)
        const animationData = {
            type,
            filename: file.originalname,
            url: `/animations/${type}/${file.originalname}`,
            uploadedAt: new Date(),
            fileType: file.mimetype,
        };

        res.json({
            success: true,
            message: 'Animation uploaded successfully',
            animation: animationData
        });
    } catch (error) {
        console.error('Error uploading animation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload animation'
        });
    }
};

// Delete animation
export const deleteAnimation = async (req, res) => {
    try {
        const { type } = req.params;

        if (!['maintenance', 'error403', 'error404', 'error500', 'error408'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid animation type'
            });
        }

        // Placeholder: Delete file from storage
        res.json({
            success: true,
            message: 'Animation deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting animation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete animation'
        });
    }
};
