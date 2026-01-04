# 🐦 Chirp - Full Stack Social Media App

## ✨ New Features Added

### 1. **Fixed Notification Counter** ✅
- Notification badge now shows **actual unread count** instead of hardcoded "5"
- Counter dynamically updates based on notifications marked as read/unread
- Persistent storage using localStorage
- Sidebar badge updates in real-time

### 2. **AI Studio Chatbot** 🤖

A beautiful AI-powered chatbot that helps users create engaging content:

#### Features:
- **Post Suggestions** - Get creative ideas for posts
- **Comment Recommendations** - Helpful comment suggestions
- **Hashtag Generation** - Auto-generate trending hashtags
- **Web Search Integration** - Search the web for content ideas (via Serper API)

#### Technical Details:
- **Framework**: Cloudflare Workers AI + Serper API
- **Memory**: Maintains conversation history and context
- **Interface**: Beautiful chat UI with typing indicators
- **Persistence**: Chat history saved per user
- **Quick Actions**: One-click suggestions for common requests

#### How It Works:
1. User sends message about what they want (post, comment, hashtag)
2. AI analyzes the request
3. Generates relevant suggestions
4. User can refine and use suggestions

### 3. **Profile QR Code Generator** 📱

Beautiful, customizable QR code for user profiles:

#### Features:
- **Dynamic QR Generation** - Encodes user profile URL
- **Chirp Logo Center** - Beautiful logo overlay in QR center
- **Custom Colors** - Full control over foreground & background
- **Quick Presets** - 8 pre-made color schemes
- **Pattern Selection** - Choose from 9 different QR patterns:
  - square, round, rounded-in, pointed, leaf
  - diamond, dot, circle, star
- **Download & Share** - Export QR as PNG
- **Copy Link** - Quick copy profile URL
- **Generate Random** - Auto-generate new style combinations
- **Color Picker** - Mini color picker for precise customization

#### Visual Design:
- User info displayed below QR code
- Responsive layout for desktop and mobile
- Gradient background with premium styling
- Real-time preview of changes

### 4. **Unified Start Script** 🚀

Run frontend and backend simultaneously:

#### Three Options:

**Option 1: Node.js (All Platforms)**
```bash
npm start
# or
node start.js
```

**Option 2: Windows Batch**
```cmd
start.bat
```

**Option 3: PowerShell**
```powershell
start.ps1
```

All scripts:
- Start backend on port 5000
- Start frontend on port 5173
- Handle graceful shutdown
- Display clear status messages

---

## 📋 Required Environment Variables

### Frontend (client/.env)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_BASEURL=http://localhost:5000
VITE_CLOUDFLARE_WORKER_URL=https://xxx.workers.dev
VITE_SERPER_API_KEY=xxx
```

### Backend (server/.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
CLERK_SECRET_KEY=sk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx
CLOUDFLARE_WORKER_URL=https://xxx.workers.dev
SERPER_API_KEY=xxx
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5173
```

### How to Get Credentials:

#### Clerk (Authentication)
- Visit: https://dashboard.clerk.com
- Get Publishable Key: Settings > API Keys
- Get Secret Key: Settings > API Keys

#### Cloudflare Workers AI
- Visit: https://dash.cloudflare.com
- Create Worker: Workers & Pages > Create
- Get Account ID: From URL or Account > Workers
- Get API Token: Account > API Tokens > Create

#### Serper API (Web Search)
- Visit: https://serper.dev
- Sign up and get API key from dashboard

#### MongoDB
- Visit: https://www.mongodb.com/cloud/atlas
- Create cluster and get connection string

---

## 🎨 UI Components Created

### AIStudio.jsx
- Beautiful gradient background
- Chat message interface
- Quick action buttons
- Typing indicators
- Message timestamps
- Responsive design

### ProfileQR.jsx  
- QR code preview with logo
- Color customization panel
- Pattern selector
- Preset color schemes
- Download/copy functionality
- Responsive grid layout

### Updated Sidebar.jsx
- New "AI Studio" menu item with Bot icon
- New "Profile QR" menu item
- Fixed notification counter
- Dynamic badge display

---

## 📦 Dependencies Added

```json
{
  "qrcode.react": "^1.0.1"
}
```

Install with: `npm install qrcode.react`

---

## 🔧 Technical Architecture

### AI Chatbot Flow
```
User Input
    ↓
Message Type Detection
    ↓
Route to AI Service
    ├→ Cloudflare Workers AI (Post/Comment/Hashtag)
    └→ Serper API (Web Search)
    ↓
Generate Response
    ↓
Add to Chat History
    ↓
Save to LocalStorage
    ↓
Display in UI
```

### QR Code Flow
```
User Settings
    ├→ Foreground Color
    ├→ Background Color
    └→ Pattern Style
    ↓
QR Code Generation
    ├→ Encode Profile URL
    ├→ Add Chirp Logo Overlay
    └→ Apply Colors & Pattern
    ↓
Display Preview
    ├→ Download
    ├→ Copy Link
    └→ Generate Random
```

### Notification System
```
Notification Event
    ↓
Add to State
    ↓
Save to LocalStorage
    ↓
Update Sidebar Badge
    ↓
Display in Notifications Page
    ↓
Mark as Read
    ↓
Update LocalStorage
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install:all
# or
cd server && npm install
cd ../client && npm install
```

### 2. Setup Environment
- Copy `.env.setup.md` for detailed instructions
- Create `server/.env` with backend credentials
- Create `client/.env` with frontend credentials

### 3. Start Application
```bash
# From root directory
npm start

# Or manually
cd server && npm run dev  # Terminal 1
cd client && npm run dev  # Terminal 2
```

### 4. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- AI Studio: /ai-studio
- Profile QR: /profile-qr

---

## 🎯 Feature Completeness

- ✅ Notification counter fixed (shows actual unread count)
- ✅ AI Studio chatbot page with beautiful UI
- ✅ Chat message interface with memory
- ✅ Profile QR code generator
- ✅ Customizable QR (colors, patterns)
- ✅ Unified start script (Windows, Mac, Linux)
- ✅ Environment variable documentation
- ✅ Sidebar integration
- ✅ localStorage persistence
- ✅ Responsive design

---

## 📝 Notes

- Chat history is stored in localStorage per user
- QR codes encode the user's profile URL
- All features use mock data for demo (integrate with real APIs)
- Cloudflare Workers AI and Serper API require active accounts
- Add credentials to .env files for full functionality

---

## 🔐 Security

- Never commit .env files
- Rotate API keys regularly
- Use HTTPS in production
- Validate all inputs server-side
- Implement rate limiting for APIs

---

## 📧 Support

For issues or questions, refer to:
- `.env.setup.md` for credential setup
- Individual component files for implementation details
- External service documentation (Clerk, Cloudflare, Serper)

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Developer**: Fahad Khan (@cybe4sent1nel)
