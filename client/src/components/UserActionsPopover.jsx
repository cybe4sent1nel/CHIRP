import React, { useState } from 'react';
import { Flag, Ban, Trash2, X, Archive } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const UserActionsPopover = ({ user, onClose, onBlockSuccess, onReportSuccess }) => {
  const [step, setStep] = useState('menu'); // 'menu', 'report', 'block-confirm'
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const { getToken } = useAuth();

  const reportReasons = [
    'Harassment or bullying',
    'Spam or scam',
    'Hate speech or violence',
    'Misinformation',
    'Other'
  ];

  const handleReportUser = async () => {
    if (!reportReason || !reportDetails.trim()) {
      toast.error('Please select a reason and provide details');
      return;
    }

    try {
      const token = await getToken();
      await api.post('/api/report/user', {
        reported_user_id: user._id,
        reason: reportReason,
        details: reportDetails
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('User reported successfully');
      onReportSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to report user');
    }
  };

  const handleBlockUser = async () => {
    try {
      const token = await getToken();
      await api.post('/api/block/user', {
        blocked_user_id: user._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('User blocked');
      onBlockSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to block user');
    }
  };

  const handleClearMessages = async () => {
    if (!window.confirm('Delete all messages with this user?')) return;

    try {
      const token = await getToken();
      await api.delete(`/api/messages/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Messages cleared');
      onClose();
    } catch (error) {
      toast.error('Failed to clear messages');
    }
  };

  const handleDeleteChat = async () => {
    if (!window.confirm('Delete this chat conversation?')) return;

    try {
      const token = await getToken();
      await api.delete(`/api/chat/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Chat deleted');
      onClose();
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  const handleArchiveChat = async () => {
    try {
      if (!window.confirm('Archive this chat?')) return;
      const token = await getToken();
      // Ensure conversation exists and get id
      const { data: convData } = await api.post('/api/conversations/get-or-create', { other_user_id: user._id }, { headers: { Authorization: `Bearer ${token}` } });
      if (!convData || !convData.data) throw new Error('Failed to get conversation');
      const conversationId = convData.data._id || convData.data.id;
      await api.post('/api/conversations/archive', { conversation_id: conversationId }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Chat archived');
      onClose();
    } catch (error) {
      console.error('Archive chat failed', error);
      toast.error('Failed to archive chat');
    }
  };

  const handleUnarchiveChat = async () => {
    try {
      const token = await getToken();
      const { data: convData } = await api.post('/api/conversations/get-or-create', { other_user_id: user._id }, { headers: { Authorization: `Bearer ${token}` } });
      if (!convData || !convData.data) throw new Error('Failed to get conversation');
      const conversationId = convData.data._id || convData.data.id;
      await api.post('/api/conversations/unarchive', { conversation_id: conversationId }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Chat unarchived');
      onClose();
    } catch (error) {
      console.error('Unarchive chat failed', error);
      toast.error('Failed to unarchive chat');
    }
  };

  const handleToggleDisappearing = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get('/api/chat-settings', { headers: { Authorization: `Bearer ${token}` } });
      if (!data || !data.settings) throw new Error('Failed to load chat settings');
      const current = data.settings.security?.disappearing_messages_default?.enabled || false;
      const duration = data.settings.security?.disappearing_messages_default?.duration || '1h';
      const payload = { security: { disappearing_messages_default: { enabled: !current, duration } } };
      const res = await api.put('/api/chat-settings/security', payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && res.data.success) {
        toast.success(!current ? 'Disappearing messages enabled' : 'Disappearing messages disabled');
        onClose();
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Toggle disappearing failed', error);
      toast.error('Failed to toggle disappearing messages');
    }
  };

  return (
    <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-48">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm text-gray-800">{user.full_name}</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>

      <div className="py-2">
        {step === 'menu' && (
          <>
            <button
              onClick={handleClearMessages}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
            >
              <Trash2 size={16} />
              Clear messages
            </button>
            <button
              onClick={handleArchiveChat}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
            >
              <Archive size={16} />
              Archive chat
            </button>
            <button
              onClick={handleUnarchiveChat}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
            >
              <Archive size={16} />
              Unarchive chat
            </button>
            <button
              onClick={handleDeleteChat}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
            >
              <Trash2 size={16} />
              Delete chat
            </button>
            <div className="my-2 border-t" />
            <button
              onClick={handleToggleDisappearing}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 18h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Toggle disappearing messages
            </button>
            <button
              onClick={() => setStep('report')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 flex items-center gap-2 text-yellow-700"
            >
              <Flag size={16} />
              Report user
            </button>
            <button
              onClick={() => setStep('block-confirm')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-700"
            >
              <Ban size={16} />
              Block user
            </button>
          </>
        )}

        {step === 'report' && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Reason
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select a reason</option>
                {reportReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Details
              </label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide additional information..."
                className="w-full border border-gray-300 rounded p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows="4"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStep('menu');
                  setReportReason('');
                  setReportDetails('');
                }}
                className="flex-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleReportUser}
                className="flex-1 px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
              >
                Report
              </button>
            </div>
          </div>
        )}

        {step === 'block-confirm' && (
          <div className="p-4 space-y-4">
            <p className="text-sm text-gray-700">
              Block <strong>{user.full_name}</strong>? They won't be able to message you.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('menu')}
                className="flex-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockUser}
                className="flex-1 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Block
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActionsPopover;
