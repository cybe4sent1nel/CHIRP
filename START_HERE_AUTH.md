# 🚀 Quick Start Guide - Custom Authentication

## ✅ Secrets Added to .env

Your JWT and Session secrets have been generated and added to `.env`:
- ✅ `JWT_SECRET` - Secure 256-bit key
- ✅ `SESSION_SECRET` - Secure 256-bit key

## 🌐 Google OAuth Configuration for Localhost

When setting up Google OAuth in Google Cloud Console, use these URIs:

### 1. Authorized JavaScript Origins
```
http://localhost:5173
http://localhost:4000
```

### 2. Authorized Redirect URIs
```
http://localhost:4000/api/auth/google/callback
```

### Complete Setup Steps:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**
3. **Enable APIs**: Navigate to "APIs & Services" → "OAuth consent screen"
   - User Type: External
   - App name: Chirp
   - User support email: your-email@gmail.com
   - Developer contact: your-email@gmail.com
   
4. **Create Credentials**: "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: **Chirp Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:4000`
   - Authorized redirect URIs:
     - `http://localhost:4000/api/auth/google/callback`
   
5. **Copy Credentials**:
   - Copy **Client ID** → Replace `GOOGLE_CLIENT_ID` in `.env`
   - Copy **Client Secret** → Replace `GOOGLE_CLIENT_SECRET` in `.env`

---

## 🚀 Running the Development Server

### Option 1: Unified Script (Recommended)

**Windows (PowerShell):**
```powershell
.\dev.ps1
```

**Windows (CMD):**
```cmd
dev.bat
```

**Mac/Linux:**
```bash
chmod +x dev.sh
./dev.sh
```

This will start:
- 🔧 Backend Server on http://localhost:4000
- 📱 Frontend on http://localhost:5173
- 📧 Inngest on http://localhost:8288

### Option 2: Manual (3 Terminals)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

**Terminal 3 - Inngest:**
```bash
cd server
npx inngest-cli@latest dev
```

---

## 🧪 Testing Authentication

### 1. Open Frontend
Visit: http://localhost:5173/auth

### 2. Test Signup
- Click "Sign Up"
- Fill in:
  - Full Name
  - Email
  - Username
  - Password (min 8 chars)
- Submit
- Check email for verification link

### 3. Test Login
- Enter email/username + password
- Click "Login"
- Should redirect to main app

### 4. Test Google OAuth (After Setup)
- Click "Continue with Google"
- Select Google account
- Should redirect back logged in

### 5. Test Password Reset
- Click "Forgot Password?"
- Enter email
- Check email for reset link
- Click link and set new password

### 6. Test Clerk (Existing)
- Visit: http://localhost:5173/clerk-login
- Clerk modal should work as before

---

## 📧 Email Service Setup (Required for Emails)

You need to configure an SMTP service to send emails.

### Recommended: Brevo (Free 300 emails/day)

1. **Sign up**: https://www.brevo.com/
2. **Get SMTP credentials**: Settings → SMTP & API
3. **Update .env**:
```env
SMTP_USER=your-brevo-email@example.com
SMTP_PASS=your-brevo-smtp-key
SENDER_EMAIL=Chirp <noreply@yourdomain.com>
```

### Alternative: Gmail (Development Only)

1. **Enable 2FA** on your Google account
2. **Create App Password**: Google Account → Security → 2-Step Verification → App passwords
3. **Update .env**:
```env
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-app-password
SENDER_EMAIL=Chirp <your-gmail@gmail.com>
```

**Note**: Gmail has daily sending limits (500/day) and is not recommended for production.

---

## 🔍 Verify Everything Works

### Checklist:

- [ ] Backend running on http://localhost:4000
- [ ] Frontend running on http://localhost:5173
- [ ] Inngest running on http://localhost:8288
- [ ] Can access http://localhost:5173/auth
- [ ] No console errors in browser (F12)
- [ ] Can create account (signup)
- [ ] Verification email received
- [ ] Can verify email via link
- [ ] Can login with email
- [ ] Can login with username
- [ ] Password reset email received
- [ ] Can reset password
- [ ] Google OAuth works (if configured)
- [ ] Clerk login works at /clerk-login

---

## 🐛 Troubleshooting

### Issue: Scripts won't run

**PowerShell:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Port already in use

**Windows:**
```cmd
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:4000 | xargs kill -9
```

### Issue: Emails not sending

1. Check SMTP credentials in `.env`
2. Verify Inngest is running
3. Check server terminal for errors
4. Try direct email fallback (should work automatically)

### Issue: Google OAuth not working

1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
2. Check redirect URI matches exactly: `http://localhost:4000/api/auth/google/callback`
3. Ensure authorized origins include both ports
4. Check browser console for errors

### Issue: MongoDB connection failed

1. Verify `MONGO_URI` in `.env`
2. Check MongoDB Atlas network access (allow your IP)
3. Ensure database user has correct permissions

---

## 📚 Documentation

- **Setup Guide**: `CUSTOM_AUTH_SETUP_GUIDE.md`
- **Quick Start**: `CUSTOM_AUTH_QUICK_START.md`
- **Architecture**: `CUSTOM_AUTH_ARCHITECTURE.md`
- **Deployment**: `NETLIFY_DEPLOYMENT_GUIDE.md`

---

## 🎯 What's Next?

1. ✅ Secrets generated and added to .env
2. ⏭️ Configure Google OAuth (optional but recommended)
3. ⏭️ Set up SMTP for emails
4. ⏭️ Run unified dev script
5. ⏭️ Test all authentication flows
6. ⏭️ Deploy to Netlify when ready

---

## 💡 Quick Commands

```bash
# Generate new secrets (if needed)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Start all servers
.\dev.ps1  # PowerShell
dev.bat    # CMD
./dev.sh   # Mac/Linux

# Install dependencies
npm install  # In both client/ and server/ directories

# Check running processes
netstat -ano | findstr :4000  # Windows
lsof -ti:4000                  # Mac/Linux
```

---

**Your custom authentication system is ready to test! 🎉**

Start with the unified script and follow the testing checklist above.
