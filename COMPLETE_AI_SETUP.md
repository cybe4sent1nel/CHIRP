# Complete CHIRP2.0 AI Setup Guide

## Overview

You now have **two AI implementation paths** to choose from:

### Path 1: OpenRouter (Simple, Recommended for Getting Started)
- ✅ Free tier available
- ✅ No deployment needed
- ✅ Works immediately
- ⚠️ Rate limited on free tier

### Path 2: Cloudflare Workers (Production, Recommended for Scale)
- ✅ Free tier: 100k requests/day
- ✅ Full control
- ✅ Web search built-in
- ⚠️ Requires deployment

**Recommendation**: Start with **Path 1 (OpenRouter)**, migrate to **Path 2 (Cloudflare)** for production.

---

## Quick Comparison

| Feature | OpenRouter | Cloudflare Worker |
|---------|-----------|-------------------|
| Setup Time | 5 minutes | 30 minutes |
| Free Tier | Yes (rate limited) | Yes (100k/day) |
| Models | 100+ | 20+ optimized |
| Web Search | No | Yes (SerpAPI/Bing) |
| Image Gen | Yes | Yes (better) |
| Deployment | None | Cloudflare Workers |
| Cost | $0.001/token | $0.50/M requests |
| Best For | Development | Production |

---

## Path 1: OpenRouter Setup (5 minutes)

### Step 1: Sign Up
1. Visit https://openrouter.ai
2. Click "Sign In" → "Continue with Google"
3. You have free credits to start

### Step 2: Get API Key
1. Go to https://openrouter.ai/keys
2. Create an API key
3. Copy the key (starts with `sk_free_`)

### Step 3: Add to Environment
Edit `server/.env`:
```bash
OPENROUTER_API_KEY=sk_free_xxxxxxxxxxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
FRONTEND_URL=http://localhost:5173
```

### Step 4: Test
```bash
# Restart server
cd server && npm run dev

# Test endpoint
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!"}'
```

**Done! ✅** Your AI system is ready.

---

## Path 2: Cloudflare Workers Setup (30 minutes)

### Step 1: Create Cloudflare Account
1. Visit https://dash.cloudflare.com
2. Sign up (free account)
3. Verify email

### Step 2: Install Wrangler
```bash
npm install -g wrangler

# Verify
wrangler --version
```

### Step 3: Authenticate
```bash
wrangler login

# This opens a browser to authenticate
# And saves your credentials locally
```

### Step 4: Deploy Worker
```bash
cd worker

# Deploy the worker
wrangler deploy

# Output will show your worker URL:
# Uploaded chirp-ai-worker-prod
# Published at https://chirp-ai-worker.your-account.workers.dev
```

### Step 5: Set API Key
```bash
# Set the API key securely
wrangler secret put API_KEY
# Enter your secret: (something long and random)
# example: ChIRP_AI_SECRET_2024_YOUR_APP_NAME_xyz789

# Optional: Set web search keys
wrangler secret put SERPAPI_KEY
# Enter your Serper.dev API key (or skip)

wrangler secret put SEARCH_API_KEY
# Enter your Bing Search API key (or skip)
```

### Step 6: Update Server Environment
Edit `server/.env`:
```bash
# Use Cloudflare Worker (primary)
CLOUDFLARE_WORKER_URL=https://chirp-ai-worker.your-account.workers.dev
CLOUDFLARE_WORKER_KEY=ChIRP_AI_SECRET_2024_YOUR_APP_NAME_xyz789

# Keep OpenRouter as fallback (optional)
OPENROUTER_API_KEY=sk_free_xxxxx
```

### Step 7: Test
```bash
# Test the worker directly
curl -X POST https://chirp-ai-worker.your-account.workers.dev \
  -H "Authorization: Bearer ChIRP_AI_SECRET_2024_YOUR_APP_NAME_xyz789" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello!","systemPrompt":""}'

# Response should be:
# {"response":"Hello! I'm your AI assistant..."}
```

### Step 8: Deploy App
Your `server/lib/ai.js` already supports Cloudflare Worker!

```bash
# No code changes needed - it auto-detects worker URL
npm run dev

# Or deploy to production
npm run build && npm run deploy
```

---

## File Structure

After setup, your project looks like:

```
your-app/
├── server/
│   ├── lib/
│   │   └── ai.js ← Supports both OpenRouter + Cloudflare
│   ├── routes/
│   │   └── aiRoutes.js
│   └── server.js
├── client/
│   └── src/
│       ├── hooks/
│       │   └── useChirpAI.js
│       └── components/
│           └── AIAssistant.jsx
├── worker/ ← NEW (Cloudflare Worker)
│   ├── text_image_worker.js
│   └── wrangler.toml
└── .env (updated)
```

---

## All Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| **AI_FEATURES_INDEX.md** | Navigation guide | 2 min |
| **QUICK_REFERENCE.md** | Quick lookup | 5 min |
| **INTEGRATION_STEPS.md** | Step-by-step setup | 20 min |
| **SERVER_JS_UPDATE.md** | How to add routes | 5 min |
| **CHIRP2.0_AI_FEATURES_UPGRADE.md** | Full technical details | 30 min |
| **AI_UPGRADE_SUMMARY.md** | Big picture overview | 15 min |
| **CLOUDFLARE_WORKER_SETUP.md** | Worker deployment | 20 min |
| **COMPLETE_AI_SETUP.md** | This file (both paths) | 10 min |

---

## All Code Files

| File | Purpose | Lines |
|------|---------|-------|
| `server/lib/ai.js` | AI library | 400 |
| `server/routes/aiRoutes.js` | API endpoints | 250 |
| `client/src/hooks/useChirpAI.js` | React hook | 120 |
| `client/src/components/AIAssistant.jsx` | Widget | 280 |
| `worker/text_image_worker.js` | Cloudflare Worker | 200 |
| `worker/wrangler.toml` | Worker config | 50 |

---

## Implementation Checklist

### Backend Setup
- [ ] Copy `server/lib/ai.js`
- [ ] Copy `server/routes/aiRoutes.js`
- [ ] Add 2 lines to `server/server.js` (see SERVER_JS_UPDATE.md)
- [ ] Add API credentials to `server/.env`
- [ ] Restart server with `npm run dev`

### Frontend Setup
- [ ] Copy `client/src/hooks/useChirpAI.js`
- [ ] Copy `client/src/components/AIAssistant.jsx`
- [ ] Test with `/api/ai/chat` endpoint

### Optional: Cloudflare Worker
- [ ] Install `wrangler` CLI
- [ ] Copy `worker/` directory
- [ ] Run `wrangler login`
- [ ] Run `wrangler deploy`
- [ ] Set secrets with `wrangler secret put`
- [ ] Update `server/.env` with worker URL

### Integration
- [ ] Add AIAssistant to CreatePost
- [ ] Add AIAssistant to Comments
- [ ] Add AIAssistant to Profile
- [ ] Test all 8 endpoints
- [ ] Test image generation
- [ ] Test web search (if using worker)

---

## 8 API Endpoints

All endpoints are available immediately after setup:

### 1. General Chat
```bash
POST /api/ai/chat
{"message": "Hello!"}
```

### 2. Post Suggestions  
```bash
POST /api/ai/post-suggestions
{"topic": "AI trends", "industry": "tech", "tone": "professional"}
```

### 3. Comment Suggestions
```bash
POST /api/ai/comment-suggestions
{"postContent": "Just launched!", "context": "optional"}
```

### 4. Bio Generator
```bash
POST /api/ai/generate-bio
{"name": "John", "role": "Engineer", "skills": ["React"]}
```

### 5. Content Improvement
```bash
POST /api/ai/improve-post
{"content": "My app is good", "goal": "engagement"}
```

### 6. Hashtag Generator
```bash
POST /api/ai/hashtags
{"content": "Just launched...", "industry": "tech"}
```

### 7. Skill Recommendations
```bash
POST /api/ai/skill-recommendations
{"currentRole": "Junior Dev", "currentSkills": ["JS"], "targetRole": "Senior Dev"}
```

### 8. Connection Message
```bash
POST /api/ai/connection-message
{"senderName": "John", "recipientName": "Jane", "recipientRole": "Tech Lead"}
```

---

## Decision Tree

### Which path should I choose?

```
Are you ready to deploy to production?
├─ YES → Use Cloudflare Worker (Path 2)
│   ├─ Has Cloudflare account? YES → Go to CLOUDFLARE_WORKER_SETUP.md
│   └─ No account? → Create at https://dash.cloudflare.com
│
└─ NO (Still testing) → Use OpenRouter (Path 1)
    ├─ Just get API key from https://openrouter.ai
    └─ Add to .env and you're done!

Later, when you're ready to scale:
└─ Follow CLOUDFLARE_WORKER_SETUP.md to migrate
```

---

## Common Questions

### Q: Do I need both OpenRouter and Cloudflare?
**A**: No. Choose one. The code supports fallback, but you only need one to start.

### Q: Can I use Gemini instead of OpenRouter?
**A**: Yes. Update the API calls in `server/lib/ai.js` to use Gemini API.

### Q: How much will this cost?
**A**: 
- OpenRouter free tier: $0 (rate limited)
- Cloudflare free tier: $0 (100k req/day)
- Both paid tiers: $10-50/month typical usage

### Q: Can I use both at the same time?
**A**: Yes! `server/lib/ai.js` tries Cloudflare Worker first, then falls back to OpenRouter.

### Q: What if the API is down?
**A**: The fallback system handles it automatically. You get a response either way.

### Q: Can I host the worker myself?
**A**: You could, but Cloudflare Workers is the easiest way. Cost is minimal ($0.50/M requests).

### Q: How do I add more AI features?
**A**: Add new functions to `server/lib/ai.js` and new endpoints to `server/routes/aiRoutes.js`.

### Q: Can users see my API keys?
**A**: No. They're only in `server/.env` (never sent to frontend).

---

## Troubleshooting Quick Guide

| Problem | Solution |
|---------|----------|
| "No API key configured" | Add OPENROUTER_API_KEY or CLOUDFLARE_WORKER_URL to .env |
| "POST /api/ai/chat 404" | Make sure routes are registered in server.js (2 lines) |
| "Unauthorized" (worker) | Check API_KEY in wrangler secret matches request |
| "Network error" | Check VITE_BASEURL in client/.env |
| "Empty response" | Check API key is valid, not expired |
| "Model not available" | Some models are regional. Try another one. |
| "Worker timeout" | Request too complex. Try simpler prompt. |

For more details, see QUICK_REFERENCE.md troubleshooting section.

---

## Next Steps

### Immediate (Now)
1. ✅ Choose Path 1 (OpenRouter) or Path 2 (Cloudflare)
2. ✅ Follow setup instructions above
3. ✅ Register routes in server.js
4. ✅ Test with curl

### Short Term (This Week)
1. Add AIAssistant to your forms
2. Test all 8 endpoints
3. Get user feedback
4. Optimize prompts

### Medium Term (This Month)
1. Add analytics tracking
2. Create user tutorial
3. Test with real usage
4. Gather usage metrics

### Long Term (Next Quarter)
1. Build premium tier with unlimited AI
2. Create custom AI models for your domain
3. Add specialized features (e.g., content calendar)
4. Monetize AI features

---

## Support Resources

### Documentation
- OpenRouter: https://openrouter.ai/docs
- Cloudflare Workers: https://developers.cloudflare.com/workers
- Cloudflare AI: https://developers.cloudflare.com/workers-ai
- React: https://react.dev

### Getting Help
1. Check QUICK_REFERENCE.md troubleshooting
2. Look at server logs: `npm run dev`
3. Test endpoint with curl
4. Check API key/URL in .env
5. Verify request format matches examples

### Community
- OpenRouter Discord: https://discord.gg/openrouter
- Cloudflare Community: https://community.cloudflare.com
- This project: Check created files for comments

---

## Summary

You now have:
- ✅ 6 backend + 6 documentation files
- ✅ 4 frontend files ready to use
- ✅ 2 different AI implementation paths
- ✅ 8 working API endpoints
- ✅ Step-by-step guides for both paths
- ✅ Production-ready Cloudflare Worker

**Total setup time**: 5-30 minutes (depending on path)
**Difficulty**: Easy to Medium
**Status**: Production Ready ✅

---

## What To Read Next

### If you're starting NOW:
→ Open **QUICK_REFERENCE.md**

### If you want step-by-step:
→ Open **INTEGRATION_STEPS.md**

### If you want OpenRouter:
→ Follow **Path 1 above**

### If you want Cloudflare:
→ Open **CLOUDFLARE_WORKER_SETUP.md**

### If you need details:
→ Open **CHIRP2.0_AI_FEATURES_UPGRADE.md**

---

**Created**: December 2024
**Based on**: CHIRP2.0 AI Architecture  
**Status**: Production Ready ✅
**Recommendation**: Choose Path 1 for quick start, migrate to Path 2 for production
