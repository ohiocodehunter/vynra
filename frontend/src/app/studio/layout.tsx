'use client';

import React, { useEffect, useState } from 'react';
import { LayoutDashboard, PlaySquare, BarChart2, MessageSquare, Users, DollarSign, Settings, Send, Video as VideoIcon, Bell, Menu, X } from 'lucide-react';
import styles from './layout.module.css';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return null; // or a loading spinner
  }

  const closeSidebar = () => setIsMobileSidebarOpen(false);

  return (
    <div className={styles.studioContainer}>
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div className={styles.mobileOverlay} onClick={closeSidebar}></div>
      )}

      <aside className={`${styles.sidebar} ${isMobileSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <span className={styles.logoText}>Studio</span>
          
          <button className={styles.mobileCloseBtn} onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className={styles.navSection}>
          <Link href="/studio" className={`${styles.navItem} ${styles.active}`} onClick={closeSidebar}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/studio/content" className={styles.navItem} onClick={closeSidebar}>
            <PlaySquare size={20} />
            <span>Content</span>
          </Link>
          <Link href="/studio/analytics" className={styles.navItem} onClick={closeSidebar}>
            <BarChart2 size={20} />
            <span>Analytics</span>
          </Link>
          <Link href="/studio/comments" className={styles.navItem} onClick={closeSidebar}>
            <MessageSquare size={20} />
            <span>Comments</span>
          </Link>
          <Link href="/studio/subscribers" className={styles.navItem} onClick={closeSidebar}>
            <Users size={20} />
            <span>Subscribers</span>
          </Link>
          <Link href="/studio/monetization" className={styles.navItem} onClick={closeSidebar}>
            <DollarSign size={20} />
            <span>Monetization</span>
          </Link>
        </nav>

        <div className={styles.spacer}></div>

        <nav className={styles.navSection}>
          <Link href="/studio/settings" className={styles.navItem} onClick={closeSidebar}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <Link href="/studio/feedback" className={styles.navItem} onClick={closeSidebar}>
            <Send size={20} />
            <span>Send feedback</span>
          </Link>
        </nav>

        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} /> : (user?.channelName?.charAt(0) || 'K')}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.channelName || 'Karan OCH'}</div>
            <div className={styles.userRole}>@{user?.username || 'ohiocodehunter'}</div>
          </div>
        </div>
      </aside>
      
      <main className={styles.mainContent}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.mobileMenuBtn} onClick={() => setIsMobileSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className={styles.topbarSearch}>
              <input type="text" placeholder="Search across your channel" />
            </div>
          </div>
          <div className={styles.topbarActions}>
            <Link href="/studio/upload" style={{ textDecoration: 'none' }}>
              <button className={styles.createBtn}>
                <VideoIcon size={20} />
                <span className={styles.createBtnText}>Create</span>
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
