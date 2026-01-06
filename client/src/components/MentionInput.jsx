import React, { useState, useRef, useEffect } from 'react';
import { AtSign, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '@clerk/clerk-react';

const MentionInput = ({ 
  value, 
  onChange, 
  placeholder = "What's on your mind?",
  className = '',
  multiline = true,
  onMention = () => {}
}) => {
  const { getToken } = useAuth();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(null);

  // Detect @ symbol and search for users
  useEffect(() => {
    const checkForMention = () => {
      const text = value || '';
      const cursorPos = inputRef.current?.selectionStart || 0;
      
      // Find the last @ before cursor
      const textBeforeCursor = text.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        const searchText = textBeforeCursor.substring(lastAtIndex + 1);
        // Check if there's a space after @ (means mention ended)
        if (!searchText.includes(' ') && searchText.length <= 20) {
          setMentionSearch(searchText);
          searchUsers(searchText);
          return;
        }
      }
      
      setShowSuggestions(false);
    };
    
    checkForMention();
  }, [value, cursorPosition]);

  const searchUsers = async (query) => {
    if (!query) {
      // Show recent users or all users
      try {
        const token = await getToken();
        const { data } = await api.get('/api/user/search?limit=5', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success) {
          setSuggestions(data.users || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
      return;
    }

    try {
      const token = await getToken();
      const { data } = await api.get(`/api/user/search?q=${query}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        setSuggestions(data.users || []);
        setShowSuggestions(data.users?.length > 0);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setShowSuggestions(false);
    }
  };

  const insertMention = (user) => {
    const text = value || '';
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = text.substring(0, cursorPos);
    const textAfterCursor = text.substring(cursorPos);
    
    // Find the @ symbol position
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const beforeMention = text.substring(0, lastAtIndex);
      const mentionText = `@${user.username} `;
      const newText = beforeMention + mentionText + textAfterCursor;
      
      onChange(newText);
      onMention(user);
      setShowSuggestions(false);
      
      // Set cursor after mention
      setTimeout(() => {
        const newPosition = beforeMention.length + mentionText.length;
        inputRef.current?.setSelectionRange(newPosition, newPosition);
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className="relative">
      <InputComponent
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className} ${multiline ? 'resize-none' : ''}`}
        rows={multiline ? 4 : undefined}
      />
      
      {/* Mention Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full max-w-md mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {suggestions.map((user, index) => (
            <div
              key={user._id}
              onClick={() => insertMention(user)}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-indigo-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <img
                src={user.profile_picture || `https://ui-avatars.com/api/?name=${user.full_name}&background=random`}
                alt={user.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  @{user.username}
                </p>
              </div>
              <AtSign className="w-4 h-4 text-gray-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
