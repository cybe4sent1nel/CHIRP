import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const MessageInfo = ({ message, currentUserId, onClose }) => {
  // Only show message info to the sender
  const isOwnMessage = message.sender_id === currentUserId || message.from_user_id === currentUserId;
  
  if (!isOwnMessage) {
    return null;
  }

  const readBy = message.read_by || [];
  const deliveredTo = message.delivered_to || [];
  const sentTime = new Date(message.createdAt).toLocaleString();
  const deliveredTime = message.delivered_at ? new Date(message.delivered_at).toLocaleString() : null;
  const readTime = message.read_at ? new Date(message.read_at).toLocaleString() : null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-800">Message Info</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Sent */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">✓ Sent</p>
            <p className="text-sm text-gray-600">{sentTime}</p>
          </div>

          {/* Delivered */}
          {(deliveredTime || deliveredTo.length > 0 || message.delivered || message.delivered_at) && (
            <div>
              <p className="text-sm font-semibold text-green-700 mb-1">✓✓ Delivered</p>
              <p className="text-sm text-gray-600">{deliveredTime || 'Delivered'}</p>
            </div>
          )}

          {/* Read */}
          {(readTime || readBy.length > 0 || message.read || message.read_at) && (
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-1">✓✓ Read</p>
              <p className="text-sm text-gray-600">{readTime || 'Read'}</p>
            </div>
          )}

          {/* Message Status */}
          <div className="pt-4 border-t">
            <p className="text-xs font-semibold text-gray-700 mb-2">Message Status</p>
            <div className="space-y-2 text-xs text-gray-600">
              <p>Status: {message.read_at ? '✓✓ Read' : message.delivered_at ? '✓✓ Delivered' : message.sent ? '✓ Sent' : 'Sending...'}</p>
              {message.edited && <p>✏️ Edited {message.edited_at ? `at ${new Date(message.edited_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : ''}</p>}
              {message.forwarded && <p>↪️ Forwarded message</p>}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MessageInfo;
