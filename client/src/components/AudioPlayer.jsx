import React, { useRef, useState, useEffect } from 'react';
import MessageStatus from './MessageStatus';

const AudioPlayer = ({ senderName = 'Unknown', src = '', isOwnMessage = false, message = {} }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [bars, setBars] = useState([]);
  const BAR_COUNT = 30;
  const lottieRef = useRef(null);

  useEffect(() => {
    // generate waveform bars heights
    const arr = Array.from({ length: BAR_COUNT }).map(() => Math.floor(Math.random() * 24) + 8);
    setBars(arr);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setDuration(audio.duration);
    };
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [src]);

  // Load lottie player web component if needed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (window.customElements && window.customElements.get && window.customElements.get('lottie-player')) return;
    } catch (e) {
      // ignore
    }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    try {
      if (audioRef.current.paused) {
        await audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } catch (e) {
      console.error('Audio play error', e);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const val = Number(e.target.value);
    audioRef.current.currentTime = (val / 100) * duration;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value) / 100;
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
    if (isMuted && val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const speeds = [1, 1.5, 2];
  const [speedIndex, setSpeedIndex] = useState(0);
  const toggleSpeed = () => {
    const next = (speedIndex + 1) % speeds.length;
    setSpeedIndex(next);
    if (audioRef.current) audioRef.current.playbackRate = speeds[next];
  };

  // Sync lottie player with playback state
  useEffect(() => {
    const el = lottieRef.current;
    if (!el) return;
    if (isPlaying) {
      if (el.play) el.play();
    } else {
      if (el.pause) el.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const el = lottieRef.current;
    if (!el) return;
    if (el.setSpeed) el.setSpeed(speeds[speedIndex]);
  }, [speedIndex]);

  const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const foregroundClass = isOwnMessage ? 'text-white' : 'text-white';
  const playBg = isOwnMessage ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gray-700';
  const controlBg = isOwnMessage ? 'bg-green-50' : 'bg-gray-100';
  const barPlayed = isOwnMessage ? 'linear-gradient(to top, #10b981, #6ee7b7)' : 'linear-gradient(to top, #9ca3af, #6b7280)';

  return (
    <div>
      <style>{`
        .voice-note-card { background: #fff; padding: 12px 16px; border-radius: 24px; box-shadow: 0 12px 30px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04); width: 100%; max-width: 420px; box-sizing: border-box; display: flex; align-items: center; gap: 12px; position: relative; overflow: visible; }
        .play-btn { background: #f0f2f5; border: none; width: 54px; height: 54px; border-radius: 50%; display:flex; align-items:center; justify-content:center; cursor:pointer; transition: background 0.2s, transform 0.2s; flex-shrink:0 }
        .play-btn:hover { background:#e1e4e8; transform: scale(1.05); }
        .play-btn.playing svg { fill: #764ba2; }
        .waveform-container { flex: 1 1 auto; min-width: 0; position:relative; height:40px; display:flex; align-items:center; cursor:pointer; margin-right:10px }
        .waveform-bar { width:4px; margin:0 1px; border-radius:2px; background-color:#ebedf0; transition: height 0.2s ease, opacity 0.3s ease; height:10px }
        .waveform-overlay { position:absolute; left:0; top:0; height:100%; width:0%; overflow:hidden; display:flex; align-items:center; pointer-events:none; transition: width 0.1s linear }
        .waveform-overlay .waveform-bar { background: linear-gradient(to top, #667eea, #764ba2) !important }
        .waveform-container.playing .waveform-overlay .waveform-bar { background: linear-gradient(to top, #0052D4, #43C6AC) !important; opacity:1 }
        .waveform-container.playing #waveformBase .waveform-bar { background-image: linear-gradient(to top, #0052D4, #43C6AC); opacity:0.25 }
        .playing .waveform-bar { animation: wavePulse 1s infinite ease-in-out }
        .waveform-bar:nth-child(odd) { animation-duration: 0.8s }
        .waveform-bar:nth-child(2n) { animation-duration:1.1s }
        .waveform-bar:nth-child(3n) { animation-duration:1.3s }
        .waveform-bar:nth-child(4n) { animation-duration:0.9s }
        @keyframes wavePulse { 0%,100%{ transform: scaleY(1) } 50%{ transform: scaleY(1.4) } }
        .mascot-group { display:flex; flex-direction:column; align-items:center; justify-content:center; width:52px; flex-shrink:0 }
        .bird-container { position:relative; width:42px; height:42px; display:flex; justify-content:center; align-items:center; overflow:visible }
        .bird-container.bobbing { animation: headBob 0.6s infinite alternate ease-in-out }
        @keyframes headBob { 0% { transform: translateY(0) rotate(0deg) scale(1) } 100% { transform: translateY(-3px) rotate(5deg) scale(1.05) } }
        .time-display { font-size:11px; color:#8898aa; text-align:center; font-weight:700; margin-top:4px }
        .volume-container { display:flex; align-items:center; gap:6px; background:#f0f2f5; padding:4px 6px; border-radius:12px; max-width:120px }
        .volume-slider { width:44px; height:4px; -webkit-appearance:none; background:#cbd5e0; border-radius:2px }
        .speed-btn { background:#f0f2f5; color:#667eea; border:none; border-radius:12px; padding:6px 8px; font-size:12px; font-weight:700; cursor:pointer; min-width:36px }
        .controls-right { display:flex; align-items:center; gap:12px; flex-shrink:0 }
      `}</style>

      <div className={`voice-note-card ${isOwnMessage ? 'justify-end' : 'justify-start'}`} style={{ alignSelf: isOwnMessage ? 'flex-end' : 'flex-start' }}>
        <audio ref={audioRef} src={src} preload="metadata" />

        <button onClick={togglePlay} className={`play-btn ${isPlaying ? 'playing' : ''}`} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {!isPlaying ? (
            <svg viewBox="0 0 24 24" width={24} height={24}><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" fill="#667eea"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" width={24} height={24}><path d="M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z" fill="#764ba2"/></svg>
          )}
        </button>

        <div className={`waveform-container ${isPlaying ? 'playing' : ''}`} id="waveformContainer">
          <div id="waveformBase" style={{display:'flex', alignItems:'center', width:'100%', height:'100%'}}>
            {bars.map((h, i) => (
              <div key={i} className="waveform-bar" style={{ height: `${h}px` }} />
            ))}
          </div>
          <div className="waveform-overlay" id="waveformOverlay" style={{ width: `${progress}%` }}>
            <div id="waveformActive" style={{display:'flex', alignItems:'center', width:'100%', height:'100%'}}>
              {bars.map((h, i) => (
                <div key={i} className="waveform-bar" style={{ height: `${h}px` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="controls-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div className={`mascot-group ${isPlaying ? 'bobbing' : ''}`} style={{ width: 52 }}>
              <div className="bird-container">
                <lottie-player
                  ref={lottieRef}
                  src="https://bird-membership.tiiny.site/bird-membership.json"
                  background="transparent"
                  speed="1"
                  loop
                  style={{ width: 40, height: 40 }}
                ></lottie-player>
              </div>
              <div className="time-display">{formatTime(currentTime)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className={`volume-container`}>
                <button onClick={toggleMute} className="volume-btn" aria-label="Mute toggle">
                  {isMuted ? (
                    <svg width={18} height={18} viewBox="0 0 24 24"><path d="M16 7l5 5m0-5l-5 5" stroke="#667eea" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg width={18} height={18} viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3z" fill="#667eea"/></svg>
                  )}
                </button>
                <input type="range" min={0} max={100} value={isMuted ? 0 : Math.round(volume * 100)} onChange={handleVolumeChange} className="volume-slider" />
              </div>
              <button onClick={toggleSpeed} className="speed-btn">{[1,1.5,2][speedIndex]}x</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
