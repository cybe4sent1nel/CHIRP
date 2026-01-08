<div align="center">

<img src="./client/public/LOGOO.png" alt="Chirp Logo" width="200"/>

# 🐦 Chirp

**A Modern Full-Stack Social Media Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

Connect, Share, and Engage in Real-Time

[Features](#-features) • [Quick Start](#-quick-start) • [Installation](#-installation) • [Tech Stack](#-tech-stack) • [API](#-api-reference)

</div>

---

## 📖 About

Chirp is a feature-rich social media platform built with modern web technologies. It combines real-time messaging, AI-powered content creation, media sharing, and social networking features into one seamless experience.

## ✨ Features

### 🔐 **Authentication & Security**
- Dual authentication system (Custom + Clerk)
- Google OAuth integration
- JWT-based session management
- Secure password hashing
- Email verification
- Password reset functionality

### 📱 **Social Features**
- **Posts**: Create, like, and share text/image posts (up to 4 images)
- **LinkedIn-Style Reactions**: 6 reaction types (Like, Support, Celebrate, Cheer, Insight, OMG) with hover picker
- **Comments & Replies**: Nested comment system with threaded replies and reactions
- **Hashtags & Mentions**: Tag users with @ and topics with #, full clickable link support
- **Buzz/Trending**: Discover trending hashtags and popular posts (daily, weekly, monthly)
- **GIF & Sticker Support**: Powered by Giphy API - send GIFs and stickers in comments and messages
- **Stories**: 24-hour auto-expiring stories with media support
- **Connections**: Follow/unfollow users and manage connection requests
- **User Discovery**: Find and connect with other users
- **Profile QR Codes**: Generate customizable QR codes with 9 patterns and 8 color presets
- **Personalized Feed**: Algorithm-based content discovery

### 💬 **Real-Time Messaging**
- Live chat with Server-Sent Events (SSE)
- Message seen status with read receipts
- Typing indicators
- Media messaging support (images, videos, documents)
- **GIF & Sticker Support**: WhatsApp-style display with auto-detection
- Encrypted message support
- Unread message counters
- WhatsApp-style message status

### 🤖 **AI-Powered Features**
- **AI Studio**: Intelligent chatbot for content creation
  - Post suggestions
  - Comment recommendations
  - Hashtag generation
  - Web search integration (Serper API)
  - Conversation memory and context awareness

### 📸 **Media Management**
- Image/video uploads via Multer
- Cloud storage with ImageKit CDN
- Media transformation and optimization
- File upload with progress tracking
- Support for multiple image formats

### 🔔 **Notifications**
- Real-time notification system
- Dynamic unread counters
- Connection request notifications
- Daily unseen message reminders
- Persistent notification history

### ⚙️ **Background Jobs**
- Inngest integration for scheduled tasks
- Auto-story deletion after 24 hours
- User sync from Clerk
- Email notification scheduling
- Connection request emails

---

## 🚀 Quick Start

**One command to start everything:**

```bash
npm run dev
```

This launches:
- 🔧 **Backend Server** → http://localhost:4000
- 📱 **Frontend Client** → http://localhost:5173  
- 📧 **Inngest Dev Server** → http://localhost:8288

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB database (cloud or local)
- ImageKit account (required for media uploads)
- Clerk account (optional - for Clerk auth)
- SMTP credentials (optional - for email notifications)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd chirpcodec
```

### 2. Install Dependencies

```bash
# Installs all dependencies (root, client, and server)
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# MongoDB
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority

# Custom Auth (Pre-configured)
JWT_SECRET=f598438d28e8bcc5f9ada18c399c503bb6bb2c18b826d1532c75bb45c19be2eb
SESSION_SECRET=1d172a524cee4f71026c8ed03b77a5631c665ebc36847473db9dd76a6e6291d

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# App URLs
FRONTEND_URL=http://localhost:5173
VITE_BASEURL=http://localhost:4000

# Clerk (Optional)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# ImageKit (Required for media uploads)
IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_PRIVATE_KEY=private_...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/...

# Email (Optional - for notifications)
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SENDER_EMAIL=Chirp <noreply@yourdomain.com>

# Inngest (Optional - for background jobs)
INNGEST_SIGNING_KEY=your-signing-key

# AI Features (Optional)
VITE_CLOUDFLARE_WORKER_URL=https://xxx.workers.dev
VITE_SERPER_API_KEY=xxx
```

### 4. Start the Application

```bash
npm run dev
```

Access the app at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Inngest Dashboard**: http://localhost:8288

---

## 🛠 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Axios** - HTTP client
- **TailwindCSS** - Styling
- **QRCode.react** - QR code generation

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Token-based authentication
- **Passport.js** - Authentication strategies
- **Multer** - File upload handling
- **ImageKit** - Media storage & CDN
- **Nodemailer** - Email service
- **Inngest** - Background job processing

### Third-Party Services
- **Clerk** - Authentication platform (optional)
- **Google OAuth** - Social login
- **ImageKit** - Media CDN and transformation
- **Cloudflare Workers AI** - AI chatbot
- **Serper API** - Web search integration
- **Brevo/SMTP** - Email delivery

---

## 📡 API Reference

### Authentication Routes (`/api/auth`)
```
POST   /signup              Register new user
POST   /login               Login user
POST   /google              Google OAuth callback
POST   /verify-email        Verify email address
POST   /forgot-password     Request password reset
POST   /reset-password      Reset password with token
GET    /logout              Logout user
```

### User Routes (`/api/user`)
```
GET    /data                Get current user profile (protected)
POST   /update              Update profile with media (protected)
POST   /discover            Search users by criteria (protected)
POST   /follow              Follow a user (protected)
POST   /unfollow            Unfollow a user (protected)
POST   /connect             Send connection request (protected)
POST   /accept              Accept connection request (protected)
GET    /connections         Get all connections (protected)
POST   /profiles            Get user profile by ID
GET    /recent-messages     Get recent conversations (protected)
```

### Post Routes (`/api/post`)
```
POST   /add                 Create post with images (protected)
GET    /feed                Get personalized feed (protected)
POST   /react               Add reaction to post (protected)
POST   /comment             Add comment to post (protected)
POST   /reply               Reply to comment (protected)
GET    /:postId             Get single post
DELETE /:postId             Delete post (protected)
```

### Hashtag Routes (`/api/hashtags`)
```
GET    /trending            Get trending hashtags (protected)
GET    /:hashtag/posts      Get posts by hashtag (protected)
GET    /search              Search hashtags (protected)
```

### Comment Routes (`/api/comments`)
```
POST   /add                 Add comment with optional GIF/sticker (protected)
POST   /reply               Reply to comment with optional GIF/sticker (protected)
POST   /react               Add reaction to comment (protected)
GET    /:postId             Get comments for a post (protected)
DELETE /:commentId           Delete commen post
DELETE /:postId             Delete post (protected)
```

### Story Routes (`/api/story`)
```
POST   /create              Create story (auto-expires 24h) (protected)
GET    /get                 Get stories from network (protected)
DELETE /:storyId            Delete story (protected)
```

### Message Routes (`/api/message`)
```
GET    /:userId             Real-time SSE stream
POST   /send                Send message with optional media (protected)
POST   /get                 Get chat history (protected)
POST   /mark-read           Mark messages as read (protected)
```

### Inngest Routes (`/api/inngest`)
```
POST   /                    Inngest webhook handler
```

---

## 🎨 Key Components

### Buzz/Trending Page (`/buzz`)
- Discover trending hashtags with engagement metrics
- Filter trending posts by timeframe (day, week, month)
- View hashtag-specific post feeds
- Real-time trending score calculations
- Engagement statistics (count, last used)

### Reaction System
- 6 LinkedIn-style reactions: Like 👍, Support ❤️, Celebrate 🎉, Cheer 🔥, Insight 💡, OMG 😮
- Hover picker for quick reaction selection
- Reaction modal showing who reacted with filterable tabs
- Works on both posts and comments
- Visual reaction summaries with clickable counts

### Comment System
- Nested reply support (threaded conversations)
- Reactions on individual comments and replies
- GIF and sticker support via Giphy integration
- Media preview before posting
- Clickable @mentions and #hashtags

### AI Studio (`/ai-studio`)
- AI-powered content assistant
- Post/comment/hashtag generation
- Web search integration
- Conversation memory and context
- Beautiful gradient UI with typing indicators

### Profile QR (`/profile-qr`)
- Customizable QR codes with logo overlay
- 9 pattern styles (square, round, diamond, star, etc.)
- 8 color presets + custom color picker
- Download as PNG
- Copy profile link

### Real-Time Messaging
- Server-Sent Events (SSE) for push notifications
- Typing indicators
- Read receipts (delivered/seen)
- WhatsApp-style GIF and sticker display
- Message encryption support
- Unread badge counters

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start all services (recommended)
npm run dev:client       # Start frontend only
npm run dev:server       # Start backend only
npm run dev:inngest      # Start Inngest dev server

# Build
npm run build            # Build frontend
npm run build:client     # Build frontend
npm run build:server     # No build needed

# Installation
npm run install:all      # Install all dependencies
npm install              # Auto-runs install:all

# Deployment
npm run deploy:netlify   # Deploy to Netlify
npm run deploy:vercel    # Deploy to Vercel
```

### Project Structure

```
chirpcodec/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # Axios configuration
│   │   ├── app/           # Redux store
│   │   ├── assets/        # Static assets (logo, images)
│   │   ├── components/    # React components
│   │   ├── features/      # Redux slices
│   │   ├── pages/         # Page components
│   │   └── utils/         # Utility functions
│   └── package.json
│
├── server/                 # Express backend
│   ├── configs/           # Configuration files
│   │   ├── db.js          # MongoDB connection
│   │   ├── imageKit.js    # ImageKit setup
│   │   ├── nodeMailer.js  # Email configuration
│   │   └── passport.js    # Auth strategies
│   ├── controllers/       # Route controllers
│   ├── middlewares/       # Express middlewares
│   ├── models/            # Mongoose models
- `JWT_SECRET` - Secret key for JWT token generation
- `SESSION_SECRET` - Secret key for session management

### Required for Features
- `VITE_GIPHY_API_KEY` - Giphy API key for GIF/sticker support
- `CLERK_SECRET_KEY` - For Clerk authentication (if using Clerk)
- `VITE_CLERK_PUBLISHABLE_KEY` - For Clerk frontend (if using Clerk)

### Optional
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `SMTP_USER` - For email notifications
- `SMTP_PASS` - For email service
- `INNGEST_SIGNING_KEY` - For background jobs
- `TEXT_API_URL` - Cloudflare Worker URL for AI text generation
- `IMAGE_API_URL` - Cloudflare Worker URL for AI image generation
- `SERPAPI_KEY` - For web search integration in AI Studio
- `NEWSDATA_API_KEY` - For news data integration
- `STRIPE_API_KEY` - For payment processing

### Getting API Keys

**Giphy API** (Required for GIFs/Stickers):
1. Sign up at https://developers.giphy.com/
2. Create an app and copy the API key
3. Add to `.env` as `VITE_GIPHY_API_KEY`

**ImageKit** (Required for Media):
1. Sign up at https://imagekit.io/
2. Get your keys from Dashboard > Developer Options
3. Add all three values to `.env`

**Clerk** (Optional - Alternative Auth):
1. Sign up at https://clerk.com/
2. Create an application
3. Copy publishable and secret keys

See `.env.example` for the complete list of environment variables.
- `MONGO_URI` - MongoDB connection string
- `IMAGEKIT_PUBLIC_KEY` - ImageKit public key
- `IMAGEKIT_PRIVATE_KEY` - ImageKit private key
- `IMAGEKIT_URL_ENDPOINT` - ImageKit endpoint URL

### Pre-configured
- `JWT_SECRET` - Already set for development
- `SESSION_SECRET` - Already set for development

### Optional
- `CLERK_SECRET_KEY` - For Clerk authentication
- `VITE_CLERK_PUBLISHABLE_KEY` - For Clerk frontend
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `SMTP_USER` - For email notifications
- `SMTP_PASS` - For email service
- `INNGEST_SIGNING_KEY` - For background jobs
- `VITE_CLOUDFLARE_WORKER_URL` - For AI features
- `VITE_SERPER_API_KEY` - For web search

---

## 🌐 Deployment

### Netlify
```bash
npm run deploy:netlify
```

### Vercel
```bash
npm run deploy:vercel
```

### Manual Deployment
1. Build the frontend: `npm run build`
2. Set environment variables on your hosting platform
3. Deploy `client/dist` folder for frontend
4. Deploy `server` folder for backend
5. Ensure MongoDB is accessible from your server

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Fahad Khan** (@cybe4sent1nel)

---

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by popular social media platforms
- Community feedback and contributions

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with 🐦 by the Chirp team

</div>


