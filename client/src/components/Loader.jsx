import React from 'react';
import styled from 'styled-components';

const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

const LoaderAnimation = styled.div`
  position: relative;
  width: 60px;
  height: 60px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
  }

  .outer-circle {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 4px solid transparent;
    border-top: 4px solid #667eea;
    border-right: 4px solid #764ba2;
    border-radius: 50%;
    animation: spin 1.5s linear infinite;
  }

  .inner-circle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    animation: bounce 1s ease-in-out infinite;
  }
`;

const LoaderText = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: #4f46e5;
  letter-spacing: 0.5px;
  margin: 0;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  animation: pulse 1.5s ease-in-out infinite;

  &::after {
    content: '';
    animation: dots 1.5s steps(4, end) infinite;
  }

  @keyframes dots {
    0%,
    20% {
      content: '';
    }
    40% {
      content: '.';
    }
    60% {
      content: '..';
    }
    80%,
    100% {
      content: '...';
    }
  }
`;

const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoaderBox = styled.div`
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const Loader = ({
  isLoading = false,
  message = "Uploading",
  fullScreen = true,
  size = 'medium'
}) => {
  if (!isLoading) return null;

  const sizeStyles = {
    small: { width: '40px', height: '40px' },
    medium: { width: '60px', height: '60px' },
    large: { width: '80px', height: '80px' }
  };

  const loaderContent = (
    <LoaderContainer>
      <LoaderAnimation style={sizeStyles[size]}>
        <div className="outer-circle"></div>
        <div className="inner-circle"></div>
      </LoaderAnimation>
      <LoaderText>{message}</LoaderText>
    </LoaderContainer>
  );

  if (fullScreen) {
    return (
      <OverlayContainer>
        <LoaderBox>
          {loaderContent}
        </LoaderBox>
      </OverlayContainer>
    );
  }

  return loaderContent;
};

export default Loader;
