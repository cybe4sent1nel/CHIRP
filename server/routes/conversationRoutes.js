import express from 'express';
const router = express.Router();
import * as conversationController from '../controllers/conversationController.js';
import { protect } from '../middlewares/auth.js';

// All routes require authentication
router.post('/get-or-create', protect, conversationController.getOrCreateConversation);
router.get('/all', protect, conversationController.getAllConversations);
router.post('/archive', protect, conversationController.archiveConversation);
router.post('/unarchive', protect, conversationController.unarchiveConversation);
router.post('/toggle-mute', protect, conversationController.toggleMuteConversation);
router.post('/toggle-pin', protect, conversationController.togglePinConversation);
router.post('/delete', protect, conversationController.deleteConversation);
router.get('/unread-count', protect, conversationController.getUnreadCount);

export default router;
