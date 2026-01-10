import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_BASEURL
})

// Add response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Log diagnostic info for debugging server errors
      try {
        console.error('[API] Error response:', {
          status: error.response.status,
          url: error.config?.url,
          method: error.config?.method,
          data: error.response.data
        });
      } catch (e) {
        console.error('[API] Failed to log error response', e);
      }

      // Handle specific HTTP status codes
      // Don't intercept 403 for admin routes - let Refine handle it
      if (error.response.status === 403 && !window.location.pathname.startsWith('/admin')) {
        window.location.href = '/error/403';
      } else if (error.response.status === 500 || error.response.status === 502 || error.response.status === 503) {
        window.location.href = '/error/500';
      } else if (error.response.status === 408) {
        // Timeout error - handled by TimeoutError component
        console.error('Request timeout');
      }
    }
    return Promise.reject(error);
  }
);

export default api;