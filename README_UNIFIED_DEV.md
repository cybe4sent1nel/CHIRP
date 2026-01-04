# 🐦 Chirp - Unified Development System

## Quick Start (30 Seconds)

```bash
# 1. Install dependencies
npm run install:all

# 2. Copy configuration template
cp .env.example .env

# 3. Edit .env and add:
# OPENROUTER_API_KEY=sk_xxxxx (from openrouter.ai)
# MONGO_URI=mongodb+srv://... (from mongodb.com)

# 4. Start development
npm run dev

# 5. Open browser: http://localhost:5173
```

---

## What This System Does

### ✅ One Command Starts Everything
```bash
npm run dev
```
- Starts Express server (port 4000)
- Starts React client (port 5173)
- Loads configuration automatically
- Shows helpful startup information
- Merged logs from both processes
- Ctrl+C stops both gracefully

### ✅ Single Configuration File
- Everything in root `.env` file
- No conflicting `server/.env` or `client/.env.local`
- Shared between server and client automatically
- Clear `.env.example` template provided

### ✅ Validation on Startup
- Checks for required environment variables
- Shows helpful error messages
- Provides links to get missing credentials
- Won't start if config is incomplete

### ✅ Professional Development Experience
- Clear startup summary
- Port information displayed
- Environment variables validated
- Graceful error handling
- Easy debugging with merged logs

---

## Files in This System

### Code Files
| File | Purpose | Size |
|------|---------|------|
| `dev.js` | Unified dev starter script | 350 lines |
| `.env.example` | Configuration template | 150 lines |
| `package.json` | Updated with new scripts | Enhanced |

### Documentation
| File | Read Time | Audience |
|------|-----------|----------|
| `START_DEV.md` | 2 min | Everyone |
| `QUICK_START_DEV.md` | 5 min | Developers |
| `DEV_SETUP.md` | 15 min | New setups |
| `UNIFIED_DEV_SCRIPT.md` | 10 min | Technical |
| `UNIFIED_DEV_CHANGES.md` | 10 min | Reference |
| `VISUAL_GUIDE.md` | 5 min | Visual learners |
| `IMPLEMENTATION_COMPLETE.md` | 5 min | Summary |
| `README_UNIFIED_DEV.md` | 5 min | This file |

---

## How It Works

### Process Flow
```
npm run dev
    ↓
dev.js starts
    ↓
Load .env file from root
    ↓
Validate required variables
    ├─ OPENROUTER_API_KEY (required)
    ├─ MONGO_URI (required)
    └─ Other optional vars
    ↓
Show configuration summary
    ↓
Spawn server process
├─ Passes all env vars
├─ Uses PORT from .env
├─ Runs in server/ folder
└─ Shows output
    ↓
Wait 3 seconds for server init
    ↓
Spawn client process
├─ Sets VITE_SERVER_URL automatically
├─ Uses NODE_ENV
├─ Runs in client/ folder
└─ Shows output
    ↓
Both running together
├─ Logs merged in terminal
├─ Ctrl+C stops both
└─ Graceful cleanup
```

### Environment Variable Inheritance
```
.env (root)
├─ Loaded by dev.js
├─ Validated
└─ Passed to both processes
   ├─ Server inherits all
   │  ├─ OPENROUTER_API_KEY
   │  ├─ MONGO_URI
   │  ├─ PORT
   │  └─ All env vars
   │
   └─ Client inherits + VITE_SERVER_URL set
      ├─ VITE_SERVER_URL=http://localhost:4000
      ├─ FRONTEND_URL
      └─ All other env vars
```

---

## Getting Your API Keys (Free!)

### OpenRouter (AI Provider)
1. Visit https://openrouter.ai
2. Click "Sign Up"
3. Create free account
4. Go to "Keys" section
5. Copy API key (starts with `sk_`)
6. Add to `.env`: `OPENROUTER_API_KEY=sk_xxxxx`

**Free tier**: Includes free credits for testing

### MongoDB (Database)
1. Visit https://mongodb.com/cloud/atlas
2. Click "Sign Up"
3. Create free account
4. Create free cluster
5. Get connection string from "Connect" button
6. Replace placeholders with your credentials
7. Add to `.env`: `MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chirp`

**Free tier**: 500MB database, unlimited API calls

---

## Available Commands

```bash
# Main command - start everything
npm run dev

# Start only backend
npm run dev:server

# Start only frontend
npm run dev:client

# Build for production
npm run build

# Install all dependencies
npm run install:all

# Build client and server (for production)
npm run build:client
npm run build:server
```

---

## Configuration (.env File)

### Required Variables
```env
# AI Provider
OPENROUTER_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chirp
```

### Optional Variables with Defaults
```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Get Full Template
```bash
cp .env.example .env
```

---

## Troubleshooting

### Problem: "OPENROUTER_API_KEY: NOT SET"
**Solution**:
1. Get API key from https://openrouter.ai
2. Add to `.env`: `OPENROUTER_API_KEY=sk_xxxxx`
3. Run `npm run dev` again

### Problem: "Port 4000 already in use"
**Solution**:
```env
PORT=5000
```
Restart `npm run dev`

### Problem: MongoDB connection failed
**Solution**:
1. Create free account at https://mongodb.com/cloud/atlas
2. Get connection string
3. Add to `.env`: `MONGO_URI=mongodb+srv://...`
4. Restart `npm run dev`

### Problem: Can't find npm command
**Solution**:
```bash
# Install Node.js from https://nodejs.org
# Verify installation
node --version
npm --version
```

### Problem: "Cannot find module"
**Solution**:
```bash
npm run install:all
```

---

## Documentation Guides

### I have 2 minutes
→ Read **START_DEV.md**
- Overview of the system
- How to run

### I have 5 minutes
→ Read **QUICK_START_DEV.md**
- Quick start instructions
- Command reference
- Basic troubleshooting

### I have 15 minutes
→ Read **DEV_SETUP.md**
- Step-by-step setup
- How to get API keys
- Complete troubleshooting
- Performance tips

### I want to understand it
→ Read **UNIFIED_DEV_SCRIPT.md**
- How the system works
- Architecture diagrams
- Advanced configuration

### I want all the details
→ Read **UNIFIED_DEV_CHANGES.md**
- What was changed
- Migration guide
- Complete file list

### I'm a visual learner
→ Read **VISUAL_GUIDE.md**
- Diagrams and flowcharts
- Before/after comparisons
- Visual decision trees

---

## Development Workflow

### First Time
```bash
# Install dependencies (one-time)
npm run install:all

# Copy configuration template
cp .env.example .env

# Edit .env with your API keys
nano .env  # or use your editor

# Verify configuration
npm run dev
```

### Every Development Session
```bash
# Just run
npm run dev

# Wait for startup message
# Open http://localhost:5173
# Code away!
```

### When Done
```bash
# Stop with Ctrl+C
# Both server and client stop cleanly
```

---

## Environment Variables Explained

| Variable | What It Does | Where to Get It |
|----------|--------------|-----------------|
| `OPENROUTER_API_KEY` | AI request authentication | https://openrouter.ai |
| `MONGO_URI` | Database connection string | https://mongodb.com/cloud/atlas |
| `PORT` | Server port (default: 4000) | Set to any port |
| `NODE_ENV` | Environment (development/production) | Set in .env |
| `FRONTEND_URL` | Frontend domain (for CORS) | Usually localhost:5173 |

---

## What Gets Started

### Server Process
```
Express.js HTTP server
├─ Running on port 4000
├─ Connected to MongoDB
├─ AI routes using OpenRouter API
├─ Authentication middleware
├─ CORS enabled
└─ Auto-restarts on file changes (nodemon)
```

### Client Process
```
React + Vite dev server
├─ Running on port 5173
├─ Connected to backend on port 4000
├─ Hot reload on file changes
├─ Source maps enabled
└─ Tailwind CSS compiled
```

---

## Benefits

### 👨‍💻 For Developers
- ✅ One command to start everything
- ✅ No terminal juggling
- ✅ Clear error messages
- ✅ Fast startup (15 seconds)

### 🎓 For Onboarding
- ✅ New devs can be ready in 5 minutes
- ✅ Clear setup instructions
- ✅ Helpful error messages with links
- ✅ Template configuration provided

### 👥 For Teams
- ✅ Everyone uses same setup
- ✅ `.env.example` in git ensures consistency
- ✅ No "works on my machine" issues
- ✅ Easy to maintain and extend

### 🚀 For Operations
- ✅ Professional setup ready for production
- ✅ Clear environment configuration
- ✅ Easy to adapt for Docker/Kubernetes
- ✅ Scalable architecture

---

## Common Tasks

### Change Server Port
```env
PORT=5000
```

### Use Different Database
```env
MONGO_URI=mongodb://localhost:27017/chirp
```

### Use Different Environment
```env
NODE_ENV=production
```

### Deploy to Production
```bash
npm run build
# Creates optimized client and server builds
# Ready to deploy to any Node.js host
```

---

## System Architecture

```
┌─────────────────────────────────────────────┐
│           npm run dev                       │
└────────────┬────────────────────────────────┘
             │
    ┌────────▼────────┐
    │    dev.js       │
    │  (350 lines)    │
    └────────┬────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
  .env file    Server Process
  (config)     ├─ Express.js
               ├─ MongoDB
               ├─ OpenRouter API
               └─ Port 4000
                     │
              ┌──────┴──────┐
              │             │
              ▼             ▼
           Client Process  Both share:
           ├─ React         ├─ .env
           ├─ Vite          ├─ Environment vars
           ├─ Hotload       └─ Same Node.js
           └─ Port 5173        process
```

---

## Next Steps

1. **Read** `START_DEV.md` (2 min)
2. **Follow** `QUICK_START_DEV.md` (5 min)
3. **Run** `npm run dev` (done!)
4. **Open** http://localhost:5173
5. **Code** amazing features!

---

## Support Resources

### Quick Questions
→ Check `QUICK_START_DEV.md` troubleshooting section

### Detailed Help
→ Read `DEV_SETUP.md` troubleshooting section

### Technical Details
→ Read `UNIFIED_DEV_SCRIPT.md`

### Visual Explanation
→ Check `VISUAL_GUIDE.md`

### API Keys Help
→ Links in `.env.example` and `DEV_SETUP.md`

---

## Summary

| Before | After |
|--------|-------|
| 2 terminals needed | 1 terminal |
| 2-3 .env files | 1 .env file |
| 2 min to start | 15 sec to start |
| Manual env setup | Automatic |
| Generic errors | Helpful errors with links |
| Hard to onboard | 5-min onboarding |

---

## Ready to Start?

```bash
npm run dev
```

**That's it! Happy coding! 🚀**

---

*Unified development system for Chirp Social Media App*  
*Professional. Simple. Effective.*
