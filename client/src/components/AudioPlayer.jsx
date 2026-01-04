import React, { useRef, useState, useEffect } from 'react';

const AudioPlayer = ({ senderName = 'Unknown', src = '' }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      audioRef.current.currentTime = (e.target.value / 100) * duration;
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = e.target.value / 100;
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleMuteToggle = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
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
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, []);
  return (
    <div className="flex flex-col items-center group/he select-none">
      <audio ref={audioRef} src={src} />
      <div className="relative z-0 h-16 -mb-2 transition-all duration-200 group-hover/he:h-0">
        <svg width={128} height={128} viewBox="0 0 128 128" className="duration-500 border-4 rounded-full shadow-md border-zinc-400 border-spacing-5 animate-[spin_3s_linear_infinite] transition-all">
          <svg>
            <rect width={128} height={128} fill="black" />
            <circle cx={20} cy={20} r={2} fill="white" />
            <circle cx={40} cy={30} r={2} fill="white" />
            <circle cx={60} cy={10} r={2} fill="white" />
            <circle cx={80} cy={40} r={2} fill="white" />
            <circle cx={100} cy={20} r={2} fill="white" />
            <circle cx={120} cy={50} r={2} fill="white" />
            <circle cx={90} cy={30} r={10} fill="white" fillOpacity="0.5" />
            <circle cx={90} cy={30} r={8} fill="white" />
            <path d="M0 128 Q32 64 64 128 T128 128" fill="purple" stroke="black" strokeWidth={1} />
            <path d="M0 128 Q32 48 64 128 T128 128" fill="mediumpurple" stroke="black" strokeWidth={1} />
            <path d="M0 128 Q32 32 64 128 T128 128" fill="rebeccapurple" stroke="black" strokeWidth={1} />
            <path d="M0 128 Q16 64 32 128 T64 128" fill="purple" stroke="black" strokeWidth={1} />
            <path d="M64 128 Q80 64 96 128 T128 128" fill="mediumpurple" stroke="black" strokeWidth={1} />
          </svg>
        </svg>
        <div className="absolute z-10 w-8 h-8 bg-white border-4 rounded-full shadow-sm border-zinc-400 top-12 left-12" />
      </div>
      <div className="z-30 flex flex-col w-40 h-24 transition-all duration-300 bg-white shadow-md group-hover/he:h-40 group-hover/he:w-72 rounded-2xl shadow-zinc-400">
        <div className="flex flex-row w-full h-0 group-hover/he:h-20">
          <div className="relative flex items-center justify-center w-24 h-24 group-hover/he:-top-6 group-hover/he:-left-4 opacity-0 group-hover/he:animate-[spin_3s_linear_infinite] group-hover/he:opacity-100 transition-all duration-100">
            <svg width={96} height={96} viewBox="0 0 128 128" className="duration-500 border-4 rounded-full shadow-md border-zinc-400 border-spacing-5">
              <svg>
                <rect width={128} height={128} fill="black" />
                <circle cx={20} cy={20} r={2} fill="white" />
                <circle cx={40} cy={30} r={2} fill="white" />
                <circle cx={60} cy={10} r={2} fill="white" />
                <circle cx={80} cy={40} r={2} fill="white" />
                <circle cx={100} cy={20} r={2} fill="white" />
                <circle cx={120} cy={50} r={2} fill="white" />
                <circle cx={90} cy={30} r={10} fill="white" fillOpacity="0.5" />
                <circle cx={90} cy={30} r={8} fill="white" />
                <path d="M0 128 Q32 64 64 128 T128 128" fill="purple" stroke="black" strokeWidth={1} />
                <path d="M0 128 Q32 48 64 128 T128 128" fill="mediumpurple" stroke="black" strokeWidth={1} />
                <path d="M0 128 Q32 32 64 128 T128 128" fill="rebeccapurple" stroke="black" strokeWidth={1} />
                <path d="M0 128 Q16 64 32 128 T64 128" fill="purple" stroke="black" strokeWidth={1} />
                <path d="M64 128 Q80 64 96 128 T128 128" fill="mediumpurple" stroke="black" strokeWidth={1} />
              </svg>
            </svg>
            <div className="absolute z-10 w-6 h-6 bg-white border-4 rounded-full shadow-sm border-zinc-400 top-9 left-9" />
          </div>
          <div className="flex flex-col justify-center w-full pl-3 -ml-24 overflow-hidden group-hover/he:-ml-3 text-nowrap">
            <p className="text-xl font-bold">{senderName}</p>
            <p className="text-zinc-600">Audio message</p>
          </div>
        </div>
        <div className="flex flex-row mx-3 mt-1 bg-indigo-100 rounded-md min-h-4 group-hover/he:mt-0">
          <span className="hidden pl-3 text-sm text-zinc-600 group-hover/he:inline-block">{formatTime(currentTime)}</span>
          <input type="range" min={0} max={100} value={duration ? (currentTime / duration) * 100 : 0} onChange={handleSeek} className="w-24 group-hover/he:w-full flex-grow h-1 mx-2 my-auto bg-gray-300 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md" />
          <span className="hidden pr-3 text-sm text-zinc-600 group-hover/he:inline-block">{formatTime(duration)}</span>
        </div>

        <div className="hidden group-hover/he:flex flex-row mx-3 mt-2 items-center gap-2 bg-green-100 rounded-md px-3 py-2">
          <button onClick={handleMuteToggle} className="flex items-center justify-center flex-shrink-0">
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="feather feather-volume-x">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1={23} y1={9} x2={17} y2={15} />
                <line x1={17} y1={9} x2={23} y2={15} />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="feather feather-volume-2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>
          <input type="range" min={0} max={100} value={isMuted ? 0 : volume * 100} onChange={handleVolumeChange} className="flex-grow h-1 bg-green-300 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md" />
          <span className="text-xs text-green-700 font-semibold min-w-6">{Math.round(isMuted ? 0 : volume * 100)}%</span>
        </div>
        <div className="flex flex-row items-center justify-center flex-grow mx-3 space-x-4 py-2">
          <label htmlFor="playMode" className="flex items-center justify-center w-0 h-full cursor-pointer group-hover/he:w-8">
            <input type="checkbox" id="playMode" className="hidden peer/playMode" />
            <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="feather feather-repeat peer-checked/playMode:hidden">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="hidden feather feather-shuffle peer-checked/playMode:inline-block">
              <polyline points="16 3 21 3 21 8" />
              <line x1={4} y1={20} x2={21} y2={3} />
              <polyline points="21 16 21 21 16 21" />
              <line x1={15} y1={15} x2={21} y2={21} />
              <line x1={4} y1={4} x2={9} y2={9} />
            </svg>
          </label>
          <button className="flex items-center justify-center w-9 h-9 cursor-pointer bg-indigo-100 hover:bg-indigo-200 rounded-full transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="feather feather-skip-back">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1={5} y1={19} x2={5} y2={5} />
            </svg>
          </button>
          <button onClick={handlePlayPause} className="flex items-center justify-center w-12 h-12 cursor-pointer bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all">
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="feather feather-pause">
                <rect x={6} y={4} width={4} height={16} />
                <rect x={14} y={4} width={4} height={16} />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="feather feather-play">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>
          <button className="flex items-center justify-center w-9 h-9 cursor-pointer bg-indigo-100 hover:bg-indigo-200 rounded-full transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="feather feather-skip-forward">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1={19} y1={5} x2={19} y2={19} />
            </svg>
          </button>

        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;
