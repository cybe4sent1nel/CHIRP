# 🐦 Chirp - Start Development

## One Command to Rule Them All

```bash
npm run dev
```

That's it! This will:
- ✅ Load environment from `.env`
- ✅ Validate configuration  
- ✅ Start backend server (port 4000)
- ✅ Start frontend client (port 5173)
- ✅ Show merged logs from both
- ✅ Stop both with Ctrl+C

---

## First Time Setup (5 minutes)

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Create `.env` File
```bash
cp .env.example .env
```

Edit `.env` and add:
```
OPENROUTER_API_KEY=sk_xxxxx    # Get from openrouter.ai
MONGO_URI=mongodb+srv://...    # Get from mongodb.com
```

### 3. Start
```bash
npm run dev
```

### 4. Open Browser
http://localhost:5173

---

## Setup Guides

- **Quick Start**: `QUICK_START_DEV.md` (5 min read)
- **Complete Guide**: `DEV_SETUP.md` (15 min read)
- **Technical Details**: `UNIFIED_DEV_SCRIPT.md` (10 min read)
- **All Changes**: `UNIFIED_DEV_CHANGES.md` (reference)

---

## Commands

```bash
npm run dev              # Start both server + client ⭐
npm run dev:server      # Server only
npm run dev:client      # Client only  
npm run build           # Build for production
npm run install:all     # Install all dependencies
```

---

## Port Information

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000

---

## Troubleshooting

### OPENROUTER_API_KEY not set
1. Get free key from https://openrouter.ai
2. Add to `.env`: `OPENROUTER_API_KEY=sk_xxxxx`
3. Run `npm run dev` again

### Port already in use
Change in `.env`:
```
PORT=5000
```

### MongoDB connection failed
Create free account at https://mongodb.com/cloud/atlas and update MONGO_URI

---

## That's All!

**Happy coding! 🚀**

See `DEV_SETUP.md` for more detailed help.
