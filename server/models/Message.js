import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender_id: { type: String, ref: "User", required: true },
    recipient_id: { type: String, ref: "User", required: true },
    from_user_id: { type: String, ref: "User" }, // Legacy support
    to_user_id: { type: String, ref: "User" }, // Legacy support
    text: { type: String, trim: true },
    message_type: { 
      type: String, 
      enum: ["text", "image", "video", "audio", "document", "voice"],
      default: "text"
    },
    message_url: { type: String },
    file_name: { type: String },
    file_size: { type: Number },
    file_type: { type: String }, // MIME type (e.g., 'video/mp4', 'audio/mpeg')
    seen: { type: Boolean, default: false },
    // Message Status (WhatsApp-like)
    sent: { type: Boolean, default: true },
    delivered: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    delivered_at: { type: Date },
    read_at: { type: Date },
    // For message info display
    read_by: [{ type: String, ref: "User" }],
    delivered_to: [{ type: String, ref: "User" }],
    // Message deletion
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date },
    deleted_by: [{ type: String, ref: "User" }],
    // Message editing
    edited: { type: Boolean, default: false },
    edited_at: { type: Date },
    // Message forwarding
    forwarded: { type: Boolean, default: false },
    forwarded_from: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    // Message starring
    starred: [{ type: String, ref: "User" }],
    // Message pinning
    pinned: [{ type: String, ref: "User" }],
    // View-Once Messages
    view_once: { type: Boolean, default: false },
    viewed_by: [{ type: String, ref: "User" }],
    viewed_at: { type: Date },
    allow_save: { type: Boolean, default: true },
  },
  { timestamps: true, minimize: false }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
