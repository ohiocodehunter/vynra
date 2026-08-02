'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { playlistService, userService, Playlist, Video } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import styles from './SaveToPlaylistModal.module.css';

interface SaveToPlaylistModalProps {
  videoId: string;
  onClose: () => void;
}

export default function SaveToPlaylistModal({ videoId, onClose }: SaveToPlaylistModalProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [inWatchLater, setInWatchLater] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPlaylists();
    }
  }, [user]);

  const fetchPlaylists = async () => {
    try {
      if (!user?.username) return;
      const [data, watchLaterData] = await Promise.all([
        playlistService.getUserPlaylists(user.username),
        userService.getWatchLaterList()
      ]);
      setPlaylists(data);
      // Check if video is in watch later list
      const isWatchLater = watchLaterData.some(v => v._id === videoId || (typeof v === 'string' && v === videoId));
      setInWatchLater(isWatchLater);
    } catch (error) {
      console.error('Failed to fetch playlists', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlaylist = async (playlist: Playlist) => {
    const hasVideo = playlist.videos?.some(v => v._id === videoId || (typeof v === 'string' && v === videoId));
    
    try {
      if (hasVideo) {
        await playlistService.removeVideoFromPlaylist(playlist._id, videoId);
      } else {
        await playlistService.addVideoToPlaylist(playlist._id, videoId);
      }
      fetchPlaylists(); // Refresh to get updated state
    } catch (error) {
      console.error('Failed to toggle playlist', error);
    }
  };

  const toggleWatchLater = async () => {
    try {
      await userService.toggleWatchLater(videoId);
      setInWatchLater(!inWatchLater);
    } catch (error) {
      console.error('Failed to toggle watch later', error);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    
    try {
      const newPlaylist = await playlistService.createPlaylist(newPlaylistName, isPublic);
      // Automatically add the video to the newly created playlist
      await playlistService.addVideoToPlaylist(newPlaylist._id, videoId);
      setNewPlaylistName('');
      setIsCreating(false);
      fetchPlaylists();
    } catch (error) {
      console.error('Failed to create playlist', error);
    }
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Save video to...</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>Loading playlists...</div>
          ) : (
            <ul className={styles.playlistList}>
              {/* Watch Later Row */}
              <li className={styles.playlistItem} onClick={toggleWatchLater}>
                <div className={`${styles.checkbox} ${inWatchLater ? styles.checked : ''}`}>
                  {inWatchLater && <Check size={14} />}
                </div>
                <span className={styles.playlistName}>Watch Later</span>
              </li>
              
              {playlists.map((playlist) => {
                const hasVideo = playlist.videos?.some(v => v._id === videoId || (typeof v === 'string' && v === videoId));
                return (
                  <li key={playlist._id} className={styles.playlistItem} onClick={() => togglePlaylist(playlist)}>
                    <div className={`${styles.checkbox} ${hasVideo ? styles.checked : ''}`}>
                      {hasVideo && <Check size={14} />}
                    </div>
                    <span className={styles.playlistName}>{playlist.name}</span>
                    {!playlist.isPublic && <span className={styles.privateTag}>Private</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={styles.footer}>
          {!isCreating ? (
            <button className={styles.createBtn} onClick={() => setIsCreating(true)}>
              <Plus size={20} /> Create new playlist
            </button>
          ) : (
            <form className={styles.createForm} onSubmit={handleCreatePlaylist}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input 
                  type="text" 
                  value={newPlaylistName} 
                  onChange={(e) => setNewPlaylistName(e.target.value)} 
                  placeholder="Enter playlist name..."
                  autoFocus
                  maxLength={150}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Privacy</label>
                <select value={isPublic ? 'public' : 'private'} onChange={(e) => setIsPublic(e.target.value === 'public')}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsCreating(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={!newPlaylistName.trim()}>Create</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
