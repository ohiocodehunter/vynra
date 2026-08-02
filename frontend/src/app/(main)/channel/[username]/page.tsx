'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import { Video as VideoIcon } from 'lucide-react';
import VideoCard from '@/components/video/VideoCard';
import Link from 'next/link';
import { User, Video, userService } from '@/lib/api';
import ChannelPlaylists from './ChannelPlaylists';

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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const response = await fetch(`${(typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'))}/users/channel/${username}`);
        if (response.ok) {
          const data = await response.json();
          setChannelData(data);
          setSubscriberCount(data.user.subscribersCount || 0);
          
          if (currentUser && currentUser.subscriptions) {
            setIsSubscribed(currentUser.subscriptions.includes(data.user._id));
          } else if (currentUser) {
            // Fallback: check if we need to fetch subscriptions if they aren't on currentUser
            const meRes = await fetch(`${(typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'))}/users/me`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              setIsSubscribed(meData.subscriptions?.includes(data.user._id) || false);
            }
          }
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
  const isOwner = Boolean(
    currentUser && 
    (currentUser.id === (user._id || user.id) || currentUser.username === user.username)
  );

  const handleSubscribeToggle = async () => {
    if (!currentUser) return;
    setIsSubscribing(true);
    try {
      if (isSubscribed) {
        const res = await userService.unsubscribeFromChannel(user._id || user.id!);
        setIsSubscribed(false);
        setSubscriberCount(res.subscribersCount);
      } else {
        const res = await userService.subscribeToChannel(user._id || user.id!);
        setIsSubscribed(true);
        setSubscriberCount(res.subscribersCount);
      }
    } catch (error) {
      console.error('Failed to toggle subscription', error);
    } finally {
      setIsSubscribing(false);
    }
  };

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
              <span>{subscriberCount} subscribers</span>
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
              ) : currentUser ? (
                <button 
                  className={`${styles.subscribeBtn} ${isSubscribed ? styles.subscribed : ''}`}
                  onClick={handleSubscribeToggle}
                  disabled={isSubscribing}
                  style={isSubscribed ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' } : {}}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              ) : (
                <Link href="/">
                  <button className={styles.subscribeBtn}>Sign in to Subscribe</button>
                </Link>
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
          className={`${styles.tab} ${activeTab === 'playlists' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('playlists')}
        >
          Playlists
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

        {activeTab === 'playlists' && (
          <ChannelPlaylists username={user.username} />
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
