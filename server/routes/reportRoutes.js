import express from 'express';
const router = express.Router();
import * as reportController from '../controllers/reportController.js';
import { protect } from '../middlewares/auth.js';

// User routes (protected)
router.post('/create', protect, reportController.createReport);
router.get('/my-reports', protect, reportController.getUserReports);
router.get('/check/:item_type/:item_id', protect, reportController.checkReportStatus);

export default router;
