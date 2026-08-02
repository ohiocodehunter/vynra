'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { Users } from 'lucide-react';
import { studioService } from '@/lib/api';
import Link from 'next/link';

export default function StudioSubscribers() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const data = await studioService.getStudioSubscribers();
        setSubscribers(data);
      } catch (error) {
        console.error('Failed to fetch studio subscribers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscribers();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Channel Subscribers</h1>
      
      {loading ? (
        <div className={styles.loading}>Loading subscribers...</div>
      ) : subscribers.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.iconWrapper}>
            <Users size={48} color="var(--accent-primary)" />
          </div>
          <h2 className={styles.emptyTitle}>No subscribers yet</h2>
          <p className={styles.emptyDesc}>
            Keep creating great content! When users subscribe to your channel, they will appear here.
          </p>
        </div>
      ) : (
        <div className={styles.subscribersGrid}>
          {subscribers.map((subscriber) => (
            <div key={subscriber._id} className={styles.subscriberCard}>
              <div className={styles.subscriberHeader}>
                <div className={styles.avatar}>
                  {subscriber.avatarUrl ? (
                    <img src={subscriber.avatarUrl} alt={subscriber.username} className={styles.avatarImg} />
                  ) : (
                    subscriber.username?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <div className={styles.subscriberInfo}>
                  <h3 className={styles.subscriberName}>{subscriber.channelName || subscriber.username}</h3>
                  <span className={styles.subscriberHandle}>@{subscriber.username}</span>
                  <span className={styles.subscriberCount}>{subscriber.subscribersCount || 0} subscribers</span>
                </div>
              </div>
              <div className={styles.subscriberFooter}>
                <span className={styles.joinedDate}>Joined {formatDate(subscriber.createdAt)}</span>
                <Link href={`/channel/${subscriber.username}`} className={styles.viewChannelBtn}>
                  View Channel
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
