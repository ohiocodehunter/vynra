import React from 'react';
import styles from './Skeleton.module.css';
import cardStyles from '../video/VideoCard.module.css';

interface VideoSkeletonProps {
  layout?: "vertical" | "horizontal";
}

export default function VideoSkeleton({ layout = "vertical" }: VideoSkeletonProps) {
  if (layout === "horizontal") {
    return (
      <div className={`${cardStyles.videoCard} ${cardStyles.horizontal}`}>
        <div className={`${cardStyles.thumbnailContainer} ${styles.shimmer}`} style={{ background: '#222' }}></div>
        <div className={cardStyles.videoInfo}>
          <div className={`${styles.shimmer}`} style={{ height: '16px', width: '90%', background: '#222', borderRadius: '4px', marginBottom: '8px' }}></div>
          <div className={`${styles.shimmer}`} style={{ height: '12px', width: '60%', background: '#222', borderRadius: '4px', marginBottom: '4px' }}></div>
          <div className={`${styles.shimmer}`} style={{ height: '12px', width: '40%', background: '#222', borderRadius: '4px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cardStyles.videoCard}>
      <div className={`${cardStyles.thumbnailContainer} ${styles.shimmer}`} style={{ background: '#222' }}></div>
      <div className={cardStyles.videoInfo} style={{ display: 'flex', gap: '12px', marginTop: '12px', padding: '0 4px' }}>
        <div className={`${styles.shimmer}`} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#222', flexShrink: 0 }}></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className={`${styles.shimmer}`} style={{ height: '16px', width: '90%', background: '#222', borderRadius: '4px' }}></div>
          <div className={`${styles.shimmer}`} style={{ height: '12px', width: '50%', background: '#222', borderRadius: '4px' }}></div>
        </div>
      </div>
    </div>
  );
}
