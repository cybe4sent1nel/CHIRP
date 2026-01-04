import React, { useState } from 'react';
import { X, Search, Send } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ForwardMessageModal = ({ message, onClose }) => {
  const { connections } = useSelector((state) => state.connections);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { getToken } = useAuth();

  const filteredConnections = connections.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleForward = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    setIsSending(true);
    try {
      const token = await getToken();
      const forwardPromises = selectedUsers.map(userId =>
        api.post('/api/message/forward', {
          messageId: message._id,
          to_user_id: userId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      await Promise.all(forwardPromises);
      toast.success(`Message forwarded to ${selectedUsers.length} ${selectedUsers.length === 1 ? 'person' : 'people'}`);
      onClose();
    } catch (error) {
      toast.error('Failed to forward message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Forward Message</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Selected Count */}
        {selectedUsers.length > 0 && (
          <div className="px-4 py-2 bg-indigo-50 text-sm text-indigo-700">
            {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'} selected
          </div>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredConnections.length > 0 ? (
            <div className="space-y-2">
              {filteredConnections.map((user) => (
                <div
                  key={user._id}
                  onClick={() => toggleUser(user._id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.includes(user._id)
                      ? 'bg-indigo-50 border-2 border-indigo-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={user.profile_picture}
                      alt={user.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {selectedUsers.includes(user._id) && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{user.full_name}</p>
                    <p className="text-sm text-gray-600 truncate">@{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No connections found' : 'No connections available'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={selectedUsers.length === 0 || isSending}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send size={18} />
            {isSending ? 'Forwarding...' : 'Forward'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;
