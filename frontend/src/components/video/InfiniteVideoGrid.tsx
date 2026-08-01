'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import VideoCard from './VideoCard';
import { Video } from '@/lib/api';
import styles from './InfiniteVideoGrid.module.css';
import { Loader2 } from 'lucide-react';

interface Props {
  initialVideos: Video[];
}

const CATEGORIES = ['All', 'Music', 'Gaming', 'Live', 'Mixes', 'Podcasts', 'News', 'Recent', 'Watched'];

export default function InfiniteVideoGrid({ initialVideos }: Props) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const observerTarget = useRef(null);

  const loadMoreVideos = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      // For now, since we don't have true pagination in backend, 
      // we'll just mock infinite scroll by appending the same videos shuffled
      // In production: fetch(`/api/videos?page=${page + 1}`)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/videos`);
      const newVideos = await res.json();
      
      if (newVideos.length === 0 || page > 5) {
        setHasMore(false);
      } else {
        // Shuffle to simulate new content
        const shuffled = [...newVideos].sort(() => 0.5 - Math.random());
        setVideos(prev => [...prev, ...shuffled]);
        setPage(p => p + 1);
      }
    } catch (error) {
      console.error('Failed to load more videos', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMoreVideos();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMoreVideos]);

  return (
    <div className={styles.container}>
      {/* Category Pills */}
      <div className={styles.categoriesWrapper}>
        <div className={styles.categoriesScroll}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              className={`${styles.categoryPill} ${activeCategory === cat ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Video Grid */}
      <div className={styles.grid}>
        {videos.map((video, idx) => (
          // Use index in key because we are appending duplicates for infinite scroll simulation
          <VideoCard key={`${video._id}-${idx}`} video={video} />
        ))}
      </div>

      {/* Intersection Target & Loading Spinner */}
      {hasMore && (
        <div ref={observerTarget} className={styles.loaderContainer}>
          {loading && <Loader2 className={styles.spinner} size={32} />}
        </div>
      )}
      
      {!hasMore && (
        <p className={styles.endMessage}>You have seen it all!</p>
      )}
    </div>
  );
}
