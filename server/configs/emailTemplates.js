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
    </div>
  </div>
</body>
</html>
`;

// Welcome Email Template
export const welcomeEmail = (userName) => {
  const content = `
    <div class="content">
      <h2>Welcome to ${APP_NAME}! 🎉</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>We're thrilled to have you join our community! ${APP_NAME} is your space to connect, share, and stay updated with friends and the world.</p>
      
      <div class="info-box">
        <strong>🚀 Get Started:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Complete your profile</li>
          <li>Find and connect with friends</li>
          <li>Share your first post or story</li>
          <li>Explore AI Studio for creative content</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}" class="button">Explore ${APP_NAME}</a>
      </div>
      
      <p>If you have any questions, our support team is always here to help!</p>
      <p>Happy chirping! 🐦</p>
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
      <p>Thanks for signing up! We need to verify your email address to activate your account.</p>
      
      <div class="info-box">
        <strong>⏱️ Important:</strong> This link will expire in 24 hours.
      </div>
      
      <div style="text-align: center;">
        <a href="${verificationLink}" class="button">Verify Email</a>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea; font-size: 14px;">${verificationLink}</p>
      
      <div class="divider"></div>
      <p style="font-size: 14px; color: #666;">
        If you didn't create this account, please ignore this email.
      </p>
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
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      
      <div class="info-box">
        <strong>⏱️ Security Notice:</strong> This link will expire in 1 hour.
      </div>
      
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea; font-size: 14px;">${resetLink}</p>
      
      <div class="divider"></div>
      <p style="font-size: 14px; color: #666;">
        <strong>Didn't request a password reset?</strong><br>
        You can safely ignore this email. Your password will remain unchanged.
      </p>
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
      <p>Your password has been successfully changed.</p>
      
      <div class="info-box">
        <strong>🔒 Security Tip:</strong> Use a unique, strong password and enable two-factor authentication for extra security.
      </div>
      
      <p>If you didn't make this change, please contact our support team immediately.</p>
      
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/support" class="button">Contact Support</a>
      </div>
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
