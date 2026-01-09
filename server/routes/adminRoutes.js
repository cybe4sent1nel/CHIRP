import express from 'express';
const router = express.Router();
import * as adminController from '../controllers/adminController.js';
import { adminProtect } from '../middlewares/adminMiddleware.js';

// Public routes (no auth needed)
router.post('/login/initiate', adminController.initiateAdminLogin);
router.post('/login/verify', adminController.verifyAdminOTP);

// Protected admin routes
router.post('/create', adminProtect, adminController.createAdmin);
router.get('/reports', adminProtect, adminController.getAllReports);
router.patch('/reports/:reportId', adminProtect, adminController.updateReport);
router.get('/onboarding-responses', adminProtect, adminController.getOnboardingResponses);
router.get('/feedback', adminProtect, adminController.getAllFeedback);
router.get('/dashboard/stats', adminProtect, adminController.getDashboardStats);

// Admin management routes
router.get('/list', adminProtect, adminController.getAllAdmins);
router.patch('/:adminId', adminProtect, adminController.updateAdmin);
router.delete('/:adminId', adminProtect, adminController.deleteAdmin);

export default router;
