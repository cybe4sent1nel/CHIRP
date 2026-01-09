import express from 'express';
const router = express.Router();
import * as onboardingController from '../controllers/onboardingController.js';
import { protect } from '../middlewares/auth.js';

// Onboarding routes (protected)
router.post('/onboarding/submit', protect, onboardingController.submitOnboarding);
router.get('/onboarding/status', protect, onboardingController.getOnboardingResponse);

// Feedback routes (protected)
router.post('/feedback/submit', protect, onboardingController.submitFeedback);

export default router;
