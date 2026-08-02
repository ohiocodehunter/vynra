import React from 'react';
import Link from 'next/link';
import { videoService, Video } from '@/lib/api';
import VideoCard from '@/components/video/VideoCard';
import styles from './page.module.css';
import { Compass, Flame, Music, Gamepad2, Trophy, Lightbulb } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  let videos: Video[] = [];
  try {
    videos = await videoService.getAllVideos({ sort: 'popular' });
  } catch (error) {
    console.error('Failed to fetch explore videos:', error);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Compass size={32} />
        </div>
        <h1 className={styles.title}>Explore</h1>
      </header>

      <div className={styles.categories}>
        <button className={`${styles.categoryCard} ${styles.trending}`}>
          <Flame size={24} />
          <span>Trending</span>
        </button>
        <button className={styles.categoryCard}>
          <Music size={24} />
          <span>Music</span>
        </button>
        <button className={styles.categoryCard}>
          <Gamepad2 size={24} />
          <span>Gaming</span>
        </button>
        <button className={styles.categoryCard}>
          <Trophy size={24} />
          <span>Sports</span>
        </button>
        <button className={styles.categoryCard}>
          <Lightbulb size={24} />
          <span>Learning</span>
        </button>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Trending Videos</h2>
        <div className={styles.grid}>
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      </section>
    </div>
  );
}
