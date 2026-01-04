# 🚀 Quick Start Guide - Chirp

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (2 min)
```bash
npm install:all
```

### Step 2: Setup Credentials (2 min)
Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/chirp
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CORS_ORIGIN=http://localhost:5173
```

Create `client/.env`:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_BASEURL=http://localhost:5000
```

### Step 3: Start App (1 min)
```bash
npm start
```

Open http://localhost:5173 ✅

---

## 🎯 What's New

| Feature | Location | Status |
|---------|----------|--------|
| Fixed Notification Counter | Sidebar | ✅ Ready |
| AI Studio Chatbot | /ai-studio | ✅ Ready |
| Profile QR Generator | /profile-qr | ✅ Ready |
| Unified Start Script | `npm start` | ✅ Ready |

---

## 🔐 Get Credentials

1. **Clerk** → https://dashboard.clerk.com → API Keys
2. **MongoDB** → https://mongodb.com/cloud/atlas → Connect
3. **Cloudflare** (optional) → https://dash.cloudflare.com → Workers
4. **Serper** (optional) → https://serper.dev → API Key

---

## 📁 Key Files

```
chirp/
├── client/.env                    ← Frontend credentials
├── server/.env                    ← Backend credentials
├── CREDENTIALS_NEEDED.md          ← Full credential guide
├── .env.setup.md                  ← Detailed setup
├── FEATURES.md                    ← What's new
├── client/src/pages/
│   ├── AIStudio.jsx               ← Chat bot page
│   └── ProfileQR.jsx              ← QR code generator
├── client/src/components/
│   └── Sidebar.jsx                ← Updated with new menu items
└── start.js / start.bat / start.ps1 ← Start scripts
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | Change PORT in server/.env |
| Clerk not working | Check PUBLISHABLE_KEY in client/.env |
| MongoDB error | Verify connection string, add IP to whitelist |
| AI features not working | Add CLOUDFLARE_WORKER_URL to both .env files |
| Module not found | Run `npm install:all` |

---

## 📞 Help

- **Setup Help** → Read `CREDENTIALS_NEEDED.md`
- **Feature Details** → Read `FEATURES.md`
- **Env Setup** → Read `.env.setup.md`
- **Issues** → Check error messages in console

---

## ✨ Features at a Glance

### 🤖 AI Studio
- Post suggestions
- Comment ideas
- Hashtag generation
- Web search
- Chat history

### 📱 Profile QR
- Customizable QR codes
- Color picker (foreground/background)
- 9 pattern styles
- Download & share
- Random generator

### 🔔 Notifications
- Fixed counter (real unread count)
- Mark as read
- Filter by type
- Delete notifications

---

## 🚀 First Run Checklist

- [ ] Run `npm install:all`
- [ ] Create `server/.env` with Clerk keys
- [ ] Create `client/.env` with Clerk key
- [ ] Add MongoDB URI
- [ ] Run `npm start`
- [ ] Login at http://localhost:5173
- [ ] Visit /ai-studio
- [ ] Visit /profile-qr
- [ ] Check sidebar for new menu items

---

## 💡 Pro Tips

1. **Multiple terminals**: Run `start.bat` or `start.ps1` on Windows
2. **Debug mode**: Check browser DevTools → Console
3. **Local storage**: QR styles and chat history saved in browser
4. **No internet?**: Basic features work without external APIs
5. **API limits**: Serper has 100 free queries/month

---

**Version**: 1.0.0  
**Time to Setup**: 5-10 minutes  
**Technical Level**: Intermediate
