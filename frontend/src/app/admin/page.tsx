'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className={styles.welcomeBanner}>
        <h2>System Status: <span className={styles.healthy}>Healthy</span></h2>
        <p>Welcome to the Vynra Secure Admin Dashboard.</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Users</h3>
          <div className={styles.statValue}>{stats?.totalUsers || '...'}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Total Videos</h3>
          <div className={styles.statValue}>{stats?.totalVideos || '...'}</div>
        </div>
      </div>
    </div>
  );
}
