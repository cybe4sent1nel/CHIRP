import { useEffect, useState, useCallback } from "react";
import { Plus, ChevronLeft, ChevronRight, X, Heart, Send, MoreHorizontal } from "lucide-react";
import moment from "moment";
import StoryModal from "./StoryModal";
import StoryViewer from "./StoryViewer";
import { useAuth } from "@clerk/clerk-react";
import { useCustomAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const StoriesBar = () => {
  const { getToken, user: clerkUser } = useAuth();
  const { customUser } = useCustomAuth();
  const [stories, setStories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewStory, setViewStory] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const fetchStories = async () => {
    try {
      const token = await getToken();
      const authToken = token || (await api.defaults.headers.common['Authorization']);
      const { data } = await api.get('/api/story/get', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (data.success) {
        setStories(data.stories);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [clerkUser, customUser]);

  // Derived state for viewer
  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;
  const activeSlide = activeStory && activeSlide ? 
    (Array.isArray(activeStory.slides) ? activeStory.slides[activeSlideIndex] : { url: activeStory.media_url, duration: 5000 }) 
    : null;

  const markAsSeen = useCallback((index) => {
    setStories(prev => prev.map((story, i) => 
      i === index ? { ...story, seen: true } : story
    ));
  }, []);

  const handleClose = useCallback(() => {
    if (activeStoryIndex !== null) {
      markAsSeen(activeStoryIndex);
    }
    setActiveStoryIndex(null);
    setActiveSlideIndex(0);
    setIsPaused(false);
  }, [activeStoryIndex, markAsSeen]);

  const handleNext = useCallback(() => {
    if (!activeStory) return;

    const slides = Array.isArray(activeStory.slides) ? activeStory.slides : [{ url: activeStory.media_url, duration: 5000 }];
    
    if (activeSlideIndex < slides.length - 1) {
      setActiveSlideIndex(prev => prev + 1);
    } else {
      markAsSeen(activeStoryIndex);
      if (activeStoryIndex < stories.length - 1) {
        setActiveStoryIndex(prev => prev + 1);
        setActiveSlideIndex(0);
      } else {
        handleClose();
      }
    }
  }, [activeSlideIndex, activeStoryIndex, activeStory, stories.length, handleClose, markAsSeen]);

  const handlePrev = useCallback(() => {
    if (!activeStory) return;

    const slides = Array.isArray(activeStory.slides) ? activeStory.slides : [{ url: activeStory.media_url, duration: 5000 }];
    
    if (activeSlideIndex > 0) {
      setActiveSlideIndex(prev => prev - 1);
    } else if (activeStoryIndex > 0) {
      const prevStoryIndex = activeStoryIndex - 1;
      const prevStory = stories[prevStoryIndex];
      const prevSlides = Array.isArray(prevStory.slides) ? prevStory.slides : [{ url: prevStory.media_url, duration: 5000 }];
      setActiveStoryIndex(prevStoryIndex);
      setActiveSlideIndex(prevSlides.length - 1);
    } else {
      handleClose();
    }
  }, [activeSlideIndex, activeStoryIndex, activeStory, stories, handleClose]);

  // Auto-advance timer
  useEffect(() => {
    if (!activeSlide || isPaused) return;
    const timer = setTimeout(handleNext, activeSlide.duration || 5000);
    return () => clearTimeout(timer);
  }, [activeSlide, isPaused, handleNext]);

  // Get user avatar (sync across all auth methods)
  const getUserAvatar = () => {
    // For Clerk users - try different possible image properties
    if (clerkUser?.profileImageUrl) {
      return clerkUser.profileImageUrl;
    }
    if (clerkUser?.imageUrl) {
      return clerkUser.imageUrl;
    }
    // For custom auth users with profile picture
    if (customUser?.profile_picture) {
      return customUser.profile_picture;
    }
    // For custom auth users - use DiceBear
    if (customUser?.email) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customUser.email)}&scale=80`;
    }
    // Fallback for Clerk users with firstName/lastName
    if (clerkUser?.firstName || clerkUser?.lastName) {
      const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&scale=80`;
    }
    return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop";
  };

  return (
    <div className="w-full">
      {/* Story Tray */}
      <div className="flex justify-start flex-wrap gap-10 items-start pb-8 px-4 overflow-x-auto">
        
        {/* 1. "My Story" / Add Button */}
        <div 
          onClick={() => setShowModal(true)}
          className="flex flex-col items-center space-y-4 group cursor-pointer relative z-10 flex-shrink-0"
        >
          <div className="relative w-[88px] h-[88px] transition-transform duration-300 group-hover:scale-105">
            {/* Dashed border */}
            <div className="absolute inset-0 rounded-full border border-dashed border-gray-300 group-hover:border-gray-400 transition-colors"></div>
            <img 
              src={getUserAvatar()}
              alt="My Story"
              className="absolute inset-[4px] w-[calc(100%-8px)] h-[calc(100%-8px)] rounded-full object-cover opacity-90 group-hover:opacity-100 transition-opacity grayscale-[0.1] group-hover:grayscale-0"
            />
            <div className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 border-[4px] border-white shadow-lg group-hover:rotate-90 transition-transform duration-300">
              <Plus size={14} strokeWidth={4} />
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-500 group-hover:text-gray-800 transition-colors tracking-wide">Your Story</span>
        </div>

        {/* 2. Friend Stories */}
        {stories.map((story, index) => (
          <button
            key={index}
            onClick={() => {
              setActiveStoryIndex(index);
              setActiveSlideIndex(0);
            }}
            className="flex flex-col items-center space-y-4 group outline-none relative z-10 flex-shrink-0"
          >
            <div className="relative w-[88px] h-[88px]">
              
              {/* --- DEEP GLOW EFFECT --- */}
              {!story.seen && (
                <div className="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 blur-lg opacity-0 group-hover:opacity-40 transition-all duration-500 pointer-events-none"></div>
              )}

              {/* --- MAIN RING (The Radiant Changing Border) --- */}
              <div 
                className={`absolute inset-0 rounded-full transition-all duration-700 ease-out
                  ${story.seen 
                    ? 'bg-gray-200 scale-95 border border-gray-100' 
                    : 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-fuchsia-500 animate-spin-slow animate-hue shadow-md'
                  }
                `}
              >
                {/* Mask to create the hole */}
                <div className="absolute inset-[3px] bg-white rounded-full"></div>
              </div>

              {/* --- AVATAR IMAGE --- */}
              <div className="absolute inset-[6px] rounded-full overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform duration-500">
                <img
                  src={story.user?.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(story.user?.email || 'user')}&scale=80`}
                  alt={story.user?.username}
                  className={`w-full h-full object-cover transition-all duration-700 ${story.seen ? 'opacity-60 grayscale-[0.5]' : 'opacity-100'}`}
                />
              </div>
            </div>
            
            <span className={`text-xs font-semibold transition-all duration-300 tracking-wide ${story.seen ? 'text-gray-400' : 'text-gray-700 group-hover:text-blue-600'}`}>
              {story.user?.username || 'User'}
            </span>
          </button>
        ))}
      </div>

      {/* --- Full Screen Immersive Viewer (Unchanged) --- */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center animate-fade-in-up">
          
          {/* Mobile Container */}
          <div className="relative w-full h-full sm:max-w-[420px] sm:h-[88vh] sm:rounded-[2rem] overflow-hidden bg-[#121212] shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col ring-1 ring-white/10">
            
            {/* Dynamic Background Blur */}
            {activeSlide && (
              <div 
                className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 transition-all duration-1000 transform scale-125"
                style={{ backgroundImage: `url(${activeSlide.url})` }}
              />
            )}

            {/* Main Content */}
            {activeSlide && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/10 via-transparent to-black/40">
                <img 
                  key={activeSlide.url}
                  src={activeSlide.url} 
                  alt="Story"
                  className="w-full h-full object-contain animate-zoom-subtle"
                />
              </div>
            )}

            {/* UI Overlays */}
            <div className="relative z-30 flex flex-col h-full justify-between p-5 pt-8 bg-gradient-to-b from-black/80 via-transparent to-black/90">
              
              {/* Header */}
              <div className="space-y-4">
                {/* Progress */}
                <div className="flex space-x-1.5 h-[2px]">
                  {Array.isArray(activeStory.slides) 
                    ? activeStory.slides.map((slide, idx) => (
                      <div key={idx} className="flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div 
                          className="h-full bg-white shadow-[0_0_15px_white]"
                          style={{
                            width: idx < activeSlideIndex ? '100%' : idx === activeSlideIndex ? '100%' : '0%',
                            transition: idx === activeSlideIndex && !isPaused ? `width ${(slide.duration || 5000)}ms linear` : 'none',
                          }}
                        />
                      </div>
                    ))
                    : <div className="flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div 
                          className="h-full bg-white shadow-[0_0_15px_white]"
                          style={{
                            width: '100%',
                            transition: !isPaused ? '5000ms linear' : 'none',
                          }}
                        />
                      </div>
                  }
                </div>

                {/* User Details */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 group cursor-pointer">
                    <div className="relative">
                      <img 
                        src={activeStory.user?.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activeStory.user?.email || 'user')}&scale=80`}
                        className="w-10 h-10 rounded-full border border-white/20" 
                        alt="" 
                      />
                      <div className="absolute inset-0 rounded-full border border-white/50 scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"></div>
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold shadow-black drop-shadow-md group-hover:text-cyan-400 transition-colors">{activeStory.user?.username}</p>
                      <p className="text-white/50 text-xs font-medium">{moment(activeStory.createdAt).fromNow()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 bg-white/5 backdrop-blur-md rounded-full p-1 border border-white/10">
                    <button className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"><MoreHorizontal size={20} /></button>
                    <button onClick={handleClose} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                  </div>
                </div>
              </div>

              {/* Footer / Input */}
              <div className="flex items-center space-x-4 pb-4">
                <div className="flex-1 h-12 border border-white/10 rounded-full flex items-center px-5 backdrop-blur-xl bg-white/5 focus-within:bg-white/10 focus-within:border-white/30 transition-all duration-300 shadow-lg">
                  <input 
                    type="text" 
                    placeholder="Reply to story..." 
                    className="bg-transparent border-none outline-none text-white placeholder-white/40 w-full text-sm font-medium"
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                  />
                </div>
                <button className="group relative text-white hover:text-pink-500 transition-colors duration-200">
                  <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-md scale-0 group-hover:scale-150 transition-transform"></div>
                  <Heart size={32} className="relative z-10 group-hover:scale-110 transition-transform" />
                </button>
                <button className="group relative text-white hover:text-cyan-400 transition-colors duration-200">
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-md scale-0 group-hover:scale-150 transition-transform"></div>
                  <Send size={30} className="relative z-10 -rotate-12 translate-y-[-2px] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>

            </div>

            {/* Tap Zones */}
            <div className="absolute inset-0 z-20 flex cursor-pointer">
              <div className="w-1/3 h-full" onClick={handlePrev} onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)}></div>
              <div className="w-1/3 h-full" onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)}></div>
              <div className="w-1/3 h-full" onClick={handleNext} onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)}></div>
            </div>

          </div>

          {/* Desktop External Nav */}
          <button onClick={handlePrev} className="hidden lg:flex absolute left-12 w-16 h-16 bg-white/5 hover:bg-white/10 rounded-full items-center justify-center backdrop-blur-md transition-all text-white/50 hover:text-white border border-white/5 hover:scale-110">
            <ChevronLeft size={36} />
          </button>
          <button onClick={handleNext} className="hidden lg:flex absolute right-12 w-16 h-16 bg-white/5 hover:bg-white/10 rounded-full items-center justify-center backdrop-blur-md transition-all text-white/50 hover:text-white border border-white/5 hover:scale-110">
            <ChevronRight size={36} />
          </button>

        </div>
      )}

      {/* Add Story Modal */}
      {showModal && (
        <StoryModal setShowModal={setShowModal} fetchStories={fetchStories} />
      )}

      {/* Global Styles */}
      <style>{`
        @keyframes fillProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes hue-rotate {
          from { filter: hue-rotate(0deg); }
          to { filter: hue-rotate(360deg); }
        }
        @keyframes zoom-subtle {
          from { transform: scale(1.0); }
          to { transform: scale(1.05); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-hue {
          animation: hue-rotate 4s linear infinite;
        }
        .animate-zoom-subtle {
          animation: zoom-subtle 6s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .cubic-bezier {
          transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};

export default StoriesBar;
