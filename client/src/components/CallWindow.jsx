import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';

const CallWindow = ({
    callType = 'voice',
    otherUserName,
    otherUserPhoto,
    onEndCall,
    isIncoming = false
}) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoPaused, setIsVideoPaused] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'calling');
    const [localStream, setLocalStream] = useState(null);
    const durationIntervalRef = useRef(null);

    useEffect(() => {
        const initializeMedia = async () => {
            try {
                const constraints = {
                    audio: true,
                    video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                setLocalStream(stream);
                
                if (localVideoRef.current && callType === 'video') {
                    localVideoRef.current.srcObject = stream;
                }

                // Simulate call being answered after 3 seconds
                setTimeout(() => {
                    setCallStatus('connected');
                    durationIntervalRef.current = setInterval(() => {
                        setCallDuration(prev => prev + 1);
                    }, 1000);
                }, 3000);

            } catch (error) {
                console.error('Error accessing media devices:', error);
                setCallStatus('failed');
            }
        };

        initializeMedia();

        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [callType]);

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

    const handleEndCall = () => {
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        onEndCall();
    };

    const handleAcceptCall = () => {
        setCallStatus('connected');
        durationIntervalRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
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
                            <div className={`w-32 h-32 rounded-full overflow-hidden border-4 shadow-2xl ${
                                callStatus === 'calling' || callStatus === 'incoming' 
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
                                    {callStatus === 'calling' && 'Calling...'}
                                    {callStatus === 'incoming' && 'Incoming call...'}
                                    {callStatus === 'connected' && formatDuration(callDuration)}
                                    {callStatus === 'failed' && 'Call failed'}
                                </p>
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
                <div className="bg-gradient-to-t from-black/80 to-transparent px-6 py-8 flex items-center justify-center gap-4">
                    {callStatus === 'incoming' ? (
                        <>
                            <button
                                onClick={handleEndCall}
                                className="p-5 rounded-full bg-red-500 hover:bg-red-600 transition shadow-lg"
                                title="Decline"
                            >
                                <PhoneOff size={28} className="text-white" />
                            </button>
                            <button
                                onClick={handleAcceptCall}
                                className="p-5 rounded-full bg-green-500 hover:bg-green-600 transition shadow-lg"
                                title="Accept"
                            >
                                <Phone size={28} className="text-white" />
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Mic Toggle */}
                            <button
                                onClick={toggleMic}
                                className={`p-4 rounded-full transition shadow-lg ${
                                    isMicMuted
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
                                    className={`p-4 rounded-full transition shadow-lg ${
                                        isVideoPaused
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

                            {/* End Call */}
                            <button
                                onClick={handleEndCall}
                                className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition shadow-lg"
                                title="End call"
                            >
                                <PhoneOff size={24} className="text-white" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallWindow;
