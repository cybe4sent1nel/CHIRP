import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
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
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('customAuthToken');
      
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const baseUrl = import.meta.env.VITE_BASEURL || 'http://localhost:4000';
        const response = await axios.get(`${baseUrl}/api/auth/verify-token`, {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });

        if (response.data.success) {
          setCustomUser(response.data.user);
          setToken(storedToken);
        } else {
          // Token invalid, clear it
          localStorage.removeItem('customAuthToken');
          localStorage.removeItem('customUser');
          setToken(null);
          setCustomUser(null);
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('customAuthToken');
        localStorage.removeItem('customUser');
        setToken(null);
        setCustomUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Login with custom auth
  const customLogin = async (identifier, password) => {
    try {
      const baseUrl = import.meta.env.VITE_BASEURL || 'http://localhost:4000';
      const response = await axios.post(`${baseUrl}/api/auth/login`, {
        identifier,
        password
      });

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
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  // Signup with custom auth
  const customSignup = async (email, password, full_name, username) => {
    try {
      const baseUrl = import.meta.env.VITE_BASEURL || 'http://localhost:4000';
      const response = await axios.post(`${baseUrl}/api/auth/signup`, {
        email,
        password,
        full_name,
        username
      });

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
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed. Please try again.'
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
  const isAuthenticated = () => {
    return !!(clerkUser || customUser);
  };

  const value = {
    // User info
    customUser,
    clerkUser,
    currentUser: getCurrentUser(),
    
    // Auth status
    isAuthenticated: isAuthenticated(),
    loading,
    token,
    
    // Auth methods
    customLogin,
    customSignup,
    customLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
