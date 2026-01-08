// Extract hashtags from text
export const extractHashtags = (text) => {
  if (!text) return [];
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];
  return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
};

// Extract mentions from text
export const extractMentions = (text) => {
  if (!text) return [];
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  if (!matches) return [];
  return [...new Set(matches.map(mention => mention.slice(1).toLowerCase()))];
};

// Format text with clickable hashtags and mentions
export const formatTextWithLinks = (text) => {
  if (!text) return '';
  
  // Replace hashtags
  let formatted = text.replace(/#(\w+)/g, '<a href="/hashtag/$1" class="text-purple-600 hover:underline font-semibold">#$1</a>');
  
  // Replace mentions
  formatted = formatted.replace(/@(\w+)/g, '<a href="/profile/$1" class="text-blue-600 hover:underline font-semibold">@$1</a>');
  
  return formatted;
};
