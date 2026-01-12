import express from 'express';
const router = express.Router();
import { protect } from '../middlewares/auth.js';
import {
  getChatSettings,
  updatePrivacySettings,
  updateSecuritySettings,
  blockUser,
  unblockUser,
  getBlockedUsers,
  muteChatNotifications,
  unmuteChatNotifications,
  exportChatData,
  deleteAllChatData
} from '../controllers/chatSettingsController.js';

// All routes require authentication
router.use(protect);

// Settings management
router.get('/', getChatSettings);
router.put('/privacy', updatePrivacySettings);
router.put('/security', updateSecuritySettings);

// Block management
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.get('/blocked-users', getBlockedUsers);

// Notification management
router.post('/mute-chat', muteChatNotifications);
router.post('/unmute-chat', unmuteChatNotifications);

// Data management
router.get('/export', exportChatData);
router.delete('/delete-all', deleteAllChatData);

export default router;
