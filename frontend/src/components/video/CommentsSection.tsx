'use client';

import React, { useState, useEffect } from 'react';
import { commentService, Comment } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import styles from './CommentsSection.module.css';

interface CommentsSectionProps {
  videoId: string;
}

export default function CommentsSection({ videoId }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const fetchComments = async () => {
    try {
      const data = await commentService.getComments(videoId);
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newCommentText.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      const newComment = await commentService.postComment(videoId, newCommentText);
      setComments([newComment, ...comments]);
      setNewCommentText('');
    } catch (error) {
      console.error('Failed to post comment', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.commentsSection}>
      <h3 className={styles.commentsTitle}>
        {comments.length} Comments
      </h3>
      
      {/* Add Comment Input */}
      <div className={styles.addComment}>
        <div 
          className={styles.userAvatar}
          style={{ backgroundImage: user?.avatarUrl ? `url(${user.avatarUrl})` : 'none', backgroundSize: 'cover' }}
        >
          {!user?.avatarUrl && (user?.username?.charAt(0) || 'U')}
        </div>
        <div className={styles.inputWrapper}>
          <input 
            type="text" 
            placeholder={user ? "Add a comment..." : "Please log in to comment..."}
            className={styles.commentInput}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            disabled={!user || isSubmitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePostComment();
            }}
          />
          {newCommentText.trim() && (
            <div className={styles.commentActions}>
              <button 
                className={styles.cancelBtn} 
                onClick={() => setNewCommentText('')}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className={styles.submitBtn} 
                onClick={handlePostComment}
                disabled={isSubmitting}
              >
                Comment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div className={styles.commentsList}>
        {isLoading ? (
          <p className={styles.loadingText}>Loading comments...</p>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment._id} className={styles.commentItem}>
              <div 
                className={styles.commentAvatar}
                style={{ backgroundImage: comment.author?.avatarUrl ? `url(${comment.author.avatarUrl})` : 'none', backgroundSize: 'cover' }}
              >
                {!comment.author?.avatarUrl && (comment.author?.username?.charAt(0) || 'U')}
              </div>
              <div className={styles.commentContent}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>@{comment.author?.username || 'user'}</span>
                  <span className={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.commentText}>{comment.text}</div>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.emptyText}>No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}
