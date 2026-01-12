import User from '../models/User.js';
import Call from '../models/Call.js';
import ChatSettings from '../models/ChatSettings.js';
import { sseManager, sendMessageToUser } from '../services/sseService.js';

// Store active calls in memory (use Redis for production)
const activeCalls = new Map();

/**
 * Initiate a call
 */
export const initiateCall = async (req, res) => {
  try {
    const { recipientId, callType, callId } = req.body;
    const callerId = req.userId;

    if (!recipientId || !callType || !callId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID, call type, and call ID are required'
      });
    }

    // Check if caller and recipient exist
    const [caller, recipient] = await Promise.all([
      User.findById(callerId),
      User.findById(recipientId)
    ]);

    if (!caller || !recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check recipient's privacy settings
    const recipientSettings = await ChatSettings.findOne({ user_id: recipientId });
    if (recipientSettings) {
      // Check if recipient allows calls
      if (recipientSettings.privacy.allow_calls_from === 'nobody') {
        return res.status(403).json({
          success: false,
          message: 'User does not accept calls'
        });
      }

      // Check if caller is blocked
      if (recipientSettings.privacy.blocked_users.includes(callerId)) {
        return res.status(403).json({
          success: false,
          message: 'User has blocked you'
        });
      }

      // Check allow_calls_from contacts setting
      if (recipientSettings.privacy.allow_calls_from === 'contacts') {
        // Check if they are contacts (implement your contact logic)
        const isContact = caller.connections && caller.connections.includes(recipientId);
        if (!isContact) {
          return res.status(403).json({
            success: false,
            message: 'You can only call contacts'
          });
        }
      }
    }

    // Create call record
    const callRecord = await Call.create({
      caller_id: callerId,
      recipient_id: recipientId,
      call_type: callType,
      status: 'calling',
      call_started: new Date()
    });

    // Store in memory
    activeCalls.set(callId, {
      callRecordId: callRecord._id,
      callerId,
      recipientId,
      callType,
      status: 'calling',
      startTime: Date.now()
    });

    // Send call notification via SSE
    sendMessageToUser(recipientId, {
      type: 'incomingCall',
      callId,
      caller: {
        id: callerId,
        name: caller.full_name,
        username: caller.username,
        profile_picture: caller.profile_picture
      },
      callType,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Call initiated',
      callId,
      recordId: callRecord._id
    });
  } catch (error) {
    console.error('Initiate call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate call',
      error: error.message
    });
  }
};

/**
 * Accept a call
 */
export const acceptCall = async (req, res) => {
  try {
    const { callId } = req.body;
    const recipientId = req.userId;

    const call = activeCalls.get(callId);
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Update call record
    await Call.findByIdAndUpdate(call.callRecordId, {
      status: 'connected',
      call_connected: new Date()
    });

    // Update call in memory
    call.status = 'connected';
    call.connectedTime = Date.now();
    activeCalls.set(callId, call);

    // Notify caller via SSE
    sendMessageToUser(call.callerId, {
      type: 'callAccepted',
      callId,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Call accepted'
    });
  } catch (error) {
    console.error('Accept call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept call',
      error: error.message
    });
  }
};

/**
 * Reject a call
 */
export const rejectCall = async (req, res) => {
  try {
    const { callId } = req.body;
    const userId = req.userId;

    const call = activeCalls.get(callId);
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Update call record
    await Call.findByIdAndUpdate(call.callRecordId, {
      status: 'rejected',
      call_ended: new Date()
    });

    // Remove from active calls
    activeCalls.delete(callId);

    // Notify caller
    sendMessageToUser(call.callerId, {
      type: 'callRejected',
      callId,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Call rejected'
    });
  } catch (error) {
    console.error('Reject call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject call',
      error: error.message
    });
  }
};

/**
 * Send WebRTC answer
 */
export const sendAnswer = async (req, res) => {
  try {
    const { recipientId, answer, callId } = req.body;

    // Send answer via SSE to recipient
    sendMessageToUser(recipientId, {
      type: 'callAnswer',
      answer,
      callId,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Answer sent'
    });
  } catch (error) {
    console.error('Send answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send answer',
      error: error.message
    });
  }
};

/**
 * Send ICE candidate
 */
export const sendICECandidate = async (req, res) => {
  try {
    const { recipientId, candidate, callId } = req.body;

    // Send ICE candidate via SSE
    sendMessageToUser(recipientId, {
      type: 'iceCandidate',
      candidate,
      callId,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'ICE candidate sent'
    });
  } catch (error) {
    console.error('Send ICE candidate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send ICE candidate',
      error: error.message
    });
  }
};

/**
 * Update call features (mute, hold, etc.)
 */
export const updateCallFeatures = async (req, res) => {
  try {
    const { callId, features } = req.body;

    const call = activeCalls.get(callId);
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Update features in database
    await Call.findByIdAndUpdate(call.callRecordId, {
      'features_used': features
    });

    // Notify other participant
    const recipientId = call.callerId === req.userId ? call.recipientId : call.callerId;
    sendMessageToUser(recipientId, {
      type: 'callFeaturesUpdate',
      callId,
      features,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Call features updated'
    });
  } catch (error) {
    console.error('Update call features error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update call features',
      error: error.message
    });
  }
};

/**
 * End a call
 */
export const endCall = async (req, res) => {
  try {
    const { callId, duration, quality } = req.body;
    const userId = req.userId;

    if (callId && activeCalls.has(callId)) {
      const call = activeCalls.get(callId);

      // Update call record
      await Call.findByIdAndUpdate(call.callRecordId, {
        status: 'ended',
        call_ended: new Date(),
        duration: duration || 0,
        audio_quality: quality?.audio || 'good'
      });

      // Remove from active calls
      activeCalls.delete(callId);

      // Notify other participant
      const recipientId = call.callerId === userId ? call.recipientId : call.callerId;
      sendMessageToUser(recipientId, {
        type: 'callEnded',
        callId,
        duration: duration || 0,
        timestamp: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: 'Call ended',
        duration: duration || 0
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Call ended'
      });
    }
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end call',
      error: error.message
    });
  }
};

/**
 * Get call history
 */
export const getCallHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, skip = 0 } = req.query;

    const calls = await Call.find({
      $or: [
        { caller_id: userId },
        { recipient_id: userId }
      ]
    })
    .sort({ call_started: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

    const total = await Call.countDocuments({
      $or: [
        { caller_id: userId },
        { recipient_id: userId }
      ]
    });

    res.status(200).json({
      success: true,
      calls,
      total,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call history',
      error: error.message
    });
  }
};

/**
 * Get call statistics
 */
export const getCallStats = async (req, res) => {
  try {
    const userId = req.userId;

    const stats = await Call.aggregate([
      {
        $match: {
          $or: [
            { caller_id: userId },
            { recipient_id: userId }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total_calls: { $sum: 1 },
          total_duration: { $sum: '$duration' },
          missed_calls: {
            $sum: {
              $cond: [{ $eq: ['$status', 'missed'] }, 1, 0]
            }
          },
          video_calls: {
            $sum: {
              $cond: [{ $eq: ['$call_type', 'video'] }, 1, 0]
            }
          },
          voice_calls: {
            $sum: {
              $cond: [{ $eq: ['$call_type', 'voice'] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0] || {
        total_calls: 0,
        total_duration: 0,
        missed_calls: 0,
        video_calls: 0,
        voice_calls: 0
      }
    });
  } catch (error) {
    console.error('Get call stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call stats',
      error: error.message
    });
  }
};

/**
 * Delete call history
 */
export const deleteCallHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { callIds } = req.body;

    if (callIds && Array.isArray(callIds)) {
      // Delete specific calls
      await Call.deleteMany({
        _id: { $in: callIds },
        $or: [
          { caller_id: userId },
          { recipient_id: userId }
        ]
      });
    } else {
      // Delete all calls for user
      await Call.deleteMany({
        $or: [
          { caller_id: userId },
          { recipient_id: userId }
        ]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Call history deleted'
    });
  } catch (error) {
    console.error('Delete call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete call history',
      error: error.message
    });
  }
};
