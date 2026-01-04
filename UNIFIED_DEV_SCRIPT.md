# Unified Development Script - Complete Guide

## Overview

The new unified dev script (`dev.js`) starts both client and server with a single command, using a single `.env` file.

### Before vs After

#### ❌ Before (Multiple env files, multiple commands)
```bash
# Need to do this:
cd server && npm run dev    # Terminal 1
cd client && npm run dev    # Terminal 2
# Plus manage separate: server/.env and client/.env.local
```

#### ✅ After (Single command, single env file)
```bash
npm run dev
# Done! Starts both automatically using root .env
```

---

## Key Features

### 🎯 Single Source of Truth
- **One `.env` file** in project root
- No conflicting `server/.env` or `client/.env.local`
- Changes in one place apply everywhere

### 🔍 Validation
- Checks for required variables on startup
- Warns if `OPENROUTER_API_KEY` missing
- Provides helpful error messages with setup links

### ⚡ Automatic Setup
- Loads environment automatically
- Sets `VITE_SERVER_URL` for client
- Passes env to both processes

### 📊 Unified Logging
- Shows startup progress
- Displays config summary
- Merges logs from both processes
- Shows port information

### 🛑 Clean Shutdown
- `Ctrl+C` stops both services gracefully
- No orphaned processes
- Proper cleanup on exit

---

## Usage

### Start Development
```bash
npm run dev
```

### Stop Services
```
Press Ctrl+C
```

### Run Only Server
```bash
npm run dev:server
```

### Run Only Client
```bash
npm run dev:client
```

### Build for Production
```bash
npm run build
```

---

## How It Works

### 1. Load Environment
```javascript
// dev.js reads parent .env
const envResult = config({ path: parentEnvPath });
// process.env now has all variables
```

### 2. Validate Required Variables
```javascript
// Checks: OPENROUTER_API_KEY, MONGO_URI, PORT
// Shows warning if missing
// Provides setup instructions with links
```

### 3. Prepare Env for Child Processes
```javascript
const sharedEnv = {
  ...process.env,
  NODE_ENV: 'development',
  PORT: 4000,
  FRONTEND_URL: 'http://localhost:5173'
};

const clientEnv = {
  ...sharedEnv,
  VITE_SERVER_URL: 'http://localhost:4000'
};
```

### 4. Spawn Server Process
```javascript
const serverProcess = spawn('npm', ['run', 'dev'], {
  cwd: 'server/',
  env: sharedEnv,  // Inherits .env values
  stdio: 'inherit' // Pipes output to console
});
```

### 5. Wait 3 Seconds, Spawn Client
```javascript
setTimeout(() => {
  const clientProcess = spawn('npm', ['run', 'dev'], {
    cwd: 'client/',
    env: clientEnv,  // Has VITE_SERVER_URL
    stdio: 'inherit'
  });
}, 3000);
```

### 6. Graceful Shutdown
```javascript
process.on('SIGINT', () => {
  serverProcess.kill('SIGTERM');
  clientProcess.kill('SIGTERM');
  // Wait 2 seconds then force kill if needed
  setTimeout(() => {
    serverProcess.kill('SIGKILL');
    clientProcess.kill('SIGKILL');
  }, 2000);
});
```

---

## Environment Flow

```
┌─────────────────────────────────────────────────────┐
│  .env (root directory)                              │
│  OPENROUTER_API_KEY=sk_xxx                         │
│  MONGO_URI=mongodb+srv://...                       │
│  PORT=4000                                         │
│  FRONTEND_URL=http://localhost:5173                │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌─────────────┐           ┌──────────────┐
   │Server Env   │           │Client Env    │
   │───────────  │           │─────────────  │
   │ PORT=4000   │           │VITE_SERVER_  │
   │ OPENROUTER_ │           │URL=localhost │
   │ API_KEY=... │           │:4000         │
   │ MONGO_URI   │           │VITE_*=...    │
   │ NODE_ENV    │           │(all shared)  │
   └──────┬──────┘           └──────┬───────┘
          │                         │
          ▼                         ▼
      Server Process          Client Process
      (Port 4000)             (Port 5173)
      Express API              React App
```

---

## File Changes

### Created Files
```
Root/
├── dev.js                  ← New: Unified dev script
├── .env.example            ← New: Config template
├── DEV_SETUP.md           ← New: Detailed setup guide
├── QUICK_START_DEV.md     ← New: Quick reference
└── UNIFIED_DEV_SCRIPT.md  ← New: This file
```

### Modified Files
```
package.json
  "scripts": {
    "dev": "node dev.js"   ← New: Main command
    "build": "npm run build:client && npm run build:server"  ← New
    ...
  }
```

### Files to Remove/Ignore
```
server/.env        ← Delete or ignore
client/.env.local  ← Delete or ignore
.env (old)        ← Replace with root .env
```

---

## Configuration

### Required Variables (in .env)

| Variable | Purpose | Example |
|----------|---------|---------|
| `OPENROUTER_API_KEY` | AI provider | `sk_xxxx...` |
| `MONGO_URI` | Database connection | `mongodb+srv://...` |

### Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Server port | 4000 |
| `NODE_ENV` | Environment | development |
| `FRONTEND_URL` | Frontend origin | http://localhost:5173 |
| `CLERK_SECRET_KEY` | Auth service | (none) |

### Auto-Set Variables

| Variable | Set By | Value |
|----------|--------|-------|
| `VITE_SERVER_URL` | dev.js | http://localhost:4000 |

---

## Troubleshooting

### Problem: Port 4000 already in use

**Solution 1**: Find and kill process
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :4000
kill -9 <PID>
```

**Solution 2**: Use different port
```env
PORT=5000
```

### Problem: "Cannot find module"

**Solution**:
```bash
npm run install:all
rm -rf node_modules
npm install
npm run dev
```

### Problem: OPENROUTER_API_KEY NOT SET

**Solution**:
1. Get key from https://openrouter.ai
2. Add to root `.env`: `OPENROUTER_API_KEY=sk_xxxxx`
3. Save file
4. Run `npm run dev` again

### Problem: MongoDB connection error

**Solution**:
- Use MongoDB Atlas: https://mongodb.com/cloud/atlas
- Or install local MongoDB
- Update `MONGO_URI` in `.env`

### Problem: Client can't reach server

**Check**:
1. Server running on port 4000
2. `.env` has `FRONTEND_URL=http://localhost:5173`
3. No `client/.env.local` overriding `VITE_SERVER_URL`

---

## Advanced Usage

### Change Ports

Edit `.env`:
```env
PORT=5000           # Server now on :5000
FRONTEND_URL=http://localhost:5000  # If needed
```

### Use Remote Database

Edit `.env`:
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/chirp
```

### Change AI Provider

Edit `.env`:
```env
OPENROUTER_API_KEY=sk_different_key
OPENROUTER_BASE_URL=https://different-api.com
```

### Production Build

```bash
npm run build
# Creates: client/dist/ and optimized build
```

---

## File Descriptions

### `dev.js`
- **Purpose**: Unified dev starter script
- **Does**: Loads .env, validates config, starts server+client
- **Size**: ~350 lines
- **Language**: Node.js (ES6 modules)

### `.env.example`
- **Purpose**: Template for configuration
- **Does**: Documents all possible env vars
- **Size**: ~150 lines
- **Action**: Copy to `.env` and fill in values

### `DEV_SETUP.md`
- **Purpose**: Comprehensive setup guide
- **Covers**: Prerequisites, step-by-step setup, troubleshooting
- **Size**: ~500 lines
- **Audience**: New developers

### `QUICK_START_DEV.md`
- **Purpose**: Quick reference card
- **Covers**: 30-second setup, common commands, troubleshooting
- **Size**: ~100 lines
- **Audience**: Everyone

---

## Benefits

✅ **Simplified Development**
- One command starts everything
- No terminal juggling

✅ **Easier Onboarding**
- New devs just run `npm run dev`
- Clear error messages if config missing

✅ **Less Configuration**
- Single `.env` file
- No conflicting env files

✅ **Better Debugging**
- See logs from both processes together
- Startup info shown clearly

✅ **Team Consistency**
- Everyone uses same setup
- `.env.example` shared in repo

✅ **Production Ready**
- Same startup script can be adapted
- Clear separation of concerns

---

## Migration Path (If You Have Old Setup)

### Step 1: Backup Old Configs
```bash
cp server/.env server/.env.backup
cp client/.env.local client/.env.local.backup
```

### Step 2: Create Root .env
```bash
cp .env.example .env
# Fill in values from old configs
```

### Step 3: Delete Old .env Files
```bash
rm server/.env
rm client/.env.local
```

### Step 4: Test New Setup
```bash
npm run dev
```

### Step 5: Update .gitignore
```bash
# .gitignore
.env        # Root env (don't commit)
.env.local  # User-specific env
server/.env # Old location
client/.env.local # Old location
```

---

## Summary

| Aspect | Old Way | New Way |
|--------|---------|---------|
| Start | 2 commands, 2 terminals | 1 command |
| Config | 2-3 `.env` files | 1 `.env` file |
| Setup | Manual in each folder | Automated |
| Env sync | Manual | Automatic |
| Logging | Separate | Unified |
| Shutdown | Kill 2 processes | Ctrl+C once |

---

## Next Steps

1. **Read**: `QUICK_START_DEV.md` (5 min)
2. **Setup**: Follow `DEV_SETUP.md` (10 min)
3. **Run**: `npm run dev` (done!)
4. **Code**: Build awesome features 🚀

---

**Questions?** Check the troubleshooting sections in `DEV_SETUP.md` or `QUICK_START_DEV.md`
