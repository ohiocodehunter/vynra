'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { MessageSquare, MoreVertical, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import { studioService } from '@/lib/api';
import Link from 'next/link';

export default function StudioComments() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await studioService.getStudioComments();
        setComments(data);
      } catch (error) {
        console.error('Failed to fetch studio comments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Channel Comments</h1>
      
      {loading ? (
        <div className={styles.loading}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.iconWrapper}>
            <MessageSquare size={48} color="var(--accent-primary)" />
          </div>
          <h2 className={styles.emptyTitle}>No comments yet</h2>
          <p className={styles.emptyDesc}>
            When viewers comment on your videos, they will appear here.
          </p>
        </div>
      ) : (
        <div className={styles.commentsList}>
          {comments.map((comment) => (
            <div key={comment._id} className={styles.commentCard}>
              <div className={styles.commentHeader}>
                <div className={styles.authorInfo}>
                  <div className={styles.avatar}>
                    {comment.author?.avatarUrl ? (
                      <img src={comment.author.avatarUrl} alt={comment.author.username} className={styles.avatarImg} />
                    ) : (
                      comment.author?.username?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className={styles.authorMeta}>
                    <span className={styles.authorName}>@{comment.author?.username || 'Unknown'}</span>
                    <span className={styles.commentDate}>{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
                <button className={styles.actionBtn}>
                  <MoreVertical size={18} />
                </button>
              </div>
              
              <p className={styles.commentText}>{comment.text}</p>
              
              <div className={styles.commentFooter}>
                <div className={styles.interactionBtns}>
                  <button className={styles.footerBtn}><ThumbsUp size={16} /> {comment.likes}</button>
                  <button className={styles.footerBtn}><ThumbsDown size={16} /> {comment.dislikes}</button>
                  <button className={styles.replyBtn}>Reply</button>
                </div>
                
                {comment.video && (
                  <Link href={`/watch/${comment.video._id}`} className={styles.videoRef}>
                    <div className={styles.videoThumbWrapper}>
                      {comment.video.thumbnailUrl ? (
                        <img src={comment.video.thumbnailUrl} alt="Video" className={styles.videoThumb} />
                      ) : (
                        <div className={styles.videoThumbPlaceholder}></div>
                      )}
                    </div>
                    <span className={styles.videoTitle}>{comment.video.title}</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
