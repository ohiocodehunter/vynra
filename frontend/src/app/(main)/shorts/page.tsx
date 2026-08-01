'use client';

import React, { useEffect, useState, useRef } from 'react';
import { videoService, Video } from '@/lib/api';
import { ThumbsUp, MessageSquare, Share2, MoreVertical, Volume2, VolumeX } from 'lucide-react';
import styles from './page.module.css';

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchShorts = async () => {
      try {
        const data = await videoService.getAllVideos({ tag: 'shorts' });
        setShorts(data);
      } catch (error) {
        console.error('Failed to fetch shorts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShorts();
  }, []);

  useEffect(() => {
    // Intersection Observer to play/pause videos based on visibility
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          video.play().catch(e => console.log('Auto-play prevented:', e));
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    }, { threshold: 0.6 }); // 60% of video must be visible

    const videos = document.querySelectorAll('video');
    videos.forEach((video) => observer.observe(video));

    return () => {
      videos.forEach((video) => observer.unobserve(video));
    };
  }, [shorts]);

  if (loading) {
    return <div className={styles.loading}>Loading Shorts...</div>;
  }

  if (shorts.length === 0) {
    return <div className={styles.loading}>No shorts found.</div>;
  }

  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = e.currentTarget.querySelector('video');
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  };

  const handleMuteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    
    // Force update all video elements in the DOM
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      video.muted = nextMuted;
    });
  };

  return (
    <div className={styles.shortsContainer} ref={containerRef}>
      {shorts.map((short) => (
        <div key={short._id} className={styles.shortWrapper}>
          <div className={styles.videoContainer} onClick={handleVideoClick}>
            <video 
              src={short.url} 
              className={styles.videoPlayer}
              loop
              playsInline
              muted={isMuted}
              preload="metadata"
              poster={short.thumbnailUrl}
            />
            
            <div className={styles.overlay}>
              <button className={styles.volumeIndicator} onClick={handleMuteClick}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <div className={styles.metadata}>
                <div className={styles.creatorInfo}>
                  <div className={styles.avatar}>
                    {short.creator?.username?.charAt(0) || 'U'}
                  </div>
                  <span className={styles.username}>@{short.creator?.username}</span>
                  <button className={styles.subscribeBtn}>Subscribe</button>
                </div>
                <p className={styles.title}>{short.title}</p>
                <p className={styles.description}>{short.description}</p>
              </div>

              <div className={styles.actions}>
                <button className={styles.actionBtn}>
                  <div className={styles.iconWrapper}>
                    <ThumbsUp size={24} />
                  </div>
                  <span>{short.likes >= 1000 ? Math.floor(short.likes / 1000) + 'K' : short.likes}</span>
                </button>
                <button className={styles.actionBtn}>
                  <div className={styles.iconWrapper}>
                    <MessageSquare size={24} />
                  </div>
                  <span>Comment</span>
                </button>
                <button className={styles.actionBtn}>
                  <div className={styles.iconWrapper}>
                    <Share2 size={24} />
                  </div>
                  <span>Share</span>
                </button>
                <button className={styles.actionBtn}>
                  <div className={styles.iconWrapper}>
                    <MoreVertical size={24} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
