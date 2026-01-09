import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Lottie from 'lottie-react';
import { Mail, Lock, User, Chrome } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useCustomAuth } from '../context/AuthContext';
import { SignIn } from '@clerk/clerk-react';

const CustomAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leftAnimation, setLeftAnimation] = useState(null);
  const [rightAnimation, setRightAnimation] = useState(null);
  const [catAnimation, setCatAnimation] = useState(null);
  const [showClerkSignIn, setShowClerkSignIn] = useState(false);
  const catLottieRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { customLogin, customSignup, isAuthenticated } = useCustomAuth();
  
  // Form states
  const [formData, setFormData] = useState({
    identifier: '', // email or username for login
    email: '',
    password: '',
    full_name: '',
    username: ''
  });

  const API_URL = import.meta.env.VITE_BASEURL || 'http://localhost:4000';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Check URL params for mode
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    } else if (mode === 'login') {
      setIsLogin(true);
    }
  }, [searchParams]);

  // Load both animations for background
  useEffect(() => {
    fetch('/animations/bird example Lottie.json')
      .then(res => res.json())
      .then(data => setLeftAnimation(data))
      .catch(err => console.error('Failed to load left animation:', err));

    fetch('/animations/Windy Scene.json')
      .then(res => res.json())
      .then(data => setRightAnimation(data))
      .catch(err => console.error('Failed to load right animation:', err));

    fetch('/animations/Cat popping out of the box.json')
      .then(res => res.json())
      .then(data => setCatAnimation(data))
      .catch(err => console.error('Failed to load cat animation:', err));
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    
    if (token && provider) {
      localStorage.setItem('chirp_auth_token', token);
      toast.success(`Welcome! Logged in with ${provider}`);
      navigate('/');
    }
  }, [searchParams, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    const newShowPassword = !showPassword;
    setShowPassword(newShowPassword);
    
    // Control cat animation
    if (catLottieRef.current) {
      if (newShowPassword) {
        // Password shown - cat appears (play forward)
        catLottieRef.current.setDirection(1);
        catLottieRef.current.play();
      } else {
        // Password hidden - cat hides (play backward)
        catLottieRef.current.setDirection(-1);
        catLottieRef.current.play();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login using AuthContext
        const result = await customLogin(formData.identifier, formData.password);
        
        if (result.success) {
          toast.success('Login successful!');
          navigate('/');
        } else {
          toast.error(result.message || 'Login failed');
        }
      } else {
        // Signup using AuthContext
        const result = await customSignup(
          formData.email,
          formData.password,
          formData.full_name,
          formData.username
        );

        if (result.success) {
          toast.success('Account created! Please check your email to verify.');
          navigate('/');
        } else {
          toast.error(result.message || 'Signup failed');
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Authentication failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  if (showClerkSignIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #ffc0e3 0%, #b8e0ff 33%, #b8f5d4 66%, #fff5ba 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite'
        }}>
        <style>{`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
        <div className="relative z-10 w-full max-w-md">
          <button
            onClick={() => setShowClerkSignIn(false)}
            className="absolute -top-12 left-0 text-white hover:text-gray-100 transition-colors font-medium drop-shadow-lg"
          >
            ← Back
          </button>
          <SignIn 
            afterSignInUrl="/"
            appearance={{
              baseTheme: undefined,
              elements: {
                rootBox: "mx-auto",
                card: "bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20"
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-white">
      {/* Background Animations */}
      {leftAnimation && (
        <div className="absolute left-0 top-0 w-1/2 h-full opacity-40 pointer-events-none">
          <Lottie animationData={leftAnimation} loop={true} />
        </div>
      )}
      {rightAnimation && (
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-40 pointer-events-none">
          <Lottie animationData={rightAnimation} loop={true} />
        </div>
      )}

      {/* Form Container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="https://financial-tan-fdddl6egnj.edgeone.app/LOGOO.png" 
              alt="Chirp Logo" 
              className="w-20 h-20 rounded-full shadow-lg"
            />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-800 text-center mb-2">
            {isLogin ? 'Welcome Back!' : 'Join Chirp'}
          </h1>
          <p className="text-gray-600 text-center mb-8">
            {isLogin ? 'Login to continue your journey' : 'Create your account to get started'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* Full Name */}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="full_name"
                    placeholder="Full Name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Username */}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="username"
                    placeholder="Username (optional)"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* Email/Identifier */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={isLogin ? 'text' : 'email'}
                name={isLogin ? 'identifier' : 'email'}
                placeholder={isLogin ? 'Email or Username' : 'Email'}
                value={isLogin ? formData.identifier : formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full pl-12 pr-16 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform focus:outline-none"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {catAnimation && (
                  <Lottie
                    lottieRef={catLottieRef}
                    animationData={catAnimation}
                    loop={false}
                    autoplay={false}
                    style={{ width: 45, height: 45 }}
                    initialSegment={showPassword ? [60, 120] : [0, 60]}
                  />
                )}
              </button>
            </div>

            {/* Forgot Password (Login only) */}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            className="auth-btn google-btn"
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              border: '1px solid #dadce0',
              borderRadius: '20px',
              padding: '0 24px',
              height: '48px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 1px 3px rgba(60,64,67, 0.3), 0 4px 8px 3px rgba(60,64,67, 0.15)',
              outline: 'none',
              textDecoration: 'none',
              width: '100%',
              marginBottom: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f7f9ff';
              e.currentTarget.style.borderColor = '#d2e3fc';
              e.currentTarget.style.boxShadow = '0 2px 3px rgba(60,64,67, 0.3), 0 6px 10px 4px rgba(60,64,67, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#dadce0';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(60,64,67, 0.3), 0 4px 8px 3px rgba(60,64,67, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.backgroundColor = '#e8f0fe';
              e.currentTarget.style.transform = 'scale(0.98) translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(60,64,67, 0.3), 0 1px 3px 1px rgba(60,64,67, 0.15)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.backgroundColor = '#f7f9ff';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 3px rgba(60,64,67, 0.3), 0 6px 10px 4px rgba(60,64,67, 0.15)';
            }}
          >
            <div style={{ width: '20px', height: '20px', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ width: '100%', height: '100%' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            </div>
            <span style={{ color: '#3c4043', fontSize: '15px', fontWeight: '500', letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>
              Continue with Google
            </span>
          </button>

          {/* Clerk Button */}
          <button
            onClick={() => setShowClerkSignIn(true)}
            className="auth-btn clerk-btn"
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              border: '1px solid #dadce0',
              borderRadius: '20px',
              padding: '0 24px',
              height: '48px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 1px 3px rgba(60,64,67, 0.3), 0 4px 8px 3px rgba(60,64,67, 0.15)',
              outline: 'none',
              textDecoration: 'none',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f7f9ff';
              e.currentTarget.style.borderColor = '#6c47ff';
              e.currentTarget.style.boxShadow = '0 2px 3px rgba(60,64,67, 0.3), 0 6px 10px 4px rgba(60,64,67, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#dadce0';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(60,64,67, 0.3), 0 4px 8px 3px rgba(60,64,67, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.backgroundColor = '#e8f0fe';
              e.currentTarget.style.transform = 'scale(0.98) translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(60,64,67, 0.3), 0 1px 3px 1px rgba(60,64,67, 0.15)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.backgroundColor = '#f7f9ff';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 3px rgba(60,64,67, 0.3), 0 6px 10px 4px rgba(60,64,67, 0.15)';
            }}
          >
            <div style={{ width: '20px', height: '20px', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <path d="m21.47 20.829 -2.881 -2.881a0.572 0.572 0 0 0 -0.7 -0.084 6.854 6.854 0 0 1 -7.081 0 0.576 0.576 0 0 0 -0.7 0.084l-2.881 2.881a0.576 0.576 0 0 0 -0.103 0.69 0.57 0.57 0 0 0 0.166 0.186 12 12 0 0 0 14.113 0 0.58 0.58 0 0 0 0.239 -0.423 0.576 0.576 0 0 0 -0.172 -0.453Zm0.002 -17.668 -2.88 2.88a0.569 0.569 0 0 1 -0.701 0.084A6.857 6.857 0 0 0 8.724 8.08a6.862 6.862 0 0 0 -1.222 3.692 6.86 6.86 0 0 0 0.978 3.764 0.573 0.573 0 0 1 -0.083 0.699l-2.881 2.88a0.567 0.567 0 0 1 -0.864 -0.063A11.993 11.993 0 0 1 6.771 2.7a11.99 11.99 0 0 1 14.637 -0.405 0.566 0.566 0 0 1 0.232 0.418 0.57 0.57 0 0 1 -0.168 0.448Zm-7.118 12.261a3.427 3.427 0 1 0 0 -6.854 3.427 3.427 0 0 0 0 6.854Z" fill="#6c47ff" strokeWidth="1"/>
              </svg>
            </div>
            <span style={{ color: '#3c4043', fontSize: '15px', fontWeight: '500', letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>
              Continue with Clerk
            </span>
          </button>

          {/* Toggle Login/Signup */}
          <div className="text-center mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-600 hover:text-gray-800"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="font-bold underline text-purple-600">
                {isLogin ? 'Sign Up' : 'Login'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomAuth;
