'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Upload as UploadIcon, FileVideo, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function StudioUpload() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  const [dragActive, setDragActive] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [videoId, setVideoId] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('video/')) {
      setVideoFile(file);
      // Auto-fill title from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    } else {
      alert('Please upload a valid video file.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!videoFile || !title) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('title', title);
      formData.append('description', description);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/videos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      setVideoId(data.videoId);
      setUploadSuccess(true);
      
    } catch (error) {
      console.error(error);
      alert('Error uploading video');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  if (uploadSuccess) {
    return (
      <div className={styles.uploadContainer}>
        <div className={styles.successMsg}>
          <h2>Upload Started Successfully!</h2>
          <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
            Your video is now processing in the background. It will appear on your channel once finished.
          </p>
          <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button 
              className={styles.btnPrimary} 
              onClick={() => {
                setUploadSuccess(false);
                setVideoFile(null);
                setTitle('');
                setDescription('');
              }}
            >
              Upload Another
            </button>
            <Link href={`/channel/${user.username}`} style={{ textDecoration: 'none' }}>
              <button className={styles.btnPrimary} style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>
                Go to Channel
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.uploadContainer}>
      <h1 className={styles.pageTitle}>Upload Video</h1>
      
      {!videoFile ? (
        <div 
          className={`${styles.uploadCard} ${dragActive ? styles.dragActive : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className={styles.uploadIcon}>
            <UploadIcon size={32} />
          </div>
          <h2 className={styles.uploadTitle}>Drag and drop video files to upload</h2>
          <p className={styles.uploadSubtitle}>Your videos will be private until you publish them.</p>
          <button className={styles.btnPrimary}>Select Files</button>
          <input 
            ref={inputRef}
            type="file" 
            accept="video/*" 
            className={styles.fileInput} 
            onChange={handleChange}
          />
        </div>
      ) : (
        <div className={styles.detailsForm}>
          <div className={styles.selectedFile}>
            <FileVideo size={32} className={styles.fileIcon} />
            <div className={styles.fileName}>{videoFile.name}</div>
            <div className={styles.fileSize}>{formatFileSize(videoFile.size)}</div>
            <button className={styles.removeBtn} onClick={() => setVideoFile(null)}>
              <X size={20} />
            </button>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Title (required)</label>
            <input 
              type="text" 
              className={styles.input} 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title that describes your video"
              maxLength={100}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea 
              className={styles.textarea} 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video"
              maxLength={5000}
            />
          </div>
          
          <div className={styles.actions}>
            <button 
              className={styles.btnPrimary} 
              onClick={handleUpload}
              disabled={isUploading || !title.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className={styles.spin} />
                  Uploading...
                </>
              ) : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
