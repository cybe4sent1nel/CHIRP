import Admin from '../models/Admin.js';

export const adminProtect = async (req, res, next) => {
  try {
    // In a real app, you would verify a JWT token here
    // For now, we'll check session or authorization header
    const adminId = req.headers['x-admin-id'];
    const adminEmail = req.headers['x-admin-email'];

    if (!adminId && !adminEmail) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin authentication required.'
      });
    }

    let admin;
    if (adminId) {
      admin = await Admin.findById(adminId);
    } else if (adminEmail) {
      admin = await Admin.findOne({ email: adminEmail.toLowerCase(), is_active: true });
    }

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. Invalid admin credentials.'
      });
    }

    // Attach admin to request
    req.admin = {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions
    };

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};
