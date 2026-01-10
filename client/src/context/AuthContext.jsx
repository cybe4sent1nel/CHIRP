import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useUser } from '@clerk/clerk-react';

const AuthContext = createContext(null);

export const useCustomAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useCustomAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { user: clerkUser } = useUser(); // Clerk user
  const [customUser, setCustomUser] = useState(null); // Custom auth user
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('customAuthToken'));

  // Check if user is authenticated via custom auth
  useEffect(() => {
    const loadAuth = () => {
      const storedToken = localStorage.getItem('customAuthToken');
      const storedUser = localStorage.getItem('customUser');
      
      console.log('AuthContext loading:', { hasToken: !!storedToken, hasUser: !!storedUser });
      
      if (storedToken && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          console.log('User loaded from localStorage:', user.email);
          setCustomUser(user);
          setToken(storedToken);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('customAuthToken');
          localStorage.removeItem('customUser');
        }
      }
      
      setLoading(false);
    };

    loadAuth();
    
    // Listen for storage changes (e.g., from OAuth callback or other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'customAuthToken' || e.key === 'customUser') {
        console.log('Storage change detected, reloading auth state');
        loadAuth();
      }
    };
    
    // Also listen for custom auth events in the same tab
    const handleAuthUpdate = () => {
      console.log('Custom auth update event received');
      loadAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('customAuthUpdate', handleAuthUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customAuthUpdate', handleAuthUpdate);
    };
  }, []);

  // Login with custom auth
  const customLogin = async (identifier, password) => {
    try {
      const endpoint = '/api/auth/login';
      console.log('customLogin: POST', endpoint, { identifier });
      console.log('Using API URL:', import.meta.env.VITE_BASEURL || 'http://localhost:4000');
      
      const response = await api.post(endpoint, {
        identifier,
        password
      });

      console.log('customLogin: Success response:', response.data);
      
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('customAuthToken', token);
        localStorage.setItem('customUser', JSON.stringify(user));
        setToken(token);
        setCustomUser(user);
        return { success: true, user };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        baseURL: error.config?.baseURL,
        url: error.config?.url
      });
      const errorData = error.response?.data;
      
      // Handle timeout error specifically
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return {
          success: false,
          message: 'Request timeout. Please check your internet connection and try again.',
          shouldSignup: false
        };
      }
      
      return {
        success: false,
        message: errorData?.message || 'Login failed. Please try again.',
        shouldSignup: errorData?.shouldSignup || false
      };
    }
  };

  // Signup with custom auth
  const customSignup = async (email, password, full_name, username) => {
    try {
      const endpoint = '/api/auth/signup';
      console.log('customSignup: POST', endpoint, { email, full_name, username });
      console.log('Using API URL:', import.meta.env.VITE_BASEURL || 'http://localhost:4000');
      
      const response = await api.post(endpoint, {
        email,
        password,
        full_name,
        username
      });

      console.log('customSignup: Success response:', response.data);

      if (response.data.success) {
        const { message, token, user } = response.data;
        // Store token/user even for unverified (from signup response)
        if (token && user) {
          localStorage.setItem('customAuthToken', token);
          localStorage.setItem('customUser', JSON.stringify(user));
        }
        return { 
          success: true, 
          message: message || 'Account created! Please check your email to verify.',
          token: response.data.token,
          user: response.data.user
        };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Signup error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        baseURL: error.config?.baseURL,
        url: error.config?.url
      });
      const errorData = error.response?.data;
      
      // Handle timeout error specifically
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return {
          success: false,
          message: 'Request timeout. Please check your internet connection and try again.',
          field: null
        };
      }
      
      return {
        success: false,
        message: errorData?.message || 'Signup failed. Please try again.',
        field: errorData?.field
      };
    }
  };

  // Logout from custom auth
  const customLogout = () => {
    localStorage.removeItem('customAuthToken');
    localStorage.removeItem('customUser');
    setToken(null);
    setCustomUser(null);
    window.location.href = '/welcome';
  };

  // Get current authenticated user (priority: Clerk > Custom Auth)
  const getCurrentUser = () => {
    if (clerkUser) {
      return {
        user: clerkUser,
        authType: 'clerk'
      };
    }
    
    if (customUser) {
      return {
        user: customUser,
        authType: 'custom'
      };
    }
    
    return null;
  };

  // Check if user is authenticated (either Clerk or custom)
  const isAuthenticated = !!(clerkUser || customUser);
  
  console.log('AuthContext state:', { 
    clerkUser: clerkUser ? 'Yes' : 'No', 
    customUser: customUser ? 'Yes' : 'No', 
    isAuthenticated: isAuthenticated ? 'TRUE' : 'FALSE',
    customUserEmail: customUser?.email || 'none',
    loading: loading ? 'Yes' : 'No'
  });

  const value = {
    // User info
    customUser,
    clerkUser,
    currentUser: getCurrentUser(),
    
    // Auth status
    isAuthenticated,
    loading,
    token,
    
    // Auth methods
    customLogin,
    customSignup,
    customLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
