# Frontend Error & Branding Fix

## Issues Fixed

### 1. **"Error generating response" Error**
- **Root Cause**: Frontend was calling non-existent endpoints (`/text-generate`, `/image-generate`) on wrong API servers
- **Solution**: Updated `useAI.js` to call the correct local server endpoint `/api/ai/chat`

### 2. **Brand Name Exposure**
- **Issue**: Frontend was showing "Powered by Cloudflare Workers AI, SerpAPI" 
- **Fix**: Removed all external brand references, now only mentions "Chirp"

### 3. **Missing AI Routes**
- **Issue**: Server had AI functions but routes weren't imported
- **Solution**: Added AI routes to server.js, converted to ES6 modules

## Environment Setup

### 1. **Client Environment Variables**

Create or update `client/.env.local`:

```env
VITE_SERVER_URL=http://localhost:4000
# OR for production:
# VITE_SERVER_URL=https://your-production-server.com
```

### 2. **Server Environment Variables**

Create or update `server/.env`:

```env
# Database
MONGO_URI=mongodb://your-mongodb-uri

# OpenRouter AI (Required for AI features)
OPENROUTER_API_KEY=sk_xxxxxxxxxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
FRONTEND_URL=http://localhost:5173

# Port
PORT=4000

# Clerk (if using authentication)
CLERK_SECRET_KEY=sk_test_xxxxx
```

## How to Get OpenRouter API Key

1. Go to https://openrouter.ai
2. Sign up for a free account
3. Navigate to "Keys" or "API Keys"
4. Create a new API key
5. Copy and paste into `server/.env` as `OPENROUTER_API_KEY`

**Free Tier**: OpenRouter provides free access to many models with usage limits

## Running the Application

### Development Mode

**Terminal 1 - Start Server:**
```bash
cd server
npm install  # if not done
npm run dev  # or node server.js
```
Server runs on: `http://localhost:4000`

**Terminal 2 - Start Client:**
```bash
cd client
npm install  # if not done
npm run dev
```
Client runs on: `http://localhost:5173`

### Production Mode

**Server:**
```bash
cd server
npm run build
npm start
```

**Client:**
```bash
cd client
npm run build
# Serve dist folder with your hosting provider
```

## API Endpoints

### Chat Endpoint
- **URL**: `/api/ai/chat`
- **Method**: POST
- **Authentication**: Clerk auth (via middleware)
- **Request Body**:
```json
{
  "message": "your prompt here",
  "model": "IMAGE" | "GENERAL" (optional),
  "systemContext": "custom system prompt" (optional)
}
```

### Response
- **Success**:
```json
{
  "success": true,
  "response": "generated text or image data"
}
```
- **Error**:
```json
{
  "success": false,
  "response": "error message"
}
```

## Testing AI Features

### 1. Test Text Generation
Open your browser and send a message in the AI Studio. Should receive text response.

### 2. Test Image Generation
Send message containing: "generate", "create", "draw", "image", "photo", "design", etc.

Example: *"Create an image of a sunset over mountains"*

## Troubleshooting

### Error: "Cannot POST /api/ai/chat"
**Solution**: 
- Make sure server is running on port 4000
- Check that AI routes are imported in `server/server.js`
- Verify `server/routes/aiRoutes.js` exists

### Error: "No AI provider API key configured"
**Solution**:
- Get OpenRouter API key from https://openrouter.ai
- Add `OPENROUTER_API_KEY` to `server/.env`
- Restart the server

### Error: "Connection refused localhost:4000"
**Solution**:
- Ensure server process is running
- Check PORT in `server/.env` matches client's `VITE_SERVER_URL`
- Check firewall isn't blocking port 4000

### Error: "Cannot find module"
**Solution**:
```bash
# In server directory:
npm install
rm -rf node_modules package-lock.json
npm install
```

## File Changes Summary

### Modified Files:
1. **`client/src/hooks/useAI.js`**
   - Changed API endpoints from external workers to local `/api/ai/chat`
   - Removed SerpAPI dependency
   - Simplified to use server's AI module

2. **`client/src/pages/AIStudio.jsx`**
   - Removed "Powered by Cloudflare Workers AI, SerpAPI"
   - Changed to "Chirp AI — Your intelligent assistant for creative content"
   - Updated header text

3. **`server/server.js`**
   - Added import for AI routes
   - Mounted AI router at `/api/ai`

4. **`server/routes/aiRoutes.js`**
   - Converted from CommonJS to ES6 modules

5. **`server/lib/ai.js`**
   - Converted from CommonJS to ES6 modules
   - Updated exports

## Architecture

```
┌─────────────┐
│   Frontend  │  (React + Vite)
│  AIStudio   │
└──────┬──────┘
       │ POST /api/ai/chat
       │ (message, systemContext)
       ▼
┌─────────────────────────────────┐
│      Express Server             │
│  ┌───────────────────────────┐  │
│  │   AI Routes (/api/ai)     │  │
│  │  - /chat                  │  │
│  │  - /post-suggestions      │  │
│  │  - /hashtags              │  │
│  │  - /comment-suggestions   │  │
│  └───────┬───────────────────┘  │
│          │ Uses                 │
│  ┌───────▼───────────────────┐  │
│  │   AI Library (ai.js)      │  │
│  │  - aiRequest()            │  │
│  │  - generateImage()        │  │
│  │  - generateHashtags()     │  │
│  └───────┬───────────────────┘  │
└──────────┼──────────────────────┘
           │ API Call
           ▼
    OpenRouter API
    (Multiple Models)
```

## Next Steps

1. **Configure environment variables** in both `client/.env.local` and `server/.env`
2. **Get OpenRouter API key** from https://openrouter.ai
3. **Run both server and client** in separate terminals
4. **Test in browser** by sending messages in AI Studio
5. **Deploy** when ready (see production mode above)

## Support

If you encounter any issues:
1. Check error messages in browser console and server logs
2. Verify all environment variables are set correctly
3. Ensure both server and client are running
4. Try refreshing the page after making changes to .env files
