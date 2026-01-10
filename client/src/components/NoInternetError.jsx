import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import lottie from 'lottie-web';

const NoInternetError = ({ onRetry }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const loadAnimation = async () => {
      try {
        // Try to fetch the animation file
        const response = await fetch('/animations/nodata.json');
        
        if (!response.ok) {
          console.warn('Failed to fetch animation:', response.status, response.statusText);
          // Fallback: use a simple animated SVG if fetch fails
          containerRef.current.innerHTML = `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" fill="none" stroke="#667eea" stroke-width="2">
                <animate attributeName="r" values="80;90;80" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="100" cy="100" r="60" fill="none" stroke="#764ba2" stroke-width="2">
                <animate attributeName="r" values="60;50;60" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              <text x="100" y="110" text-anchor="middle" font-size="14" fill="#666" font-family="Arial">
                Loading...
              </text>
            </svg>
          `;
          return;
        }

        const animationData = await response.json();
        
        if (!containerRef.current) return;

        lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: animationData,
        });
      } catch (err) {
        console.error('Error loading animation:', err);
        // Fallback: show simple SVG
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" fill="none" stroke="#667eea" stroke-width="2">
                <animate attributeName="r" values="80;90;80" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="100" cy="100" r="60" fill="none" stroke="#764ba2" stroke-width="2">
                <animate attributeName="r" values="60;50;60" dur="1.5s" repeatCount="indefinite"/>
              </circle>
            </svg>
          `;
        }
      }
    };

    loadAnimation();

    return () => {
      try {
        lottie.destroy();
      } catch (err) {
        console.error('Error destroying animation:', err);
      }
    };
  }, []);

  const handleRetry = () => {
    onRetry?.();
  };

  return (
    <StyledWrapper>
      <div className="error-container">
        <div className="animation-wrapper" ref={containerRef} />
        
        <h1 className="error-title">Oops! No Connection</h1>
        <p className="error-message">Check Your Network and Try Again</p>
        
        <div className="error-description">
          <p>It looks like your device has lost its internet connection.</p>
          <p>Please check your WiFi or mobile data and try again.</p>
        </div>

        <button className="retry-button" onClick={handleRetry}>
          🔄 Try Again
        </button>

        <div className="troubleshooting">
          <h3>Troubleshooting Tips</h3>
          <ul>
            <li>Check if WiFi is enabled and connected</li>
            <li>Try moving closer to the WiFi router</li>
            <li>Disable and re-enable airplane mode</li>
            <li>Restart your device</li>
            <li>Check if other apps can connect to the internet</li>
          </ul>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99998;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;

  .error-container {
    text-align: center;
    padding: 20px;
    max-width: 600px;
    width: 100%;
    animation: slideUp 0.5s ease-out;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: auto;
  }

  .animation-wrapper {
    width: 100%;
    max-width: 400px;
    height: auto;
    aspect-ratio: 1;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      width: 100% !important;
      height: 100% !important;
      max-width: 100%;
      max-height: 100%;
    }
  }
  
  @media (max-width: 768px) {
    .animation-wrapper {
      max-width: 280px;
    }
  }
  
  @media (max-width: 480px) {
    padding: 15px;
    
    .animation-wrapper {
      max-width: 240px;
    }
    
    .error-container {
      padding: 10px;
    }
  }

  .error-title {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 15px 0 10px 0;
    
    @media (max-width: 768px) {
      font-size: 24px;
    }
    
    @media (max-width: 480px) {
      font-size: 22px;
    }
  }

  .error-message {
    font-size: 18px;
    color: #555;
    margin-bottom: 15px;
    font-weight: 600;
    
    @media (max-width: 768px) {
      font-size: 16px;
    }
    
    @media (max-width: 480px) {
      font-size: 15px;
    }
  }

  .error-description {
    color: #666;
    line-height: 1.8;
    margin: 20px 0;
    font-size: 14px;

    p {
      margin: 8px 0;
    }
    
    @media (max-width: 480px) {
      font-size: 13px;
      margin: 15px 0;
    }
  }

  .retry-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 14px 40px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    margin: 20px 0;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }

    &:active {
      transform: translateY(0);
    }
    
    @media (max-width: 480px) {
      padding: 12px 30px;
      font-size: 15px;
    }
  }

  .troubleshooting {
    background: rgba(102, 126, 234, 0.1);
    border-radius: 12px;
    padding: 20px;
    margin-top: 25px;
    text-align: left;
    width: 100%;

    h3 {
      color: #333;
      margin: 0 0 15px 0;
      font-size: 18px;
      font-weight: 600;
      
      @media (max-width: 480px) {
        font-size: 16px;
      }
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        color: #555;
        padding: 8px 0;
        font-size: 14px;
        display: flex;
        align-items: center;

        &:before {
          content: "✓";
          color: #667eea;
          font-weight: bold;
          margin-right: 10px;
          font-size: 16px;
        }
        
        @media (max-width: 480px) {
          font-size: 13px;
          padding: 6px 0;
        }
      }
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default NoInternetError;
