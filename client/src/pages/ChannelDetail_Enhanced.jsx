import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../utils/api";
import {
  ArrowLeft,
  Send,
  Settings,
  Users,
  LogOut,
  Loader,
  Pin,
  Smile,
  Image as ImageIcon,
  Video as VideoIcon,
  BarChart3,
  Reply,
  Forward,
  Trash2,
  MoreVertical,
  X,
  CheckCircle,
} from "lucide-react";
import VoiceRecorder from "../components/VoiceRecorder";
import AudioPlayer from "../components/AudioPlayer";
import VideoPlayer from "../components/VideoPlayer";
import EmojiGifPicker from "../components/EmojiGifPicker";
import MediaEditor from "../components/MediaEditor";

const ChannelDetail = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const messagesEndRef = useRef(null);

  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaEditor, setShowMediaEditor] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [replyTo, setReplyTo] = useState(null);
  const [showMessageActions, setShowMessageActions] = useState(null);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPollCreator, setShowPollCreator] = useState(false);

  // Reaction emojis like Instagram
  const REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🔥"];

  useEffect(() => {
    fetchUserData();
    fetchChannel();
  }, [channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchUserData = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const fetchChannel = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/channels/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setChannel(data.channel);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load channel");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/channels/${channelId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const fetchPinnedMessages = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/channels/${channelId}/pinned`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setPinnedMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to fetch pinned messages:", err);
    }
  };

  useEffect(() => {
    if (channel) {
      fetchMessages();
      fetchPinnedMessages();
      // Refresh messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [channel]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      const token = await getToken();
      const payload = {
        content: messageText,
        message_type: "text",
      };

      if (replyTo) {
        payload.reply_to = replyTo._id;
      }

      const { data } = await api.post(
        `/api/channels/${channelId}/messages`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setMessages([...messages, data.message]);
        setMessageText("");
        setReplyTo(null);
      }
    } catch (err) {
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSendVoiceNote = async (audioBlob) => {
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", audioBlob, "voicenote.webm");
      formData.append("message_type", "voice");
      formData.append("file_name", "voicenote.webm");

      const { data } = await api.post(
        `/api/channels/${channelId}/messages`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setMessages([...messages, data.message]);
      }
    } catch (err) {
      alert("Failed to send voice note");
    }
  };

  const handleMediaSelect = (type) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "image" ? "image/*" : "video/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setMediaFile(file);
        setMediaType(type);
        setShowMediaEditor(true);
      }
    };
    input.click();
  };

  const handleMediaSave = async (editedFile) => {
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", editedFile, editedFile.name);
      formData.append("message_type", mediaType);
      formData.append("file_name", editedFile.name);

      const { data } = await api.post(
        `/api/channels/${channelId}/messages`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setMessages([...messages, data.message]);
        setShowMediaEditor(false);
        setMediaFile(null);
      }
    } catch (err) {
      alert("Failed to send media");
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        `/api/channels/${channelId}/messages/${messageId}/react`,
        { emoji },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        // Update message in local state
        setMessages(
          messages.map((msg) =>
            msg._id === messageId ? data.message : msg
          )
        );
      }
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  const handlePinMessage = async (messageId) => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        `/api/channels/${channelId}/messages/${messageId}/pin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        fetchMessages();
        fetchPinnedMessages();
      }
    } catch (err) {
      alert("Failed to pin message");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Delete this message?")) return;

    try {
      const token = await getToken();
      const { data } = await api.delete(
        `/api/channels/${channelId}/messages/${messageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setMessages(messages.filter((msg) => msg._id !== messageId));
      }
    } catch (err) {
      alert("Failed to delete message");
    }
  };

  const handleLeaveChannel = async () => {
    if (confirm("Are you sure you want to leave this channel?")) {
      try {
        const token = await getToken();
        const response = await fetch(`/api/channels/${channelId}/leave`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to leave channel");
        navigate("/chirp-channels");
      } catch (err) {
        alert("Failed to leave channel");
      }
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessageText((prev) => prev + emoji);
  };

  const handleGifSelect = async (gifUrl) => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        `/api/channels/${channelId}/messages`,
        {
          content: gifUrl,
          message_type: "gif",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setMessages([...messages, data.message]);
        setShowEmojiPicker(false);
      }
    } catch (err) {
      alert("Failed to send GIF");
    }
  };

  const hasReacted = (message, emoji) => {
    if (!message.reactions) return false;
    const reactions = message.reactions[emoji] || [];
    return reactions.some((id) => id === user?._id);
  };

  const getReactionCount = (message, emoji) => {
    if (!message.reactions) return 0;
    const reactions = message.reactions[emoji] || [];
    return reactions.length;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading channel...</p>
        </div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-semibold">
              {error || "Channel not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin =
    channel.isCreator || channel.userRole === "admin" || channel.userRole === "moderator";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div
        className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden"
        style={{
          backgroundImage: channel.background_url
            ? `url(${channel.background_url})`
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex-1">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white hover:text-gray-200 mb-3 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-white">{channel.name}</h1>
            <p className="text-white/80">
              {channel.description || "No description"}
            </p>
            <div className="flex items-center gap-4 mt-2 text-white/70 text-sm">
              <span>{channel.members?.length || 0} members</span>
              {channel.admin_only_posting && (
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                  Admin Only
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pinnedMessages.length > 0 && (
              <button
                onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all relative"
                title="Pinned messages"
              >
                <Pin className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pinnedMessages.length}
                </span>
              </button>
            )}
            {channel.isCreator && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
                title="Channel settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
              title="View members"
            >
              <Users className="w-5 h-5" />
            </button>
            {!channel.isCreator && (
              <button
                onClick={handleLeaveChannel}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                title="Leave channel"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pinned Messages Banner */}
      {showPinnedMessages && pinnedMessages.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <Pin className="w-4 h-4" />
                  Pinned Messages
                </h3>
                <div className="space-y-2">
                  {pinnedMessages.map((msg) => (
                    <div
                      key={msg._id}
                      className="bg-white p-3 rounded-lg text-sm"
                    >
                      <p className="font-medium text-gray-900">
                        {msg.user_id.full_name}
                      </p>
                      <p className="text-gray-700">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowPinnedMessages(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Banner */}
      {replyTo && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600 font-semibold">
                  Replying to {replyTo.user_id.full_name}
                </p>
                <p className="text-sm text-gray-700 truncate">
                  {replyTo.content || "Media message"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full flex gap-4 py-6 px-4">
        {/* Messages Section */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>No messages yet. Be the first to say something!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className="group relative"
                >
                  {/* Reply indicator */}
                  {msg.reply_to && (
                    <div className="ml-12 mb-1 text-xs text-gray-500 flex items-center gap-1">
                      <Reply className="w-3 h-3" />
                      Replying to a message
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <img
                      src={msg.user_id.profile_picture || ""}
                      alt={msg.user_id.full_name}
                      className="w-10 h-10 rounded-full"
                      onError={(e) =>
                        (e.target.src =
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40")
                      }
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {msg.user_id.full_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                        {msg.is_pinned && (
                          <Pin className="w-3 h-3 text-yellow-600" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="bg-gray-100 rounded-lg p-3 max-w-lg">
                        {/* Voice/Audio */}
                        {msg.message_type === "voice" && (
                          <AudioPlayer
                            src={msg.content}
                            fileName={msg.file_name || "voice-note.webm"}
                          />
                        )}

                        {/* Video */}
                        {msg.message_type === "video" && (
                          <VideoPlayer
                            src={msg.content}
                            fileName={msg.file_name || "video.mp4"}
                          />
                        )}

                        {/* Image */}
                        {msg.message_type === "image" && (
                          <img
                            src={msg.content}
                            alt="Channel message"
                            className="w-full max-w-sm rounded-lg"
                          />
                        )}

                        {/* GIF */}
                        {msg.message_type === "gif" && (
                          <img
                            src={msg.content}
                            alt="GIF"
                            className="w-full max-w-sm rounded-lg"
                          />
                        )}

                        {/* Poll */}
                        {msg.message_type === "poll" && (
                          <PollMessage
                            message={msg}
                            onVote={(optionIndex) =>
                              handlePollVote(msg._id, optionIndex)
                            }
                            userId={user._id}
                          />
                        )}

                        {/* Text */}
                        {msg.message_type === "text" && (
                          <p className="text-sm text-gray-900">{msg.content}</p>
                        )}
                      </div>

                      {/* Reactions */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(msg.reactions).map(
                            ([emoji, users]) =>
                              users.length > 0 && (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(msg._id, emoji)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                                    hasReacted(msg, emoji)
                                      ? "bg-indigo-100 border-indigo-500 border-2"
                                      : "bg-gray-100 hover:bg-gray-200"
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span className="text-xs text-gray-600">
                                    {users.length}
                                  </span>
                                </button>
                              )
                          )}
                        </div>
                      )}
                    </div>

                    {/* Message Actions (show on hover) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1">
                      {/* Quick reactions */}
                      <div className="flex bg-white shadow-lg rounded-lg p-1">
                        {REACTIONS.slice(0, 3).map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg._id, emoji)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title={`React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {/* More actions */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowMessageActions(
                              showMessageActions === msg._id ? null : msg._id
                            )
                          }
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>

                        {showMessageActions === msg._id && (
                          <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-gray-200 py-1 z-10 min-w-[160px]">
                            <button
                              onClick={() => {
                                setReplyTo(msg);
                                setShowMessageActions(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                            >
                              <Reply className="w-4 h-4" />
                              Reply
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => {
                                  handlePinMessage(msg._id);
                                  setShowMessageActions(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                              >
                                <Pin className="w-4 h-4" />
                                {msg.is_pinned ? "Unpin" : "Pin"}
                              </button>
                            )}

                            {(isAdmin || msg.user_id._id === user._id) && (
                              <button
                                onClick={() => {
                                  handleDeleteMessage(msg._id);
                                  setShowMessageActions(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-sm text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {(!channel.admin_only_posting || isAdmin) && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                  title="Emoji & GIF"
                >
                  <Smile className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => handleMediaSelect("image")}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                  title="Send Image"
                >
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => handleMediaSelect("video")}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                  title="Send Video"
                >
                  <VideoIcon className="w-5 h-5 text-gray-600" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setShowPollCreator(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                    title="Create Poll"
                  >
                    <BarChart3 className="w-5 h-5 text-gray-600" />
                  </button>
                )}
              </div>

              {showEmojiPicker && (
                <div className="mb-2">
                  <EmojiGifPicker
                    onEmojiSelect={handleEmojiSelect}
                    onGifSelect={handleGifSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <VoiceRecorder
                  onSendVoiceNote={handleSendVoiceNote}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}

          {channel.admin_only_posting && !isAdmin && (
            <div className="border-t border-gray-200 p-4 text-center text-gray-500 text-sm">
              Only admins can post in this channel
            </div>
          )}
        </div>

        {/* Sidebar - Members */}
        {showMembers && (
          <div className="w-64 bg-white rounded-xl shadow-lg p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Members ({channel.members?.length || 0})
            </h3>
            <div className="space-y-3">
              {channel.members?.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <img
                    src={member.profile_picture || ""}
                    alt={member.full_name}
                    className="w-8 h-8 rounded-full"
                    onError={(e) =>
                      (e.target.src =
                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32")
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.full_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.role || "member"}
                    </p>
                  </div>
                  {channel.isCreator && member._id !== user._id && isAdmin && (
                    <button
                      onClick={() => handleRemoveMember(member._id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove member"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Media Editor Modal */}
      {showMediaEditor && mediaFile && (
        <MediaEditor
          file={mediaFile}
          type={mediaType}
          onSave={handleMediaSave}
          onClose={() => {
            setShowMediaEditor(false);
            setMediaFile(null);
          }}
        />
      )}

      {/* Poll Creator Modal */}
      {showPollCreator && (
        <PollCreator
          channelId={channelId}
          onClose={() => setShowPollCreator(false)}
          onCreated={(poll) => {
            setMessages([...messages, poll]);
            setShowPollCreator(false);
          }}
        />
      )}
    </div>
  );
};

// Poll Message Component
const PollMessage = ({ message, onVote, userId }) => {
  const totalVotes = message.poll_data.options.reduce(
    (sum, opt) => sum + opt.votes.length,
    0
  );

  const hasVoted = (optionIndex) => {
    return message.poll_data.options[optionIndex].votes.some(
      (id) => id === userId
    );
  };

  const isExpired =
    message.poll_data.expires_at &&
    new Date() > new Date(message.poll_data.expires_at);

  return (
    <div className="w-full">
      <p className="font-semibold text-gray-900 mb-3">
        {message.poll_data.question}
      </p>
      <div className="space-y-2">
        {message.poll_data.options.map((option, index) => {
          const votes = option.votes.length;
          const percentage =
            totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const voted = hasVoted(index);

          return (
            <button
              key={index}
              onClick={() => !isExpired && onVote(index)}
              disabled={isExpired}
              className={`w-full relative overflow-hidden rounded-lg border-2 p-3 text-left transition-all ${
                voted
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300 hover:border-gray-400 bg-white"
              } ${isExpired ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {/* Progress bar */}
              <div
                className={`absolute inset-0 ${
                  voted ? "bg-indigo-100" : "bg-gray-100"
                } transition-all`}
                style={{ width: `${percentage}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between">
                <span className="font-medium text-gray-900 flex items-center gap-2">
                  {option.text}
                  {voted && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                </span>
                <span className="text-sm text-gray-600">
                  {percentage}% ({votes})
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        {message.poll_data.multiple_choice && " • Multiple choice"}
        {isExpired && " • Expired"}
      </p>
    </div>
  );
};

// Poll Creator Modal Component
const PollCreator = ({ channelId, onClose, onCreated }) => {
  const { getToken } = useAuth();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [expiresHours, setExpiresHours] = useState(24);

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      alert("Please provide at least 2 options");
      return;
    }

    try {
      const token = await getToken();
      const { data } = await api.post(
        `/api/channels/${channelId}/polls`,
        {
          question,
          options: validOptions,
          multiple_choice: multipleChoice,
          expires_hours: expiresHours,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        onCreated(data.message);
      }
    } catch (err) {
      alert("Failed to create poll");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Poll</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  + Add option
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="multipleChoice"
                checked={multipleChoice}
                onChange={(e) => setMultipleChoice(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label
                htmlFor="multipleChoice"
                className="text-sm text-gray-700"
              >
                Allow multiple choices
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expires in
              </label>
              <select
                value={expiresHours}
                onChange={(e) => setExpiresHours(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={72}>3 days</option>
                <option value={168}>7 days</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
              >
                Create Poll
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChannelDetail;
