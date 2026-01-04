import express from 'express';
import { protect } from '../middlewares/auth.js';
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  reportUser,
  reportPost,
  deleteMessageForMe,
  deleteMessageForEveryone,
  clearChat,
  getMessageInfo,
  updateUserSettings,
  deleteAccount,
} from '../controllers/safetyController.js';

const safetyRouter = express.Router();

// Block/Unblock Users
safetyRouter.post('/block', protect, blockUser);
safetyRouter.post('/unblock', protect, unblockUser);
safetyRouter.get('/blocked-users', protect, getBlockedUsers);

// Report User or Post
safetyRouter.post('/report/user', protect, reportUser);
safetyRouter.post('/report/post', protect, reportPost);

// Message Management (WhatsApp-like features)
safetyRouter.delete('/message/delete-for-me', protect, deleteMessageForMe);
safetyRouter.delete('/message/delete-for-everyone', protect, deleteMessageForEveryone);
safetyRouter.delete('/chat/clear', protect, clearChat);
safetyRouter.post('/message/info', protect, getMessageInfo);

// User Settings
safetyRouter.post('/user/settings', protect, updateUserSettings);

// Account Management
safetyRouter.delete('/user/account', protect, deleteAccount);

export default safetyRouter;
