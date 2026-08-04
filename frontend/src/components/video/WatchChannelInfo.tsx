"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { User } from '@/lib/api';
import styles from '@/app/(main)/watch/page.module.css';
import { socket } from '@/lib/socket';

interface WatchChannelInfoProps {
  initialCreator: User;
}

export default function WatchChannelInfo({ initialCreator }: WatchChannelInfoProps) {
  const [creator, setCreator] = useState(initialCreator);

  useEffect(() => {
    setCreator(initialCreator);
  }, [initialCreator]);

  useEffect(() => {
    const handleUserUpdate = (data: any) => {
      if (creator && (creator._id === data.userId || creator.id === data.userId)) {
        setCreator(prev => prev ? {
          ...prev,
          isVerified: data.isVerified,
          username: data.username,
          channelName: data.channelName
        } : prev);
      }
    };

    socket.on('user_updated', handleUserUpdate);

    return () => {
      socket.off('user_updated', handleUserUpdate);
    };
  }, [creator]);

  return (
    <Link href={`/channel/${creator.username}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}>
      <div className={styles.channelAvatar} style={{ backgroundImage: `url(${creator.avatarUrl || ''})`, backgroundSize: 'cover' }}></div>
      <div className={styles.channelText}>
        <div className={styles.channelName} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {creator.channelName || creator.username || 'Upload by Dev'}
          {creator.isVerified && <BadgeCheck size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />}
        </div>
        <div className={styles.subCount}>{creator.subscribersCount || 0} subscribers</div>
      </div>
    </Link>
  );
}
