import express from 'express';
import passport from '../configs/passport.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
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
    // CRITICAL: Use backend URL for callback, not frontend URL
    // Frontend (Vercel) times out at 60s, backend (Render) stays alive
    const BACKEND_URL = process.env.BACKEND_URL || process.env.VITE_BASEURL || 'http://localhost:4000';
    const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${BACKEND_URL}/api/auth/google/callback`;
    
    console.log('[GOOGLE-AUTH] Starting OAuth flow');
    console.log('[GOOGLE-AUTH] Callback URL:', GOOGLE_CALLBACK_URL);
    
    if (!GOOGLE_CLIENT_ID) {
      console.error('[GOOGLE-AUTH] Missing GOOGLE_CLIENT_ID');
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }
    
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid profile email',
      access_type: 'offline'
    });
    
    console.log('[GOOGLE-AUTH] Redirecting to Google...');
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (error) {
    console.error('[GOOGLE-AUTH] OAuth error:', error);
    res.redirect(`${FRONTEND_URL}/auth?error=oauth_error&provider=google`);
  }
});

authRouter.get('/google/callback', async (req, res) => {
  const startTime = Date.now();
  console.log('[GOOGLE-CALLBACK] Request received at', new Date().toISOString());
  console.log('[GOOGLE-CALLBACK] Query params:', { code: req.query.code?.substring(0, 20) + '...', error: req.query.error });
  
  try {
    const { code, error } = req.query;
    
    if (error) {
      console.error('[GOOGLE-CALLBACK] OAuth error from Google:', error);
      return res.redirect(`${FRONTEND_URL}/auth?error=${error}&provider=google`);
    }
    
    if (!code) {
      console.error('[GOOGLE-CALLBACK] No authorization code received');
      return res.redirect(`${FRONTEND_URL}/auth?error=no_auth_code&provider=google`);
    }
    
    const BACKEND_URL = process.env.BACKEND_URL || process.env.VITE_BASEURL || 'http://localhost:4000';
    const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${BACKEND_URL}/api/auth/google/callback`;
    
    console.log('[GOOGLE-CALLBACK] Exchanging code for token...');
    console.log('[GOOGLE-CALLBACK] Using callback URL:', GOOGLE_CALLBACK_URL);
    
    // Exchange code for token with timeout
    const tokenResponse = await Promise.race([
      fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: GOOGLE_CALLBACK_URL
        }).toString()
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Token exchange timeout')), 50000))
    ]);
    
    console.log('[GOOGLE-CALLBACK] Token response status:', tokenResponse.status);
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('[GOOGLE-CALLBACK] Token exchange failed:', tokenData);
      return res.redirect(`${FRONTEND_URL}/auth?error=token_exchange_failed&provider=google`);
    }
    
    console.log('[GOOGLE-CALLBACK] Token received, fetching user info...');
    
    // Get user info with timeout
    const userResponse = await Promise.race([
      fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('User info fetch timeout')), 50000))
    ]);
    
    console.log('[GOOGLE-CALLBACK] User response status:', userResponse.status);
    const userData = await userResponse.json();
    
    if (!userResponse.ok) {
      console.error('[GOOGLE-CALLBACK] User info fetch failed:', userData);
      return res.redirect(`${FRONTEND_URL}/auth?error=user_fetch_failed&provider=google`);
    }
    
    console.log('[GOOGLE-CALLBACK] User info received:', userData.email);
    
    // Find or create user in database
    let user = await User.findOne({ email: userData.email });
    
    if (user) {
      console.log('[GOOGLE-CALLBACK] Existing user found:', user._id);
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = userData.id;
        user.authProvider = 'google';
        await user.save();
      }
    } else {
      console.log('[GOOGLE-CALLBACK] Creating new user...');
      // Create new user
      const username = userData.email.split('@')[0];
      user = await User.create({
        email: userData.email,
        googleId: userData.id,
        full_name: userData.name,
        username,
        profile_picture: userData.picture,
        authProvider: 'google',
        emailVerified: true
      });
      console.log('[GOOGLE-CALLBACK] New user created:', user._id);
    }
    
    // Generate JWT
    const token = jwt.sign({ 
      userId: user._id,
      email: user.email
    }, JWT_SECRET, { expiresIn: '30d' });
    
    const duration = Date.now() - startTime;
    console.log(`[GOOGLE-CALLBACK] Success! Duration: ${duration}ms`);
    console.log('[GOOGLE-CALLBACK] Redirecting to frontend...');
    
    res.redirect(`${FRONTEND_URL}/auth?token=${token}&provider=google&email=${encodeURIComponent(userData.email)}`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[GOOGLE-CALLBACK] Error after ${duration}ms:`, error);
    console.error('[GOOGLE-CALLBACK] Error stack:', error.stack);
    res.redirect(`${FRONTEND_URL}/auth?error=auth_failed&provider=google&message=${encodeURIComponent(error.message)}`);
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
