'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import VideoCard from './VideoCard';
import { Video, videoService } from '@/lib/api';
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
      // Fetch more videos using the properly configured videoService
      const newVideos = await videoService.getAllVideos();
      
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
      // Disable infinite scrolling temporarily to avoid a tight loop of network errors when backend is offline
      setHasMore(false);
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

  const [historyVideos, setHistoryVideos] = useState<Video[] | null>(null);

  useEffect(() => {
    if (activeCategory === 'Watched' && !historyVideos) {
      const fetchHistory = async () => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const res = await fetch(`${(typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'))}/users/history`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              setHistoryVideos(data);
            } else {
              setHistoryVideos([]);
            }
          } catch (e) {
            setHistoryVideos([]);
          }
        } else {
          setHistoryVideos([]);
        }
      };
      fetchHistory();
    }
  }, [activeCategory, historyVideos]);

  const filteredVideos = React.useMemo(() => {
    if (activeCategory === 'Watched') {
      return historyVideos || [];
    }
    if (activeCategory === 'Recent') {
      return [...videos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    if (activeCategory === 'All') return videos;
    const lower = activeCategory.toLowerCase();
    const result = videos.filter(v => 
      v.title.toLowerCase().includes(lower) || 
      (v.description && v.description.toLowerCase().includes(lower)) ||
      (v.tags && v.tags.some(t => t.toLowerCase().includes(lower)))
    );
    
    // Fallback: If no videos match this category (common with mock data), return a few random ones so the UI doesn't look completely empty
    return result.length > 0 ? result : videos.slice(0, 3);
  }, [videos, activeCategory, historyVideos]);

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
        {filteredVideos.map((video, idx) => (
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
