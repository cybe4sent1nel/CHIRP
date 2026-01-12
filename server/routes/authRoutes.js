import express from 'express';
import passport from '../configs/passport.js';
import jwt from 'jsonwebtoken';
import {
  signup,
  login,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  verifyToken
} from '../controllers/authController.js';

const authRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Local Auth Routes
authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.get('/verify-email', verifyEmail);
authRouter.post('/resend-verification', resendVerificationEmail);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
authRouter.get('/verify-token', verifyToken);

// Google OAuth Routes - Direct implementation for Vercel serverless
authRouter.get('/google', (req, res) => {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${process.env.FRONTEND_URL}/api/auth/google/callback`;
    
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }
    
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid profile email',
      access_type: 'offline'
    });
    
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${FRONTEND_URL}/auth?error=oauth_error&provider=google`);
  }
});

authRouter.get('/google/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      return res.redirect(`${FRONTEND_URL}/auth?error=${error}&provider=google`);
    }
    
    if (!code) {
      return res.redirect(`${FRONTEND_URL}/auth?error=no_auth_code&provider=google`);
    }
    
    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_CALLBACK_URL || `${process.env.FRONTEND_URL}/api/auth/google/callback`
      }).toString()
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return res.redirect(`${FRONTEND_URL}/auth?error=token_exchange_failed&provider=google`);
    }
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    
    const userData = await userResponse.json();
    
    if (!userResponse.ok) {
      console.error('User info fetch failed:', userData);
      return res.redirect(`${FRONTEND_URL}/auth?error=user_fetch_failed&provider=google`);
    }
    
    // Here you would normally find or create user in DB
    // For now, generate JWT and redirect
    const token = jwt.sign({ 
      email: userData.email,
      googleId: userData.id,
      name: userData.name,
      picture: userData.picture
    }, JWT_SECRET, { expiresIn: '30d' });
    
    res.redirect(`${FRONTEND_URL}/auth?token=${token}&provider=google&email=${encodeURIComponent(userData.email)}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${FRONTEND_URL}/auth?error=auth_failed&provider=google`);
  }
});

// Logout
authRouter.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

export default authRouter;
