'use client';

import React, { useState, useEffect } from 'react';
import VideoCard from '@/components/video/VideoCard';
import { Video } from '@/lib/api';
import styles from '@/components/video/InfiniteVideoGrid.module.css';
import { Loader2, Tv } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SubscriptionsPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSubscriptions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin'); // Redirect to login if not authenticated
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`${(typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'))}/videos/subscriptions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setVideos(data);
        } else {
          setVideos([]);
        }
      } catch (error) {
        console.error('Failed to fetch subscription videos', error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, [router]);

  return (
    <div className={styles.container}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', background: 'var(--bg-surface)', borderRadius: '50%', color: 'var(--primary)' }}>
          <Tv size={32} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Subscriptions</h1>
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
        <p className={styles.endMessage}>No videos found from your subscriptions.</p>
      )}
    </div>
  );
}
