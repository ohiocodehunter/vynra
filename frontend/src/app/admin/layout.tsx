import React from 'react';
import { LayoutDashboard, Users, Video, Grid, AlertTriangle, MessageSquare, BarChart, Settings, HardDrive } from 'lucide-react';
import styles from './layout.module.css';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <span className={styles.logoText}>Vynra Admin</span>
        </div>

        <nav className={styles.navSection}>
          <Link href="/admin" className={`${styles.navItem} ${styles.active}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/users" className={styles.navItem}>
            <Users size={20} />
            <span>Users</span>
          </Link>
          <Link href="/admin/videos" className={styles.navItem}>
            <Video size={20} />
            <span>Videos</span>
          </Link>
          <Link href="/admin/categories" className={styles.navItem}>
            <Grid size={20} />
            <span>Categories</span>
          </Link>
          <Link href="/admin/reports" className={styles.navItem}>
            <AlertTriangle size={20} />
            <span>Reports</span>
          </Link>
          <Link href="/admin/comments" className={styles.navItem}>
            <MessageSquare size={20} />
            <span>Comments</span>
          </Link>
          <Link href="/admin/analytics" className={styles.navItem}>
            <BarChart size={20} />
            <span>Analytics</span>
          </Link>
          <Link href="/admin/settings" className={styles.navItem}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <Link href="/admin/system" className={styles.navItem}>
            <HardDrive size={20} />
            <span>System</span>
          </Link>
        </nav>

        <div className={styles.spacer}></div>

        <div className={styles.userProfile}>
          <div className={styles.userAvatar}></div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>Admin User</div>
            <div className={styles.userRole}>Super Admin</div>
          </div>
        </div>
      </aside>
      
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
