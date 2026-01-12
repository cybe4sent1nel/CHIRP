import { useState, useEffect, useRef } from 'react';
import { Search, Shield, Clock, Eye } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useCustomAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAvatarUrl } from '../utils/avatarHelper';

const SearchUsers = () => {
  const { getToken } = useAuth();
  const { token: customToken } = useCustomAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const searchRef = useRef(null);

  const placeholders = [
    'Search users...',
    'Find someone...',
    'Who are you looking for?',
    'Discover users...',
    'Search for a friend...',
    'Type a name...',
  ];

  // Change placeholder every 3 seconds when input is empty
  useEffect(() => {
    if (searchQuery.trim()) return;
    
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [searchQuery, placeholders.length]);

  // Check if user is admin (for displaying admin badge)
  const isCurrentUserAdmin = (user) => {
    return user?.isAdmin || user?.role === 'admin' || user?.role === 'super_admin';
  };

    // Check if user has an active, non-expired story
    const hasActiveStory = (user) => {
        if (!user?.stories || user.stories.length === 0) return false;

        const now = new Date();
        return user.stories.some(story => {
            const createdAt = new Date(story.createdAt);
            const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours
            return expiresAt > now;
        });
    };

    // Determine if we can view user's profile based on privacy settings
    const canViewProfile = (user, currentUserId) => {
        if (user._id === currentUserId) return true;
        if (user.privacy?.wholeAccountPrivate) {
            return user.followers?.includes(currentUserId) || user.connections?.includes(currentUserId);
        }
        return true;
    };

    const performSearch = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        try {
            setLoading(true);
            const clerkToken = await getToken();
            const authToken = clerkToken || customToken;

            const { data } = await api.get('/api/user/search', {
                params: { query },
                headers: { Authorization: `Bearer ${authToken}` }
            });

            if (data.success) {
                setSearchResults(data.users || []);
                setShowResults(true);
            }
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to search users');
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                performSearch(searchQuery);
            } else {
                setShowResults(false);
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative flex-1 max-w-xl" ref={searchRef}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder={placeholders[placeholderIndex]}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.trim() && setShowResults(true)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="divide-y">
                            {searchResults.map((user) => {
                                const hasStory = hasActiveStory(user);
                                const canView = canViewProfile(user, user._id); // This should be current user ID

                                return (
                                    <Link
                                        key={user._id}
                                        to={`/profile/${user._id}`}
                                        onClick={() => setShowResults(false)}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors group"
                                    >
                                        {/* Profile Picture with Story Ring */}
                                        <div className="relative">
                                            <img
                                                src={getAvatarUrl(user)}
                                                alt={user.full_name}
                                                className={`w-12 h-12 rounded-full object-cover ${hasStory ? 'ring-2 ring-offset-2 ring-indigo-500 animate-pulse' : ''
                                                    }`}
                                            />
                                            {isCurrentUserAdmin(user) && (
                                              <Shield className="absolute -bottom-1 -right-1 w-4 h-4 text-amber-500 bg-white rounded-full p-0.5 border border-amber-500" />
                                            )}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {canView ? user.full_name : 'Private Account'}
                                                </p>
                                                {user.is_verified && (
                                                  <span className="text-blue-500 text-sm">✓</span>
                                                )}
                                                {isCurrentUserAdmin(user) && (
                                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                                                    Admin
                                                  </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">
                                                @{canView ? user.username : user._id}
                                            </p>
                                            {user.privacy?.wholeAccountPrivate && (
                                                <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                                                    <Eye className="w-3 h-3" /> Private Account
                                                </p>
                                            )}
                                        </div>

                                        {/* Story Indicator */}
                                        {hasStory && (
                                            <div className="flex-shrink-0">
                                                <Clock className="w-4 h-4 text-indigo-500 animate-bounce" />
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No users found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchUsers;
