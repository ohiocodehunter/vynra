'use client';

import React, { useState, useEffect } from 'react';
import { playlistService, Playlist } from '@/lib/api';
import VideoCard from '@/components/video/VideoCard';
import styles from './page.module.css';
import { ListVideo } from 'lucide-react';

export default function ChannelPlaylists({ username }: { username: string }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const data = await playlistService.getUserPlaylists(username);
        setPlaylists(data);
      } catch (error) {
        console.error('Failed to fetch playlists:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, [username]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading playlists...</div>;
  }

  if (playlists.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <ListVideo size={48} />
        </div>
        <h2 className={styles.emptyTitle}>No playlists yet</h2>
        <p>This channel hasn't created any public playlists.</p>
      </div>
    );
  }

  return (
    <div className={styles.playlistsContainer}>
      {playlists.map((playlist) => (
        <div key={playlist._id} className={styles.playlistRow}>
          <h3 className={styles.playlistTitle}>{playlist.name}</h3>
          <div className={styles.playlistMeta}>{playlist.videos?.length || 0} videos</div>
          
          {playlist.videos && playlist.videos.length > 0 ? (
            <div className={styles.grid}>
              {playlist.videos.slice(0, 5).map(video => (
                // Safe cast here for rendering since the backend populates videos
                <VideoCard key={video._id as string} video={video as any} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyPlaylist}>This playlist has no videos yet.</div>
          )}
        </div>
      ))}
    </div>
  );
}
