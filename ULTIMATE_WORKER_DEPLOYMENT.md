# 🐦 CHIRP AI ULTIMATE WORKER - COMPLETE DEPLOYMENT GUIDE

## Overview

**`chirp-ai-worker-ultimate.js`** is a production-ready Cloudflare Worker with:

✅ **Session Management** - Persistent conversation context (30 message history)  
✅ **Smart Model Selection** - Auto-picks best model for task (text/image/vision)  
✅ **Text Generation** - Multi-model support with streaming  
✅ **Image Generation** - Stable Diffusion, Flux, DreamShaper  
✅ **Vision Analysis** - Image understanding & OCR  
✅ **Web Search** - SerpAPI integration (10 results per query)  
✅ **Web Scraping** - Fetch & parse URLs  
✅ **Tool Calling** - Auto-execute tools based on prompt intent  
✅ **Developer Info** - Auto-responds to questions about creator (Fahad Khan)  
✅ **Robust Error Handling** - Timeout protection, fallbacks  
✅ **Rate Limiting** - 100 requests/minute  
✅ **Memory Management** - Auto-cleanup of expired sessions  
✅ **Comprehensive Logging** - Debug & monitor requests  

---

## Deployment Steps

### Step 1: Create New Cloudflare Worker

1. Go to: https://dash.cloudflare.com/
2. Select your domain
3. Click **"Workers & Pages"** → **"Create application"**
4. Click **"Create Worker"**
5. Name: `chirp-ai-ultimate` (or your choice)
6. Click **"Deploy"**

### Step 2: Copy Worker Code

1. Open your new worker in Cloudflare dashboard
2. Click **"Edit code"** button
3. Delete ALL existing code
4. Copy entire content from **`chirp-ai-worker-ultimate.js`**
5. Paste into editor
6. Click **"Deploy"**

### Step 3: Add AI Binding (Critical)

**This is required for the worker to function:**

1. In your worker, go to **"Settings"** tab
2. Scroll to **"Bindings"** section
3. Click **"Add binding"**
4. Type: Select **"AI"** from dropdown
5. Name: `AI` (exactly, case-sensitive)
6. Click **"Deploy"**

### Step 4: Add Environment Variables

**Optional but recommended for web search:**

1. Go to **"Settings"** tab
2. Find **"Environment Variables"** section
3. Click **"Add variable"**
4. Name: `SERPAPI_KEY`
5. Value: Your SerpAPI key (from https://serpapi.com)
6. Click **"Deploy"**

### Step 5: Get Your Worker URL

1. Go to **"Deployments"** tab
2. Copy the URL (looks like `https://chirp-ai-ultimate.xxx.workers.dev`)
3. Save this URL - you'll need it

---

## Update Your Application

### Update `.env`

```env
TEXT_API_URL=https://chirp-ai-ultimate.xxx.workers.dev
TEXT_API_BEARER=12344321
```

Replace `xxx.workers.dev` with your actual worker domain.

### Restart Your App

```bash
npm run dev
```

---

## API Usage

### Request Format

**Text Generation:**
```json
{
  "prompt": "Write a professional bio",
  "sessionId": "user123",
  "type": "text",
  "tools": true
}
```

**Image Generation:**
```json
{
  "prompt": "Create a beautiful sunset landscape",
  "sessionId": "user123",
  "type": "image"
}
```

**Vision (Analyze Image):**
```json
{
  "prompt": "What's in this image?",
  "sessionId": "user123",
  "type": "vision",
  "image": "base64-encoded-image"
}
```

**Web Search:**
```json
{
  "prompt": "Search for latest AI trends 2025",
  "sessionId": "user123",
  "tools": true
}
```

**With Full Context:**
```json
{
  "prompt": "Tell me more about that",
  "sessionId": "user123",
  "type": "text",
  "systemPrompt": "You are an expert AI consultant",
  "tools": true,
  "maxTokens": 2048
}
```

### Response Format

**Success:**
```json
{
  "success": true,
  "response": "Generated text or image URL",
  "model": "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "sessionId": "user123",
  "contextSize": 5,
  "usedTool": null,
  "type": "text"
}
```

**With Tool Used:**
```json
{
  "success": true,
  "response": "Tool Result: ...",
  "usedTool": "web_search",
  "sessionId": "user123",
  "contextSize": 6
}
```

**Error:**
```json
{
  "error": "AI binding not configured",
  "sessionId": "user123"
}
```

---

## Model Selection Logic

The worker **automatically picks the best model** based on your prompt:

| Prompt Contains | Type | Model Selected |
|-----------------|------|----------------|
| "code" / "python" | Text | DeepSeek (best for coding) |
| "explain" / "research" | Text | Llama 3.3 70B (reasoning) |
| "quick" / "brief" | Text | Mistral 7B (fast) |
| "default" | Text | Llama 3.3 70B (quality) |
| "generate image" / "create" | Image | Flux (quality) |
| "anime" / "cartoon" | Image | DreamShaper (stylized) |
| "analyze" / "what's in image" | Vision | Llama 3.2 Vision |

---

## Features In Detail

### 1. Session Management

Sessions persist conversation context:

```javascript
// First request
{ "prompt": "What's AI?", "sessionId": "user123" }
// Response includes AI explanation

// Follow-up request
{ "prompt": "Tell me more", "sessionId": "user123" }
// Model remembers previous context
```

**Auto Cleanup:**
- Sessions expire after 1 hour of inactivity
- Keeps last 30 messages per session
- Memory is cleaned up automatically

### 2. Tool Calling

Tools execute automatically based on prompt:

**Web Search** - Triggered by: "search", "find", "latest", "trending"
```
Prompt: "Search for latest AI news"
→ Returns: Top 5 search results
```

**URL Fetch** - Triggered by: "fetch", "read", URL in prompt
```
Prompt: "Fetch https://example.com and summarize"
→ Returns: Website title, content, metadata
```

**Web Scraping** - Triggered by: "scrape", URL in prompt
```
Prompt: "Scrape https://example.com"
→ Returns: Clean text content
```

### 3. Vision & Image Generation

**Image Analysis:**
```
Prompt: "Analyze this image"
Image: base64-encoded-image
→ Returns: Detailed analysis
```

**Image Generation:**
```
Prompt: "Create a parrot painting"
→ Returns: Image URL or base64 image data
```

### 4. Developer Information

The worker automatically responds when asked about the creator:

**Questions it recognizes:**
- "Who created Chirp?"
- "Who made this?"
- "Tell me about Fahad Khan"
- "Who is cybe4sent1nel?"
- "Who is the developer?"
- "Who built this?"

**Responds with:**
```
🐦 Chirp AI was created by Fahad Khan (@cybe4sent1nel)

About the Developer:
- Title: Full Stack Developer
- Specialization: Full Stack Development, AI Integration, Cloud Architecture
- Description: Creator of Chirp - A Full Stack Social Media Platform with Advanced AI Integration

Connect:
- GitHub: https://github.com/cybe4sent1nel
- Portfolio: https://fahadkhan.dev
- Email: contact@fahadkhan.dev
```

**Features mentioned:**
- Real-time messaging with SSE
- Advanced AI studio for content generation
- Image generation and vision analysis
- Web search and scraping capabilities
- Professional social networking features
- Cloud-based infrastructure on Cloudflare

### 5. Context Awareness

Each message includes conversation history:

```
Request 1: "Who won the World Cup?"
Response: "Brazil won in 2002..."

Request 2: "Tell me about them"
→ Model remembers it's about Brazil
Response: "Brazil has won 5 World Cups..."
```

---

## Testing

### Test with cURL

```bash
curl -X POST "https://your-worker.workers.dev" \
  -H "Authorization: Bearer 12344321" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello, who are you?","sessionId":"test","type":"text"}'
```

### Test with PowerShell

```powershell
$uri = "https://your-worker.workers.dev"
$headers = @{
  "Authorization" = "Bearer 12344321"
  "Content-Type" = "application/json"
}
$body = @{
  prompt = "Write a poem about AI"
  sessionId = "test"
  type = "text"
} | ConvertTo-Json

Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body $body
```

### Test with Postman

1. Create POST request
2. URL: `https://your-worker.workers.dev`
3. Headers:
   - `Authorization: Bearer 12344321`
   - `Content-Type: application/json`
4. Body (JSON):
```json
{
  "prompt": "What is machine learning?",
  "sessionId": "postman-test",
  "type": "text",
  "tools": true
}
```

---

## Advanced Configuration

### Customize Session Timeout

Edit in worker code:
```javascript
CONFIG.SESSION_TIMEOUT = 7200000; // 2 hours
```

### Customize History Size

```javascript
CONFIG.MAX_HISTORY_SIZE = 50; // Keep 50 messages
```

### Disable Tools

```javascript
// In request
{ "prompt": "...", "tools": false }
```

### Custom System Prompt

```javascript
{
  "prompt": "Help me write",
  "systemPrompt": "You are a professional copywriter specializing in marketing.",
  "type": "text"
}
```

---

## Troubleshooting

### "AI binding not configured"
- Go to worker Settings → Bindings
- Verify binding named `AI` exists
- Binding type must be `AI` (not Text, not D1)
- Click Deploy

### "Unauthorized"
- Check `API_KEY` in worker Environment Variables
- Verify Authorization header matches: `Bearer YOUR_API_KEY`

### "Image generation returned no data"
- Try simpler prompts: "a cat" instead of complex descriptions
- Some models have different response formats
- Check worker logs for details

### Model Not Selected
- Ensure AI binding is configured
- Check prompt is not empty
- Verify type parameter if needed

### Session Not Persisting
- Use same `sessionId` in follow-up requests
- Session expires after 1 hour of inactivity
- Max 30 messages kept per session

---

## Performance Tips

1. **Use sessionId** - Enables context awareness, improves follow-ups
2. **Set type correctly** - `"text"`, `"image"`, or `"vision"` for faster routing
3. **Enable tools selectively** - Only when you need them
4. **Shorter prompts** - Better performance for quick tasks
5. **Monitor logs** - Enable `ENABLE_LOGGING` in CONFIG for debugging

---

## Monitoring & Logging

Worker logs appear in Cloudflare dashboard:

1. Go to your worker
2. Click **"Logs"** tab
3. See all requests, errors, and tool usage

Log levels:
- `INFO` - Normal operations
- `WARN` - Authorization failures
- `ERROR` - Processing errors

---

## Rate Limiting

- **100 requests per minute** per session (configurable)
- Auto-cleanup prevents memory overflow
- Older sessions removed after 1 hour inactivity

---

## Next Steps

1. ✅ Copy `chirp-ai-worker-ultimate.js`
2. ✅ Deploy to Cloudflare
3. ✅ Add AI Binding
4. ✅ Add SERPAPI_KEY (optional)
5. ✅ Update `.env` with worker URL
6. ✅ Restart app: `npm run dev`
7. ✅ Test in AI Studio or via API

---

## Support

- **Cloudflare Docs:** https://developers.cloudflare.com/workers/
- **Cloudflare AI:** https://developers.cloudflare.com/workers-ai/
- **SerpAPI:** https://serpapi.com/docs

---

**Your Ultimate AI Worker is ready. Deploy and enjoy! 🚀**
