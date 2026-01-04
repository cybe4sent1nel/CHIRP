import React, { useState, useRef, useEffect } from 'react';
import { 
  Reply, 
  Copy, 
  Forward, 
  Trash2, 
  Star, 
  Info, 
  MoreVertical,
  Smile,
  Pin,
  Edit3,
  Flag,
  Ban
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ForwardMessageModal from './ForwardMessageModal';

const MessageActions = ({ 
  message, 
  onReply, 
  onInfo, 
  onDelete,
  onReact,
  onEdit,
  isOwnMessage,
  className = ""
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const menuRef = useRef(null);
  const { getToken } = useAuth();

  const reactions = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🎉', '🔥'];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
        setShowReactions(false);
        setShowDeleteOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      toast.success('Message copied');
    }
    setShowMenu(false);
  };

  const handleForward = () => {
    setShowForwardModal(true);
    setShowMenu(false);
  };

  const handleStar = async () => {
    try {
      const token = await getToken();
      await api.post(`/api/message/${message._id}/star`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Message starred');
    } catch (error) {
      toast.error('Failed to star message');
    }
    setShowMenu(false);
  };

  const handlePin = async () => {
    try {
      const token = await getToken();
      await api.post(`/api/message/${message._id}/pin`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Message pinned to conversation');
    } catch (error) {
      toast.error('Failed to pin message');
    }
    setShowMenu(false);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(message);
    }
    setShowMenu(false);
  };

  const handleReaction = (emoji) => {
    if (onReact) {
      onReact(emoji);
    }
    setShowReactions(false);
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Quick Actions (Always visible on hover) */}
      <div className={`flex items-center gap-0.5 bg-white rounded-full shadow-md border border-gray-200 p-0.5`}>
        {/* React Button */}
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          title="React"
        >
          <Smile size={16} className="text-gray-600" />
        </button>

        {/* Reply Button */}
        {onReply && (
          <button
            onClick={onReply}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            title="Reply"
          >
            <Reply size={16} className="text-gray-600" />
          </button>
        )}

        {/* More Options */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          title="More"
        >
          <MoreVertical size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Reaction Picker */}
      {showReactions && (
        <div className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} bottom-full mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex gap-1 z-50`}>
          {reactions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="text-2xl hover:scale-125 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Dropdown Menu */}
      {showMenu && (
        <div className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px] z-50`}>
          {message.text && (
            <button
              onClick={handleCopy}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
            >
              <Copy size={16} />
              Copy
            </button>
          )}
          
          {onReply && (
            <button
              onClick={() => {
                onReply();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
            >
              <Reply size={16} />
              Reply
            </button>
          )}

          <button
            onClick={handleForward}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
          >
            <Forward size={16} />
            Forward
          </button>

          <button
            onClick={handleStar}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
          >
            <Star size={16} />
            Star
          </button>

          <button
            onClick={handlePin}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
          >
            <Pin size={16} />
            Pin
          </button>

          {isOwnMessage && message.message_type === 'text' && (
            <>
              <div className="border-t border-gray-200 my-1" />
              <button
                onClick={handleEdit}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
              >
                <Edit3 size={16} />
                Edit
              </button>
            </>
          )}

          {isOwnMessage && onInfo && (
            <button
              onClick={() => {
                onInfo();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
            >
              <Info size={16} />
              Message info
            </button>
          )}

          {showDeleteOptions && (
            <div className="border-t border-gray-200 my-1">
              <button
                onClick={async () => {
                  try {
                    const token = await getToken();
                    const response = await api.delete(`/api/messages/${message._id}/for-me`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success('Deleted for you');
                    if(onDelete) onDelete('me');
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to delete message');
                  }
                  setShowMenu(false);
                  setShowDeleteOptions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
              >
                Delete for me
              </button>
              {isOwnMessage && (
                <button
                  onClick={async () => {
                    try {
                      const token = await getToken();
                      const response = await api.delete(`/api/messages/${message._id}/for-everyone`, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      toast.success('Deleted for everyone');
                      if(onDelete) onDelete('everyone');
                    } catch (error) {
                      toast.error(error.response?.data?.message || 'Failed to delete message');
                    }
                    setShowMenu(false);
                    setShowDeleteOptions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-700 font-medium"
                >
                  Delete for everyone
                </button>
              )}
            </div>
          )}

          {!showDeleteOptions && (
            <>
              <div className="border-t border-gray-200 my-1" />
              <button
                onClick={() => setShowDeleteOptions(true)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Forward Modal */}
      {showForwardModal && (
        <ForwardMessageModal
          message={message}
          onClose={() => setShowForwardModal(false)}
        />
      )}
    </div>
  );
};

export default MessageActions;
