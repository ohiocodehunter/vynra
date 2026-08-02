'use client';

import React, { useEffect, useState } from 'react';
import VideoCard from '@/components/video/VideoCard';
import styles from '../liked/page.module.css'; // Reusing layout css

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlaylists = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to see your playlists.');
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`${(typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'))}/playlists`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to fetch playlists');
        
        const data = await res.json();
        setPlaylists(data);
      } catch (err) {
        setError('An error occurred while loading your playlists.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlaylists();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Playlists</h1>
          <p className={styles.subtitle}>{playlists.length} playlists</p>
        </div>
      </div>
      
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : error ? (
        <div className={styles.emptyState}>{error}</div>
      ) : playlists.length === 0 ? (
        <div className={styles.emptyState}>You have no playlists yet.</div>
      ) : (
        <div className={styles.grid}>
          {playlists.map(pl => (
            <div key={pl._id} style={{ background: '#1c1c1c', padding: '16px', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 12px', color: 'white' }}>{pl.name}</h3>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '16px' }}>{pl.videos?.length || 0} videos • {pl.isPublic ? 'Public' : 'Private'}</p>
              {pl.videos?.length > 0 && pl.videos[0] ? (
                <VideoCard video={pl.videos[0]} />
              ) : (
                <div style={{ height: '180px', background: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                  Empty Playlist
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
