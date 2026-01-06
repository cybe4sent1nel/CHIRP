import Channel from '../models/Channel.js';
import ChannelMessage from '../models/ChannelMessage.js';
import User from '../models/User.js';

// Create a new channel
export const createChannel = async (req, res) => {
  try {
    const { name, description, background_url, category } = req.body;
    const creator = req.user.userId;

    const newChannel = new Channel({
      name,
      description,
      background_url,
      category: category || 'general',
      creator,
      members: [creator],
      members_roles: { [creator]: 'admin' }
    });

    await newChannel.save();
    await newChannel.populate('creator members', 'full_name username profile_picture');

    res.status(201).json({ success: true, channel: newChannel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all channels (with filters)
export const getChannels = async (req, res) => {
  try {
    const { search, filter, category } = req.query;
    const userId = req.user.userId;

    let query = {};

    // Filter by search term
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by user relationship
    if (filter === 'joined') {
      query.members = userId;
    } else if (filter === 'created') {
      query.creator = userId;
    }

    const channels = await Channel.find(query)
      .populate('creator', 'full_name username profile_picture')
      .populate('members', 'full_name username profile_picture')
      .sort({ updatedAt: -1 });

    // Add user-specific flags
    const channelsWithFlags = channels.map(channel => {
      const channelObj = channel.toObject();
      return {
        ...channelObj,
        isCreator: channel.creator._id.toString() === userId,
        isMember: channel.members.some(m => m._id.toString() === userId),
        isPinned: channel.is_pinned_by?.some(id => id.toString() === userId)
      };
    });

    res.json({ success: true, channels: channelsWithFlags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single channel
export const getChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const channel = await Channel.findById(id)
      .populate('creator', 'full_name username profile_picture')
      .populate('members', 'full_name username profile_picture');

    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Check if user is member
    const isMember = channel.members.some(m => m._id.toString() === userId);
    const isCreator = channel.creator._id.toString() === userId;

    res.json({ 
      success: true, 
      channel: {
        ...channel.toObject(),
        isCreator,
        isMember,
        isPinned: channel.is_pinned_by?.some(id => id.toString() === userId),
        userRole: channel.members_roles?.get(userId) || 'member'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Join a channel
export const joinChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    if (channel.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    channel.members.push(userId);
    channel.members_roles.set(userId, 'member');
    await channel.save();

    await channel.populate('creator members', 'full_name username profile_picture');

    res.json({ success: true, channel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Leave a channel
export const leaveChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Don't allow creator to leave
    if (channel.creator.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Channel creator cannot leave' });
    }

    channel.members = channel.members.filter(m => m.toString() !== userId);
    channel.members_roles.delete(userId);
    await channel.save();

    res.json({ success: true, message: 'Left channel successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Pin/Unpin channel for user
export const togglePinChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    const isPinned = channel.is_pinned_by?.some(id => id.toString() === userId);
    
    if (isPinned) {
      channel.is_pinned_by = channel.is_pinned_by.filter(id => id.toString() !== userId);
    } else {
      if (!channel.is_pinned_by) channel.is_pinned_by = [];
      channel.is_pinned_by.push(userId);
    }

    await channel.save();

    res.json({ success: true, isPinned: !isPinned });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update channel settings (admin only)
export const updateChannelSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, description, background_url, category, admin_only_posting } = req.body;

    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Check if user is admin
    const userRole = channel.members_roles.get(userId);
    if (channel.creator.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (name) channel.name = name;
    if (description !== undefined) channel.description = description;
    if (background_url !== undefined) channel.background_url = background_url;
    if (category) channel.category = category;
    if (admin_only_posting !== undefined) channel.admin_only_posting = admin_only_posting;

    await channel.save();
    await channel.populate('creator members', 'full_name username profile_picture');

    res.json({ success: true, channel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update member role (admin only)
export const updateMemberRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberId, role } = req.body;
    const userId = req.user.userId;

    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Only creator can change roles
    if (channel.creator.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only creator can change roles' });
    }

    if (!['member', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    channel.members_roles.set(memberId, role);
    await channel.save();

    res.json({ success: true, message: 'Role updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove member (admin only)
export const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user.userId;

    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Check if user is admin
    const userRole = channel.members_roles.get(userId);
    if (channel.creator.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Can't remove creator
    if (channel.creator.toString() === memberId) {
      return res.status(400).json({ success: false, message: 'Cannot remove creator' });
    }

    channel.members = channel.members.filter(m => m.toString() !== memberId);
    channel.members_roles.delete(memberId);
    await channel.save();

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get trending channels
export const getTrendingChannels = async (req, res) => {
  try {
    const channels = await Channel.find()
      .populate('creator', 'full_name username profile_picture')
      .sort({ total_messages: -1, members: -1 })
      .limit(10);

    res.json({ success: true, channels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete channel (creator only)
export const deleteChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    if (channel.creator.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only creator can delete channel' });
    }

    // Delete all messages
    await ChannelMessage.deleteMany({ channel_id: id });
    
    // Delete channel
    await Channel.findByIdAndDelete(id);

    res.json({ success: true, message: 'Channel deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
