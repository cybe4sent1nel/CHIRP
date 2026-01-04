import React from 'react';

const UserStatus = ({ isOnline = false, lastSeen = null }) => {
  const getStatusColor = () => {
    return isOnline 
      ? 'bg-green-500' 
      : 'bg-gray-400';
  };

  const getStatusText = () => {
    if (isOnline) return 'Online';
    if (lastSeen) {
      const now = new Date();
      const last = new Date(lastSeen);
      const diffMs = now - last;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Active now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return last.toLocaleDateString();
    }
    return 'Offline';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`} />
      <span className="text-xs text-gray-600">
        {getStatusText()}
      </span>
    </div>
  );
};

export default UserStatus;
