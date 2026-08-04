'use client';

import React, { useEffect, useState } from 'react';
import { LayoutDashboard, PlaySquare, BarChart2, MessageSquare, Users, DollarSign, Settings, Send, Video as VideoIcon, Menu, X, Bell } from 'lucide-react';
import styles from './layout.module.css';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import NotificationDropdown from '@/components/layout/NotificationDropdown';

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  if (user?.accountStatus === 'suspended') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', color: '#fff', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ffaa00', marginBottom: '1rem' }}>Account Suspended</h1>
        <p style={{ maxWidth: 500, lineHeight: 1.5 }}>Your account has been temporarily suspended due to a violation of our terms of service. You cannot access the Creator Studio, but you may still watch videos.</p>
        <Link href="/" style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#333', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>Return to Homepage</Link>
      </div>
    );
  }

  if (user?.accountStatus === 'banned') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', color: '#fff', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ff3333', marginBottom: '1rem' }}>Account Banned</h1>
        <p style={{ maxWidth: 500, lineHeight: 1.5 }}>Your account has been permanently banned for severe violations of our terms of service. You can no longer access the Creator Studio.</p>
        <Link href="/" style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#333', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>Return to Homepage</Link>
      </div>
    );
  }

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
            <img src="/favicon.ico" alt="Vynra Studio" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
          <span className={styles.logoText}>Studio</span>
          
          <button className={styles.mobileCloseBtn} onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className={styles.navSection}>
          <Link href="/studio" className={`${styles.navItem} ${pathname === '/studio' ? styles.active : ''}`} onClick={closeSidebar}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/studio/content" className={`${styles.navItem} ${pathname === '/studio/content' ? styles.active : ''}`} onClick={closeSidebar}>
            <PlaySquare size={20} />
            <span>Content</span>
          </Link>
          <Link href="/studio/analytics" className={`${styles.navItem} ${pathname === '/studio/analytics' ? styles.active : ''}`} onClick={closeSidebar}>
            <BarChart2 size={20} />
            <span>Analytics</span>
          </Link>
          <Link href="/studio/comments" className={`${styles.navItem} ${pathname === '/studio/comments' ? styles.active : ''}`} onClick={closeSidebar}>
            <MessageSquare size={20} />
            <span>Comments</span>
          </Link>
          <Link href="/studio/subscribers" className={`${styles.navItem} ${pathname === '/studio/subscribers' ? styles.active : ''}`} onClick={closeSidebar}>
            <Users size={20} />
            <span>Subscribers</span>
          </Link>
          <Link href="/studio/monetization" className={`${styles.navItem} ${pathname === '/studio/monetization' ? styles.active : ''}`} onClick={closeSidebar}>
            <DollarSign size={20} />
            <span>Monetization</span>
          </Link>
        </nav>

        <div className={styles.spacer}></div>

        <nav className={styles.navSection}>
          <Link href="/studio/settings" className={`${styles.navItem} ${pathname === '/studio/settings' ? styles.active : ''}`} onClick={closeSidebar}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <Link href="/studio/feedback" className={`${styles.navItem} ${pathname === '/studio/feedback' ? styles.active : ''}`} onClick={closeSidebar}>
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
            <div style={{ position: 'relative' }}>
              <button className={styles.iconBtn} onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
              </button>
              {showNotifications && (
                <NotificationDropdown onClose={() => setShowNotifications(false)} />
              )}
            </div>
          </div>
        </div>
        <div className={styles.pageContent}>
          {children}
        </div>
      </main>
    </div>
  );
}
