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
    const { email, password, full_name, username } = req.body;

    // Validation
    if (!email || !password || !full_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Check username availability
    let finalUsername = username || email.split('@')[0];
    const usernameExists = await User.findOne({ username: finalUsername });
    if (usernameExists) {
      finalUsername = finalUsername + Math.floor(Math.random() * 10000);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user ID
    const userId = 'user_' + crypto.randomBytes(16).toString('hex');

    // Create user
    const user = await User.create({
      _id: userId,
      email,
      password: hashedPassword,
      full_name,
      username: finalUsername,
      authProvider: 'local',
      emailVerified: false,
      verificationToken,
      profile_picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name)}&background=667eea&color=fff&size=200`
    });

    // Generate JWT
    const token = generateToken(user._id);

    // Send verification email
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendEmailWithFallback({
      to: email,
      subject: '✨ Verify Your Email - Welcome to Chirp!',
      body: verificationEmail(full_name, verificationLink)
    });

    // Send welcome email
    await sendEmailWithFallback({
      to: email,
      subject: '🎉 Welcome to Chirp!',
      body: welcomeEmail(full_name)
    });

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email to verify your account.',
      token,
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
    const { identifier, password } = req.body; // identifier can be email or username

    if (!identifier || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email/username and password' 
      });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
      authProvider: 'local'
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT
    const token = generateToken(user._id);

    // Send login alert email (optional)
    try {
      await sendEmailWithFallback({
        to: user.email,
        subject: '🔔 New Login Detected',
        body: loginAlertEmail(user.full_name, 'Unknown', 'Unknown')
      });
    } catch (emailError) {
      console.error('Failed to send login alert:', emailError);
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
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
    console.error('Login error:', error);
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

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification token is required' 
      });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification token' 
      });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully! You can now use all features.'
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
  forgotPassword,
  resetPassword,
  verifyToken
};
