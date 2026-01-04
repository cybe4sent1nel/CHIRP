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
        const { data } = await axios.get(`${API_URL}/api/auth/verify-email?token=${token}`);
        
        if (data.success) {
          setVerified(true);
          setMessage('Your email has been successfully verified!');
          toast.success('Email verified! You can now login.');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        } else {
          setVerified(false);
          setMessage(data.message || 'Verification failed');
        }
      } catch (error) {
        setVerified(false);
        setMessage(error.response?.data?.message || 'Verification failed. Token may be invalid or expired.');
        toast.error('Email verification failed');
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
                    Redirecting to login in 3 seconds...
                  </p>
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-600 font-bold rounded-xl hover:bg-white/90 transition-all shadow-lg"
                  >
                    Login Now <ArrowRight size={20} />
                  </Link>
                </>
              ) : (
                <div className="space-y-4">
                  <Link
                    to="/auth"
                    className="block px-6 py-3 bg-white text-red-600 font-bold rounded-xl hover:bg-white/90 transition-all shadow-lg"
                  >
                    Try Signing Up Again
                  </Link>
                  <p className="text-white/60 text-sm">
                    Need help? Contact support at support@chirp.com
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
