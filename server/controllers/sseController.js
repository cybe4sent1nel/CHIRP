/**
 * SSE Controller
 * Handles Server-Sent Events connections with both Clerk and custom JWT auth
 */

import { initializeSSEConnection, sseManager } from '../services/sseService.js';
import { isOriginAllowed, getCorsOriginHeader } from '../configs/cors.js';

/**
 * Establish SSE connection for real-time messaging
 * Supports both Clerk and custom JWT authentication
 */
export const handleSSEConnection = async (req, res) => {
    const { userId } = req.params;

    try {
        console.log(`[SSE-CTRL] SSE connection request from user: ${userId}`);

        // Validate userId format (Clerk: user_xxx, MongoDB: 24-hex chars)
        const isClerkUserId = userId.startsWith('user_');
        const isMongoDbId = /^[a-f0-9]{24}$/.test(userId);

        if (!isClerkUserId && !isMongoDbId) {
            console.error(`[SSE-CTRL] Invalid userId format: ${userId}`);
            if (!res.headersSent) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format'
                });
            }
            return res.end();
        }

        console.log(`[SSE-CTRL] Valid userId (${isClerkUserId ? 'Clerk' : 'MongoDB'}): ${userId}`);

        // Check if response is valid before initializing
        if (!res || !res.writable) {
            console.error(`[SSE-CTRL] Response object is not writable for user ${userId}`);
            return;
        }

        // Initialize SSE connection
        await initializeSSEConnection(userId, res, req);

    } catch (error) {
        console.error(`[SSE-CTRL] Error handling SSE connection for ${userId}:`, error.message);
        console.error('[SSE-CTRL] Stack:', error.stack);

        // Only send error response if headers not already sent
        if (!res.headersSent && res.writable) {
            return res.status(503).json({
                success: false,
                message: 'SSE Service Unavailable',
                error: error.message
            });
        } else {
            // Headers already sent or connection not writable, just end the connection
            if (res.writable) {
                res.end();
            }
        }
    }
};

/**
 * Handle OPTIONS preflight requests for SSE
 */
export const handleSSEOptions = (req, res) => {
    const { userId } = req.params;

    try {
        const isClerkUserId = userId.startsWith('user_');
        const isMongoDbId = /^[a-f0-9]{24}$/.test(userId);

        if (!isClerkUserId && !isMongoDbId) {
            // Not an SSE request, pass to next handler
            return false;
        }

        console.log(`[SSE-CTRL] OPTIONS preflight for user: ${userId}`);
        console.log(`[SSE-CTRL] Origin header: ${req.headers.origin}`);
        
        // Get the requesting origin
        const origin = req.headers.origin;
        const allowed = isOriginAllowed(origin);
        
        console.log(`[SSE-CTRL] Requested origin: ${origin}, allowed: ${allowed}`);
        
        // CORS headers for preflight
        const corsOrigin = getCorsOriginHeader(origin);
        res.setHeader('Access-Control-Allow-Origin', corsOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '3600');
        
        console.log(`[SSE-CTRL] Sending 200 OK for preflight with CORS origin: ${corsOrigin}`);
        res.status(200).end();

        return true;
    } catch (error) {
        console.error('[SSE-CTRL] Error in OPTIONS handler:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
};

/**
 * Get SSE connection statistics (for debugging/monitoring)
 */
export const getSSEStats = (req, res) => {
    try {
        const stats = sseManager.getStats();
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('[SSE-CTRL] Error getting SSE stats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
