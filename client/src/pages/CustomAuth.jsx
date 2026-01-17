import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
const Lottie = React.lazy(() => import('lottie-react'));
import { Mail, Lock, User, Chrome, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useCustomAuth } from '../context/AuthContext';
const SignIn = React.lazy(() => import('@clerk/clerk-react').then(mod => ({ default: mod.SignIn })));

const CustomAuth = () => {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const { customLogin, customSignup, isAuthenticated } = useCustomAuth();
   
   const [isLogin, setIsLogin] = useState(true);
   const [showPassword, setShowPassword] = useState(false);
   const [loading, setLoading] = useState(false);
   const [leftAnimation, setLeftAnimation] = useState(null);
   const [rightAnimation, setRightAnimation] = useState(null);
   const [catAnimation, setCatAnimation] = useState(null);
   const [showClerkSignIn, setShowClerkSignIn] = useState(false);
   const [showVerificationMessage, setShowVerificationMessage] = useState(false);
   const [verificationEmail, setVerificationEmail] = useState('');
   const [acceptedTerms, setAcceptedTerms] = useState(false);
   const [resendTimer, setResendTimer] = useState(0);
   const [resendLoading, setResendLoading] = useState(false);
   const catLottieRef = useRef(null);
   
   // Handle resend email timer countdown
   useEffect(() => {
     let interval;
     if (resendTimer > 0) {
       interval = setInterval(() => {
         setResendTimer((prev) => prev - 1);
       }, 1000);
     }
     return () => clearInterval(interval);
   }, [resendTimer]);

   // Open Clerk modal when URL param mode=clerk is present
   useEffect(() => {
     const mode = searchParams.get('mode');
     console.log('CustomAuth: URL mode param =', mode);
     if (mode === 'clerk') {
       setShowClerkSignIn(true);
     }
   }, [searchParams]);

   useEffect(() => {
     console.log('CustomAuth: showClerkSignIn =', showClerkSignIn);
   }, [showClerkSignIn]);

   // Log full URL on mount to help debug unexpected redirects
   useEffect(() => {
     console.log('CustomAuth mount URL:', window.location.href);
   }, []);

  // Pull agreed flag from URL (set by Login page) to ensure terms were accepted
  useEffect(() => {
    const agreed = searchParams.get('agreed') === '1';
    console.log('CustomAuth: agreed param =', agreed);
    setAcceptedTerms(agreed);
  }, [searchParams]);
  
  // Form states
  const [formData, setFormData] = useState({
    identifier: '', // email or username for login
    email: '',
    password: '',
    full_name: '',
    username: ''
  });

  // Password strength states
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0, // 0-4 (0: empty, 1: weak, 2: fair, 3: good, 4: strong)
    label: '',
    requirements: {
      minLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSpecialChar: false
    }
  });

  // Default to empty so frontend uses the dev-server proxy (`/api`) in development
  const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BASEURL || '';

  // Clear invalid auth data on mount only
  useEffect(() => {
    const token = localStorage.getItem('customAuthToken');
    const user = localStorage.getItem('customUser');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        
        // If email is not verified, clear the auth data
        if (!userData.emailVerified) {
          console.log('User email not verified, clearing auth data');
          localStorage.removeItem('customAuthToken');
          localStorage.removeItem('customUser');
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('customAuthToken');
        localStorage.removeItem('customUser');
      }
    }
  }, []); // Only run once on mount

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
     const error = searchParams.get('error');
     
     // Handle errors first
     if (error && provider) {
       console.error(`${provider} auth error:`, error);
       const errorMessage = searchParams.get('message') || 'Authentication failed';
       toast.error(`${provider} authentication failed: ${errorMessage}`);
       return;
     }
     
     // Handle successful OAuth callback
     if (token && provider) {
       console.log(`[OAUTH] ${provider} login successful, fetching user profile...`);
       
       // Fetch user profile with the token
       const fetchUserProfile = async () => {
         try {
           const response = await axios.get(`${API_URL}/api/user/data`, {
             headers: { Authorization: `Bearer ${token}` }
           });
           
           if (response.data.success) {
             const user = response.data.user;
             console.log('[OAUTH] User profile fetched:', user.email);
             
             // Store both token and user data
             localStorage.setItem('customAuthToken', token);
             localStorage.setItem('customUser', JSON.stringify(user));
             
             // Dispatch custom event to notify AuthContext of update
             window.dispatchEvent(new Event('customAuthUpdate'));
             
             toast.success(`Welcome ${user.full_name}! Logged in with ${provider}`);
             
             // Redirect to feed
             setTimeout(() => {
               navigate('/');
             }, 500);
           } else {
             throw new Error('Failed to fetch user profile');
           }
         } catch (err) {
           console.error('[OAUTH] Failed to fetch user profile:', err);
           toast.error('Login successful but failed to load profile. Please try again.');
           // Still store token, user can refresh
           localStorage.setItem('customAuthToken', token);
           setTimeout(() => {
             navigate('/');
           }, 1000);
         }
       };
       
       fetchUserProfile();
     }
   }, [searchParams, navigate, API_URL]);

  const checkPasswordStrength = (password) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%]/.test(password)
    };

    // Calculate score based on requirements met
    const metRequirements = Object.values(requirements).filter(Boolean).length;
    let score = 0;
    let label = '';

    if (password.length === 0) {
      score = 0;
      label = '';
    } else if (metRequirements <= 2) {
      score = 1;
      label = 'Weak';
    } else if (metRequirements === 3) {
      score = 2;
      label = 'Fair';
    } else if (metRequirements === 4) {
      score = 3;
      label = 'Good';
    } else if (metRequirements === 5) {
      score = 4;
      label = 'Strong';
    }

    return { score, label, requirements };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Update password strength for signup password field
    if (name === 'password' && !isLogin) {
      setPasswordStrength(checkPasswordStrength(value));
    }
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

  const handleResendVerificationEmail = async () => {
    if (resendTimer > 0) return;
    
    setResendLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/resend-verification`, {
        email: verificationEmail
      });
      
      if (response.data.success) {
        setResendTimer(60);
        toast.success('Verification email resent! Check your inbox.', {
          duration: 4000,
          icon: '📧'
        });
      } else {
        toast.error(response.data.message || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure the user accepted terms on the previous page
      if (!acceptedTerms) {
        console.warn('CustomAuth: submit blocked - terms not accepted');
        toast.error('Please accept the Terms of Service and Privacy Policy from the previous page before continuing.');
        setLoading(false);
        return;
      }

      if (isLogin) {
        // Client-side validation
        if (!formData.identifier || !formData.password) {
          toast.error('Please enter both email/username and password.');
          setLoading(false);
          return;
        }

        // Login using AuthContext
        const result = await customLogin(formData.identifier, formData.password);
        
        if (result.success) {
          console.log('CustomAuth: login successful, redirecting to /');
          toast.success('Login successful!');
          // Force a full page reload to refresh auth state
          setLoading(false);
          window.location.replace('/');
          return; // Exit to prevent further execution
        } else {
          // Show error message with appropriate icon
          const isPasswordError = result.field === 'password';
          const isTimeout = result.message?.includes('timeout') || result.message?.includes('connection');
          
          if (isTimeout) {
            // Timeout error - show with longer duration
            toast.error(result.message || 'Connection timeout. Please check your internet and try again.', {
              duration: 8000,
              icon: '⏱️'
            });
          } else if (isPasswordError) {
            toast.error(result.message || 'Login failed', {
              duration: 5000,
              icon: '🔒'
            });
          } else {
            toast.error(result.message || 'Login failed', {
              duration: 5000,
              icon: '⚠️'
            });
          }
          
          // If user doesn't exist, suggest signup
          if (result.shouldSignup) {
            setTimeout(() => {
              const shouldSwitch = window.confirm(
                'Would you like to create a new account instead?'
              );
              if (shouldSwitch) {
                setIsLogin(false);
              }
            }, 1500);
          }
        }
      } else {
        // Signup using AuthContext
        // Client-side validation
        if (!formData.full_name || !formData.email || !formData.password) {
          toast.error('Please fill in your full name, email and password.');
          setLoading(false);
          return;
        }

        const result = await customSignup(
          formData.email,
          formData.password,
          formData.full_name,
          formData.username
        );

        if (result.success) {
          console.log('CustomAuth: signup successful, verification email sent to', formData.email);

          // Store auth data even for unverified users to allow access to home page
          if (result.token && result.user) {
            localStorage.setItem('customAuthToken', result.token);
            localStorage.setItem('customUser', JSON.stringify(result.user));
            // Dispatch custom event to notify AuthContext of update
            window.dispatchEvent(new Event('customAuthUpdate'));
          }

          setVerificationEmail(formData.email);
          setResendTimer(60);
          setShowVerificationMessage(true);
          toast.success('Account created! Please check your email to verify.', {
            duration: 6000,
            icon: '📧'
          });
          // Clear form
          setFormData({
            identifier: '',
            email: '',
            password: '',
            full_name: '',
            username: ''
          });
        } else {
          // Show specific error based on field
          if (result.field === 'email') {
            toast.error(result.message || 'Email already registered', {
              duration: 5000,
              icon: '⚠️'
            });
            setTimeout(() => {
              const shouldLogin = window.confirm(
                'This email is already registered. Would you like to login instead?'
              );
              if (shouldLogin) {
                setIsLogin(true);
                setFormData({
                  identifier: formData.email,
                  email: '',
                  password: formData.password,
                  full_name: '',
                  username: ''
                });
              }
            }, 1500);
          } else if (result.field === 'username') {
            toast.error(result.message || 'Username already taken', {
              duration: 5000,
              icon: '⚠️'
            });
          } else {
            toast.error(result.message || 'Signup failed');
          }
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Authentication failed';
      console.error('CustomAuth submit error:', error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BASEURL || '';
    // Ensure we don't double /api if baseUrl already ends with /api
    const endpoint = baseUrl.endsWith('/api') ? `${baseUrl}/auth/google` : `${baseUrl}/api/auth/google`;
    window.location.href = endpoint;
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  // Clerk sign-in modal overlay (rendered within the page when requested)
  const ClerkModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={() => setShowClerkSignIn(false)}
          className="absolute -top-12 left-0 text-white hover:text-gray-100 transition-colors font-medium drop-shadow-lg"
        >
          ← Back
        </button>
        <Suspense fallback={<div className="p-4">Loading sign in...</div>}>
          <SignIn 
            forceRedirectUrl="/"
            fallbackRedirectUrl="/"
            appearance={{
              baseTheme: undefined,
              elements: {
                rootBox: "mx-auto",
                card: "bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20"
              }
            }}
          />
        </Suspense>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-white">
      {showClerkSignIn && <ClerkModal />}
      {/* Background Animations */}
      {leftAnimation && (
        <div className="absolute left-0 top-0 w-1/2 h-full opacity-40 pointer-events-none">
          <Suspense fallback={<div className="w-full h-40 bg-gray-200 animate-pulse"/>}>
            <Lottie animationData={leftAnimation} loop={true} />
          </Suspense>
        </div>
      )}
      {rightAnimation && (
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-40 pointer-events-none">
          <Suspense fallback={<div className="w-full h-40 bg-gray-200 animate-pulse"/>}>
            <Lottie animationData={rightAnimation} loop={true} />
          </Suspense>
        </div>
      )}

      {/* Verification Success Message */}
      {showVerificationMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4">
          <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl shadow-2xl p-6 relative animate-slideDown">
            <button
              onClick={() => setShowVerificationMessage(false)}
              className="absolute top-3 right-3 text-white/80 hover:text-white"
            >
              <X size={20} />
            </button>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Mail size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Check Your Email! 📧</h3>
                <p className="text-white/90 text-sm mb-2">
                  We've sent a verification link to <strong>{verificationEmail}</strong>
                </p>
                <p className="text-white/80 text-xs mb-4">
                   Please click the link in the email to verify your account and unlock all features.
                 </p>
                 <div className="flex gap-2 mb-3">
                   <button
                     onClick={handleResendVerificationEmail}
                     disabled={resendTimer > 0 || resendLoading}
                     className={`flex-1 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                       resendTimer > 0 || resendLoading
                         ? 'bg-white/10 text-white/50 cursor-not-allowed'
                         : 'bg-white hover:bg-white/90 text-teal-600'
                     }`}
                   >
                     {resendLoading ? '⏳ Resending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : '📧 Resend email'}
                   </button>
                 </div>
                 <div className="flex gap-2">
                   <button
                     onClick={() => {
                       setShowVerificationMessage(false);
                       setResendTimer(0);
                       navigate('/');
                     }}
                     className="flex-1 text-sm bg-white hover:bg-white/90 text-teal-600 font-semibold px-4 py-2 rounded-lg transition-colors"
                   >
                     Go to Home
                   </button>
                   <button
                     onClick={() => {
                       setShowVerificationMessage(false);
                       setIsLogin(true);
                       setResendTimer(0);
                     }}
                     className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                   >
                     Login
                   </button>
                 </div>
              </div>
            </div>
          </div>
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
                autoComplete={isLogin ? 'username' : 'email'}
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
                autoComplete={isLogin ? 'current-password' : 'new-password'}
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
                  <Suspense fallback={<div style={{ width: 45, height: 45 }} /> }>
                    <Lottie
                      lottieRef={catLottieRef}
                      animationData={catAnimation}
                      loop={false}
                      autoplay={false}
                      style={{ width: 45, height: 45 }}
                      initialSegment={showPassword ? [60, 120] : [0, 60]}
                    />
                  </Suspense>
                )}
              </button>
            </div>

            {/* Password Strength Indicator (Signup only) */}
            {!isLogin && formData.password && (
              <div className="space-y-3 mt-2">
                {/* Strength Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Password Strength:</span>
                    <span className={`font-semibold ${
                      passwordStrength.score === 1 ? 'text-red-500' :
                      passwordStrength.score === 2 ? 'text-orange-500' :
                      passwordStrength.score === 3 ? 'text-blue-500' :
                      passwordStrength.score === 4 ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.score === 1 ? 'bg-red-500 w-1/4' :
                        passwordStrength.score === 2 ? 'bg-orange-500 w-2/4' :
                        passwordStrength.score === 3 ? 'bg-blue-500 w-3/4' :
                        passwordStrength.score === 4 ? 'bg-green-500 w-full' : 'w-0'
                      }`}
                    />
                  </div>
                </div>

                {/* Requirements List */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  <div className="text-xs font-medium text-gray-700 mb-2">Password must contain:</div>
                  
                  <div className={`flex items-center gap-2 text-xs transition-colors ${
                    passwordStrength.requirements.minLength ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`flex items-center justify-center w-4 h-4 rounded-full border transition-all ${
                      passwordStrength.requirements.minLength 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {passwordStrength.requirements.minLength && (
                        <Check size={12} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span>At least 8 characters</span>
                  </div>

                  <div className={`flex items-center gap-2 text-xs transition-colors ${
                    passwordStrength.requirements.hasUpperCase ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`flex items-center justify-center w-4 h-4 rounded-full border transition-all ${
                      passwordStrength.requirements.hasUpperCase 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {passwordStrength.requirements.hasUpperCase && (
                        <Check size={12} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span>One uppercase letter (A-Z)</span>
                  </div>

                  <div className={`flex items-center gap-2 text-xs transition-colors ${
                    passwordStrength.requirements.hasLowerCase ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`flex items-center justify-center w-4 h-4 rounded-full border transition-all ${
                      passwordStrength.requirements.hasLowerCase 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {passwordStrength.requirements.hasLowerCase && (
                        <Check size={12} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span>One lowercase letter (a-z)</span>
                  </div>

                  <div className={`flex items-center gap-2 text-xs transition-colors ${
                    passwordStrength.requirements.hasNumber ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`flex items-center justify-center w-4 h-4 rounded-full border transition-all ${
                      passwordStrength.requirements.hasNumber 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {passwordStrength.requirements.hasNumber && (
                        <Check size={12} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span>One number (0-9)</span>
                  </div>

                  <div className={`flex items-center gap-2 text-xs transition-colors ${
                    passwordStrength.requirements.hasSpecialChar ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`flex items-center justify-center w-4 h-4 rounded-full border transition-all ${
                      passwordStrength.requirements.hasSpecialChar 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {passwordStrength.requirements.hasSpecialChar && (
                        <Check size={12} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span>One special character (!@#$%)</span>
                  </div>
                </div>
              </div>
            )}

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
            {!acceptedTerms && (
              <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
                You must accept the <a href="/privacy-policy.html" target="_blank" className="underline">Privacy Policy</a> and <a href="/terms-of-service.html" target="_blank" className="underline">Terms of Service</a> on the previous page before continuing. <button onClick={() => navigate('/welcome')} className="ml-2 font-semibold text-purple-600">Go back to accept</button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !acceptedTerms}
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
