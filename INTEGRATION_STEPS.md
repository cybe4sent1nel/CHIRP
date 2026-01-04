# CHIRP2.0 AI Features - Integration Steps

## Quick Summary
Upgrade your AI system from a basic chatbot to a comprehensive AI suite with:
- ✅ Post suggestions
- ✅ Comment recommendations  
- ✅ Bio generator
- ✅ Hashtag generator
- ✅ Content improvement
- ✅ Skill recommendations
- ✅ Connection messages
- ✅ Embedded AI widgets

## Step-by-Step Integration

### Phase 1: Backend Setup (15 mins)

#### 1.1 Install Dependencies
```bash
cd server
npm install --no-save  # Already have axios/fetch
```

#### 1.2 Add AI Library
Files created:
- `server/lib/ai.js` - Core AI library ✅

#### 1.3 Add API Routes
Files created:
- `server/routes/aiRoutes.js` - All AI endpoints ✅

#### 1.4 Register Routes in server.js
```javascript
// Add at top of server.js
const aiRoutes = require('./routes/aiRoutes');

// Add after other route registrations (around line where postRoutes, etc. are registered)
app.use('/api/ai', aiRoutes);
```

#### 1.5 Update .env
```bash
# Add to server/.env
OPENROUTER_API_KEY=sk_free_xxxxxxxxxxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
FRONTEND_URL=http://localhost:5173
```

Get OPENROUTER_API_KEY:
1. Go to https://openrouter.ai
2. Sign up (free account)
3. Get API key from settings
4. Copy to server/.env

### Phase 2: Frontend Setup (15 mins)

#### 2.1 Create Enhanced Hook
Files created:
- `client/src/hooks/useChirpAI.js` ✅

#### 2.2 Create AIAssistant Component
Files created:
- `client/src/components/AIAssistant.jsx` ✅

#### 2.3 Update Existing AIStudio.jsx
Replace the current hook usage:

```javascript
// Old (remove):
import useAI from "../hooks/useAI";
const { chat, generateImage, loading: aiLoading } = useAI();

// New (add):
import useChirpAI from "../hooks/useChirpAI";
const { chat, loading, error } = useChirpAI();
```

Update the chat call:
```javascript
// Old:
const result = await chat(input, conversationHistory, true);

// New:
const result = await chat(input);
```

### Phase 3: Testing (10 mins)

#### 3.1 Test Backend
```bash
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Test endpoint
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, what can you help me with?"}'
```

#### 3.2 Test Frontend
```bash
# Terminal 3: Start client
cd client
npm run dev

# Go to http://localhost:5173/ai-studio
# Try sending a message
```

### Phase 4: Add Embedded AI Widgets (20 mins)

#### 4.1 Update CreatePost.jsx
```javascript
import AIAssistant from '../components/AIAssistant';

// In your post creation form:
<div className="flex gap-2">
  <AIAssistant 
    mode="post" 
    currentContent={postContent}
    onApply={(suggestion) => setPostContent(suggestion)}
    context={{ industry: user.industry }}
  />
</div>
```

#### 4.2 Update Comments.jsx
```javascript
import AIAssistant from '../components/AIAssistant';

// In your comment form:
<div className="flex gap-2">
  <AIAssistant 
    mode="comment"
    onApply={(suggestion) => setCommentText(suggestion)}
    context={{ postContent: post.content }}
  />
</div>
```

#### 4.3 Update Profile.jsx
```javascript
import AIAssistant from '../components/AIAssistant';

// In your bio edit form:
<div className="flex gap-2">
  <AIAssistant 
    mode="bio"
    onApply={(suggestion) => setBio(suggestion)}
    context={{ 
      name: user.name, 
      role: user.role,
      skills: user.skills 
    }}
  />
</div>
```

### Phase 5: Update Sidebar Navigation (5 mins)

In `client/src/components/Sidebar.jsx`, update the AI menu item:

```javascript
// Find the AI Studio menu item and update it
{
  icon: <Bot className="w-5 h-5" />,
  label: 'AI Studio',
  path: '/ai-studio',
  description: 'Posts, comments, bios, hashtags, & more'
}
```

## API Endpoint Reference

All endpoints use `POST` method and return JSON:

### `/api/ai/chat`
```javascript
{
  "message": "Generate an image of a sunset",
  "model": "IMAGE", // Optional: "IMAGE" for image generation
  "systemContext": "You are an assistant" // Optional
}
```

### `/api/ai/post-suggestions`
```javascript
{
  "topic": "AI in healthcare",
  "industry": "technology", // Optional
  "tone": "professional" // Options: "professional", "casual", "inspirational"
}
```

### `/api/ai/comment-suggestions`
```javascript
{
  "postContent": "Just launched my new AI tool!",
  "context": "Optional additional context"
}
```

### `/api/ai/generate-bio`
```javascript
{
  "name": "John Doe",
  "role": "Software Engineer",
  "skills": ["React", "Node.js", "Python"],
  "experience": "5 years" // Optional
}
```

### `/api/ai/improve-post`
```javascript
{
  "content": "My new project is good",
  "goal": "engagement" // Options: "engagement", "clarity", "professional"
}
```

### `/api/ai/hashtags`
```javascript
{
  "content": "Just launched a new web app",
  "industry": "technology" // Optional
}
```

### `/api/ai/skill-recommendations`
```javascript
{
  "currentRole": "Junior Developer",
  "currentSkills": ["JavaScript", "React"],
  "targetRole": "Senior Developer" // Optional
}
```

### `/api/ai/connection-message`
```javascript
{
  "senderName": "John",
  "recipientName": "Jane",
  "recipientRole": "Tech Lead", // Optional
  "recipientCompany": "Google", // Optional
  "reason": "Mutual interest in AI" // Optional
}
```

## Verification Checklist

- [ ] OpenRouter API key added to server/.env
- [ ] `server/lib/ai.js` created
- [ ] `server/routes/aiRoutes.js` created
- [ ] Routes registered in server.js
- [ ] `client/src/hooks/useChirpAI.js` created
- [ ] `client/src/components/AIAssistant.jsx` created
- [ ] Backend `/api/ai/chat` endpoint working
- [ ] Frontend can send chat messages
- [ ] AIAssistant widget opens/closes
- [ ] All 8 API endpoints working
- [ ] Embedded widgets added to forms

## Troubleshooting

### "No AI provider API key configured"
**Solution**: Add OPENROUTER_API_KEY to server/.env and restart server

### "Network error" in frontend
**Solution**: 
- Check VITE_BASEURL in client/.env
- Ensure server is running on correct port
- Check CORS settings

### API returns 500 error
**Solution**:
- Check server logs for errors
- Verify API key is valid
- Test endpoint with curl first

### No response from AI
**Solution**:
- Ensure OpenRouter account has credits/quota
- Try simpler prompt first
- Check request payload format

## Next Steps After Integration

1. **Add More Models** - Update AI_MODELS in `server/lib/ai.js` for specialized tasks
2. **Custom System Prompts** - Create industry-specific prompts
3. **Analytics** - Track which AI features are used most
4. **Caching** - Cache similar requests to save API costs
5. **User Preferences** - Let users choose AI models/tones
6. **Premium Tiers** - Offer unlimited AI features as premium benefit

## Cost Considerations

- **OpenRouter Free Models**: Completely free with rate limiting
- **Estimated Monthly Cost**: $0-10 for typical usage
- **Premium Models**: Optional paid upgrades available

## Support

- OpenRouter docs: https://openrouter.ai/docs
- Report issues in server logs
- Check response format matches expectation

---

**Estimated Total Integration Time**: 1-2 hours
**Difficulty**: Medium
**Breaking Changes**: None (backward compatible)
