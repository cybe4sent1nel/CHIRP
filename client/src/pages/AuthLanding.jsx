import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { useCustomAuth } from '../context/AuthContext';

const AuthLanding = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomAuth();
  const [leftAnimation, setLeftAnimation] = useState(null);
  const [rightAnimation, setRightAnimation] = useState(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Load both animations
  useEffect(() => {
    fetch('/animations/bird example Lottie.json')
      .then(res => res.json())
      .then(data => setLeftAnimation(data))
      .catch(err => console.error('Failed to load left animation:', err));

    fetch('/animations/Windy Scene.json')
      .then(res => res.json())
      .then(data => setRightAnimation(data))
      .catch(err => console.error('Failed to load right animation:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animations */}
      {leftAnimation && (
        <div className="absolute left-0 top-0 w-1/2 h-full opacity-20">
          <Lottie animationData={leftAnimation} loop={true} />
        </div>
      )}
      {rightAnimation && (
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-20">
          <Lottie animationData={rightAnimation} loop={true} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl">
        {/* Logo */}
        <div className="mb-8">
          <div className="text-8xl mb-4 animate-bounce">🐦</div>
          <h1 className="text-7xl font-bold text-white mb-4 tracking-tight">
            Chirp
          </h1>
          <p className="text-2xl text-white/90 font-light">
            Connect, Share, Engage
          </p>
        </div>

        {/* Description */}
        <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
          Join the social media platform that puts you first. Share your thoughts, 
          connect with friends, and be part of a global community.
        </p>

        {/* Buttons */}
        <div className="flex gap-6 justify-center items-center flex-wrap">
          <button
            onClick={() => navigate('/auth?mode=login')}
            className="px-12 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-2xl"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/auth?mode=signup')}
            className="px-12 py-4 bg-transparent text-white border-2 border-white rounded-full font-bold text-lg hover:bg-white hover:text-purple-600 transform hover:scale-105 transition-all duration-300 shadow-2xl"
          >
            Sign Up
          </button>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-3 gap-8 text-white">
          <div className="backdrop-blur-sm bg-white/10 p-6 rounded-2xl">
            <div className="text-4xl mb-3">🔐</div>
            <h3 className="font-bold text-lg mb-2">Privacy First</h3>
            <p className="text-sm text-white/80">Your data, your control</p>
          </div>
          <div className="backdrop-blur-sm bg-white/10 p-6 rounded-2xl">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="font-bold text-lg mb-2">Real Connections</h3>
            <p className="text-sm text-white/80">Authentic interactions</p>
          </div>
          <div className="backdrop-blur-sm bg-white/10 p-6 rounded-2xl">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="font-bold text-lg mb-2">AI-Powered</h3>
            <p className="text-sm text-white/80">Smart features</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLanding;
