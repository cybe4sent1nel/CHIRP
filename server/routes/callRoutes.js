import express from 'express';
const router = express.Router();
import { verifyToken } from '../controllers/authController.js';
import {
  initiateCall,
  acceptCall,
  sendAnswer,
  sendICECandidate,
  endCall,
  getCallHistory
} from '../controllers/callController.js';

// All routes require authentication
router.use(verifyToken);

// Call routes
router.post('/initiate', initiateCall);
router.post('/accept', acceptCall);
router.post('/answer', sendAnswer);
router.post('/ice-candidate', sendICECandidate);
router.post('/end', endCall);
router.get('/history', getCallHistory);

export default router;
