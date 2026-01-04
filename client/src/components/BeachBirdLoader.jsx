import { useEffect, useRef, useState } from "react";
import styled from 'styled-components';

const wittyMessages = [
  "AI is thinking deeply about your question...",
  "Consulting the digital oracle...",
  "Brewing artificial intelligence magic...",
  "Teaching robots to understand you...",
  "Downloading wisdom from the cloud...",
  "Unleashing the neural networks...",
  "Channeling the AI spirits...",
  "Computing the answer with stardust...",
  "Merging with the collective consciousness...",
  "Translating human to AI and back...",
  "Processing with cosmic energy...",
  "Asking the digital gods for guidance...",
  "Sprinkling AI dust into the void...",
  "Teaching the machines to dream...",
  "Asking the universe for answers..."
];

const BeachBirdLoader = ({ className = "", showMessage = true }) => {
  const containerRef = useRef(null);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamic import of lottie
    import("lottie-web").then((lottie) => {
      if (!containerRef.current) return;

      const animation = lottie.default.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/beach-bird.json",
      });

      return () => {
        animation.destroy();
      };
    });
  }, []);

  useEffect(() => {
    if (!showMessage) return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % wittyMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [showMessage]);

  return (
    <LoaderContainer className={className}>
      <div
        ref={containerRef}
        style={{ width: "80px", height: "80px" }}
      />
      {showMessage && (
        <LoadingMessage>
          {wittyMessages[messageIndex]}
        </LoadingMessage>
      )}
    </LoaderContainer>
  );
};

const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

const LoadingMessage = styled.p`
  font-size: 13px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  animation: fade-pulse 2s ease-in-out infinite;
  letter-spacing: 0.3px;
  text-align: center;
  max-width: 250px;
  line-height: 1.3;

  @keyframes fade-pulse {
    0%, 100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }
`;

export default BeachBirdLoader;
