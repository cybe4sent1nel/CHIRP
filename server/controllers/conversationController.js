import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// Get or create conversation between two users
export const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { other_user_id } = req.body;

    if (!other_user_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Other user ID is required' 
      });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      type: 'direct',
      'participants.user_id': { $all: [userId, other_user_id] }
    }).populate('participants.user_id', 'username profile_picture clerk_user_id');

    // If conversation doesn't exist, create it
    if (!conversation) {
      conversation = new Conversation({
        type: 'direct',
        participants: [
          { user_id: userId },
          { user_id: other_user_id }
        ]
      });
      await conversation.save();
      await conversation.populate('participants.user_id', 'username profile_picture clerk_user_id');
    }

    res.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get conversation' 
    });
  }
};

// Archive conversation
export const archiveConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversation_id } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Conversation ID is required' 
      });
    }

    const conversation = await Conversation.findById(conversation_id);
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found' 
      });
    }

    // Check if user is a participant
    const participantIndex = conversation.participants.findIndex(
      p => p.user_id.toString() === userId.toString()
    );

    if (participantIndex === -1) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a participant in this conversation' 
      });
    }

    // Archive for this user only
    conversation.participants[participantIndex].archived = true;
    conversation.participants[participantIndex].archived_at = new Date();

    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation archived',
      data: conversation
    });

  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to archive conversation' 
    });
  }
};

// Unarchive conversation
export const unarchiveConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversation_id } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Conversation ID is required' 
      });
    }

    const conversation = await Conversation.findById(conversation_id);
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found' 
      });
    }

    const participantIndex = conversation.participants.findIndex(
      p => p.user_id.toString() === userId.toString()
    );

    if (participantIndex === -1) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a participant in this conversation' 
      });
    }

    conversation.participants[participantIndex].archived = false;
    conversation.participants[participantIndex].archived_at = null;

    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation unarchived',
      data: conversation
    });

  } catch (error) {
    console.error('Error unarchiving conversation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to unarchive conversation' 
    });
  }
};

// Get all conversations (with archive filter)
export const getAllConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const { show_archived = false } = req.query;

    const conversations = await Conversation.find({
      'participants.user_id': userId
    })
    .populate('participants.user_id', 'username profile_picture clerk_user_id full_name')
    .populate('last_message.sender_id', 'username profile_picture')
    .sort({ 'last_message.sent_at': -1 });

    // Filter based on user's archive status
    const filteredConversations = conversations
      .map(conv => {
        const userParticipant = conv.participants.find(
          p => p.user_id._id.toString() === userId.toString()
        );
        
        return {
          ...conv.toObject(),
          isArchived: userParticipant?.archived || false,
          isPinned: userParticipant?.pinned || false,
          isMuted: userParticipant?.muted || false,
          customName: userParticipant?.custom_name || null,
          lastReadAt: userParticipant?.last_read_at || null
        };
      })
      .filter(conv => {
        if (show_archived === 'true' || show_archived === true) {
          return conv.isArchived;
        }
        return !conv.isArchived;
      });

    res.json({
      success: true,
      data: filteredConversations
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch conversations' 
    });
  }
};

// Mute/Unmute conversation
export const toggleMuteConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversation_id, mute_duration } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Conversation ID is required' 
      });
    }

    const conversation = await Conversation.findById(conversation_id);
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found' 
      });
    }

    const participantIndex = conversation.participants.findIndex(
      p => p.user_id.toString() === userId.toString()
    );

    if (participantIndex === -1) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a participant in this conversation' 
      });
    }

    const currentlyMuted = conversation.participants[participantIndex].muted;
    
    conversation.participants[participantIndex].muted = !currentlyMuted;
    
    if (!currentlyMuted && mute_duration) {
      // Mute for specific duration (in hours)
      const muteUntil = new Date();
      muteUntil.setHours(muteUntil.getHours() + parseInt(mute_duration));
      conversation.participants[participantIndex].muted_until = muteUntil;
    } else {
      conversation.participants[participantIndex].muted_until = null;
    }

    await conversation.save();

    res.json({
      success: true,
      message: currentlyMuted ? 'Conversation unmuted' : 'Conversation muted',
      data: conversation
    });

  } catch (error) {
    console.error('Error toggling mute:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle mute' 
    });
  }
};

// Pin/Unpin conversation
export const togglePinConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversation_id } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Conversation ID is required' 
      });
    }

    const conversation = await Conversation.findById(conversation_id);
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found' 
      });
    }

    const participantIndex = conversation.participants.findIndex(
      p => p.user_id.toString() === userId.toString()
    );

    if (participantIndex === -1) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a participant in this conversation' 
      });
    }

    const currentlyPinned = conversation.participants[participantIndex].pinned;
    
    conversation.participants[participantIndex].pinned = !currentlyPinned;
    conversation.participants[participantIndex].pinned_at = !currentlyPinned ? new Date() : null;

    await conversation.save();

    res.json({
      success: true,
      message: currentlyPinned ? 'Conversation unpinned' : 'Conversation pinned',
      data: conversation
    });

  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle pin' 
    });
  }
};

// Delete conversation (for current user)
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversation_id } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Conversation ID is required' 
      });
    }

    const conversation = await Conversation.findById(conversation_id);
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found' 
      });
    }

    const participantIndex = conversation.participants.findIndex(
      p => p.user_id.toString() === userId.toString()
    );

    if (participantIndex === -1) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a participant in this conversation' 
      });
    }

    // Mark as deleted for this user
    conversation.participants[participantIndex].deleted = true;
    conversation.participants[participantIndex].deleted_at = new Date();

    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation deleted'
    });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete conversation' 
    });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const conversations = await Conversation.find({
      'participants.user_id': userId
    });

    let totalUnread = 0;

    for (const conv of conversations) {
      const userParticipant = conv.participants.find(
        p => p.user_id.toString() === userId.toString()
      );

      if (!userParticipant.archived && !userParticipant.deleted) {
        const unreadCount = await Message.countDocuments({
          $or: [
            { sender_id: { $ne: userId }, recipient_id: userId },
            { from_user_id: { $ne: userId }, to_user_id: userId }
          ],
          read: false,
          createdAt: { $gt: userParticipant.last_read_at || new Date(0) }
        });

        totalUnread += unreadCount;
      }
    }

    res.json({
      success: true,
      unread_count: totalUnread
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get unread count' 
    });
  }
};
