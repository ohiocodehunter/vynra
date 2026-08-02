'use client';

import React from 'react';
import styles from './page.module.css';
import { MessageSquare } from 'lucide-react';

export default function StudioComments() {
  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Channel Comments</h1>
      
      <div className={styles.emptyState}>
        <div className={styles.iconWrapper}>
          <MessageSquare size={48} color="var(--accent-primary)" />
        </div>
        <h2 className={styles.emptyTitle}>Manage your comments</h2>
        <p className={styles.emptyDesc}>
          View, reply to, and moderate comments on your videos. This premium dashboard is currently being built and will be available soon!
        </p>
      </div>
    </div>
  );
}
