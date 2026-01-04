# Chirp Development Setup Guide

## Quick Start (One Command)

```bash
npm run dev
```

That's it! This starts both server and client with a single command.

---

## Prerequisites

### 1. Node.js & npm
- Download: https://nodejs.org/ (LTS version recommended)
- Verify: `node --version` && `npm --version`

### 2. MongoDB
- Cloud: Create free account at https://mongodb.com/cloud/atlas
- Local: Install from https://www.mongodb.com/try/download/community
- Get connection string (MongoDB URI)

### 3. OpenRouter API Key
- Visit: https://openrouter.ai
- Sign up for free
- Get API key from dashboard
- Copy the key starting with `sk_`

---

## Setup Instructions

### Step 1: Clone/Download Project
```bash
cd Full-Stack-Social-Media-App-main
```

### Step 2: Install Dependencies (First Time Only)
```bash
npm run install:all
```

This installs:
- Root dependencies
- Client dependencies (in `client/`)
- Server dependencies (in `server/`)

### Step 3: Configure Environment Variables

Create `.env` file in **root directory** (not in client or server folders):

```
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chirp?retryWrites=true&w=majority

# AI Provider (OpenRouter)
OPENROUTER_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Clerk Authentication (if using)
CLERK_SECRET_KEY=sk_test_xxxxx

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
```

### Step 4: Get Your API Keys

#### OpenRouter API Key
1. Go to https://openrouter.ai
2. Click "Sign Up" (or "Sign In")
3. Navigate to "Keys" section
4. Copy your API key
5. Paste into `.env` file as `OPENROUTER_API_KEY`

#### MongoDB Connection String
1. Go to https://mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string from "Connect" button
4. Replace `<username>`, `<password>`, `<cluster-name>`
5. Paste into `.env` file as `MONGO_URI`

### Step 5: Start Development

```bash
npm run dev
```

**Output should show:**
```
┌─────────────────────────────────────┐
│ 🐦 Chirp - Unified Development      │
└─────────────────────────────────────┘

✓ Loading environment from: .../.env

📋 Environment Variables Check:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Server Configuration:
  ✓ OPENROUTER_API_KEY: sk_......
  ✓ PORT: 4000
  ✓ MONGO_URI: mongodb+srv://...
  ✓ FRONTEND_URL: http://localhost:5173

🚀 Starting Backend Server (Port: 4000)...
[Server logs...]

🎨 Starting Frontend Client (Port: 5173)...
[Client logs...]
```

### Step 6: Open in Browser

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **MongoDB**: (Cloud or Local)

---

## Environment Variables Explained

### Server (.env in root)

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `PORT` | Server port | `4000` | No (default: 4000) |
| `NODE_ENV` | Environment mode | `development` | No |
| `MONGO_URI` | MongoDB connection | `mongodb+srv://...` | Yes |
| `OPENROUTER_API_KEY` | AI provider key | `sk_xxxxx` | Yes |
| `OPENROUTER_BASE_URL` | AI API endpoint | `https://openrouter.ai/api/v1` | No (default set) |
| `FRONTEND_URL` | Frontend domain | `http://localhost:5173` | No |
| `CLERK_SECRET_KEY` | Auth secret | `sk_test_xxxx` | No (if using Clerk) |

### Client (Automatically Set)

| Variable | Purpose | Set By | Value |
|----------|---------|--------|-------|
| `VITE_SERVER_URL` | Backend URL | `dev.js` | `http://localhost:4000` |

**Note**: Client reads these from root `.env` file via `dev.js` script

---

## Unified Dev Script (`dev.js`)

The new `dev.js` script:

✅ **Loads parent `.env` file** - Single source of truth  
✅ **Validates required variables** - Warns if missing  
✅ **Sets up environment** - For both client and server  
✅ **Starts server first** - Waits 3 seconds  
✅ **Starts client second** - With correct env vars  
✅ **Shows consolidated output** - From both processes  
✅ **Graceful shutdown** - Ctrl+C kills both cleanly  

---

## Development Workflow

### File Structure
```
Full-Stack-Social-Media-App-main/
├── .env                          ← Main configuration file (ONLY ONE)
├── package.json                  ← Root scripts
├── dev.js                         ← Unified dev starter
├── client/
│   ├── package.json
│   ├── src/
│   │   ├── pages/
│   │   │   └── AIStudio.jsx
│   │   ├── hooks/
│   │   │   └── useAI.js          ← Reads VITE_SERVER_URL
│   │   └── ...
│   └── .env.local               ← (NOT USED - removed)
├── server/
│   ├── package.json
│   ├── server.js
│   ├── routes/
│   │   └── aiRoutes.js
│   ├── lib/
│   │   └── ai.js                 ← Uses OPENROUTER_API_KEY
│   └── .env                      ← (NOT USED - removed)
└── ...
```

### Running Different Modes

**Development (All Features)**
```bash
npm run dev
# Starts: Server (nodemon) + Client (Vite)
# Auto-reload: On file changes
# Source maps: Enabled
```

**Production Build**
```bash
npm run build
# Builds: Client (optimized) + Server (if applicable)
# Output: client/dist/ and server/build/
```

**Server Only** (for API testing)
```bash
npm run dev:server
```

**Client Only** (for frontend work)
```bash
npm run dev:client
```

---

## Troubleshooting

### Error: "Cannot find module 'dotenv'"
```bash
npm run install:all
```

### Error: "OPENROUTER_API_KEY: NOT SET"
```
❌ Missing required environment variables!

📌 Setup Instructions:
   1. Open .env file in root directory
   2. Add: OPENROUTER_API_KEY=sk_xxxxx
   3. Get key from: https://openrouter.ai
   4. Save and run this script again
```
**Solution**: Get API key from https://openrouter.ai and add to `.env`

### Error: "Port 4000 already in use"
Option 1 - Stop process using port:
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :4000
kill -9 <PID>
```

Option 2 - Use different port:
```env
PORT=5000
```
Then update `client/.env.local` if it exists, or just use `npm run dev`

### Error: "Client can't connect to server"
Check:
1. Server is running (port 4000)
2. `.env` has `FRONTEND_URL=http://localhost:5173`
3. Client `.env.local` not blocking (should not have VITE_SERVER_URL)
4. Firewall not blocking localhost

### MongoDB Connection Error
```
MongoServerError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: 
- Start MongoDB service (local)
- OR use MongoDB Atlas cloud
- OR update `MONGO_URI` in `.env`

---

## What Happens When You Run `npm run dev`

```
1. dev.js loads parent .env file
   ↓
2. Validates OPENROUTER_API_KEY, MONGO_URI, etc.
   ↓
3. Shows configuration summary
   ↓
4. Spawns server process with shared env
   - Server starts on port 4000
   - Nodemon watches for changes
   - Loads all env vars from parent .env
   ↓
5. Waits 3 seconds for server to initialize
   ↓
6. Spawns client process with VITE_SERVER_URL set
   - Client starts on port 5173
   - Vite dev server with hot reload
   - Frontend can access /api/* endpoints
   ↓
7. Both processes output to console
   ↓
8. Ctrl+C gracefully shuts down both
```

---

## Environment Inheritance

### Before (Multiple Env Files)
```
.env                 ← root config
client/.env.local    ← client config (conflicts!)
server/.env          ← server config (conflicts!)
```
❌ Confusing, inconsistent, prone to errors

### After (Single Env File)
```
.env                 ← ONLY configuration
(client/ and server/ .env removed)
```
✅ Clean, simple, single source of truth

---

## Common Tasks

### Add New Environment Variable
1. Open `.env` in root
2. Add: `NEW_VAR=value`
3. Access in server: `process.env.NEW_VAR`
4. For client Vite: use `VITE_` prefix
5. Restart `npm run dev`

### Change Server Port
```env
PORT=3000
```
Restart `npm run dev`

### Switch Database
```env
MONGO_URI=mongodb://localhost:27017/chirp
```
Or use MongoDB Atlas URL

### Use Different AI Provider
Switch `OPENROUTER_API_KEY` and `OPENROUTER_BASE_URL` if using different service

---

## Performance Tips

1. **Keep server running** - Nodemon auto-restarts on changes
2. **Use hot reload** - Client auto-refreshes on save
3. **Monitor memory** - Check task manager if slow
4. **Clear cache** - Delete `node_modules` and reinstall if issues

---

## Next Steps

After setup, try:

1. **Create a post** - Test backend
2. **Generate AI suggestions** - Test OpenRouter integration
3. **Upload image** - Test file handling
4. **Search users** - Test database queries
5. **Create connections** - Test relationships

---

## Support

If you encounter issues:

1. **Check console logs** - Both browser and terminal
2. **Verify .env file** - All required vars present
3. **Restart services** - Ctrl+C and `npm run dev` again
4. **Check connectivity** - Can you reach localhost:4000 and :5173?
5. **Review error messages** - They usually point to the issue

---

## Summary

```bash
# First time
npm run install:all

# Create .env in root with:
# - OPENROUTER_API_KEY (from openrouter.ai)
# - MONGO_URI (from mongodb.com)
# - PORT=4000

# Every dev session
npm run dev

# Done! Open http://localhost:5173
```

**One script to rule them all!** 🐦
