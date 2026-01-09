const LOGO_URL = 'https://financial-tan-fdddl6egnj.edgeone.app/LOGOO.png';
const APP_NAME = 'Chirp';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Base template with glassmorphism style
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
      border-radius: 50%;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }
    .header h1 {
      color: white;
      font-size: 32px;
      font-weight: 700;
      margin: 0;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    .content {
      padding: 40px 30px;
      color: #333;
      line-height: 1.8;
    }
    .content h2 {
      color: #667eea;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .content p {
      font-size: 16px;
      margin-bottom: 16px;
      color: #555;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
      transition: transform 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(102, 126, 234, 0.5);
    }
    .info-box {
      background: rgba(102, 126, 234, 0.1);
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      font-size: 14px;
      color: #666;
      margin: 8px 0;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #ddd, transparent);
      margin: 30px 0;
    }
    .unsubscribe {
      margin-top: 20px;
      font-size: 12px;
      color: #999;
    }
    .unsubscribe a {
      color: #667eea;
      text-decoration: underline;
    }
    .highlight-box {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      border: 2px solid rgba(102, 126, 234, 0.2);
    }
    .feature-list {
      text-align: left;
      margin: 20px 0;
    }
    .feature-list li {
      padding: 8px 0;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="${LOGO_URL}" alt="${APP_NAME} Logo" class="logo">
      <h1>${APP_NAME}</h1>
    </div>
    ${content}
    <div class="footer">
      <p><strong>Stay Connected!</strong></p>
      <div class="social-links">
        <a href="${FRONTEND_URL}">Visit Website</a> •
        <a href="${FRONTEND_URL}/about">About Us</a> •
        <a href="${FRONTEND_URL}/support">Support</a>
      </div>
      <div class="divider"></div>
      <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      <p style="font-size: 12px; color: #999;">
        You're receiving this email because you have an account with ${APP_NAME}.
      </p>
      <div class="unsubscribe">
        <p>Don't want to receive these emails? <a href="${FRONTEND_URL}/unsubscribe">Unsubscribe</a></p>
        <p style="margin-top: 8px;">${APP_NAME} • Making the world more connected, one chirp at a time 🐦</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Welcome Email Template
export const welcomeEmail = (userName) => {
  const content = `
    <div class="content">
      <h2>Welcome to ${APP_NAME}, ${userName}! 🎉</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>We're absolutely thrilled to have you join our vibrant community! You've just become part of something special – a platform where connections flourish, creativity thrives, and every voice matters.</p>
      
      <div class="highlight-box">
        <h3 style="color: #667eea; margin-top: 0;">✨ What Makes Chirp Special?</h3>
        <div class="feature-list">
          <p><strong>🎨 AI-Powered Creativity</strong><br>
          Transform your ideas into stunning visuals with our AI Studio. Create unique art, edit photos, and bring your imagination to life!</p>
          
          <p><strong>🌍 Global Connections</strong><br>
          Connect with like-minded individuals from around the world. Share your thoughts, stories, and moments that matter.</p>
          
          <p><strong>💬 Real-Time Conversations</strong><br>
          Experience seamless messaging, video calls, and engaging discussions with friends and communities.</p>
          
          <p><strong>🎯 Personalized Feed</strong><br>
          Your feed adapts to your interests, ensuring you never miss content that resonates with you.</p>
        </div>
      </div>
      
      <div class="info-box">
        <strong>🚀 Quick Start Guide:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>Step 1:</strong> Complete your profile with a photo and bio</li>
          <li><strong>Step 2:</strong> Find and connect with friends</li>
          <li><strong>Step 3:</strong> Share your first post or story</li>
          <li><strong>Step 4:</strong> Explore AI Studio to create amazing content</li>
          <li><strong>Step 5:</strong> Join communities that match your interests</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${FRONTEND_URL}" class="button">Start Your Journey</a>
      </div>
      
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #856404;"><strong>💡 Pro Tip:</strong> Enable notifications to stay updated with messages, comments, and new connections. You can customize these in your settings anytime!</p>
      </div>
      
      <p>Our support team is always here to help you make the most of Chirp. Have questions? Just reply to this email or visit our <a href="${FRONTEND_URL}/support" style="color: #667eea;">Help Center</a>.</p>
      
      <p style="font-size: 18px; margin-top: 30px;">Welcome aboard, <strong>${userName}</strong>! Let's make amazing things happen together! 🚀</p>
      
      <p style="margin-top: 20px; color: #666;">Warm regards,<br>
      <strong>The Chirp Team</strong> 💜</p>
    </div>
  `;
  return baseTemplate(content);
};

// Email Verification Template
export const verificationEmail = (userName, verificationLink) => {
  const content = `
    <div class="content">
      <h2>Verify Your Email Address 📧</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Welcome to Chirp! We're excited to have you here. To ensure the security of your account and unlock all features, please verify your email address by clicking the button below.</p>
      
      <div class="highlight-box">
        <h3 style="color: #667eea; margin-top: 0;">🔒 Why Verify?</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Protect your account from unauthorized access</li>
          <li>Unlock all Chirp features and capabilities</li>
          <li>Receive important account notifications</li>
          <li>Connect with the global Chirp community</li>
        </ul>
      </div>
      
      <div class="info-box">
        <strong>⏱️ Important Security Notice:</strong> This verification link will expire in 24 hours for your protection. If the link expires, you can request a new one from the login page.
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" class="button">Verify My Email</a>
      </div>
      
      <p style="font-size: 14px; color: #666; text-align: center; margin: 20px 0;">Or copy and paste this link into your browser:</p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="word-break: break-all; color: #667eea; font-size: 13px; margin: 0; font-family: monospace;">${verificationLink}</p>
      </div>
      
      <div class="divider"></div>
      
      <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #721c24;">
          <strong>⚠️ Didn't create a Chirp account?</strong><br>
          If you didn't request this verification email, you can safely ignore and delete it. No account will be created, and no further action is required from you. Your email address will be removed from our system within 24 hours.
        </p>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Having trouble? Contact our support team at <a href="mailto:support@chirp.com" style="color: #667eea;">support@chirp.com</a> or visit our <a href="${FRONTEND_URL}/help" style="color: #667eea;">Help Center</a>.
      </p>
      
      <p style="margin-top: 20px; color: #666;">Best regards,<br>
      <strong>The Chirp Team</strong></p>
    </div>
  `;
  return baseTemplate(content);
};

// Password Reset Template
export const passwordResetEmail = (userName, resetLink) => {
  const content = `
    <div class="content">
      <h2>Reset Your Password 🔐</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>We received a request to reset your password for your Chirp account. Don't worry – we're here to help you regain access securely!</p>
      
      <div class="highlight-box">
        <h3 style="color: #667eea; margin-top: 0;">🔒 Security First</h3>
        <p style="margin: 10px 0;">Click the button below to create a new password. This link is unique to your account and can only be used once.</p>
      </div>
      
      <div class="info-box">
        <strong>⏱️ Important Security Notice:</strong> This password reset link will expire in <strong>1 hour</strong> for your protection. If you don't use it within this time, you'll need to request a new one.
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" class="button">Reset My Password</a>
      </div>
      
      <p style="font-size: 14px; color: #666; text-align: center; margin: 20px 0;">Or copy and paste this link into your browser:</p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="word-break: break-all; color: #667eea; font-size: 13px; margin: 0; font-family: monospace;">${resetLink}</p>
      </div>
      
      <div class="divider"></div>
      
      <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #721c24;">
          <strong>⚠️ Didn't request a password reset?</strong><br>
          If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged, and no further action is required. Someone may have entered your email address by mistake.
        </p>
      </div>
      
      <div style="background: #d1ecf1; border-left: 4px solid #0c5460; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #0c5460;">
          <strong>💡 Security Tips:</strong><br>
          • Use a strong, unique password<br>
          • Don't share your password with anyone<br>
          • Enable two-factor authentication for extra security<br>
          • Never click on suspicious password reset emails
        </p>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        If you're having trouble resetting your password, contact our support team at <a href="mailto:support@chirp.com" style="color: #667eea;">support@chirp.com</a>
      </p>
      
      <p style="margin-top: 20px; color: #666;">Stay secure,<br>
      <strong>The Chirp Security Team</strong> 🔒</p>
    </div>
  `;
  return baseTemplate(content);
};

// Password Changed Confirmation
export const passwordChangedEmail = (userName) => {
  const content = `
    <div class="content">
      <h2>Password Changed Successfully ✅</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>This is a confirmation that your Chirp account password has been successfully changed. Your account is now secured with your new password.</p>
      
      <div class="highlight-box">
        <h3 style="color: #667eea; margin-top: 0;">✔️ What This Means</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Your old password is no longer valid</li>
          <li>You'll need to use your new password for future logins</li>
          <li>All active sessions remain logged in</li>
          <li>Your account security has been updated</li>
        </ul>
      </div>
      
      <div style="background: #d1ecf1; border-left: 4px solid #0c5460; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #0c5460;">
          <strong>🔒 Security Tips to Keep Your Account Safe:</strong><br>
          • Never share your password with anyone<br>
          • Use a unique password for each online account<br>
          • Enable two-factor authentication for extra protection<br>
          • Update your password regularly (every 3-6 months)<br>
          • Be cautious of phishing emails asking for your password
        </p>
      </div>
      
      <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #721c24;">
          <strong>⚠️ Didn't change your password?</strong><br>
          If you didn't make this change, your account may be compromised. Please contact our support team immediately and reset your password again.
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${FRONTEND_URL}/settings/security" class="button">View Security Settings</a>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Need help or have security concerns? Contact us immediately at <a href="mailto:security@chirp.com" style="color: #667eea;">security@chirp.com</a>
      </p>
      
      <p style="margin-top: 20px; color: #666;">Stay safe,<br>
      <strong>The Chirp Security Team</strong> 🔒</p>
    </div>
  `;
  return baseTemplate(content);
};

// Login Alert Template
export const loginAlertEmail = (userName, location, device) => {
  const content = `
    <div class="content">
      <h2>New Login Detected 🔔</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>We detected a new login to your account:</p>
      
      <div class="info-box">
        <strong>📍 Location:</strong> ${location || 'Unknown'}<br>
        <strong>💻 Device:</strong> ${device || 'Unknown'}<br>
        <strong>🕐 Time:</strong> ${new Date().toLocaleString()}
      </div>
      
      <p>If this was you, you can safely ignore this email.</p>
      <p>If you don't recognize this login, please secure your account immediately:</p>
      
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/reset-password" class="button">Change Password</a>
      </div>
    </div>
  `;
  return baseTemplate(content);
};

// Connection Request Template
export const connectionRequestEmail = (userName, requesterName, requesterUsername) => {
  const content = `
    <div class="content">
      <h2>New Connection Request 👋</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p><strong>${requesterName}</strong> (@${requesterUsername}) wants to connect with you on ${APP_NAME}!</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${FRONTEND_URL}/connections" class="button">View Request</a>
      </div>
      
      <p>Accept the request to start messaging and sharing updates with each other.</p>
    </div>
  `;
  return baseTemplate(content);
};

// New Message Notification
export const newMessageEmail = (userName, senderName, messagePreview) => {
  const content = `
    <div class="content">
      <h2>New Message 💬</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>You have a new message from <strong>${senderName}</strong>:</p>
      
      <div class="info-box">
        "${messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview}"
      </div>
      
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/messages" class="button">View Message</a>
      </div>
    </div>
  `;
  return baseTemplate(content);
};

// Account Deletion Confirmation
export const accountDeletionEmail = (userName) => {
  const content = `
    <div class="content">
      <h2>Account Deletion Confirmed 👋</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>We're sorry to see you go. Your account has been successfully deleted.</p>
      
      <div class="info-box">
        <strong>📝 What happens next:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>All your posts and stories have been removed</li>
          <li>Your messages have been deleted</li>
          <li>Your profile is no longer accessible</li>
        </ul>
      </div>
      
      <p>We'd love to hear your feedback about your experience with ${APP_NAME}.</p>
      <p>If you ever want to come back, we'll be here! 💜</p>
    </div>
  `;
  return baseTemplate(content);
};

export default {
  welcomeEmail,
  verificationEmail,
  passwordResetEmail,
  passwordChangedEmail,
  loginAlertEmail,
  connectionRequestEmail,
  newMessageEmail,
  accountDeletionEmail
};
