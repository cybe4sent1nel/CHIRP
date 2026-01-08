import React, { useState } from 'react';
import { X, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReactionModal = ({ reactions = [], likes = [], onClose, currentUserId }) => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('all');

  // Reaction images map
  const reactionImages = {
    LIKE: "https://above-pink-vfkzifz9je.edgeone.app/like-removebg-preview.png",
    SUPPORT: "https://above-pink-vfkzifz9je.edgeone.app/support-removebg-preview.png",
    CELEBRATE: "https://above-pink-vfkzifz9je.edgeone.app/celebrate-removebg-preview.png",
    CHEER: "https://above-pink-vfkzifz9je.edgeone.app/cheer-removebg-preview.png",
    INSIGHT: "https://above-pink-vfkzifz9je.edgeone.app/idea-removebg-preview.png",
    OMG: "https://above-pink-vfkzifz9je.edgeone.app/omg-removebg-preview.png"
  };

  // Count reactions by type
  const reactionCounts = {};
  reactions.forEach(reaction => {
    const type = reaction.type || 'LIKE';
    reactionCounts[type] = (reactionCounts[type] || 0) + 1;
  });

  // Get total count
  const totalCount = likes.length;

  // Get sorted tabs
  const tabs = [
    { id: 'all', label: 'All', count: totalCount },
    ...Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ 
        id: type, 
        label: type.charAt(0) + type.slice(1).toLowerCase(), 
        count,
        image: reactionImages[type]
      }))
  ];

  // Filter users based on selected tab
  const filteredUsers = selectedTab === 'all' 
    ? likes 
    : likes.filter(like => {
        const reaction = reactions.find(r => {
          const reactionUserId = typeof r.user === 'object' ? r.user._id : r.user;
          const likeUserId = typeof like === 'object' ? like._id : like;
          return reactionUserId === likeUserId;
        });
        return reaction && reaction.type === selectedTab;
      });

  const handleUserClick = (user) => {
    const userId = typeof user === 'object' ? user._id : user;
    const username = typeof user === 'object' ? user.username : null;
    
    if (userId === currentUserId) {
      navigate('/profile');
    } else {
      navigate(`/profile/${username || userId}`);
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reactions</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-zinc-700 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold border-2 border-blue-200 dark:border-blue-700'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {tab.image && (
                <img src={tab.image} alt={tab.label} className="w-5 h-5" />
              )}
              <span className="text-sm">{tab.label}</span>
              <span className="text-sm font-semibold">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Users List */}
        <div className="overflow-y-auto max-h-[calc(80vh-180px)]">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No reactions yet
            </div>
          ) : (
            <div className="p-2">
              {filteredUsers.map((like, index) => {
                const user = typeof like === 'object' ? like : null;
                if (!user) return null;

                // Find user's reaction - match by user ID
                const reaction = reactions.find(r => {
                  const reactionUserId = typeof r.user === 'object' ? r.user._id : r.user;
                  const userId = typeof user === 'object' ? user._id : user;
                  return reactionUserId === userId || reactionUserId === user._id || r.user === user._id;
                });

                console.log('User reaction check:', { userName: user.full_name, userId: user._id, reaction, allReactions: reactions });

                return (
                  <div
                    key={user._id || index}
                    onClick={() => handleUserClick(user)}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={user.profile_picture}
                          alt={user.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {reaction && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-zinc-900 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                            <img
                              src={reactionImages[reaction.type]}
                              alt={reaction.type}
                              className="w-5 h-5"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {user.full_name}
                          </span>
                          <BadgeCheck className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.username || user.email?.split('@')[0] || 'User'}
                        </p>
                      </div>
                    </div>
                    {reaction && selectedTab === 'all' && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 font-medium">
                        {reaction.type.charAt(0) + reaction.type.slice(1).toLowerCase()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReactionModal;
