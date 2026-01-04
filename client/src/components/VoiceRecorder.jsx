import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Trash2, Send } from "lucide-react";

const VoiceRecorder = ({ onSendVoiceNote, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Unable to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const sendVoiceNote = () => {
    if (audioBlob) {
      onSendVoiceNote(audioBlob);
      deleteRecording();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // If recording or has audio, show expanded view
  if (isRecording || audioBlob) {
    return (
      <div className="flex items-center gap-2 bg-indigo-50 p-3 rounded-lg">
        <div className="flex-1">
          {isRecording ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-600">
                Recording: {formatTime(recordingTime)}
              </span>
            </div>
          ) : audioBlob ? (
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-indigo-600">
                Voice note ({formatTime(recordingTime)})
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          {isRecording && (
            <button
              onClick={stopRecording}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              title="Stop recording"
            >
              <Square className="w-4 h-4" />
            </button>
          )}

          {audioBlob && !isRecording && (
            <>
              <button
                onClick={deleteRecording}
                className="p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
                title="Delete recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={sendVoiceNote}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                title="Send voice note"
              >
                <Send className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Collapsed view - just show mic button
  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
      title="Record voice note"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
};

export default VoiceRecorder;
