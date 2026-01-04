import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { useSelector } from "react-redux";
import BeachBirdLoader from "../components/BeachBirdLoader";
import useAI from "../hooks/useAI";
import SpeechToText from "../components/SpeechToText";

// Typing effect component - only animates for new messages
const TypingMessage = ({ content, isNew = false, speed = 15 }) => {
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
    <p className="text-gray-800 text-sm whitespace-pre-wrap">
      {displayedText}
      {isTyping && (
        <span className="animate-pulse">▌</span>
      )}
    </p>
  );
};

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
  const messagesEndRef = useRef(null);
  const sessionSavedRef = useRef(false); // Track if current session has been saved

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`ai-chat-${user?.id}`);
    if (saved) {
      try {
        const history = JSON.parse(saved);
        setChatHistory(history);
      } catch (e) {
        setChatHistory([]);
      }
    }
  }, [user?.id]);

  // Save chat to localStorage (only once per conversation session)
  const saveChatToHistory = (newMessages) => {
    // Only save once per session
    if (sessionSavedRef.current) {
      // Update existing session with new messages
      const updatedHistory = chatHistory.map((session, idx) => 
        idx === chatHistory.length - 1 
          ? {
              userId: user?.id,
              username: user?.username,
              timestamp: session.timestamp, // Keep original timestamp
              messages: newMessages,
            }
          : session
      );
      setChatHistory(updatedHistory);
      localStorage.setItem(
        `ai-chat-${user?.id}`,
        JSON.stringify(updatedHistory)
      );
    } else {
      // Create new session on first save
      const context = {
        userId: user?.id,
        username: user?.username,
        timestamp: new Date().toISOString(),
        messages: newMessages,
      };
      const newHistory = [...chatHistory, context];
      setChatHistory(newHistory);
      localStorage.setItem(
        `ai-chat-${user?.id}`,
        JSON.stringify(newHistory)
      );
      sessionSavedRef.current = true; // Mark session as saved
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

    // Use timestamp as unique ID to avoid duplicates
    const messageId = Date.now();
    
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
      id: messageId + 1,
      type: "bot",
      content: "thinking...",
      timestamp: new Date(),
      loading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const conversationHistory = getConversationHistory();
      
      // If image mode is enabled, generate image directly
      let result;
      if (imageMode) {
        result = await generateImage(input);
      } else {
        result = await chat(input, conversationHistory, true);
      }

      // Check if we got a valid response
      if (!result || (!result.text && !result.imageUrl)) {
        throw new Error("No response received from AI");
      }

      // Reset image mode after generation
      if (imageMode) {
        setImageMode(false);
      }

      // Remove loading message and add response
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.loading);
        return [
          ...filtered,
          {
            id: Date.now() + Math.random(),
            type: "bot",
            content: result.text || result.imageUrl || "Unable to generate a response.",
            timestamp: new Date(),
            isImage: !!result.imageUrl,
            isNew: true, // Mark as new for typing effect
          },
        ];
      });

      // Save to history
      saveChatToHistory([
        ...messages,
        userMessage,
        {
          type: "bot",
          content: result.text || result.imageUrl,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.loading);
        return [
          ...filtered,
          {
            id: Date.now() + Math.random(),
            type: "bot",
            content: "Unable to generate a response. Please try again.",
            timestamp: new Date(),
            isNew: true,
          },
        ];
      });
    }
  };

  const copyToClipboard = (text, messageId) => {
    navigator.clipboard.writeText(text);
    setCopied(messageId);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareMessage = async (text) => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: text,
          title: "Chirp AI",
        });
      } catch (err) {
        copyToClipboard(text, "share");
      }
    } else {
      copyToClipboard(text, "share");
    }
  };

  const downloadImage = (imageUrl, messageId) => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `chirp-image-${messageId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const deleteMessage = (messageId) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const clearChatHistory = () => {
    setMessages([]);
    setShowHistory(false);
  };

  const startNewConversation = () => {
    setMessages([]);
    setInput("");
    setSessionStarted(false);
    setShowHistory(false);
    sessionSavedRef.current = false; // Reset for new session
  };

  const deleteSingleHistory = (index) => {
    const newHistory = chatHistory.filter((_, i) => i !== index);
    setChatHistory(newHistory);
  };

  const loadHistorySession = (historySession) => {
    setMessages([...historySession.messages]);
    setShowHistory(false);
    setSessionStarted(true);
    sessionSavedRef.current = true; // Already saved, don't create new entry
  };

  const quickActions = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      label: "Post Ideas",
      prompt: "Give me 5 creative post ideas for tech entrepreneurs",
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: "Comments",
      prompt: "Write a thoughtful comment on a tech innovation post",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      label: "Hashtags",
      prompt: "Generate trending hashtags for digital marketing content",
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      label: "Web Search",
      prompt: "What are the latest trends in AI and machine learning?",
    },
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-full">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Studio</h1>
              <p className="text-sm text-gray-500">
                Smart AI assistant for Chirp
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={startNewConversation}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-indigo-600 px-3 py-1 rounded hover:bg-indigo-50 transition-all"
              title="Start new conversation"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
            {chatHistory.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100"
              >
                <History className="w-4 h-4" />
                {chatHistory.length} conversation{chatHistory.length !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="mt-12 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
              <Bot className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to AI Studio
              </h2>
              <p className="text-gray-600 mb-6">
                Ask me anything. I provide context-aware responses with text generation and image creation.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(action.prompt)}
                    className="flex items-center gap-3 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-lg border border-indigo-200 transition-all text-left"
                  >
                    <div className="text-indigo-600">{action.icon}</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-600">{action.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.type === "bot" && (
              <div className="flex gap-3 max-w-xs lg:max-w-md xl:max-w-lg group">
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-full">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none px-5 py-3 shadow-sm border border-gray-100 relative">
                  {message.loading ? (
                    <BeachBirdLoader className="w-16 h-16" />
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
              <div className="flex gap-3 max-w-xs lg:max-w-md xl:max-w-lg flex-row-reverse">
                <div className="flex-shrink-0">
                  <div className="bg-indigo-600 p-2 rounded-full">
                    <span className="text-white text-sm font-bold">
                      {user?.first_name?.[0] || "U"}
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl rounded-tr-none px-5 py-3 shadow-sm">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs text-indigo-100 mt-2">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Advanced Design */}
       <div className="w-full px-4 py-4 sticky bottom-0">
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

          <form onSubmit={handleSendMessage} className="flex flex-col gap-3 border border-gray-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow min-h-32">
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
              className="flex-1 bg-transparent border-none outline-none text-base text-gray-800 placeholder-gray-500 resize-none min-h-20 max-h-32"
              disabled={aiLoading}
              rows="3"
            />

            {/* Bottom Section - Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {/* Attachment Button */}
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  title="Add attachment"
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
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={aiLoading || !input.trim()}
                className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-full p-2.5 transition-all active:scale-95 flex items-center justify-center"
              >
                {aiLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>

              {/* Speech to Text */}
              <SpeechToText
                onSend={(transcribedText) => {
                  setInput(transcribedText);
                }}
              />
            </div>
          </form>

          <p className="text-xs text-gray-500 mt-2 text-center">
            Chirp AI — Your intelligent assistant for creative content
          </p>
          </div>

      {/* Chat History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex">
          <div className="w-80 bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5" />
                Chat History
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
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
                chatHistory.map((session, idx) => (
                  <div
                    key={idx}
                    className="group p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all cursor-pointer"
                  >
                    <div
                      onClick={() => loadHistorySession(session)}
                      className="flex-1"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session.username || "Anonymous"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600 truncate mt-1">
                        {session.messages?.[0]?.content?.substring(0, 50)}...
                      </p>
                    </div>
                    <button
                      onClick={() => deleteSingleHistory(idx)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all mt-2"
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
