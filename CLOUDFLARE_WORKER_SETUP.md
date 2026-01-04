# Cloudflare Workers AI Setup

This guide explains how to deploy the AI worker to Cloudflare to power text and image generation.

## Architecture

```
Client → Backend Server → Cloudflare Worker
                              ↓
                         Cloudflare AI
                    (Text + Image Models)
```

## Prerequisites

1. **Cloudflare Account** - Sign up at https://dash.cloudflare.com
2. **Wrangler CLI** - Install with `npm install -g wrangler`
3. **API Key** - Generate a unique API key for authentication

## Step 1: Setup Cloudflare Worker

### 1.1 Create a Worker

```bash
# Install wrangler if not already installed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create a new worker project
wrangler init chirp-ai-worker
cd chirp-ai-worker
```

### 1.2 Copy Worker Code

Replace the content of `src/index.js` with the code from `/worker/index.js` in this project.

### 1.3 Update `wrangler.toml`

```toml
name = "chirp-ai-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"

[env.production]
vars = { API_KEY = "your-secure-api-key-here" }

[triggers]
crons = ["0 0 * * *"]

[[ai]]
binding = "AI"

[[env.production.ai]]
binding = "AI"
```

### 1.4 Generate a Secure API Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save this key - you'll need it in your `.env` file.

## Step 2: Configure Your Backend

Add these to your `.env` file:

```env
# Cloudflare Worker Configuration
CLOUDFLARE_WORKER_URL=https://your-worker-name.your-subdomain.workers.dev
CLOUDFLARE_WORKER_API_KEY=your-generated-api-key

# Or if using old env variable names
TEXT_API_URL=https://your-worker-name.your-subdomain.workers.dev/text
TEXT_API_KEY=your-generated-api-key
IMAGE_API_URL=https://your-worker-name.your-subdomain.workers.dev/image
IMAGE_API_KEY=your-generated-api-key
```

## Step 3: Deploy Worker

```bash
# From the worker directory
wrangler deploy

# Or with environment
wrangler deploy --env production
```

After deployment, you'll see:
```
✓ Uploaded chirp-ai-worker (1.23 MB)
✓ Published chirp-ai-worker
  https://chirp-ai-worker.your-subdomain.workers.dev
```

## Step 4: Test the Worker

### Test Text Generation

```bash
curl -X POST https://chirp-ai-worker.your-subdomain.workers.dev/text \
  -H "Authorization: Bearer your-generated-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a professional bio for a software engineer",
    "systemPrompt": "You are a helpful assistant"
  }'
```

Expected response:
```json
{
  "response": "Professional bio text here..."
}
```

### Test Image Generation

```bash
curl -X POST https://chirp-ai-worker.your-subdomain.workers.dev/image \
  -H "Authorization: Bearer your-generated-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains"
  }' \
  --output generated-image.png
```

## Step 5: Monitor Worker

```bash
# View recent logs
wrangler tail

# View worker analytics
wrangler analytics engine query
```

## Available Models

### Text Models

- `@cf/meta/llama-3.3-70b-instruct-fp8-fast` - Complex reasoning
- `@cf/qwen/qwen-2.5-72b-instruct` - Technical/coding
- `@cf/mistral/mistral-7b-instruct-v0.2` - Quick responses
- `@cf/meta/llama-3.1-8b-instruct-fp8` - Balanced (default)

### Image Models

- `@cf/stability/stable-diffusion` - Photo-realistic
- `@cf/stability/stable-diffusion-xl-lightning` - Stylized/artistic
- `@cf/stability/stable-diffusion-xl-base-1.0` - Default

## Pricing

- **Text Generation**: $0.05 per 1M tokens
- **Image Generation**: $0.08 per image
- **First 10,000 daily requests**: FREE

See https://developers.cloudflare.com/workers-ai/pricing/ for details.

## Fallbacks & Error Handling

If the worker is unavailable:

1. The backend falls back to **OpenRouter** (if configured)
2. If OpenRouter also unavailable, returns graceful error
3. News endpoint returns cached/fallback news data

## Troubleshooting

### "Unauthorized" Error
- Check your API key matches in both `wrangler.toml` and `.env`
- Verify `Authorization: Bearer` header is correct

### "Model Not Found" Error
- Ensure your Cloudflare account has Workers AI enabled
- Check model names are correct and supported
- Fallback to OpenRouter by removing `TEXT_API_URL`

### Worker Timeout
- Large models take longer - increase timeout in `wrangler.toml`
- Use smaller models for faster responses
- Consider streaming responses for long generations

### Rate Limiting
- Free tier: 100,000 requests/day
- Upgrade if you exceed this limit
- Add request caching where possible

## Advanced Configuration

### Enable RAG (Retrieval-Augmented Generation)

Add to `.env`:
```env
TEXT_RAG_ENABLED=true
```

Create `.rag_store.json` with your documents:
```json
[
  { "id": "1", "text": "Your document content here" },
  { "id": "2", "text": "Another document" }
]
```

### Custom System Prompts

Modify the system prompt in the worker for specific use cases:
```javascript
const systemPrompt = `You are Chirp AI, a professional networking assistant...`;
```

### Environment-Specific Configuration

```toml
[env.staging]
vars = { API_KEY = "staging-key-here" }

[env.production]
vars = { API_KEY = "production-key-here" }
```

Deploy to specific environment:
```bash
wrangler deploy --env production
```

## Migration from OpenRouter

If you're currently using OpenRouter and want to switch to Cloudflare Workers:

1. Deploy the worker with the code above
2. Update your `.env`:
   ```env
   # Disable OpenRouter
   # OPENROUTER_API_KEY=...
   
   # Enable Cloudflare Worker
   TEXT_API_URL=https://your-worker.workers.dev/text
   TEXT_API_BEARER=your-api-key
   IMAGE_API_URL=https://your-worker.workers.dev/image
   IMAGE_API_BEARER=your-api-key
   ```
3. Restart your application
4. The system will automatically use Cloudflare Workers

## Support

- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Cloudflare AI Docs: https://developers.cloudflare.com/workers-ai/
- Debug tool: `wrangler dev` (local testing)

## Next Steps

1. ✅ Deploy the worker
2. ✅ Update `.env` with worker URL and API key
3. ✅ Test the worker endpoints
4. ✅ Monitor usage and performance
5. ✅ Adjust models based on latency/accuracy needs
