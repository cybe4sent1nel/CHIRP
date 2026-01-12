import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronDown, Shield, User, Settings } from 'lucide-react';
import AdminAnimatedLogoutButton from './AdminAnimatedLogoutButton';

const AdminProfileDropdown = ({ adminData }) => {
  const navigate = useNavigate();
  const reduxUser = useSelector((state) => state.user.value);
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



  const getDisplayName = () => {
    return reduxUser?.full_name || adminData?.name || 'Admin';
  };

  const getDisplayUsername = () => {
    return reduxUser?.username || reduxUser?.email?.split('@')[0] || 'admin';
  };

  const getDisplayEmail = () => {
    return reduxUser?.email || adminData?.email || '';
  };

  const getDisplayImage = () => {
    return reduxUser?.profile_picture || adminData?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=667eea&color=fff`;
  };

  const isAdmin = true; // Admin is always true in this context

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md"
      >
        <div className="relative">
          <img
            src={getDisplayImage()}
            alt={getDisplayName()}
            className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500"
          />
          {isAdmin && (
            <Shield className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-amber-500 bg-white rounded-full p-0.5 border border-amber-500" />
          )}
        </div>
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
              <div className="relative">
                <img
                  src={getDisplayImage()}
                  alt={getDisplayName()}
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
                />
                {isAdmin && (
                  <Shield className="absolute -bottom-1 -right-1 w-4 h-4 text-amber-500 bg-white rounded-full p-0.5 border border-amber-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {getDisplayName()}
                  </p>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                </div>
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

          {/* Logout Button */}
          <div className="border-t border-gray-100 p-3 bg-gray-50">
            <AdminAnimatedLogoutButton />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfileDropdown;
