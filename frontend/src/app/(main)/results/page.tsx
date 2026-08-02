import React from 'react';
import Link from 'next/link';
import { videoService, userService, Video, User } from '@/lib/api';
import styles from './page.module.css';
import SubscribeButton from '@/components/video/SubscribeButton';

// Using async component since Next.js 15+ searchParams is async
export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  
  if (!q) {
    return <div className={styles.container}><h2>Please enter a search term.</h2></div>;
  }

  // Fetch videos and channels based on search query
  let videos: Video[] = [];
  let channels: User[] = [];
  
  try {
    const [videosData, channelsData] = await Promise.all([
      videoService.getAllVideos({ q }),
      userService.searchChannels(q)
    ]);
    videos = videosData;
    channels = channelsData;
  } catch (error) {
    console.error('Error fetching search results:', error);
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Results for "{q}"</h1>
      
      {channels.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 className={styles.sectionTitle}>Channels</h2>
          <div className={styles.channelList}>
            {channels.map((channel) => (
              <div key={channel._id || channel.username} className={styles.channelCard}>
                <Link href={`/channel/${channel.username}`} style={{ display: 'contents' }}>
                  <div 
                    className={styles.channelAvatar} 
                    style={{ 
                      backgroundImage: `url(${channel.avatarUrl || ''})`, 
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: 'var(--bg-tertiary)'
                    }} 
                  />
                  <div className={styles.channelInfo}>
                    <h3 className={styles.channelName}>{channel.channelName || channel.username}</h3>
                    <div className={styles.channelMeta}>
                      @{channel.username} • {channel.subscribersCount || 0} subscribers
                    </div>
                    {channel.bio && <p className={styles.channelBio}>{channel.bio}</p>}
                  </div>
                </Link>
                <div style={{ paddingLeft: '1rem' }}>
                  <SubscribeButton 
                    channelId={channel._id || ''} 
                    className={styles.subscribeBtn} 
                    subscribedClassName=""
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length === 0 ? (
        <div className={styles.emptyState}>No videos found matching your search.</div>
      ) : (
        <div className={styles.videoList}>
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
                <div className={styles.metaRow}>
                  <p className={styles.videoCreator}>{video.creator?.username || 'Unknown'}</p>
                  <span className={styles.dot}>•</span>
                  <p className={styles.videoStats}>{video.views >= 1000 ? Math.floor(video.views / 1000) + 'K' : video.views} views</p>
                  <span className={styles.dot}>•</span>
                  <p className={styles.videoDate}>
                    {new Date(video.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <p className={styles.description}>{video.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
