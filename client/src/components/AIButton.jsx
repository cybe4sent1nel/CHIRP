import React from 'react';

/**
 * Full-Spectrum Animated AI Button
 * Features a shifting rainbow gradient and glassmorphism foreground.
 */
const AIButton = ({ onClick, showMenu = false }) => {
  const text1 = "AI";
  const text2 = "AI...";

  return (
    <div className="ai-button-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600&display=swap');

        .ai-button-wrapper {
          --border-radius: 20px;
          --padding: 4px;
          --transition: 0.4s;
          /* Spectrum colors */
          --c1: #ff0000;
          --c2: #ff7300;
          --c3: #fffb00;
          --c4: #48ff00;
          --c5: #00ffd5;
          --c6: #002bff;
          --c7: #7a00ff;
          --c8: #ff00c8;
        }

        .btn-custom {
          user-select: none;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5em 1em;
          font-family: "Poppins", sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: white;
          
          /* The Spectrum Gradient */
          background: linear-gradient(
            45deg, 
            var(--c1), var(--c2), var(--c3), var(--c4), 
            var(--c5), var(--c6), var(--c7), var(--c8), var(--c1)
          );
          background-size: 400% 400%;
          
          /* Combined movement: sliding position + rotating hues */
          animation: 
            gradient-flow 8s linear infinite,
            hue-cycle 12s linear infinite;
          
          position: relative;
          border: none;
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 
            0 8px 20px -8px rgba(0,0,0,0.3),
            inset 0 1px 1px rgba(255,255,255,0.4);
        }

        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes hue-cycle {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }

        /* Outer Glow Layer */
        .btn-custom::before {
          content: "";
          position: absolute;
          top: -2px; left: -2px; right: -2px; bottom: -2px;
          background: inherit;
          border-radius: calc(var(--border-radius) + 2px);
          filter: blur(8px);
          opacity: 0.4;
          z-index: -1;
          transition: opacity 0.3s;
        }

        /* Inner Glass Layer for Text Contrast */
        .btn-custom::after {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(2px);
          border-radius: inherit;
          z-index: 0;
          transition: background 0.3s;
        }

        .btn-letter {
          position: relative;
          display: inline-block;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          z-index: 2;
        }

        .btn-svg {
          height: 18px;
          width: 18px;
          margin-right: 0.5rem;
          fill: white;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          animation: flicker 2s linear infinite;
          z-index: 2;
        }

        @keyframes flicker {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }

        .txt-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          min-width: 2.2em;
          z-index: 2;
        }

        .txt-1, .txt-2 {
          position: absolute;
          display: flex;
          left: 0;
        }

        .txt-1 { animation: appear-anim 0.5s ease-in-out forwards; }
        .txt-2 { opacity: 0; }

        @keyframes appear-anim {
          0% { opacity: 0; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* Focus States (Clicking/Tabbing) */
        .btn-custom:focus .txt-1 {
          animation: opacity-anim 0.3s ease-in-out forwards;
          animation-delay: 0.8s;
        }
        .btn-custom:focus .txt-2 {
          animation: opacity-anim 0.3s ease-in-out reverse forwards;
          animation-delay: 0.8s;
        }

        @keyframes opacity-anim {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        .btn-custom:focus .btn-letter {
          animation: focused-letter-anim 0.8s ease-in-out forwards;
        }

        @keyframes focused-letter-anim {
          50% {
            transform: scale(1.4);
            filter: brightness(1.5) drop-shadow(0 0 10px white);
          }
        }

        /* Interaction Effects */
        .btn-custom:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 25px -8px rgba(0,0,0,0.4);
        }
        
        .btn-custom:hover::before {
          opacity: 0.7;
        }

        .btn-custom:active {
          transform: translateY(1px) scale(0.98);
          filter: brightness(0.9);
        }

        /* Sequential Letter Delays */
        .btn-letter:nth-child(1) { animation-delay: 0s; }
        .btn-letter:nth-child(2) { animation-delay: 0.1s; }
        .btn-letter:nth-child(3) { animation-delay: 0.2s; }
        .btn-letter:nth-child(4) { animation-delay: 0.3s; }
        .btn-letter:nth-child(5) { animation-delay: 0.4s; }
        .btn-letter:nth-child(6) { animation-delay: 0.5s; }
        .btn-letter:nth-child(7) { animation-delay: 0.6s; }
        .btn-letter:nth-child(8) { animation-delay: 0.7s; }
        .btn-letter:nth-child(9) { animation-delay: 0.8s; }
        .btn-letter:nth-child(10) { animation-delay: 0.9s; }
      `}</style>

      <button className="btn-custom outline-none" onClick={onClick}>
        <svg className="btn-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
        </svg>

        <div className="txt-wrapper">
          <div className="txt-1">
            {text1.split("").map((char, i) => (
              <span key={`t1-${i}`} className="btn-letter">{char}</span>
            ))}
          </div>
          <div className="txt-2">
            {text2.split("").map((char, i) => (
              <span key={`t2-${i}`} className="btn-letter">{char}</span>
            ))}
          </div>
        </div>
      </button>
    </div>
  );
};

export default AIButton;
