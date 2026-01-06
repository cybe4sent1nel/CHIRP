import Comment from '../models/Comment.js';
import Post from '../models/Post.js';

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

    const comments = await Comment.find({ post: postId })
      .populate('user', 'full_name username profile_picture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      comments
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
    const { postId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = new Comment({
      post: postId,
      user: userId,
      text: text.trim()
    });

    await comment.save();
    await comment.populate('user', 'full_name username profile_picture');

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
