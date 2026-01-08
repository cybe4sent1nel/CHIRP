import Hashtag from '../models/Hashtag.js';
import Post from '../models/Post.js';

// Get trending hashtags
export const getTrendingHashtags = async (req, res) => {
  try {
    const { limit = 10, timeframe = 'week' } = req.query;
    
    // Calculate date threshold
    const dateThreshold = new Date();
    switch(timeframe) {
      case 'day':
        dateThreshold.setDate(dateThreshold.getDate() - 1);
        break;
      case 'week':
        dateThreshold.setDate(dateThreshold.getDate() - 7);
        break;
      case 'month':
        dateThreshold.setMonth(dateThreshold.getMonth() - 1);
        break;
      default:
        dateThreshold.setDate(dateThreshold.getDate() - 7);
    }

    const trending = await Hashtag.find({
      last_used: { $gte: dateThreshold }
    })
    .sort({ trending_score: -1, count: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      hashtags: trending
    });
  } catch (error) {
    console.error('Get trending hashtags error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get posts by hashtag
export const getPostsByHashtag = async (req, res) => {
  try {
    const { tag } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await Post.find({
      hashtags: tag.toLowerCase()
    })
    .populate('user', 'full_name username profile_picture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Post.countDocuments({ hashtags: tag.toLowerCase() });

    res.json({
      success: true,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get posts by hashtag error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get trending posts (most engaged in last 24 hours)
export const getTrendingPosts = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const userId = req.userId;
    
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const posts = await Post.find({
      createdAt: { $gte: last24Hours }
    })
    .populate('user', 'full_name username profile_picture')
    .sort({ 
      unique_viewers: -1,
      comments_count: -1,
      'likes_count.length': -1
    })
    .limit(parseInt(limit));

    // Add user reaction info
    const postsWithReactions = posts.map(post => {
      const userReaction = post.reactions?.find(r => r.user === userId);
      return {
        ...post.toObject(),
        user_reaction: userReaction?.type || null
      };
    });

    res.json({
      success: true,
      posts: postsWithReactions
    });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update hashtag trending score (called periodically or on engagement)
export const updateHashtagScore = async (tag) => {
  try {
    const hashtag = await Hashtag.findOne({ tag: tag.toLowerCase() });
    if (!hashtag) return;

    // Calculate score based on recency and engagement
    const hoursSinceLastUse = (Date.now() - hashtag.last_used) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 100 - hoursSinceLastUse);
    const engagementScore = hashtag.count * 10;
    
    hashtag.trending_score = recencyScore + engagementScore;
    await hashtag.save();
  } catch (error) {
    console.error('Update hashtag score error:', error);
  }
};

// Search hashtags
export const searchHashtags = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, hashtags: [] });
    }

    const hashtags = await Hashtag.find({
      tag: { $regex: `^${q.toLowerCase()}`, $options: 'i' }
    })
    .sort({ count: -1, trending_score: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      hashtags
    });
  } catch (error) {
    console.error('Search hashtags error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
