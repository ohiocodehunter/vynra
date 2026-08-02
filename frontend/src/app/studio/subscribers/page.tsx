'use client';

import React from 'react';
import styles from './page.module.css';
import { Users } from 'lucide-react';

export default function StudioSubscribers() {
  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Channel Subscribers</h1>
      
      <div className={styles.emptyState}>
        <div className={styles.iconWrapper}>
          <Users size={48} color="var(--accent-primary)" />
        </div>
        <h2 className={styles.emptyTitle}>See who's watching</h2>
        <p className={styles.emptyDesc}>
          Get insights into your audience, view recent subscribers, and connect with your community. This premium dashboard is currently being built and will be available soon!
        </p>
      </div>
    </div>
  );
}
