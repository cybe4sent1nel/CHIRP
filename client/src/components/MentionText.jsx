import React from 'react';
import { useNavigate } from 'react-router-dom';
import { renderTextWithMentions } from '../utils/mentionParser';

const MentionText = ({ text, users = [], className = '' }) => {
  const navigate = useNavigate();
  
  // Handle empty text
  if (!text) return null;
  
  const parts = renderTextWithMentions(text, users) || [];
  
  const handleMentionClick = (e, userId) => {
    e.stopPropagation();
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };
  
  // Process text for hashtags
  const processHashtags = (textContent) => {
    if (!textContent) return [];
    const hashtagRegex = /(#\w+)/g;
    const segments = [];
    let lastIndex = 0;
    let match;
    
    while ((match = hashtagRegex.exec(textContent)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', content: textContent.substring(lastIndex, match.index) });
      }
      segments.push({ type: 'hashtag', content: match[0] });
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < textContent.length) {
      segments.push({ type: 'text', content: textContent.substring(lastIndex) });
    }
    
    return segments.length > 0 ? segments : [{ type: 'text', content: textContent }];
  };
  
  // Combine hashtag and mention processing
  const renderContent = () => {
    const elements = [];
    
    parts.forEach((part, partIndex) => {
      if (part.type === 'mention' && part.userId) {
        elements.push(
          <span
            key={`mention-${partIndex}`}
            onClick={(e) => handleMentionClick(e, part.userId)}
            className="mention-link text-green-600 hover:text-green-700 font-medium cursor-pointer hover:underline bg-green-50 px-1 rounded"
            title={part.user ? part.user.full_name : part.username}
          >
            {part.content}
          </span>
        );
      } else if (part.type === 'mention') {
        elements.push(
          <span key={`mention-${partIndex}`} className="text-green-600 font-medium">
            {part.content}
          </span>
        );
      } else {
        // Process text for hashtags
        const hashtagSegments = processHashtags(part.content);
        hashtagSegments.forEach((segment, segIndex) => {
          if (segment.type === 'hashtag') {
            elements.push(
              <span key={`${partIndex}-hashtag-${segIndex}`} className="text-indigo-600 font-medium">
                {segment.content}
              </span>
            );
          } else {
            elements.push(
              <span key={`${partIndex}-text-${segIndex}`}>{segment.content}</span>
            );
          }
        });
      }
    });
    
    return elements;
  };
  
  return (
    <span className={className}>
      {renderContent()}
    </span>
  );
};

export default MentionText;
