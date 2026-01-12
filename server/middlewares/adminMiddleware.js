import Admin from '../models/Admin.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const adminProtect = async (req, res, next) => {
  try {
    console.log('[ADMIN MIDDLEWARE] Checking admin authorization');
    const authHeader = req.headers['authorization'];
    const adminIdHeader = req.headers['x-admin-id'];
    const adminEmailHeader = req.headers['x-admin-email'];

    let admin;
    let userId;
    let userEmail;

    // Priority 1: Try JWT token from Authorization header
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('[ADMIN MIDDLEWARE] Token found, attempting JWT verification');
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('[ADMIN MIDDLEWARE] JWT decoded:', decoded);
        
        // Token payload contains adminId
        if (decoded.adminId) {
          admin = await Admin.findById(decoded.adminId);
          console.log('[ADMIN MIDDLEWARE] Found admin by JWT adminId');
        } 
        // Token has userId (user token)
        else if (decoded.userId) {
          userId = decoded.userId;
          console.log('[ADMIN MIDDLEWARE] JWT contains userId:', userId);
        } 
        // Token has email
        else if (decoded.email) {
          userEmail = decoded.email;
          console.log('[ADMIN MIDDLEWARE] JWT contains email:', userEmail);
        } 
        // Clerk token might have sub (user ID)
        else if (decoded.sub) {
          console.log('[ADMIN MIDDLEWARE] Token appears to be Clerk token');
        }
      } catch (jwtError) {
        console.error('[ADMIN MIDDLEWARE] JWT verification failed:', jwtError.message);
      }
    }

    // Priority 2: Try x-admin-id header
    if (!admin && adminIdHeader) {
      console.log('[ADMIN MIDDLEWARE] Trying x-admin-id header');
      admin = await Admin.findById(adminIdHeader);
    }

    // Priority 3: Try x-admin-email header
    if (!admin && adminEmailHeader) {
      console.log('[ADMIN MIDDLEWARE] Trying x-admin-email header');
      admin = await Admin.findOne({ email: adminEmailHeader.toLowerCase(), is_active: true });
    }

    // Priority 4: If we have userId from token, check if user is admin
    if (!admin && userId) {
      console.log('[ADMIN MIDDLEWARE] Looking up user by userId:', userId);
      const user = await User.findById(userId);
      if (user && (user.isAdmin || user.role === 'admin' || user.role === 'super_admin')) {
        console.log('[ADMIN MIDDLEWARE] ✅ User found with admin role');
        admin = {
          _id: user._id,
          email: user.email,
          name: user.full_name,
          role: user.role || 'admin',
          permissions: {}
        };
      } else {
        console.log('[ADMIN MIDDLEWARE] User found but not admin:', user ? user.role : 'user not found');
      }
    }

    // Priority 5: If we have email from token, check if user is admin
    if (!admin && userEmail) {
      console.log('[ADMIN MIDDLEWARE] Looking up user by email from token:', userEmail);
      const user = await User.findOne({ email: userEmail.toLowerCase() });
      if (user && (user.isAdmin || user.role === 'admin' || user.role === 'super_admin')) {
        console.log('[ADMIN MIDDLEWARE] ✅ User found with admin role');
        admin = {
          _id: user._id,
          email: user.email,
          name: user.full_name,
          role: user.role || 'admin',
          permissions: {}
        };
      }
    }

    if (!admin) {
      console.log('[ADMIN MIDDLEWARE] ❌ No admin found');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin authentication required.'
      });
    }

    console.log('[ADMIN MIDDLEWARE] ✅ Admin authenticated:', admin.email || admin._id);

    // Attach admin to request
    req.admin = {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions || {}
    };

    next();
  } catch (error) {
    console.error('[ADMIN MIDDLEWARE] Error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication error'
    });
  }
};
