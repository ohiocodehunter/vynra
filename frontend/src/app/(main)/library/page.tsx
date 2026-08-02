'use client';

import React from 'react';
import Link from 'next/link';
import { History, ThumbsUp, Clock, ListVideo, ChevronRight } from 'lucide-react';
import styles from './page.module.css';

export default function LibraryPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Library</h1>
      
      <div className={styles.sectionGrid}>
        
        <Link href="/history" className={styles.libraryCard}>
          <div className={styles.iconWrapper}>
            <History size={32} />
          </div>
          <div className={styles.cardContent}>
            <h2>History</h2>
            <p>Videos you have watched</p>
          </div>
          <ChevronRight size={24} className={styles.arrow} />
        </Link>

        <Link href="/watch-later" className={styles.libraryCard}>
          <div className={styles.iconWrapper}>
            <Clock size={32} />
          </div>
          <div className={styles.cardContent}>
            <h2>Watch Later</h2>
            <p>Videos saved for later</p>
          </div>
          <ChevronRight size={24} className={styles.arrow} />
        </Link>

        <Link href="/liked" className={styles.libraryCard}>
          <div className={styles.iconWrapper}>
            <ThumbsUp size={32} />
          </div>
          <div className={styles.cardContent}>
            <h2>Liked Videos</h2>
            <p>Videos you have liked</p>
          </div>
          <ChevronRight size={24} className={styles.arrow} />
        </Link>

        <Link href="/playlists" className={styles.libraryCard}>
          <div className={styles.iconWrapper}>
            <ListVideo size={32} />
          </div>
          <div className={styles.cardContent}>
            <h2>Playlists</h2>
            <p>Your saved playlists</p>
          </div>
          <ChevronRight size={24} className={styles.arrow} />
        </Link>
        
      </div>
    </div>
  );
}
