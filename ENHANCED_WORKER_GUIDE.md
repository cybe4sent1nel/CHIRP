# Enhanced Cloudflare Worker - Setup & Features

## New Features

### 1. **Intelligent Model Selection**
- Automatically analyzes query to select optimal model
- Considers query complexity, type, length, and style
- Balances quality vs speed based on intent
- Supports quality/speed preference overrides

### 2. **Automatic Image Detection & Routing**
- Detects image generation requests from natural language
- Automatically routes to image models when detected
- Selects best image model based on style (photorealistic vs stylized)
- Supports: Stable Diffusion, Flux models

### 3. **Advanced Query Analysis**
The worker analyzes queries for:
- **Intent**: Code, creative, technical, complex reasoning
- **Type**: Image generation, vision/analysis, text, search
- **Complexity**: Auto-scales model size based on query complexity
- **Style**: Photorealistic vs stylized (for images)
- **Search intent**: Detects when web search is needed

### 4. **Multi-Provider Web Search**
Intelligent search with fallback chain:
1. **SerpAPI** (best quality) - https://serper.dev
2. **Bing Search** (reliable) - https://www.microsoft.com/bing/apis
3. **Brave Search** (free) - https://api.search.brave.com

Features:
- Automatic provider fallback on failure
- 10 result limit per search
- 10-second timeout per provider
- Rich metadata (title, snippet, URL, source)

### 5. **Robust Error Handling**
- Automatic retry with exponential backoff
- Configurable retry count (default: 2)
- Configurable timeout (default: 30s)
- Detailed error messages for debugging

### 6. **Enhanced Image Generation**
- Configurable dimensions (width, height)
- Seed support for reproducible images
- Guidance scale & step control
- Negative prompt support
- Automatic retry on failure

## API Usage

### Text Generation (Auto-Model Selection)
```bash
curl -X POST https://your-worker.dev/ \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in simple terms",
    "systemPrompt": "You are a helpful assistant",
    "freePreferred": true,
    "maxRetries": 2
  }'
```

### Image Generation (Auto-Detect)
```bash
curl -X POST https://your-worker.dev/ \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene landscape with mountains at sunset, photorealistic",
    "width": 1024,
    "height": 1024,
    "steps": 30,
    "guidance_scale": 7.5,
    "negative_prompt": "blurry, low quality",
    "seed": 42
  }'
```

### Web Search
```bash
curl -X POST https://your-worker.dev/ \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "latest AI breakthroughs 2024",
    "tool": "search"
  }'
```

### Complex Query with Search
```bash
curl -X POST https://your-worker.dev/ \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What are the current best practices for REST API design?"
  }'
```

### Vision/Image Analysis
```bash
curl -X POST https://your-worker.dev/ \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is in this image?",
    "image": "data:image/jpeg;base64,...",
    "vision": true
  }'
```

### Image Generation with Explicit Type
```bash
curl -X POST https://your-worker.dev/ \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "futuristic city with flying cars",
    "type": "image",
    "width": 1024,
    "height": 768
  }'
```

## Setup Instructions

### 1. Install Wrangler CLI
```bash
npm install -g @cloudflare/wrangler
# or
npm install -g wrangler
```

### 2. Configure Environment Variables

Edit `worker/wrangler.toml`:

```toml
[vars]
# REQUIRED: Your API key (change this!)
API_KEY = "your-secret-api-key-change-this"

# OPTIONAL: Search providers (choose at least one)
SERPAPI_KEY = "your-serpapi-key"
SEARCH_API_KEY = "your-bing-search-key"
BRAVE_API_KEY = "your-brave-search-key"
```

### 3. Get Search API Keys (Optional but Recommended)

**SerpAPI** (recommended):
- Go to https://serper.dev
- Sign up and get your API key
- Copy to `SERPAPI_KEY` in wrangler.toml

**Bing Search**:
- Go to https://www.microsoft.com/en-us/bing/apis/bing-web-search-api
- Create a resource in Azure
- Copy key to `SEARCH_API_KEY`

**Brave Search**:
- Go to https://api.search.brave.com
- Sign up and get your API key
- Copy to `BRAVE_API_KEY`

### 4. Deploy Worker

```bash
cd worker
wrangler publish
# or
wrangler deploy
```

### 5. Test the Worker

```bash
# Set your deployed URL and API key
export WORKER_URL="https://your-worker.workers.dev"
export API_KEY="your-secret-api-key"

# Test text generation
curl -X POST $WORKER_URL \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello! What can you do?"}'

# Test image generation
curl -X POST $WORKER_URL \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a beautiful sunset over mountains"}'

# Test web search
curl -X POST $WORKER_URL \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"search the web for AI news 2024"}'
```

## Model Selection Strategy

### Text Models (Auto-Selected)
- **Complexity > 7 or Long Prompts (>1000 chars)**: `llama-3.3-70b-instruct` (premium quality)
- **Code/Technical**: `llama-3-8b` or `mistral-7b` (balanced)
- **Creative Writing**: Medium+ models (quality-focused)
- **Quick Tasks (<100 chars)**: Fast small models (`qwen`, `falcon`)
- **Default**: Balanced quality model

### Image Models (Auto-Selected)
- **Photorealistic**: Stable Diffusion (fast, high quality)
- **Stylized/Creative**: Flux (premium, artistic)
- **Default**: Stable Diffusion XL Lightning (free, fast)

## Query Analysis Features

The worker detects:
```
✓ Image generation requests
✓ Code/technical queries
✓ Creative writing requests
✓ Complex reasoning tasks
✓ Web search intent
✓ Vision/image analysis requests
✓ Query complexity level
✓ Estimated token count
✓ Optimal model tier
```

## Advanced Options

### Request Parameters
```json
{
  "prompt": "string (required)",
  "systemPrompt": "string (optional)",
  "history": "array (optional)",
  "type": "image|text (optional)",
  "vision": "boolean (optional)",
  "image": "base64 or URL (optional)",
  "tool": "search (optional)",
  "q": "string (search query, optional)",
  "freePreferred": "boolean (default: true)",
  "maxRetries": "number (default: 2)",
  "timeout": "number in ms (default: 30000)",
  
  "width": "number (image)",
  "height": "number (image)",
  "steps": "number (image, default: 20)",
  "guidance_scale": "number (image, default: 7.5)",
  "negative_prompt": "string (image)",
  "seed": "number (image, optional)"
}
```

### Response Format
```json
{
  "response": "generated content or search results",
  "model": "selected model ID",
  "analysis": {
    "isImage": "boolean",
    "isCode": "boolean",
    "isComplex": "boolean",
    "complexity": "0-10 score",
    "tokens": "estimated token count"
  },
  "provider": "search provider used (search only)",
  "attempt": "retry count"
}
```

## Troubleshooting

### Model Not Found
- Check Cloudflare Workers AI availability in your region
- Verify model IDs are correct
- Check CF account has Workers AI enabled

### Search Failing
- Verify at least one search API key is configured
- Check API key validity
- Ensure network connectivity
- Try different provider (will fallback automatically)

### Timeout Issues
- Increase `timeout` parameter in request
- Use `freePreferred: true` for faster models
- Check Cloudflare Worker CPU limits
- Monitor analytics in Cloudflare dashboard

### Image Generation Slow
- Use `stable-diffusion-xl-lightning` (faster)
- Reduce `steps` to 15-20
- Use smaller dimensions (768x768)
- Enable retries (default: 2)

## Performance Tips

1. **Use free models when possible** - Nearly same quality, much faster
2. **Prefer smaller models** for quick tasks - Sub-second latency
3. **Cache results** if possible - Reduce API calls
4. **Use negative prompts** for images - Better quality
5. **Adjust guidance scale** - Lower = faster, Higher = more detailed

## Support & Limits

- Max request size: 20 MB (CF Worker limit)
- Max execution time: 30 seconds
- Image size limit: 1024x1024 (CF Worker AI)
- Search results: 10 per request
- Retry attempts: 2 (configurable)

## Version History

- **v2.0** - Enhanced model selection, intelligent routing, multi-provider search
- **v1.0** - Basic text/image generation
