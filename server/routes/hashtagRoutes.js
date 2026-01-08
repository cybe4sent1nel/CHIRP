import express from 'express';
const router = express.Router();
import { protect } from '../middlewares/auth.js';
import {
  getTrendingHashtags,
  getPostsByHashtag,
  getTrendingPosts,
  searchHashtags
} from '../controllers/hashtagController.js';

// All routes require authentication
router.use(protect);

// Get trending hashtags
router.get('/trending', getTrendingHashtags);

// Search hashtags
router.get('/search', searchHashtags);

// Get posts by hashtag
router.get('/:tag/posts', getPostsByHashtag);

// Get trending posts
router.get('/posts/trending', getTrendingPosts);

export default router;
