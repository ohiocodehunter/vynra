'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './CreateChannelModal.module.css';

interface CreateChannelModalProps {
  onClose: () => void;
}

export default function CreateChannelModal({ onClose }: CreateChannelModalProps) {
  const [username, setUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { checkUsername } = useAuth();

  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsChecking(true);
      const available = await checkUsername(username);
      setIsAvailable(available);
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [username, checkUsername]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAvailable) {
      // Typically we'd update the user here. For now, just close.
      alert('Channel created successfully!');
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>
        
        <h2 className={styles.title}>Create your channel</h2>
        <p className={styles.subtitle}>Choose a unique username to start uploading videos.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <span className={styles.atSymbol}>@</span>
            <input 
              type="text" 
              placeholder="username" 
              className={styles.input}
              value={username}
              onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
              autoFocus
            />
            <div className={styles.statusIcon}>
              {isChecking && <Loader2 size={18} className={styles.spinner} />}
              {!isChecking && isAvailable === true && <CheckCircle size={18} className={styles.successIcon} />}
              {!isChecking && isAvailable === false && <XCircle size={18} className={styles.errorIcon} />}
            </div>
          </div>

          <div className={styles.hint}>
            {!isChecking && isAvailable === true && <span className={styles.successText}>This username is available!</span>}
            {!isChecking && isAvailable === false && <span className={styles.errorText}>Username is already taken.</span>}
            {username.length > 0 && username.length < 3 && <span className={styles.errorText}>Username must be at least 3 characters.</span>}
          </div>

          <button 
            type="submit" 
            className={styles.submitBtn} 
            disabled={!isAvailable || isChecking}
          >
            Create Channel
          </button>
        </form>
      </div>
    </div>
  );
}
