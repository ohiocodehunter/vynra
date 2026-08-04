import React from 'react';
import styles from './Skeleton.module.css';

export default function ShortSkeleton() {
  return (
    /* Mirrors .shortWrapper */
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '12px',
      boxSizing: 'border-box',
    }}>
      {/* Mirrors .videoContainer */}
      <div style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        maxWidth: '450px',
        aspectRatio: '9 / 16',
        maxHeight: 'calc(100vh - 120px)',
        background: '#111',
        borderRadius: '16px',
        overflow: 'hidden',
        margin: '0 auto',
        flexShrink: 0,
      }}>
        {/* Full-card shimmer background */}
        <div className={styles.shimmer} style={{
          position: 'absolute', inset: 0,
          background: '#1a1a1a',
        }} />

        {/* Bottom-left: creator + title — mirrors .metadata / .creatorInfo */}
        <div style={{
          position: 'absolute',
          bottom: '3.5rem',
          left: '1.5rem',
          right: '72px',   /* matches padding-right: 60px + some gap */
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          {/* Avatar + username + subscribe pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className={styles.shimmer} style={{
              width: '32px', height: '32px',
              borderRadius: '50%', background: '#333', flexShrink: 0,
            }} />
            <div className={styles.shimmer} style={{
              height: '13px', width: '100px',
              borderRadius: '6px', background: '#333',
            }} />
            <div className={styles.shimmer} style={{
              height: '24px', width: '64px',
              borderRadius: '16px', background: '#333',
              marginLeft: '4px',
            }} />
          </div>
          {/* Title */}
          <div className={styles.shimmer} style={{
            height: '14px', width: '92%',
            borderRadius: '6px', background: '#333',
          }} />
          {/* Description */}
          <div className={styles.shimmer} style={{
            height: '12px', width: '68%',
            borderRadius: '6px', background: '#2a2a2a',
          }} />
        </div>

        {/* Right-side actions — mirrors .actions (right:12px, bottom:4.5rem) */}
        <div style={{
          position: 'absolute',
          right: '12px',
          bottom: '4.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}>
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              {/* Mirrors .iconWrapper (40x40) */}
              <div className={styles.shimmer} style={{
                width: '40px', height: '40px',
                borderRadius: '50%', background: '#333',
              }} />
              <div className={styles.shimmer} style={{
                width: '32px', height: '10px',
                borderRadius: '4px', background: '#2a2a2a',
              }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
