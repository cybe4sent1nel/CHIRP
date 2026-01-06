import express from 'express';
import { requireAuth } from '@clerk/express';
import {
  getPlayerStats,
  getLeaderboard,
  createSketchRoom,
  joinSketchRoom,
  getRoomDetails,
  updatePlayerStats
} from '../controllers/gameController.js';

const router = express.Router();

// Stats and leaderboard routes
router.get('/stats', requireAuth(), getPlayerStats);
router.get('/leaderboard', requireAuth(), getLeaderboard);
router.post('/update-stats', requireAuth(), updatePlayerStats);

// ChirpSketch game routes
router.post('/sketch/create-room', requireAuth(), createSketchRoom);
router.post('/sketch/join-room/:roomId', requireAuth(), joinSketchRoom);
router.get('/sketch/room/:roomId', requireAuth(), getRoomDetails);

export default router;
