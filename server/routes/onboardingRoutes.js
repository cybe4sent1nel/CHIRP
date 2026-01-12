import express from 'express';
import {
    saveOnboardingData,
    checkOnboardingStatus,
    getPersonalizationData,
    updateOnboardingData,
    getAllPersonalizationStats
} from '../controllers/onboardingController.js';
import { protect } from '../middlewares/auth.js';
import { adminProtect } from '../middlewares/adminMiddleware.js';

const router = express.Router();

// User routes (protected)
router.post('/save', protect, saveOnboardingData);
router.get('/check-status', protect, checkOnboardingStatus);
router.get('/personalization', protect, getPersonalizationData);
router.put('/update', protect, updateOnboardingData);

// Admin routes
router.get('/stats', adminProtect, getAllPersonalizationStats);

export default router;
