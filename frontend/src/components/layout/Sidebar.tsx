"use client";

import React from "react";
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
import { useSidebar } from "@/context/SidebarContext";

export default function Sidebar() {
  const { isCollapsed } = useSidebar();

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""}`}
    >
      <nav className={styles.navSection}>
        <Link href="/" className={`${styles.navItem} ${styles.active}`}>
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link href="/explore" className={styles.navItem}>
          <Compass size={20} />
          <span>Explore</span>
        </Link>
        <Link href="/subscriptions" className={styles.navItem}>
          <Tv size={20} />
          <span>Subscriptions</span>
        </Link>
        <Link href="/trending" className={styles.navItem}>
          <TrendingUp size={20} />
          <span>Trending</span>
        </Link>
        <Link href="/shorts" className={styles.navItem}>
          <MonitorPlay size={20} />
          <span>Shorts</span>
        </Link>
      </nav>

      <div className={styles.divider}></div>

      <nav className={styles.navSection}>
        <Link href="/library" className={styles.navItem}>
          <ListVideo size={20} />
          <span>Library</span>
        </Link>
        <Link href="/history" className={styles.navItem}>
          <History size={20} />
          <span>History</span>
        </Link>
        <Link href="/watch-later" className={styles.navItem}>
          <Clock size={20} />
          <span>Watch Later</span>
        </Link>
        <Link href="/liked" className={styles.navItem}>
          <ThumbsUp size={20} />
          <span>Liked Videos</span>
        </Link>
        <Link href="/playlists" className={styles.navItem}>
          <ListVideo size={20} />
          <span>Playlists</span>
        </Link>
      </nav>

      <div className={styles.divider}></div>

      <div className={styles.navSection}>
        <h4 className={styles.sectionTitle}>Your Channels</h4>
        <div className={styles.channelItem}>
          <div className={styles.channelAvatar}></div>
          <span>TechFlow</span>
        </div>
        <div className={styles.channelItem}>
          <div className={styles.channelAvatar}></div>
          <span>DesignHub</span>
        </div>
        <div className={styles.channelItem}>
          <div className={styles.channelAvatar}></div>
          <span>Travelista</span>
        </div>
        <button className={styles.showMoreBtn}>
          <ChevronDown size={16} />
          <span>Show more</span>
        </button>
      </div>
      <div className={styles.spacer}></div>
    </aside>
  );
}
