import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Local Strategy (Email/Password)
passport.use(new LocalStrategy(
  {
    usernameField: 'identifier', // Can be email or username
    passwordField: 'password'
  },
  async (identifier, password, done) => {
    try {
      // Find user by email or username
      const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],
        authProvider: 'local'
      });

      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Google OAuth Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if email exists with different provider
        user = await User.findOne({ email: profile.emails[0].value });

        if (user && user.authProvider !== 'google') {
          // Link Google account to existing user
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        }

        // Create new user
        const userId = 'user_' + crypto.randomBytes(16).toString('hex');
        let username = profile.emails[0].value.split('@')[0];

        // Check username availability
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
          username = username + Math.floor(Math.random() * 10000);
        }

        user = await User.create({
          _id: userId,
          googleId: profile.id,
          email: profile.emails[0].value,
          full_name: profile.displayName,
          username,
          profile_picture: profile.photos[0]?.value || '',
          authProvider: 'google',
          emailVerified: true // Google accounts are pre-verified
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
}

export default passport;
