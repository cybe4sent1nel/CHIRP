import express from 'express';
const router = express.Router();
import { protect } from '../middlewares/auth.js';
import {
  initiateCall,
  acceptCall,
  rejectCall,
  sendAnswer,
  sendICECandidate,
  updateCallFeatures,
  endCall,
  getCallHistory,
  getCallStats,
  deleteCallHistory
} from '../controllers/callControllerV2.js';

// All routes require authentication
router.use(protect);

// Call management routes
router.post('/initiate', initiateCall);
router.post('/accept', acceptCall);
router.post('/reject', rejectCall);
router.post('/answer', sendAnswer);
router.post('/ice-candidate', sendICECandidate);
router.post('/update-features', updateCallFeatures);
router.post('/end', endCall);

// Call history and stats routes
router.get('/history', getCallHistory);
router.get('/stats', getCallStats);
router.delete('/history', deleteCallHistory);

export default router;
