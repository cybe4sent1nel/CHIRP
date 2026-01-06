import { useState, useEffect } from 'react';
import { useClerk } from '@clerk/clerk-react';
import './AnimatedLogoutButton.css';

const AnimatedLogoutButton = () => {
  const { signOut } = useClerk();
  const [buttonState, setButtonState] = useState('default');

  const logoutButtonStates = {
    'default': {
      '--figure-duration': '100',
      '--transform-figure': 'none',
      '--walking-duration': '100',
      '--transform-arm1': 'rotate(0deg)',
      '--transform-wrist1': 'none',
      '--transform-arm2': 'rotate(0deg)',
      '--transform-wrist2': 'none',
      '--transform-leg1': 'rotate(0deg)',
      '--transform-calf1': 'rotate(0deg)',
      '--transform-leg2': 'rotate(0deg)',
      '--transform-calf2': 'rotate(0deg)'
    },
    'hover': {
      '--figure-duration': '100',
      '--transform-figure': 'translateX(1.5px)',
      '--walking-duration': '100',
      '--transform-arm1': 'rotate(-15deg)',
      '--transform-wrist1': 'none',
      '--transform-arm2': 'rotate(-15deg)',
      '--transform-wrist2': 'none',
      '--transform-leg1': 'rotate(0deg)',
      '--transform-calf1': 'rotate(0deg)',
      '--transform-leg2': 'rotate(0deg)',
      '--transform-calf2': 'rotate(0deg)'
    },
    'walking1': {
      '--figure-duration': '300',
      '--transform-figure': 'translateX(11px)',
      '--walking-duration': '300',
      '--transform-arm1': 'rotate(30deg)',
      '--transform-wrist1': 'none',
      '--transform-arm2': 'rotate(30deg)',
      '--transform-wrist2': 'none',
      '--transform-leg1': 'translateX(5px) rotate(15deg)',
      '--transform-calf1': 'rotate(-10deg)',
      '--transform-leg2': 'translateX(-5px) rotate(-15deg)',
      '--transform-calf2': 'rotate(10deg)'
    },
    'walking2': {
      '--figure-duration': '400',
      '--transform-figure': 'translateX(17px)',
      '--walking-duration': '300',
      '--transform-arm1': 'rotate(-40deg)',
      '--transform-wrist1': 'none',
      '--transform-arm2': 'rotate(-40deg)',
      '--transform-wrist2': 'none',
      '--transform-leg1': 'translateX(-5px) rotate(-10deg)',
      '--transform-calf1': 'rotate(5deg)',
      '--transform-leg2': 'translateX(5px) rotate(10deg)',
      '--transform-calf2': 'rotate(-5deg)'
    },
    'falling1': {
      '--figure-duration': '1600',
      '--walking-duration': '400',
      '--transform-arm1': 'rotate(-80deg)',
      '--transform-wrist1': 'none',
      '--transform-arm2': 'rotate(-80deg)',
      '--transform-wrist2': 'none',
      '--transform-leg1': 'rotate(-30deg)',
      '--transform-calf1': 'rotate(-20deg)',
      '--transform-leg2': 'rotate(20deg)'
    },
    'falling2': {
      '--walking-duration': '300',
      '--transform-arm1': 'rotate(20deg)',
      '--transform-arm2': 'rotate(20deg)',
      '--transform-wrist2': 'none',
      '--transform-leg1': 'rotate(20deg)',
      '--transform-calf1': 'rotate(20deg)',
      '--transform-leg2': 'rotate(-20deg)'
    },
    'falling3': {
      '--walking-duration': '500',
      '--transform-arm1': 'rotate(-50deg)',
      '--transform-wrist1': 'none',
      '--transform-arm2': 'rotate(-50deg)',
      '--transform-wrist2': 'none',
      '--transform-leg1': 'rotate(-30deg)',
      '--transform-leg2': 'rotate(20deg)',
      '--transform-calf2': 'none'
    }
  };

  const updateButtonState = (state) => {
    if (logoutButtonStates[state]) {
      setButtonState(state);
    }
  };

  const handleClick = () => {
    if (buttonState === 'default' || buttonState === 'hover') {
      updateButtonState('walking1');
      
      setTimeout(() => {
        updateButtonState('walking2');
        
        setTimeout(() => {
          updateButtonState('falling1');
          
          setTimeout(() => {
            updateButtonState('falling2');
            
            setTimeout(() => {
              updateButtonState('falling3');
              
              setTimeout(() => {
                signOut();
                window.location.href = '/welcome';
              }, 1000);
            }, parseInt(logoutButtonStates['falling2']['--walking-duration']));
          }, parseInt(logoutButtonStates['falling1']['--walking-duration']));
        }, parseInt(logoutButtonStates['walking2']['--figure-duration']));
      }, parseInt(logoutButtonStates['walking1']['--figure-duration']));
    }
  };

  const getButtonClasses = () => {
    let classes = 'logoutButton';
    if (buttonState === 'walking1' || buttonState === 'walking2') classes += ' clicked';
    if (buttonState === 'walking2') classes += ' door-slammed';
    if (buttonState.startsWith('falling')) classes += ' falling';
    return classes;
  };

  const currentStyles = logoutButtonStates[buttonState] || logoutButtonStates['default'];

  return (
    <button
      className={getButtonClasses()}
      style={currentStyles}
      onClick={handleClick}
      onMouseEnter={() => buttonState === 'default' && updateButtonState('hover')}
      onMouseLeave={() => buttonState === 'hover' && updateButtonState('default')}
    >
      <svg className="doorway" viewBox="0 0 100 100">
        <path d="M93.4 86.3H58.6c-1.9 0-3.4-1.5-3.4-3.4V17.1c0-1.9 1.5-3.4 3.4-3.4h34.8c1.9 0 3.4 1.5 3.4 3.4v65.8c0 1.9-1.5 3.4-3.4 3.4z" />
        <path className="bang" d="M40.5 43.7L26.6 31.4l-2.5 6.7zM41.9 50.4l-19.5-4-1.4 6.3zM40 57.4l-17.7 3.9 3.9 5.7z" />
      </svg>
      
      <svg className="figure" viewBox="0 0 100 100">
        <g className="arm2">
          <path d="M45 42 Q 25 35, 15 25 Q 25 50, 45 45 Z" fill="#0f172a" /> 
        </g>

        <g className="leg2">
          <path d="M45 65 L 45 75 L 40 80" stroke="#fb7185" strokeWidth="3" fill="none" />
          <path className="calf2" d="M40 80 L 35 80" stroke="#fb7185" strokeWidth="3" />
        </g>

        <ellipse cx="50" cy="52" rx="20" ry="18" fill="#334155" /> 
        <circle cx="56" cy="38" r="12" fill="#334155" />
        <path d="M64 45 Q 60 55, 50 50" stroke="#c084fc" strokeWidth="4" fill="none" opacity="0.8" />
        <circle cx="60" cy="36" r="3" fill="white" />
        <circle cx="60" cy="36" r="1.5" fill="#0f172a" />
        <path d="M66 36 L 74 39 L 66 42 Z" fill="#fb923c" /> 
        <path d="M64 36 L 67 36 L 64 39 Z" fill="#f1f5f9" />

        <g className="leg1">
          <path d="M55 65 L 55 75 L 50 80" stroke="#fb7185" strokeWidth="3" fill="none" />
          <path className="calf1" d="M50 80 L 45 80" stroke="#fb7185" strokeWidth="3" />
        </g>

        <g className="arm1">
          <path d="M55 45 Q 35 38, 25 28 Q 35 53, 55 48 Z" fill="#0f172a" />
          <path d="M35 40 L 45 42" stroke="#cbd5e1" strokeWidth="2" />
        </g>
      </svg>

      <svg className="door" viewBox="0 0 100 100">
        <path d="M93.4 86.3H58.6c-1.9 0-3.4-1.5-3.4-3.4V17.1c0-1.9 1.5-3.4 3.4-3.4h34.8c1.9 0 3.4 1.5 3.4 3.4v65.8c0 1.9-1.5 3.4-3.4 3.4z" />
        <circle cx="66" cy="50" r="3.7" />
      </svg>
      <span className="button-text">Log Out</span>
    </button>
  );
};

export default AnimatedLogoutButton;
