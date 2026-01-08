import React, { useState, useRef } from 'react';

const ReactionButton = ({ src, label, index, hoveredIndex, setHoveredIndex, onClick }) => {
  const isHovered = hoveredIndex === index;

  return (
    <div className="relative flex flex-col items-center">
      {/* Tooltip - Moved further up (-top-24) */}
      <span 
        className={`
          absolute -top-24 left-1/2 -translate-x-1/2 
          px-3 py-1 rounded-full text-[10px] font-bold tracking-widest
          bg-black/90 dark:bg-white dark:text-black text-white
          transition-all duration-300 pointer-events-none z-[10000]
          shadow-lg whitespace-nowrap
          ${isHovered ? 'opacity-100 -translate-y-2 scale-100' : 'opacity-0 translate-y-2 scale-75'}
        `}
      >
        {label}
      </span>

      <button 
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={() => onClick(label)}
        type="button"
        className={`
          relative flex items-center justify-center
          w-14 h-14
          cursor-pointer bg-white dark:bg-zinc-800 rounded-full 
          transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          shadow-lg
          /* Only the hovered icon zooms. No neighbor or shrinking effects. */
          ${isHovered ? 'z-20 scale-[2.2] -translate-y-12 shadow-2xl' : 'z-10 scale-100 opacity-100'}
        `}
      >
        <div className="p-2 rounded-full overflow-hidden flex items-center justify-center">
          <img 
            src={src} 
            alt={label}
            className="w-10 h-10 object-contain pointer-events-none"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/40?text=❤️';
            }}
          />
        </div>
      </button>
    </div>
  );
};

const ReactionPicker = ({ onReactionSelect, position = 'bottom' }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const pickerRef = useRef(null);

  const reactions = [
    { src: "https://above-pink-vfkzifz9je.edgeone.app/like-removebg-preview.png", label: "LIKE" },
    { src: "https://above-pink-vfkzifz9je.edgeone.app/support-removebg-preview.png", label: "SUPPORT" },
    { src: "https://above-pink-vfkzifz9je.edgeone.app/celebrate-removebg-preview.png", label: "CELEBRATE" },
    { src: "https://above-pink-vfkzifz9je.edgeone.app/cheer-removebg-preview.png", label: "CHEER" },
    { src: "https://above-pink-vfkzifz9je.edgeone.app/idea-removebg-preview.png", label: "INSIGHT" },
    { src: "https://above-pink-vfkzifz9je.edgeone.app/omg-removebg-preview.png", label: "OMG" },
  ];

  return (
    <div 
      ref={pickerRef}
      className={`
        absolute ${position === 'bottom' ? 'top-full mt-0' : 'bottom-full mb-0'} left-1/2 -translate-x-1/2 z-[9999]
        animate-in fade-in ${position === 'bottom' ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'} duration-200
      `}
    >
      {/* Main Bar */}
      <div 
        className="
          flex items-center justify-center 
          gap-3 px-6 py-4
          rounded-[3rem]
          bg-white dark:bg-zinc-900 
          backdrop-blur-xl
          border-2 border-slate-200 dark:border-zinc-700
          shadow-[0_20px_60px_rgba(0,0,0,0.25)]
        "
      >
        {reactions.map((reaction, index) => (
          <ReactionButton 
            key={index}
            index={index}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            src={reaction.src} 
            label={reaction.label}
            onClick={onReactionSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default ReactionPicker;
