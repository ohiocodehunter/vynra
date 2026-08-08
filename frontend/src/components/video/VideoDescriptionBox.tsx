'use client';

import React, { useState } from 'react';
import styles from './VideoDescriptionBox.module.css';

interface VideoDescriptionBoxProps {
  views: number;
  createdAt: string;
  description: string;
}

export default function VideoDescriptionBox({ views, createdAt, description }: VideoDescriptionBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = new Date(createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.descriptionBox} onClick={toggleExpanded}>
      <p className={styles.descriptionStats}>
        {views.toLocaleString()} views • {formattedDate}
      </p>
      
      <div className={`${styles.descriptionText} ${!isExpanded ? styles.collapsed : ''}`}>
        {description || 'No description provided.'}
      </div>
      
      <button className={styles.showMoreBtn}>
        {isExpanded ? 'Show less' : '...more'}
      </button>
    </div>
  );
}
