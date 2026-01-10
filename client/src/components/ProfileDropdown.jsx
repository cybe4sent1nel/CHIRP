import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { User, Settings, ChevronDown } from 'lucide-react';
import AnimatedLogoutButton from './AnimatedLogoutButton';
import { useCustomAuth } from '../context/AuthContext';
import { useSelector } from 'react-redux';

const ProfileDropdown = () => {
  const { user: clerkUser } = useUser();
  const { customUser } = useCustomAuth();
  const reduxUser = useSelector((state) => state.user.value);
  
  // Determine which user object to use
  const isCustomAuth = customUser && !clerkUser;
  const currentUser = clerkUser || customUser;
  const userData = clerkUser || reduxUser || customUser;
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  // Extract user display info
  const getDisplayName = () => {
    if (clerkUser) return clerkUser.fullName || clerkUser.username;
    return customUser?.full_name || customUser?.email?.split('@')[0] || 'User';
  };

  const getDisplayUsername = () => {
    if (clerkUser) return clerkUser.username;
    return customUser?.username || customUser?.email || '';
  };

  const getDisplayEmail = () => {
    if (clerkUser) return clerkUser.primaryEmailAddress?.emailAddress;
    return customUser?.email || '';
  };

  const getDisplayImage = () => {
    // Use stored profile picture if available
    if (customUser?.profile_picture) return customUser.profile_picture;
    if (clerkUser?.imageUrl) return clerkUser.imageUrl;
    
    // Generate unique DiceBear avatar based on email/username
    const seed = customUser?.email || customUser?.username || clerkUser?.username || 'default';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&scale=80`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md"
      >
        <img
          src={getDisplayImage()}
          alt={getDisplayName()}
          className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500"
        />
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-semibold text-gray-900 max-w-[120px] truncate">
            {getDisplayName()}
          </span>
          <span className="text-xs text-gray-500 max-w-[120px] truncate">
            @{getDisplayUsername()}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 hidden md:block ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center gap-3">
              <img
                src={getDisplayImage()}
                alt={getDisplayName()}
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-gray-600 truncate">@{getDisplayUsername()}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {getDisplayEmail()}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200"
            >
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">My Profile</p>
                <p className="text-xs text-gray-500">View your profile</p>
              </div>
            </Link>

            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200"
            >
              <Settings className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Settings</p>
                <p className="text-xs text-gray-500">Manage your account</p>
              </div>
            </Link>
          </div>

          {/* Animated Logout Button */}
          <div className="border-t border-gray-100 p-3 bg-gray-50">
            <AnimatedLogoutButton />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
