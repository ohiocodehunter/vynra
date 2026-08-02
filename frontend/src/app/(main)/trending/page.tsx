'use client';

import React, { useState, useEffect } from 'react';
import VideoCard from '@/components/video/VideoCard';
import { Video, videoService } from '@/lib/api';
import styles from '@/components/video/InfiniteVideoGrid.module.css';
import { Loader2, TrendingUp } from 'lucide-react';

export default function TrendingPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        // We bypass the global videoService for this specific call 
        // to ensure we pass sort=popular to the raw endpoint if videoService doesn't support query params
        const res = await fetch(`${(typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'))}/videos?sort=popular`);
        if (res.ok) {
          const data = await res.json();
          setVideos(data);
        } else {
          setVideos([]);
        }
      } catch (error) {
        console.error('Failed to fetch trending videos', error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div className={styles.container}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', background: 'var(--bg-surface)', borderRadius: '50%', color: '#ef4444' }}>
          <TrendingUp size={32} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Trending</h1>
      </header>

      {/* Main Video Grid */}
      {loading ? (
        <div className={styles.loaderContainer}>
          <Loader2 className={styles.spinner} size={32} />
        </div>
      ) : (
        <div className={styles.grid}>
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
      
      {!loading && videos.length === 0 && (
        <p className={styles.endMessage}>No trending videos found.</p>
      )}
    </div>
  );
}
