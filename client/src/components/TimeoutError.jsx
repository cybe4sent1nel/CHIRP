import React from 'react';
import styled from 'styled-components';

const TimeoutError = ({ onRetry, onGoBack }) => {
  return (
    <StyledWrapper>
      <div className="error-container">
        <div className="timeout-icon">⏱️</div>
        
        <h1 className="error-title">Request Timeout</h1>
        <p className="error-message">The page is taking too long to load. Please try again.</p>
        
        <div className="error-details">
          <p>The server took longer than expected to respond.</p>
          <p>This could be due to network issues or high server load.</p>
        </div>

        <div className="button-group">
          <button className="retry-button" onClick={onRetry}>
            🔄 Try Again
          </button>
          <button className="back-button" onClick={onGoBack}>
            ← Go Back
          </button>
        </div>

        <div className="troubleshooting">
          <h3>What You Can Try</h3>
          <ul>
            <li>Wait a moment and try reloading the page</li>
            <li>Check your internet connection</li>
            <li>Clear your browser cache</li>
            <li>Try using a different browser</li>
            <li>Contact support if the problem persists</li>
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
  height: 100%;
  background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99998;

  .error-container {
    text-align: center;
    padding: 40px 20px;
    max-width: 500px;
    animation: slideUp 0.5s ease-out;
  }

  .timeout-icon {
    font-size: 80px;
    margin: 0 0 20px 0;
    animation: pulse 2s infinite;
  }

  .error-title {
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 20px 0 10px 0;
  }

  .error-message {
    font-size: 18px;
    color: #555;
    margin-bottom: 20px;
    font-weight: 600;
  }

  .error-details {
    color: #666;
    line-height: 1.8;
    margin: 30px 0;
    font-size: 14px;

    p {
      margin: 8px 0;
    }
  }

  .button-group {
    display: flex;
    gap: 12px;
    margin: 30px 0;
    justify-content: center;
    flex-wrap: wrap;
  }

  .retry-button,
  .back-button {
    padding: 12px 28px;
    font-size: 15px;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .retry-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
  }

  .back-button {
    background: white;
    color: #667eea;
    border: 2px solid #667eea;

    &:hover {
      background: #f5f7fa;
      transform: translateY(-2px);
    }
  }

  .troubleshooting {
    background: rgba(102, 126, 234, 0.1);
    border-radius: 12px;
    padding: 25px;
    margin-top: 40px;
    text-align: left;

    h3 {
      color: #333;
      margin: 0 0 15px 0;
      font-size: 18px;
      font-weight: 600;
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

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
`;

export default TimeoutError;
