import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    // Call participants
    caller_id: { type: String, required: true },
    recipient_id: { type: String, required: true },
    
    // Call details
    call_type: { 
      type: String, 
      enum: ["voice", "video", "conference"],
      default: "voice"
    },
    status: {
      type: String,
      enum: ["calling", "ringing", "connected", "ended", "missed", "rejected", "failed"],
      default: "calling"
    },
    
    // Timestamps
    call_started: { type: Date, default: Date.now },
    call_connected: { type: Date },
    call_ended: { type: Date },
    
    // Call duration in seconds
    duration: { type: Number, default: 0 },
    
    // Call quality metrics
    audio_quality: { type: String, enum: ["excellent", "good", "fair", "poor"], default: "good" },
    video_quality: { type: String, enum: ["hd", "sd", "ld"], default: "sd" },
    
    // Conference call details
    participants: [{ type: String, ref: "User" }],
    
    // Features used during call
    features_used: {
      mic_muted: { type: Boolean, default: false },
      camera_off: { type: Boolean, default: false },
      speaker_on: { type: Boolean, default: true },
      call_held: { type: Boolean, default: false },
      screen_shared: { type: Boolean, default: false }
    },
    
    // Recording (if enabled)
    is_recorded: { type: Boolean, default: false },
    recording_url: { type: String },
    
    // Encryption
    is_encrypted: { type: Boolean, default: true },
    encryption_type: { type: String, default: "end-to-end" },
    
    // Notes
    notes: { type: String }
  },
  { timestamps: true, minimize: false }
);

const Call = mongoose.model("Call", callSchema);

export default Call;
