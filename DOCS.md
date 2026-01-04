# Chirp - Full-Stack Social Media Platform Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Database Schema](#database-schema)
4. [Backend Deep Dive](#backend-deep-dive)
5. [Frontend Deep Dive](#frontend-deep-dive)
6. [Interview Questions & Answers](#interview-questions--answers)

---

## Project Overview

**Chirp** is a full-stack social media application that enables users to:

- Create and share posts with images (up to 4 images per post)
- Share ephemeral stories that auto-delete after 24 hours
- Connect with other users (follow/unfollow and connection requests)
- Send real-time messages with Server-Sent Events (SSE)
- Receive email notifications for connection requests and unseen messages
- Upload and transform media files using ImageKit CDN

**Key Differentiators:**

- Real-time messaging without WebSockets (uses SSE for server-to-client push)
- Background job processing with Inngest for scheduled tasks
- Clerk authentication for enterprise-grade security
- ImageKit integration for optimized media delivery

---

## Architecture & Tech Stack

### Frontend (Client)

```
Technology: React 19 + Vite
Build Tool: Vite 7.1.2
UI Framework: Tailwind CSS 4.1.13
Routing: React Router DOM v7.9.1
State Management: Redux Toolkit 2.9.0
Authentication: @clerk/clerk-react 5.47.0
HTTP Client: Axios 1.12.2
Icons: Lucide React
Notifications: React Hot Toast
Date Handling: Moment.js
```

**Development Workflow:**

- `npm run dev` - Starts Vite dev server (typically on port 5173)
- `npm run build` - Production build
- `npm run preview` - Preview production build

### Backend (Server)

```
Runtime: Node.js with ES Modules
Framework: Express 5.1.0
Database: MongoDB with Mongoose 8.18.1
Authentication: @clerk/express 1.7.31
File Upload: Multer 2.0.2
Media CDN: ImageKit SDK 7.0.1
Background Jobs: Inngest 3.40.3
Email Service: Nodemailer 7.0.6 (SMTP via Brevo)
CORS: Enabled for cross-origin requests
```

**Development Workflow:**

- `npm run server` - Starts with nodemon (auto-restart)
- `npm start` - Production mode

---

## Database Schema

### 1. User Model (`models/User.js`)

```javascript
{
  _id: String (Clerk User ID),
  email: String (required),
  full_name: String (required),
  username: String (unique),
  bio: String (default: 'Hey there! I am using Chirp!'),
  profile_picture: String (URL),
  cover_photo: String (URL),
  location: String,
  followers: [String] (refs to User),
  following: [String] (refs to User),
  connections: [String] (refs to User),
  timestamps: true
}
```

**Key Design Decisions:**

- `_id` is Clerk's user ID (not MongoDB ObjectId) for seamless integration
- `username` is unique and auto-generated from email (adds random number if collision)
- Social graph uses three separate arrays: followers, following, connections
- **Followers/Following**: One-way relationship (like Twitter/Instagram)
- **Connections**: Two-way relationship (like LinkedIn) requiring acceptance

### 2. Post Model (`models/Post.js`)

```javascript
{
  user: String (ref to User, required),
  content: String (text content),
  image_urls: [String] (array of ImageKit URLs),
  post_type: String (enum: ['text', 'image', 'text_with_image']),
  likes_count: [String] (refs to Users who liked),
  timestamps: true
}
```

**Key Features:**

- Supports up to 4 images per post (enforced via Multer)
- `likes_count` stores user IDs (not just a number) to enable unlike functionality
- `post_type` determines rendering logic on frontend

### 3. Story Model (`models/Story.js`)

```javascript
{
  user: String (ref to User, required),
  content: String (text overlay),
  media_url: String (ImageKit URL),
  media_type: String (enum: ['text', 'image', 'video']),
  views_count: [String] (user IDs who viewed),
  background_color: String (for text-only stories),
  timestamps: true
}
```

**Auto-Deletion Mechanism:**

- When created, triggers Inngest event `app/story-delete`
- Inngest function `deleteStory` waits 24 hours via `step.sleepUntil()`
- Story is automatically deleted from database

### 4. Message Model (`models/Message.js`)

```javascript
{
  from_user_id: String (ref to User, required),
  to_user_id: String (ref to User, required),
  text: String (trimmed),
  message_type: String (enum: ['text', 'image']),
  message_url: String (ImageKit URL for images),
  seen: Boolean (default: false),
  timestamps: true
}
```

**Seen Status Logic:**

- Set to `true` when recipient opens chat via `getChatMessages`
- Used for daily email reminders of unseen messages

### 5. Connection Model (`models/Connection.js`)

```javascript
{
  from_user_id: String (sender, ref to User),
  to_user_id: String (recipient, ref to User),
  status: String (enum: ['pending', 'accepted'], default: 'pending'),
  timestamps: true
}
```

**Connection Flow:**

1. User A sends request → creates Connection with status 'pending'
2. User B accepts → status changes to 'accepted', both users' `connections` arrays updated
3. Rate limiting: Max 20 requests per user in 24 hours

---

## Backend Deep Dive

### Server Entry Point (`server.js`)

```javascript
Key Responsibilities:
1. Connect to MongoDB (await connectDB())
2. Apply middleware (express.json, cors, clerkMiddleware)
3. Register routes (/api/user, /api/post, /api/story, /api/message)
4. Serve Inngest functions at /api/inngest
5. Start Express server on PORT (default 4000)
```

**Middleware Order Matters:**

```javascript
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS
app.use(clerkMiddleware()); // Make req.auth() available
```

### Authentication Flow (`middlewares/auth.js`)

**Clerk Integration:**

- Frontend: User signs in via `<SignIn />` component from `@clerk/clerk-react`
- Clerk issues a JWT token stored in browser
- Frontend sends token in `Authorization: Bearer <token>` header
- Backend: `clerkMiddleware()` validates token and populates `req.auth()`
- Protected routes call `req.auth()` to get `{ userId }`

**Example Protected Route:**

```javascript
export const getUserData = async (req, res) => {
  const { userId } = req.auth(); // Clerk provides this
  const user = await User.findById(userId);
  res.json({ success: true, user });
};
```

### File Upload & Media Handling

**Multer Configuration (`configs/multer.js`):**

- Stores files temporarily in `./uploads/` directory
- Supports multiple fields: `profile`, `cover`, `images[]`, `media`, `image`

**ImageKit Workflow:**

1. Multer saves uploaded file to disk
2. Backend streams file to ImageKit using `fs.createReadStream()`
3. ImageKit returns permanent URL
4. Apply transformations (resize, format conversion, quality optimization)
5. Store transformed URL in database
6. Delete temporary file with `fs.unlinkSync()`

**Example Transformation:**

```javascript
const transformedUrl = imageKit.helper.buildSrc({
  src: response.url,
  transformation: [{ width: 1280, quality: "auto", format: "webp" }],
});
```

### Real-Time Messaging with SSE

**Why SSE instead of WebSockets?**

- Simpler server implementation (built on HTTP)
- Automatic reconnection in browsers
- No need for bi-directional communication (client uses REST API to send, SSE to receive)

**Implementation (`controllers/messageController.js`):**

```javascript
// Global object to track active connections
const connections = {};

// SSE endpoint: GET /api/message/:userId
export const sseController = (req, res) => {
  const { userId } = req.params;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Store response object for this user
  connections[userId] = res;

  // Send initial connection message
  res.write("log: Connected to SSE stream\n\n");

  // Clean up on disconnect
  req.on("close", () => {
    delete connections[userId];
  });
};

// When sending message:
if (connections[to_user_id]) {
  connections[to_user_id].write(`data: ${JSON.stringify(message)}\n\n`);
}
```

**Frontend SSE Client:**

```javascript
const eventSource = new EventSource(`${VITE_BASEURL}/api/message/${userId}`);
eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Update Redux store or display notification
};
```

### Background Jobs with Inngest (`inngest/index.js`)

**Inngest Setup:**

```javascript
export const inngest = new Inngest({ id: "chirp-app" });
```

**Function 1: Sync User from Clerk**

```javascript
// Triggered via Clerk webhook: clerk/user.created
syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    // Extract Clerk user data
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    // Generate unique username
    let username = email_addresses[0].email_address.split("@")[0];
    if (await User.findOne({ username })) {
      username += Math.floor(Math.random() * 10000);
    }

    // Save to MongoDB
    await User.create({
      _id: id,
      email: email_addresses[0].email_address,
      full_name: `${first_name} ${last_name}`,
      profile_picture: image_url,
      username,
    });
  }
);
```

**Function 2: Delete Story After 24 Hours**

```javascript
deleteStory = inngest.createFunction(
  { id: "story-delete" },
  { event: "app/story-delete" },
  async ({ event, step }) => {
    const { storyId } = event.data;

    // Wait 24 hours
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24Hours);

    // Delete story
    await step.run("delete-story", async () => {
      await Story.findByIdAndDelete(storyId);
    });
  }
);

// Trigger in story creation endpoint:
await inngest.send({
  name: "app/story-delete",
  data: { storyId: story._id },
});
```

**Function 3: Connection Request Email**

```javascript
sendNewConnectionRequestReminder = inngest.createFunction(
  { id: "send-new-connection-request-reminder" },
  { event: "app/connection-request" },
  async ({ event, step }) => {
    // Send immediate email
    await step.run("send-connection-request-mail", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id"
      );
      await sendEmail({
        to: connection.to_user_id.email,
        subject: "✋ New Connection Request",
        body: `<h2>Hi ${connection.to_user_id.full_name},</h2>...`,
      });
    });

    // Wait 24 hours
    await step.sleepUntil(
      "wait-for-24-hour",
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );

    // Send reminder if still pending
    await step.run("send-connection-request-reminder", async () => {
      const connection = await Connection.findById(connectionId);
      if (connection.status === "accepted") return;
      await sendEmail({
        /* reminder email */
      });
    });
  }
);
```

**Function 4: Daily Unseen Messages Reminder**

```javascript
// Cron job: Every day at 9 AM EST
sendNotificationOfUnseenMessages = inngest.createFunction(
  { id: "send-unseen-messages-notification" },
  { cron: "TZ=America/New_York 0 9 * * *" },
  async () => {
    const messages = await Message.find({ seen: false }).populate("to_user_id");

    // Count unseen messages per user
    const unseenCount = {};
    messages.forEach((msg) => {
      unseenCount[msg.to_user_id._id] =
        (unseenCount[msg.to_user_id._id] || 0) + 1;
    });

    // Send email to each user with unseen messages
    for (const userId in unseenCount) {
      const user = await User.findById(userId);
      await sendEmail({
        to: user.email,
        subject: `🌨️ You have ${unseenCount[userId]} unseen messages`,
        body: `<p>Click <a href="${FRONTEND_URL}/messages">here</a> to view them</p>`,
      });
    }
  }
);
```

### Key API Endpoints

#### User Routes (`/api/user`)

**GET /data** - Get current user profile

```javascript
Headers: Authorization: Bearer <token>
Response: { success: true, user: { _id, email, username, ... } }
```

**POST /update** - Update user profile

```javascript
Headers: Authorization: Bearer <token>
Body: FormData with fields: username, bio, location, full_name, profile, cover
Files: profile (image), cover (image)
Response: { success: true, user: {...}, message: 'Profile updated successfully' }
```

**POST /discover** - Search users

```javascript
Body: { input: 'search query' }
Logic: Searches username, email, full_name, location using regex (case-insensitive)
Response: { success: true, users: [...] }
```

**POST /follow** - Follow a user

```javascript
Body: { id: 'user_id_to_follow' }
Logic: Adds id to current user's following array, adds userId to target user's followers
Response: { success: true, message: 'Now you are following this user' }
```

**POST /connect** - Send connection request

```javascript
Body: { id: 'user_id_to_connect' }
Rate Limit: Max 20 requests per user in 24 hours
Logic: Creates Connection with status 'pending', triggers Inngest email event
Response: { success: true, message: 'Connection request sent successfully' }
```

**POST /accept** - Accept connection request

```javascript
Body: { id: 'from_user_id' }
Logic: Updates Connection status to 'accepted', adds both users to each other's connections array
Response: { success: true, message: 'Connection accepted successfully' }
```

#### Post Routes (`/api/post`)

**POST /add** - Create post

```javascript
Body: FormData { content, post_type }
Files: images[] (max 4 images)
Logic: Uploads images to ImageKit, creates post with image URLs
Response: { success: true, message: 'Post created successfully' }
```

**GET /feed** - Get personalized feed

```javascript
Logic: Fetches posts from current user + connections + following
Response: { success: true, posts: [...] }
Sort: Most recent first (createdAt: -1)
```

**POST /like** - Like/unlike post

```javascript
Body: { postId }
Logic: Toggle userId in likes_count array
Response: { success: true, message: 'Post liked' | 'Post unliked' }
```

#### Message Routes (`/api/message`)

**GET /:userId** - SSE stream for real-time messages

```javascript
Returns: text/event-stream
Maintains open connection, sends new messages as they arrive
```

**POST /send** - Send message

```javascript
Body: { to_user_id, text }
File: image (optional)
Logic: Creates message, pushes to recipient via SSE if connected
Response: { success: true, message: {...} }
```

**POST /get** - Get chat messages

```javascript
Body: { to_user_id }
Logic: Fetches messages between current user and to_user_id, marks as seen
Response: { success: true, messages: [...] }
Sort: Most recent first
```

---

## Frontend Deep Dive

### Redux Store Architecture (`app/store.js`)

```javascript
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/user/userSlice";
import connectionsReducer from "../features/connections/connectionSlice";
import messagesReducer from "../features/messages/messagesSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    connections: connectionsReducer,
    messages: messagesReducer,
  },
});
```

### User Slice (`features/user/userSlice.js`)

**Async Thunks:**

```javascript
// Fetch user data on app load
export const fetchUser = createAsyncThunk("user/fetchUser", async (token) => {
  const { data } = await api.get("/api/user/data", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.success ? data.user : null;
});

// Update user profile
export const updateUser = createAsyncThunk(
  "user/update",
  async ({ userData, token }) => {
    const { data } = await api.post("/api/user/update", userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (data.success) {
      toast.success(data.message);
      return data.user;
    } else {
      toast.error(data.message);
      return null;
    }
  }
);
```

**State Structure:**

```javascript
{
  user: {
    value: null | { _id, email, username, bio, profile_picture, ... }
  }
}
```

### Key Pages

#### Login Page (`pages/Login.jsx`)

- Renders Clerk's `<SignIn />` component
- Redirects to `/feed` after successful authentication
- Handles OAuth providers (Google, GitHub, etc.) via Clerk

#### Feed Page (`pages/Feed.jsx`)

- Fetches posts via `GET /api/post/feed`
- Displays posts from connections and following users
- Renders `PostCard` components with like functionality
- Shows `StoriesBar` at top

#### Messages Page (`pages/Messages.jsx`)

- Establishes SSE connection to receive real-time messages
- Displays list of recent conversations
- Opens `ChatBox` component when conversation selected
- Uses Redux to manage message state

#### Profile Page (`pages/Profile.jsx`)

- Displays user's posts, followers, following, connections
- Edit profile functionality with image upload
- Shows cover photo and profile picture

### Axios Configuration (`api/axios.js`)

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASEURL,
});

export default api;
```

**Usage Pattern:**

```javascript
import api from "../api/axios";
const { data } = await api.get("/api/user/data", {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## Interview Questions & Answers

### Architecture & Design

**Q1: Why did you choose MongoDB over a relational database like PostgreSQL?**

A: MongoDB was chosen for several reasons specific to this social media use case:

1. **Flexible Schema**: Social media features evolve rapidly. Adding new fields (like `bio`, `location`) doesn't require schema migrations.

2. **Embedded Arrays**: The User model stores `followers`, `following`, and `connections` as arrays of user IDs. In MongoDB, this is efficient for reads (one query to get user + social graph). In SQL, this would require junction tables and multiple JOINs.

3. **Horizontal Scalability**: MongoDB's sharding makes it easier to scale as user base grows.

4. **JSON-like Documents**: Posts with variable numbers of images (0-4) and stories with different media types fit naturally into document structure.

However, I acknowledge trade-offs:

- **Referential Integrity**: MongoDB doesn't enforce foreign keys, so orphaned data is possible
- **Transactions**: While MongoDB supports transactions, they're more complex than in SQL
- **Analytics**: Aggregation pipelines are less mature than SQL's rich query language

For a production system at scale, I'd consider a hybrid approach: MongoDB for user profiles and content, PostgreSQL for analytics and reporting.

---

**Q2: Explain the difference between followers/following and connections in your data model.**

A: This implements two distinct social graph patterns:

**Followers/Following (One-Way Relationship):**

- Like Twitter or Instagram
- User A can follow User B without B's approval
- Asymmetric: A follows B doesn't mean B follows A
- Implementation: Two separate arrays (`followers`, `following`)
- Use case: Public figures with many followers who don't follow back

**Connections (Two-Way Relationship):**

- Like LinkedIn
- Requires mutual acceptance (pending → accepted)
- Symmetric: If A and B are connected, both appear in each other's `connections` array
- Implementation: Separate `Connection` model + `connections` array in User model
- Use case: Close professional or personal relationships

**Why Both?**

- Provides flexibility: Users can casually follow interesting accounts while maintaining a smaller circle of close connections
- Feed algorithm can prioritize content: Connections > Following > Public

**Data Integrity Challenge:**

- When accepting a connection, we update both users' `connections` arrays AND the Connection document's status
- This violates DRY but optimizes reads (avoid JOIN-like populate on every feed fetch)

---

**Q3: How does real-time messaging work without WebSockets?**

A: The app uses **Server-Sent Events (SSE)** for server-to-client push:

**SSE Flow:**

1. Client opens persistent HTTP connection: `GET /api/message/:userId`
2. Server responds with `Content-Type: text/event-stream`
3. Server keeps connection open indefinitely
4. Server writes messages as `data: {JSON}\n\n` when they arrive
5. Client receives via `EventSource.onmessage`

**Sending Messages:**

- Client uses REST API: `POST /api/message/send`
- Server saves message to database
- Server checks if recipient has open SSE connection (`connections[to_user_id]`)
- If yes, pushes message immediately through SSE stream
- If no, message waits in database until recipient opens chat

**Code Implementation:**

```javascript
// Server maintains connection registry
const connections = { user123: responseObject };

// Push message
if (connections[to_user_id]) {
  connections[to_user_id].write(`data: ${JSON.stringify(message)}\n\n`);
}
```

**Why SSE over WebSockets?**

| Feature         | SSE                     | WebSockets      |
| --------------- | ----------------------- | --------------- |
| Bi-directional  | No (server→client only) | Yes             |
| Protocol        | HTTP                    | Custom (ws://)  |
| Auto-reconnect  | Built-in                | Manual          |
| Browser support | Wider (except IE)       | Modern browsers |
| Complexity      | Simpler                 | More complex    |

For this app, we don't need client→server push (REST API works fine). SSE is simpler and sufficient.

**Limitations:**

- Browser limit: ~6 concurrent SSE connections per domain
- Not suitable for multi-device (closing laptop closes SSE)
- For production, I'd add fallback polling or switch to WebSockets with Socket.io

---

**Q4: Walk me through the file upload and transformation pipeline.**

A: The pipeline has 5 stages:

**1. Client Upload (FormData)**

```javascript
const formData = new FormData();
formData.append("content", "My post text");
formData.append("images", file1);
formData.append("images", file2);
await api.post("/api/post/add", formData);
```

**2. Multer Middleware (Disk Storage)**

```javascript
// Configured in configs/multer.js
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
```

Files temporarily saved to `./uploads/` directory.

**3. Upload to ImageKit**

```javascript
const response = await imageKit.files.upload({
  file: fs.createReadStream(image.path), // Stream from disk
  fileName: image.originalname,
});
// Returns: { url: 'https://ik.imagekit.io/...', fileId: '...' }
```

**4. Apply Transformations**

```javascript
const transformedUrl = imageKit.helper.buildSrc({
  src: response.url,
  transformation: [
    {
      width: 1280, // Resize to max 1280px wide (aspect ratio preserved)
      quality: "auto", // Automatic quality optimization
      format: "webp", // Convert to WebP (smaller file size)
    },
  ],
});
```

**Real URL Example:**
Before: `https://ik.imagekit.io/abc/photo.jpg`
After: `https://ik.imagekit.io/abc/tr:w-1280,q-auto,f-webp/photo.jpg`

**5. Store URL & Cleanup**

```javascript
await Post.create({ image_urls: [transformedUrl] });
fs.unlinkSync(image.path); // Delete temp file
```

**Why ImageKit?**

- CDN edge caching (fast global delivery)
- Real-time transformations (no preprocessing needed)
- Automatic format detection (returns WebP for Chrome, JPEG for Safari)
- Lazy loading support with low-quality placeholders

**Alternative Considered:**

- AWS S3 + CloudFront: More control, but requires manual transformation setup
- Direct database storage: Poor performance, no CDN

---

**Q5: How do you handle story auto-deletion after 24 hours?**

A: Uses **Inngest's `sleepUntil`** for scheduled deletion:

**Story Creation Flow:**

```javascript
// 1. Create story in database
const story = await Story.create({
  user: userId,
  media_url: transformedUrl,
  media_type: "image",
});

// 2. Trigger Inngest event (don't await - fire and forget)
await inngest.send({
  name: "app/story-delete",
  data: { storyId: story._id },
});

// 3. Return response immediately
res.json({ success: true, story });
```

**Inngest Function (Background Worker):**

```javascript
const deleteStory = inngest.createFunction(
  { id: "story-delete" },
  { event: "app/story-delete" },
  async ({ event, step }) => {
    const { storyId } = event.data;

    // Calculate exact 24-hour timestamp
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Sleep until that time (Inngest manages this)
    await step.sleepUntil("wait-for-24-hours", in24Hours);

    // Delete story
    await step.run("delete-story", async () => {
      await Story.findByIdAndDelete(storyId);
      return { message: "Story-deleted" };
    });
  }
);
```

**How Inngest Works:**

1. Inngest receives event via HTTP webhook
2. Stores event in persistent queue
3. At scheduled time (24 hours later), executes `delete-story` step
4. If function fails, auto-retries with exponential backoff

**Why Inngest over Cron Jobs?**

| Approach     | Pros                | Cons                                            |
| ------------ | ------------------- | ----------------------------------------------- |
| Cron Job     | Simple setup        | Must scan all stories every minute, inefficient |
| setTimeout() | JavaScript native   | Lost on server restart, not distributed         |
| Redis Queue  | Fast, popular       | Requires Redis infra, more complex              |
| Inngest      | Durable, auto-retry | External dependency, vendor lock-in             |

**Edge Cases Handled:**

- Server restart: Inngest persists state
- Database failure: Function auto-retries
- Story manually deleted early: `findByIdAndDelete` returns null (no error)

---

### Backend Implementation

**Q6: How does Clerk authentication integrate with Express?**

A: Clerk handles auth on both frontend and backend:

**Frontend (Client):**

```javascript
// main.jsx - Wrap app with ClerkProvider
import { ClerkProvider } from "@clerk/clerk-react";

<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
  <App />
</ClerkProvider>;
```

When user signs in via `<SignIn />` component:

1. Clerk authenticates user (email/password, OAuth, etc.)
2. Issues JWT token stored in browser (httpOnly cookie or localStorage)
3. Token automatically included in requests

**Backend (Server):**

```javascript
// server.js - Apply Clerk middleware
import { clerkMiddleware } from "@clerk/express";

app.use(clerkMiddleware());
```

**What `clerkMiddleware()` Does:**

1. Extracts JWT from `Authorization: Bearer <token>` header
2. Verifies signature using Clerk's public key
3. Decodes token to get user ID and session claims
4. Attaches `req.auth()` function to request object

**Protected Route Example:**

```javascript
export const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth(); // Returns { userId, sessionId, orgId }
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await User.findById(userId);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**Clerk Webhooks (User Sync):**
When user signs up in Clerk:

1. Clerk sends webhook: `POST /api/inngest` with event `clerk/user.created`
2. Inngest receives and triggers `syncUserCreation` function
3. Function extracts user data and creates User document in MongoDB

**Why Clerk over Passport.js?**

- No password hashing logic needed
- Built-in OAuth (Google, GitHub, etc.)
- User management UI (admin dashboard)
- Multi-factor authentication
- Session management across devices

**Trade-offs:**

- Vendor lock-in (switching to another provider requires migration)
- Costs scale with MAU (monthly active users)
- User data stored in Clerk's servers (compliance considerations)

---

**Q7: Explain the rate limiting for connection requests.**

A: Prevents spam by limiting users to 20 connection requests per 24 hours:

**Implementation:**

```javascript
export const sendConnectionRequest = async (req, res) => {
  const { userId } = req.auth();
  const { id } = req.body; // Target user

  // Define 24-hour window
  const last24hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Count requests from this user in last 24 hours
  const connectionRequests = await Connection.find({
    from_user_id: userId,
    createdAt: { $gt: last24hours },
  });

  if (connectionRequests.length >= 20) {
    return res.json({
      success: false,
      message:
        "You have sent more than 20 connection requests in the last 24 hours",
    });
  }

  // Continue with request...
};
```

**How It Works:**

1. Query all Connection documents created by `userId` where `createdAt > (now - 24 hours)`
2. If count ≥ 20, reject
3. Else, allow

**Optimization Considerations:**

- Current approach queries database on every request
- Better approach: Use Redis with sliding window counter
  - Key: `rate_limit:${userId}`
  - Value: Sorted set of timestamps
  - Expire old timestamps, count remaining

**Redis Implementation (Future):**

```javascript
const count = await redis.zcount(
  `rate_limit:${userId}`,
  last24hours,
  Date.now()
);
if (count >= 20) return res.status(429).json({ error: "Rate limit exceeded" });
await redis.zadd(`rate_limit:${userId}`, Date.now(), requestId);
await redis.expire(`rate_limit:${userId}`, 86400); // 24 hours
```

**Why 20 requests?**

- Balance between usability and spam prevention
- LinkedIn allows ~100/week (~14/day)
- 20/day allows active networking without abuse

---

**Q8: How do you prevent duplicate connection requests?**

A: Multi-layered validation before creating connection:

```javascript
// Check if connection already exists (either direction)
const connection = await Connection.findOne({
  $or: [
    { from_user_id: userId, to_user_id: id },
    { from_user_id: id, to_user_id: userId },
  ],
});

if (!connection) {
  // Case 1: No prior connection - create new
  const newConnection = await Connection.create({
    from_user_id: userId,
    to_user_id: id,
  });
  return res.json({ success: true, message: "Connection request sent" });
} else if (connection && connection.status === "accepted") {
  // Case 2: Already connected
  return res.json({
    success: false,
    message: "You are already connected with this user",
  });
}

// Case 3: Request pending
return res.json({
  success: false,
  message: "Connection request is pending",
});
```

**Edge Case: Simultaneous Requests**
If User A and User B send requests to each other at the same time:

- Two pending connections might be created
- Solution: Add unique compound index in MongoDB
  ```javascript
  connectionSchema.index({ from_user_id: 1, to_user_id: 1 }, { unique: true });
  ```
- Database enforces uniqueness, second request fails

**Why check both directions?**

- If A sent request to B, B should not be able to send request to A
- Prevents scenario where both requests are pending

---

### Frontend Implementation

**Q9: How does React Router protect routes that require authentication?**

A: Uses Clerk's `<SignedIn>` and `<SignedOut>` components:

**App.jsx:**

```javascript
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <>
              <SignedOut>
                <Login />
              </SignedOut>
              <SignedIn>
                <Navigate to="/feed" />
              </SignedIn>
            </>
          }
        />

        {/* Protected routes */}
        <Route
          path="/feed"
          element={
            <SignedIn>
              <Feed />
            </SignedIn>
          }
        />
      </Routes>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </BrowserRouter>
  );
}
```

**How It Works:**

1. Clerk tracks auth state in context
2. `<SignedIn>` only renders children if user is authenticated
3. `<SignedOut>` renders if user is not authenticated
4. `<RedirectToSignIn>` handles deep linking (saves intended route)

**Alternative Approaches:**

**Manual Guard:**

```javascript
function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <Navigate to="/login" />;

  return children;
}

<Route
  path="/feed"
  element={
    <ProtectedRoute>
      <Feed />
    </ProtectedRoute>
  }
/>;
```

**Why Clerk's approach is better:**

- Handles loading state automatically
- Preserves redirect URL after login
- Works with Clerk's session management

---

**Q10: Explain the Redux data flow for fetching and displaying posts.**

A: **Flow:**

1. **User navigates to Feed page**

```javascript
// pages/Feed.jsx
useEffect(() => {
  dispatch(fetchPosts(token));
}, []);
```

2. **Async thunk dispatched**

```javascript
// features/posts/postsSlice.js (hypothetical)
export const fetchPosts = createAsyncThunk("posts/fetch", async (token) => {
  const { data } = await api.get("/api/post/feed", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.posts;
});
```

3. **Redux Toolkit generates actions:**

- `posts/fetch/pending` - while request is in flight
- `posts/fetch/fulfilled` - when request succeeds
- `posts/fetch/rejected` - if request fails

4. **Reducer handles actions:**

```javascript
const postsSlice = createSlice({
  name: "posts",
  initialState: { items: [], loading: false, error: null },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload; // array of posts
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});
```

5. **Component subscribes to state:**

```javascript
const { items: posts, loading } = useSelector((state) => state.posts);

if (loading) return <Spinner />;
return posts.map((post) => <PostCard key={post._id} post={post} />);
```

**Why Redux for this app?**

- **Shared state**: User data needed in Navbar, Profile, Feed
- **Caching**: Avoid re-fetching posts on page navigation
- **Optimistic updates**: Like button works instantly, syncs async

**When NOT to use Redux:**

- Simple Apps: useState/useContext sufficient
- Server-State Heavy: React Query/SWR better for API caching
- Real-time Apps: Consider Zustand (simpler than Redux)

---

**Q11: How do you handle image previews before upload?**

A: Uses `FileReader` API to create temporary data URLs:

**React Component:**

```javascript
function CreatePost() {
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 4); // Max 4 images
    setImages(files);

    // Generate previews
    const urls = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        urls.push(reader.result); // data:image/jpeg;base64,...
        if (urls.length === files.length) {
          setPreviewUrls(urls);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageChange}
      />
      <div className="previews">
        {previewUrls.map((url, i) => (
          <img key={i} src={url} alt={`Preview ${i}`} />
        ))}
      </div>
    </div>
  );
}
```

**FileReader Methods:**

- `readAsDataURL()` - Returns base64-encoded string (for img src)
- `readAsText()` - Returns text content
- `readAsArrayBuffer()` - Returns binary data

**Why `FileReader`?**

- Works client-side (no server needed for previews)
- Compatible with all browsers
- Instant feedback (no loading delay)

**Limitations:**

- Large images can cause memory issues (base64 is 33% larger than binary)
- Solution: Use `URL.createObjectURL(file)` for large files
  ```javascript
  const url = URL.createObjectURL(file);
  return <img src={url} onLoad={() => URL.revokeObjectURL(url)} />;
  ```

---

### Database & Performance

**Q12: How would you optimize the feed query as the user base grows?**

A: Current implementation is inefficient at scale:

**Current Query:**

```javascript
const user = await User.findById(userId);
const userIds = [userId, ...user.connections, ...user.following];
const posts = await Post.find({ user: { $in: userIds } })
  .populate("user")
  .sort({ createdAt: -1 });
```

**Problems:**

1. **Large $in array**: If user has 1000 connections, query becomes slow
2. **Populate overhead**: Fetches full User document for each post
3. **No pagination**: Returns all posts (could be 10,000+)
4. **No caching**: Every page load hits database

**Optimization 1: Pagination**

```javascript
const POSTS_PER_PAGE = 20;
const posts = await Post.find({ user: { $in: userIds } })
  .populate("user")
  .sort({ createdAt: -1 })
  .skip((page - 1) * POSTS_PER_PAGE)
  .limit(POSTS_PER_PAGE);
```

**Optimization 2: Cursor-based pagination (better for infinite scroll)**

```javascript
const posts = await Post.find({
  user: { $in: userIds },
  _id: { $lt: lastSeenPostId }, // MongoDB ObjectId is time-ordered
})
  .populate("user")
  .sort({ _id: -1 })
  .limit(20);
```

**Optimization 3: Select only needed fields**

```javascript
.populate('user', 'username profile_picture') // Only these fields
```

**Optimization 4: Index on Post.user + Post.createdAt**

```javascript
postSchema.index({ user: 1, createdAt: -1 });
```

**Optimization 5: Redis cache for feed**

```javascript
const cacheKey = `feed:${userId}`;
let posts = await redis.get(cacheKey);

if (!posts) {
  posts = await Post.find(...);
  await redis.setex(cacheKey, 300, JSON.stringify(posts)); // 5 min TTL
}
```

**Scalability Solution: Pre-compute feeds (like Twitter)**

1. **Fan-out on write**: When user creates post, write to all followers' feeds
2. **Read from materialized feed**: Each user has pre-built feed in Redis
3. **Trade-off**: Write amplification (1 post → 1000 writes if 1000 followers)

**For this project size:**

- Start with pagination + field selection
- Add Redis caching when > 10k users
- Consider fan-out architecture if > 100k users

---

**Q13: How do you prevent N+1 query problems in message fetching?**

A: The message endpoint uses `populate()` correctly:

**Inefficient (N+1 queries):**

```javascript
// Fetches messages (1 query)
const messages = await Message.find({ to_user_id: userId });

// Fetches user for each message (N queries)
messages.forEach(async (msg) => {
  msg.from_user = await User.findById(msg.from_user_id); // BAD!
});
```

**Efficient (2 queries via populate):**

```javascript
const messages = await Message.find({ to_user_id: userId })
  .populate("from_user_id") // Mongoose batches all user fetches into 1 query
  .sort({ createdAt: -1 });
```

**How Mongoose Populate Works:**

1. Executes `Message.find(...)` → Returns messages with user IDs
2. Extracts all unique user IDs from results
3. Executes `User.find({ _id: { $in: [id1, id2, ...] } })`
4. Matches users to messages in memory

**Even Better: Manual join with aggregation**

```javascript
const messages = await Message.aggregate([
  { $match: { to_user_id: userId } },
  { $sort: { createdAt: -1 } },
  {
    $lookup: {
      from: "users",
      localField: "from_user_id",
      foreignField: "_id",
      as: "from_user",
    },
  },
  { $unwind: "$from_user" },
]);
```

**Benefits of aggregation:**

- Single query (true join)
- Can project only needed fields
- Can filter/transform in pipeline

**When to use:**

- Populate: Simple cases, cleaner code
- Aggregation: Complex queries, max performance

---

### Security & Best Practices

**Q14: How do you prevent unauthorized users from accessing other users' data?**

A: Every protected endpoint validates ownership:

**Example: Update Profile**

```javascript
export const updateUserData = async (req, res) => {
  const { userId } = req.auth(); // From Clerk JWT

  // User can only update their own profile
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Apply updates
  await User.findByIdAndUpdate(userId, updatedData);
};
```

**Vulnerability if not careful:**

```javascript
// BAD: Client sends userId in body
const { userId, bio } = req.body;
await User.findByIdAndUpdate(userId, { bio }); // Attacker can update anyone's profile!
```

**Rule:**

- NEVER trust user IDs from request body for authorization
- ALWAYS use `req.auth().userId` from verified JWT
- Only use body IDs for specifying targets (e.g., `to_user_id` in messages)

**Example: Delete Post**

```javascript
export const deletePost = async (req, res) => {
  const { userId } = req.auth();
  const { postId } = req.body;

  const post = await Post.findById(postId);

  // Check ownership
  if (post.user !== userId) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  await Post.findByIdAndDelete(postId);
};
```

---

**Q15: How do you validate file uploads to prevent malicious files?**

A: Multi-layer validation:

**1. Multer file filter:**

```javascript
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images allowed."));
  }
};

const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});
```

**2. File extension check:**

```javascript
const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const ext = path.extname(file.originalname).toLowerCase();
if (!allowedExtensions.includes(ext)) {
  return res.status(400).json({ error: "Invalid file extension" });
}
```

**3. Magic number validation (advanced):**

```javascript
import fileType from "file-type";

const buffer = await fs.readFile(file.path);
const type = await fileType.fromBuffer(buffer);

if (type.mime !== file.mimetype) {
  return res.status(400).json({ error: "File type mismatch" });
}
```

**Why all three?**

- MIME type: Can be spoofed by client
- Extension: Easy to rename `.exe` to `.jpg`
- Magic numbers: Checks actual file header (most reliable)

**Additional Security:**

- Store files with random names (prevent path traversal)
- Scan with antivirus (ClamAV integration)
- Use CDN (ImageKit) instead of serving files directly

**ImageKit Security Bonus:**

- ImageKit scans uploads for malware
- Restricts file types server-side
- Generates signed URLs for private images

---

**Q16: How would you add unit and integration tests to this project?**

A: **Backend Testing (Jest + Supertest):**

**Setup:**

```bash
npm install --save-dev jest supertest mongodb-memory-server
```

**Example: User Controller Test**

```javascript
// __tests__/userController.test.js
import request from "supertest";
import app from "../server";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("User API", () => {
  test("GET /api/user/data should return user", async () => {
    // Mock Clerk auth
    const mockAuth = jest.fn(() => ({ userId: "test_user_123" }));

    const response = await request(app)
      .get("/api/user/data")
      .set("Authorization", "Bearer fake_token")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.user).toHaveProperty("username");
  });

  test("POST /api/user/update should update bio", async () => {
    const response = await request(app)
      .post("/api/user/update")
      .set("Authorization", "Bearer fake_token")
      .send({ bio: "New bio" })
      .expect(200);

    expect(response.body.user.bio).toBe("New bio");
  });
});
```

**Frontend Testing (React Testing Library):**

```javascript
// __tests__/PostCard.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import PostCard from "../components/PostCard";

test("should toggle like when button clicked", async () => {
  const mockPost = {
    _id: "123",
    content: "Test post",
    likes_count: [],
    user: { username: "testuser" },
  };

  render(
    <Provider store={store}>
      <PostCard post={mockPost} />
    </Provider>
  );

  const likeButton = screen.getByRole("button", { name: /like/i });
  fireEvent.click(likeButton);

  expect(screen.getByText("1 like")).toBeInTheDocument();
});
```

**E2E Testing (Playwright/Cypress):**

```javascript
// e2e/feed.spec.js
test("should display posts on feed page", async ({ page }) => {
  await page.goto("http://localhost:5173/feed");
  await page.waitForSelector('[data-testid="post-card"]');

  const posts = await page.$$('[data-testid="post-card"]');
  expect(posts.length).toBeGreaterThan(0);
});
```

**Coverage Goals:**

- Controllers: 80%+ (business logic)
- Models: 100% (simple schemas)
- Components: 60%+ (UI can change frequently)

---

### Scalability & Production

**Q17: How would you deploy this to production?**

A: **Multi-environment setup:**

**1. Database (MongoDB Atlas):**

- Cluster: M10 shared (production), M0 free (staging)
- Backups: Daily automated snapshots
- Connection string in env vars

**2. Backend (Render/Railway/AWS EC2):**

**Dockerfile:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["node", "server.js"]
```

**Environment Variables:**

```bash
NODE_ENV=production
PORT=4000
MONGO_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_live_...
IMAGEKIT_PRIVATE_KEY=...
SMTP_USER=...
```

**3. Frontend (Vercel/Netlify):**

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_BASEURL`

**4. Inngest (Inngest Cloud):**

- Register app at https://inngest.com
- Point webhook to `https://api.yourdomain.com/api/inngest`
- Functions auto-discovered from `/api/inngest` endpoint

**5. Monitoring:**

- Sentry: Error tracking
- LogRocket: Session replay
- Datadog: APM and logs
- Uptime monitoring: Pingdom

**6. CI/CD Pipeline (GitHub Actions):**

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: vercel/action@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

**7. Performance Optimization:**

- Enable gzip compression: `app.use(compression())`
- Add rate limiting: `express-rate-limit`
- CDN for static assets: CloudFlare
- Database indexes (already covered)
- Redis caching layer

---

**Q18: What would break if 10,000 users were online simultaneously?**

A: **Bottlenecks:**

**1. SSE Connections (CRITICAL)**

- Current: All connections stored in memory (`connections = {}`)
- Problem: Server restart loses all connections
- Solution: Use Redis Pub/Sub for distributed SSE

  ```javascript
  // Publish message
  await redis.publish(`user:${to_user_id}:messages`, JSON.stringify(message));

  // Subscribe in SSE endpoint
  const subscriber = redis.duplicate();
  subscriber.subscribe(`user:${userId}:messages`);
  subscriber.on("message", (channel, data) => {
    res.write(`data: ${data}\n\n`);
  });
  ```

**2. MongoDB Connection Pool**

- Default: 100 connections
- 10k users \* 1 request/sec = 10k concurrent queries (impossible)
- Solution: Increase pool size, add connection pooling
  ```javascript
  mongoose.connect(MONGO_URI, {
    maxPoolSize: 500,
    minPoolSize: 10,
  });
  ```

**3. File Uploads**

- Problem: All uploads block event loop
- Solution: Use worker threads or separate upload service
  ```javascript
  import { Worker } from "worker_threads";
  new Worker("./uploadWorker.js", { workerData: { file } });
  ```

**4. Feed Generation**

- Current: Query on every page load
- Solution: Pre-compute feeds (Redis sorted sets)

  ```javascript
  // On post creation
  const followers = await User.findById(userId).select("followers");
  followers.forEach(async (follower) => {
    await redis.zadd(`feed:${follower}`, Date.now(), postId);
  });

  // On feed fetch
  const postIds = await redis.zrevrange(`feed:${userId}`, 0, 19); // Top 20
  const posts = await Post.find({ _id: { $in: postIds } });
  ```

**5. Email Sending**

- Inngest handles queuing, but SMTP can rate-limit
- Solution: Use SendGrid/AWS SES (higher limits)

**Load Testing:**

```bash
# Using Apache Bench
ab -n 10000 -c 100 http://localhost:4000/api/post/feed

# Using k6
k6 run --vus 1000 --duration 30s load-test.js
```

---

## Additional Topics

### Q19: Why did you choose Vite over Create React App?

A: **Vite Advantages:**

1. **Faster Dev Server:**

   - CRA: Bundles entire app on start (~30sec for medium apps)
   - Vite: Serves files as ESM, starts instantly (~200ms)

2. **Hot Module Replacement (HMR):**

   - CRA: Reloads entire module
   - Vite: Precise HMR (only changed component)

3. **Production Build:**

   - Both use Rollup/Webpack, similar performance
   - Vite uses ESBuild for pre-bundling (10-100x faster)

4. **Modern Features:**
   - Native TypeScript support (no config)
   - CSS Modules, PostCSS, Tailwind work out-of-box
   - Dynamic imports optimized

**Trade-offs:**

- CRA more stable (longer history)
- Vite requires Node 14.18+ (CRA more lenient)
- Some old dependencies need polyfills in Vite

**For this project:**

- Dev speed critical during development
- Modern browser targets (no IE11)
- Vite's Tailwind integration cleaner

---

### Q20: How would you add video support to posts and stories?

A: **Implementation Plan:**

**1. Backend Changes:**

**Update Post Model:**

```javascript
const postSchema = new mongoose.Schema({
  // ... existing fields
  video_url: { type: String },
  media_type: { type: String, enum: ["text", "image", "video", "mixed"] },
  video_thumbnail: { type: String },
});
```

**Upload Endpoint:**

```javascript
const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for videos
  fileFilter: (req, file, cb) => {
    const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (
      file.mimetype.startsWith("image/") ||
      videoTypes.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos allowed"));
    }
  },
});
```

**ImageKit Video Upload:**

```javascript
const response = await imageKit.files.upload({
  file: fs.createReadStream(video.path),
  fileName: video.originalname,
  folder: "/videos",
});

// Generate thumbnail at 00:00:01
const thumbnailUrl = `${response.url}/tr:so-1`;

await Post.create({
  video_url: response.url,
  video_thumbnail: thumbnailUrl,
  media_type: "video",
});
```

**2. Frontend Changes:**

**Video Preview:**

```javascript
function VideoPreview({ file }) {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <video src={preview} controls width="100%" />;
}
```

**Optimizations:**

- Lazy loading: Intersection Observer API
- Autoplay muted on scroll (like Instagram)
- Picture-in-Picture support

**3. Challenges:**

- **Storage costs**: Videos are 10-100x larger than images
- **Bandwidth**: Streaming vs progressive download
- **Encoding**: Convert to web-optimized formats (H.264, VP9)
- **Subtitles**: VTT file support

**Better Solution: Use Cloudflare Stream or Mux**

- Automatic encoding to multiple resolutions
- Adaptive bitrate streaming (HLS/DASH)
- Built-in player with analytics
- Costs scale better than DIY

---

This documentation covers the entire project architecture, implementation details, and common interview questions. Use it to confidently explain every aspect of the PingUp social media platform in technical interviews.
