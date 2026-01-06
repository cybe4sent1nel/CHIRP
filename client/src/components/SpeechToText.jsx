import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, Loader, AudioLines } from 'lucide-react';
import toast from 'react-hot-toast';

const SpeechToText = ({ onSend, placeholder = "Start speaking..." }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const hasSpokenRef = useRef(false);
  const speakingTimeoutRef = useRef(null);

  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      hasSpokenRef.current = false;
    };

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcriptPiece + ' ';
          hasSpokenRef.current = true;
        } else {
          interimText += transcriptPiece;
        }
      }

      if (finalText) {
        setTranscript(prev => prev + finalText);
      }
      setInterimTranscript(interimText);

      // Indicate speaking
      setIsSpeaking(true);
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
      speakingTimeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
      }, 300);

      // Reset silence timer on speech
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Set timer for detecting end of speech (2 seconds of silence)
      silenceTimerRef.current = setTimeout(() => {
        if (hasSpokenRef.current && (transcript + finalText).trim()) {
          stopListening();
        }
      }, 2000);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        toast.error('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        toast.error('Microphone access denied');
      } else {
        toast.error('Error: ' + event.error);
      }
      stopListening();
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      
      // Show preview if we have text
      if (transcript.trim()) {
        setShowPreview(true);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
    };
  }, [transcript]);

  const startListening = () => {
    setTranscript('');
    setInterimTranscript('');
    setShowPreview(false);
    hasSpokenRef.current = false;
    
    try {
      recognitionRef.current?.start();
      toast.success('Listening... Speak now', { duration: 1500 });
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast.error('Failed to start listening');
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    try {
      recognitionRef.current?.stop();
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  };

  const handleStopRecording = () => {
    stopListening();
    
    // Automatically fill the message input when stop is clicked (without sending)
    if (transcript.trim()) {
      // Just set the text in the input, don't send it
      onSend(transcript.trim());
      setTranscript('');
      setInterimTranscript('');
      toast.success('Text added to message box');
    }
  };

  const handleSend = () => {
    const textToSend = transcript.trim();
    if (!textToSend) {
      toast.error('No text to send');
      return;
    }

    onSend(textToSend);
    
    // Reset
    setTranscript('');
    setInterimTranscript('');
    setShowPreview(false);
    toast.success('Message ready!');
  };

  const handleCancel = () => {
    setTranscript('');
    setInterimTranscript('');
    setShowPreview(false);
    stopListening();
  };

  return (
    <div className="relative">
      {/* Listening Indicator */}
      {isListening && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center">
              {/* Animated Sound Wave Pulse */}
              <div className="relative mb-6 flex items-center justify-center h-32">
                {/* Outer pulse rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`absolute w-32 h-32 rounded-full animate-ping transition-colors duration-300 ${
                    isSpeaking || interimTranscript ? 'bg-green-400 opacity-30' : 'bg-red-400 opacity-20'
                  }`}></div>
                  <div className={`absolute w-24 h-24 rounded-full animate-pulse transition-colors duration-300 ${
                    isSpeaking || interimTranscript ? 'bg-green-500 opacity-50' : 'bg-red-500 opacity-30'
                  }`} style={{ animationDuration: '1.5s' }}></div>
                </div>
                
                {/* Sound wave bars */}
                <div className="relative flex items-center justify-center gap-2 z-10">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 rounded-full transition-all duration-150 ${
                        isSpeaking || interimTranscript 
                          ? 'bg-gradient-to-t from-green-600 via-green-500 to-green-400' 
                          : 'bg-gradient-to-t from-red-600 via-red-500 to-red-400'
                      }`}
                      style={{
                        height: isSpeaking || interimTranscript ? 
                          `${30 + Math.sin((Date.now() / 100) + i) * 25}px` : '24px',
                        animation: `wave ${0.5 + i * 0.08}s ease-in-out infinite`,
                        animationDelay: `${i * 0.08}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Status */}
              <h3 className="text-xl font-bold text-gray-800 mb-2">Listening...</h3>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Speak clearly. We'll detect when you're done.
              </p>

              {/* Live Transcript */}
              <div className="w-full bg-gray-50 rounded-lg p-4 mb-6 min-h-[100px] max-h-[200px] overflow-y-auto">
                <p className="text-gray-800">
                  {transcript}
                  <span className="text-gray-400 italic">{interimTranscript}</span>
                  <span className="inline-block w-1 h-4 bg-red-500 animate-pulse ml-1"></span>
                </p>
              </div>

              {/* Stop Button */}
              <button
                onClick={handleStopRecording}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
              >
                <MicOff size={20} />
                Stop Recording
              </button>
            </div>
          </div>
          
          {/* CSS for wave animation */}
          <style>{`
            @keyframes wave {
              0%, 100% {
                height: 24px;
                opacity: 0.7;
              }
              20% {
                height: 40px;
                opacity: 0.85;
              }
              50% {
                height: 56px;
                opacity: 1;
              }
              80% {
                height: 38px;
                opacity: 0.85;
              }
            }
          `}</style>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && !isListening && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Review & Send</h3>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Editable Transcript */}
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
              rows="6"
              placeholder="Your transcribed message..."
            />

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!transcript.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <Send size={18} />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Microphone Button */}
      {!isListening && !showPreview && (
        <button
          onClick={startListening}
          className="p-2 hover:bg-indigo-50 rounded-full transition-colors"
          title="Speech to text"
        >
          <AudioLines size={20} className="text-gray-600 hover:text-indigo-600" />
        </button>
      )}
    </div>
  );
};

export default SpeechToText;
