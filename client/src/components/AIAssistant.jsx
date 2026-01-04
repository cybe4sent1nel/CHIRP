/**
 * AIAssistant Component
 * Dropdown widget for inline AI suggestions
 * Can be embedded in forms for post creation, comments, etc.
 */

import { useState } from 'react';
import {
  Sparkles,
  Wand2,
  MessageSquare,
  Hash,
  Lightbulb,
  Zap,
  X,
  Check,
  Copy,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import useChirpAI from '../hooks/useChirpAI';

const AIAssistant = ({ mode = 'post', currentContent, onApply, context = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [topic, setTopic] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const { loading, error, getPostSuggestions, getCommentSuggestions, generateBio, getHashtags, improvePost, getSkillRecommendations } = useChirpAI();

  const handleGenerate = async () => {
    setSuggestions([]);
    setSelectedIndex(null);

    switch (mode) {
      case 'post':
        if (currentContent && currentContent.length > 10) {
          // Improve existing content
          const improved = await improvePost(currentContent, 'engagement');
          if (improved) setSuggestions([improved]);
        } else if (topic) {
          // Generate new suggestions
          const posts = await getPostSuggestions(topic, context?.industry);
          setSuggestions(posts);
        }
        break;

      case 'comment':
        if (context?.postContent) {
          const comments = await getCommentSuggestions(context.postContent);
          setSuggestions(comments);
        }
        break;

      case 'bio':
        if (context?.name && context?.role) {
          const bio = await generateBio(context.name, context.role, context.skills);
          if (bio) {
            const bios = bio
              .split(/Option \d:|Bio \d:/i)
              .map((b) => b.trim())
              .filter((b) => b.length > 20);
            setSuggestions(bios.length > 0 ? bios : [bio]);
          }
        }
        break;

      case 'skills':
        if (context?.role) {
          const skills = await getSkillRecommendations(context.role, context.skills);
          setSuggestions(skills.map((s) => `${s.skill} - ${s.reason}`));
        }
        break;

      default:
        break;
    }
  };

  const handleGetHashtags = async () => {
    if (currentContent) {
      const hashtags = await getHashtags(currentContent, context?.industry);
      if (hashtags.length > 0) {
        setSuggestions((prev) => [...prev, hashtags.join(' ')]);
      }
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleApply = (text) => {
    if (onApply) {
      onApply(text);
      setIsOpen(false);
    }
  };

  const getModeConfig = () => {
    switch (mode) {
      case 'post':
        return {
          title: 'AI Post Assistant',
          icon: Wand2,
          placeholder: 'What topic do you want to post about?',
          buttonText: currentContent ? 'Improve Post' : 'Generate Ideas',
        };
      case 'comment':
        return {
          title: 'AI Comment Suggestions',
          icon: MessageSquare,
          placeholder: '',
          buttonText: 'Suggest Comments',
        };
      case 'bio':
        return {
          title: 'AI Bio Generator',
          icon: Sparkles,
          placeholder: '',
          buttonText: 'Generate Bio',
        };
      case 'skills':
        return {
          title: 'AI Skill Recommendations',
          icon: Lightbulb,
          placeholder: '',
          buttonText: 'Get Recommendations',
        };
      default:
        return {
          title: 'AI Assistant',
          icon: Sparkles,
          placeholder: '',
          buttonText: 'Generate',
        };
    }
  };

  const config = getModeConfig();
  const Icon = config.icon;

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          color: 'white',
        }}
      >
        <Sparkles size={14} />
        AI
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-80 rounded-xl overflow-hidden shadow-lg z-50 animate-in slide-in-from-top-2 bg-white border border-gray-200"
        >
          {/* Header */}
          <div
            className="p-3 flex items-center justify-between text-white"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            }}
          >
            <div className="flex items-center gap-2">
              <Icon size={18} />
              <span className="font-bold text-sm">{config.title}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition"
            >
              <X size={14} className="text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 space-y-3">
            {/* Topic Input (for post mode) */}
            {mode === 'post' && !currentContent && (
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={config.placeholder}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-gray-100 border border-gray-200 focus:border-purple-500"
              />
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition hover:opacity-90 disabled:opacity-50 text-white"
              style={{
                backgroundColor: '#8b5cf6',
              }}
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
              )}
              {loading ? 'Generating...' : config.buttonText}
            </button>

            {/* Hashtag Button (for post mode) */}
            {mode === 'post' && currentContent && (
              <button
                onClick={handleGetHashtags}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition hover:opacity-90 bg-gray-100 border border-gray-200"
              >
                <Hash size={16} />
                Generate Hashtags
              </button>
            )}

            {/* Error */}
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg text-xs cursor-pointer transition bg-gray-50 border ${
                      selectedIndex === index ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <p className="text-gray-800">{suggestion}</p>
                    <div className="flex items-center justify-end gap-1 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(suggestion, index);
                        }}
                        className="p-1 rounded hover:opacity-70"
                        title="Copy"
                      >
                        {copiedIndex === index ? (
                          <Check size={12} className="text-green-600" />
                        ) : (
                          <Copy size={12} className="text-gray-600" />
                        )}
                      </button>
                      {onApply && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApply(suggestion);
                          }}
                          className="px-2 py-1 rounded text-[10px] font-bold text-white bg-purple-600 hover:bg-purple-700"
                        >
                          Use This
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 text-center bg-gray-50 border-t border-gray-200">
            <p className="text-[10px] text-gray-600">Powered by Chirp AI ✨</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
