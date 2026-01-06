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
import { sseController } from "./controllers/messageController.js";
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
import { setupGameWebSocket } from "./websocket/gameSocket.js";

const app = express();

await connectDB();

// CORS middleware - apply early
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Health check route
app.get("/", (req, res) => res.send("Server is running"));

// Now apply middleware for remaining routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Auth routes (no authentication required)
app.use('/api/auth', authRouter)

// Other routes with authentication
app.use('/api/user', userRouter)
app.use('/api/post', postRouter) 
app.use('/api/story', storyRouter) 
app.use('/api/message', messageRouter)

// SSE route for real-time messages - Must be AFTER message router to avoid conflicts
app.get("/api/message/:userId", (req, res) => {
  console.log("SSE route handler called for userId:", req.params.userId);
  sseController(req, res);
});

app.use('/api/ai', aiRouter)
app.use('/api/news', newsRouter)
app.use('/api/channels', channelRouter)
app.use('/api/safety', safetyRouter)
app.use('/api/notification', notificationRouter)
app.use('/api/call', callRouter)
app.use('/api/comment', commentRouter)
app.use('/api', analyticsRouter)
app.use('/api/games', gameRouter)

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

// Setup WebSocket for games
setupGameWebSocket(server);
