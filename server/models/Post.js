import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true },
    content: { type: String },
    image_urls: [{ type: String }],
    post_type: {
      type: String,
      enum: ["text", "image", "text_with_image"],
      required: true,
    },
    likes_count: [{ type: String, ref: "User" }],
    reactions: [{
      user: { type: String, ref: "User" },
      type: { type: String, enum: ["LIKE", "SUPPORT", "CELEBRATE", "CHEER", "INSIGHT", "OMG"], default: "LIKE" },
      createdAt: { type: Date, default: Date.now }
    }],
    reposts: [{ type: String, ref: "User" }],
    comments_count: { type: Number, default: 0 },
    shares_count: { type: Number, default: 0 },
    // View tracking
    views: [{
      viewer: { type: String, ref: "User" },
      viewedAt: { type: Date, default: Date.now },
      deviceType: { type: String, enum: ["Mobile", "Desktop", "Tablet", "Unknown"], default: "Unknown" },
      referrer: { type: String } // e.g., 'direct', 'feed', 'profile', 'notification'
    }],
    unique_viewers: { type: Number, default: 0 },
    // Profile interactions from this post
    profile_clicks: [{
      viewer: { type: String, ref: "User" },
      clickedAt: { type: Date, default: Date.now }
    }],
    // Hashtags and mentions
    hashtags: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    mentions: [{
      type: String,
      ref: "User"
    }],
  },
  { timestamps: true, minimize: false }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
