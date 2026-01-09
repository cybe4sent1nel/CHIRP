import express from 'express';
const router = express.Router();
import * as preferenceController from '../controllers/userPreferenceController.js';
import { protect } from '../middlewares/auth.js';

// All routes require authentication
router.post('/not-interested', protect, preferenceController.markNotInterested);
router.post('/not-interested/undo', protect, preferenceController.undoNotInterested);
router.post('/hide-user', protect, preferenceController.hideUser);
router.post('/unhide-user', protect, preferenceController.unhideUser);
router.get('/hidden-users', protect, preferenceController.getHiddenUsers);
router.get('/', protect, preferenceController.getUserPreferences);
router.patch('/content-settings', protect, preferenceController.updateContentPreferences);

export default router;
