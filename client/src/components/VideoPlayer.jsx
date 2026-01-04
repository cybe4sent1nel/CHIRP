import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, Maximize, SkipBack, SkipForward } from 'lucide-react';

const VideoPlayer = ({ src, fileName = 'Video' }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      videoRef.current.currentTime = (e.target.value / 100) * duration;
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = e.target.value / 100;
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const handleSkip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error('Error requesting fullscreen:', err);
        });
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full max-w-2xl bg-black rounded-lg overflow-hidden shadow-lg group"
    >
      {/* Video */}
      <div className="relative bg-black aspect-video flex items-center justify-center">
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain"
          onClick={handlePlayPause}
        />

        {/* Play button overlay */}
        {!isPlaying && (
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors group-hover:opacity-100 opacity-0"
          >
            <Play size={48} className="text-white fill-white" />
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-3 space-y-2">
        {/* File name */}
        <p className="text-xs font-semibold text-white truncate">🎬 {fileName}</p>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 min-w-10">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="flex-1 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
          />
          <span className="text-xs text-gray-400 min-w-10">{formatTime(duration)}</span>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSkip(-10)}
              className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
              title="Rewind 10s"
            >
              <SkipBack size={16} className="text-white" />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
              onClick={() => handleSkip(10)}
              className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
              title="Forward 10s"
            >
              <SkipForward size={16} className="text-white" />
            </button>
          </div>

          {/* Volume and Fullscreen */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 max-w-32">
              <Volume2 size={16} className="text-white" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <button
              onClick={handleFullscreen}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
              title="Fullscreen"
            >
              <Maximize size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
