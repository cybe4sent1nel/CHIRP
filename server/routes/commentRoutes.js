import express from 'express';
const router = express.Router();
import { protect } from '../middlewares/auth.js';
import {
  getPostComments,
  addComment,
  updateComment,
  deleteComment,
  reactToComment,
  replyToComment
} from '../controllers/commentController.js';

// All routes require authentication
router.use(protect);

// Comment routes
router.get('/post/:postId', getPostComments);
router.post('/add', addComment);
router.put('/update', updateComment);
router.delete('/delete/:id', deleteComment);
router.post('/react', reactToComment);
router.post('/reply', replyToComment);

export default router;
