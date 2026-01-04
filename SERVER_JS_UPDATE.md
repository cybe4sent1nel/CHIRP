# server.js Update - How to Add AI Routes

## Quick Overview
You need to add 2 lines to your `server/server.js` to register the AI routes.

## Find Your Current Routes Section

Open `server/server.js` and look for where other routes are registered. It should look something like:

```javascript
// Current routes section (around line 50-100)
const messageRoutes = require('./routes/messageRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const storyRoutes = require('./routes/storyRoutes');

// ... somewhere below that ...

app.use('/api/messages', messageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', storyRoutes);
```

## Add AI Routes

### Step 1: Add Require Statement
Find the requires section at the top and add:
```javascript
const aiRoutes = require('./routes/aiRoutes');
```

**Full example:**
```javascript
// At the top of server.js with other route requires
const messageRoutes = require('./routes/messageRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const storyRoutes = require('./routes/storyRoutes');
const aiRoutes = require('./routes/aiRoutes');  // ← ADD THIS LINE
```

### Step 2: Register the Routes
Find where the routes are used and add:
```javascript
app.use('/api/ai', aiRoutes);
```

**Full example:**
```javascript
// Somewhere in your app.use() calls
app.use('/api/messages', messageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/ai', aiRoutes);  // ← ADD THIS LINE
```

## Before & After Example

### Before
```javascript
// server/server.js

const express = require('express');
const app = express();
const messageRoutes = require('./routes/messageRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const storyRoutes = require('./routes/storyRoutes');

// ... middleware setup ...

app.use('/api/messages', messageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', storyRoutes);

app.listen(5000, () => console.log('Server running'));
```

### After
```javascript
// server/server.js

const express = require('express');
const app = express();
const messageRoutes = require('./routes/messageRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const storyRoutes = require('./routes/storyRoutes');
const aiRoutes = require('./routes/aiRoutes');  // ← NEW

// ... middleware setup ...

app.use('/api/messages', messageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/ai', aiRoutes);  // ← NEW

app.listen(5000, () => console.log('Server running'));
```

## Testing

After making the changes:

### 1. Save the file
### 2. Restart your server
```bash
cd server
npm run dev
```

### 3. Test an endpoint
```bash
# In a new terminal
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!"}'
```

You should get a response like:
```json
{
  "success": true,
  "response": "Hello! I'm your AI assistant...",
  "responseHtml": null
}
```

## Common Issues

### "Cannot find module './routes/aiRoutes'"
**Solution**: Make sure `aiRoutes.js` exists in `server/routes/` directory

### "POST /api/ai/chat 404"
**Solution**: Routes not registered. Check that you added both the require AND the app.use() lines.

### Server won't start
**Solution**: Check for syntax errors. Make sure you have the require statement AND the app.use() line.

## File Structure
After setup, your structure should be:
```
server/
├── routes/
│   ├── messageRoutes.js
│   ├── postRoutes.js
│   ├── userRoutes.js
│   ├── storyRoutes.js
│   └── aiRoutes.js          ← NEW
├── lib/
│   └── ai.js               ← NEW
├── server.js               ← MODIFIED (add 2 lines)
├── package.json
└── ...
```

## Order Doesn't Matter

You can add the AI routes at the beginning or end of your routes list:

```javascript
// Option 1: At the beginning
app.use('/api/ai', aiRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/posts', postRoutes);

// Option 2: At the end
app.use('/api/messages', messageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ai', aiRoutes);

// Both work the same
```

## All AI Endpoints

Once added, you have these endpoints available:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/chat` | POST | General chat + image generation |
| `/api/ai/post-suggestions` | POST | Generate post ideas |
| `/api/ai/comment-suggestions` | POST | Suggest comments |
| `/api/ai/generate-bio` | POST | Create professional bio |
| `/api/ai/improve-post` | POST | Optimize content |
| `/api/ai/hashtags` | POST | Generate hashtags |
| `/api/ai/skill-recommendations` | POST | Suggest skills |
| `/api/ai/connection-message` | POST | Generate connection messages |

Test each one in your frontend using the useChirpAI hook!

---

That's it! Just 2 lines to add and you're ready to go. 🚀
