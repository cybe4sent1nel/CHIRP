import { useEffect, useRef, useState } from 'react';
import {
    Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X,
    Volume2, VolumeX, RotateCw, Plus, Settings, Pause, Play
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CallWindow = ({
    callType = 'voice',
    otherUserId,
    otherUserName,
    otherUserPhoto,
    onEndCall,
    isIncoming = false,
    callId = null
}) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoPaused, setIsVideoPaused] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'calling');
    const [localStream, setLocalStream] = useState(null);
    const [isCallHeld, setIsCallHeld] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState('user');
    const durationIntervalRef = useRef(null);
    const { getToken } = useAuth();
    const iceServersRef = useRef([
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ]);

    useEffect(() => {
        const initializeMedia = async () => {
            try {
                const constraints = {
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    },
                    video: callType === 'video' ? {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user'
                    } : false
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                setLocalStream(stream);

                if (localVideoRef.current && callType === 'video') {
                    localVideoRef.current.srcObject = stream;
                }

                // Initialize WebRTC connection
                await initializePeerConnection(stream);

                // If outgoing call, send call notification
                if (!isIncoming) {
                    await sendCallNotification();
                }

            } catch (error) {
                console.error('Error accessing media devices:', error);
                toast.error('Could not access camera/microphone');
                setCallStatus('failed');
                setTimeout(() => onEndCall(), 2000);
            }
        };

        initializeMedia();

        return () => {
            cleanupCall();
        };
    }, [callType]);

    const initializePeerConnection = async (stream) => {
        try {
            const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
            peerConnectionRef.current = pc;

            // Add local stream tracks to peer connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Handle incoming tracks
            pc.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                    setCallStatus('connected');
                    startCallTimer();
                }
            };

            // Handle ICE candidates
            pc.onicecandidate = async (event) => {
                if (event.candidate) {
                    await sendICECandidate(event.candidate);
                }
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log('Connection state:', pc.connectionState);
                if (pc.connectionState === 'connected') {
                    setCallStatus('connected');
                    startCallTimer();
                } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                    handleEndCall();
                }
            };

        } catch (error) {
            console.error('Error initializing peer connection:', error);
            toast.error('Connection failed');
        }
    };

    const sendCallNotification = async () => {
        try {
            const token = await getToken();
            await api.post('/api/call/initiate', {
                recipientId: otherUserId,
                callType,
                callId: Date.now().toString()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error sending call notification:', error);
        }
    };

    const sendICECandidate = async (candidate) => {
        try {
            const token = await getToken();
            await api.post('/api/call/ice-candidate', {
                recipientId: otherUserId,
                candidate
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error sending ICE candidate:', error);
        }
    };

    const startCallTimer = () => {
        if (!durationIntervalRef.current) {
            durationIntervalRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
    };

    const cleanupCall = () => {
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
    };

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleMic = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream && callType === 'video') {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoPaused(!videoTrack.enabled);
            }
        }
    };

    const toggleCallHold = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            const videoTrack = localStream.getVideoTracks()[0];

            if (!isCallHeld) {
                // Hold call - mute both audio and video
                if (audioTrack) audioTrack.enabled = false;
                if (videoTrack) videoTrack.enabled = false;
                setIsCallHeld(true);
                toast.success('Call on hold');
            } else {
                // Resume call
                if (audioTrack) audioTrack.enabled = true;
                if (videoTrack && !isVideoPaused) videoTrack.enabled = true;
                setIsCallHeld(false);
                toast.success('Call resumed');
            }
        }
    };

    const toggleSpeaker = () => {
        setIsSpeakerOn(!isSpeakerOn);
        toast.success(isSpeakerOn ? 'Speaker off' : 'Speaker on');
    };

    const switchCamera = async () => {
        if (localStream && callType === 'video') {
            try {
                // Stop current video track
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) videoTrack.stop();

                // Get new camera
                const newFacingMode = cameraFacingMode === 'user' ? 'environment' : 'user';
                const constraints = {
                    audio: false,
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: newFacingMode
                    }
                };

                const newStream = await navigator.mediaDevices.getUserMedia(constraints);
                const newVideoTrack = newStream.getVideoTracks()[0];

                // Replace video track in peer connection
                if (peerConnectionRef.current) {
                    const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        await sender.replaceTrack(newVideoTrack);
                    }
                }

                // Update local stream with new video track
                localStream.getVideoTracks().forEach(track => track.stop());
                localStream.addTrack(newVideoTrack);

                setCameraFacingMode(newFacingMode);
                toast.success('Camera switched');
            } catch (error) {
                console.error('Error switching camera:', error);
                toast.error('Could not switch camera');
            }
        }
    };

    const addParticipant = () => {
        toast.info('Conference call feature coming soon');
    };

    const handleEndCall = async () => {
        try {
            const duration = callDuration;
            cleanupCall();
            const token = await getToken();
            await api.post('/api/call/end', {
                recipientId: otherUserId,
                callId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onEndCall(duration);
        } catch (error) {
            console.error('Error ending call:', error);
            onEndCall(callDuration);
        }
    };

    const handleAcceptCall = async () => {
        try {
            setCallStatus('connecting');
            const token = await getToken();

            // Send accept signal
            await api.post('/api/call/accept', {
                callerId: otherUserId,
                callId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Create answer for WebRTC
            if (peerConnectionRef.current) {
                const answer = await peerConnectionRef.current.createAnswer();
                await peerConnectionRef.current.setLocalDescription(answer);

                await api.post('/api/call/answer', {
                    recipientId: otherUserId,
                    answer
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error('Error accepting call:', error);
            toast.error('Failed to accept call');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
            <div className="w-full h-full flex flex-col">
                {/* Header */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                    <button
                        onClick={handleEndCall}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
                    >
                        <X size={24} className="text-white" />
                    </button>
                    {callStatus === 'connected' && (
                        <div className="bg-black/50 px-4 py-2 rounded-full">
                            <p className="text-white text-lg font-semibold">{formatDuration(callDuration)}</p>
                        </div>
                    )}
                    <div className="w-10" />
                </div>

                {/* Main Content */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                    {callType === 'video' && callStatus === 'connected' ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                            poster={otherUserPhoto}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-6">
                            <div className={`w-32 h-32 rounded-full overflow-hidden border-4 shadow-2xl ${callStatus === 'calling' || callStatus === 'incoming'
                                    ? 'border-indigo-500 animate-pulse'
                                    : 'border-green-500'
                                }`}>
                                <img
                                    src={otherUserPhoto}
                                    alt={otherUserName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-white mb-2">{otherUserName}</h2>
                                <p className="text-gray-300 text-lg">
                                    {callStatus === 'calling' && 'Ringing...'}
                                    {callStatus === 'incoming' && 'Incoming call...'}
                                    {callStatus === 'connecting' && 'Connecting...'}
                                    {callStatus === 'connected' && formatDuration(callDuration)}
                                    {callStatus === 'failed' && 'Call failed - Check permissions'}
                                </p>
                                {callStatus === 'failed' && (
                                    <p className="text-red-400 text-sm mt-2">
                                        Please allow camera/microphone access in your browser settings
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Local Video PiP */}
                    {callType === 'video' && !isVideoPaused && callStatus === 'connected' && (
                        <div className="absolute bottom-24 right-4 w-32 h-44 rounded-xl overflow-hidden border-2 border-white shadow-lg bg-black">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="bg-gradient-to-t from-black/90 to-transparent px-6 py-8">
                    {callStatus === 'incoming' ? (
                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={handleEndCall}
                                className="p-5 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition shadow-lg"
                                title="Decline"
                            >
                                <PhoneOff size={28} className="text-white" />
                            </button>
                            <button
                                onClick={handleAcceptCall}
                                className="p-5 rounded-full bg-green-500 hover:bg-green-600 active:scale-95 transition shadow-lg"
                                title="Accept"
                            >
                                <Phone size={28} className="text-white" />
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Primary Controls */}
                            <div className="flex items-center justify-center gap-4 mb-4">
                                {/* Mic Toggle */}
                                <button
                                    onClick={toggleMic}
                                    className={`p-4 rounded-full transition shadow-lg active:scale-95 ${isMicMuted
                                            ? 'bg-red-500 hover:bg-red-600'
                                            : 'bg-white/20 hover:bg-white/30'
                                        }`}
                                    title={isMicMuted ? 'Unmute' : 'Mute'}
                                >
                                    {isMicMuted ? (
                                        <MicOff size={24} className="text-white" />
                                    ) : (
                                        <Mic size={24} className="text-white" />
                                    )}
                                </button>

                                {/* Video Toggle */}
                                {callType === 'video' && (
                                    <button
                                        onClick={toggleVideo}
                                        className={`p-4 rounded-full transition shadow-lg active:scale-95 ${isVideoPaused
                                                ? 'bg-red-500 hover:bg-red-600'
                                                : 'bg-white/20 hover:bg-white/30'
                                            }`}
                                        title={isVideoPaused ? 'Turn on camera' : 'Turn off camera'}
                                    >
                                        {isVideoPaused ? (
                                            <VideoOff size={24} className="text-white" />
                                        ) : (
                                            <Video size={24} className="text-white" />
                                        )}
                                    </button>
                                )}

                                {/* Hold Call */}
                                <button
                                    onClick={toggleCallHold}
                                    className={`p-4 rounded-full transition shadow-lg active:scale-95 ${isCallHeld
                                            ? 'bg-yellow-500 hover:bg-yellow-600'
                                            : 'bg-white/20 hover:bg-white/30'
                                        }`}
                                    title={isCallHeld ? 'Resume call' : 'Hold call'}
                                >
                                    {isCallHeld ? (
                                        <Play size={24} className="text-white" />
                                    ) : (
                                        <Pause size={24} className="text-white" />
                                    )}
                                </button>

                                {/* Speaker Toggle */}
                                <button
                                    onClick={toggleSpeaker}
                                    className={`p-4 rounded-full transition shadow-lg active:scale-95 ${isSpeakerOn
                                            ? 'bg-white/20 hover:bg-white/30'
                                            : 'bg-red-500 hover:bg-red-600'
                                        }`}
                                    title={isSpeakerOn ? 'Speaker on' : 'Speaker off'}
                                >
                                    {isSpeakerOn ? (
                                        <Volume2 size={24} className="text-white" />
                                    ) : (
                                        <VolumeX size={24} className="text-white" />
                                    )}
                                </button>

                                {/* End Call */}
                                <button
                                    onClick={handleEndCall}
                                    className="p-4 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition shadow-lg"
                                    title="End call"
                                >
                                    <PhoneOff size={24} className="text-white" />
                                </button>
                            </div>

                            {/* Secondary Controls */}
                            <div className="flex items-center justify-center gap-4">
                                {/* Switch Camera */}
                                {callType === 'video' && (
                                    <button
                                        onClick={switchCamera}
                                        className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition shadow-lg active:scale-95"
                                        title="Switch camera"
                                    >
                                        <RotateCw size={20} className="text-white" />
                                    </button>
                                )}

                                {/* Add Participant */}
                                <button
                                    onClick={addParticipant}
                                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition shadow-lg active:scale-95"
                                    title="Add participant"
                                >
                                    <Plus size={20} className="text-white" />
                                </button>

                                {/* More Options */}
                                <button
                                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                                    className={`p-3 rounded-full transition shadow-lg active:scale-95 ${showMoreOptions
                                            ? 'bg-white/30'
                                            : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                    title="More options"
                                >
                                    <Settings size={20} className="text-white" />
                                </button>
                            </div>

                            {/* More Options Menu */}
                            {showMoreOptions && (
                                <div className="mt-4 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                                        <div className="text-xs text-white/70 text-center">
                                            <p className="font-semibold">Call Features</p>
                                        </div>
                                        <div className="text-xs text-white/70 text-center">
                                            <p>Active</p>
                                        </div>

                                        <p className="text-xs text-white">Mic</p>
                                        <p className="text-xs text-white text-right">{isMicMuted ? '🔴 Muted' : '🟢 On'}</p>

                                        {callType === 'video' && (
                                            <>
                                                <p className="text-xs text-white">Camera</p>
                                                <p className="text-xs text-white text-right">{isVideoPaused ? '🔴 Off' : '🟢 On'}</p>
                                            </>
                                        )}

                                        <p className="text-xs text-white">Speaker</p>
                                        <p className="text-xs text-white text-right">{isSpeakerOn ? '🟢 On' : '🔴 Off'}</p>

                                        <p className="text-xs text-white">Call Status</p>
                                        <p className="text-xs text-white text-right">{isCallHeld ? '⏸️ On Hold' : '🟢 Connected'}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallWindow;
