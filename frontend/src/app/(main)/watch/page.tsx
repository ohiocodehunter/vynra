import React from 'react';
import styles from './page.module.css';
import { ThumbsUp, ThumbsDown, Share2, Download, BookmarkPlus, Play, Volume2, Maximize, Settings } from 'lucide-react';
import { videoService, Video } from '@/lib/api';
import Link from 'next/link';
import VideoCard from '@/components/video/VideoCard';
import ClientVideoPlayer from '@/components/video/ClientVideoPlayer';
import AutoplayToggle from '@/components/video/AutoplayToggle';

import VideoActions from '@/components/video/VideoActions';
import CommentsSection from '@/components/video/CommentsSection';
import SubscribeButton from '@/components/video/SubscribeButton';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default async function WatchPage({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v: videoId } = await searchParams;
  
  if (!videoId) {
    return <div className={styles.watchContainer}><h2>No video selected</h2></div>;
  }

  let video: Video | null = null;
  let allVideos: Video[] = [];
  
  try {
    video = await videoService.getVideoById(videoId);
    allVideos = await videoService.getAllVideos();
  } catch (err) {
    return <div className={styles.watchContainer}><h2>Video not found</h2></div>;
  }

  if (!video) return <div className={styles.watchContainer}><h2>Video not found</h2></div>;

  // Get related videos, filter out the current one, and randomly shuffle them
  const relatedVideos = allVideos.filter(v => v._id !== video?._id);
  const shuffledRelated = relatedVideos.sort(() => 0.5 - Math.random());
  const upNextVideos = shuffledRelated.slice(0, 15);
  const nextVideoId = upNextVideos.length > 0 ? upNextVideos[0]._id : undefined;

  return (
    <div className={styles.watchContainer}>
      <div className={styles.mainColumn}>
        {/* Real Video Player */}
        <div className={styles.videoPlayerContainer}>
          <ClientVideoPlayer url={video.url} poster={video.thumbnailUrl} nextVideoId={nextVideoId} videoId={video._id} />
        </div>

        {/* Video Metadata */}
        <div className={styles.videoMetadata}>
          <h1 className={styles.videoTitle}>{video.title}</h1>
          
          <div className={styles.videoActionsRow}>
            <div className={styles.channelInfo}>
              <Link href={`/channel/${video.creator?.username || 'ohiocodehunter'}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.channelAvatar} style={{ backgroundImage: `url(${video.creator?.avatarUrl || ''})`, backgroundSize: 'cover' }}></div>
                <div className={styles.channelText}>
                  <div className={styles.channelName}>{video.creator?.username || 'Upload by Dev'}</div>
                  <div className={styles.subCount}>{video.creator?.subscribersCount || 0} subscribers</div>
                </div>
              </Link>
              <SubscribeButton channelId={video.creator?._id || ''} />
            </div>
            
            <VideoActions initialVideo={video} />
          </div>

          <div className={styles.descriptionBox}>
            <p className={styles.descriptionStats}>{video.views.toLocaleString()} views • {new Date(video.createdAt).toLocaleDateString()}</p>
            <p className={styles.descriptionText}>
              {video.description || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* Comments Section */}
        <CommentsSection videoId={video._id} />
      </div>

      {/* Up Next Sidebar */}
      <div className={styles.upNextColumn}>
        <div className={styles.upNextHeader}>
          <h3>Up next</h3>
          <AutoplayToggle />
        </div>
        
        <div className={styles.filtersRow}>
          <button className={`${styles.filterBtn} ${styles.active}`}>All</button>
          <button className={styles.filterBtn}>Related</button>
        </div>

        <div className={styles.upNextList}>
          {upNextVideos.map(upNext => (
            <VideoCard key={upNext._id} video={upNext} layout="horizontal" />
          ))}
        </div>
      </div>
    </div>
  );
}
