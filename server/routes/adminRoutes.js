import express from 'express';
const router = express.Router();
import * as adminController from '../controllers/adminController.js';
import { adminProtect } from '../middlewares/adminMiddleware.js';

// Public routes (no auth needed)
router.get('/emails', adminController.getAdminEmails);
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

// User management routes
router.get('/users', adminProtect, adminController.getAllUsers);
router.get('/user-stats', adminProtect, adminController.getUserStats);
router.post('/user/:userId/ban', adminProtect, adminController.banUser);
router.post('/user/:userId/unban', adminProtect, adminController.unbanUser);
router.delete('/user/:userId', adminProtect, adminController.deleteUserByAdmin);

// Metrics routes
router.get('/metrics', adminProtect, adminController.getMetrics);

// Maintenance routes
router.get('/maintenance', adminProtect, adminController.getMaintenanceStatus);
router.post('/maintenance/toggle', adminProtect, adminController.toggleMaintenance);
router.post('/maintenance/update', adminProtect, adminController.updateMaintenanceSettings);

// Ads routes
router.get('/ads', adminProtect, adminController.getAllAds);
router.post('/ads', adminProtect, adminController.createAd);
router.put('/ads/:adId', adminProtect, adminController.updateAd);
router.delete('/ads/:adId', adminProtect, adminController.deleteAd);

// Animations routes
router.get('/animations', adminProtect, adminController.getAnimations);
router.post('/animations/upload', adminProtect, adminController.uploadAnimation);
router.delete('/animations/:type', adminProtect, adminController.deleteAnimation);

export default router;
