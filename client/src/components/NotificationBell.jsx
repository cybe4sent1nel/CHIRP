import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import toast from 'react-hot-toast';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/notification/user?limit=10', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count periodically
  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/api/notification/unread-count', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      
      if (data.success) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notification/read/${notificationId}`, {}, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put('/api/notification/read-all', {}, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
    
    setShowDropdown(false);
  };

  // Delete notification
  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notification/${notificationId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  // Get notification icon color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'like': return 'text-red-500';
      case 'comment': return 'text-blue-500';
      case 'repost': return 'text-green-500';
      case 'follow': return 'text-purple-500';
      case 'mention': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial fetch and periodic polling (every 30 seconds)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      fetchNotifications();
    }
  }, [showDropdown]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* User Avatar */}
                      <img
                        src={notification.sender?.profile_picture || '/default-avatar.png'}
                        alt={notification.sender?.full_name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        {/* Notification Message */}
                        <p className={`text-sm ${getNotificationColor(notification.type)} font-medium`}>
                          {notification.message}
                        </p>
                        
                        {/* Timestamp */}
                        <p className="text-xs text-gray-500 mt-1">
                          {moment(notification.createdAt).fromNow()}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => deleteNotification(notification._id, e)}
                        className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Delete notification"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View All Link */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setShowDropdown(false);
                }}
                className="w-full text-center text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
