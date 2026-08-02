'use client';

import React from 'react';
import { LayoutDashboard, PlaySquare, BarChart2, MessageSquare, Users, ListVideo, DollarSign, Settings, Send, Video as VideoIcon, Bell } from 'lucide-react';
import styles from './layout.module.css';
import Link from 'next/link';

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className={styles.studioContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <span className={styles.logoText}>Studio</span>
        </div>

        <nav className={styles.navSection}>
          <Link href="/studio" className={`${styles.navItem} ${styles.active}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/studio/content" className={styles.navItem}>
            <PlaySquare size={20} />
            <span>Content</span>
          </Link>
          <Link href="/studio/analytics" className={styles.navItem}>
            <BarChart2 size={20} />
            <span>Analytics</span>
          </Link>
          <Link href="/studio/comments" className={styles.navItem}>
            <MessageSquare size={20} />
            <span>Comments</span>
          </Link>
          <Link href="/studio/subscribers" className={styles.navItem}>
            <Users size={20} />
            <span>Subscribers</span>
          </Link>
          <Link href="/studio/playlists" className={styles.navItem}>
            <ListVideo size={20} />
            <span>Playlists</span>
          </Link>
          <Link href="/studio/monetization" className={styles.navItem}>
            <DollarSign size={20} />
            <span>Monetization</span>
          </Link>
        </nav>

        <div className={styles.spacer}></div>

        <nav className={styles.navSection}>
          <Link href="/studio/settings" className={styles.navItem}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <Link href="/studio/feedback" className={styles.navItem}>
            <Send size={20} />
            <span>Send feedback</span>
          </Link>
        </nav>

        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>K</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>Karan OCH</div>
            <div className={styles.userRole}>@ohiocodehunter</div>
          </div>
        </div>
      </aside>
      
      <main className={styles.mainContent}>
        <div className={styles.topbar}>
          <div className={styles.topbarSearch}>
            <input type="text" placeholder="Search across your channel" />
          </div>
          <div className={styles.topbarActions}>
            <Link href="/studio/upload" style={{ textDecoration: 'none' }}>
              <button className={styles.createBtn}>
                <VideoIcon size={20} />
                <span>Create</span>
              </button>
            </Link>
            <button className={styles.iconBtn}>
              <Bell size={20} />
            </button>
          </div>
        </div>
        <div className={styles.pageContent}>
          {children}
        </div>
      </main>
    </div>
  );
}
