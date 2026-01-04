# Custom Authentication Setup Guide 🚀

Welcome to your new custom authentication system! This guide will help you set up and configure everything needed for both custom authentication (email/password + Google OAuth) and Clerk authentication.

## 📋 Table of Contents
1. [What's New](#whats-new)
2. [Environment Variables Setup](#environment-variables-setup)
3. [Google OAuth Configuration](#google-oauth-configuration)
4. [Email Service Configuration](#email-service-configuration)
5. [Testing the System](#testing-the-system)
6. [Features Overview](#features-overview)
7. [Troubleshooting](#troubleshooting)

---

## 🎉 What's New

Your Chirp application now supports **dual authentication**:
- ✅ **Custom Email/Password Auth** - Users can sign up with email and password
- ✅ **Google OAuth** - Sign in with Google account
- ✅ **Clerk Auth** (Existing) - Continue using Clerk as before
- ✅ **Password Reset** - Forgot password flow with email verification
- ✅ **Email Verification** - Verify email addresses with beautiful templates
- ✅ **Glassmorphism UI** - Beautiful animated login/signup pages
- ✅ **Dual Email System** - Inngest + direct fallback for reliability

---

## 🔐 Environment Variables Setup

### 1. Open your `.env` file in the server directory

The following variables have been added. You need to fill in the placeholders:

```env
# ========================================
# CUSTOM AUTHENTICATION SETTINGS
# ========================================

# JWT Secret - Generate a random string (32+ characters)
# You can use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_jwt_secret_here_replace_this_with_random_string

# Session Secret - Generate another random string (32+ characters)
SESSION_SECRET=your_session_secret_here_replace_this_with_random_string

# Google OAuth Credentials (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# Frontend URL (for email links and OAuth redirects)
FRONTEND_URL=http://localhost:5173
```

### 2. Generate Secure Secrets

Run these commands in your terminal to generate secure random secrets:

```bash
# For JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# For SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste into your `.env` file.

---

## 🔑 Google OAuth Configuration

To enable "Sign in with Google", you need to create OAuth credentials:

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Go to **APIs & Services** > **Credentials**

### Step 2: Create OAuth 2.0 Client ID
1. Click **"Create Credentials"** > **"OAuth client ID"**
2. Select **"Web application"**
3. Configure:
   - **Name**: Chirp Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:4000/api/auth/google/callback` (development)
     - `https://yourapi.com/api/auth/google/callback` (production)

### Step 3: Copy Credentials
1. Copy the **Client ID** to `GOOGLE_CLIENT_ID` in `.env`
2. Copy the **Client Secret** to `GOOGLE_CLIENT_SECRET` in `.env`

---

## 📧 Email Service Configuration

Your authentication system sends emails for:
- Welcome messages
- Email verification
- Password reset
- Login alerts

### Email Settings Already in .env

Make sure these are configured in your `.env`:

```env
# Email Service (Brevo/SendGrid/etc.)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=noreply@chirp.com
FROM_NAME=Chirp

# Inngest (for email queue)
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

### Recommended Email Services:

#### Option 1: Brevo (Recommended)
- **Free tier**: 300 emails/day
- Sign up: https://www.brevo.com/
- Get SMTP credentials from Settings > SMTP & API

#### Option 2: SendGrid
- **Free tier**: 100 emails/day
- Sign up: https://sendgrid.com/
- Get API key from Settings > API Keys

#### Option 3: Mailgun
- **Free tier**: 5,000 emails/month (first 3 months)
- Sign up: https://www.mailgun.com/

---

## 🧪 Testing the System

### 1. Start the Development Server

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev

# Terminal 3 - Start Inngest (for emails)
cd server
npx inngest-cli@latest dev
```

### 2. Test Custom Authentication

#### Signup Flow:
1. Open: http://localhost:5173/auth
2. Click "Sign Up"
3. Fill in:
   - Full Name
   - Email
   - Username
   - Password
4. Click "Sign Up"
5. Check your email for verification link
6. Click verification link (or open: http://localhost:5173/verify-email?token=...)
7. Login with your email/username and password

#### Google OAuth:
1. Open: http://localhost:5173/auth
2. Click "Continue with Google"
3. Select Google account
4. You'll be redirected back and logged in

#### Forgot Password:
1. Open: http://localhost:5173/auth
2. Click "Forgot Password?"
3. Enter your email
4. Check email for reset link
5. Click link and set new password

#### Clerk Authentication (Existing):
1. Open: http://localhost:5173/clerk-login
2. Use Clerk modal as before
3. All existing Clerk functionality still works!

---

## ✨ Features Overview

### Pages Created:

1. **`/auth`** - Main login/signup page
   - Beautiful glassmorphism UI
   - Animated Lottie background
   - Email/password login
   - Google OAuth button
   - Toggle between login/signup
   - Option to use Clerk

2. **`/forgot-password`** - Password reset
   - Two-step process
   - Email submission
   - New password with confirmation
   - Token-based security

3. **`/verify-email`** - Email verification
   - Success/error states
   - Auto-redirect after success
   - Beautiful animations

4. **`/clerk-login`** - Original Clerk login
   - Maintains backward compatibility
   - All Clerk features intact

### Backend Features:

1. **Authentication Controller** (`server/controllers/authController.js`)
   - `signup` - Create new user with hashed password
   - `login` - Authenticate with email or username
   - `verifyEmail` - Confirm email address
   - `forgotPassword` - Request password reset
   - `resetPassword` - Change password with token
   - `verifyToken` - JWT middleware for protected routes

2. **Email Templates** (`server/configs/emailTemplates.js`)
   - 8 beautiful HTML templates
   - Glassmorphism design
   - Chirp logo integration
   - Responsive design

3. **Passport Strategies** (`server/configs/passport.js`)
   - Local strategy (email/username + password)
   - Google OAuth strategy
   - Session serialization

4. **Auth Routes** (`server/routes/authRoutes.js`)
   - POST `/api/auth/signup`
   - POST `/api/auth/login`
   - GET `/api/auth/verify-email`
   - POST `/api/auth/forgot-password`
   - POST `/api/auth/reset-password`
   - GET `/api/auth/verify-token`
   - GET `/api/auth/google`
   - GET `/api/auth/google/callback`

### Frontend Features:

1. **Auth Context** (`client/src/context/AuthContext.jsx`)
   - Manages both Clerk and custom auth
   - Token verification
   - Login/signup methods
   - Logout functionality
   - Current user state

2. **Protected Routes**
   - Automatically redirect to `/auth` if not logged in
   - Support both Clerk and custom auth users

---

## 🛠️ Troubleshooting

### Issue: Emails not sending

**Solution:**
1. Check SMTP credentials in `.env`
2. Verify Inngest is running: `npx inngest-cli@latest dev`
3. Check server logs for email errors
4. Test direct email send (fallback should work even if Inngest fails)

### Issue: Google OAuth not working

**Solution:**
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
2. Check redirect URIs match exactly in Google Cloud Console
3. Make sure authorized origins include your frontend URL
4. Check browser console for CORS errors

### Issue: JWT token invalid

**Solution:**
1. Generate new `JWT_SECRET` using crypto command
2. Clear browser localStorage
3. Restart server
4. Login again

### Issue: Password reset link expired

**Solution:**
- Reset tokens expire after 1 hour
- Request a new reset link
- Check email for latest link

### Issue: Can't login after signup

**Solution:**
1. Check if email verification is required
2. Look for verification email
3. Check spam/junk folder
4. Resend verification email if needed

### Issue: Session not persisting

**Solution:**
1. Check `SESSION_SECRET` is set in `.env`
2. Verify MongoDB connection (sessions stored in DB)
3. Clear browser cookies
4. Check browser console for errors

---

## 🚀 Next Steps

1. **Set up Google OAuth credentials** (see section above)
2. **Configure email service** (Brevo recommended)
3. **Generate JWT and session secrets**
4. **Test all authentication flows**
5. **Deploy to Netlify** (not Vercel, as requested)
6. **Update OAuth callback URLs** for production

---

## 📝 Environment Variables Checklist

Before going to production, make sure you have:

- [ ] `JWT_SECRET` - Generated random string
- [ ] `SESSION_SECRET` - Generated random string
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- [ ] `GOOGLE_CALLBACK_URL` - Updated for production
- [ ] `FRONTEND_URL` - Your production frontend URL
- [ ] `SMTP_HOST` - Email service host
- [ ] `SMTP_PORT` - Email service port
- [ ] `SMTP_USER` - Email service username
- [ ] `SMTP_PASSWORD` - Email service password
- [ ] `FROM_EMAIL` - Sender email address
- [ ] `FROM_NAME` - Sender name
- [ ] `INNGEST_SIGNING_KEY` - Inngest signing key

---

## 🎨 Customization

### Change Lottie Animations
Edit these files to use different animations:
- `client/src/pages/CustomAuth.jsx` (line 26-29)
- `client/src/pages/VerifyEmail.jsx` (line 18)

### Modify Email Templates
Edit: `server/configs/emailTemplates.js`
- Change colors, styles, content
- Add your own branding
- Update logo URL

### Adjust Password Requirements
Edit: `server/controllers/authController.js`
- Change minimum length
- Add complexity requirements
- Modify validation rules

---

## 💡 Tips

- **Testing emails locally**: Use a service like Mailtrap.io for dev testing
- **Security**: Never commit `.env` file to git (already in `.gitignore`)
- **Production**: Use environment variables in Netlify dashboard
- **Monitoring**: Check Inngest dashboard for email delivery status
- **Backup**: Keep email service API keys in secure password manager

---

## 📞 Support

If you encounter any issues:

1. Check server logs: `cd server && npm run dev`
2. Check browser console: F12 in browser
3. Verify environment variables are set
4. Make sure MongoDB is running
5. Ensure Inngest dev server is running

---

## 🎯 Summary

You now have a complete dual authentication system:
- Custom email/password authentication
- Google OAuth integration
- Email verification
- Password reset functionality
- Beautiful UI with Lottie animations
- Clerk authentication (existing)

All authentication methods work side-by-side, giving users maximum flexibility! 🎉

---

**Created with ❤️ for Chirp**
