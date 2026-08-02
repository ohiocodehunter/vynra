'use client';

import React, { useState, useEffect } from 'react';
import { commentService, Comment } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import styles from './CommentsSection.module.css';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CommentsSectionProps {
  videoId: string;
}

export default function CommentsSection({ videoId }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // State to track which comments are expanded to show replies
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  
  // State to track which comment is currently being replied to
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

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

  const handlePostReply = async (parentId: string) => {
    if (!replyText.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      const newReply = await commentService.postComment(videoId, replyText, parentId);
      setComments([...comments, newReply]);
      setReplyText('');
      setReplyingTo(null);
      // Auto expand replies if not already
      setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
    } catch (error) {
      console.error('Failed to post reply', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Group comments
  const topLevelComments = comments.filter(c => !c.parentComment);
  const getReplies = (parentId: string) => comments.filter(c => c.parentComment === parentId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className={styles.commentsSection}>
      <h3 className={styles.commentsTitle}>
        {comments.length} Comments
      </h3>
      
      {/* Add Main Comment Input */}
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
        ) : topLevelComments.length > 0 ? (
          topLevelComments.map((comment) => {
            const replies = getReplies(comment._id);
            const isExpanded = !!expandedReplies[comment._id];
            
            return (
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
                  
                  {/* Action Row */}
                  <div className={styles.commentActionRow}>
                    <button 
                      className={styles.commentActionBtn} 
                      onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                    >
                      Reply
                    </button>
                  </div>
                  
                  {/* Reply Input */}
                  {replyingTo === comment._id && (
                    <div className={styles.replyInputWrapper}>
                      <input 
                        type="text" 
                        placeholder="Add a reply..."
                        className={styles.commentInput}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={!user || isSubmitting}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handlePostReply(comment._id);
                        }}
                      />
                      <div className={styles.commentActions} style={{ marginTop: '0.5rem' }}>
                        <button className={styles.cancelBtn} onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</button>
                        <button className={styles.submitBtn} onClick={() => handlePostReply(comment._id)} disabled={!replyText.trim() || isSubmitting}>Reply</button>
                      </div>
                    </div>
                  )}

                  {/* Toggle Replies Button */}
                  {replies.length > 0 && (
                    <button className={styles.replyToggleBtn} onClick={() => toggleReplies(comment._id)}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                    </button>
                  )}

                  {/* Replies Container (Animated Height) */}
                  <div className={`${styles.repliesContainer} ${isExpanded ? styles.expanded : ''}`}>
                    {replies.map(reply => (
                      <div key={reply._id} className={`${styles.commentItem} ${styles.replyItem}`}>
                        <div 
                          className={styles.commentAvatar}
                          style={{ backgroundImage: reply.author?.avatarUrl ? `url(${reply.author.avatarUrl})` : 'none', backgroundSize: 'cover', width: '32px', height: '32px' }}
                        >
                          {!reply.author?.avatarUrl && (reply.author?.username?.charAt(0) || 'U')}
                        </div>
                        <div className={styles.commentContent}>
                          <div className={styles.commentHeader}>
                            <span className={styles.commentAuthor}>@{reply.author?.username || 'user'}</span>
                            <span className={styles.commentDate}>
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className={styles.commentText}>{reply.text}</div>
                          {/* 1-Level deep means replies to replies still sit here flat, so we attach them to the parentComment */}
                          <div className={styles.commentActionRow}>
                            <button 
                              className={styles.commentActionBtn} 
                              onClick={() => {
                                setReplyingTo(comment._id); 
                                setReplyText(`@${reply.author.username} `);
                              }}
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            );
          })
        ) : (
          <p className={styles.emptyText}>No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}
