import React, { useState, useEffect } from 'react';
import './OfflineStatus.css';

const OfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div className={`offline-status ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? (
        <>
          <span className="status-icon">🟢</span>
          <span>Back online! Syncing data...</span>
        </>
      ) : (
        <>
          <span className="status-icon">🔴</span>
          <span>Offline mode - Sales will sync when connection returns</span>
        </>
      )}
    </div>
  );
};

export default OfflineStatus;