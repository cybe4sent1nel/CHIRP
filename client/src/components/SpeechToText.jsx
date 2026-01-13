import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Send, X } from 'lucide-react';
import toast from 'react-hot-toast';

// Replace existing SpeechToText UI with the provided "Chirp Flow" card
export default function ChirpFlow({ onSend, placeholder = 'Start speaking...' }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCard, setShowCard] = useState(false);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const hasSpokenRef = useRef(false);
  const speakingTimeoutRef = useRef(null);
  const transcriptRef = useRef('');
  const userEditedRef = useRef(false);
  const userEditedTimerRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      hasSpokenRef.current = false;
    };

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += t + ' ';
          hasSpokenRef.current = true;
        } else interimText += t;
      }
      if (finalText) {
        // use ref to avoid stale closure values
        const next = (transcriptRef.current || '') + finalText;
        transcriptRef.current = next;
        setTranscript(next);
      }
      setInterimTranscript(interimText);

      // immediately push live text to parent so input updates without waiting for effect
      const combinedNow = ((transcriptRef.current || '') + ' ' + interimText).trim();
      if (combinedNow) onSend?.(combinedNow);

      setIsSpeaking(true);
      if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = setTimeout(() => setIsSpeaking(false), 300);

      // NOTE: removed automatic stop-on-silence to allow continuous listening
      // if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      // silenceTimerRef.current = setTimeout(() => {
      //   if (hasSpokenRef.current && (transcript.trim())) stopListening();
      // }, 2000);
    };

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      stopListening();
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      // Do not auto-show the separate preview modal; keep transcript in parent input
    };

    recognitionRef.current = recognition;
    return () => {
      recognitionRef.current?.stop?.();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
    };
  }, []);

  // Push live transcript (final + interim) to parent input so it fills the composer
  useEffect(() => {
    const combined = (transcript + ' ' + interimTranscript).trim();
    // if the user recently edited the input manually, don't overwrite it
    if (userEditedRef.current) return;
    // send combined transcript when available
    if (combined) {
      onSend?.(combined);
    }
  }, [transcript, interimTranscript, onSend]);

  // Detect user edits in inputs (backspace, typing, paste) to avoid stomping user changes
  useEffect(() => {
    const markUserEdited = () => {
      userEditedRef.current = true;
      if (userEditedTimerRef.current) clearTimeout(userEditedTimerRef.current);
      userEditedTimerRef.current = setTimeout(() => {
        userEditedRef.current = false;
      }, 1500);
    };

    document.addEventListener('input', markUserEdited, true);
    document.addEventListener('keydown', (e) => {
      // consider backspace, delete, ctrl/cmd+a then backspace as user edit
      if (e.key === 'Backspace' || e.key === 'Delete') markUserEdited();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') markUserEdited();
    }, true);
    document.addEventListener('paste', markUserEdited, true);

    return () => {
      document.removeEventListener('input', markUserEdited, true);
      document.removeEventListener('keydown', markUserEdited, true);
      document.removeEventListener('paste', markUserEdited, true);
      if (userEditedTimerRef.current) clearTimeout(userEditedTimerRef.current);
    };
  }, []);

  const startListening = () => {
    // keep existing transcript so parent input shows live transcription
    setInterimTranscript('');
    setShowPreview(false);
    hasSpokenRef.current = false;
    try {
      if (!recognitionRef.current) {
        toast.error('Speech recognition not available in this browser');
        return;
      }
      recognitionRef.current.start();
      toast.success('Listening... Speak now', { duration: 1200 });
      setIsListening(true);
    } catch (e) {
      console.error(e);
      toast.error('Unable to start microphone');
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      console.error(e);
    }
    setIsListening(false);
  };

  const handleSend = () => {
    const text = transcript.trim();
    if (!text) return toast.error('No text to send');
    onSend?.(text);
    setTranscript('');
    transcriptRef.current = '';
    setInterimTranscript('');
    setShowPreview(false);
    toast.success('Message added');
  };

  const handleCancel = () => {
    setTranscript('');
    transcriptRef.current = '';
    setInterimTranscript('');
    setShowPreview(false);
    stopListening();
  };

  const [flowButtonId] = useState(() => `flow-btn-${Math.random().toString(36).slice(2,9)}`);

  const toggleCard = () => {
    setShowCard((s) => {
      const next = !s;
      if (next) {
        try {
          // when opening, allow recognition to write into the input
          userEditedRef.current = false;
          startListening();
        } catch (e) {
          console.debug('startListening failed', e);
        }
      } else {
        try {
          // when closing, stop and clear transcripts so input is not later overwritten
          stopListening();
        } catch (e) {
          console.debug('stopListening failed', e);
        }
        setTranscript('');
        transcriptRef.current = '';
        setInterimTranscript('');
        try { onSend?.(''); } catch (e) { /* ignore */ }
      }
      return next;
    });
  };

  return (
    <StyledWrapper>
      {/* Small Flow button placed inline with other controls */}
      <button className="flow-button" onClick={toggleCard} aria-expanded={showCard} aria-controls={flowButtonId} title="Open Chirp Flow">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M2 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 6v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M14 10v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M18 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {showCard && (
        <div id={flowButtonId} className="overlay" onClick={(e) => { if (e.target.classList.contains('overlay')) setShowCard(false); }}>
          <div className="grid">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="area" />
            ))}
            <label className="wrap">
              <input type="checkbox" checked={isListening} onChange={(e) => (e.target.checked ? startListening() : stopListening())} />
              <div className="card" onClick={() => { if (isListening) stopListening(); else startListening(); }}>
                <div className="wave" />
                <div className="outline" />
                <div className="circle-1">
                  <div className="lines">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 463 462" stroke="currentColor" height={462} width={463}>
                      {[...Array(100)].map((_, idx) => (
                        <path key={idx} strokeLinecap="round" d="M231.5 97V5" style={{ ['--i']: idx + 1 }} />
                      ))}
                    </svg>
                  </div>
                </div>
                <div className="circle-2">
                  <div className="bg" />
                </div>
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="icon-1">
                    <defs>
                      <linearGradient y2="100%" x2="0%" y1="0%" x1="0%" id="grad-1">
                        <stop stopColor="rgba(255, 255, 255, 0.6)" offset="0%" />
                        <stop stopColor="rgba(255, 255, 255, 0.2)" offset="100%" />
                      </linearGradient>
                    </defs>
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 1 0 6 0V5a3 3 0 0 0-3-3zM5 12a1 1 0 1 1 2 0 5 5 0 0 0 10 0 1 1 0 1 1 2 0 7.001 7.001 0 0 1-6 6.93V21a1 1 0 1 1-2 0v-2.07A7.001 7.001 0 0 1 5 12z" clipRule="evenodd" fillRule="evenodd" fill="url(#grad-1)" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 800 800" className="icon-2">
                    <path d="M623.961 465.502C630.134 444.383 633.336 422.34 633.333 400C633.333 391.16 629.822 382.681 623.57 376.43C617.319 370.179 608.841 366.667 600 366.667C591.16 366.667 582.681 370.179 576.43 376.43C570.179 382.681 566.667 391.16 566.667 400C566.667 402.679 566.602 405.351 566.474 408.015L623.961 465.502ZM546.326 479.791C538.769 493.651 529.215 506.487 517.851 517.851C486.595 549.107 444.203 566.667 400 566.667C355.797 566.667 313.405 549.107 282.149 517.851C250.893 486.595 233.333 444.203 233.333 400C233.333 391.16 229.822 382.681 223.57 376.43C217.319 370.179 208.841 366.667 200 366.667C191.16 366.667 182.681 370.179 176.43 376.43C170.179 382.681 166.667 391.16 166.667 400C166.659 456.117 186.873 510.358 223.605 552.783C260.337 595.208 311.126 622.977 366.667 631V700C366.667 708.841 370.179 717.319 376.43 723.57C382.681 729.822 391.16 733.333 400 733.333C408.841 733.333 417.319 729.822 423.57 723.57C429.822 717.319 433.333 708.841 433.333 700V631C488.874 622.977 539.663 595.208 576.395 552.783C583.12 545.015 589.292 536.851 594.887 528.352L546.326 479.791ZM500 341.541V166.667C500 140.145 489.464 114.71 470.711 95.9561C451.957 77.2024 426.522 66.6667 400 66.6667C373.478 66.6667 348.043 77.2024 329.289 95.9561C315.947 109.299 306.764 126.024 302.576 144.116L500 341.541ZM300 233.464L495.664 429.128C490.926 444.686 482.421 459.001 470.711 470.711C451.957 489.464 426.522 500 400 500C373.478 500 348.043 489.464 329.289 470.711C310.536 451.957 300 426.522 300 400V233.464Z" clipRule="evenodd" fillRule="evenodd" />
                    <path strokeLinecap="round" strokeWidth={60} stroke="white" d="M150.368 125.871L667.5 643.002" className="cut" />
                  </svg>
                </div>
                <footer>
                  <p>
                    <span className="bold" style={{ ['--i']: 1 }}>chirp flow</span>
                    <span style={{ ['--i']: 2 }}>voice commands</span>
                  </p>
                </footer>
              </div>
            </label>
          </div>

          {/* Preview modal removed — live transcript is sent to parent input */}
        </div>
      )}
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .flow-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 999px;
    background: white;
    border: 1px solid rgba(0,0,0,0.06);
    box-shadow: 0 4px 10px rgba(0,0,0,0.06);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    position: relative;
    z-index: 10002;
  }
  .flow-button:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }

  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
    background: transparent;
    pointer-events: auto;
  }

  .grid {
    --perspective: 800px;

    position: absolute;
    width: 660px;
    height: 420px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    transform-style: preserve-3d;
    pointer-events: none;
  }

  .grid .area {
    width: 64px;
    height: 64px;
    align-self: center;
    justify-self: center;
    pointer-events: auto;
  }

  .grid .area {
    pointer-events: auto;
  }

  .grid .area {
    position: relative;
    z-index: 1;
  }

  .grid input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }

  .grid::after,
  .grid::before {
    content: "";
    position: absolute;
    inset: 0;
    margin: auto;
    filter: blur(70px);
    opacity: 0.5;
    pointer-events: none;
  }
  .grid::after {
    width: 600px;
    height: 380px;
    background: radial-gradient(#f0d4e9 100%, #ae98c7 0%);
    transform: translateZ(-100px) translateX(-40px) translateY(-120px);
  }
  .grid::before {
    width: 500px;
    height: 500px;
    background: radial-gradient(#b0a8d9 100%, #a2a1bf 0%);
    transform: translateZ(-120px) translateX(100px) translateY(100px);
  }

  .wrap {
    display: flex;
    align-items: center;
    justify-items: center;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    z-index: 9;
    transform-style: preserve-3d;
    cursor: pointer;
  }

  .card {
    transform-style: preserve-3d;
    padding: 7px 7px 7px 7px;
    will-change: transform;
    transition: all 0.6s ease;
    width: 326px;
    height: 360px;
    border-radius: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      0 10px 40px rgba(0, 0, 60, 0.25),
      inset 0 0 10px rgba(255, 255, 255, 0.5);
    padding-bottom: 70px;
    pointer-events: auto;
  }
  .card::before {
    content: "";
    position: absolute;
    inset: 1px;
    border-radius: inherit;
    z-index: -1;
    transition: all 0.5s linear;
    background: rgba(208, 228, 255, 0.3);
    backdrop-filter: blur(10px);
  }

  .outline {
    position: absolute;
    overflow: hidden;
    inset: 0;
    outline: none;
    transition: all 0.4s ease;
    border-radius: 27px;
    transform-style: preserve-3d;
  }
  .outline::before {
    content: "";
    position: absolute;
    inset: 0;
    width: 400px;
    height: 550px;
    margin: auto;
    background: linear-gradient(
      to right,
      transparent 0%,
      white 50%,
      transparent 100%
    );
    animation: rotate 3s linear infinite;
    transform: translateZ(10px);
    animation-play-state: paused;
  }

  .wave {
    position: absolute;
    width: 200px;
    height: 200px;
    inset: 0;
    bottom: 60px;
    margin: auto;
    opacity: 0;
    transition: all 0.3s linear;
  }
  .wave::before,
  .wave::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 0 30px rgba(106, 76, 172, 0.5);
    filter: blur(2px);
    inset: 0;
    animation: wave 1.5s linear infinite;
  }
  .wave::after {
    animation-delay: 0.4s;
  }

  .circle-1 {
    width: 224px;
    height: 224px;
    border-radius: 50%;
    position: absolute;
    box-shadow:
      inset 0 0 3px 0 white,
      inset 60px 40px 30px -40px rgba(106, 76, 172, 0.15),
      20px 20px 70px -5px rgb(150, 166, 197),
      -50px -50px 70px 20px rgba(255, 255, 255, 0.7),
      inset 0 0 30px 0 white;
    background: hsl(0deg 0% 70% / 10%);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: circle1 4.2s ease-in-out infinite 0.3s;
    transform-style: preserve-3d;
    z-index: 1;
    --z: 0px;
  }
  .circle-1::after,
  .circle-1::before {
    content: "";
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    width: 30%;
    height: 30%;
  }
  .circle-1::before {
    background: #ff0073;
    top: 30%;
    right: 30%;
  }
  .circle-1::after {
    background: #00baff;
    bottom: 10%;
    left: 30%;
  }
  .circle-1 .lines {
    animation: rotate 30s linear infinite;
  }
  .circle-1 .lines svg {
    stroke: white;
    animation: lines 3s ease-in-out infinite;
    stroke-width: 2px;
  }
  .circle-1 .lines path {
    animation: line 3s ease-in-out calc(var(--i) * -1s) infinite;
    stroke-dasharray: 100;
    stroke-dashoffset: 10;
    transition: all 0.3s linear;
  }
  .circle-2 {
    width: 123px;
    height: 123px;
    border-radius: 50%;
    position: absolute;
    transform-style: preserve-3d;
    animation: circle2 4.2s ease-in-out infinite;
    background-color: white;
    z-index: 9;
    --z: 10px;
  }
  .circle-2::before,
  .circle-2::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    filter: blur(30px);
    z-index: 1;
  }
  .circle-2::before {
    background: #ff0073;
    width: 30%;
    height: 30%;
    top: 20%;
    right: 20%;
  }
  .circle-2::after {
    background: #00bbff;
    width: 20%;
    height: 20%;
    bottom: 10%;
    left: 40%;
  }
  .circle-2 .bg {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    box-shadow:
      inset 0 0 25px 10px rgba(255, 255, 255, 0.8),
      0 0 10px 10px rgba(255, 255, 255, 0.9);
    background-color: #9292d8;
    animation: bgRotate 2.5s linear infinite;
    animation-play-state: paused;
    transition: all 0.3s ease;
  }
  .circle-2 .bg::before {
    content: "";
    position: absolute;
    inset: 0;
    animation: bg 4s linear infinite;
    border-radius: inherit;
    transition: all 0.4s linear;
    box-shadow: inset 0 0 25px 10px rgba(255, 255, 255, 0.8);
    opacity: 0;
  }

  .icon {
    transform: translateZ(50px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 4px;
    position: absolute;
    z-index: 1;
  }
  .icon svg {
    width: 64px;
    transition: all 0.8s cubic-bezier(0.7, -1, 0.3, 1.5);
    position: absolute;
  }
  .icon-2 {
    transform: translateY(80px) scale(0.7) rotateX(90deg);
    filter: blur(2px);
    opacity: 0;
    mask-image: linear-gradient(
      to bottom,
      rgb(255 255 255 / 100%) 10%,
      rgb(255 255 255 / 20%)
    );
  }
  .icon-2 .cut {
    stroke-dasharray: 732;
    stroke-dashoffset: 732;
    animation: reducePath 0.5s ease forwards;
  }

  .card footer {
    transform: translateZ(10px);
    padding: 12px 18px;
    position: absolute;
    bottom: 17px;
    left: 17px;
    right: 17px;
    transform-style: preserve-3d;
  }
  .card footer::before {
    content: "";
    border-radius: 15px;
    animation: footer 9s ease infinite 0.8s;
    position: absolute;
    z-index: -1;
    inset: 0;
    filter: blur(15px) brightness(1.5);
    transform: scaleY(0);
    background: rgba(236, 237, 246, 0.7);
    box-shadow:
      inset 0 0 2px 0 white,
      0 5px 10px -5px rgba(0, 0, 60, 0.25);
    backdrop-filter: blur(5px);
    background: linear-gradient(
      to bottom,
      rgb(242 243 252 / 80%) 0%,
      rgb(220 220 232 / 80%) 100%
    );
  }
  .card footer p {
    display: flex;
    flex-wrap: wrap;
    gap: 0 4px;
    font-size: 11px;
    position: relative;
    z-index: 10;
    transform: translateZ(20px);
    line-height: 17px;
    transition: all 0.3s ease;
    color: #696969;
  }
  .card footer .bold {
    font-weight: 600;
    color: black;
  }
  .card footer span {
    display: inline-block;
    animation: labels 9s ease calc(1s + var(--i) * 0.05s) infinite;
    opacity: 0;
  }

  /** STATES */

  .wrap input:checked + .card .circle-1,
  .wrap input:checked + .card .circle-2,
  .wrap input:checked + .card .circle-1 .lines,
  .wrap input:checked + .card .circle-1 .lines svg,
  .wrap input:checked + .card .circle-1 .lines path,
  .wrap input:checked + .card .outline::before,
  .wrap input:checked + .card .circle-2 .bg {
    animation-play-state: paused;
  }
  .wrap input:checked + .card .circle-1 .lines path {
    opacity: 0;
  }
  .wrap input:checked + .card .wave {
    opacity: 0;
  }
  .wrap:hover .card:before {
    backdrop-filter: blur(10px);
    background: transparent;
  }
  .wrap:hover .outline::before {
    animation-play-state: running;
  }
  .wrap:hover input:checked + .card .icon-2 {
    transform: translateY(80px) scale(0.7) rotateX(90deg);
    filter: blur(2px);
    opacity: 0;
  }
  .wrap:hover input:checked + .card .icon-1 {
    transform: none;
    filter: none;
    opacity: 1;
  }
  .wrap:hover .icon-1 {
    transform: translateY(-80px) scale(0.7) rotateX(90deg);
    filter: blur(2px);
    opacity: 0;
  }
  .wrap:hover .icon-2 {
    transform: none;
    filter: none;
    opacity: 0.6;
  }
  .wrap:hover .icon-2 .cut {
    animation: growPath 0.3s ease 0.6s forwards;
  }
  .wrap:hover footer p {
    transform: translateY(-4px) translateZ(20px);
  }

  .wrap:hover .bg {
    animation-play-state: running;
  }

  .wrap:hover .wave {
    opacity: 1;
  }
  .wrap:hover .circle-2 .bg::before {
    opacity: 0.2;
  }

  .wrap:hover .card {
    transform: perspective(var(--perspective)) rotateX(0) rotateY(0)
      scale3d(1, 1, 1);
  }

  .area:nth-child(15):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(-15deg) rotateY(15deg)
      scale3d(1, 1, 1);
  }
  .area:nth-child(14):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(-15deg) rotateY(7deg)
      scale3d(1, 1, 1);
  }
  .area:nth-child(13):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(-15deg) rotateY(0)
      scale3d(1, 1, 1);
  }
  .area:nth-child(12):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(-15deg) rotateY(-7deg)
      scale3d(1, 1, 1);
  }
  .area:nth-child(11):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(-15deg) rotateY(-15deg)
      scale3d(1, 1, 1);
  }

  .area:nth-child(10):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(0) rotateY(15deg)
      scale3d(1, 1, 1);
  }
  .area:nth-child(9):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(0) rotateY(7deg)
      scale3d(1, 1, 1);
  }
  .area:nth-child(8):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(0) rotateY(0)
      scale3d(1, 1, 1);
  }
  .area:nth-child(7):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(0) rotateY(-7deg)
      scale3d(1, 1, 1);
  }
  .area:nth-child(6):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(0) rotateY(-15deg)
      scale3d(1, 1, 1);
  }

  .area:nth-child(5):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(15deg) rotateY(15deg)
      scale3d(1, 1, 1);
  }
  .area:nth-child(4):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(15deg) rotateY(7deg)
      scale3d(1, 1, 1);
  }
  .area:nth-child(3):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(15deg) rotateY(0)
      scale3d(1, 1, 1);
  }
  .area:nth-child(2):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(15deg) rotateY(-7deg)
      scale3d(1, 1, 1);
  }
  .area:nth-child(1):hover ~ .wrap .card {
    transform: perspective(var(--perspective)) rotateX(15deg) rotateY(-15deg)
      scale3d(1, 1, 1);
  }

  @keyframes lines {
    0% {
      transform: scale(0.41);
    }

    15% {
      transform: scale(0.37);
    }

    36% {
      transform: scale(0.41);
    }

    50% {
      transform: scale(0.38);
    }

    65% {
      transform: scale(0.43);
    }

    80% {
      transform: scale(0.39);
    }

    100% {
      transform: scale(0.41);
    }
  }

  @keyframes line {
    0% {
      stroke-dashoffset: 10;
    }
    50% {
      stroke-dashoffset: 45;
    }
    100% {
      stroke-dashoffset: 10;
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes circle1 {
    0% {
      transform: scale(0.97) translateZ(calc(20px + var(--z)));
    }
    15% {
      transform: scale(1) translateZ(calc(30px + var(--z)));
    }
    30% {
      transform: scale(0.98) translateZ(calc(20px + var(--z)));
    }
    45% {
      transform: scale(1) translateZ(calc(30px + var(--z)));
    }
    60% {
      transform: scale(0.97) translateZ(calc(20px + var(--z)));
    }
    85% {
      transform: scale(1) translateZ(calc(30px + var(--z)));
    }
    100% {
      transform: scale(0.97) translateZ(calc(20px + var(--z)));
    }
  }

  @keyframes circle2 {
    0% {
      transform: scale(1) translateZ(calc(20px + var(--z)));
    }
    15% {
      transform: scale(1.03) translateZ(calc(30px + var(--z)));
    }
    30% {
      transform: scale(0.98) translateZ(calc(20px + var(--z)));
    }
    45% {
      transform: scale(1.04) translateZ(calc(30px + var(--z)));
    }
    60% {
      transform: scale(0.97) translateZ(calc(20px + var(--z)));
    }
    85% {
      transform: scale(1.03) translateZ(calc(30px + var(--z)));
    }
    100% {
      transform: scale(1) translateZ(calc(20px + var(--z)));
    }
  }

  @keyframes growPath {
    from {
      stroke-dashoffset: 732;
    }
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes reducePath {
    from {
      stroke-dashoffset: 0;
    }
    to {
      stroke-dashoffset: 732;
    }
  }

  @keyframes bgRotate {
    0% {
      transform: rotate(0deg);
    }
    20% {
      transform: rotate(90deg);
    }
    40% {
      transform: rotate(180deg) scale(0.95, 1);
    }
    60%,
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes bg {
    20% {
      background-color: red;
    }
    40% {
      background-color: #5eff7e;
    }
    60% {
      background-color: #2cb5ff;
    }
    80% {
      background-color: #fc63ff;
    }
  }

  @keyframes wave {
    0% {
      transform: scale(1);
      opacity: 0;
      box-shadow: 0 0 30px rgba(106, 76, 172, 0.9);
    }
    35% {
      transform: scale(1.3);
      opacity: 1;
    }
    70%,
    100% {
      transform: scale(1.6);
      opacity: 0;
      box-shadow: 0 0 30px rgba(106, 76, 172, 0.3);
    }
  }

  @keyframes footer {
    0%,
    3% {
      transform: scaleY(0);
      filter: blur(15px) brightness(1.5);
    }
    10%,
    82% {
      filter: blur(0);
      transform: scaleY(1);
    }
    86% {
      transform: scaleY(0);
      filter: blur(15px) brightness(1.5);
    }
  }

  @keyframes labels {
    0% {
      transform: translateY(-30px) rotate(-30deg);
      filter: blur(10px);
    }
    5% {
      transform: translateY(10px);
      filter: blur(0);
    }
    10% {
      transform: translateY(0);
      opacity: 1;
    }
    73% {
      transform: translateY(0);
      opacity: 1;
    }
    76% {
      transform: translateY(-5px);
      filter: blur(0);
    }
    80% {
      transform: translateY(15px);
      opacity: 0;
      filter: blur(5px);
    }
  }
`;
