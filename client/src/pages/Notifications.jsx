import { useState, useEffect } from "react";
import { Bell, Heart, MessageCircle, UserPlus, CheckCircle, X, CheckCheck, Repeat2 } from "lucide-react";
import moment from "moment";
import { useAuth } from "@clerk/clerk-react";
import { useCustomAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import emptyNotificationAnimation from "../../public/animations/empty notification.json";

const dummyNotifications = [
  {
    id: 1,
    type: "like",
    message: "John Doe liked your post",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
  },
  {
    id: 2,
    type: "comment",
    message: "Jane Smith commented on your photo",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
  {
    id: 3,
    type: "follow",
    message: "Mike Johnson started following you",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
  },
  {
    id: 4,
    type: "connection",
    message: "Sarah Wilson accepted your connection request",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
  {
    id: 5,
    type: "like",
    message: "Alex Brown liked your comment",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    read: false,
  },
  {
    id: 6,
    type: "comment",
    message: "Emily Davis replied to your story",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    read: true,
  },
];

const filterTabs = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "like", label: "Likes" },
  { key: "comment", label: "Comments" },
  { key: "repost", label: "Reposts" },
  { key: "connection", label: "Connections" },
];

const getIcon = (type) => {
  switch (type) {
    case "like":
      return <Heart className="w-5 h-5 text-red-500" />;
    case "comment":
      return <MessageCircle className="w-5 h-5 text-blue-500" />;
    case "repost":
      return <Repeat2 className="w-5 h-5 text-green-500" />;
    case "follow":
      return <UserPlus className="w-5 h-5 text-purple-500" />;
    case "connection":
      return <CheckCircle className="w-5 h-5 text-indigo-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

const Notifications = () => {
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();
  const { token: customToken } = useCustomAuth();
  const navigate = useNavigate();

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const clerkToken = await getToken();
      const authToken = clerkToken || customToken;
      const { data } = await api.get('/api/notification/user?limit=50', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.read;
    if (filter === "connection") return notification.type === "connection" || notification.type === "follow";
    return notification.type === filter;
  });

  const handleDelete = async (id) => {
    try {
      const clerkToken = await getToken();
      const authToken = clerkToken || customToken;
      await api.delete(`/api/notification/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const clerkToken = await getToken();
      const authToken = clerkToken || customToken;
      await api.put(`/api/notification/read/${id}`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const clerkToken = await getToken();
      const authToken = clerkToken || customToken;
      await api.put('/api/notification/read-all', {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                  filter === tab.key
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
                {tab.key === "unread" && unreadCount > 0 && (
                  <span className="ml-1 text-xs">({unreadCount})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-64 h-64 mx-auto">
                <Lottie animationData={emptyNotificationAnimation} loop={true} />
              </div>
              <p className="text-gray-500 text-lg font-semibold mt-4">No notifications to show</p>
              <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`group flex items-start gap-4 p-4 hover:bg-white/50 cursor-pointer transition-colors ${
                  !notification.read ? "bg-indigo-50/50" : "bg-white/30"
                }`}
              >
                {/* User Avatar */}
                <img
                  src={notification.sender?.profile_picture || '/default-avatar.png'}
                  alt={notification.sender?.full_name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />

                <div className={`flex-shrink-0 p-2.5 rounded-full ${
                  !notification.read ? "bg-white shadow-md" : "bg-gray-100"
                }`}>
                  {getIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    {!notification.read && (
                      <span className="flex-shrink-0 w-2 h-2 mt-2 bg-indigo-500 rounded-full animate-pulse" />
                    )}
                    <p className={`text-sm ${!notification.read ? "text-gray-900 font-semibold" : "text-gray-700"}`}>
                      {notification.message}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {moment(notification.createdAt).fromNow()}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification._id);
                  }}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
