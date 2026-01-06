// Utility to parse @mentions in text and convert them to clickable links
export const parseMentions = (text, users = []) => {
  if (!text) return '';
  
  // Regular expression to match @username (alphanumeric and underscore)
  const mentionRegex = /@(\w+)/g;
  
  let result = text;
  const mentions = [];
  let match;
  
  // Find all mentions
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      fullMatch: match[0],
      username: match[1],
      index: match.index
    });
  }
  
  // Replace mentions with HTML links (reverse order to preserve indices)
  mentions.reverse().forEach(mention => {
    const user = users.find(u => u.username === mention.username);
    if (user) {
      const linkHtml = `<a href="/profile/${user._id}" class="mention-link" data-user-id="${user._id}">${mention.fullMatch}</a>`;
      result = result.substring(0, mention.index) + linkHtml + result.substring(mention.index + mention.fullMatch.length);
    }
  });
  
  return result;
};

// Extract mentioned user IDs from text
export const extractMentions = (text) => {
  if (!text) return [];
  
  const mentionRegex = /@(\w+)/g;
  const usernames = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    usernames.push(match[1]);
  }
  
  return [...new Set(usernames)]; // Remove duplicates
};

// React component helper to render text with mentions
export const renderTextWithMentions = (text, users = [], onMentionClick) => {
  if (!text) return [{ type: 'text', content: '' }];
  
  const mentionRegex = /@(\w+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    
    // Add mention
    const username = match[1];
    const user = users.find(u => u.username === username);
    
    parts.push({
      type: 'mention',
      content: match[0],
      username,
      userId: user?._id,
      user
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }
  
  return parts;
};
