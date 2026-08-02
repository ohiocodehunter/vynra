'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Download, BookmarkPlus } from 'lucide-react';
import { videoService, Video } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import styles from '@/app/(main)/watch/page.module.css';
import SaveToPlaylistModal from './SaveToPlaylistModal';

interface VideoActionsProps {
  initialVideo: Video;
}

export default function VideoActions({ initialVideo }: VideoActionsProps) {
  const [video, setVideo] = useState<Video>(initialVideo);
  const { user } = useAuth();
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const hasLiked = user && video.likedBy?.includes(user._id || user.id || '');
  const hasDisliked = user && video.dislikedBy?.includes(user._id || user.id || '');

  const handleLike = async () => {
    if (!user) return alert('Please login to like this video');
    if (isLikeLoading) return;
    
    setIsLikeLoading(true);
    try {
      const updatedVideo = await videoService.likeVideo(video._id);
      setVideo(updatedVideo);
    } catch (err) {
      console.error('Failed to like video', err);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!user) return alert('Please login to dislike this video');
    if (isLikeLoading) return;
    
    setIsLikeLoading(true);
    try {
      const updatedVideo = await videoService.dislikeVideo(video._id);
      setVideo(updatedVideo);
    } catch (err) {
      console.error('Failed to dislike video', err);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  return (
    <>
      <div className={styles.actionButtons}>
        <div className={styles.actionGroup}>
          <button 
            className={`${styles.actionBtn} ${hasLiked ? styles.activeAction : ''}`} 
            onClick={handleLike}
            disabled={isLikeLoading}
          >
            <ThumbsUp size={18} fill={hasLiked ? 'currentColor' : 'none'} style={{ transform: 'translate(-2px, -1px)' }} /> 
            <span>{video.likes || 0}</span>
          </button>
          <div className={styles.actionDivider}></div>
          <button 
            className={`${styles.actionBtn} ${hasDisliked ? styles.activeAction : ''}`}
            onClick={handleDislike}
            disabled={isLikeLoading}
          >
            <ThumbsDown size={18} fill={hasDisliked ? 'currentColor' : 'none'} />
          </button>
        </div>
        <button className={styles.actionBtn} onClick={handleShare}>
          <Share2 size={18} /> Share
        </button>
        <button className={styles.actionBtn}>
          <Download size={18} /> Download
        </button>
        <button className={styles.actionBtn} onClick={() => {
          if (!user) return alert('Please login to save to playlist');
          setIsSaveModalOpen(true);
        }}>
          <BookmarkPlus size={18} /> Save
        </button>
      </div>

      {isSaveModalOpen && (
        <SaveToPlaylistModal 
          videoId={video._id} 
          onClose={() => setIsSaveModalOpen(false)} 
        />
      )}
    </>
  );
}
