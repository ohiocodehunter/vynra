'use client';

import React, { useState, useRef } from 'react';
import styles from './UploadModal.module.css';
import { UploadCloud, X, FileVideo } from 'lucide-react';
import api from '@/lib/api';

interface UploadModalProps {
  onClose: () => void;
}

export default function UploadModal({ onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setTitle(selectedFile.name.split('.')[0]); // Default title
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setStatusText('Uploading to server...');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', JSON.stringify(['vlog']));

    try {
      const res = await api.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      });
      
      // Upload finished, now processing in background
      if (res.status === 202) {
        setStatusText('Upload complete! Video is now processing...');
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setStatusText('Error uploading video.');
      setUploading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Upload Video</h2>
          <button className={styles.closeBtn} onClick={onClose} disabled={uploading}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {!file ? (
            <div 
              className={styles.dropZone}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={48} className={styles.uploadIcon} />
              <h3>Drag and drop video files to upload</h3>
              <p>Your videos will be private until you publish them.</p>
              <button className={styles.selectBtn}>Select Files</button>
              <input 
                type="file" 
                accept="video/*" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                style={{ display: 'none' }} 
              />
            </div>
          ) : (
            <div className={styles.formContainer}>
              <div className={styles.fileInfo}>
                <FileVideo size={24} />
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              
              <div className={styles.inputGroup}>
                <label>Title (required)</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  disabled={uploading}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={uploading}
                  rows={4}
                />
              </div>

              {uploading && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className={styles.progressText}>
                    <span>{statusText}</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={uploading}>Cancel</button>
          <button 
            className={styles.uploadBtn} 
            disabled={!file || uploading || !title}
            onClick={handleUpload}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
