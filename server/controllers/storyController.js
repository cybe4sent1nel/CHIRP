import fs from "fs";
import imageKit from "../configs/imageKit.js";
import User from "../models/User.js";
import Story from "../models/Story.js";
import { inngest } from "../inngest/index.js";
import { getUserId } from "../middlewares/auth.js";

// Add user story
export const addUserStory = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { content, media_type, background_color } = req.body;
    const media = req.file;
    let media_url = "";

    // upload media to imagekit
    if (media_type === "image" || media_type === "video") {
      const response = await imageKit.files.upload({
        file: fs.createReadStream(media.path),
        fileName: media.originalname,
      });

      media_url = response.url;
    }

    // Create story
    const story = await Story.create({
      user: userId,
      content,
      media_url,
      media_type,
      background_color,
    });

    console.log(`Story created with ID: ${story._id}, expires at: ${story.expiresAt}`);

    // Schedule story deletion after 24 hours via Inngest
    try {
      await inngest.send({
        name: "app/story-delete",
        data: { storyId: story._id.toString() },
      });
      console.log(`Inngest deletion event sent for story ${story._id}`);
    } catch (inngestError) {
      console.error('Failed to send Inngest event:', inngestError);
      // Story will still be deleted by TTL index
    }

    res.json({ success: true, story });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get User Story
export const getStories = async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // User connections and followings
    const userIds = [userId, ...(user.connections || []), ...(user.following || [])];

    // Delete expired stories (fallback cleanup)
    await Story.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    const stories = await Story.find({
      user: { $in: userIds },
      expiresAt: { $gt: new Date() } // Only get non-expired stories
    })
      .populate("user")
      .sort({ createdAt: -1 });

    res.json({ success: true, stories });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Manual cleanup endpoint for testing/debugging
export const cleanupExpiredStories = async (req, res) => {
  try {
    const result = await Story.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    console.log(`Manual cleanup: Deleted ${result.deletedCount} expired stories`);
    res.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} expired stories` 
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
