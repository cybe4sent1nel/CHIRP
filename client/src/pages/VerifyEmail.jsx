import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Lottie from 'lottie-react';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [animation, setAnimation] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const API_URL = import.meta.env.VITE_BASEURL || 'http://localhost:4000';

  // Load success animation
  useEffect(() => {
    fetch('/animations/bird example Lottie.json')
      .then(res => res.json())
      .then(data => setAnimation(data))
      .catch(err => console.error('Failed to load animation:', err));
  }, []);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setMessage('No verification token provided');
        setLoading(false);
        return;
      }

      try {
        // Set a timeout for the request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const { data } = await axios.get(`${API_URL}/api/auth/verify-email?token=${token}`, {
          signal: controller.signal,
          timeout: 15000
        });
        
        clearTimeout(timeoutId);
        
        if (data.success) {
          setVerified(true);
          setMessage('Your email has been successfully verified! You can now access all features of Chirp.');
          toast.success('Email verified! Logging you in...');
          
          // Store the auth token and user data returned from verification
          if (data.token && data.user) {
            localStorage.setItem('customAuthToken', data.token);
            localStorage.setItem('customUser', JSON.stringify(data.user));
            // Dispatch custom event to notify AuthContext of update
            window.dispatchEvent(new Event('customAuthUpdate'));
          }
          
          // Redirect to home after 2 seconds
          setTimeout(() => {
            window.location.replace('/');
          }, 2000);
        } else {
          setVerified(false);
          setMessage(data.message || 'Verification failed');
          toast.error(data.message || 'Verification failed');
        }
      } catch (error) {
        setVerified(false);
        
        if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
          setMessage('Request timed out. Please check your internet connection and try again.');
          toast.error('Connection timeout. Please try again.');
        } else {
          setMessage(error.response?.data?.message || 'Verification failed. The token may be invalid or expired.');
          toast.error('Email verification failed');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, API_URL, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-teal-500 to-blue-500">
        {animation && (
          <div className="absolute inset-0 opacity-20">
            <Lottie animationData={animation} loop={true} />
          </div>
        )}
      </div>

      {/* Glassmorphism Container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="https://financial-tan-fdddl6egnj.edgeone.app/LOGOO.png" 
              alt="Chirp Logo" 
              className="w-20 h-20 rounded-full shadow-lg"
            />
          </div>

          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {loading ? (
              <Loader2 className="text-white animate-spin" size={64} />
            ) : verified ? (
              <CheckCircle className="text-green-300" size={64} />
            ) : (
              <XCircle className="text-red-300" size={64} />
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-4">
            {loading ? 'Verifying...' : verified ? 'Email Verified!' : 'Verification Failed'}
          </h1>

          {/* Message */}
          <p className="text-white/80 text-lg mb-8">
            {message || 'Please wait while we verify your email...'}
          </p>

          {/* Action Buttons */}
          {!loading && (
            <div className="space-y-4">
              {verified ? (
                <>
                  <p className="text-white/60 text-sm mb-4">
                    Redirecting in 2 seconds...
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-600 font-bold rounded-xl hover:bg-white/90 transition-all shadow-lg"
                  >
                    Go to Home <ArrowRight size={20} />
                  </Link>
                </>
              ) : (
                <div className="space-y-4">
                  <Link
                    to="/auth?mode=signup"
                    className="block px-6 py-3 bg-white text-red-600 font-bold rounded-xl hover:bg-white/90 transition-all shadow-lg"
                  >
                    Try Signing Up Again
                  </Link>
                  <p className="text-white/60 text-sm">
                    Need help? Contact support at <a href="mailto:support@chirp.com" className="underline">support@chirp.com</a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
