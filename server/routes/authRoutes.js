import express from 'express';
import passport from '../configs/passport.js';
import jwt from 'jsonwebtoken';
import {
  signup,
  login,
  verifyEmail,
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
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
authRouter.get('/verify-token', verifyToken);

// Google OAuth Routes
authRouter.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

authRouter.get('/google/callback',
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: `${FRONTEND_URL}/login?error=auth_failed` 
  }),
  (req, res) => {
    try {
      // Generate JWT
      const token = jwt.sign({ userId: req.user._id }, JWT_SECRET, { expiresIn: '30d' });
      
      // Redirect to frontend with token
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&provider=google`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

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
