import React from 'react';
import styles from './Skeleton.module.css';

export default function ShortSkeleton() {
  return (
    <div style={{
      width: '100%',
      aspectRatio: '9/16',
      background: '#222',
      borderRadius: '12px',
      position: 'relative',
      overflow: 'hidden',
    }} className={styles.shimmer}>
      <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '8px', width: '80%' }}>
        <div style={{ height: '16px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
        <div style={{ height: '12px', width: '60%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
      </div>
    </div>
  );
}
