"use client";

import React, { useEffect, useState } from "react";
import {
  Home,
  Compass,
  Tv,
  TrendingUp,
  MonitorPlay,
  History,
  Clock,
  ThumbsUp,
  ListVideo,
  ChevronDown,
} from "lucide-react";
import styles from "./Sidebar.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";

export default function Sidebar() {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${(typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'))}/users/subscriptions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSubscriptions(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscriptions();
  }, []);

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""}`}
    >
      <nav className={styles.navSection}>
        <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}>
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link href="/explore" className={`${styles.navItem} ${pathname === '/explore' ? styles.active : ''}`}>
          <Compass size={20} />
          <span>Explore</span>
        </Link>
        <Link href="/subscriptions" className={`${styles.navItem} ${pathname === '/subscriptions' ? styles.active : ''}`}>
          <Tv size={20} />
          <span>Subscriptions</span>
        </Link>
        <Link href="/trending" className={`${styles.navItem} ${pathname === '/trending' ? styles.active : ''}`}>
          <TrendingUp size={20} />
          <span>Trending</span>
        </Link>
        <Link href="/shorts" className={`${styles.navItem} ${pathname.startsWith('/shorts') ? styles.active : ''}`}>
          <MonitorPlay size={20} />
          <span>Shorts</span>
        </Link>
      </nav>

      <div className={styles.divider}></div>

      <nav className={styles.navSection}>
        <Link href="/library" className={`${styles.navItem} ${pathname === '/library' ? styles.active : ''}`}>
          <ListVideo size={20} />
          <span>Library</span>
        </Link>
        <Link href="/history" className={`${styles.navItem} ${pathname === '/history' ? styles.active : ''}`}>
          <History size={20} />
          <span>History</span>
        </Link>
        <Link href="/watch-later" className={`${styles.navItem} ${pathname === '/watch-later' ? styles.active : ''}`}>
          <Clock size={20} />
          <span>Watch Later</span>
        </Link>
        <Link href="/liked" className={`${styles.navItem} ${pathname === '/liked' ? styles.active : ''}`}>
          <ThumbsUp size={20} />
          <span>Liked Videos</span>
        </Link>
        <Link href="/playlists" className={`${styles.navItem} ${pathname === '/playlists' ? styles.active : ''}`}>
          <ListVideo size={20} />
          <span>Playlists</span>
        </Link>
      </nav>

      <div className={styles.divider}></div>

      <div className={styles.navSection}>
        <h4 className={styles.sectionTitle}>Your Channels</h4>
        
        {loading ? (
          <div style={{ padding: '0 16px', color: '#aaa', fontSize: '0.9rem' }}>Loading...</div>
        ) : subscriptions.length > 0 ? (
          <>
            {subscriptions.map(sub => (
              <Link href={`/channel/${sub.username}`} key={sub._id} className={styles.channelItem} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div 
                  className={styles.channelAvatar} 
                  style={{ 
                    backgroundImage: `url(${sub.avatarUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!sub.avatarUrl && (sub.username?.charAt(0).toUpperCase() || 'U')}
                </div>
                <span>{sub.username}</span>
              </Link>
            ))}
            {subscriptions.length > 3 && (
              <button className={styles.showMoreBtn}>
                <ChevronDown size={16} />
                <span>Show more</span>
              </button>
            )}
          </>
        ) : (
          <div style={{ padding: '8px 16px', color: '#888', fontSize: '0.9rem' }}>
            No subscriptions
          </div>
        )}
      </div>
      <div className={styles.spacer}></div>
    </aside>
  );
}
