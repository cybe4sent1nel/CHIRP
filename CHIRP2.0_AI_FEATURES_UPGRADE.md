# CHIRP2.0 AI Features - Upgrade Guide

## Overview
This guide integrates advanced AI features from CHIRP2.0 into your current app. The key difference is that CHIRP2.0 uses **modular AI endpoints** and a **powerful backend AI library** (`lib/ai.ts`) that supports:
- OpenRouter API with free models (Gemini 2.0, Llama 3.3, Qwen, Mistral)
- Image generation (OpenRouter, Gemini, Stability, Replicate, Freepik)
- Optional Cloudflare Worker backend
- RAG (Retrieval-Augmented Generation) support

## Current vs CHIRP2.0 Architecture

### Your Current Setup
- Simple chatbot page (AIStudio.jsx)
- Basic useAI hook
- Single `/chat` endpoint
- Cloudflare Workers dependency

### CHIRP2.0 Setup
```
app/api/ai/
├── chat/               (General chat + image generation)
├── post-suggestions/   (Generate post ideas)
├── comment-suggestions/ (Suggest comments)
├── generate-bio/       (Professional bio writer)
├── hashtags/          (Hashtag generator)
├── improve-post/      (Content optimizer)
├── skill-recommendations/ (Career guidance)
├── connection-message/ (Networking messages)
├── upload/            (File upload handler)
└── lib/ai.ts          (Core AI logic with multiple providers)
```

## Implementation Steps

### Step 1: Create Enhanced AI Library (Backend)

Create `server/lib/ai.js` based on CHIRP2.0's lib/ai.ts:
- Supports multiple AI model providers (OpenRouter, Gemini, Stability, Replicate)
- Fallback system for robustness
- Image generation support
- RAG support

### Step 2: Create API Endpoints

Add these endpoints to your server:
- POST `/api/ai/post-suggestions` - Generate post ideas
- POST `/api/ai/comment-suggestions` - Suggest comments
- POST `/api/ai/generate-bio` - Professional bio writer
- POST `/api/ai/hashtags` - Generate hashtags
- POST `/api/ai/improve-post` - Content optimizer
- POST `/api/ai/skill-recommendations` - Skill suggestions
- POST `/api/ai/connection-message` - Connection request messages
- POST `/api/ai/chat` - General purpose chat with image generation

### Step 3: Create Enhanced useChirpAI Hook (Frontend)

Replace useAI hook with advanced useChirpAI that provides:
- getPostSuggestions()
- getCommentSuggestions()
- generateBio()
- getHashtags()
- improvePost()
- getSkillRecommendations()
- getConnectionMessage()
- chat() with image generation

### Step 4: Create Modular Components

Add these embedding components:
- **AIAssistant.jsx** - Dropdown widget for inline AI suggestions
- **AIStudio.tsx** - Full-page AI workspace
- **AiOptionsCard.jsx** - Quick access sidebar

### Step 5: Environment Setup

Add to `.env`:
```
# Primary AI Provider (Recommended: OpenRouter for free models)
OPENROUTER_API_KEY=your_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Optional: Text Generation Worker (Cloudflare)
TEXT_API_URL=https://your-worker.workers.dev
TEXT_API_BEARER=your_bearer_token

# Optional: Image Generation Providers
# Gemini
GEMINI_API_KEY=your_gemini_key
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image

# Freepik AI
FREEPIK_API_KEY=your_freepik_key

# Stability AI
STABILITY_API_KEY=your_stability_key

# Replicate
REPLICATE_API_TOKEN=your_replicate_token

# RAG (Retrieval-Augmented Generation)
TEXT_RAG_ENABLED=false
```

## Key Differences from Your Current Setup

| Feature | Your App | CHIRP2.0 |
|---------|----------|---------|
| **AI Models** | Cloudflare only | OpenRouter (9+ free models) |
| **Endpoints** | 1 (/chat) | 8+ specialized endpoints |
| **Image Generation** | Basic | 5+ providers with fallback |
| **Post Suggestions** | Generic | Context-aware, tone selection |
| **Comment Ideas** | Not in API | Full suggestion engine |
| **Bio Generator** | Not in API | Professional bio writer |
| **Hashtags** | Basic | Industry-aware hashtags |
| **Content Improvement** | Not in API | Multiple improvement goals |
| **Skill Recommendations** | Not in API | Career development AI |
| **Connection Messages** | Not in API | Networking AI |
| **RAG Support** | No | Yes (with fallback) |
| **Fallback System** | Single provider | Multi-provider chain |
| **Components** | Single page | Modular + embedded |

## Benefits of This Upgrade

1. **No Cloudflare Dependency** - Works with free OpenRouter models
2. **Specialized Tools** - Not just chat, but purpose-built AI functions
3. **Better UX** - Embedded AI widgets in forms + full AI studio page
4. **Robust** - Multiple provider fallbacks
5. **Cost Effective** - Free tier models available
6. **Professional Features** - Bio generator, skill recommendations, etc.

## API Examples

### Post Suggestions
```bash
POST /api/ai/post-suggestions
{
  "topic": "AI in healthcare",
  "industry": "technology",
  "tone": "professional"
}
```

### Comment Suggestions
```bash
POST /api/ai/comment-suggestions
{
  "postContent": "Just launched my new AI tool!",
  "context": "tech startup announcement"
}
```

### Generate Bio
```bash
POST /api/ai/generate-bio
{
  "name": "John Doe",
  "role": "Software Engineer",
  "skills": ["React", "Node.js", "Python"],
  "experience": "5 years"
}
```

### Improve Post
```bash
POST /api/ai/improve-post
{
  "content": "My new project is good",
  "goal": "engagement"
}
```

## Migration Path

1. Keep existing AIStudio page functional
2. Add new API endpoints gradually
3. Add useChirpAI hook alongside existing useAI
4. Add embedded AIAssistant widgets to forms
5. Gradually migrate to CHIRP2.0 UI patterns
6. Test thoroughly with all providers

## Testing Providers

### OpenRouter (Recommended - Free)
- Sign up: https://openrouter.ai
- Get free credits for inference
- Models: Gemini 2.0, Llama 3.3, Qwen, Mistral
- No credit card required initially

### Gemini (Free tier available)
- Sign up: https://ai.google.dev
- Free tier: 60 requests/minute
- Image generation: gemini-2.5-flash-image

### Stability AI
- Free tier: 20 images/month
- High quality images

### Freepik AI
- Web-based image generation
- Async task support

## Files to Create/Modify

### Create:
- `server/lib/ai.js` - AI core library
- `server/routes/aiRoutes.js` - API endpoints
- `client/src/hooks/useChirpAI.js` - Enhanced hook
- `client/src/components/AIAssistant.jsx` - Embedded widget
- `client/src/components/AiOptionsCard.jsx` - Quick access sidebar
- `client/src/pages/AIStudioAdvanced.jsx` - Full AI workspace

### Modify:
- `server/server.js` - Add new routes
- `client/src/pages/AIStudio.jsx` - Upgrade UI
- `client/src/components/Sidebar.jsx` - Add new menu items
- `.env` - Add provider credentials

## Next Steps

1. Choose primary AI provider (OpenRouter recommended)
2. Get API credentials
3. Implement backend library and endpoints
4. Create/update frontend components
5. Test with all AI features
6. Deploy gradually

---

See individual files for detailed implementation.
