'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { studioService } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function StudioDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const data = await studioService.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch studio stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;
  }

  return (
    <div className={styles.studioDashboard}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Total Views</div>
          <div className={styles.statValue}>{stats?.totalViews?.toLocaleString() || 0}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Watch Time (hours)</div>
          <div className={styles.statValue}>{stats?.totalWatchTimeHours || '0.0'}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Total Likes</div>
          <div className={styles.statValue}>{stats?.totalLikes?.toLocaleString() || 0}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Total Videos</div>
          <div className={styles.statValue}>{stats?.totalVideos || 0}</div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Main Chart Panel (Placeholder line chart) */}
        <div className={styles.chartPanel}>
          <div className={styles.chartHeader}>
            <div className={styles.chartMetric}>
              <div className={styles.metricLabel}>Views</div>
              <div className={styles.metricValue}>{stats?.totalViews?.toLocaleString() || 0}</div>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <svg viewBox="0 0 500 100" className={styles.lineChart} preserveAspectRatio="none">
              <path d="M0,80 Q20,90 40,70 T80,50 T120,60 T160,20 T200,40 T240,10 T280,30 T320,60 T360,40 T400,20 T440,50 T480,10 L500,20" 
                    fill="none" stroke="#6C63FF" strokeWidth="3" />
              <circle cx="0" cy="80" r="4" fill="#6C63FF" />
              <circle cx="480" cy="10" r="4" fill="#6C63FF" />
            </svg>
            <div className={styles.chartLabels}>
              <span>Past 30 days</span>
            </div>
          </div>
        </div>

        {/* Top Videos Sidebar */}
        <div className={styles.topVideosPanel}>
          <h3 className={styles.panelTitle}>Top Videos</h3>
          <div className={styles.topVideoList}>
            {stats?.topVideos?.length > 0 ? (
              stats.topVideos.map((video: any) => (
                <div key={video._id} className={styles.topVideoItem}>
                  <div 
                    className={styles.topVideoThumb} 
                    style={{ backgroundImage: `url(${video.thumbnailUrl})`, backgroundSize: 'cover' }}
                  ></div>
                  <div className={styles.topVideoInfo}>
                    <div className={styles.topVideoTitle}>{video.title}</div>
                    <div className={styles.topVideoViews}>{video.views?.toLocaleString() || 0} views</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No videos uploaded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
