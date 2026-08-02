'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import { studioService } from '@/lib/api';
import { Eye, Clock, ThumbsUp, Users } from 'lucide-react';
import Link from 'next/link';

interface StudioStats {
  totalViews: number;
  totalLikes: number;
  totalWatchTimeHours: string;
  totalVideos: number;
  topVideos: Array<{
    _id: string;
    title: string;
    views: number;
    thumbnailUrl: string;
  }>;
}

export default function StudioAnalytics() {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState<StudioStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await studioService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  if (loading) {
    return <div className={styles.container}>Loading analytics...</div>;
  }

  if (!stats) {
    return <div className={styles.container}>Failed to load analytics.</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Channel analytics</h1>

      <div className={styles.overviewSection}>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>
              <Eye size={18} /> Views
            </div>
            <div className={styles.metricValue}>{stats.totalViews.toLocaleString()}</div>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>
              <Clock size={18} /> Watch time (hours)
            </div>
            <div className={styles.metricValue}>{stats.totalWatchTimeHours}</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>
              <Users size={18} /> Subscribers
            </div>
            <div className={styles.metricValue}>{user?.subscribersCount || 0}</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>
              <ThumbsUp size={18} /> Total Likes
            </div>
            <div className={styles.metricValue}>{stats.totalLikes.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className={styles.topVideosSection}>
        <div className={styles.topVideosHeader}>
          <h2>Top videos</h2>
        </div>
        
        {stats.topVideos.length === 0 ? (
          <div className={styles.emptyState}>No videos with views yet.</div>
        ) : (
          <div className={styles.videoList}>
            {stats.topVideos.map((video, index) => (
              <Link href={`/watch?v=${video._id}`} key={video._id} className={styles.videoItem}>
                <div className={styles.rank}>{index + 1}</div>
                <div 
                  className={styles.videoThumb} 
                  style={{ backgroundImage: `url(${video.thumbnailUrl || ''})` }}
                />
                <div className={styles.videoInfo}>
                  <div className={styles.videoTitle}>{video.title}</div>
                  <div className={styles.videoViews}>{video.views.toLocaleString()} views</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
