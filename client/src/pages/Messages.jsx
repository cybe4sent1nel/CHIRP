import { Eye, MessageSquare, Settings, Search as SearchIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import { useCustomAuth } from '../context/AuthContext';
import UserStatus from '../components/UserStatus';
import api from '../api/axios';

const Messages = () => {
  const {connections, onlineUsers} = useSelector(state => state.connections)
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { token: customToken } = useCustomAuth();
  const [searchQuery, setSearchQuery] = useState('')
  const [showDMSettings, setShowDMSettings] = useState(false)
  const [dmOpen, setDmOpen] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);

  const filteredConnections = connections
    .filter(user =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by unread count first (higher first), then alphabetically
      const unreadA = unreadCounts[a._id] || 0;
      const unreadB = unreadCounts[b._id] || 0;
      
      if (unreadA !== unreadB) {
        return unreadB - unreadA; // Higher unread count first
      }
      
      // If both have same unread count, sort alphabetically
      return a.full_name.localeCompare(b.full_name);
    });

  // Fetch unread message counts
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get('/api/message/unread-counts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success) {
          setUnreadCounts(data.unreadCounts);
          setTotalUnread(data.total);
        }
      } catch (error) {
        console.error('Failed to fetch unread counts:', error);
      }
    };

    if (connections.length > 0) {
      fetchUnreadCounts();
      // Poll every 5 seconds for real-time updates
      const interval = setInterval(fetchUnreadCounts, 5000);
      
      // Listen for message events to refresh counts immediately
      const handleMessageEvent = () => fetchUnreadCounts();
      window.addEventListener('messagesRead', handleMessageEvent);
      window.addEventListener('messageReceived', handleMessageEvent);

      return () => {
        clearInterval(interval);
        window.removeEventListener('messagesRead', handleMessageEvent);
        window.removeEventListener('messageReceived', handleMessageEvent);
      };
    }
  }, [connections, getToken]);

  return (
    <div className="min-h-screen relative bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title and Settings */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Messages</h1>
              {totalUnread > 0 && (
                <span className="mb-2 px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg animate-pulse">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
            <p className="text-slate-600">Talk to your connections and friends.</p>
          </div>
          <button
            onClick={() => setShowDMSettings(!showDMSettings)}
            className="p-2.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 transition-all shadow-sm"
            title="DM Settings"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* DM Settings Modal */}
        {showDMSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
              <h2 className="font-semibold text-lg text-gray-800 mb-4">Direct Messages</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Allow DMs from everyone</p>
                    <p className="text-sm text-gray-600">Let non-connections message you</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dmOpen}
                      onChange={(e) => setDmOpen(e.target.checked)}
                      className="rounded"
                    />
                  </label>
                </div>
                <div className="p-3 bg-blue-50 rounded border border-blue-200 text-sm text-blue-700">
                  ℹ️ When enabled, anyone can message you. When disabled, only your connections can.
                </div>
              </div>
              <button
                onClick={() => setShowDMSettings(false)}
                className="w-full mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-xl">
            <SearchIcon className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Info Note */}
        <div className="mb-6 space-y-2">
          <div className="p-3 bg-indigo-50 rounded border border-indigo-200 text-sm text-indigo-700">
            💬 <strong>Message Status:</strong> Single tick = Sent | Green tick = Delivered | Double green tick = Read
          </div>
          <div className="p-3 bg-red-50 rounded border border-red-200 text-sm text-red-700">
            🔴 <strong>Unread Messages:</strong> Chats with unread messages appear at the top with red badges showing the count
          </div>
        </div>

        {/* Connected Users */}
        {filteredConnections.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredConnections.map((user) => {
              const isOnline = onlineUsers && onlineUsers.includes(user._id);
              const unreadCount = unreadCounts[user._id] || 0;
              return (
              <div
                key={user._id}
                className={`max-w-2xl flex gap-5 p-4 bg-white shadow hover:shadow-md rounded-lg transition-all hover:border-indigo-200 border ${
                  unreadCount > 0 ? 'border-indigo-300 bg-indigo-50/30' : 'border-transparent'
                }`}
              >
                <div className="relative">
                  <img
                    src={user.profile_picture}
                    className="rounded-full size-14 object-cover"
                  />
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-slate-800">{user.full_name}</p>
                    {isOnline && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Online</span>
                    )}
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm">@{user.username}</p>
                  <p className="text-sm text-gray-600 truncate">{user.bio || 'No bio'}</p>
                </div>
                <div className="flex flex-col gap-2 justify-center">
                  <button
                    onClick={() => navigate(`/messages/${user._id}`)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap relative"
                  >
                    <MessageSquare size={16} />
                    <span>Message</span>
                    {unreadCounts[user._id] > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                        {unreadCounts[user._id] > 99 ? '99+' : unreadCounts[user._id]}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${user._id}`)}
                    className="size-10 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                    title="View profile"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">
              {searchQuery ? 'No connections found' : 'No connections yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
