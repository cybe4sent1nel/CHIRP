import { useState, useEffect } from "react";
import { menuItemsData } from "../assets/assets";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CirclePlus, LogOut, ChevronDown } from "lucide-react";
import { UserButton, useClerk, useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import api from "../api/axios";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [openSubmenu, setOpenSubmenu] = useState(null);

  useEffect(() => {
    // Get unread notifications count from localStorage or API
    const unreadNotifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    const unreadCount = unreadNotifications.filter((n) => !n.read).length;
    setNotificationCount(unreadCount);
  }, []);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get('/api/message/unread-counts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success) {
          setMessageCount(data.total);
        }
      } catch (error) {
        console.error('Failed to fetch unread message count:', error);
      }
    };

    if (user) {
      fetchUnreadMessages();
      // Refresh every 10 seconds
      const interval = setInterval(fetchUnreadMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [user, getToken]);

  // Listen for message status changes to refresh count
  useEffect(() => {
    const handleMessageRead = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get('/api/message/unread-counts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success) {
          setMessageCount(data.total);
        }
      } catch (error) {
        console.error('Failed to refresh message count:', error);
      }
    };

    window.addEventListener('messagesRead', handleMessageRead);
    window.addEventListener('messageReceived', handleMessageRead);
    
    return () => {
      window.removeEventListener('messagesRead', handleMessageRead);
      window.removeEventListener('messageReceived', handleMessageRead);
    };
  }, [getToken]);

  return (
    <div
      className={`w-60 xl:w-72 bg-white border-r border-gray-200 flex flex-col justify-between max-sm:absolute top-0 bottom-0 z-20 ${
        sidebarOpen ? "translate-x-0" : "max-sm:-translate-x-full"
      } transition-all duration-300 ease-in-out`}
    >
      <div className="w-full">
        <div className="p-4 px-6">
          <img
            onClick={() => navigate("/")}
            src="/LOGOO.png"
            alt="Logo"
            className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity"
          />
        </div>

        <nav className="px-4 mt-2 space-y-1">
          {menuItemsData.map((item) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isOpen = openSubmenu === item.label;
            
            if (hasSubmenu) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setOpenSubmenu(isOpen ? null : item.label)}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-full text-lg font-medium transition-all duration-200 text-gray-700 hover:bg-gray-100"
                  >
                    <item.Icon className="w-6 h-6" />
                    <span className="flex items-center gap-2 flex-1 justify-between">
                      {item.label}
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </button>
                  
                  {isOpen && (
                    <div className="pl-4 space-y-1 mt-1">
                      {item.submenu.map((subitem) => (
                        <NavLink
                          key={subitem.to}
                          to={subitem.to}
                          end={subitem.to === "/"}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-4 px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 ${
                              isActive
                                ? "bg-indigo-50 text-indigo-600"
                                : "text-gray-700 hover:bg-gray-100"
                            }`
                          }
                        >
                          <subitem.Icon className="w-5 h-5" />
                          <span>{subitem.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-full text-lg font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <item.Icon className="w-6 h-6" />
                <span className="flex items-center gap-2">
                  {item.label}
                  {item.label === "Notifications" && notificationCount > 0 && (
                    <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </span>
                  )}
                  {item.label === "Messages" && messageCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-lg animate-pulse">
                      {messageCount > 99 ? "99+" : messageCount}
                    </span>
                  )}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 mt-6">
          <Link
            to="/create-post"
            className="flex items-center justify-center gap-2 py-3 w-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all duration-200 text-white font-bold text-lg shadow-lg hover:shadow-xl"
          >
            <CirclePlus className="w-5 h-5" />
            Create Post
          </Link>
        </div>
      </div>

      <div className="w-full border-t border-gray-200 p-4">
        <div className="flex items-center justify-between hover:bg-gray-100 rounded-full p-3 transition-colors cursor-pointer">
          <div className="flex gap-3 items-center">
            <UserButton />
            <div className="hidden xl:block">
              <h1 className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                {user.full_name}
              </h1>
              <p className="text-xs text-gray-500 truncate max-w-[120px]">
                @{user.username}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              signOut();
              window.location.href = '/welcome';
            }}
            className="p-2 rounded-full hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
