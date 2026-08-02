'use client';

import React, { useEffect, useState } from 'react';
import VideoCard from '@/components/video/VideoCard';
import { Video } from '@/lib/api';
import styles from '../liked/page.module.css';

export default function WatchLaterPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWatchLater = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to see your watch later list.');
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`${(typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'))}/users/watch-later`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to fetch watch later');
        
        const data = await res.json();
        setVideos(data);
      } catch (err) {
        setError('An error occurred while loading your watch later list.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWatchLater();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Watch Later</h1>
          <p className={styles.subtitle}>{videos.length} videos</p>
        </div>
      </div>
      
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : error ? (
        <div className={styles.emptyState}>{error}</div>
      ) : videos.length === 0 ? (
        <div className={styles.emptyState}>Your watch later list is empty.</div>
      ) : (
        <div className={styles.grid}>
          {videos.map(video => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
