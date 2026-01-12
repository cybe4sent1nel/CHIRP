import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_BASEURL || 'http://localhost:4000/api',
    timeout: 30000 // 30 second timeout for all requests
})

// Add request interceptor to attach custom auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('customAuthToken');
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