# Quick Start - Development

## 30-Second Setup

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Create `.env` file in root directory
```
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/chirp
OPENROUTER_API_KEY=sk_xxxxx
FRONTEND_URL=http://localhost:5173
```

Get keys:
- **OpenRouter**: https://openrouter.ai (free account)
- **MongoDB**: https://mongodb.com/cloud/atlas (free account)

### 3. Start Development
```bash
npm run dev
```

### 4. Open Browser
http://localhost:5173

---

## Available Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | **Start both server + client** ⭐ |
| `npm run dev:server` | Start only backend |
| `npm run dev:client` | Start only frontend |
| `npm run build` | Build both for production |
| `npm run install:all` | Install all dependencies |

---

## Environment Variables (.env)

```bash
# REQUIRED
OPENROUTER_API_KEY=sk_xxxxx           # Get from openrouter.ai
MONGO_URI=mongodb+srv://...           # Get from mongodb.com

# OPTIONAL (defaults shown)
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## Ports

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:4000

---

## Troubleshooting

### "npm run dev" not working
```bash
npm run install:all
```

### Missing OPENROUTER_API_KEY
1. Visit https://openrouter.ai
2. Sign up (free)
3. Copy API key
4. Add to `.env`: `OPENROUTER_API_KEY=sk_xxxxx`
5. Run `npm run dev` again

### Port already in use
```bash
# Option 1: Stop other process using port
# Option 2: Change PORT in .env to 5000 or 8000
PORT=5000
```

### MongoDB connection error
- Use MongoDB Atlas (cloud): https://mongodb.com/cloud/atlas
- Or install local MongoDB: https://www.mongodb.com/try/download/community

---

## What Gets Started

`npm run dev` starts:

1. **Backend Server** (Port 4000)
   - Express.js API
   - MongoDB connection
   - AI routes via OpenRouter
   - Auto-restart on file changes (nodemon)

2. **Frontend Client** (Port 5173)
   - React + Vite
   - Hot reload on save
   - Connects to http://localhost:4000 API

**Both share the same `.env` file from root directory**

---

## Stop Services

Press `Ctrl+C` in terminal to stop both

---

## That's It!

Happy coding! 🐦
