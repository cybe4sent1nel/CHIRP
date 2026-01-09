import Report from '../models/Report.js';
import Post from '../models/Post.js';
import User from '../models/User.js';

// Create a new report
export const createReport = async (req, res) => {
  try {
    const { reported_item_type, reported_item_id, reason, description } = req.body;
    const reported_by = req.user.userId;

    // Validate required fields
    if (!reported_item_type || !reported_item_id || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Check if user already reported this item
    const existingReport = await Report.findOne({
      reported_by,
      reported_item_id,
      reported_item_type
    });

    if (existingReport) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reported this content' 
      });
    }

    // Create report
    const report = new Report({
      reported_by,
      reported_item_type,
      reported_item_id,
      reason,
      description: description || ''
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. We will review it soon.',
      data: report
    });

  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit report' 
    });
  }
};

// Get user's reports
export const getUserReports = async (req, res) => {
  try {
    const user_id = req.user.userId;
    
    const reports = await Report.find({ reported_by: user_id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: reports
    });

  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reports' 
    });
  }
};

// Check if user has reported an item
export const checkReportStatus = async (req, res) => {
  try {
    const { item_type, item_id } = req.params;
    const user_id = req.user.userId;

    const report = await Report.findOne({
      reported_by: user_id,
      reported_item_type: item_type,
      reported_item_id: item_id
    });

    res.json({
      success: true,
      has_reported: !!report,
      report: report || null
    });

  } catch (error) {
    console.error('Error checking report status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check report status' 
    });
  }
};
