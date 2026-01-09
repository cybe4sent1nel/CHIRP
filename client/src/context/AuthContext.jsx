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
      const errorData = error.response?.data;
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
      const baseUrl = import.meta.env.VITE_BASEURL || 'http://localhost:4000';
      const response = await axios.post(`${baseUrl}/api/auth/signup`, {
        email,
        password,
        full_name,
        username
      });

      if (response.data.success) {
        const { message } = response.data;
        // DON'T store token/user until email is verified
        // Just return success message
        return { 
          success: true, 
          message: message || 'Account created! Please check your email to verify.' 
        };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Signup error:', error);
      const errorData = error.response?.data;
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
