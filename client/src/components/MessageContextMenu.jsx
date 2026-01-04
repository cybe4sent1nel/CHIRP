import React, { useState } from 'react';
import { Trash2, Flag, Ban } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const MessageContextMenu = ({ message, currentUserId, onClose, onMessageDeleted }) => {
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [blockConfirm, setBlockConfirm] = useState(false);
  const { getToken } = useAuth();

  const handleDeleteForMe = async () => {
    try {
      const token = await getToken();
      await api.delete(`/api/message/${message._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Message deleted for you');
      onMessageDeleted(message._id);
      onClose();
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleDeleteForEveryone = async () => {
    if (message.from_user_id !== currentUserId) {
      toast.error('You can only delete your own messages for everyone');
      return;
    }
    try {
      const token = await getToken();
      await api.delete(`/api/message/${message._id}/for-everyone`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Message deleted for everyone');
      onMessageDeleted(message._id);
      onClose();
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleReportUser = async (reason) => {
    try {
      const token = await getToken();
      await api.post('/api/report/user', {
        reported_user_id: message.from_user_id,
        reason,
        message_id: message._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User reported successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to report user');
    }
  };

  const handleBlockUser = async () => {
    try {
      const token = await getToken();
      await api.post('/api/block/user', {
        blocked_user_id: message.from_user_id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User blocked');
      onClose();
    } catch (error) {
      toast.error('Failed to block user');
    }
  };

  const isOwnMessage = message.from_user_id === currentUserId;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose} />

      {/* Menu */}
      <div className="relative bg-white rounded-lg shadow-xl">
        <div className="py-2">
          {/* Delete Options */}
          {showDeleteOptions ? (
            <>
              <button
                onClick={handleDeleteForMe}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete for me
              </button>
              {isOwnMessage && (
                <button
                  onClick={handleDeleteForEveryone}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-700 font-semibold flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete for everyone
                </button>
              )}
              <button
                onClick={() => setShowDeleteOptions(false)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-600"
              >
                Cancel
              </button>
            </>
          ) : showReportOptions ? (
            <>
              <p className="px-4 py-2 text-xs font-semibold text-gray-600">Report user for:</p>
              {['Spam', 'Harassment', 'Hate speech', 'Misinformation', 'Other'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReportUser(reason)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 text-yellow-700 flex items-center gap-2"
                >
                  {reason}
                </button>
              ))}
              <button
                onClick={() => setShowReportOptions(false)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-600"
              >
                Back
              </button>
            </>
          ) : blockConfirm ? (
            <>
              <p className="px-4 py-2 text-xs font-semibold text-red-600">
                Block this user?
              </p>
              <button
                onClick={handleBlockUser}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-700 font-semibold"
              >
                Yes, block user
              </button>
              <button
                onClick={() => setBlockConfirm(false)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-600"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowDeleteOptions(true)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
              >
                <Trash2 size={16} />
                Delete
              </button>
              {!isOwnMessage && (
                <>
                  <button
                    onClick={() => setShowReportOptions(true)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 flex items-center gap-2 text-yellow-700"
                  >
                    <Flag size={16} />
                    Report
                  </button>
                  <button
                    onClick={() => setBlockConfirm(true)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-700"
                  >
                    <Ban size={16} />
                    Block user
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageContextMenu;
