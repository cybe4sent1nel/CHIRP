import ChannelMessage from '../models/ChannelMessage.js';
import Channel from '../models/Channel.js';

// Get all messages for a channel
export const getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;

    // Check if user is member
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    if (!channel.members.some(m => m.toString() === userId)) {
      return res.status(403).json({ success: false, message: 'Not a member of this channel' });
    }

    const messages = await ChannelMessage.find({ channel_id: channelId })
      .populate('user_id', 'full_name username profile_picture')
      .populate('reply_to')
      .sort({ createdAt: 1 });

    // Mark messages as viewed by this user
    const messageIds = messages.map(m => m._id);
    await ChannelMessage.updateMany(
      { _id: { $in: messageIds }, viewed_by: { $ne: userId } },
      { $push: { viewed_by: userId } }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send a message to a channel
export const sendChannelMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, message_type, reply_to, file_name } = req.body;
    const userId = req.user.userId;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Check if user is member
    if (!channel.members.some(m => m.toString() === userId)) {
      return res.status(403).json({ success: false, message: 'Not a member of this channel' });
    }

    // Check admin-only posting
    if (channel.admin_only_posting) {
      const userRole = channel.members_roles.get(userId);
      if (channel.creator.toString() !== userId && !['admin', 'moderator'].includes(userRole)) {
        return res.status(403).json({ success: false, message: 'Only admins can post in this channel' });
      }
    }

    const newMessage = new ChannelMessage({
      channel_id: channelId,
      user_id: userId,
      content,
      message_type: message_type || 'text',
      reply_to: reply_to || null,
      file_name: file_name || null,
      viewed_by: [userId]
    });

    await newMessage.save();
    await newMessage.populate('user_id', 'full_name username profile_picture');

    // Update channel's total messages and updatedAt
    channel.total_messages += 1;
    channel.updatedAt = Date.now();
    await channel.save();

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// React to a message
export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    const message = await ChannelMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Initialize reactions map if needed
    if (!message.reactions) {
      message.reactions = new Map();
    }

    // Get current users who reacted with this emoji
    const currentReactions = message.reactions.get(emoji) || [];
    const userIndex = currentReactions.findIndex(id => id.toString() === userId);

    if (userIndex > -1) {
      // Remove reaction
      currentReactions.splice(userIndex, 1);
      if (currentReactions.length === 0) {
        message.reactions.delete(emoji);
      } else {
        message.reactions.set(emoji, currentReactions);
      }
    } else {
      // Add reaction
      currentReactions.push(userId);
      message.reactions.set(emoji, currentReactions);
    }

    await message.save();
    await message.populate('user_id', 'full_name username profile_picture');

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Pin/Unpin a message (admin only)
export const togglePinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await ChannelMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const channel = await Channel.findById(message.channel_id);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Check if user is admin
    const userRole = channel.members_roles.get(userId);
    if (channel.creator.toString() !== userId && !['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    message.is_pinned = !message.is_pinned;
    await message.save();

    // Update channel's pinned messages
    if (message.is_pinned) {
      if (!channel.pinned_messages.includes(messageId)) {
        channel.pinned_messages.push(messageId);
      }
    } else {
      channel.pinned_messages = channel.pinned_messages.filter(id => id.toString() !== messageId);
    }
    await channel.save();

    res.json({ success: true, isPinned: message.is_pinned });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a message (admin only or message owner)
export const deleteChannelMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await ChannelMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const channel = await Channel.findById(message.channel_id);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Check permissions
    const userRole = channel.members_roles.get(userId);
    const isOwner = message.user_id.toString() === userId;
    const isAdmin = channel.creator.toString() === userId || ['admin', 'moderator'].includes(userRole);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await ChannelMessage.findByIdAndDelete(messageId);

    // Update channel's total messages
    channel.total_messages = Math.max(0, channel.total_messages - 1);
    await channel.save();

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a poll
export const createPoll = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { question, options, multiple_choice, expires_hours } = req.body;
    const userId = req.user.userId;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Check if user can post
    if (!channel.members.some(m => m.toString() === userId)) {
      return res.status(403).json({ success: false, message: 'Not a member of this channel' });
    }

    if (channel.admin_only_posting) {
      const userRole = channel.members_roles.get(userId);
      if (channel.creator.toString() !== userId && !['admin', 'moderator'].includes(userRole)) {
        return res.status(403).json({ success: false, message: 'Only admins can post polls' });
      }
    }

    // Create poll message
    const expiresAt = expires_hours ? new Date(Date.now() + expires_hours * 60 * 60 * 1000) : null;

    const pollMessage = new ChannelMessage({
      channel_id: channelId,
      user_id: userId,
      content: question,
      message_type: 'poll',
      poll_data: {
        question,
        options: options.map(opt => ({ text: opt, votes: [] })),
        multiple_choice: multiple_choice || false,
        expires_at: expiresAt
      },
      viewed_by: [userId]
    });

    await pollMessage.save();
    await pollMessage.populate('user_id', 'full_name username profile_picture');

    channel.total_messages += 1;
    await channel.save();

    res.status(201).json({ success: true, message: pollMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Vote on a poll
export const votePoll = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user.userId;

    const message = await ChannelMessage.findById(messageId);
    if (!message || message.message_type !== 'poll') {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    // Check if poll is expired
    if (message.poll_data.expires_at && new Date() > message.poll_data.expires_at) {
      return res.status(400).json({ success: false, message: 'Poll has expired' });
    }

    const option = message.poll_data.options[optionIndex];
    if (!option) {
      return res.status(400).json({ success: false, message: 'Invalid option' });
    }

    // Check if user already voted
    const hasVoted = option.votes.some(id => id.toString() === userId);

    if (hasVoted) {
      // Remove vote
      option.votes = option.votes.filter(id => id.toString() !== userId);
    } else {
      // If not multiple choice, remove previous votes
      if (!message.poll_data.multiple_choice) {
        message.poll_data.options.forEach(opt => {
          opt.votes = opt.votes.filter(id => id.toString() !== userId);
        });
      }
      // Add vote
      option.votes.push(userId);
    }

    await message.save();
    await message.populate('user_id', 'full_name username profile_picture');

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get pinned messages for a channel
export const getPinnedMessages = async (req, res) => {
  try {
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    const pinnedMessages = await ChannelMessage.find({ _id: { $in: channel.pinned_messages } })
      .populate('user_id', 'full_name username profile_picture')
      .sort({ createdAt: -1 });

    res.json({ success: true, messages: pinnedMessages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
