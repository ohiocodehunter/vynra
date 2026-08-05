'use client';

import React, { useState, useEffect } from 'react';
import VideoCard from '@/components/video/VideoCard';
import { Video, videoService } from '@/lib/api';
import styles from '@/components/video/InfiniteVideoGrid.module.css';
import { Loader2 } from 'lucide-react';
import VideoSkeleton from '@/components/ui/VideoSkeleton';

const CATEGORIES = ['All', 'Music', 'Gaming', 'Live', 'Mixes', 'Podcasts', 'News', 'Watched'];

export default function HomeFeed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [historyVideos, setHistoryVideos] = useState<Video[] | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const data = await videoService.getAllVideos();
        setVideos(data);
      } catch (error) {
        console.error('Failed to fetch videos', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  useEffect(() => {
    if (activeCategory === 'Watched' && !historyVideos) {
      const fetchHistory = async () => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const res = await fetch(`${(typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api'))}/users/history`, {
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
    
    if (activeCategory === 'All') return videos;
    const lower = activeCategory.toLowerCase();
    const result = videos.filter(v => 
      v.title.toLowerCase().includes(lower) || 
      (v.description && v.description.toLowerCase().includes(lower)) ||
      (v.tags && v.tags.some(t => t.toLowerCase().includes(lower)))
    );
    
    // Fallback: If no videos match this category, return a few random ones
    return result.length > 0 ? result : videos.slice(0, 3);
  }, [videos, activeCategory, historyVideos]);

  const regularVideos = filteredVideos.filter(v => !v.tags?.includes('shorts'));
  const shortVideos = filteredVideos.filter(v => v.tags?.includes('shorts'));

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

      {loading ? (
        <div className={styles.feedLayout}>
          {/* Hero Skeleton */}
          <div className={styles.heroSection}>
            <div className={`${styles.shimmer} ${styles.sectionHeading}`} style={{ height: '24px', width: '120px', borderRadius: '4px', marginBottom: '1.25rem', background: '#222' }}></div>
            <div className={styles.heroWrapper}>
              <VideoSkeleton layout="vertical" />
            </div>
          </div>
          {/* Row Skeleton */}
          <div className={styles.rowSection}>
            <div className={`${styles.shimmer} ${styles.sectionHeading}`} style={{ height: '24px', width: '150px', borderRadius: '4px', marginBottom: '1.25rem', background: '#222' }}></div>
            <div className={styles.rowScroll}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.rowItem}>
                  <VideoSkeleton />
                </div>
              ))}
            </div>
          </div>
          {/* Shorts Skeleton */}
          <div className={styles.gridSection}>
            <div className={`${styles.shimmer} ${styles.sectionHeading}`} style={{ height: '24px', width: '80px', borderRadius: '4px', marginBottom: '1.25rem', background: '#222' }}></div>
            <div className={styles.shortsGrid}>
              {Array.from({ length: 4 }).map((_, i) => (
                <VideoSkeleton key={i} layout="shorts" />
              ))}
            </div>
          </div>
          {/* Grid Skeleton */}
          <div className={styles.gridSection}>
            <div className={`${styles.shimmer} ${styles.sectionHeading}`} style={{ height: '24px', width: '100px', borderRadius: '4px', marginBottom: '1.25rem', background: '#222' }}></div>
            <div className={styles.grid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <VideoSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className={styles.feedLayout}>
          
          {/* 1. Hero Section (Featured Video) */}
          {regularVideos[0] && (
            <div className={styles.heroSection}>
              <h2 className={styles.sectionHeading}>Featured</h2>
              <div className={styles.heroWrapper}>
                <VideoCard video={regularVideos[0]} layout="vertical" isPriority />
              </div>
            </div>
          )}

          {/* 2. Trending Row */}
          {regularVideos.length > 1 && (
            <div className={styles.rowSection}>
              <h2 className={styles.sectionHeading}>Trending</h2>
              <div className={styles.rowScroll}>
                {regularVideos.slice(1, 5).map((video, i) => (
                  <div key={video._id} className={styles.rowItem}>
                    <VideoCard video={video} isPriority={i < 4} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Shorts Section */}
          {shortVideos.length > 0 && (
            <div className={styles.gridSection}>
              <h2 className={styles.sectionHeading}>Shorts</h2>
              <div className={styles.shortsGrid}>
                {shortVideos.map((video) => (
                  <VideoCard key={video._id} video={video} layout="shorts" />
                ))}
              </div>
            </div>
          )}

          {/* 4. Recommended Row */}
          {regularVideos.length > 5 && (
            <div className={styles.rowSection}>
              <h2 className={styles.sectionHeading}>Recommended for You</h2>
              <div className={styles.rowScroll}>
                {regularVideos.slice(5, 9).map((video) => (
                  <div key={video._id} className={styles.rowItem}>
                    <VideoCard video={video} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Latest Grid */}
          {regularVideos.length > 9 && (
            <div className={styles.gridSection}>
              <h2 className={styles.sectionHeading}>Latest</h2>
              <div className={styles.grid}>
                {regularVideos.slice(9).map((video) => (
                  <VideoCard key={video._id} video={video} />
                ))}
              </div>
            </div>
          )}
          
        </div>
      ) : null}
      
      {!loading && filteredVideos.length > 0 && (
        <p className={styles.endMessage}>You have seen it all!</p>
      )}
      {!loading && filteredVideos.length === 0 && (
        <p className={styles.endMessage}>No videos found.</p>
      )}
    </div>
  );
}
