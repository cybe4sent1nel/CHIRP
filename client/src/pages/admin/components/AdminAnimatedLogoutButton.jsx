import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminLogoutButton.css';

const AdminAnimatedLogoutButton = () => {
  const navigate = useNavigate();
  const [buttonState, setButtonState] = useState('default');

  // Animation states mapped to CSS variables
  const logoutButtonStates = {
    'default': {
      '--figure-duration': 100,
      '--transform-figure': 'none',
      '--walking-duration': 100,
    },
    'hover': {
      '--figure-duration': 100,
      '--transform-figure': 'translateX(1.5px) rotate(-2deg)',
      '--walking-duration': 100,
    },
    'walking1': {
      '--figure-duration': 300,
      '--transform-figure': 'translateX(6px) translateY(-2px) rotate(5deg)',
      '--walking-duration': 300,
    },
    'walking2': {
      '--figure-duration': 400,
      '--transform-figure': 'translateX(12px) translateY(0px) rotate(-5deg)',
      '--walking-duration': 300,
    },
    'falling1': {
      '--figure-duration': 1600,
      '--walking-duration': 400,
    },
    'falling2': {
      '--walking-duration': 300,
    },
    'falling3': {
      '--walking-duration': 500,
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
                // Clear admin tokens
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_email');
                localStorage.removeItem('admin_data');
                
                // Redirect to admin login
                navigate('/admin/login', { replace: true });
              }, 1000);
            }, logoutButtonStates['falling2']['--walking-duration']);
          }, logoutButtonStates['falling1']['--walking-duration']);
        }, logoutButtonStates['walking2']['--figure-duration']);
      }, logoutButtonStates['walking1']['--figure-duration']);
    }
  };

  const getButtonClasses = () => {
    let classes = 'logoutButton';
    if (buttonState === 'walking1' || buttonState === 'walking2') classes += ' clicked';
    if (buttonState === 'walking2' || buttonState.startsWith('falling')) classes += ' door-slammed';
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
      <span className="button-text">Log Out</span>

      <svg className="doorway" viewBox="0 0 100 100">
        <path d="M93.4 86.3H58.6c-1.9 0-3.4-1.5-3.4-3.4V17.1c0-1.9 1.5-3.4 3.4-3.4h34.8c1.9 0 3.4 1.5 3.4 3.4v65.8c0 1.9-1.5 3.4-3.4 3.4z" />
      </svg>

      <svg className="bang" viewBox="0 0 100 100">
        <path d="M40.5 43.7L26.6 31.4l-2.5 6.7zM41.9 50.4l-19.5-4-1.4 6.3zM40 57.4l-17.7 3.9 3.9 5.7z" />
      </svg>
      
      <svg className="figure" viewBox="0 0 64 64">
        <g transform="scale(-1, 1) translate(-64, 0)">
          <g fill="#8b5cf6">
            <path d="M59.8 24.3s1.1-6.2-3.5-3.4c0 0-.4-6.3-4.3-1.9c0 0-2.1-3.9-4.4-.3c-3.1 4.8-5.2 12.4-3.2 25l3.8-2.5c2.7-7.9 12.4-8.8 13.7-13.1c.9-3-2.1-3.8-2.1-3.8m-37.7-6.7l-9.9 3.6C14.4 9.2 28.8 10 28.8 10s-6.8 3.2-6.7 7.6"/>
            <path d="m23.7 19.8l-10.5 1.4C18 10 31.9 13.9 31.9 13.9s-7.3 1.6-8.2 5.9"/>
          </g>
          <path fill="#facc15" d="m2 29l5.4-1.4v3.6c0-.1-3.3-.6-5.4-2.2m5.4-1.5L2 24.8c3.6-2.8 7.7-1.9 7.7-1.9z"/>
          <path fill="#f59e0b" d="M33.8 53h-2.1v7.9c-.3.1-2.1-.1-2.9-.1c-1.8 0-3.3 1.3-3.3 1.3h8.3zM25 53h-2.1v7.9c-.3.1-2.1-.1-2.9-.1c-1.8 0-3.3 1.3-3.3 1.3H25z"/>
          <path fill="#8b5cf6" d="M54 36.2c3.9 0-4.1 17.5-23.3 17.5c-13 0-23.9-5.2-23.9-21.5c0-10.1 6.4-18.3 19.5-15c13.3 3.5 6.5 19 27.7 19"/>
          <path fill="#fff" d="M37.6 51.7c-15.6 0-14-12-27.9-11.2c5.1 15.8 27.9 11.2 27.9 11.2"/>
          <path fill="#6d28d9" d="M39.1 29.2c-10-9.8-20.2 6.2-7.9 12.6C43.3 48 51.6 37 51.6 37s-6.1-1.5-12.5-7.8"/>
          <circle cx="15.1" cy="24.9" r="2.5" fill="#3e4347"/>
        </g>
      </svg>

      <svg className="door" viewBox="0 0 100 100">
        <path d="M93.4 86.3H58.6c-1.9 0-3.4-1.5-3.4-3.4V17.1c0-1.9 1.5-3.4 3.4-3.4h34.8c1.9 0 3.4 1.5 3.4 3.4v65.8c0 1.9-1.5 3.4-3.4 3.4z" />
        <circle cx="66" cy="50" r="3.7" fill="#f0fdf4" />
      </svg>
    </button>
  );
};

export default AdminAnimatedLogoutButton;
