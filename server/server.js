import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import MongoStore from "connect-mongo";

// Load environment variables from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const parentEnvPath = resolve(__dirname, "..", ".env");

// Try to load parent .env first, then local .env as fallback
config({ path: parentEnvPath });
config({ path: resolve(__dirname, ".env") });
import connectDB from "./configs/db.js";
import { inngest, functions } from "./inngest/index.js"
import { serve } from 'inngest/express';
import { clerkMiddleware } from '@clerk/express'
import passport from './configs/passport.js';
import { handleSSEConnection, handleSSEOptions } from "./controllers/sseController.js";
import { initializeMessageExpirations, clearAllExpirationTimers } from "./services/messageExpirationService.js";
import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import storyRouter from "./routes/storyRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import newsRouter from "./routes/newsRoutes.js";
import channelRouter from "./routes/channelRoutes.js";
import safetyRouter from "./routes/safetyRoutes.js";
import authRouter from "./routes/authRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import callRouter from "./routes/callRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import gameRouter from "./routes/gameRoutes.js";
import analyticsRouter from "./routes/analytics.js";
import hashtagRouter from "./routes/hashtagRoutes.js";
import reportRouter from "./routes/reportRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import onboardingDataRouter from "./routes/onboardingRoutes.js";
import preferenceRouter from "./routes/preferenceRoutes.js";
import conversationRouter from "./routes/conversationRoutes.js";
import chatSettingsRouter from "./routes/chatSettingsRoutes.js";
import { setupGameWebSocket } from "./websocket/gameSocket.js";

const app = express();

// Parse JSON body FIRST before any other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware - apply globally so API routes (including /api/message/*)
// always receive CORS headers. This is safe for SSE endpoints as well
// because they need the appropriate CORS response headers too.
app.use(cors({
  origin: true, // Reflects the request's origin in CORS headers (allows any)
  credentials: true, // Allow credentials for custom auth tokens
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type"],
  preflightContinue: false // Send CORS headers immediately, don't continue to next handler
}));

// Simple request logger to help debug routing and OAuth callbacks in Vercel logs
app.use((req, res, next) => {
  try {
    if (req.url.includes('/api/message/')) {
      // Check if it's SSE (Clerk or MongoDB ID format)
      const parts = req.url.split('/');
      const userId = parts[parts.length - 1];
      const isClerkId = userId.startsWith('user_');
      const isMongoId = /^[a-f0-9]{24}$/.test(userId);
      
      if (isClerkId || isMongoId) {
        console.log(`[REQ-SSE] ${req.method} ${req.url} - SSE REQUEST (${isClerkId ? 'Clerk' : 'MongoDB'})`);
      } else {
        console.log(`[REQ] ${req.method} ${req.url}`);
        if (req.method !== 'OPTIONS') {
          console.log(`[REQ-DETAIL] Headers:`, {
            authorization: req.headers.authorization ? 'present' : 'MISSING',
            contentType: req.headers['content-type']
          });
        }
      }
    } else {
      console.log(`[REQ] ${req.method} ${req.url}`);
    }
  } catch (e) {
    console.log('Logger error', e);
  }
  next();
});

await connectDB();

// Initialize message expiration service (load and schedule disappearing messages)
await initializeMessageExpirations();

// Catch-all early logger for debugging SSE GET
app.use((req, res, next) => {
  if (req.url.includes('/api/message/') && req.method === 'GET') {
    const userId = req.url.split('/').pop();
    console.log('[DEBUG-SSE-GET] Intercepted GET for:', userId, 'writable:', res.writable, 'headers sent:', res.headersSent);
  }
  next();
});

// Message routes - MUST come BEFORE SSE route handlers
// This ensures /api/message/unread-counts and other non-SSE routes are handled first
app.use('/api/message', messageRouter);

// SSE routes - MUST come BEFORE CORS and all other middleware/routers
// Handle SSE OPTIONS preflight
app.options("/api/message/:userId", (req, res, next) => {
  try {
    const { userId } = req.params;
    
    console.log('[SSE-ROUTE] OPTIONS /api/message/:userId received, userId:', userId);
    
    const isClerkUserId = userId.startsWith('user_');
    const isMongoDbId = /^[a-f0-9]{24}$/.test(userId);
    
    if (!isClerkUserId && !isMongoDbId) {
      console.log('[SSE-ROUTE] OPTIONS: Not a user ID format, passing to next middleware');
      return next();
    }
    
    console.log('[SSE-ROUTE] OPTIONS: ✅ Valid SSE preflight for userId:', userId);
    try {
      handleSSEOptions(req, res);
      console.log('[SSE-ROUTE] OPTIONS: Response sent');
    } catch (optErr) {
      console.error('[SSE-ROUTE] OPTIONS: handleSSEOptions error:', optErr.message);
      if (!res.headersSent) {
        res.status(500).json({ error: optErr.message });
      }
    }
  } catch (error) {
    console.error('[SSE-ROUTE] ERROR in OPTIONS handler:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Handle SSE GET requests
app.get("/api/message/:userId", async (req, res, next) => {
  const { userId } = req.params;
  
  console.log('[SSE-ROUTE-GET-ENTERED] GET request received');
  console.log('[SSE-ROUTE-GET-ENTERED] userId param:', userId);
  console.log('[SSE-ROUTE-GET-ENTERED] origin:', req.headers.origin);
  console.log('[SSE-ROUTE-GET-ENTERED] response writable:', res.writable);
  console.log('[SSE-ROUTE-GET-ENTERED] headers sent:', res.headersSent);
  
  try {
    // Check if this is a valid user ID (either Clerk format "user_" or MongoDB format which is a 24-char hex string)
    const isClerkUserId = userId.startsWith('user_');
    const isMongoDbId = /^[a-f0-9]{24}$/.test(userId);
    
    console.log('[SSE-ROUTE-GET] Checking format - Clerk:', isClerkUserId, 'MongoDB:', isMongoDbId);
    
    if (!isClerkUserId && !isMongoDbId) {
      console.log('[SSE-ROUTE] GET: Not a user ID format, passing to next middleware');
      // Not an SSE request, let messageRouter handle it
      return next();
    }
    
    console.log('[SSE-ROUTE] GET: ✅ Valid SSE request for userId:', userId, '(format:', isClerkUserId ? 'Clerk' : 'MongoDB', ')');
    console.log('[SSE-ROUTE] Response before handleSSEConnection - writable:', res.writable, 'headersSent:', res.headersSent);
    
    // Call SSE connection handler
    console.log('[SSE-ROUTE] About to call handleSSEConnection...');
    try {
      await handleSSEConnection(req, res);
      console.log('[SSE-ROUTE] handleSSEConnection completed successfully');
    } catch (err) {
      console.error('[SSE-ROUTE] ❌ handleSSEConnection threw:', err.message);
      console.error('[SSE-ROUTE] Error code:', err.code);
      console.error('[SSE-ROUTE] Error stack:', err.stack);
      if (!res.headersSent && res.writable) {
        console.log('[SSE-ROUTE] Sending 503 error response');
        res.status(503).json({
          success: false,
          message: 'SSE Service Unavailable',
          error: err.message
        });
      } else {
        console.log('[SSE-ROUTE] Cannot send error - headers sent:', res.headersSent, 'writable:', res.writable);
      }
    }
  } catch (error) {
    console.error('[SSE-ROUTE] ERROR in GET handler:', error.message);
    console.error('[SSE-ROUTE] Stack:', error.stack);
    if (!res.headersSent && res.writable) {
      res.status(503).json({
        success: false,
        message: 'SSE Service Unavailable',
        error: error.message
      });
    }
  }
});

// Health check route
app.get("/", (req, res) => res.send("Server is running"));

// SSE diagnostic endpoint
app.get("/api/sse-test/:userId", (req, res) => {
  const { userId } = req.params;
  console.log('[SSE-DIAG] Test endpoint hit with userId:', userId);
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no'
  });
  
  res.write(': SSE test started\n\n');
  
  setTimeout(() => {
    res.write('data: {"type": "test", "message": "Hello from SSE test"}\n\n');
    setTimeout(() => {
      res.write(': SSE test ending\n\n');
      res.end();
    }, 1000);
  }, 500);
});

// Session configuration for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'chirp-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600 // lazy session update (24 hours)
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Clerk middleware (optional, for dual authentication)
app.use(clerkMiddleware());

// Inngest routes
app.use("/api/inngest", serve({ 
  client: inngest, 
  functions,
  signingKey: process.env.INNGEST_SIGNING_KEY
}));

// (CORS is applied earlier to ensure API routes include CORS headers)

// Auth routes (no authentication required)
app.use('/api/auth', authRouter)

// Other routes with authentication
app.use('/api/user', userRouter)
app.use('/api/post', postRouter) 
app.use('/api/story', storyRouter)

app.use('/api/ai', aiRouter)
app.use('/api/news', newsRouter)
app.use('/api/channels', channelRouter)
app.use('/api/safety', safetyRouter)
app.use('/api/notification', notificationRouter)
app.use('/api/call', callRouter)
app.use('/api/comment', commentRouter)
app.use('/api/hashtag', hashtagRouter)
app.use('/api/report', reportRouter)
app.use('/api/admin', adminRouter)
app.use('/api/onboarding', onboardingDataRouter)
app.use('/api/preferences', preferenceRouter)
app.use('/api/conversations', conversationRouter)
app.use('/api/chat-settings', chatSettingsRouter)
app.use('/api', analyticsRouter)
app.use('/api/games', gameRouter)

// Global error handler to capture unexpected errors and return 500
// NOTE: This will only be called if the response hasn't been started yet
// SSE connections are safe because headers are sent before any errors can occur
app.use((err, req, res, next) => {
  try {
    console.error('[ERROR HANDLER] Unhandled error for path:', req.path);
    console.error('[ERROR HANDLER] Error:', err.stack || err);
    if (req.path.includes('/api/message/')) {
      console.error('[SSE ERROR DETECTED] Path contains /api/message/, error details:', {
        path: req.path,
        method: req.method,
        statusCode: err.statusCode,
        message: err.message
      });
    }
  } catch (e) {
    console.error('[ERROR HANDLER] Error while logging error:', e);
  }
  // Only send response if headers haven't been sent yet
  if (!res.headersSent) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } else {
    // Headers already sent (e.g., for SSE), just close the connection
    res.end();
  }
});

// Log unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
});

// Clean up on shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, cleaning up...');
  clearAllExpirationTimers();
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received, cleaning up...');
  clearAllExpirationTimers();
  process.exit(0);
});

const PORT = process.env.PORT || 4000;

import serverless from 'serverless-http';

// Export a serverless handler for Vercel. We still run a local server when not deployed on Vercel
// Note: WebSockets (game socket) require a stateful server and will not work on Vercel's serverless functions.
export default serverless(app);

if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  // Setup WebSocket for games (only available in local/dev or persistent servers)
  setupGameWebSocket(server);
}
