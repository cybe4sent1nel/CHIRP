import UserPreference from '../models/UserPreference.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

// Mark post as "Not Interested"
export const markNotInterested = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { post_id, reason } = req.body;

    if (!post_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Post ID is required' 
      });
    }

    // Check if post exists
    const post = await Post.findById(post_id);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    // Find or create user preference
    let preference = await UserPreference.findOne({ user_id: userId });
    
    if (!preference) {
      preference = new UserPreference({
        user_id: userId,
        not_interested_posts: [{
          post_id,
          reason: reason || 'not_interested'
        }]
      });
    } else {
      // Check if post already marked
      const alreadyMarked = preference.not_interested_posts.some(
        p => p.post_id.toString() === post_id.toString()
      );
      
      if (!alreadyMarked) {
        preference.not_interested_posts.push({
          post_id,
          reason: reason || 'not_interested'
        });
      }
    }

    await preference.save();

    res.json({
      success: true,
      message: 'Post marked as not interested. You will see less content like this.'
    });

  } catch (error) {
    console.error('Error marking post as not interested:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark post as not interested' 
    });
  }
};

// Hide user - block all content from this user
export const hideUser = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { user_to_hide } = req.body;

    if (!user_to_hide) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    // Can't hide yourself
    if (userId.toString() === user_to_hide.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot hide your own profile' 
      });
    }

    // Check if user exists
    const userToHide = await User.findById(user_to_hide);
    if (!userToHide) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Find or create user preference
    let preference = await UserPreference.findOne({ user_id: userId });
    
    if (!preference) {
      preference = new UserPreference({
        user_id: userId,
        hidden_users: [{
          user_id: user_to_hide
        }]
      });
    } else {
      // Check if user already hidden
      const alreadyHidden = preference.hidden_users.some(
        u => u.user_id.toString() === user_to_hide.toString()
      );
      
      if (alreadyHidden) {
        return res.json({
          success: true,
          message: 'User is already hidden'
        });
      }
      
      preference.hidden_users.push({
        user_id: user_to_hide
      });
    }

    await preference.save();

    res.json({
      success: true,
      message: `You will no longer see posts from @${userToHide.username}`
    });

  } catch (error) {
    console.error('Error hiding user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to hide user' 
    });
  }
};

// Unhide user
export const unhideUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { user_to_unhide } = req.body;

    if (!user_to_unhide) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const preference = await UserPreference.findOne({ user_id: userId });
    
    if (!preference) {
      return res.status(404).json({ 
        success: false, 
        message: 'No preferences found' 
      });
    }

    // Remove user from hidden list
    preference.hidden_users = preference.hidden_users.filter(
      u => u.user_id.toString() !== user_to_unhide.toString()
    );

    await preference.save();

    res.json({
      success: true,
      message: 'User unhidden successfully'
    });

  } catch (error) {
    console.error('Error unhiding user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to unhide user' 
    });
  }
};

// Get user preferences
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.userId;

    let preference = await UserPreference.findOne({ user_id: userId })
      .populate('hidden_users.user_id', 'username profile_picture clerk_user_id')
      .populate('not_interested_posts.post_id', 'caption');

    if (!preference) {
      preference = {
        hidden_users: [],
        not_interested_posts: [],
        not_interested_categories: [],
        show_sensitive_content: false
      };
    }

    res.json({
      success: true,
      data: preference
    });

  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch preferences' 
    });
  }
};

// Get hidden users list
export const getHiddenUsers = async (req, res) => {
  try {
    const userId = req.userId;

    const preference = await UserPreference.findOne({ user_id: userId })
      .populate('hidden_users.user_id', 'username profile_picture clerk_user_id');

    const hiddenUsers = preference?.hidden_users || [];

    res.json({
      success: true,
      data: hiddenUsers
    });

  } catch (error) {
    console.error('Error fetching hidden users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch hidden users' 
    });
  }
};

// Update content preference settings
export const updateContentPreferences = async (req, res) => {
  try {
    const userId = req.userId;
    const { show_sensitive_content } = req.body;

    let preference = await UserPreference.findOne({ user_id: userId });
    
    if (!preference) {
      preference = new UserPreference({ user_id: userId });
    }

    if (typeof show_sensitive_content === 'boolean') {
      preference.show_sensitive_content = show_sensitive_content;
    }

    await preference.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: preference
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update preferences' 
    });
  }
};

// Undo "Not Interested" on a post
export const undoNotInterested = async (req, res) => {
  try {
    const userId = req.userId;
    const { post_id } = req.body;

    if (!post_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Post ID is required' 
      });
    }

    const preference = await UserPreference.findOne({ user_id: userId });
    
    if (!preference) {
      return res.status(404).json({ 
        success: false, 
        message: 'No preferences found' 
      });
    }

    // Remove post from not interested list
    preference.not_interested_posts = preference.not_interested_posts.filter(
      p => p.post_id.toString() !== post_id.toString()
    );

    await preference.save();

    res.json({
      success: true,
      message: 'Preference removed'
    });

  } catch (error) {
    console.error('Error undoing not interested:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to undo preference' 
    });
  }
};
