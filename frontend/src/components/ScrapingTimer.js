import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import './ScrapingTimer.css';

function ScrapingTimer({ isScrapin, onComplete }) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setIsActive(isScrapin);
    if (isScrapin) {
      setSeconds(0);
    }
  }, [isScrapin]);

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatTime = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <div className="timer-container">
      <div className="timer-content">
        <Clock size={24} className="timer-icon" />
        <div className="timer-text">
          <p className="timer-label">Scraping in progress...</p>
          <p className="timer-display">{formatTime(seconds)}</p>
        </div>
        <div className="timer-animation">
          <div className="pulse-ring"></div>
        </div>
      </div>
    </div>
  );
}

export default ScrapingTimer;
