import React, { useEffect, useRef, useState } from "react";
import { ImageIcon, SendHorizonal, Phone, Video, FileText, X, ArrowLeft, MoreVertical, Eye, Ghost, Zap } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useCustomAuth } from "../context/AuthContext";
import { addMessage, fetchMessages, resetMessages, updateMessageStatus, confirmMessage } from "../features/messages/messagesSlice";
import { setUploadLoading } from '../features/ui/uiSlice';
import api from "../api/axios";
import toast from 'react-hot-toast'
import CallWindow from "../components/CallWindow";
import VoiceRecorder from "../components/VoiceRecorder";
import AudioPlayer from "../components/AudioPlayer";
import VideoPlayer from "../components/VideoPlayer";
import MessageStatus from "../components/MessageStatus";
import MessageInfo from "../components/MessageInfo";
import MessageActions from "../components/MessageActions";
import UserStatus from "../components/UserStatus";
import UserActionsPopover from "../components/UserActionsPopover";
import SpeechToText from "../components/SpeechToText";
import EmojiGifPicker from "../components/EmojiGifPicker";
import MediaEditor from "../components/MediaEditor";
import CloudUploadLoader from "../components/CloudUploadLoader";
import ViewOnceMedia from "../components/ViewOnceMedia";

const Chat = () => {
    const { messages } = useSelector((state) => state.messages);
    const { userId } = useParams();
    const { getToken } = useAuth();
    const { token: customToken } = useCustomAuth();
    const dispatch = useDispatch();
    const [text, setText] = useState("");
    const [image, setImage] = useState(null);
    const [user, setUser] = useState(null);
    const [isInCall, setIsInCall] = useState(false);
    const [callType, setCallType] = useState('voice');
    const [callDuration, setCallDuration] = useState(0);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showMessageInfo, setShowMessageInfo] = useState(false);
    const [replyToMessage, setReplyToMessage] = useState(null);
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editText, setEditText] = useState('');
    const [userStatus, setUserStatus] = useState({ isOnline: false, lastSeen: null });
    const [showUserActions, setShowUserActions] = useState(false);
    const { userId: clerkUserId } = useAuth();
    const { user: customAuthUser } = useCustomAuth();
    const currentUserId = clerkUserId || customAuthUser?._id; // Support both Clerk and custom auth
    const navigate = useNavigate();
    const [editingMedia, setEditingMedia] = useState(null);
    const [mediaType, setMediaType] = useState('image');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [sendAsViewOnce, setSendAsViewOnce] = useState(false);
    const [allowSave, setAllowSave] = useState(true);
    const [hasDisappearingMessages, setHasDisappearingMessages] = useState(false);
    const [disappearingMessageDuration, setDisappearingMessageDuration] = useState(24); // hours
    const [recipientDisappearingMessages, setRecipientDisappearingMessages] = useState(false);

    const messagesEndRef = useRef(null);

    const startCall = (type) => {
        // Check for browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error('Your browser does not support audio/video calls. Please use a modern browser like Chrome, Firefox, or Edge.');
            return;
        }

        setCallType(type);
        setIsInCall(true);
        toast.success(`Starting ${type} call with ${user?.full_name}...`, {
            icon: type === 'video' ? '📹' : '📞',
            duration: 2000
        });
    };

    const endCall = (duration = 0) => {
        setIsInCall(false);
        setCallDuration(duration);
        const durationText = duration > 0
            ? `${Math.floor(duration / 60)}m ${duration % 60}s`
            : 'a few seconds';
        toast.success(`Call ended - Duration: ${durationText}`, {
            icon: '📵',
            duration: 3000
        });
    };

    const connections = useSelector((state) => state.connections.connections)
    const { onlineUsers } = useSelector((state) => state.connections)

    const fetchUserMessages = async () => {
        try {
            let token = null;

            // Priority 1: Try Clerk token first
            try {
                token = await getToken();
            } catch (e) {
                console.debug('Clerk token unavailable:', e.message);
            }

            // Priority 2: Fall back to custom auth token
            if (!token && customToken) {
                token = customToken;
                console.debug('Using custom auth token');
            }

            if (!token) {
                console.error('No token available for fetching messages');
                toast.error('Not authenticated');
                return;
            }

            const result = await dispatch(fetchMessages({ token, userId }))
            if (result.rejected) {
                console.error('Failed to fetch messages:', result.payload);
                toast.error(result.payload || 'Failed to fetch messages')
            }
        } catch (error) {
            console.error('fetchUserMessages error:', error);
            toast.error(error.message)
        }
    }

    const sendMessage = async (fileToSend = null) => {
        try {
            // Only show upload UI when there is a file to send
            const fileData = fileToSend || image;
            if (fileData) {
                setUploading(true);
                setUploadProgress(0);
            }

            let token = null;

            // Priority 1: Try Clerk token first
            try {
                token = await getToken();
            } catch (e) {
                console.debug('Clerk token unavailable:', e.message);
            }

            // Priority 2: Fall back to custom auth token
            if (!token && customToken) {
                token = customToken;
            }

            if (!token) {
                throw new Error('No authentication token available');
            }

            const formData = new FormData();
            formData.append('to_user_id', userId)
            formData.append('text', text)

            // Use provided file or image
            if (fileData) {
                formData.append('file', fileData);
                formData.append('view_once', sendAsViewOnce);
                formData.append('allow_save', allowSave);
            }

            // Optimistic message id for local UI
            const clientId = `local_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
            const optimisticMessage = {
                _id: clientId,
                from_user_id: currentUserId,
                to_user_id: userId,
                text: text,
                createdAt: new Date().toISOString(),
                sending: true,
                message_type: fileData ? 'media' : 'text'
            };

            // Mark optimistic message as outgoing to ensure UI treats it as user's own
            optimisticMessage.outgoing = true;

            // Dispatch optimistic message to show immediately
            console.debug('[Chat] dispatch optimistic message', clientId, { fileData });
            dispatch(addMessage(optimisticMessage));

            // If we're sending a file, notify global UI to show upload loader
            if (fileData) {
                console.debug('[Chat] enabling global upload loader');
                dispatch(setUploadLoading(true));
            }

            const { data } = await api.post('/api/message/send', formData, {
                headers: { Authorization: `Bearer ${token}` },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                },
            })
            if (data.success) {
                // Replace optimistic message with server-provided message
                dispatch(confirmMessage({ clientId, serverMessage: data.message }));
                setText('')
                setImage(null)
                setSendAsViewOnce(false);
                setAllowSave(true);
            } else {
                throw new Error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            // Only clear upload UI if it was active
            if (uploading) {
                setUploading(false);
                setUploadProgress(0);
            }
            // Always clear the global upload loader to avoid stale UI state.
            // If another upload is legitimately in progress elsewhere this will be harmless
            // because that other flow should re-enable it.
            try {
                console.debug('[Chat] clearing global upload loader');
                dispatch(setUploadLoading(false));
            } catch (e) {
                console.debug('Failed to clear global upload loader', e?.message || e);
            }

            // As a safety net, ensure loader hides after 5s in case of stuck state
            try {
                setTimeout(() => {
                    try { console.debug('[Chat] fallback clear global upload loader (timeout)'); dispatch(setUploadLoading(false)); } catch (e) { /* ignore */ }
                }, 5000);
            } catch (e) { /* ignore */ }
        }
    };

    const handleEmojiSelect = (emoji) => {
        setText(prev => prev + emoji);
    };

    const handleGifSelect = async (gifUrl) => {
        try {
            let token = null;

            // Priority 1: Try Clerk token first
            try {
                token = await getToken();
            } catch (e) {
                console.debug('Clerk token unavailable:', e.message);
            }

            // Priority 2: Fall back to custom auth token
            if (!token && customToken) {
                token = customToken;
            }

            if (!token) {
                throw new Error('No authentication token available');
            }

            // Detect if it's a sticker or gif based on URL
            const messageType = gifUrl.includes('sticker') || gifUrl.includes('transparent') ? 'sticker' : 'gif';

            const { data } = await api.post('/api/message/send', {
                to_user_id: userId,
                text: gifUrl,
                message_type: messageType,
                message_url: gifUrl
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                dispatch(addMessage(data.message));
                toast.success(messageType === 'sticker' ? 'Sticker sent!' : 'GIF sent!');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const sendVoiceNote = async (audioBlob) => {
        try {
            let token = null;

            // Priority 1: Try Clerk token first
            try {
                token = await getToken();
            } catch (e) {
                console.debug('Clerk token unavailable:', e.message);
            }

            // Priority 2: Fall back to custom auth token
            if (!token && customToken) {
                token = customToken;
            }

            if (!token) {
                throw new Error('No authentication token available');
            }

            const formData = new FormData();
            formData.append('to_user_id', userId);
            formData.append('audio', audioBlob, 'voicenote.webm');
            formData.append('message_type', 'voice');

            const { data } = await api.post('/api/message/send', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                dispatch(addMessage(data.message));
                toast.success('Voice note sent');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error('Failed to send voice note');
        }
    };

    const handleMediaSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const type = file.type.startsWith('video/') ? 'video' : 'image';
            setMediaType(type);
            setEditingMedia(file);
        }
    };

    const handleMediaSave = (editedFile) => {
        sendMessage(editedFile);
        setEditingMedia(null);
    };

    const handleEditMessage = async () => {
        if (!editText.trim() || !editingMessage) return;

        try {
            let token = null;

            // Priority 1: Try Clerk token first
            try {
                token = await getToken();
            } catch (e) {
                console.debug('Clerk token unavailable:', e.message);
            }

            // Priority 2: Fall back to custom auth token
            if (!token && customToken) {
                token = customToken;
            }

            if (!token) {
                throw new Error('No authentication token available');
            }

            const { data } = await api.put(`/api/message/${editingMessage._id}`, {
                text: editText
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                // Update message in Redux
                dispatch(fetchMessages({ token, userId }));
                toast.success('Message edited');
                setEditingMessage(null);
                setEditText('');
            }
        } catch (error) {
            toast.error('Failed to edit message');
        }
    };

    const startEditingMessage = (message) => {
        setEditingMessage(message);
        setEditText(message.text);
    };

    useEffect(() => {
        const markAsRead = async () => {
            try {
                let token = null;

                // Priority 1: Try Clerk token first
                try {
                    token = await getToken();
                } catch (e) {
                    console.debug('Clerk token unavailable:', e.message);
                }

                // Priority 2: Fall back to custom auth token
                if (!token && customToken) {
                    token = customToken;
                    console.debug('Using custom auth token for markAsRead');
                }

                if (!token) {
                    console.error('No authentication token available');
                    return;
                }

                await api.post('/api/message/mark-read',
                    { from_user_id: userId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                // Notify other components that messages have been read
                window.dispatchEvent(new CustomEvent('messagesRead'));
            } catch (error) {
                console.error('Failed to mark messages as read:', error);
            }
        };

        fetchUserMessages();
        // Mark messages as read when opening chat
        markAsRead();

        return () => {
            dispatch(resetMessages())
        }
    }, [userId])

    useEffect(() => {
        if (connections.length > 0) {
            const user = connections.find((connection) => connection._id === userId)
            setUser(user)
        }
    }, [connections, userId])

    // Fetch recipient's disappearing messages setting
    useEffect(() => {
        const fetchRecipientSettings = async () => {
            try {
                let token = await getToken();
                if (!token && customToken) {
                    token = customToken;
                }
                
                if (token) {
                    const { data } = await api.get(`/api/chat-settings/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (data.success && data.settings?.security?.disappearing_messages_default?.enabled) {
                        setRecipientDisappearingMessages(true);
                    }
                }
            } catch (error) {
                // Chat settings endpoint may not be available, ignore error
                // The chat will still work without recipient settings
                console.debug('Chat settings not available:', error.message);
            }
        };
        
        if (userId) {
            fetchRecipientSettings();
        }
    }, [userId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behaviour: "smooth" });
    }, [messages]);

    // Listen for user status changes from SSE
    useEffect(() => {
        const handleUserStatusChange = (event) => {
            const { userId: statusUserId, isOnline, timestamp } = event.detail;

            if (statusUserId === userId) {
                setUserStatus({
                    isOnline,
                    lastSeen: isOnline ? null : timestamp || new Date().toISOString()
                });
            }
        };

        window.addEventListener('userStatusChange', handleUserStatusChange);

        // Check if user is online from Redux on mount
        if (onlineUsers && Array.isArray(onlineUsers)) {
            const isOnline = onlineUsers.includes(userId);
            setUserStatus({ isOnline, lastSeen: isOnline ? null : user?.lastSeen });
        }

        return () => window.removeEventListener('userStatusChange', handleUserStatusChange);
    }, [userId, onlineUsers, user]);

    // Listen for message status changes (delivered/read) from SSE
    useEffect(() => {
        const handleMessageStatusChange = (event) => {
            const { messageId, status } = event.detail;
            console.log('Chat: Message status changed:', messageId, status);

            // Update the message status in Redux
            dispatch(updateMessageStatus({ messageId, status }));
        };

        window.addEventListener('messageStatusChange', handleMessageStatusChange);

        return () => window.removeEventListener('messageStatusChange', handleMessageStatusChange);
    }, [dispatch]);

    return (
        user && (
            <div className="flex flex-col h-screen">
                <div className="flex items-center justify-between p-3 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300">
                    <div className="flex items-center gap-3 flex-1">
                        <img
                            src={user.profile_picture}
                            className="size-10 rounded-full border-2 border-indigo-200"
                            alt=""
                        />
                        <div>
                            <p className="font-semibold text-slate-800">{user.full_name}</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-500">@{user.username}</p>
                                <UserStatus isOnline={userStatus.isOnline} lastSeen={userStatus.lastSeen} />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 relative">
                        <button
                            onClick={() => startCall('voice')}
                            disabled={isInCall}
                            className={`p-2.5 rounded-full bg-white border border-gray-200 transition-all shadow-sm ${isInCall
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-green-50 hover:border-green-300 text-gray-600 hover:text-green-600'
                                }`}
                            title={isInCall ? 'Already in a call' : 'Voice Call'}
                        >
                            <Phone size={18} />
                        </button>
                        <button
                            onClick={() => startCall('video')}
                            disabled={isInCall}
                            className={`p-2.5 rounded-full bg-white border border-gray-200 transition-all shadow-sm ${isInCall
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-blue-50 hover:border-blue-300 text-gray-600 hover:text-blue-600'
                                }`}
                            title={isInCall ? 'Already in a call' : 'Video Call'}
                        >
                            <Video size={18} />
                        </button>
                        <button
                            onClick={() => setShowUserActions(!showUserActions)}
                            className="p-2.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 transition-all shadow-sm"
                            title="User options"
                        >
                            <MoreVertical size={18} />
                        </button>
                        {showUserActions && (
                            <UserActionsPopover
                                user={user}
                                onClose={() => setShowUserActions(false)}
                                onBlockSuccess={() => navigate('/messages')}
                                onReportSuccess={() => toast.success('Report submitted')}
                            />
                        )}
                    </div>
                </div>
                <div className="p-5 md:px-10 h-full overflow-y-scroll">
                    <div className="max-w-4xl mx-auto">
                        {replyToMessage && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-blue-600 font-semibold">Replying to</p>
                                    <p className="text-sm text-gray-700 truncate">{replyToMessage.text || 'Media message'}</p>
                                </div>
                                <button onClick={() => setReplyToMessage(null)}>
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>
                        )}
                        {messages
                            .toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                            .map((message, index, arr) => {
                                    // Normalize IDs to reliably compare shapes (string vs object)
                                    const normalizeId = (val) => {
                                        if (!val) return null;
                                        if (typeof val === 'string') return val;
                                        if (typeof val === 'object') return val._id || val.id || null;
                                        return null;
                                    }

                                    // Try to resolve current user id from multiple places (Clerk, custom auth, localStorage fallback)
                                    let normCurrent = normalizeId(currentUserId);
                                    if (!normCurrent) {
                                        try {
                                            const raw = localStorage.getItem('customUser');
                                            if (raw) {
                                                try {
                                                    const parsed = JSON.parse(raw);
                                                    normCurrent = normalizeId(parsed?._id || parsed?.id || parsed?.userId || parsed?.uid) || normCurrent;
                                                } catch (e) {
                                                    // fallback: try to extract _id string
                                                    const m = raw.match(/"_id"\s*:\s*"([^"]+)"/);
                                                    if (m) normCurrent = m[1];
                                                }
                                            }
                                        } catch (e) {
                                            // ignore
                                        }
                                        // last resort: check a few known localStorage keys
                                        if (!normCurrent) {
                                            normCurrent = localStorage.getItem('customUserId') || localStorage.getItem('clerk_user_id') || localStorage.getItem('clerk.userId') || null;
                                        }
                                    }
                                    const normFrom = normalizeId(message.from_user_id) || normalizeId(message.sender_id) || normalizeId(message.from);

                                    // Determine if message is from current user
                                    const isOwnMessage = message.outgoing === true || (normFrom && normCurrent && normFrom === normCurrent);

                                    console.debug('[Chat] message ownership', { _id: message._id, outgoing: message.outgoing, normFrom, normCurrent, isOwnMessage });

                                // Check if we need to show date separator
                                const currentDate = new Date(message.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                });
                                const prevDate = index > 0 ? new Date(arr[index - 1].createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                }) : null;
                                const showDateSeparator = index === 0 || currentDate !== prevDate;

                                // Format date for separator
                                const formatDateSeparator = (dateStr) => {
                                    const date = new Date(message.createdAt);
                                    const today = new Date();
                                    const yesterday = new Date(today);
                                    yesterday.setDate(yesterday.getDate() - 1);

                                    if (date.toLocaleDateString() === today.toLocaleDateString()) {
                                        return 'Today';
                                    } else if (date.toLocaleDateString() === yesterday.toLocaleDateString()) {
                                        return 'Yesterday';
                                    } else {
                                        return date.toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit'
                                        });
                                    }
                                };

                                return (
                                    <React.Fragment key={message._id || message.id || index}>
                                        {showDateSeparator && (
                                            <div className="flex justify-center my-4">
                                                <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                                                    {formatDateSeparator(currentDate)}
                                                </span>
                                            </div>
                                        )}
                                        <div
                                            
                                            className={`flex items-end gap-3 w-full ${isOwnMessage ? "justify-end" : "justify-start"
                                                } group mb-4 px-6`}
                                        >
                                            {/* Message Actions - Show on hover beside message */}
                                            {!isOwnMessage && (
                                                <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center`}>
                                                    <MessageActions
                                                        message={message}
                                                        isOwnMessage={isOwnMessage}
                                                        onReply={() => setReplyToMessage(message)}
                                                        onEdit={startEditingMessage}
                                                        onInfo={() => {
                                                            setSelectedMessage(message);
                                                            setShowMessageInfo(true);
                                                        }}
                                                        onDelete={(type) => {
                                                            toast.success(`Message deleted ${type === 'everyone' ? 'for everyone' : 'for you'}`);
                                                        }}
                                                        onReact={(emoji) => {
                                                            toast.success(`Reacted with ${emoji}`);
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {/* Message Bubble */}
                                            <div
                                                className={`px-4 py-3 text-sm max-w-sm rounded-3xl shadow-sm ${isOwnMessage
                                                    ? "rounded-br-none bg-[#d9f7cd] text-gray-800"
                                                    : "rounded-bl-none bg-white text-slate-700 border border-gray-200 shadow-md"
                                                    }`}
                                                onContextMenu={(e) => {
                                                    if (message.view_once) {
                                                        e.preventDefault();
                                                        toast.error('Screenshots not allowed for view-once messages');
                                                    }
                                                }}
                                            >
                                                {/* Reply Preview */}
                                                {message.reply_to && (
                                                    <div className={`mb-2 p-2 rounded border-l-4 ${isOwnMessage ? 'bg-green-100/50 border-green-600' : 'bg-gray-100 border-gray-400'} text-xs`}>
                                                        <p className="font-semibold opacity-75">Reply to:</p>
                                                        <p className="opacity-90 truncate">{message.reply_to.text || 'Media'}</p>
                                                    </div>
                                                )}

                                                {/* View Once Media */}
                                                {message.view_once && (message.message_type === "image" || message.message_type === "video") && (
                                                    <ViewOnceMedia
                                                        message={message}
                                                        currentUserId={currentUserId}
                                                        allowSave={message.allow_save}
                                                        onViewed={async (messageId) => {
                                                            try {
                                                                let token = null;

                                                                // Priority 1: Try Clerk token first
                                                                try {
                                                                    token = await getToken();
                                                                } catch (e) {
                                                                    console.debug('Clerk token unavailable:', e.message);
                                                                }

                                                                // Priority 2: Fall back to custom auth token
                                                                if (!token && customToken) {
                                                                    token = customToken;
                                                                }

                                                                if (!token) {
                                                                    throw new Error('No authentication token available');
                                                                }

                                                                await api.post(`/api/message/mark-viewed/${messageId}`, {}, {
                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                });
                                                            } catch (error) {
                                                                console.error('Failed to mark as viewed:', error);
                                                            }
                                                        }}
                                                    />
                                                )}

                                                {/* Regular Media (Non-View Once) */}
                                                {!message.view_once && (
                                                    <>
                                                        {/* GIF */}
                                                        {message.message_type === "gif" && (
                                                            <img
                                                                src={message.message_url || message.text}
                                                                className="w-full max-w-sm rounded-lg mb-1 bg-gray-50"
                                                                alt="GIF"
                                                                loading="lazy"
                                                            />
                                                        )}

                                                        {/* Sticker */}
                                                        {message.message_type === "sticker" && (
                                                            <img
                                                                src={message.message_url || message.text}
                                                                className="w-40 h-40 object-contain mb-1"
                                                                alt="Sticker"
                                                                loading="lazy"
                                                                style={{ background: 'transparent' }}
                                                            />
                                                        )}

                                                        {/* Image */}
                                                        {message.message_type === "image" && (
                                                            <img
                                                                src={message.message_url || message.media_url}
                                                                className="w-full max-w-sm rounded-lg mb-1"
                                                                alt="Message image"
                                                            />
                                                        )}

                                                        {/* Video */}
                                                        {message.message_type === "video" && (
                                                            <div className="mb-2">
                                                                <VideoPlayer
                                                                    src={message.message_url || message.media_url}
                                                                    fileName={message.file_name || "video.mp4"}
                                                                />
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {/* Audio/Voice Note */}
                                                {(message.message_type === "audio" || message.message_type === "voice") && (
                                                    <div className="mb-2">
                                                        <AudioPlayer
                                                            src={message.message_url || message.media_url}
                                                            senderName={message.sender_name || message.from_user_id?.full_name || user?.full_name || "Unknown"}
                                                        />
                                                    </div>
                                                )}

                                                {/* Document */}
                                                {message.message_type === "document" && (
                                                    <a
                                                        href={message.message_url || message.media_url}
                                                        download={message.file_name}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`flex items-center gap-3 mb-2 p-3 rounded-lg ${isOwnMessage ? 'bg-green-50 hover:bg-green-100' : 'bg-blue-50 hover:bg-blue-100'} transition-colors`}
                                                    >
                                                        <div className={`p-2 rounded-lg ${isOwnMessage ? 'bg-green-100' : 'bg-blue-100'}`}>
                                                            <FileText size={24} className={isOwnMessage ? 'text-green-700' : 'text-blue-600'} />
                                                        </div>
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <span className="font-semibold text-sm truncate">{message.file_name || "document"}</span>
                                                            <span className="text-xs opacity-75">
                                                                {message.file_size ? `${(message.file_size / 1024 / 1024).toFixed(2)} MB` : "Click to download"}
                                                            </span>
                                                        </div>
                                                    </a>
                                                )}

                                                {/* Text */}
                                                {message.text && (
                                                    editingMessage?._id === message._id ? (
                                                        <div className="space-y-2">
                                                            <input
                                                                type="text"
                                                                value={editText}
                                                                onChange={(e) => setEditText(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleEditMessage();
                                                                    if (e.key === 'Escape') {
                                                                        setEditingMessage(null);
                                                                        setEditText('');
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={handleEditMessage}
                                                                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingMessage(null);
                                                                        setEditText('');
                                                                    }}
                                                                    className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="mt-1 break-words">{message.text}</p>
                                                    )
                                                )}

                                                {/* View Once Badge */}
                                                {message.view_once && (
                                                    <div className="flex items-center gap-1 mt-2 text-xs bg-red-100/50 text-red-700 px-2 py-1 rounded-full w-fit">
                                                        <Eye size={12} />
                                                        <span>View once</span>
                                                    </div>
                                                )}

                                                {/* Message Time and Status */}
                                                <div className="flex items-center justify-end gap-1 mt-2 text-xs">
                                                    <span className={isOwnMessage ? 'text-gray-600' : 'text-gray-500'}>
                                                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isOwnMessage && (
                                                        <MessageStatus message={message} />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Message Actions for own messages - Show on right */}
                                            {isOwnMessage && (
                                                <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center`}>
                                                    <MessageActions
                                                        message={message}
                                                        isOwnMessage={isOwnMessage}
                                                        onReply={() => setReplyToMessage(message)}
                                                        onEdit={startEditingMessage}
                                                        onInfo={() => {
                                                            setSelectedMessage(message);
                                                            setShowMessageInfo(true);
                                                        }}
                                                        onDelete={(type) => {
                                                            toast.success(`Message deleted ${type === 'everyone' ? 'for everyone' : 'for you'}`);
                                                        }}
                                                        onReact={(emoji) => {
                                                            toast.success(`Reacted with ${emoji}`);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </React.Fragment>
                                )
                            })}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                <div className="px-4">
                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span>{user?.full_name} is typing...</span>
                        </div>
                    )}

                    {/* File Preview */}
                    {image && (
                        <div className="mb-3 max-w-xl mx-auto bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {image.type.startsWith('image/') ? (
                                        <img src={URL.createObjectURL(image)} className="h-16 w-16 rounded object-cover" alt="Preview" />
                                    ) : image.type.startsWith('video/') ? (
                                        <video src={URL.createObjectURL(image)} className="h-16 w-16 rounded object-cover" />
                                    ) : (
                                        <div className="h-16 w-16 rounded bg-gray-100 flex items-center justify-center">
                                            <FileText className="text-gray-500" size={32} />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold text-sm text-gray-800 truncate max-w-xs">{image.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {image.type.startsWith('video/') ? '🎥 Video • ' : image.type.startsWith('audio/') ? '🎵 Audio • ' : ''}
                                            {(image.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setImage(null)}
                                    className="p-1 hover:bg-gray-100 rounded-full"
                                >
                                    <X size={18} className="text-gray-600" />
                                </button>
                            </div>

                            {/* View Once & Save Options */}
                            {(image.type.startsWith('image/') || image.type.startsWith('video/')) && (
                                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={sendAsViewOnce}
                                            onChange={(e) => setSendAsViewOnce(e.target.checked)}
                                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                        />
                                        <Eye className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                            Send as View Once
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={allowSave}
                                            onChange={(e) => setAllowSave(e.target.checked)}
                                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                            Allow recipient to save
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full mb-5">
                        <EmojiGifPicker
                            onEmojiSelect={handleEmojiSelect}
                            onGifSelect={handleGifSelect}
                        />
                        <input
                            type="text"
                            className="flex-1 outline-none text-slate-700"
                            placeholder="Type a message..."
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            onChange={(e) => {
                                setText(e.target.value);
                                // Typing indicator logic
                                if (typingTimeout) clearTimeout(typingTimeout);
                                const timeout = setTimeout(() => {
                                    // Send typing status to server
                                }, 2000);
                                setTypingTimeout(timeout);
                            }}
                            value={text}
                        />
                        <label htmlFor="file" className="cursor-pointer">
                            <ImageIcon className="size-7 text-gray-400 hover:text-gray-600" />
                            <input
                                type="file"
                                id="file"
                                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                                hidden
                                onChange={handleMediaSelect}
                            />
                        </label>
                        <SpeechToText
                            onSend={(transcribedText) => {
                                setText(transcribedText);
                            }}
                        />
                        <VoiceRecorder
                            onSendVoiceNote={sendVoiceNote}
                            disabled={false}
                        />
                        
                        {/* View Once Button */}
                        <button
                            onClick={() => setSendAsViewOnce(!sendAsViewOnce)}
                            title={sendAsViewOnce ? "View-once enabled" : "Send as view-once"}
                            className={`p-2 rounded-full transition-all ${
                                sendAsViewOnce
                                    ? "bg-purple-100 text-purple-600"
                                    : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            <Eye size={18} />
                        </button>

                        <button
                            onClick={sendMessage}
                            className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 cursor-pointer text-white p-2 rounded-full"
                        >
                            <SendHorizonal size={18} />
                        </button>
                    </div>
                </div>

                {/* Call Window */}
                {isInCall && (
                    <CallWindow
                        callType={callType}
                        otherUserId={userId}
                        otherUserName={user.full_name}
                        otherUserPhoto={user.profile_picture}
                        onEndCall={endCall}
                        callId={Date.now().toString()}
                    />
                )}

                {/* Message Info Modal */}
                {showMessageInfo && selectedMessage && (
                    <MessageInfo
                        message={selectedMessage}
                        currentUserId={currentUserId}
                        onClose={() => {
                            setShowMessageInfo(false);
                            setSelectedMessage(null);
                        }}
                    />
                )}

                {/* Media Editor Modal */}
                {editingMedia && (
                    <MediaEditor
                        file={editingMedia}
                        type={mediaType}
                        onSave={handleMediaSave}
                        onCancel={() => setEditingMedia(null)}
                    />
                )}
                {/* Upload Progress Loader (removed — use global loader in App.jsx) */}
                </div>
        )
    );
};

export default Chat;
