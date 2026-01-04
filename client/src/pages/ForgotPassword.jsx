import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Lottie from 'lottie-react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const ForgotPassword = () => {
  const [step, setStep] = useState('email'); // 'email' or 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animation, setAnimation] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');

  const API_URL = import.meta.env.VITE_BASEURL || 'http://localhost:4000';

  useEffect(() => {
    if (resetToken) {
      setStep('reset');
    }
  }, [resetToken]);

  useEffect(() => {
    fetch('/animations/Windy Scene.json')
      .then(res => res.json())
      .then(data => setAnimation(data))
      .catch(err => console.error('Failed to load animation:', err));
  }, []);

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      if (data.success) {
        toast.success('Password reset link sent! Check your email.');
        setTimeout(() => navigate('/auth'), 3000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(`${API_URL}/api/auth/reset-password`, {
        token: resetToken,
        newPassword: password
      });

      if (data.success) {
        toast.success('Password reset successful! You can now login.');
        setTimeout(() => navigate('/auth'), 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
        {animation && (
          <div className="absolute inset-0 opacity-30">
            <Lottie animationData={animation} loop={true} />
          </div>
        )}
      </div>

      {/* Glassmorphism Container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6"
          >
            <ArrowLeft size={20} />
            Back to Login
          </button>

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="https://financial-tan-fdddl6egnj.edgeone.app/LOGOO.png" 
              alt="Chirp Logo" 
              className="w-20 h-20 rounded-full shadow-lg"
            />
          </div>

          {step === 'email' ? (
            <>
              {/* Email Step */}
              <h1 className="text-4xl font-bold text-white text-center mb-2">
                Forgot Password?
              </h1>
              <p className="text-white/80 text-center mb-8">
                Enter your email to receive a password reset link
              </p>

              <form onSubmit={handleSendResetLink} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Reset Password Step */}
              <h1 className="text-4xl font-bold text-white text-center mb-2">
                Reset Password
              </h1>
              <p className="text-white/80 text-center mb-8">
                Enter your new password
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
