/**
 * CORS Configuration
 * Centralized origin management for CORS and SSE
 */

export const getCorsOrigins = () => {
  // Get from env or use sensible defaults
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS;
  
  if (envOrigins) {
    // Split comma-separated origins
    return envOrigins.split(',').map(origin => origin.trim());
  }
  
  // Default origins based on environment
  const defaults = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173'
  ];
  
  // Add frontend URL from env if available
  if (process.env.FRONTEND_URL) {
    defaults.push(process.env.FRONTEND_URL);
  }
  
  // Add production domain if in production
  if (process.env.NODE_ENV === 'production' && process.env.PRODUCTION_URL) {
    defaults.push(process.env.PRODUCTION_URL);
  }
  
  return defaults;
};

/**
 * Check if an origin is allowed
 */
export const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow if no origin header
  
  const allowedOrigins = getCorsOrigins();
  return allowedOrigins.includes(origin);
};

/**
 * Get CORS origin header value
 * Returns specific origin if allowed, or '*' as fallback
 */
export const getCorsOriginHeader = (requestOrigin) => {
  if (isOriginAllowed(requestOrigin)) {
    return requestOrigin || '*';
  }
  return '*';
};
