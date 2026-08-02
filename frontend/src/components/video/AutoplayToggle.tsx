'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/app/(main)/watch/page.module.css';

export default function AutoplayToggle() {
  const [isAutoplay, setIsAutoplay] = useState(false);

  useEffect(() => {
    // Initialize from local storage
    const stored = localStorage.getItem('vynra_autoplay');
    // Default to true if not set
    if (stored === null) {
      localStorage.setItem('vynra_autoplay', 'true');
      setIsAutoplay(true);
    } else {
      setIsAutoplay(stored === 'true');
    }
  }, []);

  const toggleAutoplay = () => {
    const newValue = !isAutoplay;
    setIsAutoplay(newValue);
    localStorage.setItem('vynra_autoplay', newValue.toString());
    window.dispatchEvent(new Event('autoplay_changed'));
  };

  return (
    <div className={styles.autoplayToggle} onClick={toggleAutoplay} style={{ cursor: 'pointer' }}>
      <span className={styles.autoplayText}>Autoplay</span>
      <div className={`${styles.toggleSwitch} ${isAutoplay ? styles.active : ''}`}>
        <div className={styles.toggleKnob}></div>
      </div>
    </div>
  );
}
