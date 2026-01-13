import express from 'express';
const router = express.Router();
import { protect } from '../middlewares/auth.js';
import { createShortLink, redirectShortLink } from '../controllers/shortLinkController.js';

// Create shortlink (authenticated optional)
router.post('/', protect, createShortLink);

// Public redirect
router.get('/r/:code', redirectShortLink);

export default router;
