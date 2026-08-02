import React from 'react';
import Link from 'next/link';
import { videoService, Video } from '@/lib/api';
import styles from './page.module.css';
import { Compass, Flame, Music, Gamepad2, Trophy, Lightbulb } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  // Fetch popular videos
  const videos = await videoService.getAllVideos({ sort: 'popular' });

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
        <div className={styles.videoGrid}>
          {videos.map((video) => (
            <Link href={`/watch?v=${video._id}`} key={video._id} className={styles.videoCard}>
              <div className={styles.thumbnailContainer}>
                <div 
                  className={styles.thumbnail} 
                  style={{ backgroundImage: `url(${video.thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} 
                />
                <div className={styles.timestamp}>
                  {Math.floor(video.duration / 60)}:
                  {Math.floor(video.duration % 60) < 10 ? '0' : ''}{Math.floor(video.duration % 60)}
                </div>
              </div>
              <div className={styles.videoInfo}>
                <h3 className={styles.videoTitle}>{video.title}</h3>
                <p className={styles.videoCreator}>{video.creator?.username || 'Unknown'}</p>
                <p className={styles.videoStats}>
                  {video.views >= 1000 ? Math.floor(video.views / 1000) + 'K' : video.views} views
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
