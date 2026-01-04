import { useState, useEffect } from 'react';
import Loader from './PageLoader';
import TimeoutError from './TimeoutError';

const Loading = ({ height = '100vh', onTimeout }) => {
  const [showTimeout, setShowTimeout] = useState(false);
  const [minLoadTimeReached, setMinLoadTimeReached] = useState(false);

  // Ensure minimum 2-3 seconds display
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadTimeReached(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleTimeout = () => {
    if (minLoadTimeReached) {
      setShowTimeout(true);
      onTimeout?.();
    }
  };

  if (showTimeout) {
    return (
      <TimeoutError
        onRetry={() => {
          setShowTimeout(false);
          window.location.reload();
        }}
        onGoBack={() => {
          window.history.back();
        }}
      />
    );
  }

  return <Loader onTimeout={handleTimeout} timeoutDuration={240000} />;
};

export default Loading;
