# 🎯 ONE COMMAND SETUP

## ✅ What's Already Done

- ✅ JWT Secret generated and added to .env
- ✅ Session Secret generated and added to .env  
- ✅ Unified dev script configured
- ✅ All authentication code completed
- ✅ Email templates created
- ✅ Frontend pages built
- ✅ Routes configured

---

## 🚀 How to Run (Super Simple!)

### From Root Directory:

```bash
npm run dev
```

**That's it!** 🎉

This ONE command starts:
```
┌─────────────────────────────────────┐
│  🔧 Backend Server                  │
│     http://localhost:4000           │
│     • API endpoints                 │
│     • Authentication                │
│     • Database                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📱 Frontend Client                 │
│     http://localhost:5173           │
│     • React app                     │
│     • Beautiful UI                  │
│     • Lottie animations            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📧 Inngest Dev Server              │
│     http://localhost:8288           │
│     • Email queue                   │
│     • Background jobs               │
│     • Reliable delivery            │
└─────────────────────────────────────┘
```

---

## 📋 Quick Checklist

Before running `npm run dev`:

### Required ✅
- [x] MongoDB URI in .env
- [x] JWT_SECRET in .env (done!)
- [x] SESSION_SECRET in .env (done!)

### Optional (but recommended) 📧
- [ ] SMTP credentials for emails
- [ ] Google OAuth credentials

---

## 🧪 Test Your App

1. **Start everything:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   ```
   http://localhost:5173/auth
   ```

3. **Try these:**
   - ✅ Create account (signup)
   - ✅ Login with email or username
   - ✅ Test forgot password
   - ✅ Try Clerk login at /clerk-login

---

## 🎨 How It Works

```
Root Directory (/)
    │
    ├─ npm run dev
    │   └─ Runs: node dev.js
    │
    └─ dev.js starts:
        ├─ cd server && npm run dev
        ├─ cd client && npm run dev  
        └─ cd server && npx inngest-cli dev
```

All three services share the **same .env file** from root!

---

## 🔐 Google OAuth Setup (Optional)

Want Google login?

1. **Google Cloud Console:**
   - https://console.cloud.google.com/
   - Create OAuth 2.0 Client ID

2. **Add these URIs:**
   ```
   Authorized origins:
   http://localhost:5173
   http://localhost:4000

   Redirect URI:
   http://localhost:4000/api/auth/google/callback
   ```

3. **Copy to .env:**
   ```env
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   ```

4. **Restart:** `npm run dev`

Done! Google login button will work! ✨

---

## 📧 Email Setup (Optional)

Want to send emails?

### Recommended: Brevo (Free 300/day)

1. **Sign up:** https://www.brevo.com/
2. **Get SMTP:** Settings → SMTP & API
3. **Add to .env:**
   ```env
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-smtp-key
   SENDER_EMAIL=Chirp <noreply@yourdomain.com>
   ```
4. **Restart:** `npm run dev`

Now you'll receive:
- ✉️ Welcome emails
- ✉️ Verification emails
- ✉️ Password reset emails
- ✉️ Login alerts

---

## 🛠️ Troubleshooting

### Port already in use?
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:4000 | xargs kill -9
```

### Can't run dev.ps1?
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### MongoDB connection failed?
- Check `MONGO_URI` in .env
- Verify MongoDB Atlas allows your IP

---

## 📚 Documentation

Detailed guides in root directory:
- `START_HERE_AUTH.md` - Authentication setup
- `CUSTOM_AUTH_QUICK_START.md` - Quick reference
- `CUSTOM_AUTH_SETUP_GUIDE.md` - Complete guide
- `CUSTOM_AUTH_ARCHITECTURE.md` - System design
- `NETLIFY_DEPLOYMENT_GUIDE.md` - Deployment

---

## 🎯 Summary

```bash
# Step 1: Install (only once)
npm install

# Step 2: Configure .env (already done!)
# JWT and Session secrets already set ✅

# Step 3: Start everything
npm run dev

# Step 4: Open browser
http://localhost:5173/auth

# Done! 🎊
```

---

**ONE command. THREE services. ZERO hassle!** 🚀

All environment variables are in the root `.env` file.
All services start with `npm run dev`.
All documentation is in markdown files.

**You're ready to code!** 💪
