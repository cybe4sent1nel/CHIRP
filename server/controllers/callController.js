import User from '../models/User.js';

// Store active calls in memory (for production, use Redis)
const activeCalls = new Map();

// Initiate a call
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

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Store call info
    activeCalls.set(callId, {
      callerId,
      recipientId,
      callType,
      status: 'calling',
      startTime: Date.now()
    });

    // In a real implementation, send notification via WebSocket/SSE
    // For now, just acknowledge
    res.status(200).json({
      success: true,
      message: 'Call initiated',
      callId
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

// Accept a call
export const acceptCall = async (req, res) => {
  try {
    const { callerId, callId } = req.body;
    const recipientId = req.userId;

    const call = activeCalls.get(callId);
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Update call status
    call.status = 'connected';
    call.connectedTime = Date.now();
    activeCalls.set(callId, call);

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

// Send WebRTC answer
export const sendAnswer = async (req, res) => {
  try {
    const { recipientId, answer } = req.body;

    // In production, send this via WebSocket to the recipient
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

// Send ICE candidate
export const sendICECandidate = async (req, res) => {
  try {
    const { recipientId, candidate } = req.body;

    // In production, send this via WebSocket to the recipient
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

// End a call
export const endCall = async (req, res) => {
  try {
    const { recipientId, callId } = req.body;

    if (callId && activeCalls.has(callId)) {
      const call = activeCalls.get(callId);
      const duration = call.connectedTime 
        ? Math.floor((Date.now() - call.connectedTime) / 1000)
        : 0;

      activeCalls.delete(callId);

      res.status(200).json({
        success: true,
        message: 'Call ended',
        duration
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

// Get call history
export const getCallHistory = async (req, res) => {
  try {
    const userId = req.userId;

    // In production, fetch from database
    // For now, return empty array
    res.status(200).json({
      success: true,
      calls: []
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
