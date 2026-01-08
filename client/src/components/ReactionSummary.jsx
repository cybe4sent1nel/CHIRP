import React from 'react';

const ReactionSummary = ({ reactions = [], likes = [], currentUserId, onClick }) => {
  // Count reactions by type
  const reactionCounts = {};
  const reactionUsers = {};
  
  reactions.forEach(reaction => {
    const type = reaction.type || 'LIKE';
    reactionCounts[type] = (reactionCounts[type] || 0) + 1;
    if (!reactionUsers[type]) reactionUsers[type] = [];
    reactionUsers[type].push(reaction.user);
  });

  // Get all reactions (sorted by count) - show all types, not just top 3
  const topReactions = Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1]);

  console.log('ReactionSummary Debug:', { reactions, reactionCounts, topReactions, totalLikes: likes.length });

  // Check if current user reacted
  const userReaction = reactions.find(r => r.user === currentUserId);
  const totalLikes = Array.isArray(likes) ? likes.length : 0;

  // Get first liker's name
  const firstLiker = Array.isArray(likes) && likes.length > 0 ? likes[0] : null;
  const firstLikerName = firstLiker && typeof firstLiker === 'object' 
    ? (firstLiker.full_name || firstLiker.username || 'Someone')
    : null;

  // Reaction images map
  const reactionImages = {
    LIKE: "https://above-pink-vfkzifz9je.edgeone.app/like-removebg-preview.png",
    SUPPORT: "https://above-pink-vfkzifz9je.edgeone.app/support-removebg-preview.png",
    CELEBRATE: "https://above-pink-vfkzifz9je.edgeone.app/celebrate-removebg-preview.png",
    CHEER: "https://above-pink-vfkzifz9je.edgeone.app/cheer-removebg-preview.png",
    INSIGHT: "https://above-pink-vfkzifz9je.edgeone.app/idea-removebg-preview.png",
    OMG: "https://above-pink-vfkzifz9je.edgeone.app/omg-removebg-preview.png"
  };

  if (totalLikes === 0) return null;

  return (
    <div 
      className="flex items-center justify-between py-2 px-2"
    >
      {/* Left: Reaction Icons with Total Count */}
      <div 
        className="flex items-center gap-2 cursor-pointer hover:underline"
        onClick={onClick}
      >
        {/* Reaction Icons - Show all unique reaction types */}
        <div className="flex -space-x-2">
          {topReactions.map(([type, count]) => (
            <div 
              key={type}
              className="w-9 h-9 rounded-full bg-white dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              title={`${count} ${type}`}
            >
              <img 
                src={reactionImages[type]} 
                alt={type}
                className="w-7 h-7 object-contain"
              />
            </div>
          ))}
        </div>

        {/* Total Count */}
        <span className="text-base font-semibold text-gray-800 dark:text-gray-200 hover:text-blue-600 transition-colors">
          {totalLikes}
        </span>
      </div>

      {/* Right: Comments and Reposts count (if needed, can be added by parent) */}
    </div>
  );
};

export default ReactionSummary;
