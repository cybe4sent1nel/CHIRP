import axios from 'axios'

const api = axios.create({
  // Keep baseURL free of the trailing /api so callers can consistently use 
  // `/api/...` in paths or build absolute URLs when needed.
  // Default to a relative base so the Vite dev-server proxy ("/api") is used
  // during local development. If an explicit backend URL is provided via
  // `VITE_API_URL` or `VITE_BASEURL`, it will still be respected.
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_BASEURL || '',
  timeout: 30000 // 30 second timeout for all requests
})

// Add request interceptor to attach custom auth token
api.interceptors.request.use(
  (config) => {
    // #region telemetry log
    // Build full URL for diagnostics (best-effort)
    const fullUrl = config.baseURL && config.url ? (config.baseURL.endsWith('/') && config.url.startsWith('/') ? config.baseURL + config.url.slice(1) : config.baseURL + config.url) : config.url;
    const logData = {
      location: 'axios.js:10',
      message: 'Axios request interceptor',
      data: {
        url: config.url,
        baseURL: config.baseURL,
        fullUrl: fullUrl,
        method: config.method,
        hasApiInUrl: fullUrl?.includes('/api/'),
        hasApiInPath: config.url?.includes('/api/')
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'E'
    };

    // Telemetry can be toggled with VITE_ENABLE_TELEMETRY (set to 'true') and
    // configured with VITE_TELEMETRY_URL. Use navigator.sendBeacon when
    // available to avoid noisy errors in the main thread.
    try {
      const TELEMETRY_ENABLED = import.meta.env.VITE_ENABLE_TELEMETRY === 'true';
      const TELEMETRY_URL = import.meta.env.VITE_TELEMETRY_URL || 'http://127.0.0.1:7242/ingest/79aba9ce-0b46-410a-92a7-0fb415bdeb3a';
      if (TELEMETRY_ENABLED) {
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
          const blob = new Blob([JSON.stringify(logData)], { type: 'application/json' });
          try { navigator.sendBeacon(TELEMETRY_URL, blob); } catch(e) { /* swallow telemetry errors */ }
        } else {
          // Fallback to fetch but swallow any errors
          fetch(TELEMETRY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(logData) }).catch(() => {});
        }
      }
    } catch (e) {
      // Never fail the request because telemetry threw
    }
    // #endregion
    const token = localStorage.getItem('customAuthToken');
    // DEV guard: avoid double "/api" when both baseURL and url include it
    try {
      if (config.baseURL && typeof config.url === 'string') {
        if (config.baseURL.includes('/api') && config.url.startsWith('/api')) {
          config.url = config.url.replace(/^\/api/, '');
        }
      }
    } catch (e) {}
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    console.log('[API] ✅ Success:', {
      status: response.status,
      url: response.config?.url,
      method: response.config?.method
    });
    return response;
  },
  (error) => {
    // Attach a user-friendly message by default for network failures
    try { error.userFriendlyMessage = error.userFriendlyMessage || 'Network error — please check your connection and try again.' } catch(e){}

    if (error.response) {
      // Log diagnostic info for debugging server errors
      try {
        console.error('[API] ❌ Error response:', {
          status: error.response.status,
          url: error.config?.url,
          method: error.config?.method,
          data: error.response.data,
          headers: error.response.headers
        });
      } catch (e) {
        console.error('[API] Failed to log error response', e);
      }

      // Handle specific HTTP status codes
      // Don't intercept 403 or 500 for admin routes - let Refine handle it
      const isAdminPath = window.location.pathname.includes('/admin');
      console.log('[API] Checking path for auto-redirect:', {
        currentPath: window.location.pathname,
        isAdminPath: isAdminPath,
        statusCode: error.response.status
      });
      
      // TEMPORARY: Disable auto-redirect for debugging
      if (error.response.status === 403 && !isAdminPath && window.location.pathname !== '/admin/login') {
        console.log('[API] 🚫 403 Forbidden - redirecting to /error/403');
        // window.location.href = '/error/403';
      } else if ((error.response.status === 500 || error.response.status === 502 || error.response.status === 503) && !isAdminPath && !window.location.pathname.includes('/admin')) {
        console.log('[API] 🔥 Server error (' + error.response.status + ') - REDIRECT DISABLED FOR DEBUG');
        // window.location.href = '/error/500';
      } else if ((error.response.status === 500 || error.response.status === 502 || error.response.status === 503) && isAdminPath) {
        console.log('[API] 🔥 Server error on admin path - NOT auto-redirecting, letting app handle it');
      } else if (error.response.status === 408) {
        // Timeout error - handled by TimeoutError component
        console.error('[API] ⏱️ Request timeout');
      }
    } else if (error.request) {
      // Network error (no response). Implement a small retry/backoff strategy.
      const config = error.config || {};
      // Default retry settings (can be overridden per-request)
      config.__retryCount = config.__retryCount || 0;
      const maxRetries = typeof config.__maxRetries === 'number' ? config.__maxRetries : 2;
      const baseDelay = typeof config.__retryDelay === 'number' ? config.__retryDelay : 300; // ms

      // Only attempt retries for network errors (no response) and when under retry limit
      if (config.__retryCount < maxRetries) {
        config.__retryCount += 1;
        const delay = baseDelay * Math.pow(2, config.__retryCount - 1);
        console.warn(`[API] ⚡ Network error for ${config.url} — retry ${config.__retryCount}/${maxRetries} in ${delay}ms`);
        return new Promise((resolve) => setTimeout(() => resolve(api.request(config)), delay));
      }

      console.error('[API] ❌ No response received:', {
        message: error.message,
        url: error.config?.url,
        method: error.config?.method
      });
    } else {
      console.error('[API] ❌ Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;