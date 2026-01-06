import { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  Send,
  Bot,
  Loader,
  Zap,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Copy,
  Share2,
  Download,
  Trash2,
  Paperclip,
  Globe,
  History,
  X,
  Image,
  Plus,
  Menu,
} from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from 'react-hot-toast';
import BeachBirdLoader from "../components/BeachBirdLoader";
import useAI from "../hooks/useAI";
import SpeechToText from "../components/SpeechToText";
import ProfileDropdown from "../components/ProfileDropdown";
import Sidebar from "../components/Sidebar";

// Typing effect component - only animates for new messages
const TypingMessage = memo(({ content, isNew = false, speed = 15 }) => {
  const [displayedText, setDisplayedText] = useState(isNew ? "" : content);
  const [isTyping, setIsTyping] = useState(isNew);

  useEffect(() => {
    if (!isNew) {
      setDisplayedText(content);
      return;
    }

    let index = 0;
    const timer = setInterval(() => {
      if (index < content.length) {
        setDisplayedText(content.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [content, isNew, speed]);

  return (
    <div className="whitespace-pre-wrap">
      {displayedText}
      {isTyping && <span className="ml-1 animate-pulse">▌</span>}
    </div>
  );
});

TypingMessage.displayName = 'TypingMessage';

const AIStudio = () => {
  const user = useSelector((state) => state.user?.value);
  const { chat, generateImage, loading: aiLoading } = useAI();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [copied, setCopied] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [context, setContext] = useState("");
  const [showContextModal, setShowContextModal] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [gradientBg, setGradientBg] = useState("");
  const [imageFiles, setImageFiles] = useState([]); // For vision model image uploads
  const [currentSessionId, setCurrentSessionId] = useState(null); // Current session ID
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar state
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageIdCounter = useRef(0);

  const generateMessageId = useCallback(() => {
    return `msg_${Date.now()}_${messageIdCounter.current++}`;
  }, []);

  const generateWelcomeMessage = useCallback(() => {
    const greetings = [
      "Welcome back", "Hello", "Hi there", "Hey", "Greetings",
      "Good to see you", "Welcome", "Nice to see you"
    ];
    const userName = user?.first_name || user?.username || "there";
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    return `${greeting}, ${userName}! 🚀`;
  }, [user]);

  const generateGradientBg = useCallback(() => {
    const gradients = [
      "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
      "linear-gradient(135deg, #fa709a 0%, #fee140 25%, #30cfd0 50%, #330867 75%, #a8edea 100%)",
      "linear-gradient(135deg, #ffecd2 0%, #fcb69f 25%, #ff9a9e 50%, #fecfef 75%, #fbc2eb 100%)",
      "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 25%, #fbc2eb 50%, #a6c1ee 75%, #ffdde1 100%)",
      "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 25%, #f093fb 50%, #4facfe 75%, #fbc2eb 100%)",
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  }, []);

  const scrollToBottom = useCallback(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Initialize welcome message
  useEffect(() => {
    setWelcomeMessage(generateWelcomeMessage());
  }, [generateWelcomeMessage]);

  // Generate gradient background on mount and keep it for the session
  useEffect(() => {
    if (!gradientBg) {
      setGradientBg(generateGradientBg());
    }
  }, [gradientBg, generateGradientBg]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ai-chat-${user?.id}`);
      if (saved) {
        const history = JSON.parse(saved);
        setChatHistory(Array.isArray(history) ? history : []);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setChatHistory([]);
    }
  }, [user?.id]);

  // Save/update current session to localStorage
  const saveCurrentSession = (newMessages) => {
    try {
      if (!user?.id) {
        console.log('Cannot save: user not logged in');
        return;
      }

      if (!currentSessionId) {
        // Create new session with UUID-like ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newSession = {
          id: sessionId,
          userId: user.id,
          username: user.username,
          timestamp: new Date().toISOString(),
          messages: newMessages,
        };
        const newHistory = [...chatHistory, newSession];
        setChatHistory(newHistory);
        localStorage.setItem(`ai-chat-${user.id}`, JSON.stringify(newHistory));
        setCurrentSessionId(sessionId);
      } else {
        // Update existing session
        const updatedHistory = chatHistory.map((session) =>
          session.id === currentSessionId
            ? { ...session, messages: newMessages }
            : session
        );
        setChatHistory(updatedHistory);
        localStorage.setItem(`ai-chat-${user.id}`, JSON.stringify(updatedHistory));
      }
    } catch (error) {
      console.error('Failed to save chat session:', error);
      toast.error('Failed to save conversation');
    }
  };

  // Prepare conversation history for context awareness
  const getConversationHistory = () => {
    return messages
      .filter((m) => m.type === "user" || m.type === "bot")
      .map((m) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.content,
      }));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || aiLoading) return;

    // Mark session as started on first message
    if (!sessionStarted) {
      setSessionStarted(true);
    }

    // Use timestamp + random string for unique ID  
    const messageId = generateMessageId();
    
    const userMessage = {
      id: messageId,
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Add loading indicator
    const loadingMessage = {
      id: `${messageId}_loading`,
      type: "bot",
      content: imageMode ? "Generating image..." : "thinking...",
      timestamp: new Date(),
      loading: true,
      isImageLoading: imageMode, // Track if we're loading an image
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      let result;
      
      // If image mode is enabled, generate image ONLY (no text generation)
      if (imageMode) {
        result = await generateImage(input);
        
        // Check if image generation was successful
        if (!result || !result.imageUrl || !result.success) {
          throw new Error(result?.error || "Image generation failed");
        }
        
        // Reset image mode after generation
        setImageMode(false);
      } else if (imageFiles.length > 0) {
        // Use vision model when images are uploaded
        const conversationHistory = getConversationHistory();
        result = await chat(
          input,
          conversationHistory,
          true,
          imageFiles[0], // Pass first image for vision analysis
          'vision'
        );
        
        // Clear image files after analysis
        setImageFiles([]);
        
        if (!result || !result.text) {
          throw new Error("No response received from vision model");
        }
      } else {
        // For text mode, use chat which has smart routing
        const conversationHistory = getConversationHistory();
        result = await chat(input, conversationHistory, true);
        
        // Check if text generation was successful
        if (!result || !result.text) {
          throw new Error("No response received from AI");
        }
      }

      // Remove loading message and add response
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.loading);
        return [
          ...filtered,
          {
            id: generateMessageId(),
            type: "bot",
            content: result.imageUrl || result.text || "Unable to generate a response.",
            timestamp: new Date(),
            isImage: !!result.imageUrl,
            isNew: !result.imageUrl,
          },
        ];
      });

      // Save to current session
      const updatedMessages = [
        ...messages,
        userMessage,
        {
          type: "bot",
          content: result.imageUrl || result.text,
          isImage: !!result.imageUrl,
        },
      ];
      saveCurrentSession(updatedMessages);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error('Failed to get response from AI');
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.loading);
        return [
          ...filtered,
          {
            id: generateMessageId(),
            type: "bot",
            content: "Unable to generate a response. Please try again.",
            timestamp: new Date(),
            isNew: true,
          },
        ];
      });
    }
  };

  const copyToClipboard = useCallback((text, messageId) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(messageId);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  }, []);

  const shareMessage = useCallback(async (text) => {
    if (navigator.share) {
      try {
        await navigator.share({ text, title: "Chirp AI" });
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(text, "share");
        }
      }
    } else {
      copyToClipboard(text, "share");
      toast.success('Copied to clipboard!');
    }
  }, [copyToClipboard]);

  const downloadImage = useCallback((imageUrl, messageId) => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `chirp-image-${messageId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Image downloaded!');
  }, []);

  const deleteMessage = useCallback((messageId) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    toast.success('Message deleted');
  }, []);

  const clearChatHistory = useCallback(() => {
    setMessages([]);
    setShowHistory(false);
    toast.success('Chat cleared');
  }, []);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setInput("");
    setSessionStarted(false);
    setShowHistory(false);
    setGradientBg(generateGradientBg());
    setWelcomeMessage(generateWelcomeMessage());
    setCurrentSessionId(null);
    setImageFiles([]);
    setContext("");
    toast.success('New conversation started');
  }, [generateWelcomeMessage, generateGradientBg]);

  const deleteSingleHistory = useCallback((sessionId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const newHistory = chatHistory.filter((session) => session.id !== sessionId);
    setChatHistory(newHistory);
    try {
      if (user?.id) {
        localStorage.setItem(`ai-chat-${user.id}`, JSON.stringify(newHistory));
      }
      toast.success('History deleted');
    } catch (error) {
      console.error('Failed to delete history:', error);
      toast.error('Failed to delete history');
    }
  }, [chatHistory, user?.id]);

  const loadHistorySession = useCallback((historySession) => {
    setMessages([...historySession.messages]);
    setShowHistory(false);
    setSessionStarted(true);
    setCurrentSessionId(historySession.id);
    setGradientBg(generateGradientBg());
    toast.success('Chat loaded');
  }, [generateGradientBg]);

  const quickActions = [
    { icon: <Sparkles className="w-5 h-5" />, label: "Post Ideas", prompt: "Give me 5 creative post ideas for tech entrepreneurs" },
    { icon: <MessageSquare className="w-5 h-5" />, label: "Comments", prompt: "Write a thoughtful comment on a tech innovation post" },
    { icon: <Zap className="w-5 h-5" />, label: "Hashtags", prompt: "Generate trending hashtags for digital marketing content" },
    { icon: <Lightbulb className="w-5 h-5" />, label: "Web Search", prompt: "What are the latest trends in AI and machine learning?" },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <BeachBirdLoader />
          <p className="text-gray-600 font-semibold mt-4">Loading AI Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen flex overflow-hidden"
      style={{ background: gradientBg || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      {/* Existing Sidebar Component */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-white/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all lg:hidden"
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <Bot className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-semibold text-gray-900">AI Studio</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startNewConversation}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              aria-label="Start new conversation"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              aria-label="View chat history"
              aria-expanded={showHistory}
            >
              <History className="w-4 h-4" />
            </button>
            <ProfileDropdown />
          </div>
        </div>

        {/* Messages Container - Scrollable */}
        <div className="flex-1 overflow-y-auto" role="log" aria-live="polite" aria-label="Chat messages">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center max-w-2xl">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    {welcomeMessage}
                  </h2>
                  <p className="text-lg text-gray-600 mb-10">
                    Start a conversation with AI. Ask questions, generate images, or explore ideas.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(action.prompt)}
                        className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md rounded-xl border border-gray-200 transition-all text-left group"
                      >
                        <div className="text-indigo-600 group-hover:scale-110 transition-transform">{action.icon}</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm mb-1">
                            {action.label}
                          </p>
                          <p className="text-xs text-gray-500">{action.prompt}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className="w-full">
                {message.type === "bot" && (
                  <div className="flex gap-4 max-w-4xl group">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200/50">
                    {message.loading ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <BeachBirdLoader showMessage={true} />
                        {message.isImageLoading && (
                          <p className="text-xs text-indigo-600 mt-2 font-medium animate-pulse">
                            Creating your image...
                          </p>
                        )}
                      </div>
                    ) : message.isImage ? (
                      <div className="space-y-2">
                        <img
                          src={message.content}
                          alt="Generated"
                          className="max-w-xs rounded-lg"
                        />
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => downloadImage(message.content, message.id)}
                            className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => shareMessage(message.content)}
                            className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                            title="Share"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <TypingMessage content={message.content} isNew={message.isNew} speed={15} />
                        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => shareMessage(message.content)}
                            className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                            title="Share"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMessage(message.id)}
                            className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {message.type === "user" && (
                  <div className="flex gap-4 justify-end max-w-4xl ml-auto">
                    <div className="flex-1 min-w-0 flex flex-col items-end">
                      <div className="max-w-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl px-5 py-3 shadow-sm">
                        <p className="text-sm leading-relaxed break-words">{message.content}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {user?.first_name?.[0] || "U"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-white/20 bg-transparent">
          <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Context Modal */}
          {showContextModal && (
            <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-900">
                  @ Add context
                </label>
                <button
                  onClick={() => setShowContextModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Add additional context for better responses..."
                className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-500"
                rows="3"
              />
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex flex-col gap-3 bg-white rounded-2xl p-4 shadow-lg focus-within:ring-2 focus-within:ring-white/50 transition-all">
              {/* Top Section - Add Context Button */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setShowContextModal(!showContextModal)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 transition-all"
                >
                  <span className="text-base">@</span>
                  <span>Add context</span>
                </button>
              </div>

              {/* Middle Section - Main Input */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask, search, or make anything..."
                className="flex-1 bg-transparent border-none outline-none text-base text-gray-800 placeholder-gray-500 resize-none min-h-[80px]"
                disabled={aiLoading}
                rows="3"
                aria-label="Message input"
              />

              {/* Bottom Section - Action Buttons */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {/* Image Upload for Vision */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFiles([e.target.files[0]]);
                        toast.success('Image added! AI will analyze it with your next message.');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2 transition-all rounded-lg ${
                      imageFiles.length > 0
                        ? 'text-purple-600 bg-purple-50'
                        : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
                    title="Upload image for analysis"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  {/* Image Generation Toggle */}
                  <button
                    type="button"
                    onClick={() => setImageMode(!imageMode)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      imageMode
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    title={imageMode ? "Switch to text mode" : "Switch to image generation"}
                  >
                    <Image className="w-4 h-4" />
                    <span className="hidden sm:inline">{imageMode ? "Image Mode" : "Generate Image"}</span>
                  </button>
                  
                  {/* Show image preview badge */}
                  {imageFiles.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
                      <span className="text-xs text-purple-700 font-medium">
                        Image ready
                      </span>
                      <button
                        type="button"
                        onClick={() => setImageFiles([])}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Speech to Text */}
                  <SpeechToText
                    onSend={(transcribedText) => {
                      setInput(transcribedText);
                    }}
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={aiLoading || !input.trim()}
                    className="bg-gray-900 hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg p-2.5 transition-all active:scale-95 flex items-center justify-center min-w-[42px] min-h-[42px]"
                    aria-label={aiLoading ? "Sending message" : "Send message"}
                  >
                    {aiLoading ? (
                      <Loader className="w-5 h-5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </form>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Chirp AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>

      {/* Chat History Sidebar - Right Side */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={() => setShowHistory(false)}>
          <div className="w-80 bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Chats
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close history"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chatHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No conversation history yet
                </p>
              ) : (
                chatHistory.slice(-10).reverse().map((session, idx) => (
                  <div
                    key={session.id}
                    className="group p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all cursor-pointer"
                    onClick={() => loadHistorySession(session)}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session.messages?.[0]?.content?.substring(0, 40)}...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </p>
                    <button
                      onClick={(e) => deleteSingleHistory(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all mt-2"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {chatHistory.length > 0 && (
              <div className="border-t border-gray-200 p-4">
                <button
                  onClick={clearChatHistory}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All History
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIStudio;
