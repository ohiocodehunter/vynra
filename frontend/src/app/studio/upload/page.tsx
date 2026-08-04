'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Upload as UploadIcon, FileVideo, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function StudioUpload() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  
  const [dragActive, setDragActive] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [videoId, setVideoId] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Polling for processing status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (uploadSuccess && processingStatus === 'processing' && videoId) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/videos/${videoId}?polling=true`);
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'published') {
              setProcessingStatus('published');
              clearInterval(intervalId);
            } else if (data.status === 'error' || data.status === 'private') {
              setProcessingStatus('error');
              clearInterval(intervalId);
            }
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    }
  }, [uploadSuccess, processingStatus, videoId]);

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

  const handleUpload = () => {
    if (!videoFile || !title) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('title', title);
    formData.append('description', description);
    
    const token = localStorage.getItem('token');
    
    // Use XMLHttpRequest for reliable upload progress
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/videos/upload`);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        setVideoId(data.videoId);
        setUploadSuccess(true);
        setProcessingStatus('processing');
      } else {
        console.error('Upload failed', xhr.responseText);
        alert('Error uploading video');
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      console.error('Upload failed (Network Error)');
      alert('Error uploading video');
    };

    xhr.send(formData);
  };

  if (!user) return null;

  if (uploadSuccess) {
    return (
      <div className={styles.uploadContainer}>
        <div className={styles.successMsg}>
          <h2>{processingStatus === 'published' ? 'Upload & Processing Complete!' : 'Video Uploaded! Processing in background...'}</h2>
          
          {processingStatus === 'processing' && (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Loader2 size={32} className={styles.spinner} />
              <p style={{ color: 'var(--text-secondary)' }}>
                We are compressing your video and generating thumbnails. Please wait...
              </p>
            </div>
          )}

          {processingStatus === 'error' && (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
              <X size={32} />
              <p>
                An error occurred during video processing. Please try uploading again.
              </p>
            </div>
          )}

          {processingStatus === 'published' && (
            <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
              Your video is now live! You can view it on your channel.
            </p>
          )}

          <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button 
              className={styles.btnPrimary} 
              onClick={() => {
                setUploadSuccess(false);
                setProcessingStatus('');
                setVideoFile(null);
                setTitle('');
                setDescription('');
                setUploadProgress(0);
              }}
            >
              Upload Another
            </button>
            <Link href={`/channel/${user.channelName || user.username}`} style={{ textDecoration: 'none' }}>
              <button className={styles.btnPrimary} style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>
                Go to Channel
              </button>
            </Link>
            {processingStatus === 'published' && videoId && (
              <Link href={`/watch?v=${videoId}`} style={{ textDecoration: 'none' }}>
                <button className={styles.btnPrimary} style={{ background: 'var(--accent-primary)', color: 'white' }}>
                  View Video
                </button>
              </Link>
            )}
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
            {isUploading ? (
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }}></div>
                </div>
              </div>
            ) : (
              <button 
                className={styles.btnPrimary} 
                onClick={handleUpload}
                disabled={!title.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                Upload
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
