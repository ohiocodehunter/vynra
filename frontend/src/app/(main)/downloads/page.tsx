'use client';

import React, { useEffect, useState } from 'react';
import { Video } from '@/lib/api';
import VideoCard from '@/components/video/VideoCard';
import styles from '@/components/video/InfiniteVideoGrid.module.css';
import { getOfflineVideos } from '@/lib/offlineDownload';
import { DownloadCloud } from 'lucide-react';

export default function DownloadsPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load videos from local storage metadata
    const offlineVids = getOfflineVideos();
    setVideos(offlineVids);
    setLoading(false);
  }, []);

  return (
    <div className={styles.container} style={{ paddingTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <DownloadCloud size={28} color="var(--primary)" />
        <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Offline Downloads</h1>
      </div>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Videos downloaded here are saved directly in your browser and can be watched without an internet connection.
      </p>

      {loading ? (
        <div className={styles.grid}>
          {/* We could use VideoSkeleton here, but for local storage it's usually instant */}
        </div>
      ) : videos.length > 0 ? (
        <div className={styles.grid}>
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No downloads yet.</p>
          <p>Tap the Download button on any video to save it for offline viewing.</p>
        </div>
      )}
    </div>
  );
}
