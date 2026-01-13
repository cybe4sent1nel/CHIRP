import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Settings,
  Users,
  Loader,
  Image,
  Heart,
  MessageCircle,
  LogOut,
  FileText,
} from "lucide-react";
import { useSelector } from "react-redux";
import VoiceRecorder from "../components/VoiceRecorder";
import AudioPlayer from "../components/AudioPlayer";
import VideoPlayer from "../components/VideoPlayer";

const ChannelDetail = () => {
  const user = useSelector((state) => state.user?.value);
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChannelAndMessages();
  }, [channelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChannelAndMessages = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/channels/${channelId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch channel");
      }

      const data = await response.json();
      setChannel(data.channel);
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Error fetching channel:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !sending) return;

    setSending(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: messageText,
            user_id: user._id,
            message_type: "text",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
      setMessageText("");
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSendVoiceNote = async (audioBlob) => {
    setSending(true);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voicenote.webm");
      formData.append("user_id", user._id);
      formData.append("message_type", "voice");

      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/channels/${channelId}/messages`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send voice note");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      console.error("Error sending voice note:", err);
      alert("Failed to send voice note");
    } finally {
      setSending(false);
    }
  };

  const handleLeaveChannel = async () => {
    if (window.confirm("Are you sure you want to leave this channel?")) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASEURL}/api/channels/${channelId}/leave`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user._id }),
          }
        );

        if (!response.ok) throw new Error("Failed to leave channel");
        navigate("/chirp-channels");
      } catch (err) {
        alert("Failed to leave channel");
      }
    }
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
            <p className="text-red-700 font-semibold">{error || "Channel not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div
        className="bg-white border-b border-gray-200 shadow-sm"
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
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white hover:text-gray-200 mb-3 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-white">{channel.name}</h1>
            <p className="text-white/80">{channel.description || "No description"}</p>
          </div>

          <div className="flex items-center gap-2">
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
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.user_id._id === user._id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-xs ${
                      msg.user_id._id === user._id ? "flex-row-reverse" : ""
                    }`}
                  >
                    <img
                      src={msg.user_id.profile_picture || ""}
                      alt={msg.user_id.full_name}
                      className="w-8 h-8 rounded-full"
                      onError={(e) =>
                        (e.target.src =
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32")
                      }
                    />
                    <div>
                      <div className="text-xs text-gray-600 mb-1">
                        {msg.user_id.full_name}
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          msg.user_id._id === user._id
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {/* Voice/Audio */}
                        {msg.message_type === "voice" && (
                          <div className="mb-2">
                            <AudioPlayer 
                              src={msg.content}
                              fileName={msg.file_name || "voice-note.webm"}
                              isOwnMessage={msg.user_id._id === user._id}
                              message={msg}
                            />
                          </div>
                        )}

                        {/* Video */}
                        {msg.message_type === "video" && (
                          <div className="mb-2">
                            <VideoPlayer 
                              src={msg.content}
                              fileName={msg.file_name || "video.mp4"}
                            />
                          </div>
                        )}

                        {/* Image */}
                        {msg.message_type === "image" && (
                          <img
                            src={msg.content}
                            alt="Channel message"
                            className="w-full max-w-sm rounded-lg mb-2"
                          />
                        )}

                        {/* Audio */}
                        {msg.message_type === "audio" && (
                          <div className="mb-2">
                            <AudioPlayer 
                              src={msg.content}
                              fileName={msg.file_name || "audio.mp3"}
                              isOwnMessage={msg.user_id._id === user._id}
                              message={msg}
                            />
                          </div>
                        )}

                        {/* Document */}
                        {msg.message_type === "document" && (
                          <a
                            href={msg.content}
                            download={msg.file_name}
                            className={`flex items-center gap-2 mb-2 p-2 rounded ${
                              msg.user_id._id === user._id
                                ? "bg-indigo-500 text-white"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            }`}
                          >
                            <FileText size={20} />
                            <div className="flex flex-col">
                              <span className="font-semibold truncate">{msg.file_name || "document"}</span>
                            </div>
                          </a>
                        )}

                        {/* Text */}
                        {msg.message_type === "text" && (
                          <p className="text-sm">{msg.content}</p>
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
          <div className="border-t border-gray-200 p-4">
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
        </div>

        {/* Sidebar - Members */}
        {showMembers && (
          <div className="w-64 bg-white rounded-xl shadow-lg p-6 overflow-y-auto">
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
                  {channel.isCreator && member._id !== user._id && (
                    <select
                      defaultValue={member.role || "member"}
                      onChange={(e) => {
                        // Handle role change
                      }}
                      className="text-xs px-2 py-1 rounded border border-gray-300"
                    >
                      <option value="member">Member</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelDetail;
