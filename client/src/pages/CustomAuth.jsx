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

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <Chrome size={20} />
            Continue with Google
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

          {/* Use Clerk Option */}
          <div className="text-center mt-4">
            <button
              onClick={() => setShowClerkSignIn(true)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Or continue with Clerk Authentication →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomAuth;
