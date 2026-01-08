import React from 'react';
import { useNavigate } from 'react-router-dom';

const MentionHashtagText = ({ text, className = '' }) => {
  const navigate = useNavigate();

  if (!text) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    const target = e.target;
    
    if (target.tagName === 'A') {
      e.preventDefault();
      const href = target.getAttribute('href');
      if (href) {
        navigate(href);
      }
    }
  };

  // Format text with clickable hashtags and mentions
  const formatText = (text) => {
    // Replace hashtags
    let formatted = text.replace(/#(\w+)/g, '<a href="/hashtag/$1" class="text-purple-600 hover:underline font-semibold cursor-pointer">#$1</a>');
    
    // Replace mentions
    formatted = formatted.replace(/@(\w+)/g, '<a href="/profile/$1" class="text-blue-600 hover:underline font-semibold cursor-pointer">@$1</a>');
    
    return formatted;
  };

  return (
    <div 
      className={className}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: formatText(text) }}
    />
  );
};

export default MentionHashtagText;
