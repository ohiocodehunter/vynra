'use client';

import React, { useState, useMemo, useEffect } from 'react';
import styles from '@/app/(main)/watch/page.module.css';
import { Video } from '@/lib/api';
import VideoCard from './VideoCard';
import AutoplayToggle from './AutoplayToggle';

interface UpNextSidebarProps {
  currentVideo: Video;
  allVideos: Video[];
}

export default function UpNextSidebar({ currentVideo, allVideos }: UpNextSidebarProps) {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Related'>('All');

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute upNext videos based on the active filter
  const upNextVideos = useMemo(() => {
    let result = allVideos.filter(v => v._id !== currentVideo._id);
    
    if (activeFilter === 'Related') {
      const currentTags = new Set((currentVideo.tags || []).map(t => t.toLowerCase()));
      const stopWords = new Set(['the', 'is', 'in', 'and', 'to', 'of', 'a', 'with', 'for', 'on', 'how', 'what', 'why', 'when', 'my', 'your', 'this', 'that', 'it', 'at']);
      
      const extractTokens = (str: string) => {
        return (str || '').toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
      };

      const currentTitleTokens = new Set(extractTokens(currentVideo.title));
      const currentDescTokens = new Set(extractTokens(currentVideo.description));

      const scoredVideos = result.map(v => {
        let score = 0;
        
        // 1. Same Creator (+15 points)
        if (v.creator?._id === currentVideo.creator?._id) {
          score += 15;
        }
        
        // 2. Matching Tags (+5 points per tag)
        const vTags = v.tags || [];
        vTags.forEach(tag => {
          if (currentTags.has(tag.toLowerCase())) {
            score += 5;
          }
        });
        
        // 3. Title Overlap (+3 points per matching keyword)
        const vTitleTokens = extractTokens(v.title);
        vTitleTokens.forEach(token => {
          if (currentTitleTokens.has(token)) {
            score += 3;
          }
        });

        // 4. Description Overlap (+1 point per matching keyword)
        const vDescTokens = extractTokens(v.description);
        vDescTokens.forEach(token => {
          if (currentDescTokens.has(token)) {
            score += 1;
          }
        });

        return { video: v, score };
      });

      // Sort by highest score. Filter out 0 scores if you only want strictly related videos.
      // But we keep them at the bottom just in case we need to pad the list.
      scoredVideos.sort((a, b) => b.score - a.score);
      
      // If we are on the client, we can slightly shuffle videos with the same score
      // to keep it feeling fresh without breaking relevance.
      if (isMounted) {
        // Group by score and shuffle within the groups (optional, simple sort is usually fine)
        // Here we just extract the sorted videos.
      }

      // Return the top 15 most related videos
      return scoredVideos.slice(0, 15).map(sv => sv.video);
    } 

    // For "All" filter, return a randomized list (on client) or stable list (on server)
    if (isMounted) {
      return result.sort(() => 0.5 - Math.random()).slice(0, 15);
    }
    
    return result.slice(0, 15);
  }, [allVideos, currentVideo, activeFilter, isMounted]);

  return (
    <div className={styles.upNextColumn}>
      <div className={styles.upNextHeader}>
        <h3>Up next</h3>
        <AutoplayToggle />
      </div>
      
      <div className={styles.filtersRow}>
        <button 
          className={`${styles.filterBtn} ${activeFilter === 'All' ? styles.active : ''}`}
          onClick={() => setActiveFilter('All')}
        >
          All
        </button>
        <button 
          className={`${styles.filterBtn} ${activeFilter === 'Related' ? styles.active : ''}`}
          onClick={() => setActiveFilter('Related')}
        >
          Related
        </button>
      </div>

      <div className={styles.upNextList}>
        {upNextVideos.length > 0 ? (
          upNextVideos.map(upNext => (
            <div key={upNext._id} style={{ animation: 'slideIn 0.3s ease-out' }}>
              <VideoCard video={upNext} layout="horizontal" />
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem' }}>No related videos found.</p>
        )}
      </div>
    </div>
  );
}
