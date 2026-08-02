'use client';

import React, { useEffect, useState } from 'react';
import VideoCard from '@/components/video/VideoCard';
import { Video } from '@/lib/api';
import styles from './page.module.css';

export default function LikedVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLikedVideos = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to see your liked videos.');
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/videos/liked`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to fetch liked videos');
        
        const data = await res.json();
        setVideos(data);
      } catch (err) {
        setError('An error occurred while loading your liked videos.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLikedVideos();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Liked Videos</h1>
          <p className={styles.subtitle}>{videos.length} videos</p>
        </div>
      </div>
      
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : error ? (
        <div className={styles.emptyState}>{error}</div>
      ) : videos.length === 0 ? (
        <div className={styles.emptyState}>You haven't liked any videos yet.</div>
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
