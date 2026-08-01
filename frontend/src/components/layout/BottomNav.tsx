import React from 'react';
import { Home, MonitorPlay, PlusCircle, Tv, ListVideo } from 'lucide-react';
import styles from './BottomNav.module.css';
import Link from 'next/link';

export default function BottomNav() {
  return (
    <nav className={styles.bottomNav}>
      <Link href="/" className={`${styles.navItem} ${styles.active}`}>
        <Home size={24} />
        <span>Home</span>
      </Link>
      <Link href="/shorts" className={styles.navItem}>
        <MonitorPlay size={24} />
        <span>Shorts</span>
      </Link>
      <Link href="/create" className={styles.navItemMain}>
        <PlusCircle size={40} className={styles.mainIcon} />
      </Link>
      <Link href="/subscriptions" className={styles.navItem}>
        <Tv size={24} />
        <span>Subscriptions</span>
      </Link>
      <Link href="/library" className={styles.navItem}>
        <ListVideo size={24} />
        <span>Library</span>
      </Link>
    </nav>
  );
}
