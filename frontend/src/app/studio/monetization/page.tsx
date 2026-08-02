'use client';

import React from 'react';
import styles from './page.module.css';
import { DollarSign, CheckCircle, Clock, Users } from 'lucide-react';

export default function StudioMonetization() {
  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Channel Monetization</h1>
      
      <div className={styles.comingSoonWrapper}>
        <div className={styles.heroIconWrapper}>
          <DollarSign size={64} className={styles.pulsingIcon} />
        </div>
        <h2 className={styles.comingSoonTitle}>Monetization is Coming Soon!</h2>
        <p className={styles.comingSoonDesc}>
          We are working hard behind the scenes to bring the Vynra Partner Program to life. Soon you will be able to earn money, get creator support, and unlock premium features for your channel.
        </p>
        
        <div className={styles.notifyBadge}>
          <CheckCircle size={20} color="#4ade80" />
          <span>We'll notify you when the program launches. Keep creating!</span>
        </div>
      </div>
    </div>
  );
}
