import React, { useMemo } from 'react';

/**
 * Brutalist QR Assembly Component - Compact Version for Profile
 * Features:
 * - Compact size suitable for profile page
 * - Clean animation with magnetic snap effect
 * - Proper 21x21 QR grid
 */
const BrutalistQRButton = ({ onClick }) => {
  const gridSize = 21;

  // Generate a standard 21x21 QR Matrix
  const qrPattern = useMemo(() => {
    const matrix = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));

    const isReserved = (r, c) => {
      // Reserved areas for Finders + Separators
      if (r < 8 && c < 8) return true;
      if (r < 8 && c >= 13) return true;
      if (r >= 13 && c < 8) return true;
      // Timing patterns
      if (r === 6 || c === 6) return true;
      return false;
    };

    const placeFinder = (row, col) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            (r === 0 || r === 6) ||
            (c === 0 || c === 6) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[row + r][col + c] = 1;
          }
        }
      }
    };

    placeFinder(0, 0);
    placeFinder(0, 14);
    placeFinder(14, 0);

    // Timing Patterns
    for (let i = 8; i < 13; i++) {
      if (i % 2 === 0) {
        matrix[6][i] = 1;
        matrix[i][6] = 1;
      }
    }

    // Data Bits
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (!isReserved(r, c)) {
          if (((r + c) % 2 === 0 && (r * c) % 3 === 0) || Math.random() > 0.6) {
            matrix[r][c] = 1;
          }
        }
      }
    }
    
    if (matrix[13]) matrix[13][8] = 1; 

    return matrix;
  }, []);

  const modules = useMemo(() => {
    const list = [];
    const cellSize = 100 / gridSize;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (qrPattern[r][c] === 1) {
          const ox = (Math.random() - 0.5) * 150; 
          const oy = (Math.random() - 0.5) * 150;
          const delay = Math.random() * 0.25;
          const color = '#000000';

          list.push({
            x: c * cellSize,
            y: r * cellSize,
            width: cellSize + 0.2,
            height: cellSize + 0.2,
            ox,
            oy,
            delay,
            color
          });
        }
      }
    }
    return list;
  }, [qrPattern]);

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap');

          .brutalist-qr-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100px;
            height: 100px;
            background-color: #d1fae5; 
            border: 3px solid #10b981;
            border-radius: 16px;
            position: relative;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            overflow: hidden;
            outline: none;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }

          .brutalist-qr-button:hover {
            transform: scale(1.05);
            border-color: transparent;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            background: linear-gradient(
              135deg, 
              #ff9a9e 0%, 
              #fad0c4 20%, 
              #fbc2eb 40%, 
              #a18cd1 60%, 
              #84fab0 80%, 
              #8fd3f4 100%
            );
            background-size: 300% 300%;
            animation: rainbow-shift 3s ease infinite;
          }

          @keyframes rainbow-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .rest-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: absolute;
            z-index: 10;
            transition: all 0.3s ease;
            opacity: 1;
            transform: scale(1);
          }

          .brutalist-qr-button:hover .rest-content {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
            pointer-events: none;
          }

          .mini-qr-icon {
            width: 32px;
            height: 32px;
            fill: #ffffff;
            margin-bottom: 4px;
            transition: fill 0.3s ease;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
          }

          .rest-text {
            color: #064e3b;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .qr-wrapper {
            width: 70px;
            height: 70px;
            z-index: 5;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
          }

          .qr-svg {
            width: 100%;
            height: 100%;
            overflow: visible;
          }

          .module {
            transform-origin: center;
            shape-rendering: crispEdges;
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            fill: var(--mod-color);
            opacity: 0;
            transform: translate(calc(var(--ox) * 1px), calc(var(--oy) * 1px)) scale(0);
          }

          .brutalist-qr-button:hover .module {
            opacity: 1;
            transform: translate(0, 0) scale(1);
            transition-delay: var(--delay);
          }
          
          .brutalist-qr-button:active {
            transform: scale(0.95);
          }
        `}
      </style>

      <button className="brutalist-qr-button" onClick={onClick}>
        {/* Rest State */}
        <div className="rest-content">
          <svg className="mini-qr-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 3h2v2h-2v-2zm3 3h3v2h-3v-2zm-3-3h2v2h-2v-2z" />
            <path d="M15 15h2v2h-2z" opacity="0.5"/>
          </svg>
          <span className="rest-text">My QR</span>
        </div>

        {/* Hover State */}
        <div className="qr-wrapper">
          <svg className="qr-svg" viewBox="0 0 100 100">
            {modules.map((m, i) => (
              <rect
                key={i}
                x={m.x}
                y={m.y}
                width={m.width}
                height={m.height}
                style={{
                  '--ox': m.ox,
                  '--oy': m.oy,
                  '--delay': `${m.delay}s`,
                  '--mod-color': m.color
                }}
                className="module"
              />
            ))}
          </svg>
        </div>
      </button>
    </>
  );
};

export default BrutalistQRButton;
