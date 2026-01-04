# 🚀 Custom Auth Quick Start

## ⚡ Quick Setup (5 minutes)

### 1. Generate Secrets
```bash
# Run in terminal (copy output to .env)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Add to `.env` file
```env
JWT_SECRET=<paste_output_here>
SESSION_SECRET=<paste_output_here>
GOOGLE_CLIENT_ID=<get_from_google_cloud>
GOOGLE_CLIENT_SECRET=<get_from_google_cloud>
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### 3. Start Everything
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev

# Terminal 3 - Inngest (emails)
cd server && npx inngest-cli@latest dev
```

### 4. Test It!
Open: http://localhost:5173/auth

---

## 📍 Routes

### Frontend
- `/auth` - Login/Signup (custom auth)
- `/forgot-password` - Password reset
- `/verify-email` - Email verification
- `/clerk-login` - Clerk authentication
- `/` - Main app (protected)

### Backend API
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/verify-email?token=...` - Verify email
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Change password
- `GET /api/auth/google` - OAuth start
- `GET /api/auth/google/callback` - OAuth callback

---

## 🔑 Google OAuth Setup

1. Go to: https://console.cloud.google.com/
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add redirect URI: `http://localhost:4000/api/auth/google/callback`
5. Copy Client ID & Secret to `.env`

---

## 📧 Email Setup (Choose One)

### Brevo (Recommended - Free 300/day)
1. Sign up: https://www.brevo.com/
2. Get SMTP from Settings → SMTP & API
3. Add to `.env`:
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<your_email>
SMTP_PASSWORD=<your_api_key>
```

---

## 🧪 Test Checklist

- [ ] Signup with email/password
- [ ] Receive verification email
- [ ] Verify email via link
- [ ] Login with email
- [ ] Login with username
- [ ] Forgot password flow
- [ ] Reset password
- [ ] Google OAuth login
- [ ] Clerk login still works

---

## 🐛 Quick Fixes

**Emails not sending?**
- Check SMTP credentials
- Run: `npx inngest-cli@latest dev`
- Check server logs

**Google OAuth error?**
- Verify redirect URI matches exactly
- Check Client ID/Secret

**Can't login?**
- Clear localStorage
- Check email verification
- Verify MongoDB running

**Session not persisting?**
- Generate new SESSION_SECRET
- Clear browser cookies
- Restart server

---

## 📦 What's Included

### Backend
- `server/controllers/authController.js` - Auth logic
- `server/configs/passport.js` - Passport strategies
- `server/configs/emailTemplates.js` - 8 email templates
- `server/routes/authRoutes.js` - Auth endpoints
- `server/models/User.js` - Extended user model

### Frontend
- `client/src/pages/CustomAuth.jsx` - Login/signup page
- `client/src/pages/ForgotPassword.jsx` - Password reset
- `client/src/pages/VerifyEmail.jsx` - Email verification
- `client/src/context/AuthContext.jsx` - Auth state management

### Features
- ✅ Email/password authentication
- ✅ Google OAuth
- ✅ Email verification
- ✅ Password reset
- ✅ Hashed passwords (bcrypt)
- ✅ JWT tokens
- ✅ Session management
- ✅ Beautiful email templates
- ✅ Glassmorphism UI
- ✅ Lottie animations
- ✅ Dual email system (Inngest + fallback)
- ✅ Works alongside Clerk

---

## 🎯 User Flow

```
1. User visits /auth
2. Chooses signup/login
3. Enters credentials
4. Receives verification email
5. Clicks link in email
6. Redirected to /verify-email
7. Email verified ✓
8. Can now login
9. JWT token stored
10. Redirected to /
```

---

## 🔐 Security Features

- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens (30-day expiry)
- Reset tokens hashed with SHA256
- Reset links expire in 1 hour
- Email verification required
- Session stored in MongoDB
- httpOnly + secure cookies
- CSRF protection

---

## 📱 Try It Now!

```bash
# 1. Generate secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# 2. Add to .env

# 3. Start servers
npm run dev

# 4. Open browser
http://localhost:5173/auth
```

---

**Need help? Check `CUSTOM_AUTH_SETUP_GUIDE.md` for detailed instructions!**
