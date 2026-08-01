import React from 'react';
import styles from './page.module.css';
import { Video } from '@/lib/api';

async function getVideos() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/videos`, { 
    cache: 'no-store' 
  });
  if (!res.ok) {
    throw new Error('Failed to fetch videos');
  }
  return res.json() as Promise<Video[]>;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const dynamic = 'force-dynamic';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

import InfiniteVideoGrid from '@/components/video/InfiniteVideoGrid';

export default async function Home() {
  const videos = await getVideos();
  const shuffledVideos = shuffleArray(videos);

  return (
    <div className={styles.homeContainer}>
      <InfiniteVideoGrid initialVideos={shuffledVideos} />
    </div>
  );
}
