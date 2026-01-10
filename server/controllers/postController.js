import fs from "fs";
import imageKit from "../configs/imageKit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Hashtag from "../models/Hashtag.js";
import { extractHashtags, extractMentions } from "../utils/textUtils.js";
import { getUserId } from "../middlewares/auth.js";

// Add Post
export const addPost = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { content, post_type } = req.body;
    const images = req.files || [];

    let image_urls = [];

    if (images.length > 0) {
      image_urls = await Promise.all(
        images.map(async (image) => {
          const fileBuffer = fs.createReadStream(image.path);
          const response = await imageKit.files.upload({
            file: fileBuffer,
            fileName: image.originalname,
          });

          const transformedUrl = imageKit.helper.buildSrc({
            src: response.url,
            transformation: [{ width: 1280, quality: "auto", format: "webp" }],
          });

          return transformedUrl;
        })
      );
    }

    // Extract hashtags and mentions
    const hashtags = extractHashtags(content);
    const mentions = extractMentions(content);

    // Create post
    const post = await Post.create({
      user: userId,
      content,
      image_urls,
      post_type,
      hashtags,
      mentions
    });

    // Update hashtag collection
    for (const tag of hashtags) {
      await Hashtag.findOneAndUpdate(
        { tag: tag.toLowerCase() },
        { 
          $inc: { count: 1 },
          $addToSet: { posts: post._id },
          $set: { last_used: new Date() }
        },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, message: "Post created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Posts
export const getFeedPost = async (req, res) => {
    try {
        const userId = getUserId(req)
        const user = await User.findById(userId)

        if (!user) {
          return res.status(404).json({success: false, message: "User not found"})
        }

        // User connections and followings
        const userIds = [userId, ...(user.connections || []), ...(user.following || [])]
        const posts = await Post.find({user: {$in: userIds}})
            .populate('user')
            .populate('likes_count', '_id full_name username profile_picture')
            .sort({createdAt: -1})
        
        // Add user reaction info to each post
        const postsWithReactions = posts.map(post => {
            const userReaction = post.reactions?.find(r => r.user === userId);
            return {
                ...post.toObject(),
                user_reaction: userReaction?.type || null
            };
        });
 
        res.json({success: true, posts: postsWithReactions})
    } catch (error) {
        console.log(error)
        res.status(500).json({success: false, message: error.message})
    }
}

// Like Post / Add Reaction
export const likePost = async (req, res) => {
    try {
        const userId = req.userId || req.auth()?.userId;
        const {postId, reactionType = 'LIKE'} = req.body

        if (!userId) {
            return res.status(401).json({success: false, message: 'User not authenticated'});
        }

        const post = await Post.findById(postId)
        
        if (!post) {
            return res.status(404).json({success: false, message: 'Post not found'});
        }

        // Initialize reactions array if it doesn't exist
        if (!post.reactions) {
            post.reactions = [];
        }

        // Check if user already reacted
        const existingReactionIndex = post.reactions.findIndex(r => r.user === userId);
        const likeIndex = post.likes_count.indexOf(userId);
        
        if (existingReactionIndex > -1) {
            // User already reacted
            const existingReaction = post.reactions[existingReactionIndex];
            
            if (existingReaction.type === reactionType) {
                // Same reaction - remove it (unlike)
                post.reactions.splice(existingReactionIndex, 1);
                if (likeIndex > -1) {
                    post.likes_count.splice(likeIndex, 1);
                }
                await post.save();
                
                const populatedPost = await Post.findById(postId).populate('likes_count', '_id full_name username profile_picture');
                
                return res.json({
                    success: true, 
                    message: 'Reaction removed',
                    likes: populatedPost.likes_count,
                    userReaction: null
                });
            } else {
                // Different reaction - update it
                post.reactions[existingReactionIndex].type = reactionType;
                post.reactions[existingReactionIndex].createdAt = new Date();
                await post.save();
                
                const populatedPost = await Post.findById(postId).populate('likes_count', '_id full_name username profile_picture');
                
                return res.json({
                    success: true, 
                    message: 'Reaction updated',
                    likes: populatedPost.likes_count,
                    userReaction: reactionType
                });
            }
        } else {
            // New reaction - add it
            post.reactions.push({
                user: userId,
                type: reactionType,
                createdAt: new Date()
            });
            
            // Add to likes_count if not already there
            if (likeIndex === -1) {
                post.likes_count.push(userId);
            }
            
            await post.save();
            
            const populatedPost = await Post.findById(postId).populate('likes_count', '_id full_name username profile_picture');
            
            return res.json({
                success: true, 
                message: 'Reaction added',
                likes: populatedPost.likes_count,
                userReaction: reactionType
            });
        }
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({success: false, message: error.message});
    }
}

// Check repost status
export const checkRepostStatus = async (req, res) => {
    try {
        const userId = req.userId || req.auth()?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({success: false, message: 'User not authenticated'});
        }

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({success: false, message: 'Post not found'});
        }

        const hasReposted = post.reposts?.includes(userId) || false;
        
        res.json({
            success: true,
            hasReposted,
            repostCount: post.reposts?.length || 0
        });
    } catch (error) {
        console.error('Check repost status error:', error);
        res.status(500).json({success: false, message: error.message});
    }
}

// Toggle repost
export const toggleRepost = async (req, res) => {
    try {
        const userId = req.userId || req.auth()?.userId;
        const { postId } = req.body;

        if (!userId) {
            return res.status(401).json({success: false, message: 'User not authenticated'});
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({success: false, message: 'Post not found'});
        }

        // Initialize reposts array if it doesn't exist
        if (!post.reposts) {
            post.reposts = [];
        }

        const repostIndex = post.reposts.indexOf(userId);
        let message;

        if (repostIndex > -1) {
            // Remove repost
            post.reposts.splice(repostIndex, 1);
            message = 'Post unreposted';
        } else {
            // Add repost
            post.reposts.push(userId);
            message = 'Post reposted';
        }

        await post.save();

        res.json({
            success: true,
            message,
            hasReposted: repostIndex === -1,
            reposts: post.reposts,
            repostCount: post.reposts.length
        });
    } catch (error) {
        console.error('Toggle repost error:', error);
        res.status(500).json({success: false, message: error.message});
    }
}

// Increment share count
export const sharePost = async (req, res) => {
    try {
        const { postId } = req.body;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({success: false, message: 'Post not found'});
        }

        post.shares_count = (post.shares_count || 0) + 1;
        await post.save();

        res.json({
            success: true,
            message: 'Share count updated',
            shares: post.shares_count
        });
    } catch (error) {
        console.error('Share post error:', error);
        res.status(500).json({success: false, message: error.message});
    }
}

// Update post
export const updatePost = async (req, res) => {
    try {
        const userId = req.userId || req.auth()?.userId;
        const { postId, content } = req.body;

        if (!userId) {
            return res.status(401).json({success: false, message: 'User not authenticated'});
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({success: false, message: 'Post not found'});
        }

        // Check ownership
        if (post.user.toString() !== userId) {
            return res.status(403).json({success: false, message: 'Not authorized to update this post'});
        }

        if (content) {
            post.content = content.trim();
        }

        await post.save();

        res.json({
            success: true,
            message: 'Post updated',
            post
        });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({success: false, message: error.message});
    }
}

// Delete post
export const deletePost = async (req, res) => {
    try {
        const userId = req.userId || req.auth()?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({success: false, message: 'User not authenticated'});
        }

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({success: false, message: 'Post not found'});
        }

        // Check ownership
        if (post.user.toString() !== userId) {
            return res.status(403).json({success: false, message: 'Not authorized to delete this post'});
        }

        await post.deleteOne();

        res.json({
            success: true,
            message: 'Post deleted'
        });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({success: false, message: error.message});
    }
}

// Track Post View
export const trackPostView = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId } = req.params;
        const { referrer } = req.body;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Don't track views for own posts
        if (post.user.toString() === userId) {
            return res.json({ success: true, message: 'Own post view not tracked' });
        }

        // Detect device type from user-agent
        const userAgent = req.headers['user-agent'] || '';
        let deviceType = 'Unknown';
        if (/mobile/i.test(userAgent)) {
            deviceType = 'Mobile';
        } else if (/tablet|ipad/i.test(userAgent)) {
            deviceType = 'Tablet';
        } else if (/desktop|windows|macintosh|linux/i.test(userAgent)) {
            deviceType = 'Desktop';
        }

        // Check if user viewed within last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentView = post.views?.find(
            view => view.viewer === userId && new Date(view.viewedAt) > twentyFourHoursAgo
        );

        if (!recentView) {
            // Add new view
            post.views = post.views || [];
            post.views.push({ 
                viewer: userId, 
                viewedAt: new Date(),
                deviceType,
                referrer: referrer || 'direct'
            });
            
            // Increment unique viewers count
            post.unique_viewers = (post.unique_viewers || 0) + 1;
            
            await post.save();
        }

        res.json({ success: true, uniqueViewers: post.unique_viewers });
    } catch (error) {
        console.error('Track post view error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Track Profile Click from Post
export const trackProfileClick = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId } = req.params;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Add profile click tracking
        post.profile_clicks = post.profile_clicks || [];
        post.profile_clicks.push({ viewer: userId, clickedAt: new Date() });
        
        await post.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Track profile click error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}