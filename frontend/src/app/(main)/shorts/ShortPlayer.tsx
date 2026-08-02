'use client';

import React, { useState, useEffect } from 'react';
import { videoService, Video } from '@/lib/api';
import { ThumbsUp, MessageSquare, Share2, MoreVertical, Volume2, VolumeX, BookmarkPlus } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';
import CommentsSection from '@/components/video/CommentsSection';
import SaveToPlaylistModal from '@/components/video/SaveToPlaylistModal';

interface ShortPlayerProps {
  short: Video;
  isMuted: boolean;
  onMuteToggle: () => void;
}

export default function ShortPlayer({ short, isMuted, onMuteToggle }: ShortPlayerProps) {
  const [likes, setLikes] = useState(short.likes);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    // Check if user has liked this video
    const checkInteraction = async () => {
      try {
        const response = await videoService.getVideo(short._id);
        if (response.userInteraction) {
          setUserAction(response.userInteraction as 'like' | 'dislike');
        }
      } catch (error) {
        console.error('Failed to check interaction:', error);
      }
    };
    checkInteraction();
  }, [short._id]);

  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = e.currentTarget.querySelector('video');
    if (video) {
      if (video.paused) {
        video.play().catch(console.error);
      } else {
        video.pause();
      }
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const action = userAction === 'like' ? 'none' : 'like';
      await videoService.likeVideo(short._id, action);
      
      setUserAction(action === 'like' ? 'like' : null);
      if (action === 'like') {
        setLikes(prev => prev + 1);
      } else if (userAction === 'like') {
        setLikes(prev => prev - 1);
      }
    } catch (error) {
      console.error('Failed to like video:', error);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/watch/${short._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: short.title,
          url: url
        });
      } catch (err) {
        console.log('Share cancelled', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  // Sync React state to DOM video element property for unmute/mute robustly
  const videoRef = React.useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <div className={styles.shortWrapper}>
      <div className={styles.videoContainer} onClick={handleVideoClick}>
        <video 
          ref={videoRef}
          src={short.url} 
          className={styles.videoPlayer}
          loop
          playsInline
          muted={isMuted}
          preload="metadata"
          poster={short.thumbnailUrl}
          onPlay={(e) => {
            const token = localStorage.getItem('token');
            if (token) {
              fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/users/history/${short._id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              }).catch(console.error);
            }
          }}
        />
        
        <div className={styles.overlay}>
          <button className={styles.volumeIndicator} onClick={(e) => { e.stopPropagation(); onMuteToggle(); }}>
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <div className={styles.metadata}>
            <div className={styles.creatorInfo}>
              <Link href={`/channel/${short.creator?.username || 'ohiocodehunter'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                <div className={styles.avatar}>
                  {short.creator?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className={styles.username}>@{short.creator?.username || 'Upload by Dev'}</span>
              </Link>
              <button className={styles.subscribeBtn} onClick={(e) => e.stopPropagation()}>Subscribe</button>
            </div>
            <p className={styles.title}>{short.title}</p>
            <p className={styles.description}>{short.description}</p>
          </div>

          <div className={styles.actions}>
            <button className={`${styles.actionBtn} ${userAction === 'like' ? styles.activeAction : ''}`} onClick={handleLike}>
              <div className={styles.iconWrapper}>
                <ThumbsUp size={24} fill={userAction === 'like' ? 'currentColor' : 'none'} />
              </div>
              <span>{likes >= 1000 ? Math.floor(likes / 1000) + 'K' : likes}</span>
            </button>
            <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); setShowComments(true); }}>
              <div className={styles.iconWrapper}>
                <MessageSquare size={24} />
              </div>
              <span>Comment</span>
            </button>
            <button className={styles.actionBtn} onClick={handleShare}>
              <div className={styles.iconWrapper}>
                <Share2 size={24} />
              </div>
              <span>Share</span>
            </button>
            
            <div style={{position: 'relative'}}>
              <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }}>
                <div className={styles.iconWrapper}>
                  <MoreVertical size={24} />
                </div>
              </button>
              
              {showMoreMenu && (
                <div className={styles.moreMenu} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setShowSaveModal(true); setShowMoreMenu(false); }}>
                    <BookmarkPlus size={18} />
                    Save to Playlist
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {showComments && (
        <div className={styles.modalOverlay} onClick={() => setShowComments(false)}>
          <div className={styles.commentModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Comments</h3>
              <button className={styles.closeBtn} onClick={() => setShowComments(false)}>✕</button>
            </div>
            <div className={styles.commentContent}>
              <CommentsSection videoId={short._id} />
            </div>
          </div>
        </div>
      )}

      {/* Save to Playlist Modal */}
      {showSaveModal && (
        <SaveToPlaylistModal 
          videoId={short._id} 
          onClose={() => setShowSaveModal(false)} 
        />
      )}
    </div>
  );
}
