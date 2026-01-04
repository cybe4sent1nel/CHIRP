import React, { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ChatManagement = ({ chatUserId, onChatCleared }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear all messages in this chat?')) {
      return;
    }

    try {
      setIsLoading(true);
      await api.delete('/api/safety/chat/clear', {
        data: { otherUserId: chatUserId },
      });
      toast.success('Chat cleared successfully');
      onChatCleared?.();
      setShowConfirm(false);
    } catch (error) {
      toast.error('Failed to clear chat');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t border-gray-200 p-4">
      <button
        onClick={() => setShowConfirm(!showConfirm)}
        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium text-sm"
      >
        <Trash2 size={18} />
        Clear Chat
      </button>

      {showConfirm && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Clear this chat permanently?
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                This will delete all messages in this conversation. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 px-3 py-1.5 rounded border border-yellow-300 text-yellow-700 hover:bg-yellow-100 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleClearChat}
              disabled={isLoading}
              className="flex-1 px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Clearing...' : 'Clear Chat'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatManagement;
