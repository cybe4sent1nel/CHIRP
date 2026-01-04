# 🐦 Chirp Advanced AI Worker - Deployment Guide

## Overview
**`chirp-advanced-ai-worker.js`** is a powerful Cloudflare Worker with:
- ✅ Smart model auto-selection (text vs image vs vision)
- ✅ Conversation context management (session history)
- ✅ Tool calling (web search, fetch, scrape)
- ✅ Vision capabilities (image analysis)
- ✅ Web scraping & content fetching
- ✅ SerpAPI integration for web search

---

## Deployment Steps

### 1. Create New Cloudflare Worker

1. Go to: https://dash.cloudflare.com/
2. Select your domain/account
3. Click **"Workers & Pages"** → **"Create application"**
4. Click **"Create Worker"**
5. Name it: `chirp-advanced-ai` (you can change this)
6. Click **"Deploy"**

### 2. Copy Worker Code

1. In Cloudflare dashboard, click your worker
2. Click **"Edit code"**
3. Replace all content with code from **`chirp-advanced-ai-worker.js`**
4. Click **"Deploy"**

### 3. Set Environment Variables

In Cloudflare Worker dashboard:

1. Go to **"Settings"** tab
2. Click **"Environment Variables"**
3. Add these variables:

| Variable | Value | Required |
|----------|-------|----------|
| `API_KEY` | Generate a secure token (e.g., `sk_chirp_abc123xyz789`) | ✅ Yes |
| `SERPAPI_KEY` | Your SerpAPI key from https://serpapi.com | ✅ For web search |

**Example values:**
```
API_KEY = sk_chirp_2024_secure_random_token_here
SERPAPI_KEY = abc123def456... (from https://serpapi.com)
```

4. Click **"Deploy"**

### 4. Enable Cloudflare AI

Your worker needs AI binding:

1. Go to **"Settings"** → **"Bindings"**
2. Click **"Add binding"**
3. Select **"AI"** as type
4. Name it: `AI`
5. Click **"Deploy"**

---

## Update Your .env

After deployment, update your `.env` file:

```env
# Old URLs (replace these)
TEXT_API_URL=https://text-api.fahadkhanxyz8816.workers.dev
TEXT_API_BEARER=12341234

# New URLs (from your Cloudflare worker)
TEXT_API_URL=https://chirp-advanced-ai.your-subdomain.workers.dev
TEXT_API_BEARER=sk_chirp_2024_secure_random_token_here

# Keep these (same as before)
IMAGE_API_URL=https://image-api.fahadkhanxyz8816.workers.dev
IMAGE_API_BEARER=12345678
SERPAPI_KEY=[your-serpapi-key]
```

**To find your worker URL:**
1. Go to your worker in Cloudflare
2. Click **"Deployments"** tab
3. Copy the URL (looks like `https://chirp-advanced-ai.your-account.workers.dev`)

---

## Features

### 🔍 Web Search
```javascript
// Automatically triggered when user says "search" or "find"
"search for latest AI trends"
```

### 🖼️ Image Generation
```javascript
"generate a professional profile picture"
"create an anime character"
```

### 👁️ Vision (Image Analysis)
```javascript
"analyze this image and describe what you see"
"extract text from this image"
```

### 💬 Conversation Context
```javascript
// Each request with same sessionId keeps conversation history
{
  "prompt": "Tell me more about that",
  "sessionId": "user123"  // Same sessionId = same conversation
}
```

### 🛠️ Tool Calling
Automatic tool usage for:
- Web search via SerpAPI
- Fetch & parse URLs
- Web scraping
- Current time queries

---

## API Usage

### Request Format
```javascript
// Text generation
{
  "prompt": "Write a professional bio",
  "sessionId": "user123",
  "type": "text",
  "tools": true
}

// Image generation
{
  "prompt": "Create a beautiful landscape",
  "type": "image"
}

// Vision (analyze image)
{
  "prompt": "What's in this image?",
  "type": "vision",
  "image": "base64-encoded-image-data",
  "sessionId": "user123"
}

// With web search
{
  "prompt": "Search for latest React trends",
  "tools": true,
  "sessionId": "user123"
}
```

### Response Format
```javascript
{
  "success": true,
  "response": "Generated text or tool result",
  "model": "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "sessionId": "user123",
  "contextMessages": 5,
  "usedTool": false
}
```

---

## Testing

### Test with cURL
```bash
curl -X POST https://chirp-advanced-ai.your-account.workers.dev \
  -H "Authorization: Bearer sk_chirp_2024_secure_random_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello, introduce yourself",
    "sessionId": "test-user",
    "type": "text"
  }'
```

### Test with Postman
1. Create POST request
2. URL: `https://chirp-advanced-ai.your-account.workers.dev`
3. Header: `Authorization: Bearer sk_chirp_2024_...`
4. Body (JSON):
```json
{
  "prompt": "What is machine learning?",
  "sessionId": "postman-test",
  "type": "text"
}
```

---

## Model Selection Logic

The worker automatically picks the best model based on your prompt:

| Prompt Type | Models Used | Reason |
|------------|-----------|--------|
| Code/Programming | Llama 3.3 70B, DeepSeek | Better code understanding |
| Long/Complex | Llama 3.3 70B | More powerful reasoning |
| Short/Quick | Mistral 7B, Llama 3 8B | Faster response |
| Image Generation | Flux, Stable Diffusion | Quality images |
| Vision/Analysis | Llama 3.2 11B Vision | Image understanding |

---

## Troubleshooting

### "Unauthorized" Error
- Check your `API_KEY` in worker settings
- Verify `Authorization` header matches: `Bearer YOUR_API_KEY`

### "SERPAPI_KEY not configured"
- Add `SERPAPI_KEY` to worker environment variables
- Get key from https://serpapi.com

### AI Binding Not Working
- Ensure you added AI binding in worker settings
- Binding name must be `AI` (case-sensitive)

### Context Lost
- Make sure you're using same `sessionId` for continued conversations
- Sessions expire after 1 hour of inactivity

---

## Integration with Chirp App

Update `server/lib/ai.js`:

```javascript
const workerUrl = process.env.TEXT_API_URL; // Now points to advanced worker
const workerKey = process.env.TEXT_API_BEARER;

if (workerUrl && workerKey) {
  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${workerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        systemPrompt,
        sessionId: userId, // Use user ID as session
        type: 'text',
        tools: true, // Enable tools
      }),
    });
    // ... rest of code
  }
}
```

---

## Performance Tips

1. **Use sessionId**: Keeps conversation context, improves follow-ups
2. **Set type correctly**: `image`, `text`, or `vision` - faster model selection
3. **Enable tools selectively**: Only when you need web search
4. **Monitor token usage**: Cloudflare AI has free quotas

---

## Next Steps

1. ✅ Copy `chirp-advanced-ai-worker.js`
2. ✅ Deploy to Cloudflare Worker
3. ✅ Set environment variables
4. ✅ Update `.env` with new worker URL
5. ✅ Test with cURL or Postman
6. ✅ Restart your app: `npm run dev`

---

## Support

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare AI: https://developers.cloudflare.com/workers-ai/
- SerpAPI: https://serpapi.com/docs
