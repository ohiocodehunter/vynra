'use client';

import React, { useEffect, useState, useRef } from 'react';
import { videoService, Video } from '@/lib/api';
import styles from './page.module.css';
import ShortPlayer from './ShortPlayer';
import ShortSkeleton from '@/components/ui/ShortSkeleton';

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchShorts = async () => {
      try {
        const data = await videoService.getAllVideos({ tag: 'shorts' });
        setShorts(data);
      } catch (error) {
        console.error('Failed to fetch shorts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShorts();
  }, []);

  useEffect(() => {
    // Intersection Observer to play/pause videos based on visibility
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          video.play().catch(e => console.log('Auto-play prevented:', e));
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    }, { threshold: 0.6 }); // 60% of video must be visible

    const videos = document.querySelectorAll('video');
    videos.forEach((video) => observer.observe(video));

    return () => {
      videos.forEach((video) => observer.unobserve(video));
    };
  }, [shorts]);

  if (loading) {
    return (
      <div className={styles.shortsContainer} style={{ padding: '20px' }}>
        <div style={{ height: 'calc(100vh - 100px)', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <ShortSkeleton />
        </div>
      </div>
    );
  }

  if (shorts.length === 0) {
    return <div className={styles.loading}>No shorts found.</div>;
  }

  return (
    <div className={styles.shortsContainer} ref={containerRef}>
      {shorts.map((short) => (
        <ShortPlayer 
          key={short._id} 
          short={short} 
        />
      ))}
    </div>
  );
}
