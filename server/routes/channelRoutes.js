/**
 * Channel Routes - Chirp Broadcast Channels
 * Handles channel creation, messaging, and role management
 */

import express from 'express';
import Channel from '../models/Channel.js';
import ChannelMessage from '../models/ChannelMessage.js';

const router = express.Router();

/**
 * GET /api/channels
 * Get all channels with filter options
 */
router.get('/', async (req, res) => {
  try {
    const { search, filter } = req.query;
    const userId = req.headers['x-user-id'];

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let channels = await Channel.find(query)
      .populate('creator', 'full_name profile_picture username')
      .populate('members', 'full_name profile_picture username')
      .lean();

    // Add member/creator info for current user
    channels = channels.map(channel => ({
      ...channel,
      members_count: channel.members?.length || 0,
      isMember: channel.members?.some(m => m._id.toString() === userId),
      isCreator: channel.creator._id.toString() === userId
    }));

    // Filter by user's channels
    if (filter === 'joined') {
      channels = channels.filter(c => c.isMember || c.isCreator);
    } else if (filter === 'created') {
      channels = channels.filter(c => c.isCreator);
    }

    res.json({ success: true, channels });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch channels' });
  }
});

/**
 * POST /api/channels/create
 * Create a new channel
 */
router.post('/create', async (req, res) => {
  try {
    const { name, description, background_url, creator_id } = req.body;

    if (!name || !creator_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const channel = new Channel({
      name,
      description,
      background_url,
      creator: creator_id,
      members: [creator_id],
      members_roles: {
        [creator_id]: 'admin'
      }
    });

    await channel.save();
    await channel.populate('creator', 'full_name profile_picture username');

    res.json({ 
      success: true, 
      channel: {
        ...channel.toObject(),
        isCreator: true,
        isMember: true,
        members_count: 1
      }
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ success: false, message: 'Failed to create channel' });
  }
});

/**
 * GET /api/channels/:channelId
 * Get channel details with messages
 */
router.get('/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.headers['x-user-id'];

    const channel = await Channel.findById(channelId)
      .populate('creator', 'full_name profile_picture username _id')
      .populate('members', 'full_name profile_picture username _id role')
      .lean();

    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    const messages = await ChannelMessage.find({ channel_id: channelId })
      .populate('user_id', 'full_name profile_picture username _id')
      .sort({ createdAt: 1 })
      .lean();

    // Add user role info
    const membersList = channel.members.map(member => ({
      ...member,
      role: channel.members_roles?.[member._id.toString()] || 'member'
    }));

    res.json({
      success: true,
      channel: {
        ...channel,
        members: membersList,
        members_count: channel.members.length,
        isCreator: channel.creator._id.toString() === userId,
        isMember: channel.members.some(m => m._id.toString() === userId)
      },
      messages
    });
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch channel' });
  }
});

/**
 * POST /api/channels/:channelId/messages
 * Send a message to channel
 */
router.post('/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, user_id, message_type } = req.body;

    if (!content && !req.files?.audio) {
      return res.status(400).json({ success: false, message: 'Message content required' });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Check if user is member
    if (!channel.members.includes(user_id)) {
      return res.status(403).json({ success: false, message: 'Not a channel member' });
    }

    let messageContent = content;
    let msgType = message_type || 'text';

    // Handle voice note
    if (req.files?.audio) {
      // In production, upload to cloud storage (AWS S3, Cloudinary, etc)
      // For now, we'll store as base64 or file path
      const audioFile = req.files.audio;
      messageContent = `/uploads/voice-notes/${audioFile.name}`;
      msgType = 'voice';
      await audioFile.mv(`./uploads/voice-notes/${audioFile.name}`);
    }

    const message = new ChannelMessage({
      channel_id: channelId,
      user_id,
      content: messageContent,
      message_type: msgType
    });

    await message.save();
    await message.populate('user_id', 'full_name profile_picture username _id');

    res.json({ success: true, message: message.toObject() });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

/**
 * POST /api/channels/:channelId/join
 * Join a channel
 */
router.post('/:channelId/join', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { user_id } = req.body;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Check if already member
    if (channel.members.includes(user_id)) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    channel.members.push(user_id);
    channel.members_roles[user_id] = 'member';
    await channel.save();

    await channel.populate('creator', 'full_name profile_picture username');
    await channel.populate('members', 'full_name profile_picture username');

    res.json({ success: true, channel: channel.toObject() });
  } catch (error) {
    console.error('Error joining channel:', error);
    res.status(500).json({ success: false, message: 'Failed to join channel' });
  }
});

/**
 * POST /api/channels/:channelId/leave
 * Leave a channel
 */
router.post('/:channelId/leave', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { user_id } = req.body;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Prevent creator from leaving (they can only delete)
    if (channel.creator.toString() === user_id) {
      return res.status(400).json({ success: false, message: 'Creator cannot leave channel' });
    }

    channel.members = channel.members.filter(m => m.toString() !== user_id);
    delete channel.members_roles[user_id];
    await channel.save();

    res.json({ success: true, message: 'Left channel successfully' });
  } catch (error) {
    console.error('Error leaving channel:', error);
    res.status(500).json({ success: false, message: 'Failed to leave channel' });
  }
});

/**
 * POST /api/channels/:channelId/role/:memberId
 * Update member role (admin only)
 */
router.post('/:channelId/role/:memberId', async (req, res) => {
  try {
    const { channelId, memberId } = req.params;
    const { role, user_id } = req.body;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Check if requester is admin
    const requesterRole = channel.members_roles[user_id];
    if (requesterRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can change roles' });
    }

    // Validate role
    if (!['member', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    channel.members_roles[memberId] = role;
    await channel.save();

    res.json({ success: true, message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
});

export default router;
