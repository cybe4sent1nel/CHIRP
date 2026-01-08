import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Hashtag from '../models/Hashtag.js';
import { extractHashtags, extractMentions } from '../utils/textUtils.js';

// Create Comment model if it doesn't exist
const commentSchema = `
{
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}
`;

// Get comments for a post
export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId || req.auth()?.userId;

    const comments = await Comment.find({ post: postId })
      .populate('user', 'full_name username profile_picture')
      .sort({ createdAt: -1 });

    // Add user reaction info to each comment
    const commentsWithReactions = comments.map(comment => {
      const userReaction = comment.reactions?.find(r => r.user === userId);
      return {
        ...comment.toObject(),
        user_reaction: userReaction?.type || null
      };
    });

    res.json({
      success: true,
      comments: commentsWithReactions
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add comment
export const addComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId, text, media_url, media_type } = req.body;

    if ((!text || !text.trim()) && !media_url) {
      return res.status(400).json({ success: false, message: 'Comment text or media is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Extract hashtags and mentions
    const hashtags = text ? extractHashtags(text) : [];
    const mentions = text ? extractMentions(text) : [];

    const comment = new Comment({
      post: postId,
      user: userId,
      text: text ? text.trim() : '',
      media_url: media_url || undefined,
      media_type: media_type || undefined,
      hashtags,
      mentions
    });

    await comment.save();
    await comment.populate('user', 'full_name username profile_picture');

    // Update hashtag tracking
    for (const tag of hashtags) {
      await Hashtag.findOneAndUpdate(
        { tag: tag.toLowerCase() },
        {
          $inc: { count: 1 },
          $addToSet: { posts: postId },
          $set: { last_used: new Date() }
        },
        { upsert: true, new: true }
      );
    }

    // Increment comment count on post
    post.comments_count = (post.comments_count || 0) + 1;
    await post.save();

    res.status(201).json({
      success: true,
      message: 'Comment added',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update comment
export const updateComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { commentId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this comment' });
    }

    comment.text = text.trim();
    await comment.save();
    await comment.populate('user', 'full_name username profile_picture');

    res.json({
      success: true,
      message: 'Comment updated',
      comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    const postId = comment.post;
    await comment.deleteOne();

    // Decrement comment count on post
    await Post.findByIdAndUpdate(postId, {
      $inc: { comments_count: -1 }
    });

    res.json({
      success: true,
      message: 'Comment deleted'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// React to comment
export const reactToComment = async (req, res) => {
  try {
    const userId = req.userId || req.auth()?.userId;
    const { commentId, reactionType = 'LIKE' } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Initialize reactions array if it doesn't exist
    if (!comment.reactions) {
      comment.reactions = [];
    }

    // Check if user already reacted
    const existingReactionIndex = comment.reactions.findIndex(r => r.user === userId);
    
    if (existingReactionIndex > -1) {
      const existingReaction = comment.reactions[existingReactionIndex];
      
      if (existingReaction.type === reactionType) {
        // Same reaction - remove it
        comment.reactions.splice(existingReactionIndex, 1);
        await comment.save();
        
        return res.json({
          success: true,
          message: 'Reaction removed',
          reactions: comment.reactions,
          userReaction: null
        });
      } else {
        // Different reaction - update it
        comment.reactions[existingReactionIndex].type = reactionType;
        comment.reactions[existingReactionIndex].createdAt = new Date();
        await comment.save();
        
        return res.json({
          success: true,
          message: 'Reaction updated',
          reactions: comment.reactions,
          userReaction: reactionType
        });
      }
    } else {
      // New reaction - add it
      comment.reactions.push({
        user: userId,
        type: reactionType,
        createdAt: new Date()
      });
      
      await comment.save();
      
      return res.json({
        success: true,
        message: 'Reaction added',
        reactions: comment.reactions,
        userReaction: reactionType
      });
    }
  } catch (error) {
    console.error('React to comment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reply to comment
export const replyToComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { commentId, text, media_url, media_type } = req.body;

    if ((!text || !text.trim()) && !media_url) {
      return res.status(400).json({ success: false, message: 'Reply text or media is required' });
    }

    const parentComment = await Comment.findById(commentId).populate('post');
    
    if (!parentComment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Extract hashtags and mentions
    const hashtags = text ? extractHashtags(text) : [];
    const mentions = text ? extractMentions(text) : [];

    // Create the reply comment
    const reply = new Comment({
      post: parentComment.post,
      user: userId,
      text: text ? text.trim() : '',
      media_url: media_url || undefined,
      media_type: media_type || undefined,
      parentComment: commentId,
      hashtags,
      mentions
    });

    await reply.save();
    await reply.populate('user', 'full_name username profile_picture');

    // Update hashtag tracking
    for (const tag of hashtags) {
      await Hashtag.findOneAndUpdate(
        { tag: tag.toLowerCase() },
        {
          $inc: { count: 1 },
          $addToSet: { posts: parentComment.post },
          $set: { last_used: new Date() }
        },
        { upsert: true, new: true }
      );
    }

    // Add reply reference to parent comment
    if (!parentComment.replies) {
      parentComment.replies = [];
    }
    parentComment.replies.push(reply._id);
    await parentComment.save();

    // Increment comment count on post
    await Post.findByIdAndUpdate(parentComment.post, {
      $inc: { comments_count: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Reply added',
      reply
    });
  } catch (error) {
    console.error('Reply to comment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
