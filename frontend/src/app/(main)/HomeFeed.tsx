'use client';

import React, { useState, useEffect } from 'react';
import VideoCard from '@/components/video/VideoCard';
import { Video, videoService } from '@/lib/api';
import styles from '@/components/video/InfiniteVideoGrid.module.css';
import { Loader2 } from 'lucide-react';

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

      {/* Main Content Area */}
      {loading ? (
        <div className={styles.loaderContainer}>
          <Loader2 className={styles.spinner} size={32} />
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className={styles.feedLayout}>
          
          {/* 1. Hero Section (Featured Video) */}
          {filteredVideos[0] && (
            <div className={styles.heroSection}>
              <h2 className={styles.sectionHeading}>Featured</h2>
              <div className={styles.heroWrapper}>
                <VideoCard video={filteredVideos[0]} layout="vertical" />
              </div>
            </div>
          )}

          {/* 2. Trending Row */}
          {filteredVideos.length > 1 && (
            <div className={styles.rowSection}>
              <h2 className={styles.sectionHeading}>Trending</h2>
              <div className={styles.rowScroll}>
                {filteredVideos.slice(1, 5).map((video) => (
                  <div key={video._id} className={styles.rowItem}>
                    <VideoCard video={video} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Recommended Row */}
          {filteredVideos.length > 5 && (
            <div className={styles.rowSection}>
              <h2 className={styles.sectionHeading}>Recommended for You</h2>
              <div className={styles.rowScroll}>
                {filteredVideos.slice(5, 9).map((video) => (
                  <div key={video._id} className={styles.rowItem}>
                    <VideoCard video={video} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Latest Grid */}
          {filteredVideos.length > 9 && (
            <div className={styles.gridSection}>
              <h2 className={styles.sectionHeading}>Latest</h2>
              <div className={styles.grid}>
                {filteredVideos.slice(9).map((video) => (
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
