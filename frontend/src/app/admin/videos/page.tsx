'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/lib/api';
import styles from '../users/page.module.css'; // Reusing table styles

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const fetchVideos = async () => {
    try {
      const data = await adminService.getVideos();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleStatusToggle = async (videoId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'private' ? 'public' : 'private';
    try {
      await adminService.updateVideo(videoId, { visibility: newStatus });
      fetchVideos();
    } catch (error) {
      alert('Error updating video');
    }
  };

  const handleDelete = async (videoId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this video?')) {
      try {
        await adminService.deleteVideo(videoId);
        fetchVideos();
      } catch (error) {
        alert('Error deleting video');
      }
    }
  };

  const filteredAndSortedVideos = videos
    .filter(video => {
      if (!searchQuery) return true;
      const lowerQuery = searchQuery.toLowerCase();
      const username = video.creator?.username?.toLowerCase() || '';
      const channel = video.creator?.channelName?.toLowerCase() || '';
      const title = video.title?.toLowerCase() || '';
      return username.includes(lowerQuery) || channel.includes(lowerQuery) || title.includes(lowerQuery);
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === 'mostViews') return b.views - a.views;
      if (sortOrder === 'leastViews') return a.views - b.views;
      return 0;
    });

  if (loading) return <div>Loading videos...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className={styles.pageTitle} style={{ marginBottom: 0 }}>Videos Manager</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Search username, channel or title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: '#fff', minWidth: '300px' }}
          />
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="mostViews">Most Views</option>
            <option value="leastViews">Least Views</option>
          </select>
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Video Details</th>
              <th>Channel</th>
              <th>Views</th>
              <th>Visibility</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedVideos.map(video => (
              <tr key={video._id}>
                <td>
                  <div className={styles.userCell}>
                    <img src={video.thumbnailUrl || '/video-placeholder.png'} alt="thumbnail" style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 4 }} />
                    <div>
                      <div className={styles.channelName} style={{ fontSize: '0.9rem' }}>
                        {video.title.length > 40 ? video.title.substring(0, 40) + '...' : video.title}
                      </div>
                      <div className={styles.username} style={{ fontSize: '0.75rem' }}>{new Date(video.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.channelName} style={{ fontSize: '0.85rem' }}>
                    {video.creator?.channelName}
                    {video.creator?.isVerified && <span className={styles.verifiedBadge} style={{ width: 12, height: 12, fontSize: '0.5rem' }}>✓</span>}
                  </div>
                  <div className={styles.username} style={{ fontSize: '0.75rem' }}>@{video.creator?.username}</div>
                </td>
                <td>{video.views}</td>
                <td>
                  <span className={video.visibility === 'public' ? styles.roleAdmin : styles.roleUser} style={{ background: video.visibility === 'public' ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 170, 0, 0.1)', color: video.visibility === 'public' ? '#00e676' : '#ffaa00' }}>
                    {video.visibility}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button 
                      onClick={() => handleStatusToggle(video._id, video.visibility)}
                      className={video.visibility === 'public' ? styles.btnWarning : styles.btnSuccess}
                    >
                      {video.visibility === 'public' ? 'Make Private' : 'Make Public'}
                    </button>
                    <button onClick={() => handleDelete(video._id)} className={styles.btnDanger}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
