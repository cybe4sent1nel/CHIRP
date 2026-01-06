/**
 * Channel Routes - Chirp Broadcast Channels
 * Handles channel creation, messaging, and role management
 */

import express from 'express';
import Channel from '../models/Channel.js';
import ChannelMessage from '../models/ChannelMessage.js';
import multer from 'multer';
import * as channelController from '../controllers/channelController.js';
import * as channelMessageController from '../controllers/channelMessageController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * GET /api/channels
 * Get all channels with filter options
 */
router.get('/', protect, channelController.getChannels);

/**
 * GET /api/channels/trending
 * Get trending channels
 */
router.get('/trending', channelController.getTrendingChannels);

/**
 * POST /api/channels/create
 * Create a new channel
 */
router.post('/create', protect, channelController.createChannel);

/**
 * GET /api/channels/:id
 * Get channel details
 */
router.get('/:id', protect, channelController.getChannel);

/**
 * PUT /api/channels/:id/settings
 * Update channel settings (admin only)
 */
router.put('/:id/settings', protect, channelController.updateChannelSettings);

/**
 * POST /api/channels/:id/join
 * Join a channel
 */
router.post('/:id/join', protect, channelController.joinChannel);

/**
 * POST /api/channels/:id/leave
 * Leave a channel
 */
router.post('/:id/leave', protect, channelController.leaveChannel);

/**
 * POST /api/channels/:id/pin
 * Pin/unpin a channel for user
 */
router.post('/:id/pin', protect, channelController.togglePinChannel);

/**
 * PUT /api/channels/:id/members/role
 * Update member role (admin only)
 */
router.put('/:id/members/role', protect, channelController.updateMemberRole);

/**
 * DELETE /api/channels/:id/members/:memberId
 * Remove member from channel (admin only)
 */
router.delete('/:id/members/:memberId', protect, channelController.removeMember);

/**
 * DELETE /api/channels/:id
 * Delete channel (creator only)
 */
router.delete('/:id', protect, channelController.deleteChannel);

// ===== CHANNEL MESSAGES =====

/**
 * GET /api/channels/:channelId/messages
 * Get all messages for a channel
 */
router.get('/:channelId/messages', protect, channelMessageController.getChannelMessages);

/**
 * POST /api/channels/:channelId/messages
 * Send a message to channel
 */
router.post('/:channelId/messages', protect, upload.single('file'), channelMessageController.sendChannelMessage);

/**
 * POST /api/channels/:channelId/messages/:messageId/react
 * React to a channel message
 */
router.post('/:channelId/messages/:messageId/react', protect, channelMessageController.reactToMessage);

/**
 * POST /api/channels/:channelId/messages/:messageId/pin
 * Pin/unpin a message (admin only)
 */
router.post('/:channelId/messages/:messageId/pin', protect, channelMessageController.togglePinMessage);

/**
 * DELETE /api/channels/:channelId/messages/:messageId
 * Delete a message (admin or message owner)
 */
router.delete('/:channelId/messages/:messageId', protect, channelMessageController.deleteChannelMessage);

/**
 * GET /api/channels/:channelId/pinned
 * Get pinned messages for a channel
 */
router.get('/:channelId/pinned', protect, channelMessageController.getPinnedMessages);

/**
 * POST /api/channels/:channelId/polls
 * Create a poll
 */
router.post('/:channelId/polls', protect, channelMessageController.createPoll);

/**
 * POST /api/channels/:channelId/messages/:messageId/vote
 * Vote on a poll
 */
router.post('/:channelId/messages/:messageId/vote', protect, channelMessageController.votePoll);

export default router;
