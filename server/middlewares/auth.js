import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const protect = (req, res, next) => {
    try {
        console.log('[AUTH] Checking authentication...');
        
        // First try Clerk authentication
        try {
            const clerkAuth = req.auth();
            if (clerkAuth?.userId) {
                console.log('[AUTH] Clerk auth successful, userId:', clerkAuth.userId);
                req.userId = clerkAuth.userId;
                return next();
            }
        } catch (clerkError) {
            console.log('[AUTH] Clerk auth failed, trying JWT...');
        }

        // Fall back to custom JWT token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('[AUTH] No authorization header found');
            return res.status(401).json({success: false, message: "Not authorized - missing token"})
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix
        console.log('[AUTH] Attempting to verify JWT token...');
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (!decoded._id && !decoded.userId) {
            console.error('[AUTH] Token has no user ID');
            return res.status(401).json({success: false, message: "Invalid token - no user ID"})
        }

        // Set userId on req for easy access in controllers
        req.userId = decoded._id || decoded.userId;
        console.log('[AUTH] JWT verified, userId:', req.userId);
        next();
    } catch (error) {
        console.error('[AUTH] Authentication error:', error.message);
        return res.status(401).json({success: false, message: "Not authorized - " + error.message})
    }
}

// Helper function to get userId from request (works for both Clerk and custom JWT)
export const getUserId = (req) => {
    return req.userId || req.auth()?.userId;
}