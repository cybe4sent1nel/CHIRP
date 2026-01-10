import express from "express";
import {
  getChatMessages,
  sendMessage,
  editMessage,
  forwardMessage,
  starMessage,
  pinMessage,
  deleteMessageForMe,
  deleteMessageForEveryone,
  markMessagesAsRead,
  getUnreadCounts,
  markMessageAsViewed,
} from "../controllers/messageController.js";
import { upload } from "../configs/multer.js"; 
import { protect } from "../middlewares/auth.js";

const messageRouter = express.Router();

// SSE route is now handled directly in server.js before middleware
// Only keep POST routes here
messageRouter.get('/online/:userId', (req, res) => {
  try {
    const users = Array.from(global.__onlineUsers ? global.__onlineUsers.keys() : []);
    res.json({ users });
  } catch (err) {
    res.json({ users: [] });
  }
});

messageRouter.post("/send", upload.any(), protect, sendMessage);
messageRouter.post("/get", protect, getChatMessages);
messageRouter.post("/mark-read", protect, markMessagesAsRead);
messageRouter.get("/unread-counts", protect, getUnreadCounts);
messageRouter.post("/mark-viewed/:messageId", protect, markMessageAsViewed);
messageRouter.put("/:id", protect, editMessage);
messageRouter.post("/forward", protect, forwardMessage);
messageRouter.post("/:id/star", protect, starMessage);
messageRouter.post("/:id/pin", protect, pinMessage);
messageRouter.delete("/:id/for-me", protect, deleteMessageForMe);
messageRouter.delete("/:id/for-everyone", protect, deleteMessageForEveryone);

export default messageRouter;
