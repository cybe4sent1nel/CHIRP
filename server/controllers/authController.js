import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { inngest } from '../inngest/index.js';
import sendEmail from '../configs/nodeMailer.js';
import {
  welcomeEmail,
  verificationEmail,
  passwordResetEmail,
  passwordChangedEmail,
  loginAlertEmail
} from '../configs/emailTemplates.js';
import { getLoginInfo } from '../utils/deviceDetection.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

// Send Email with Inngest + Fallback
const sendEmailWithFallback = async (emailData) => {
  try {
    // Try Inngest first
    await inngest.send({
      name: 'app/send-email',
      data: emailData
    });
    console.log('Email queued via Inngest:', emailData.to);
  } catch (inngestError) {
    console.error('Inngest failed, using direct email:', inngestError.message);
    // Fallback to direct email
    try {
      await sendEmail(emailData);
      console.log('Email sent directly:', emailData.to);
    } catch (emailError) {
      console.error('Direct email also failed:', emailError.message);
      throw new Error('Failed to send email');
    }
  }
};

// Signup with Email/Password
export const signup = async (req, res) => {
  try {
    console.log('[AUTH] Signup request body:', req.body);
    const { email, password, full_name, username } = req.body;

    // Validation
    if (!email || !password || !full_name) {
      console.warn('[AUTH] Signup validation failed: missing fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    // Check if email exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'This email is already registered. Please try logging in or use a different email.',
        field: 'email'
      });
    }

    // Check username availability if provided
    let finalUsername = username || email.split('@')[0];
    if (username) {
      const usernameExists = await User.findOne({ username: finalUsername });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'This username is already taken. Please choose a different username.',
          field: 'username'
        });
      }
    } else {
      // Auto-generate unique username from email
      const usernameExists = await User.findOne({ username: finalUsername });
      if (usernameExists) {
        finalUsername = finalUsername + Math.floor(Math.random() * 10000);
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user with unique dicebear avatar based on email
    // Let MongoDB generate the _id automatically (24-char hex string for SSE compatibility)
    const user = await User.create({
      email,
      password: hashedPassword,
      full_name,
      username: finalUsername,
      authProvider: 'local',
      emailVerified: false,
      verificationToken,
      profile_picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}&scale=80`
    });

    // Log user creation for debugging
    console.log('User created with ID:', user._id);
    console.log('Verification token saved:', user.verificationToken);
    console.log('Token length:', user.verificationToken?.length);

    // Generate JWT
    const token = generateToken(user._id);

    // Send verification email (non-blocking to prevent timeout)
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
    console.log('Queueing verification email to:', email);
    console.log('Verification token:', verificationToken);
    console.log('Verification link:', verificationLink);
    
    // Queue both emails without blocking response
    sendEmailWithFallback({
      to: email,
      subject: '✨ Verify Your Email - Welcome to Chirp!',
      body: verificationEmail(full_name, verificationLink)
    }).catch(err => console.error('Failed to send verification email:', err));

    sendEmailWithFallback({
      to: email,
      subject: '🎉 Welcome to Chirp!',
      body: welcomeEmail(full_name)
    }).catch(err => console.error('Failed to send welcome email:', err));

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email to verify your account.',
      token,
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        profile_picture: user.profile_picture,
        emailVerified: user.emailVerified,
        isAdmin: user.isAdmin,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error during signup' 
    });
  }
};

// Login with Email/Username and Password
export const login = async (req, res) => {
  try {
    console.log('[AUTH] Login request body:', req.body);
    const { identifier, password } = req.body; // identifier can be email or username

    if (!identifier || !password) {
      console.warn('[AUTH] Login validation failed: missing fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email/username and password' 
      });
    }

    // Find user by email or username
    console.log('[AUTH] Finding user by identifier:', identifier);
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
      authProvider: 'local'
    });

    if (!user) {
      console.log('[AUTH] User not found');
      return res.status(401).json({ 
        success: false, 
        message: 'No account found with this email/username. Please sign up to create a new account.',
        shouldSignup: true
      });
    }

    console.log('[AUTH] User found:', user.email);

    // Check password
    if (!user.password) {
      console.warn('[AUTH] Login attempted for local auth but no local password exists');
      return res.status(401).json({
        success: false,
        message: 'This account does not have a local password — please sign in with your social provider or use the correct login method.'
      });
    }

    let isPasswordValid = false;
    try {
      console.log('[AUTH] Comparing passwords...');
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('[AUTH] Password valid:', isPasswordValid);
    } catch (err) {
      console.error('[AUTH] Error comparing password:', err);
      return res.status(500).json({ success: false, message: 'Server error while validating credentials' });
    }

    if (!isPasswordValid) {
      console.log('[AUTH] Password invalid');
      return res.status(401).json({ 
        success: false, 
        message: 'Incorrect password. Please try again or use "Forgot Password" to reset it.',
        field: 'password'
      });
    }

    // Generate JWT
    console.log('[AUTH] Generating token...');
    const token = generateToken(user._id);

    // Get login information (location & device)
    const loginInfo = getLoginInfo(req);

    // Check if location or device has changed
    const locationChanged = user.lastLoginLocation && user.lastLoginLocation !== loginInfo.location;
    const deviceChanged = user.lastLoginDevice && user.lastLoginDevice !== loginInfo.device;

    // Send login alert email only if location or device changed (non-blocking)
    if (locationChanged || deviceChanged) {
      console.log('[AUTH] Sending login alert email...');
      sendEmailWithFallback({
        to: user.email,
        subject: '🔔 New Login Detected',
        body: loginAlertEmail(user.full_name, loginInfo.location, loginInfo.device)
      }).catch(emailError => {
        console.error('Failed to send login alert:', emailError);
      });
      // Don't await, let it send in background
    }

    // Update last login information (non-blocking to prevent timeout)
    console.log('[AUTH] Queueing login info update...');
    user.lastLoginLocation = loginInfo.location;
    user.lastLoginDevice = loginInfo.device;
    user.lastLoginIP = loginInfo.ip;
    user.lastLoginAt = new Date();
    
    // Save in background without blocking response
    user.save().catch(err => console.error('[AUTH] Failed to update login info:', err));

    console.log('[AUTH] Sending login response...');
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        profile_picture: user.profile_picture,
        emailVerified: user.emailVerified,
        isAdmin: user.isAdmin,
        role: user.role
      }
    });
    console.log('[AUTH] Login response sent successfully');
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
};

// Verify Email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    console.log('Verification attempt with token:', token ? 'Token received' : 'No token');

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification token is required' 
      });
    }

    // Find user with this verification token
    const user = await User.findOne({ verificationToken: token });
    
    console.log('User found:', user ? `Yes (${user.email})` : 'No');
    
    if (!user) {
      // Check if user already verified
      const verifiedUser = await User.findOne({ email: { $exists: true }, emailVerified: true });
      if (verifiedUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'This verification link has already been used or has expired. Please try logging in.' 
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification token. Please request a new verification email.' 
      });
    }

    // Update user
    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    console.log('Email verified successfully for:', user.email);

    // Generate JWT token for auto-login
    const authToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully! You can now use all features.',
      token: authToken,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        profile_picture: user.profile_picture,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during verification' 
    });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const user = await User.findOne({ email, authProvider: 'local' });
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmailWithFallback({
      to: email,
      subject: '🔐 Reset Your Password - Chirp',
      body: passwordResetEmail(user.full_name, resetLink)
    });

    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and new password are required' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long' 
      });
    }

    // Hash token to compare
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    await sendEmailWithFallback({
      to: user.email,
      subject: '✅ Password Changed Successfully - Chirp',
      body: passwordChangedEmail(user.full_name)
    });

    res.json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Resend verification email
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'No account found with this email address' 
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'This email is already verified. You can log in now.' 
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    // Send verification email
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
    console.log('Resending verification email to:', email);
    
    try {
      await sendEmailWithFallback({
        to: email,
        subject: '✨ Verify Your Email - Welcome to Chirp!',
        html: verificationEmail(user.full_name, verificationLink)
      });

      console.log('[AUTH] Verification email resent to:', email);

      res.json({
        success: true,
        message: 'Verification email sent successfully!'
      });
    } catch (emailError) {
      console.error('[AUTH] Email sending failed:', emailError);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification email. Please try again.' 
      });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Verify JWT Token
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        profile_picture: user.profile_picture,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

export default {
  signup,
  login,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  verifyToken
};
