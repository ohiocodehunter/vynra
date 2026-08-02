'use client';

import React, { useState, useEffect } from 'react';
import { videoService, Video } from '@/lib/api';
import { ThumbsUp, MessageSquare, Share2, MoreVertical, BookmarkPlus } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';
import CommentsSection from '@/components/video/CommentsSection';
import SaveToPlaylistModal from '@/components/video/SaveToPlaylistModal';

interface ShortPlayerProps {
  short: Video;
}

export default function ShortPlayer({ short }: ShortPlayerProps) {
  const [likes, setLikes] = useState(short.likes);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    // Check if user has liked this video
    const checkInteraction = async () => {
      try {
        const response = await videoService.getVideoById(short._id) as any;
        if (response.userInteraction) {
          setUserAction(response.userInteraction as 'like' | 'dislike');
        }
      } catch (error) {
        console.error('Failed to check interaction:', error);
      }
    };
    checkInteraction();
  }, [short._id]);

  const handleVideoClick = (e: React.MouseEvent) => {
    // Prevent play/pause if clicking on buttons or interactive UI
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }

    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await videoService.likeVideo(short._id);
      
      const action = userAction === 'like' ? null : 'like';
      setUserAction(action);
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

  const videoRef = React.useRef<HTMLVideoElement>(null);

  return (
    <div className={styles.shortWrapper}>
      <div className={styles.videoContainer} onClick={handleVideoClick}>
        <video 
          ref={videoRef}
          src={short.url} 
          className={styles.videoPlayer}
          loop
          playsInline
          preload="metadata"
          poster={short.thumbnailUrl}
          onPlay={(e) => {
            const token = localStorage.getItem('token');
            if (token) {
              fetch(`${(typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'))}/users/history/${short._id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              }).catch(console.error);
            }
          }}
        />
        
        <div className={styles.overlay}>
          <div className={styles.metadata}>
            <div className={styles.creatorInfo}>
              <Link href={`/channel/${short.creator?.username || 'ohiocodehunter'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                <div className={styles.avatar}>
                  {short.creator?.avatarUrl ? (
                    <img src={short.creator.avatarUrl} alt={short.creator.username || 'Creator'} className={styles.avatarImg} />
                  ) : (
                    short.creator?.username?.charAt(0)?.toUpperCase() || 'U'
                  )}
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
                <ThumbsUp size={20} fill={userAction === 'like' ? 'currentColor' : 'none'} style={{ transform: 'translate(-2px, -2px)' }} />
              </div>
              <span>{likes >= 1000 ? Math.floor(likes / 1000) + 'K' : likes}</span>
            </button>
            <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); setShowComments(true); }}>
              <div className={styles.iconWrapper}>
                <MessageSquare size={20} />
              </div>
              <span>Comment</span>
            </button>
            <button className={styles.actionBtn} onClick={handleShare}>
              <div className={styles.iconWrapper}>
                <Share2 size={20} />
              </div>
              <span>Share</span>
            </button>
            
            <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }}>
                <div className={styles.iconWrapper}>
                  <MoreVertical size={20} />
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
