'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import { Video as VideoIcon } from 'lucide-react';
import VideoCard from '@/components/video/VideoCard';
import Link from 'next/link';
import { User, Video } from '@/lib/api';

interface ChannelData {
  user: User;
  videos: Video[];
}

export default function ChannelPage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();
  
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/users/channel/${username}`);
        if (response.ok) {
          const data = await response.json();
          setChannelData(data);
        }
      } catch (error) {
        console.error('Error fetching channel:', error);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchChannel();
    }
  }, [username]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading channel...</div>;
  }

  if (!channelData || !channelData.user) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <VideoIcon size={64} />
        </div>
        <h2 className={styles.emptyTitle}>Channel not found</h2>
        <p>This channel doesn't exist.</p>
      </div>
    );
  }

  const { user, videos } = channelData;
  const isOwner = currentUser?.id === user.id || currentUser?.username === user.username;

  return (
    <div>
      <div className={styles.channelHeader}>
        <div className={styles.bannerContainer}>
          {user.bannerUrl ? (
            <img src={user.bannerUrl} alt="Channel Banner" className={styles.bannerImage} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--gradient-main)', opacity: 0.5 }}></div>
          )}
        </div>
        
        <div className={styles.channelInfo}>
          <div className={styles.avatarContainer}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className={styles.avatarImage} />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className={styles.channelDetails}>
            <h1 className={styles.channelName}>{user.channelName || user.username}</h1>
            <div className={styles.channelMeta}>
              <span>{user.subscribersCount || 0} subscribers</span>
              <span>•</span>
              <span>{videos.length} videos</span>
            </div>
            {user.bio && (
              <p className={styles.channelBio}>{user.bio}</p>
            )}
            
            <div className={styles.subscribeAction}>
              {isOwner ? (
                <Link href="/studio/settings" className={styles.editProfileBtn}>
                  Customize channel
                </Link>
              ) : (
                <button className={styles.subscribeBtn}>
                  Subscribe
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.tabs}>
        <div 
          className={`${styles.tab} ${activeTab === 'videos' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          Videos
        </div>
        <div 
          className={`${styles.tab} ${activeTab === 'shorts' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('shorts')}
        >
          Shorts
        </div>
        <div 
          className={`${styles.tab} ${activeTab === 'about' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </div>
      </div>
      
      <div className={styles.contentArea}>
        {activeTab === 'videos' && (
          videos.length > 0 ? (
            <div className={styles.grid}>
              {videos.map(video => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <VideoIcon size={48} />
              </div>
              <h2 className={styles.emptyTitle}>No videos yet</h2>
              {isOwner && (
                <Link href="/studio/upload">
                  <button className={styles.editProfileBtn} style={{ marginTop: '16px' }}>Upload a video</button>
                </Link>
              )}
            </div>
          )
        )}
        
        {activeTab === 'shorts' && (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>No shorts yet</h2>
          </div>
        )}
        
        {activeTab === 'about' && (
          <div style={{ maxWidth: '800px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Description</h3>
            <p>{user.bio || 'This channel has no description.'}</p>
            
            <h3 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>Stats</h3>
            <p>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
