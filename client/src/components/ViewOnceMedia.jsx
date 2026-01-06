import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Download, Ban, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const ViewOnceMedia = ({ 
  message, 
  currentUserId, 
  onViewed,
  allowSave = true 
}) => {
  const [isViewing, setIsViewing] = useState(false);
  const [hasViewed, setHasViewed] = useState(message.viewedBy?.includes(currentUserId));
  const [remainingTime, setRemainingTime] = useState(10);
  const [isBlocked, setIsBlocked] = useState(false);
  const mediaRef = useRef(null);
  const containerRef = useRef(null);

  // Detect screenshot attempts
  useEffect(() => {
    if (!isViewing) return;

    const preventScreenshot = (e) => {
      // Detect print screen
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        toast.error('Screenshots are disabled for view-once messages!', {
          icon: '🚫',
          duration: 3000
        });
        handleBlock();
      }
      
      // Detect common screenshot shortcuts
      if (
        (e.ctrlKey && e.shiftKey && e.key === 'S') || // Windows Snipping Tool
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) // Mac screenshots
      ) {
        e.preventDefault();
        toast.error('Screenshots are disabled for view-once messages!', {
          icon: '🚫',
          duration: 3000
        });
        handleBlock();
      }
    };

    // Detect screen recording (visibility change might indicate recording software)
    const handleVisibilityChange = () => {
      if (document.hidden && isViewing) {
        toast.warning('View-once message closed due to app switch');
        handleClose();
      }
    };

    // Detect right-click (context menu)
    const preventContextMenu = (e) => {
      e.preventDefault();
      toast.error('Right-click is disabled for view-once messages!', {
        icon: '🚫'
      });
    };

    // Detect developer tools
    const detectDevTools = (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        toast.error('Developer tools are disabled for view-once messages!', {
          icon: '🚫'
        });
        handleBlock();
      }
    };

    document.addEventListener('keydown', preventScreenshot);
    document.addEventListener('keydown', detectDevTools);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (containerRef.current) {
      containerRef.current.addEventListener('contextmenu', preventContextMenu);
    }

    return () => {
      document.removeEventListener('keydown', preventScreenshot);
      document.removeEventListener('keydown', detectDevTools);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (containerRef.current) {
        containerRef.current.removeEventListener('contextmenu', preventContextMenu);
      }
    };
  }, [isViewing]);

  // Timer countdown
  useEffect(() => {
    if (!isViewing) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isViewing]);

  const handleView = () => {
    if (hasViewed) {
      toast.error('This media has already been viewed and is no longer available');
      return;
    }

    setIsViewing(true);
    setRemainingTime(10);
    
    // Mark as viewed
    if (onViewed) {
      onViewed(message._id);
    }
  };

  const handleClose = () => {
    setIsViewing(false);
    setHasViewed(true);
    setRemainingTime(10);
  };

  const handleBlock = () => {
    setIsBlocked(true);
    handleClose();
    toast.error('Access blocked due to screenshot attempt', {
      icon: '⛔',
      duration: 4000
    });
  };

  const handleDownload = async () => {
    if (!allowSave) {
      toast.error('Saving is disabled for this media', { icon: '🔒' });
      return;
    }

    try {
      const response = await fetch(message.file_url || message.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `view-once-media-${Date.now()}.${blob.type.split('/')[1]}`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Media saved to downloads');
    } catch (error) {
      toast.error('Failed to save media');
    }
  };

  if (isBlocked) {
    return (
      <div className="flex items-center justify-center gap-3 p-6 bg-red-50 rounded-lg border-2 border-red-200">
        <Ban className="w-8 h-8 text-red-600" />
        <div>
          <p className="font-semibold text-red-900">Access Blocked</p>
          <p className="text-sm text-red-600">Screenshot attempt detected</p>
        </div>
      </div>
    );
  }

  if (hasViewed && !isViewing) {
    return (
      <div className="flex items-center justify-center gap-3 p-6 bg-gray-100 rounded-lg border-2 border-gray-300">
        <EyeOff className="w-8 h-8 text-gray-500" />
        <div>
          <p className="font-semibold text-gray-700">Viewed</p>
          <p className="text-sm text-gray-500">This view-once media is no longer available</p>
        </div>
      </div>
    );
  }

  if (isViewing) {
    return (
      <div 
        ref={containerRef}
        className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center"
        style={{ userSelect: 'none' }}
      >
        {/* Timer and Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
            <Clock className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-lg">{remainingTime}s</span>
          </div>
          {allowSave && (
            <button
              onClick={handleDownload}
              className="bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/30 transition-colors"
              title="Save media"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
          )}
          <button
            onClick={handleClose}
            className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full hover:bg-white/30 transition-colors text-white font-medium"
          >
            Close
          </button>
        </div>

        {/* Media Display */}
        <div className="max-w-4xl max-h-[80vh] flex items-center justify-center">
          {message.file_url || message.image_url ? (
            message.message_type === 'video' || message.file_url?.includes('video') ? (
              <video
                ref={mediaRef}
                src={message.file_url}
                className="max-w-full max-h-full rounded-lg"
                controls
                autoPlay
                style={{ pointerEvents: 'none' }}
              />
            ) : (
              <img
                ref={mediaRef}
                src={message.image_url || message.file_url}
                alt="View once"
                className="max-w-full max-h-full rounded-lg select-none"
                draggable={false}
                style={{ pointerEvents: 'none' }}
              />
            )
          ) : null}
        </div>

        {/* Warning Text */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600/80 backdrop-blur-md px-6 py-3 rounded-full">
          <p className="text-white text-sm font-medium flex items-center gap-2">
            <Ban className="w-4 h-4" />
            Screenshots & screen recording are blocked
          </p>
        </div>

        {/* Watermark overlay (invisible but prevents screenshots from being clear) */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="w-full h-full flex flex-wrap">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="text-white text-xs p-2 transform rotate-45">
                VIEW ONCE • {currentUserId}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Preview/Trigger view
  return (
    <div 
      onClick={handleView}
      className="relative cursor-pointer group overflow-hidden rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-1"
    >
      <div className="bg-white rounded-lg p-6 flex flex-col items-center justify-center gap-3 group-hover:bg-gray-50 transition-colors">
        <div className="relative">
          <Eye className="w-12 h-12 text-purple-600" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">1</span>
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-900">View Once</p>
          <p className="text-sm text-gray-500">
            {message.message_type === 'video' ? 'Video' : 'Photo'} • Tap to view
          </p>
        </div>
        <p className="text-xs text-gray-400">
          {allowSave ? '💾 Can be saved' : '🔒 Cannot be saved'}
        </p>
      </div>
    </div>
  );
};

export default ViewOnceMedia;
