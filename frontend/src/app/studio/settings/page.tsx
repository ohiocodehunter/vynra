'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import { Upload, Camera, ImageIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function StudioSettings() {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [channelName, setChannelName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
      return;
    }

    if (user) {
      setUsername(user.username || '');
      setChannelName(user.channelName || user.username || '');
      setBio(user.bio || '');
      setAvatarPreview(user.avatarUrl || '');
      setBannerPreview(user.bannerUrl || '');
    }
  }, [user, isAuthenticated, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('channelName', channelName);
      formData.append('bio', bio);
      if (avatarFile) formData.append('avatar', avatarFile);
      if (bannerFile) formData.append('banner', bannerFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${(typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'))}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      
      // Update local storage and context
      if (token) {
        login(updatedUser, token);
      }

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      
      // Reset files
      setAvatarFile(null);
      setBannerFile(null);
    } catch (error: any) {
      setMessage({ text: error.message || 'An error occurred', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div className={styles.settingsContainer}>
      <h1 className={styles.pageTitle}>Channel Customization</h1>

      {message.text && (
        <div className={message.type === 'success' ? styles.successMsg : styles.errorMsg}>
          {message.text}
        </div>
      )}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Profile Picture</h2>
        <div className={styles.imageUploadSection}>
          <div className={styles.avatarPreview}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Preview" className={styles.avatarImg} />
            ) : (
              <Camera size={32} color="var(--text-muted)" />
            )}
          </div>
          <div className={styles.uploadInfo}>
            <div className={styles.uploadTitle}>Your profile picture will appear where your channel is presented on Vynra.</div>
            <div className={styles.uploadDesc}>
              It's recommended to use a picture that's at least 98 x 98 pixels and 4MB or less. Use a PNG or GIF (no animations) file.
            </div>
            <div className={styles.fileInputWrapper}>
              <button type="button" className={styles.btnSecondary}>
                Choose File
              </button>
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/jpg" 
                className={styles.fileInput} 
                onChange={handleAvatarChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Banner Image</h2>
        <div className={styles.imageUploadSection}>
          <div style={{ flexGrow: 1 }}>
            <div className={styles.bannerPreview}>
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner Preview" className={styles.bannerImg} />
              ) : (
                <ImageIcon size={48} color="var(--text-muted)" />
              )}
            </div>
          </div>
          <div className={styles.uploadInfo} style={{ flexBasis: '40%' }}>
            <div className={styles.uploadTitle}>This image will appear across the top of your channel.</div>
            <div className={styles.uploadDesc}>
              For the best results on all devices, use an image that's at least 2048 x 1152 pixels and 6MB or less.
            </div>
            <div className={styles.fileInputWrapper}>
              <button type="button" className={styles.btnSecondary}>
                Choose File
              </button>
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/jpg" 
                className={styles.fileInput} 
                onChange={handleBannerChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Basic Info</h2>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Name</label>
          <input 
            type="text" 
            className={styles.input} 
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder="Channel Name"
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Choose a channel name that represents you and your content. Changes made to your name and picture are visible only on Vynra.
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Handle (Username)</label>
          <input 
            type="text" 
            className={styles.input} 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Choose your unique handle by adding letters and numbers. You can change your handle back within 14 days. Handes can be changed twice every 14 days.
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description</label>
          <textarea 
            className={styles.textarea} 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell viewers about your channel. Your description will appear in the About section of your channel and search results, among other places."
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.btnSecondary} 
          onClick={() => {
            setUsername(user.username || '');
            setBio(user.bio || '');
            setAvatarPreview(user.avatarUrl || '');
            setBannerPreview(user.bannerUrl || '');
            setAvatarFile(null);
            setBannerFile(null);
          }}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button 
          className={styles.btnPrimary} 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className={styles.spin} />
              Saving...
            </>
          ) : (
            'Publish Changes'
          )}
        </button>
      </div>
    </div>
  );
}
