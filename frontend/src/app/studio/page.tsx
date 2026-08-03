'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { studioService } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

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

  // Prepare chart data
  const chartData = {
    labels: stats?.viewsHistory?.map((item: any) => item.date) || [],
    datasets: [
      {
        fill: true,
        label: 'Views',
        data: stats?.viewsHistory?.map((item: any) => item.views) || [],
        borderColor: '#6C63FF',
        backgroundColor: 'rgba(108, 99, 255, 0.2)',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(15, 15, 18, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          maxTicksLimit: 7,
          color: 'rgba(255, 255, 255, 0.5)',
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

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
        {/* Main Chart Panel */}
        <div className={styles.chartPanel}>
          <div className={styles.chartHeader}>
            <div className={styles.chartMetric}>
              <div className={styles.metricLabel}>Views</div>
              <div className={styles.metricValue}>{stats?.totalViews?.toLocaleString() || 0}</div>
            </div>
          </div>
          <div className={styles.chartContainer}>
            {stats?.viewsHistory && stats.viewsHistory.length > 0 ? (
              <Line options={chartOptions} data={chartData} />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No views data available.
              </div>
            )}
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
