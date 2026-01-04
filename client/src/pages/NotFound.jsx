import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import lottie from 'lottie-web';

const NotFound = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (containerRef.current) {
      fetch('/animations/404cat.json')
        .then((res) => res.json())
        .then((animationData) => {
          lottie.loadAnimation({
            container: containerRef.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData,
          });
        })
        .catch((err) => console.error('Error loading animation:', err));

      return () => {
        lottie.destroy();
      };
    }
  }, []);

  return (
    <StyledWrapper>
      <div className="error-container">
        <div className="animation-wrapper" ref={containerRef} />
        
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Page Not Found</h2>
        <p className="error-message">Oops! The page you're looking for doesn't exist or has been moved.</p>
        
        <div className="button-group">
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            ← Go Back Home
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
            👤 Visit Profile
          </button>
        </div>

        <div className="troubleshooting">
          <h3>What Can You Do?</h3>
          <ul>
            <li>Check if the URL is typed correctly</li>
            <li>Go back to the previous page and try again</li>
            <li>Visit the home page and navigate from there</li>
            <li>Contact support if you believe this is an error</li>
            <li>Clear your browser cache and try again</li>
          </ul>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  .error-container {
    text-align: center;
    padding: 40px 20px;
    max-width: 700px;
    animation: slideUp 0.5s ease-out;
  }

  .animation-wrapper {
    width: 350px;
    height: 350px;
    margin: 0 auto 30px;
  }

  .error-code {
    font-size: 72px;
    font-weight: 900;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 10px 0;
    letter-spacing: 2px;
  }

  .error-title {
    font-size: 36px;
    font-weight: 700;
    color: #333;
    margin: 10px 0 15px 0;
  }

  .error-message {
    font-size: 16px;
    color: #666;
    margin-bottom: 40px;
    line-height: 1.6;
  }

  .button-group {
    display: flex;
    gap: 15px;
    margin: 40px 0;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    padding: 12px 28px;
    font-size: 15px;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;

    &.btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      }
    }

    &.btn-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
      box-shadow: 0 2px 10px rgba(102, 126, 234, 0.2);

      &:hover {
        background: #f5f7fa;
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }
    }

    &:active {
      transform: translateY(0);
    }
  }

  .troubleshooting {
    background: rgba(102, 126, 234, 0.1);
    border-radius: 12px;
    padding: 30px;
    margin-top: 50px;
    text-align: left;

    h3 {
      color: #333;
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      text-align: center;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        color: #555;
        padding: 10px 0;
        font-size: 14px;
        display: flex;
        align-items: center;
        line-height: 1.5;

        &:before {
          content: "→";
          color: #667eea;
          font-weight: bold;
          margin-right: 12px;
          font-size: 16px;
          flex-shrink: 0;
        }
      }
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 600px) {
    .animation-wrapper {
      width: 250px;
      height: 250px;
    }

    .error-code {
      font-size: 48px;
    }

    .error-title {
      font-size: 24px;
    }

    .button-group {
      flex-direction: column;
      gap: 10px;
    }

    .btn {
      width: 100%;
    }
  }
`;

export default NotFound;
