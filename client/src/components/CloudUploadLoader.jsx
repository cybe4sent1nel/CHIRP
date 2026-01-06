import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Cloud, Upload } from 'lucide-react';

const CloudUploadLoader = ({ 
  isLoading = false, 
  message = "Uploading", 
  progress = 0,
  showProgress = false 
}) => {
  const [messageIndex, setMessageIndex] = useState(0);

  const wittyMessages = [
    "Sending your files to the cloud kingdom...",
    "Teaching pixels to fly...",
    "Uploading dreams to the internet...",
    "Befriending the cloud servers...",
    "Teleporting your content to infinity...",
    "Making the cloud dance with your data...",
    "Whispering secrets to the servers...",
    "Converting vibes to bytes...",
    "Riding the digital wind...",
    "Painting the cloud with your creativity..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % wittyMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  if (!isLoading) return null;

  return (
    <StyledWrapper>
      <OverlayContainer>
        <LoaderBox>
          <CloudAnimation>
            <div className="cloud">
              <div className="cloud-part cloud-part-1" />
              <div className="cloud-part cloud-part-2" />
              <div className="cloud-part cloud-part-3" />
            </div>
            <div className="upload-icon">
              <Upload className="upload-arrow" />
            </div>
            <div className="floating-particles">
              <div className="particle" />
              <div className="particle" />
              <div className="particle" />
              <div className="particle" />
              <div className="particle" />
            </div>
          </CloudAnimation>

          <MessageContainer>
            <p className="loading-message">{wittyMessages[messageIndex]}</p>
            {showProgress && (
              <p className="progress-text">{Math.round(progress)}% complete</p>
            )}
          </MessageContainer>

          <ProgressLine>
            {showProgress ? (
              <ProgressBarDetermined style={{ width: `${progress}%` }} />
            ) : (
              <ProgressBar />
            )}
          </ProgressLine>
        </LoaderBox>
      </OverlayContainer>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div``;

const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
`;

const LoaderBox = styled.div`
  background: white;
  padding: 50px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  max-width: 400px;
`;

const CloudAnimation = styled.div`
  position: relative;
  width: 200px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;

  .cloud {
    position: relative;
    width: 120px;
    height: 60px;
    animation: float 3s ease-in-out infinite;
  }

  .cloud-part {
    position: absolute;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
  }

  .cloud-part-1 {
    width: 50px;
    height: 50px;
    top: 10px;
    left: 10px;
    animation: pulse-cloud 2s ease-in-out infinite;
  }

  .cloud-part-2 {
    width: 70px;
    height: 70px;
    top: 0px;
    left: 35px;
    animation: pulse-cloud 2s ease-in-out infinite 0.2s;
  }

  .cloud-part-3 {
    width: 50px;
    height: 50px;
    top: 15px;
    right: 5px;
    animation: pulse-cloud 2s ease-in-out infinite 0.4s;
  }

  .upload-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: bounce-up 1s ease-in-out infinite;
    z-index: 2;

    .upload-arrow {
      width: 32px;
      height: 32px;
      color: white;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
  }

  .floating-particles {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .particle {
    position: absolute;
    width: 6px;
    height: 6px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 50%;
    animation: float-up 2s infinite ease-out;

    &:nth-child(1) {
      left: 20%;
      animation-delay: 0s;
    }
    &:nth-child(2) {
      left: 40%;
      animation-delay: 0.3s;
    }
    &:nth-child(3) {
      left: 60%;
      animation-delay: 0.6s;
    }
    &:nth-child(4) {
      left: 80%;
      animation-delay: 0.9s;
    }
    &:nth-child(5) {
      left: 50%;
      animation-delay: 1.2s;
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  @keyframes pulse-cloud {
    0%, 100% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.1);
      opacity: 1;
    }
  }

  @keyframes bounce-up {
    0%, 100% {
      transform: translate(-50%, -50%);
    }
    50% {
      transform: translate(-50%, -65%);
    }
  }

  @keyframes float-up {
    0% {
      opacity: 1;
      transform: translateY(0px);
    }
    100% {
      opacity: 0;
      transform: translateY(-60px);
    }
  }
`;

const MessageContainer = styled.div`
  text-align: center;
  min-height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .loading-message {
    font-size: 14px;
    font-weight: 600;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    animation: fade-in-out 2.5s ease-in-out infinite;
    letter-spacing: 0.5px;
    line-height: 1.4;
  }

  .progress-text {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }
`;

const ProgressLine = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2, #667eea);
  background-size: 200% 100%;
  animation: slide-line 2s ease-in-out infinite;

  @keyframes slide-line {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(100%);
    }
    100% {
      transform: translateX(-100%);
    }
  }

  @keyframes fade-in-out {
    0%, 100% {
      opacity: 0.4;
    }
    50% {
      opacity: 1;
    }
  }
`;

const ProgressBarDetermined = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease-out;
  border-radius: 2px;
`;

export default CloudUploadLoader;
