'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import { studioService, Video } from '@/lib/api';
import { Eye, Globe, Lock, EyeOff, Edit2, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function StudioContent() {
  const { isAuthenticated, user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);

  // Form states
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVisibility, setEditVisibility] = useState<'public' | 'private' | 'unlisted'>('public');

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await studioService.getCreatorVideos();
      setVideos(data);
    } catch (error) {
      console.error('Failed to fetch videos', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchVideos();
    }
  }, [isAuthenticated]);

  const handleEditClick = (video: Video) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDesc(video.description);
    setEditVisibility(video.visibility || 'public');
  };

  const handleSaveEdit = async () => {
    if (!editingVideo) return;
    try {
      await studioService.updateVideo(editingVideo._id, {
        title: editTitle,
        description: editDesc,
        visibility: editVisibility
      });
      setEditingVideo(null);
      fetchVideos();
    } catch (error) {
      console.error('Failed to update video', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVideo) return;
    try {
      await studioService.deleteVideo(deletingVideo._id);
      setDeletingVideo(null);
      fetchVideos();
    } catch (error) {
      console.error('Failed to delete video', error);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private': return <Lock size={16} />;
      case 'unlisted': return <EyeOff size={16} />;
      default: return <Globe size={16} />;
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading content...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Channel content</h1>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Video</th>
              <th>Visibility</th>
              <th>Date</th>
              <th>Views</th>
              <th>Likes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                  No videos found. Upload a video to get started!
                </td>
              </tr>
            ) : (
              videos.map(video => (
                <tr key={video._id}>
                  <td>
                    <div className={styles.videoCell}>
                      <div className={styles.thumbnailContainer}>
                        {video.thumbnailUrl && (
                          <img src={video.thumbnailUrl} alt={video.title} className={styles.thumbnail} />
                        )}
                        <div className={styles.duration}>
                          {Math.floor(video.duration / 60)}:{Math.floor(video.duration % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                      <div className={styles.videoInfo}>
                        <div className={styles.videoTitle}>{video.title}</div>
                        <div className={styles.videoDesc}>{video.description || 'No description'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.visibilityBadge}>
                      {getVisibilityIcon(video.visibility || 'public')}
                      <span style={{ textTransform: 'capitalize' }}>{video.visibility || 'Public'}</span>
                    </div>
                  </td>
                  <td>
                    {new Date(video.createdAt).toLocaleDateString()}
                  </td>
                  <td>{video.views}</td>
                  <td>{video.likes}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} onClick={() => handleEditClick(video)} title="Edit">
                        <Edit2 size={18} />
                      </button>
                      <Link href={`/watch?v=${video._id}`} target="_blank">
                        <button className={styles.actionBtn} title="View on Vynra">
                          <ExternalLink size={18} />
                        </button>
                      </Link>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => setDeletingVideo(video)} title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingVideo && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Edit Video Details</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Title (required)</label>
              <input 
                type="text" 
                className={styles.input} 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Description</label>
              <textarea 
                className={styles.textarea} 
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Visibility</label>
              <select 
                className={styles.select}
                value={editVisibility}
                onChange={(e) => setEditVisibility(e.target.value as any)}
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setEditingVideo(null)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSaveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVideo && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Delete Video</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Are you sure you want to delete <strong>{deletingVideo.title}</strong>? 
              <br/><br/>
              This action is permanent and cannot be undone.
            </p>
            
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setDeletingVideo(null)}>Cancel</button>
              <button className={styles.btnDanger} onClick={handleDeleteConfirm}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
